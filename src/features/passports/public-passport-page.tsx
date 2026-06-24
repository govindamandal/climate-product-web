import { Download, FileJson, Leaf, Printer } from "lucide-react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { KPIWidget } from "@/components/ui/kpi-widget";
import { LoadingState } from "@/components/ui/loading-state";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { openJsonViewer, openProductPassportPdf, printProductPassport } from "@/lib/exports";

export function PublicPassportPage() {
  const { token = "" } = useParams();
  const passport = useQuery({
    queryKey: ["public-passport", token],
    queryFn: () => api.publicPassport(token),
    enabled: Boolean(token),
    retry: false,
  });

  if (passport.isLoading) return <LoadingState label="Loading public passport" />;
  if (!passport.data) {
    return (
      <main className="grid min-h-screen place-items-center bg-background p-6">
        <EmptyState title="Passport link unavailable">
          This public passport link may have been revoked or does not exist.
        </EmptyState>
      </main>
    );
  }

  const product = passport.data.product;
  const latest = passport.data.latest_environmental_record;
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-4 py-5 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
              <Leaf size={20} />
            </div>
            <div>
              <div className="font-semibold">Digital Product Passport</div>
              <div className="text-sm text-muted-foreground">Public verification view</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => printProductPassport(product)}>
              <Printer size={16} /> Print
            </Button>
            <Button variant="secondary" onClick={() => openJsonViewer(`${product.name}-passport.json`, passport.data?.passport_json)}>
              <FileJson size={16} /> JSON
            </Button>
            <Button onClick={() => openProductPassportPdf(product)}>
              <Download size={16} /> PDF
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <section className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          {product.image_url ? (
            <img className="aspect-[4/3] w-full rounded-lg border border-border object-cover" src={product.image_url} alt={product.name} />
          ) : (
            <div className="grid aspect-[4/3] place-items-center rounded-lg border border-border bg-muted text-sm text-muted-foreground">
              No product image
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">{product.category} · {product.country}</p>
            <h1 className="mt-2 text-3xl font-semibold">{product.name}</h1>
            <p className="mt-3 max-w-3xl text-muted-foreground">{product.description || "Environmental product record"}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-4">
              <KPIWidget label="CO2e" value={latest ? `${latest.co2_kg} kg` : "Missing"} />
              <KPIWidget label="Water" value={latest ? `${latest.water_liters} L` : "Missing"} />
              <KPIWidget label="Energy" value={latest ? `${latest.energy_kwh} kWh` : "Missing"} />
              <KPIWidget label="Score" value={`${passport.data.sustainability_score}/100`} />
            </div>
          </div>
        </section>
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-semibold">Product Metadata</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Manufacturer" value={product.manufacturer} />
            <Field label="Production method" value={product.production_method} />
            <Field label="Material composition" value={JSON.stringify(product.material_composition)} />
            <Field label="Certifications" value={product.certifications.map((item) => String(item.name ?? "Certificate")).join(", ") || "None"} />
          </div>
        </section>
      </div>
    </main>
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
