import { useQuery } from "@tanstack/react-query";
import { BarChart3, Droplets, Factory, PackageCheck, Zap } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/ui/chart-card";
import { KPIWidget } from "@/components/ui/kpi-widget";
import { LoadingState } from "@/components/ui/loading-state";
import { api } from "@/lib/api";

const COLORS = ["#177a68", "#d69a16", "#4f8aa8", "#8f5d46", "#6b7280"];

export function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["analytics"], queryFn: api.analytics });
  if (isLoading || !data) return <LoadingState />;

  const impactMix = [
    { name: "CO2e", value: data.total_co2 },
    { name: "Energy", value: data.total_energy },
    { name: "Water / 10", value: data.total_water / 10 },
  ];
  const measuredCoverage = data.product_count
    ? Math.round((data.measured_product_count / data.product_count) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Sustainability Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Portfolio-level environmental performance across your current product records.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KPIWidget label="Products" value={data.product_count.toLocaleString()} trend={`${data.measured_product_count} measured`} icon={<PackageCheck size={18} />} />
        <KPIWidget label="Total CO2e" value={`${data.total_co2.toLocaleString()} kg`} icon={<Factory size={18} />} />
        <KPIWidget label="Total energy" value={`${data.total_energy.toLocaleString()} kWh`} icon={<Zap size={18} />} />
        <KPIWidget label="Total water" value={`${data.total_water.toLocaleString()} L`} icon={<Droplets size={18} />} />
        <KPIWidget label="Avg. score" value={`${data.average_sustainability_score}/100`} trend={`${measuredCoverage}% measured`} icon={<BarChart3 size={18} />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Trend analysis">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Line dataKey="co2" name="CO2e kg" stroke="#177a68" strokeWidth={2} />
              <Line dataKey="energy" name="Energy kWh" stroke="#d69a16" strokeWidth={2} />
              <Line dataKey="water" name="Water L" stroke="#4f8aa8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Impact mix">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={impactMix} dataKey="value" nameKey="name" label>
                {impactMix.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Category carbon intensity">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.category_breakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="co2" name="CO2e kg" fill="#177a68" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sustainability score distribution">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.score_distribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="Products" fill="#d69a16" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <section className="rounded-lg border border-border bg-card p-4">
        <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold">Highest Impact Products</h2>
            <p className="text-sm text-muted-foreground">
              Current carbon hotspots based on the latest environmental record per product.
            </p>
          </div>
          <div className="rounded-md bg-muted px-3 py-1 text-sm font-medium">
            {data.measured_product_count}/{data.product_count} measured
          </div>
        </div>
        <div className="overflow-x-auto rounded-md border border-border">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[1.5fr_0.8fr_repeat(4,0.7fr)] bg-muted px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
              <span>Product</span>
              <span>Category</span>
              <span>CO2e</span>
              <span>Energy</span>
              <span>Water</span>
              <span>Score</span>
            </div>
            {data.hotspots.map((product) => (
              <div key={product.product_id} className="grid grid-cols-[1.5fr_0.8fr_repeat(4,0.7fr)] border-t border-border px-3 py-3 text-sm">
                <span className="truncate pr-3 font-medium">{product.name}</span>
                <span>{product.category}</span>
                <span>{product.co2} kg</span>
                <span>{product.energy} kWh</span>
                <span>{product.water} L</span>
                <span>{product.sustainability_score}/100</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
