import { ReactNode } from "react";

export function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-4 font-semibold">{title}</h3>
      <div className="h-72">{children}</div>
    </section>
  );
}
