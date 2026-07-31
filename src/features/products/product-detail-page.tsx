import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Calculator, CheckCircle2, Clock3, Download, FileJson, FileText, ImagePlus, Pencil, Plus, Printer, Send, Share2, Sparkles, Trash2 } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { KPIWidget } from "@/components/ui/kpi-widget";
import { LoadingState } from "@/components/ui/loading-state";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { buildEvidencePackPayload, buildPassportPayload, openEvidencePackPdf, openJsonViewer, openProductPassportPdf, printProductPassport } from "@/lib/exports";
import { permissionsFor } from "@/lib/permissions";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import {
  EnvironmentalRecordForm,
  EnvironmentalRecordFormValues,
} from "@/features/products/environmental-record-form";
import { ProductEditForm, ProductEditFormValues } from "@/features/products/product-edit-form";

export function ProductDetailPage() {
  const { productId = "" } = useParams();
  const [editOpen, setEditOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const addToast = useToastStore((state) => state.addToast);
  const permissions = permissionsFor(user);
  const { data, isLoading } = useQuery({ queryKey: ["product", productId], queryFn: () => api.product(productId) });
  const evidence = useQuery({
    queryKey: ["evidence", productId, "product-detail"],
    queryFn: () => api.evidenceDocuments({ productId, limit: 100 }),
    enabled: Boolean(productId),
  });
  const updateMutation = useMutation({
    mutationFn: (values: ProductEditFormValues) => api.updateProduct(productId, {
      name: values.name,
      category: values.category,
      description: values.description ?? "",
      manufacturer: values.manufacturer,
      country: values.country,
      production_method: values.production_method,
      product_code: values.product_code ?? "",
      declared_unit: values.declared_unit,
      functional_unit: values.functional_unit ?? "",
      lifecycle_scope: values.lifecycle_scope,
      reference_service_life_years: values.reference_service_life_years || null,
      manufacturing_site: values.manufacturing_site ?? "",
      plant_code: values.plant_code ?? "",
      product_standard: values.product_standard ?? "",
      pcr: values.pcr ?? "",
      geography: values.geography ?? values.country,
      data_quality: values.data_quality,
      material_components: values.primary_material
        ? [
            {
              material_name: values.primary_material,
              category: values.category,
              percentage: values.primary_material_pct ?? 100,
              recycled_content_pct: data?.material_components[0]?.recycled_content_pct ?? 0,
              bio_based_content_pct: data?.material_components[0]?.bio_based_content_pct ?? 0,
              supplier: values.primary_material_supplier ?? "",
              origin_country: values.primary_material_origin_country ?? values.country,
              evidence_reference: data?.material_components[0]?.evidence_reference ?? "",
              sort_order: 0,
            },
          ]
        : [],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setEditOpen(false);
    },
    meta: {
      successMessage: "Product updated",
      errorMessage: "Could not update product",
    },
  });
  const recordMutation = useMutation({
    mutationFn: (values: EnvironmentalRecordFormValues) => api.addEnvironmentalRecord(productId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setRecordOpen(false);
    },
    meta: {
      successMessage: "Environmental record added",
      errorMessage: "Could not add environmental record",
    },
  });
  const deleteMutation = useMutation({
    mutationFn: () => api.deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      navigate("/products");
    },
    meta: {
      successMessage: "Product deleted",
      errorMessage: "Could not delete product",
    },
  });
  const imageMutation = useMutation({
    mutationFn: (file: File) => api.uploadProductImage(productId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    meta: {
      successMessage: "Product image uploaded",
      errorMessage: "Could not upload product image",
    },
  });
  const shareMutation = useMutation({
    mutationFn: () => api.createPassportShare(productId),
    onSuccess: async (share) => {
      await navigator.clipboard.writeText(share.share_url);
      window.open(share.share_url, "_blank");
      addToast({ title: "Public passport link copied", variant: "success" });
    },
    meta: {
      errorMessage: "Could not create public passport link",
    },
  });
  const verificationMutation = useMutation({
    mutationFn: () =>
      api.createVerification({
        product_id: productId,
        verification_type: "internal_review",
        scope: "product_dpp",
        evidence_summary: buildVerificationEvidenceSummary(evidence.data?.items ?? []),
        requester_notes: "Submitted from the product evidence workspace for buyer-ready DPP and report use.",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verifications"] });
      navigate("/verification");
    },
    meta: {
      successMessage: "Verification request submitted",
      errorMessage: "Could not submit verification request",
    },
  });
  const onImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) imageMutation.mutate(file);
    event.target.value = "";
  };
  if (isLoading || !data) return <LoadingState />;
  const latest = data.environmental_records[0];
  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {data.image_url ? (
            <img className="aspect-[4/3] w-full object-cover" src={data.image_url} alt={data.name} />
          ) : (
            <div className="grid aspect-[4/3] place-items-center bg-muted text-sm text-muted-foreground">
              No product image
            </div>
          )}
          <div className="border-t border-border p-3">
            <input
              ref={imageInputRef}
              className="hidden"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={onImageChange}
            />
            <Button
              className="w-full"
              variant="secondary"
              disabled={imageMutation.isPending}
              onClick={() => imageInputRef.current?.click()}
            >
              <ImagePlus size={16} /> {data.image_url ? "Replace image" : "Upload image"}
            </Button>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h1 className="text-2xl font-semibold">{data.name}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{data.description || "No description supplied."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(true)}><Pencil size={16} /> Edit</Button>
            <Button variant="secondary" onClick={() => setRecordOpen(true)}><Plus size={16} /> Record</Button>
            <Button variant="secondary" onClick={() => navigate(`/lca?productId=${data.id}`)}><Calculator size={16} /> LCA</Button>
            <Button
              variant="secondary"
              onClick={() => {
                printProductPassport(data);
                addToast({ title: "Print preview opened", variant: "success" });
              }}
            >
              <Printer size={16} /> Print
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                openJsonViewer(`${data.name}-passport.json`, buildPassportPayload(data));
                addToast({ title: "JSON preview opened", variant: "success" });
              }}
            >
              <FileJson size={16} /> JSON
            </Button>
            {permissions.canSharePassports ? (
              <Button
                variant="secondary"
                disabled={shareMutation.isPending}
                onClick={() => shareMutation.mutate()}
              >
                <Share2 size={16} /> Share
              </Button>
            ) : null}
            <Button
              onClick={() => {
                openProductPassportPdf(data);
                addToast({ title: "PDF opened in a new tab", variant: "success" });
              }}
            >
              <Download size={16} /> PDF
            </Button>
            {permissions.canDeleteProducts ? (
              <Button variant="danger" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                <Trash2 size={16} /> Delete
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <KPIWidget label="CO2e" value={latest ? `${latest.co2_kg} kg` : "Missing"} />
        <KPIWidget label="Water" value={latest ? `${latest.water_liters} L` : "Missing"} />
        <KPIWidget label="Energy" value={latest ? `${latest.energy_kwh} kWh` : "Missing"} />
        <KPIWidget label="Score" value={latest ? `${latest.sustainability_score}/100` : "Missing"} icon={<Sparkles size={18} />} />
      </div>
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="font-semibold">Digital Product Passport Preview</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Category" value={data.category} />
          <Field label="Manufacturer" value={data.manufacturer} />
          <Field label="Country" value={data.country} />
          <Field label="Production method" value={data.production_method} />
          <Field label="Product code" value={data.product_code || "Not specified"} />
          <Field label="Declared unit" value={data.declared_unit} />
          <Field label="Lifecycle scope" value={data.lifecycle_scope} />
          <Field label="Manufacturing site" value={data.manufacturing_site || "Not specified"} />
          <Field label="Plant code" value={data.plant_code || "Not specified"} />
          <Field label="Product standard" value={data.product_standard || "Not specified"} />
          <Field label="PCR" value={data.pcr || "Not specified"} />
          <Field label="Data quality" value={data.data_quality} />
          <Field label="Material composition" value={JSON.stringify(data.material_composition)} />
          <Field
            label="Material components"
            value={data.material_components.length
              ? data.material_components.map((item) => `${item.material_name} ${item.percentage}%`).join(", ")
              : "Not specified"}
          />
          <Field label="Certifications" value={data.certifications.map((item) => String(item.name ?? "Certificate")).join(", ") || "None"} />
        </div>
      </section>
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div>
            <h2 className="font-semibold">Product Evidence</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Linked EPDs, certificates, supplier declarations, and test reports used for buyer-ready product claims.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={!evidence.data?.items.length}
              onClick={() => {
                openJsonViewer(`${data.name}-evidence-pack.json`, buildEvidencePackPayload(data, evidence.data?.items ?? []));
                addToast({ title: "Evidence pack JSON opened", variant: "success" });
              }}
            >
              <FileJson size={16} /> JSON
            </Button>
            <Button
              variant="secondary"
              disabled={!evidence.data?.items.length}
              onClick={() => {
                openEvidencePackPdf(data, evidence.data?.items ?? []);
                addToast({ title: "Evidence pack PDF opened", variant: "success" });
              }}
            >
              <Download size={16} /> PDF
            </Button>
            <Button
              variant="secondary"
              disabled={!evidence.data?.items.length || verificationMutation.isPending}
              onClick={() => verificationMutation.mutate()}
            >
              <Send size={16} /> Request verification
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/evidence?productId=${data.id}`)}>
              <Archive size={16} /> Open library
            </Button>
          </div>
        </div>
        {evidence.isLoading ? (
          <LoadingState label="Loading product evidence" />
        ) : evidence.data?.items.length ? (
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <EvidenceStat
                icon={<CheckCircle2 size={17} />}
                label="Approved"
                value={String(evidence.data.items.filter((item) => item.status === "approved").length)}
              />
              <EvidenceStat
                icon={<Clock3 size={17} />}
                label="Needs review"
                value={String(evidence.data.items.filter((item) => item.status === "needs_review").length)}
              />
              <EvidenceStat
                icon={<FileText size={17} />}
                label="Evidence files"
                value={String(evidence.data.total)}
              />
            </div>
            <div className="overflow-hidden rounded-md border border-border">
              {evidence.data.items.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  className="grid w-full gap-2 border-t border-border px-3 py-3 text-left first:border-t-0 hover:bg-muted md:grid-cols-[1.2fr_160px_130px]"
                  type="button"
                  onClick={() => navigate(`/evidence?productId=${data.id}`)}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{item.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {item.file_name}{item.storage_url ? " - Stored file" : item.source_url ? " - Source link" : ""}
                    </span>
                  </span>
                  <span className="text-sm text-muted-foreground">{formatEvidenceType(item.document_type)}</span>
                  <span className="text-sm capitalize text-muted-foreground">{item.status.replaceAll("_", " ")}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-md border border-dashed border-border bg-background p-5 text-sm text-muted-foreground">
            No evidence is linked to this product yet.
          </div>
        )}
      </section>
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="font-semibold">Environmental History</h2>
        <div className="mt-4 overflow-hidden rounded-md border border-border">
          <div className="grid grid-cols-6 bg-muted px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
            <span>Date</span>
            <span>CO2e</span>
            <span>Water</span>
            <span>Energy</span>
            <span>Recyclability</span>
            <span>Score</span>
          </div>
          {data.environmental_records.map((record) => (
            <div key={record.id} className="grid grid-cols-6 border-t border-border px-3 py-3 text-sm">
              <span>{new Date(record.recorded_at).toLocaleDateString()}</span>
              <span>{record.co2_kg} kg</span>
              <span>{record.water_liters} L</span>
              <span>{record.energy_kwh} kWh</span>
              <span>{record.recyclability_score}/100</span>
              <span>{record.sustainability_score}/100</span>
            </div>
          ))}
        </div>
      </section>
      <Modal open={editOpen} title="Edit product" onClose={() => setEditOpen(false)}>
        <ProductEditForm
          product={data}
          pending={updateMutation.isPending}
          onSubmit={(values) => updateMutation.mutate(values)}
        />
      </Modal>
      <Drawer open={recordOpen} title="Add environmental record" onClose={() => setRecordOpen(false)}>
        <EnvironmentalRecordForm
          pending={recordMutation.isPending}
          onSubmit={(values) => recordMutation.mutate(values)}
        />
      </Drawer>
    </div>
  );
}

function EvidenceStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold">{value}</div>
    </div>
  );
}

function formatEvidenceType(value: string) {
  return value.replaceAll("_", " ");
}

function buildVerificationEvidenceSummary(items: Array<{ title: string; document_type: string; status: string; file_hash: string }>) {
  const approved = items.filter((item) => item.status === "approved");
  const needsReview = items.filter((item) => item.status === "needs_review");
  const rejected = items.filter((item) => item.status === "rejected");
  const archived = items.filter((item) => item.status === "archived");
  const documentSummary = items
    .slice(0, 8)
    .map((item) => `${item.title} (${formatEvidenceType(item.document_type)}, ${item.status.replaceAll("_", " ")}, hash ${item.file_hash.slice(0, 12)})`)
    .join("; ");
  return [
    `Product evidence pack contains ${items.length} document(s): ${approved.length} approved, ${needsReview.length} needs review, ${rejected.length} rejected, ${archived.length} archived.`,
    documentSummary ? `Included evidence: ${documentSummary}.` : "No linked evidence details were available.",
  ].join(" ");
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
