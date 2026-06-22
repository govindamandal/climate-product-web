import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useToastStore, type ToastVariant } from "@/stores/toast-store";
import { cn } from "@/lib/utils";

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
} satisfies Record<ToastVariant, typeof CheckCircle2>;

const styles = {
  success: "border-primary/30 bg-card text-foreground",
  error: "border-destructive/35 bg-card text-foreground",
  info: "border-border bg-card text-foreground",
} satisfies Record<ToastVariant, string>;

export function Toaster() {
  const { toasts, dismissToast } = useToastStore();

  return (
    <div className="fixed right-4 top-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3">
      {toasts.map((toast) => {
        const Icon = icons[toast.variant];

        return (
          <div
            key={toast.id}
            role={toast.variant === "error" ? "alert" : "status"}
            className={cn(
              "flex items-start gap-3 rounded-lg border p-4 shadow-lg shadow-black/10",
              styles[toast.variant],
            )}
          >
            <Icon
              className={cn(
                "mt-0.5 shrink-0",
                toast.variant === "error" ? "text-destructive" : "text-primary",
              )}
              size={18}
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{toast.title}</div>
              {toast.description ? (
                <div className="mt-1 text-sm text-muted-foreground">{toast.description}</div>
              ) : null}
            </div>
            <button
              type="button"
              className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
