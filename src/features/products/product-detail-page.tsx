import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileJson, ImagePlus, Pencil, Plus, Printer, Share2, Sparkles, Trash2 } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { KPIWidget } from "@/components/ui/kpi-widget";
import { LoadingState } from "@/components/ui/loading-state";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { buildPassportPayload, openJsonViewer, openProductPassportPdf, printProductPassport } from "@/lib/exports";
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
  const addToast = useToastStore((state) => state.addToast);
  const { data, isLoading } = useQuery({ queryKey: ["product", productId], queryFn: () => api.product(productId) });
  const updateMutation = useMutation({
    mutationFn: (values: ProductEditFormValues) => api.updateProduct(productId, values),
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
            <Button
              variant="secondary"
              disabled={shareMutation.isPending}
              onClick={() => shareMutation.mutate()}
            >
              <Share2 size={16} /> Share
            </Button>
            <Button
              onClick={() => {
                openProductPassportPdf(data);
                addToast({ title: "PDF opened in a new tab", variant: "success" });
              }}
            >
              <Download size={16} /> PDF
            </Button>
            <Button variant="danger" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              <Trash2 size={16} /> Delete
            </Button>
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
          <Field label="Material composition" value={JSON.stringify(data.material_composition)} />
          <Field label="Certifications" value={data.certifications.map((item) => String(item.name ?? "Certificate")).join(", ") || "None"} />
        </div>
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
