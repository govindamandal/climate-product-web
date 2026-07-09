import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Cpu, ShieldCheck } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export function AIStatusCard() {
  const status = useQuery({
    queryKey: ["ai-status"],
    queryFn: api.aiStatus,
  });

  if (status.isLoading) {
    return (
      <section className="rounded-lg border border-border bg-card p-4">
        <LoadingState label="Checking AI provider" />
      </section>
    );
  }

  if (!status.data) return null;
  const liveProvider = status.data.active_provider !== "local";

  return (
    <section className="rounded-lg border border-border bg-card p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-medium">
          {status.data.ready ? (
            <CheckCircle2 className="text-primary" size={17} />
          ) : (
            <AlertTriangle className="text-destructive" size={17} />
          )}
          AI provider status
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge active={liveProvider} label={status.data.active_provider} />
          <Badge active={status.data.execution_mode === "provider"} label={status.data.execution_mode} />
          <Badge active label={status.data.model} />
        </div>
      </div>
      <p className="mt-2 text-muted-foreground">{status.data.message}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
          <Cpu size={13} /> configured: {status.data.configured_provider}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
          <ShieldCheck size={13} /> tenant AI: {status.data.ai_processing_allowed ? "allowed" : "disabled"}
        </span>
      </div>
    </section>
  );
}

function Badge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-1 text-xs font-medium",
        active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}
