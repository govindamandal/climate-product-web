import { FileSearch, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";

export function CertificatesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">AI Certificate Extraction</h1>
        <p className="text-sm text-muted-foreground">Upload EPD PDFs and sustainability certificates for structured extraction.</p>
      </div>
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <Input type="file" accept=".pdf" />
          <Button><Upload size={16} /> Upload certificate</Button>
        </div>
      </section>
      <EmptyState title="Extraction queue is empty">
        <FileSearch className="mx-auto mb-2" size={24} />
        Extracted values will appear here for manual correction and approval.
      </EmptyState>
    </div>
  );
}
