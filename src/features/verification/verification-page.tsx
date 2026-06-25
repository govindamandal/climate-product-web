import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, CheckCircle2, Clock3, Send, XCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { Select } from "@/components/ui/select";
import { ProductSearchPicker } from "@/features/products/product-search-picker";
import { Product, ProductVerification, api } from "@/lib/api";
import { permissionsFor } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

export function VerificationPage() {
  const [status, setStatus] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [evidenceSummary, setEvidenceSummary] = useState("");
  const [requesterNotes, setRequesterNotes] = useState("");
  const [reviewerNotes, setReviewerNotes] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const permissions = permissionsFor(user);
  const verifications = useQuery({
    queryKey: ["verifications", status],
    queryFn: () => api.verifications({ status: status || undefined }),
  });
  const createMutation = useMutation({
    mutationFn: () =>
      api.createVerification({
        product_id: selectedProduct?.id ?? "",
        verification_type: "internal_review",
        scope: "product_dpp",
        evidence_summary: evidenceSummary,
        requester_notes: requesterNotes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verifications"] });
      setSelectedProduct(null);
      setEvidenceSummary("");
      setRequesterNotes("");
    },
    meta: {
      successMessage: "Verification request submitted",
      errorMessage: "Could not submit verification request",
    },
  });
  const reviewMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: "approved" | "rejected" }) =>
      api.reviewVerification(id, {
        status: nextStatus,
        reviewer_notes: reviewerNotes[id] ?? "",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verifications"] });
    },
    meta: {
      successMessage: "Verification review saved",
      errorMessage: "Could not save verification review",
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Verification Workflow</h1>
        <p className="text-sm text-muted-foreground">
          Submit product evidence for internal review before publishing DPPs or buyer-facing reports.
        </p>
      </div>

      <section className="grid gap-4 rounded-lg border border-border bg-card p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ProductSearchPicker selectedProduct={selectedProduct} onSelect={setSelectedProduct} />
        <div className="space-y-3">
          <div>
            <h2 className="font-semibold">Submit review request</h2>
            <p className="text-sm text-muted-foreground">Attach a concise summary of available evidence.</p>
          </div>
          <Input
            placeholder="Evidence summary"
            value={evidenceSummary}
            onChange={(event) => setEvidenceSummary(event.target.value)}
          />
          <Input
            placeholder="Requester notes"
            value={requesterNotes}
            onChange={(event) => setRequesterNotes(event.target.value)}
          />
          <Button
            className="w-full"
            disabled={!selectedProduct || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            <Send size={16} /> Submit verification
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold">Review queue</h2>
            <p className="text-sm text-muted-foreground">Track submitted, approved, and rejected product evidence.</p>
          </div>
          <Select className="md:w-56" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
        </div>

        {verifications.isLoading || verifications.isFetching ? (
          <LoadingState label="Loading verification requests" />
        ) : verifications.data?.items.length ? (
          <div className="grid gap-3">
            {verifications.data.items.map((item) => (
              <VerificationCard
                key={item.id}
                item={item}
                canReview={permissions.canReviewVerifications}
                pending={reviewMutation.isPending}
                reviewerNote={reviewerNotes[item.id] ?? ""}
                onReviewerNoteChange={(value) =>
                  setReviewerNotes((current) => ({ ...current, [item.id]: value }))
                }
                onReview={(nextStatus) => reviewMutation.mutate({ id: item.id, nextStatus })}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No verification requests found" />
        )}
      </section>
    </div>
  );
}

function VerificationCard({
  item,
  canReview,
  pending,
  reviewerNote,
  onReviewerNoteChange,
  onReview,
}: {
  item: ProductVerification;
  canReview: boolean;
  pending: boolean;
  reviewerNote: string;
  onReviewerNoteChange: (value: string) => void;
  onReview: (status: "approved" | "rejected") => void;
}) {
  const open = item.status === "submitted";
  return (
    <article className="rounded-md border border-border bg-background p-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{item.product_name}</h3>
            <span className={cn("rounded-full px-2 py-1 text-xs font-medium", statusClass(item.status))}>
              {statusIcon(item.status)} {item.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {item.product_category} · {item.scope.replace("_", " ")} · Submitted{" "}
            {new Date(item.submitted_at).toLocaleDateString()}
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Requested by {item.requested_by_email ?? "Unknown"}
        </div>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <EvidenceBlock label="Evidence summary" value={item.evidence_summary || "No summary supplied."} />
        <EvidenceBlock label="Requester notes" value={item.requester_notes || "No notes supplied."} />
      </div>
      {item.reviewer_notes ? (
        <div className="mt-3 rounded-md border border-border bg-card p-3 text-sm">
          <div className="text-xs uppercase text-muted-foreground">Reviewer notes</div>
          <p className="mt-1">{item.reviewer_notes}</p>
        </div>
      ) : null}
      {canReview && open ? (
        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
          <Input
            placeholder="Reviewer notes"
            value={reviewerNote}
            onChange={(event) => onReviewerNoteChange(event.target.value)}
          />
          <Button variant="secondary" disabled={pending} onClick={() => onReview("approved")}>
            <CheckCircle2 size={16} /> Approve
          </Button>
          <Button variant="danger" disabled={pending} onClick={() => onReview("rejected")}>
            <XCircle size={16} /> Reject
          </Button>
        </div>
      ) : null}
    </article>
  );
}

function EvidenceBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-3 text-sm">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <p className="mt-1">{value}</p>
    </div>
  );
}

function statusClass(status: string) {
  if (status === "approved") return "bg-primary/10 text-primary";
  if (status === "rejected") return "bg-destructive/10 text-destructive";
  return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200";
}

function statusIcon(status: string) {
  if (status === "approved") return <BadgeCheck className="inline" size={13} />;
  if (status === "rejected") return <XCircle className="inline" size={13} />;
  return <Clock3 className="inline" size={13} />;
}
