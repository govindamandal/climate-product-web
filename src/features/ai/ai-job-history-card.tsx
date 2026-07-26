import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock3, History, XCircle } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { AIJob, api } from "@/lib/api";
import { cn } from "@/lib/utils";

export function AIJobHistoryCard({ jobType }: { jobType?: "advisor" | "report" }) {
  const history = useQuery({
    queryKey: ["ai-jobs", jobType ?? "all"],
    queryFn: () => api.aiJobs({ limit: 6, job_type: jobType }),
  });

  if (history.isLoading) {
    return (
      <section className="rounded-lg border border-border bg-card p-4">
        <LoadingState label="Loading AI history" />
      </section>
    );
  }

  if (!history.data) return null;

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 text-sm font-medium">
          <History className="text-primary" size={17} /> Recent AI jobs
        </div>
        <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
          {history.data.total} total
        </span>
      </div>
      {history.data.items.length ? (
        <div className="divide-y divide-border">
          {history.data.items.map((job) => (
            <JobRow key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No AI jobs have been run yet.</p>
      )}
    </section>
  );
}

function JobRow({ job }: { job: AIJob }) {
  const isFailed = job.status === "failed";
  const isSucceeded = job.status === "succeeded";
  return (
    <div className="grid gap-2 py-3 text-sm md:grid-cols-[1fr_auto] md:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusIcon status={job.status} />
          <span className="font-medium capitalize">{job.job_type}</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs",
              isSucceeded && "bg-primary/10 text-primary",
              isFailed && "bg-destructive/10 text-destructive",
              !isSucceeded && !isFailed && "bg-muted text-muted-foreground",
            )}
          >
            {job.status}
          </span>
        </div>
        <div className="mt-1 truncate text-xs text-muted-foreground">
          {job.provider ?? "provider pending"} · {job.model ?? "model pending"} · {formatDate(job.created_at)}
        </div>
        {job.error_message ? (
          <div className="mt-1 truncate text-xs text-destructive" title={job.error_message}>
            {job.error_message}
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground md:justify-end">
        <span className="rounded-full bg-muted px-2 py-1">{(job.total_tokens ?? 0).toLocaleString()} tokens</span>
        <span className="rounded-full bg-muted px-2 py-1">${(job.estimated_cost_usd ?? 0).toFixed(4)}</span>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: AIJob["status"] }) {
  if (status === "succeeded") return <CheckCircle2 className="text-primary" size={15} />;
  if (status === "failed") return <XCircle className="text-destructive" size={15} />;
  return <Clock3 className="text-muted-foreground" size={15} />;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
