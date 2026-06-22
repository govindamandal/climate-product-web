export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="grid min-h-48 place-items-center rounded-lg border border-border bg-card">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
