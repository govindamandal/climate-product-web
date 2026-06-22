import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, FileUp, Plus, Search } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Column, DataGrid } from "@/components/ui/data-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { api, Product } from "@/lib/api";
import { ProductForm, ProductFormValues } from "@/features/products/product-form";
import { useToastStore } from "@/stores/toast-store";

const PAGE_SIZE = 10;

export function ProductsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const { data } = useQuery({
    queryKey: ["products", search, category, page],
    queryFn: () => api.products({ search, category, page, pageSize: PAGE_SIZE }),
  });
  const mutation = useMutation({
    mutationFn: (values: ProductFormValues) => {
      const certification = values.certification_name?.trim();
      return api.createProduct({
        name: values.name,
        category: values.category,
        description: values.description ?? "",
        manufacturer: values.manufacturer,
        country: values.country,
        production_method: values.production_method,
        material_composition: {
          primary: values.category,
          recycled_content_pct: values.recycled_content_pct ?? 0,
        },
        certifications: certification ? [{ name: certification, status: "uploaded" }] : [],
        environmental_record:
          values.co2_kg === undefined
            ? undefined
            : {
                co2_kg: values.co2_kg,
                water_liters: values.water_liters ?? 0,
                energy_kwh: values.energy_kwh ?? 0,
                transportation_kg_co2: values.transportation_kg_co2 ?? 0,
                recyclability_score: values.recyclability_score ?? 0,
                sustainability_score: values.sustainability_score ?? 0,
              },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
    },
    meta: {
      successMessage: "Product created",
      errorMessage: "Could not create product",
    },
  });
  const importMutation = useMutation({
    mutationFn: api.importProductsCsv,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      addToast({
        title: "CSV import completed",
        description: `${result.created} created${result.skipped ? `, ${result.skipped} skipped` : ""}.`,
        variant: "success",
      });
    },
    meta: {
      errorMessage: "Could not import CSV",
    },
  });
  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) importMutation.mutate(file);
    event.target.value = "";
  };
  const columns: Column<Product>[] = [
    {
      key: "name",
      header: "Product",
      cell: (row) => (
        <Link className="flex items-center gap-3 font-medium text-primary" to={`/products/${row.id}`}>
          {row.image_url ? (
            <img className="h-10 w-10 rounded-md object-cover" src={row.image_url} alt="" />
          ) : (
            <span className="h-10 w-10 shrink-0 rounded-md bg-muted" aria-hidden="true" />
          )}
          <span>{row.name}</span>
        </Link>
      ),
    },
    { key: "category", header: "Category", cell: (row) => row.category },
    { key: "country", header: "Country", cell: (row) => row.country },
    { key: "manufacturer", header: "Manufacturer", cell: (row) => row.manufacturer },
    { key: "score", header: "Score", cell: (row) => row.environmental_records[0]?.sustainability_score ?? "No data" },
    { key: "co2", header: "CO2e", cell: (row) => row.environmental_records[0] ? `${row.environmental_records[0].co2_kg} kg` : "No data" },
  ];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold">Product Management</h1>
          <p className="text-sm text-muted-foreground">Manage building material records and LCA inputs.</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileInputRef} className="hidden" type="file" accept=".csv" onChange={onFileChange} />
          <Button variant="secondary" disabled={importMutation.isPending} onClick={() => fileInputRef.current?.click()}>
            <FileUp size={16} /> Import CSV
          </Button>
          <Button onClick={() => setOpen(true)}><Plus size={16} /> Product</Button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
          <Input
            className="pl-9"
            placeholder="Search products"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All categories</option>
          {(data?.categories ?? []).map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </Select>
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" size="icon" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} aria-label="Previous page">
            <ChevronLeft size={16} />
          </Button>
          <span className="min-w-20 text-center text-sm text-muted-foreground">{page} / {pageCount}</span>
          <Button variant="secondary" size="icon" disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)} aria-label="Next page">
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
      {importMutation.data ? (
        <div className="rounded-md border border-border bg-card px-4 py-3 text-sm">
          Imported {importMutation.data.created} products
          {importMutation.data.skipped ? `, skipped ${importMutation.data.skipped}` : ""}.
        </div>
      ) : null}
      {data?.items.length ? <DataGrid rows={data.items} columns={columns} /> : <EmptyState title="No products found" />}
      <Modal open={open} title="Create product" onClose={() => setOpen(false)}>
        <ProductForm pending={mutation.isPending} onSubmit={(values) => mutation.mutate(values)} />
      </Modal>
    </div>
  );
}
