import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, FileJson, Printer, Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { api } from "@/lib/api";
import { buildPassportPayload, openJsonViewer, openProductPassportPdf, printProductPassport } from "@/lib/exports";
import { permissionsFor } from "@/lib/permissions";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";

export function PassportsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["products", "passports"], queryFn: () => api.products() });
  const [sharingProductId, setSharingProductId] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);
  const addToast = useToastStore((state) => state.addToast);
  const permissions = permissionsFor(user);
  const shareMutation = useMutation({
    mutationFn: (productId: string) => api.createPassportShare(productId),
    onSuccess: async (share) => {
      await navigator.clipboard.writeText(share.share_url);
      window.open(share.share_url, "_blank");
      addToast({ title: "Public passport link copied", variant: "success" });
      setSharingProductId(null);
    },
    onError: () => setSharingProductId(null),
    meta: {
      errorMessage: "Could not create public passport link",
    },
  });
  if (isLoading) return <LoadingState />;
  const products = data?.items ?? [];
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Digital Product Passports</h1>
        <p className="text-sm text-muted-foreground">Compliance-ready passport exports for product buyers and auditors.</p>
      </div>
      {products.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {products.map((product) => (
            <article key={product.id} className="rounded-lg border border-border bg-card p-5">
              {product.image_url ? (
                <img className="mb-4 aspect-[16/9] w-full rounded-md object-cover" src={product.image_url} alt={product.name} />
              ) : null}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">{product.name}</h2>
                  <p className="text-sm text-muted-foreground">{product.category} · {product.country}</p>
                </div>
                <div className="rounded-md bg-muted px-3 py-1 text-sm font-semibold">{product.environmental_records[0]?.sustainability_score ?? 0}/100</div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    printProductPassport(product);
                    addToast({ title: "Print preview opened", variant: "success" });
                  }}
                >
                  <Printer size={15} /> Print
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    openJsonViewer(`${product.name}-passport.json`, buildPassportPayload(product));
                    addToast({ title: "JSON preview opened", variant: "success" });
                  }}
                >
                  <FileJson size={15} /> JSON
                </Button>
                {permissions.canSharePassports ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={shareMutation.isPending && sharingProductId === product.id}
                    onClick={() => {
                      setSharingProductId(product.id);
                      shareMutation.mutate(product.id);
                    }}
                  >
                    <Share2 size={15} /> Share
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  onClick={() => {
                    openProductPassportPdf(product);
                    addToast({ title: "PDF opened in a new tab", variant: "success" });
                  }}
                >
                  <Download size={15} /> PDF
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No passports yet">Create products to generate Digital Product Passports.</EmptyState>
      )}
    </div>
  );
}
