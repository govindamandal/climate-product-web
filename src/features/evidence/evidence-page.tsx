import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, CheckCircle2, ExternalLink, FileCheck2, FileText, Search, Upload, XCircle } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { Select } from "@/components/ui/select";
import { ProductSearchPicker } from "@/features/products/product-search-picker";
import { EvidenceDocument, Product, api } from "@/lib/api";

const documentTypes = [
  { value: "epd", label: "EPD" },
  { value: "certificate", label: "Certificate" },
  { value: "test_report", label: "Test report" },
  { value: "supplier_declaration", label: "Supplier declaration" },
  { value: "invoice", label: "Invoice" },
  { value: "bis_standard", label: "BIS standard" },
  { value: "material_safety_data_sheet", label: "MSDS" },
  { value: "other", label: "Other" },
];

export function EvidencePage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const linkedProductId = searchParams.get("productId") ?? "";
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState("epd");
  const [issuer, setIssuer] = useState("");
  const [tags, setTags] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filterProduct, setFilterProduct] = useState<Product | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const linkedProduct = useQuery({
    queryKey: ["product", linkedProductId, "evidence-filter"],
    queryFn: () => api.product(linkedProductId),
    enabled: Boolean(linkedProductId),
  });

  useEffect(() => {
    if (linkedProduct.data) setFilterProduct(linkedProduct.data);
  }, [linkedProduct.data]);

  const evidence = useQuery({
    queryKey: ["evidence", filterProduct?.id, statusFilter, typeFilter, search],
    queryFn: () =>
      api.evidenceDocuments({
        productId: filterProduct?.id,
        status: statusFilter || undefined,
        documentType: typeFilter || undefined,
        search: search || undefined,
      }),
  });
  const uploadMutation = useMutation({
    mutationFn: () =>
      api.uploadEvidenceDocument({
        file: file as File,
        productId: selectedProduct?.id,
        title,
        documentType,
        issuer,
        sourceUrl,
        tags,
      }),
    onSuccess: () => {
      setFile(null);
      setTitle("");
      setIssuer("");
      setTags("");
      setSourceUrl("");
      setSelectedProduct(null);
      if (selectedProduct) {
        setFilterProduct(selectedProduct);
        setSearchParams({ productId: selectedProduct.id });
      }
      queryClient.invalidateQueries({ queryKey: ["evidence"] });
    },
    meta: {
      successMessage: "Evidence uploaded",
      errorMessage: "Could not upload evidence",
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<EvidenceDocument> }) =>
      api.updateEvidenceDocument(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["evidence"] }),
    meta: {
      successMessage: "Evidence updated",
      errorMessage: "Could not update evidence",
    },
  });
  const downloadMutation = useMutation({
    mutationFn: (id: string) => api.evidenceDownloadUrl(id),
    onSuccess: (download) => {
      window.open(download.url, "_blank", "noopener,noreferrer");
    },
    meta: {
      successMessage: "Evidence file access granted",
      errorMessage: "Could not open evidence file",
    },
  });

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    if (nextFile && !title) {
      setTitle(nextFile.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (file) uploadMutation.mutate();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Evidence Library</h1>
        <p className="text-sm text-muted-foreground">
          Upload and review product evidence for DPPs, compliance packs, verification, and buyer diligence.
        </p>
      </div>

      <form className="rounded-lg border border-border bg-card p-5" onSubmit={onSubmit}>
        <div className="grid gap-4 xl:grid-cols-[1fr_180px_1fr]">
          <label className="grid gap-2 text-sm font-medium">
            Evidence file
            <Input type="file" accept=".pdf,.txt,.csv,.doc,.docx,.jpg,.jpeg,.png,.webp" onChange={onFileChange} />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Document type
            <Select value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
              {documentTypes.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </Select>
          </label>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">Linked product</span>
              <Button className="h-7 px-2" type="button" variant="ghost" disabled={!selectedProduct} onClick={() => setSelectedProduct(null)}>
                Clear
              </Button>
            </div>
            <ProductSearchPicker selectedProduct={selectedProduct} onSelect={setSelectedProduct} />
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
          <Input placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <Input placeholder="Issuer or source" value={issuer} onChange={(event) => setIssuer(event.target.value)} />
          <Input placeholder="Source URL" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} />
          <Input placeholder="Tags" value={tags} onChange={(event) => setTags(event.target.value)} />
          <Button disabled={!file || uploadMutation.isPending}>
            <Upload size={16} /> Upload
          </Button>
        </div>
      </form>

      <section className="rounded-lg border border-border bg-card p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_260px_180px_180px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground" size={16} />
            <Input className="pl-9" placeholder="Search title, file, issuer, tags" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">Product filter</span>
              <Button
                className="h-7 px-2"
                type="button"
                variant="ghost"
                disabled={!filterProduct}
                onClick={() => {
                  setFilterProduct(null);
                  setSearchParams({});
                }}
              >
                Clear
              </Button>
            </div>
            <ProductSearchPicker
              selectedProduct={filterProduct}
              onSelect={(product) => {
                setFilterProduct(product);
                setSearchParams({ productId: product.id });
              }}
            />
          </div>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            <option value="needs_review">Needs review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="archived">Archived</option>
          </Select>
          <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="">All document types</option>
            {documentTypes.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </Select>
        </div>
      </section>

      {evidence.isLoading ? (
        <LoadingState label="Loading evidence" />
      ) : evidence.data?.items.length ? (
        <div className="grid gap-3">
          {evidence.data.items.map((item) => (
            <EvidenceCard
              key={item.id}
              item={item}
              pending={updateMutation.isPending}
              downloadPending={downloadMutation.isPending}
              onOpenFile={() => downloadMutation.mutate(item.id)}
              onUpdate={(values) => updateMutation.mutate({ id: item.id, values })}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No evidence found">
          <FileCheck2 className="mx-auto mb-2" size={24} />
          Upload EPDs, certificates, supplier declarations, and test reports to build a trusted evidence trail.
        </EmptyState>
      )}
    </div>
  );
}

function EvidenceCard({
  item,
  pending,
  downloadPending,
  onOpenFile,
  onUpdate,
}: {
  item: EvidenceDocument;
  pending: boolean;
  downloadPending: boolean;
  onOpenFile: () => void;
  onUpdate: (values: Partial<EvidenceDocument>) => void;
}) {
  const statusStyles: Record<EvidenceDocument["status"], string> = {
    needs_review: "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200",
    approved: "bg-primary/10 text-primary",
    rejected: "bg-destructive/10 text-destructive",
    archived: "bg-muted text-muted-foreground",
  };

  return (
    <article className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <FileText size={17} className="text-primary" />
            <h2 className="font-semibold">{item.title}</h2>
            <span className={`rounded-full px-2 py-1 text-xs ${statusStyles[item.status]}`}>{item.status.replaceAll("_", " ")}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {item.file_name} · {formatType(item.document_type)} · {formatBytes(item.file_size_bytes)}
          </p>
          <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
            <Info label="Issuer" value={item.issuer || "Not provided"} />
            <Info label="Hash" value={`${item.file_hash.slice(0, 16)}...`} />
            <Info label="Uploaded" value={new Date(item.created_at).toLocaleDateString()} />
          </div>
          {item.review_notes ? <p className="mt-3 text-sm text-muted-foreground">{item.review_notes}</p> : null}
          {item.tags ? <p className="mt-3 text-xs text-muted-foreground">Tags: {item.tags}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {item.storage_url || item.source_url ? (
            <Button
              variant="secondary"
              size="sm"
              disabled={downloadPending}
              onClick={onOpenFile}
            >
              <ExternalLink size={15} /> Open file
            </Button>
          ) : null}
          <Button
            variant="secondary"
            size="sm"
            disabled={pending || item.status === "approved"}
            onClick={() => onUpdate({ status: "approved", review_notes: "Approved for evidence library use." })}
          >
            <CheckCircle2 size={15} /> Approve
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={pending || item.status === "rejected"}
            onClick={() => onUpdate({ status: "rejected", review_notes: "Rejected during evidence review." })}
          >
            <XCircle size={15} /> Reject
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={pending || item.status === "archived"}
            onClick={() => onUpdate({ status: "archived" })}
          >
            <Archive size={15} /> Archive
          </Button>
        </div>
      </div>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-medium text-foreground">{label}</div>
      <div className="truncate" title={value}>{value}</div>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatType(value: string) {
  return value.replaceAll("_", " ");
}
