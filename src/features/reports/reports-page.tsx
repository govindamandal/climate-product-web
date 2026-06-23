import { useMutation, useQuery } from "@tanstack/react-query";
import { Clipboard, Download, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";
import { useToastStore } from "@/stores/toast-store";

export function ReportsPage() {
  const [productId, setProductId] = useState("");
  const products = useQuery({ queryKey: ["products", "reports"], queryFn: () => api.products({ pageSize: 50 }) });
  const addToast = useToastStore((state) => state.addToast);
  const report = useMutation({
    mutationFn: (id: string) => api.report(id),
    meta: {
      successMessage: "Executive report generated",
      errorMessage: "Could not generate report",
    },
  });
  const selectedProduct = useMemo(
    () => products.data?.items.find((product) => product.id === productId),
    [productId, products.data?.items],
  );
  const downloadReport = () => {
    if (!report.data || !selectedProduct) return;
    const blob = new Blob([report.data.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selectedProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-sustainability-report.md`;
    anchor.click();
    URL.revokeObjectURL(url);
    addToast({ title: "Report downloaded", variant: "success" });
  };
  const copyReport = async () => {
    if (!report.data) return;
    await navigator.clipboard.writeText(report.data.markdown);
    addToast({ title: "Report copied", variant: "success" });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">AI Report Generator</h1>
        <p className="text-sm text-muted-foreground">
          Generate executive sustainability summaries from product environmental records.
        </p>
      </div>

      <section className="rounded-lg border border-border bg-card p-5">
        {products.isLoading ? (
          <LoadingState label="Loading products" />
        ) : (
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <Select value={productId} onChange={(event) => setProductId(event.target.value)}>
              <option value="">Select product</option>
              {(products.data?.items ?? []).map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </Select>
            <Button disabled={!productId || report.isPending} onClick={() => report.mutate(productId)}>
              <FileText size={16} /> Generate report
            </Button>
          </div>
        )}
      </section>

      {report.isPending ? (
        <LoadingState label="Generating executive report" />
      ) : report.data ? (
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div>
              <h2 className="font-semibold">{selectedProduct?.name ?? "Sustainability Report"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{report.data.summary}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={copyReport}>
                <Clipboard size={16} /> Copy
              </Button>
              <Button onClick={downloadReport}>
                <Download size={16} /> Download
              </Button>
            </div>
          </div>
          <article className="whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-4 text-sm leading-6">
            {report.data.markdown}
          </article>
        </section>
      ) : (
        <EmptyState title="No report generated">
          Select a product to create an executive sustainability report.
        </EmptyState>
      )}
    </div>
  );
}
