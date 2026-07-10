import { useQuery } from "@tanstack/react-query";
import { Activity, CircleDollarSign, Layers, Zap } from "lucide-react";
import { ReactNode } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { api } from "@/lib/api";

export function AIUsageCard() {
  const usage = useQuery({
    queryKey: ["ai-usage"],
    queryFn: api.aiUsage,
  });

  if (usage.isLoading) {
    return (
      <section className="rounded-lg border border-border bg-card p-4">
        <LoadingState label="Loading AI usage" />
      </section>
    );
  }

  if (!usage.data) return null;

  const topProvider = topEntry(usage.data.provider_breakdown);
  const topModel = topEntry(usage.data.model_breakdown);

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 text-sm font-medium">
          <Activity className="text-primary" size={17} /> AI usage governance
        </div>
        <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
          {usage.data.succeeded_job_count} succeeded / {usage.data.failed_job_count} failed
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <UsageMetric icon={<Zap size={15} />} label="Jobs" value={usage.data.job_count.toString()} />
        <UsageMetric icon={<Layers size={15} />} label="Tokens" value={usage.data.total_tokens.toLocaleString()} />
        <UsageMetric
          icon={<CircleDollarSign size={15} />}
          label="Est. cost"
          value={`$${usage.data.estimated_cost_usd.toFixed(4)}`}
        />
        <UsageMetric icon={<Layers size={15} />} label="Primary model" value={topModel ?? "No usage"} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Provider mix: {topProvider ?? "No completed AI jobs yet"}. Cost is an estimate based on configured token rates.
      </p>
    </section>
  );
}

function UsageMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 truncate text-sm font-semibold" title={value}>
        {value}
      </div>
    </div>
  );
}

function topEntry(entries: Record<string, number>) {
  const [name, count] = Object.entries(entries).sort((a, b) => b[1] - a[1])[0] ?? [];
  return name ? `${name} (${count})` : null;
}
