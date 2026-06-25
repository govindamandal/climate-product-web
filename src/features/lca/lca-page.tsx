import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calculator, FileJson, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { Select } from "@/components/ui/select";
import { ProductSearchPicker } from "@/features/products/product-search-picker";
import { EmissionFactor, LcaCalculation, LcaInput, Product, api } from "@/lib/api";
import { openJsonViewer } from "@/lib/exports";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/stores/toast-store";

const stages = ["A1-A3", "A4", "A5", "B", "C", "D"];
const emptyRow = (): LcaInput => ({
  stage: "A1-A3",
  activity_name: "",
  quantity: 1,
  unit: "t",
  data_quality: "estimated",
});

export function LcaPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const productId = searchParams.get("productId") ?? "";
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [declaredUnit, setDeclaredUnit] = useState("1 unit");
  const [boundary, setBoundary] = useState("cradle-to-gate");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<LcaInput[]>([
    { ...emptyRow(), activity_name: "Manufacturing impact" },
    { ...emptyRow(), stage: "A4", activity_name: "Outbound transport", unit: "t-km" },
  ]);
  const [result, setResult] = useState<LcaCalculation | null>(null);
  const addToast = useToastStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const selectedProductQuery = useQuery({
    queryKey: ["products", productId],
    queryFn: () => api.product(productId),
    enabled: Boolean(productId),
  });
  const factorsQuery = useQuery({
    queryKey: ["lca", "emission-factors"],
    queryFn: () => api.emissionFactors(),
  });
  const historyQuery = useQuery({
    queryKey: ["lca", "calculations", productId],
    queryFn: () => api.lcaCalculations(productId),
    enabled: Boolean(productId),
  });
  const calculation = useMutation({
    mutationFn: () => api.createLcaCalculation(productId, {
      declared_unit: declaredUnit,
      boundary,
      notes,
      inputs: rows.map((row) => ({
        ...row,
        activity_name: row.activity_name.trim(),
        quantity: Number(row.quantity),
        emission_factor_kg_co2e: row.emission_factor_kg_co2e === undefined ? undefined : Number(row.emission_factor_kg_co2e),
      })),
    }),
    onSuccess: (created) => {
      setResult(created);
      queryClient.invalidateQueries({ queryKey: ["lca", "calculations", productId] });
      addToast({ title: "LCA screening calculation saved", variant: "success" });
    },
    meta: {
      errorMessage: "Could not run LCA calculation",
    },
  });
  const factors = useMemo(() => factorsQuery.data ?? [], [factorsQuery.data]);

  useEffect(() => {
    if (selectedProductQuery.data) {
      setSelectedProduct(selectedProductQuery.data);
      setDeclaredUnit(defaultDeclaredUnit(selectedProductQuery.data.category));
      setRows(buildDefaultRows(selectedProductQuery.data, factors));
    }
  }, [factors, selectedProductQuery.data]);

  const projected = useMemo(() => calculatePreview(rows, factors), [rows, factors]);
  const invalidRows = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => !row.activity_name.trim() || !hasFactor(row));
  const canSave = Boolean(productId) && !calculation.isPending && invalidRows.length === 0;
  const selectProduct = (product: Product) => {
    setSelectedProduct(product);
    setResult(null);
    setSearchParams({ productId: product.id });
    setDeclaredUnit(defaultDeclaredUnit(product.category));
    setRows(buildDefaultRows(product, factors));
  };
  const updateRow = (index: number, values: Partial<LcaInput>) => {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...values } : row));
  };
  const selectFactor = (index: number, factorId: string) => {
    const factor = factors.find((item) => item.id === factorId);
    updateRow(index, {
      emission_factor_id: factorId || undefined,
      emission_factor_kg_co2e: undefined,
      unit: factor?.unit ?? rows[index].unit,
      stage: factor?.lifecycle_stage ?? rows[index].stage,
      activity_name: rows[index].activity_name || factor?.name || "",
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">LCA Calculation Engine</h1>
        <p className="text-sm text-muted-foreground">
          Run traceable lifecycle-stage screening calculations before formal EPD verification.
        </p>
      </div>

      <section className="grid gap-4 rounded-lg border border-border bg-card p-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        {selectedProductQuery.isLoading ? (
          <LoadingState label="Loading selected product" />
        ) : (
          <ProductSearchPicker selectedProduct={selectedProduct} onSelect={selectProduct} />
        )}
        <div className="grid gap-3">
          <label className="text-sm font-medium">
            Declared unit
            <Input className="mt-1" value={declaredUnit} onChange={(event) => setDeclaredUnit(event.target.value)} />
          </label>
          <label className="text-sm font-medium">
            Boundary
            <Select className="mt-1" value={boundary} onChange={(event) => setBoundary(event.target.value)}>
              <option value="cradle-to-gate">Cradle-to-gate</option>
              <option value="A1-A4 screening">A1-A4 screening</option>
              <option value="cradle-to-grave screening">Cradle-to-grave screening</option>
            </Select>
          </label>
          <label className="text-sm font-medium">
            Notes
            <Input className="mt-1" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Screening assumptions" />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold">Lifecycle inputs</h2>
            <p className="text-sm text-muted-foreground">Use seeded factors or enter a custom factor for a measured source.</p>
          </div>
          <Button variant="secondary" onClick={() => setRows((current) => [...current, emptyRow()])}>
            <Plus size={16} /> Add row
          </Button>
        </div>
        {factorsQuery.isLoading ? (
          <LoadingState label="Loading emission factors" />
        ) : (
          <div className="space-y-3">
            {rows.map((row, index) => (
              <div key={index} className="grid gap-3 rounded-md border border-border bg-background p-3 xl:grid-cols-[110px_1.3fr_1fr_90px_90px_120px_120px_auto]">
                <Select value={row.stage} onChange={(event) => updateRow(index, { stage: event.target.value })}>
                  {stages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
                </Select>
                <Input value={row.activity_name} onChange={(event) => updateRow(index, { activity_name: event.target.value })} placeholder="Activity" />
                <Select value={row.emission_factor_id ?? ""} onChange={(event) => selectFactor(index, event.target.value)}>
                  <option value="">Custom factor</option>
                  {factors.map((factor) => (
                    <option key={factor.id} value={factor.id}>{factor.name}</option>
                  ))}
                </Select>
                <Input type="number" min="0" step="0.001" value={row.quantity} onChange={(event) => updateRow(index, { quantity: Number(event.target.value) })} />
                <Input value={row.unit} onChange={(event) => updateRow(index, { unit: event.target.value })} />
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  disabled={Boolean(row.emission_factor_id)}
                  value={row.emission_factor_kg_co2e ?? factorFor(row, factors)?.factor_kg_co2e ?? ""}
                  onChange={(event) => updateRow(index, {
                    emission_factor_kg_co2e: event.target.value === "" ? undefined : Number(event.target.value),
                    emission_factor_id: undefined,
                  })}
                  placeholder="kg CO2e/unit"
                />
                <Select value={row.data_quality} onChange={(event) => updateRow(index, { data_quality: event.target.value as LcaInput["data_quality"] })}>
                  <option value="measured">Measured</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="estimated">Estimated</option>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove row"
                  disabled={rows.length <= 1}
                  onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="text-sm text-muted-foreground">Preview total</div>
          <div className="mt-1 text-3xl font-semibold">{projected.total.toLocaleString()} kg CO2e</div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {stages.map((stage) => (
              <div key={stage} className="rounded-md bg-muted px-3 py-2">
                <div className="text-xs text-muted-foreground">{stage}</div>
                <div className="font-medium">{(projected.stageTotals[stage] ?? 0).toLocaleString()} kg</div>
              </div>
            ))}
          </div>
          <Button
            className="mt-4 w-full"
            disabled={!canSave}
            onClick={() => calculation.mutate()}
          >
            <Calculator size={16} /> Save calculation
          </Button>
          {invalidRows.length ? (
            <p className="mt-3 text-sm text-destructive">
              Add an activity name and emission factor for row {invalidRows[0].index + 1}.
            </p>
          ) : null}
        </div>

        {calculation.isPending ? (
          <LoadingState label="Saving LCA calculation" />
        ) : result ? (
          <CalculationResult calculation={result} />
        ) : historyQuery.data?.items.length ? (
          <CalculationResult calculation={historyQuery.data.items[0]} />
        ) : (
          <EmptyState title="No LCA calculation yet">
            Select a product, add lifecycle inputs, and save a screening calculation.
          </EmptyState>
        )}
      </section>
    </div>
  );
}

function CalculationResult({ calculation }: { calculation: LcaCalculation }) {
  const interpretation = String(calculation.result_json.interpretation ?? "");
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <div className="text-sm text-muted-foreground">Saved calculation</div>
          <h2 className="text-3xl font-semibold">{calculation.total_kg_co2e.toLocaleString()} kg CO2e</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{interpretation}</p>
          <span className={cn("mt-3 inline-flex rounded-full px-2 py-1 text-xs font-medium", confidenceClass(calculation.confidence))}>
            {calculation.confidence} confidence
          </span>
        </div>
        <Button variant="secondary" onClick={() => openJsonViewer("lca-calculation.json", calculation.result_json)}>
          <FileJson size={16} /> JSON
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {Object.entries(calculation.stage_totals_json).map(([stage, value]) => (
          <div key={stage} className="rounded-md border border-border bg-background p-3">
            <div className="text-xs text-muted-foreground">{stage}</div>
            <div className="mt-1 font-semibold">{Number(value).toLocaleString()} kg CO2e</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function factorFor(row: LcaInput, factors: EmissionFactor[]) {
  return factors.find((factor) => factor.id === row.emission_factor_id);
}

function calculatePreview(rows: LcaInput[], factors: EmissionFactor[]) {
  const stageTotals: Record<string, number> = Object.fromEntries(stages.map((stage) => [stage, 0]));
  for (const row of rows) {
    const factor = factorFor(row, factors);
    const factorValue = factor?.factor_kg_co2e ?? row.emission_factor_kg_co2e ?? 0;
    stageTotals[row.stage] = Math.round((stageTotals[row.stage] + Number(row.quantity || 0) * factorValue) * 1000) / 1000;
  }
  const total = Math.round(Object.values(stageTotals).reduce((sum, value) => sum + value, 0) * 1000) / 1000;
  return { stageTotals, total };
}

function buildDefaultRows(product: Product, factors: EmissionFactor[]): LcaInput[] {
  const declaredUnit = defaultDeclaredUnit(product.category);
  const latest = product.environmental_records[0];
  const categoryFactor = factors.find((factor) =>
    factor.lifecycle_stage === "A1-A3" && product.category.toLowerCase().includes(factor.category.toLowerCase()),
  );
  const transportFactor = factors.find((factor) =>
    factor.lifecycle_stage === "A4" && factor.category.toLowerCase() === "transport",
  );

  return [
    {
      ...emptyRow(),
      activity_name: "Manufacturing impact",
      unit: categoryFactor?.unit ?? declaredUnit,
      emission_factor_id: categoryFactor?.id,
      emission_factor_kg_co2e: categoryFactor ? undefined : latest?.co2_kg ?? undefined,
    },
    {
      ...emptyRow(),
      stage: "A4",
      activity_name: "Outbound transport",
      unit: transportFactor?.unit ?? "t-km",
      emission_factor_id: transportFactor?.id,
    },
  ];
}

function hasFactor(row: LcaInput) {
  return Boolean(row.emission_factor_id) || row.emission_factor_kg_co2e !== undefined;
}

function defaultDeclaredUnit(category: string) {
  const key = category.toLowerCase();
  if (key.includes("cement") || key.includes("steel")) return `1 t ${category.toLowerCase()}`;
  if (key.includes("concrete")) return "1 m3 concrete";
  return "1 unit";
}

function confidenceClass(confidence: string) {
  if (confidence === "measured") return "bg-primary/10 text-primary";
  if (confidence === "hybrid") return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200";
  return "bg-muted text-muted-foreground";
}
