import { useMutation, useQuery } from "@tanstack/react-query";
import { Clipboard, ClipboardCheck, Download, FileJson } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Select } from "@/components/ui/select";
import { ProductSearchPicker } from "@/features/products/product-search-picker";
import { ComplianceReport, Product, api } from "@/lib/api";
import { openJsonViewer } from "@/lib/exports";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/stores/toast-store";

const sections = [
  { key: "product_identity", label: "Product identity" },
  { key: "environmental_metrics", label: "Environmental metrics" },
  { key: "materials", label: "Materials" },
  { key: "certifications", label: "Certifications" },
  { key: "dpp_readiness", label: "DPP readiness" },
];

const indiaSections = [
  { key: "india_product_identity", label: "India product identity" },
  { key: "india_environmental_disclosure", label: "Environmental disclosure" },
  { key: "india_material_traceability", label: "Material traceability" },
  { key: "india_certifications", label: "Certificates and standards" },
  { key: "india_verification", label: "Internal verification" },
  { key: "india_buyer_pack", label: "Buyer and tender pack" },
];

export function CompliancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const productId = searchParams.get("productId") ?? "";
  const [reportType, setReportType] = useState<"standard" | "india">("standard");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSections, setSelectedSections] = useState(sections.map((section) => section.key));
  const [reportResult, setReportResult] = useState<ComplianceReport | null>(null);
  const addToast = useToastStore((state) => state.addToast);
  const selectedProductQuery = useQuery({
    queryKey: ["products", productId],
    queryFn: () => api.product(productId),
    enabled: Boolean(productId),
  });
  const report = useMutation({
    mutationFn: () =>
      reportType === "india"
        ? api.indiaComplianceReport({ product_id: productId, sections: selectedSections })
        : api.complianceReport({ product_id: productId, sections: selectedSections }),
    onSuccess: (result) => {
      setReportResult(result);
      addToast({ title: "Compliance report generated", variant: "success" });
    },
    meta: {
      errorMessage: "Could not generate compliance report",
    },
  });

  useEffect(() => {
    if (selectedProductQuery.data) setSelectedProduct(selectedProductQuery.data);
  }, [selectedProductQuery.data]);

  const selectProduct = (product: Product) => {
    setSelectedProduct(product);
    setReportResult(null);
    setSearchParams({ productId: product.id });
  };
  const toggleSection = (key: string) => {
    setSelectedSections((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  };
  const activeSections = reportType === "india" ? indiaSections : sections;
  const changeReportType = (value: "standard" | "india") => {
    setReportType(value);
    setReportResult(null);
    setSelectedSections((value === "india" ? indiaSections : sections).map((section) => section.key));
  };
  const copyReport = async () => {
    if (!reportResult) return;
    await navigator.clipboard.writeText(reportResult.markdown);
    addToast({ title: "Compliance report copied", variant: "success" });
  };
  const downloadReport = () => {
    if (!reportResult) return;
    const blob = new Blob([reportResult.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${reportResult.product_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-compliance-report.md`;
    anchor.click();
    URL.revokeObjectURL(url);
    addToast({ title: "Compliance report downloaded", variant: "success" });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Compliance Report Builder</h1>
        <p className="text-sm text-muted-foreground">
          Generate evidence-based readiness reports for DPP, EPD, India buyer evidence, and sustainability review workflows.
        </p>
      </div>

      <section className="grid gap-4 rounded-lg border border-border bg-card p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        {selectedProductQuery.isLoading ? (
          <LoadingState label="Loading selected product" />
        ) : (
          <ProductSearchPicker selectedProduct={selectedProduct} onSelect={selectProduct} />
        )}
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold">Report sections</h2>
            <p className="text-sm text-muted-foreground">Choose the evidence areas to include.</p>
          </div>
          <Select
            value={reportType}
            onChange={(event) => changeReportType(event.target.value as "standard" | "india")}
          >
            <option value="standard">General DPP readiness</option>
            <option value="india">India compliance readiness</option>
          </Select>
          <div className="grid gap-2">
            {activeSections.map((section) => {
              const active = selectedSections.includes(section.key);
              return (
                <label
                  key={section.key}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm",
                    active ? "border-primary bg-primary/10" : "border-border",
                  )}
                >
                  <input
                    className="h-4 w-4 accent-primary"
                    checked={active}
                    type="checkbox"
                    onChange={() => toggleSection(section.key)}
                  />
                  {section.label}
                </label>
              );
            })}
          </div>
          <Button
            className="w-full"
            disabled={!productId || !selectedSections.length || report.isPending}
            onClick={() => report.mutate()}
          >
            <ClipboardCheck size={16} /> Generate {reportType === "india" ? "India readiness" : "compliance"} report
          </Button>
        </div>
      </section>

      {report.isPending ? (
        <LoadingState label="Building compliance report" />
      ) : reportResult ? (
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div>
              <div className="text-sm text-muted-foreground">Readiness score</div>
              <h2 className="text-3xl font-semibold">{reportResult.readiness_score}/100</h2>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{reportResult.summary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={copyReport}>
                <Clipboard size={16} /> Copy
              </Button>
              <Button variant="secondary" onClick={() => openJsonViewer(`${reportResult.product_name}-compliance.json`, reportResult.report_json)}>
                <FileJson size={16} /> JSON
              </Button>
              <Button onClick={downloadReport}>
                <Download size={16} /> Download
              </Button>
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {reportResult.checks.map((check) => (
              <article key={check.key} className="rounded-md border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{check.label}</h3>
                  <span className={cn("rounded-full px-2 py-1 text-xs font-medium", statusClass(check.status))}>
                    {check.status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{check.evidence}</p>
                <p className="mt-3 text-sm font-medium">{check.recommendation}</p>
              </article>
            ))}
          </div>
          <article className="mt-5 whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-4 text-sm leading-6">
            {reportResult.markdown}
          </article>
        </section>
      ) : (
        <EmptyState title="No compliance report generated">
          Select a product and choose evidence sections to build a compliance report.
        </EmptyState>
      )}
    </div>
  );
}

function statusClass(status: string) {
  if (status === "ready") return "bg-primary/10 text-primary";
  if (status === "missing") return "bg-destructive/10 text-destructive";
  return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200";
}
