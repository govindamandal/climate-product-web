import { useQuery } from "@tanstack/react-query";
import { Award, Droplets, Factory, Scale, Zap } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/ui/empty-state";
import { KPIWidget } from "@/components/ui/kpi-widget";
import { LoadingState } from "@/components/ui/loading-state";
import { api, Product } from "@/lib/api";
import { useState } from "react";

type MetricKey = "co2_kg" | "water_liters" | "energy_kwh" | "sustainability_score";

const metrics: Array<{ key: MetricKey; label: string; unit: string; lowerIsBetter: boolean }> = [
  { key: "co2_kg", label: "Carbon footprint", unit: "kg CO2e", lowerIsBetter: true },
  { key: "water_liters", label: "Water usage", unit: "L", lowerIsBetter: true },
  { key: "energy_kwh", label: "Energy usage", unit: "kWh", lowerIsBetter: true },
  { key: "sustainability_score", label: "Sustainability score", unit: "/100", lowerIsBetter: false },
];

export function BenchmarkingPage() {
  const { data, isLoading } = useQuery({ queryKey: ["products", "benchmarking"], queryFn: () => api.products({ pageSize: 50 }) });
  const measuredProducts = (data?.items ?? []).filter((product) => product.environmental_records.length);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (isLoading) return <LoadingState label="Loading benchmarking data" />;

  const defaultSelection = measuredProducts.slice(0, 3).map((product) => product.id);
  const effectiveSelection = selectedIds.length ? selectedIds : defaultSelection;
  const selectedProducts = measuredProducts.filter((product) => effectiveSelection.includes(product.id));
  const bestCarbon = bestBy(selectedProducts, "co2_kg", true);
  const bestWater = bestBy(selectedProducts, "water_liters", true);
  const bestEnergy = bestBy(selectedProducts, "energy_kwh", true);
  const bestScore = bestBy(selectedProducts, "sustainability_score", false);
  const chartData = selectedProducts.map((product) => {
    const record = product.environmental_records[0];
    return {
      name: product.name,
      co2: record.co2_kg,
      water: record.water_liters,
      energy: record.energy_kwh,
      score: record.sustainability_score,
    };
  });

  const toggleProduct = (productId: string) => {
    setSelectedIds((current) => {
      const active = current.length ? current : defaultSelection;
      if (active.includes(productId)) {
        return active.filter((id) => id !== productId);
      }
      return active.length >= 4 ? [...active.slice(1), productId] : [...active, productId];
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Product Benchmarking</h1>
        <p className="text-sm text-muted-foreground">
          Compare measured products across carbon, water, energy, and sustainability performance.
        </p>
      </div>

      {measuredProducts.length < 2 ? (
        <EmptyState title="Not enough measured products">
          Add environmental records to at least two products to start benchmarking.
        </EmptyState>
      ) : (
        <>
          <section className="rounded-lg border border-border bg-card p-4">
            <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-center">
              <div>
                <h2 className="font-semibold">Comparison Set</h2>
                <p className="text-sm text-muted-foreground">Select up to four products for a side-by-side benchmark.</p>
              </div>
              <span className="text-sm text-muted-foreground">{selectedProducts.length}/4 selected</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {measuredProducts.map((product) => {
                const checked = effectiveSelection.includes(product.id);
                return (
                  <label
                    key={product.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition ${
                      checked ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
                    }`}
                  >
                    <input
                      className="h-4 w-4 accent-primary"
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleProduct(product.id)}
                    />
                    {product.image_url ? (
                      <img className="h-10 w-10 rounded-md object-cover" src={product.image_url} alt="" />
                    ) : (
                      <span className="h-10 w-10 shrink-0 rounded-md bg-muted" aria-hidden="true" />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{product.name}</span>
                      <span className="block text-xs text-muted-foreground">{product.category}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KPIWidget label="Lowest CO2e" value={formatWinner(bestCarbon, "co2_kg", "kg")} icon={<Factory size={18} />} />
            <KPIWidget label="Lowest water" value={formatWinner(bestWater, "water_liters", "L")} icon={<Droplets size={18} />} />
            <KPIWidget label="Lowest energy" value={formatWinner(bestEnergy, "energy_kwh", "kWh")} icon={<Zap size={18} />} />
            <KPIWidget label="Best score" value={formatWinner(bestScore, "sustainability_score", "/100")} icon={<Award size={18} />} />
          </div>

          <section className="rounded-lg border border-border bg-card p-4">
            <div className="mb-4 flex items-center gap-2">
              <Scale size={18} />
              <h2 className="font-semibold">Metric Comparison</h2>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="co2" name="CO2e kg" fill="#177a68" />
                  <Bar dataKey="energy" name="Energy kWh" fill="#d69a16" />
                  <Bar dataKey="water" name="Water L" fill="#4f8aa8" />
                  <Bar dataKey="score" name="Score" fill="#8f5d46" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="overflow-x-auto rounded-lg border border-border bg-card">
            <div className="min-w-[860px]">
              <div className="grid grid-cols-[1.6fr_repeat(4,1fr)] gap-x-4 bg-muted px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
                <span>Product</span>
                {metrics.map((metric) => (
                  <span key={metric.key}>{metric.label}</span>
                ))}
              </div>
              {selectedProducts.map((product) => (
                <div key={product.id} className="grid grid-cols-[1.6fr_repeat(4,1fr)] items-center gap-x-4 border-t border-border px-4 py-3 text-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    {product.image_url ? (
                      <img className="h-10 w-10 shrink-0 rounded-md object-cover" src={product.image_url} alt="" />
                    ) : (
                      <span className="h-10 w-10 shrink-0 rounded-md bg-muted" aria-hidden="true" />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{product.name}</span>
                      <span className="block text-xs text-muted-foreground">{product.category}</span>
                    </span>
                  </div>
                  {metrics.map((metric) => (
                    <MetricCell key={metric.key} product={product} metric={metric.key} selectedProducts={selectedProducts} />
                  ))}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function MetricCell({
  product,
  metric,
  selectedProducts,
}: {
  product: Product;
  metric: MetricKey;
  selectedProducts: Product[];
}) {
  const value = product.environmental_records[0][metric];
  const definition = metrics.find((item) => item.key === metric)!;
  const best = bestBy(selectedProducts, metric, definition.lowerIsBetter);
  const isBest = best?.id === product.id;
  return (
    <span className={isBest ? "font-semibold text-primary" : undefined}>
      {value.toLocaleString()} {definition.unit}
    </span>
  );
}

function bestBy(products: Product[], metric: MetricKey, lowerIsBetter: boolean) {
  return products.reduce<Product | null>((best, product) => {
    if (!best) return product;
    const value = product.environmental_records[0][metric];
    const bestValue = best.environmental_records[0][metric];
    return lowerIsBetter ? (value < bestValue ? product : best) : (value > bestValue ? product : best);
  }, null);
}

function formatWinner(product: Product | null, metric: MetricKey, unit: string) {
  if (!product) return "No data";
  return `${product.environmental_records[0][metric].toLocaleString()} ${unit}`;
}
