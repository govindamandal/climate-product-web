import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, FileSearch, Upload, X } from "lucide-react";
import { ChangeEvent, FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { ProductSearchPicker } from "@/features/products/product-search-picker";
import { api, CertificateExtraction, Product } from "@/lib/api";

export function CertificatesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const queryClient = useQueryClient();
  const certificates = useQuery({ queryKey: ["certificates"], queryFn: api.certificates });
  const extractMutation = useMutation({
    mutationFn: () => api.extractCertificate({ file: file as File, productId: selectedProduct?.id }),
    onSuccess: () => {
      setFile(null);
      setSelectedProduct(null);
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
    },
    meta: {
      successMessage: "Certificate extracted",
      errorMessage: "Could not extract certificate",
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<CertificateExtraction> }) =>
      api.updateCertificate(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["certificates"] }),
    meta: {
      successMessage: "Certificate updated",
      errorMessage: "Could not update certificate",
    },
  });
  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
  };
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (file) extractMutation.mutate();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">AI Certificate Extraction</h1>
        <p className="text-sm text-muted-foreground">Upload EPD PDFs and sustainability certificates for structured extraction.</p>
      </div>
      <form className="rounded-lg border border-border bg-card p-5" onSubmit={onSubmit}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)_auto] lg:items-start">
          <label className="grid gap-2 text-sm font-medium">
            Certificate file
            <Input type="file" accept=".pdf,.txt" onChange={onFileChange} />
          </label>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">Linked product</span>
              <Button
                className="h-7 px-2"
                disabled={!selectedProduct}
                type="button"
                variant="ghost"
                onClick={() => setSelectedProduct(null)}
              >
                Clear
              </Button>
            </div>
            <ProductSearchPicker selectedProduct={selectedProduct} onSelect={setSelectedProduct} />
          </div>
          <Button className="lg:mt-7" disabled={!file || extractMutation.isPending}>
            <Upload size={16} /> Extract certificate
          </Button>
        </div>
      </form>
      {certificates.isLoading ? (
        <LoadingState label="Loading certificates" />
      ) : certificates.data?.items.length ? (
        <div className="grid gap-4">
          {certificates.data.items.map((item) => (
            <CertificateReviewCard
              key={item.id}
              certificate={item}
              pending={updateMutation.isPending}
              onSave={(values) => updateMutation.mutate({ id: item.id, values })}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="Extraction queue is empty">
          <FileSearch className="mx-auto mb-2" size={24} />
          Extracted values will appear here for manual correction and approval.
        </EmptyState>
      )}
    </div>
  );
}

function CertificateReviewCard({
  certificate,
  pending,
  onSave,
}: {
  certificate: CertificateExtraction;
  pending: boolean;
  onSave: (values: Partial<CertificateExtraction>) => void;
}) {
  const [certificationName, setCertificationName] = useState(certificate.certification_name ?? "");
  const [expiryDate, setExpiryDate] = useState(certificate.expiry_date ?? "");
  const [emissionValue, setEmissionValue] = useState(
    certificate.emission_value === null ? "" : String(certificate.emission_value),
  );
  const [complianceInformation, setComplianceInformation] = useState(certificate.compliance_information ?? "");
  const statusStyles: Record<CertificateExtraction["status"], string> = {
    needs_review: "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200",
    approved: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200",
    rejected: "border-destructive/40 bg-destructive/10 text-destructive",
  };
  const correctedValues = {
    certification_name: certificationName,
    expiry_date: expiryDate || null,
    emission_value: emissionValue ? Number(emissionValue) : null,
    compliance_information: complianceInformation,
  };

  return (
    <article className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">{certificate.file_name}</h2>
            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusStyles[certificate.status]}`}>
              {certificate.status.replace("_", " ")}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <CertificateProductLabel productId={certificate.product_id} /> · Uploaded {new Date(certificate.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={pending} onClick={() => onSave({ ...correctedValues, status: "approved" })}>
            <Check size={16} /> Approve
          </Button>
          <Button variant="danger" disabled={pending} onClick={() => onSave({ status: "rejected" })}>
            <X size={16} /> Reject
          </Button>
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium">
          Certification name
          <Input value={certificationName} onChange={(event) => setCertificationName(event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Expiry date
          <Input type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Emission value
          <Input type="number" min="0" step="0.01" value={emissionValue} onChange={(event) => setEmissionValue(event.target.value)} />
        </label>
      </div>
      <label className="mt-4 grid gap-1 text-sm font-medium">
        Compliance information
        <textarea
          className="min-h-24 rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
          value={complianceInformation}
          onChange={(event) => setComplianceInformation(event.target.value)}
        />
      </label>
      <div className="mt-4 flex justify-end">
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => onSave({ ...correctedValues, status: certificate.status })}
        >
          Save corrections
        </Button>
      </div>
    </article>
  );
}

function CertificateProductLabel({ productId }: { productId: string | null }) {
  const product = useQuery({
    queryKey: ["products", productId],
    queryFn: () => api.product(productId as string),
    enabled: Boolean(productId),
  });

  if (!productId) return <>Not linked to a product</>;
  if (product.isLoading) return <>Loading linked product</>;
  return <>Linked to {product.data?.name ?? "unknown product"}</>;
}
