import { useMutation, useQuery } from "@tanstack/react-query";
import { Brain, Lightbulb } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";

export function AdvisorPage() {
  const [productId, setProductId] = useState("");
  const products = useQuery({ queryKey: ["products", "advisor"], queryFn: () => api.products() });
  const advisor = useMutation({
    mutationFn: (id: string) => api.advisor(id),
    meta: {
      successMessage: "Sustainability analysis generated",
      errorMessage: "Could not generate sustainability analysis",
    },
  });
  const items = products.data?.items ?? [];
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">AI Sustainability Advisor</h1>
        <p className="text-sm text-muted-foreground">Product-specific recommendations, not a chatbot.</p>
      </div>
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-col gap-3 md:flex-row">
          <Select value={productId} onChange={(event) => setProductId(event.target.value)}>
            <option value="">Select product</option>
            {items.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
          </Select>
          <Button disabled={!productId || advisor.isPending} onClick={() => advisor.mutate(productId)}>
            <Brain size={16} /> Analyze product
          </Button>
        </div>
      </section>
      {advisor.data?.recommendations.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {advisor.data.recommendations.map((rec) => (
            <article key={rec.title} className="rounded-lg border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-2 text-primary"><Lightbulb size={18} /><span className="text-sm font-semibold">{rec.impact} impact</span></div>
              <h2 className="font-semibold">{rec.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{rec.rationale}</p>
              <p className="mt-4 text-sm font-medium">{rec.next_step}</p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No analysis selected">Choose a product to generate recommendations.</EmptyState>
      )}
    </div>
  );
}
