import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Brain, ChevronLeft, ChevronRight, FileText, FileUp, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Column, DataGrid } from "@/components/ui/data-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { api, Product } from "@/lib/api";
import { permissionsFor } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { ProductForm, ProductFormValues } from "@/features/products/product-form";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";

const PAGE_SIZE = 10;

export function ProductsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const addToast = useToastStore((state) => state.addToast);
  const permissions = permissionsFor(user);
  const { data, isLoading, isFetching } = useQuery({
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
  const deleteMutation = useMutation({
    mutationFn: api.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    meta: {
      successMessage: "Product deleted",
      errorMessage: "Could not delete product",
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
      width: "minmax(300px, 2fr)",
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
    { key: "category", header: "Category", width: "minmax(140px, 1fr)", cell: (row) => row.category },
    { key: "country", header: "Country", width: "minmax(110px, .8fr)", cell: (row) => row.country },
    { key: "manufacturer", header: "Manufacturer", width: "minmax(160px, 1fr)", cell: (row) => row.manufacturer },
    { key: "score", header: "Score", width: "minmax(90px, .7fr)", cell: (row) => row.environmental_records[0]?.sustainability_score ?? "No data" },
    { key: "co2", header: "CO2e", width: "minmax(110px, .8fr)", cell: (row) => row.environmental_records[0] ? `${row.environmental_records[0].co2_kg} kg` : "No data" },
    {
      key: "actions",
      header: "Action",
      width: "88px",
      className: "text-right overflow-visible",
      cell: (row) => (
        <ProductActionMenu
          product={row}
          canDelete={permissions.canDeleteProducts}
          deleting={deleteMutation.isPending}
          onEdit={() => navigate(`/products/${row.id}`)}
          onDelete={() => {
            if (window.confirm(`Delete ${row.name}?`)) {
              deleteMutation.mutate(row.id);
            }
          }}
          onReport={() => navigate(`/reports?productId=${row.id}&generate=1`)}
          onAdvisor={() => navigate(`/advisor?productId=${row.id}&generate=1`)}
        />
      ),
    },
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
      {isLoading || isFetching ? (
        <LoadingState label="Loading products" />
      ) : data?.items.length ? (
        <DataGrid rows={data.items} columns={columns} />
      ) : (
        <EmptyState title="No products found" />
      )}
      <Modal open={open} title="Create product" onClose={() => setOpen(false)}>
        <ProductForm pending={mutation.isPending} onSubmit={(values) => mutation.mutate(values)} />
      </Modal>
    </div>
  );
}

function ProductActionMenu({
  product,
  canDelete,
  deleting,
  onEdit,
  onDelete,
  onReport,
  onAdvisor,
}: {
  product: Product;
  canDelete: boolean;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
  onAdvisor: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const buttonRect = buttonRef.current?.getBoundingClientRect();
    if (buttonRect) {
      const menuWidth = 176;
      const menuHeight = canDelete ? 152 : 116;
      const margin = 8;
      const preferredLeft = buttonRect.right - menuWidth;
      const preferredTop = buttonRect.bottom + 6;
      const flippedTop = buttonRect.top - menuHeight - 6;
      setPosition({
        left: Math.min(Math.max(preferredLeft, margin), window.innerWidth - menuWidth - margin),
        top: Math.min(
          Math.max(preferredTop + menuHeight > window.innerHeight ? flippedTop : preferredTop, margin),
          window.innerHeight - menuHeight - margin,
        ),
      });
    }
    const close = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", close);
    return () => {
      window.removeEventListener("mousedown", close);
    };
  }, [canDelete, open]);

  const choose = (action: () => void) => {
    setOpen(false);
    action();
  };

  const menu = open ? (
    <div
      className="fixed z-50 w-44 overflow-hidden rounded-md border border-border bg-card py-1 text-left text-sm shadow-lg"
      ref={menuRef}
      role="menu"
      style={{ left: position.left, top: position.top }}
    >
      <MenuItem icon={<Pencil size={15} />} onClick={() => choose(onEdit)}>Edit</MenuItem>
      <MenuItem icon={<FileText size={15} />} onClick={() => choose(onReport)}>Report</MenuItem>
      <MenuItem icon={<Brain size={15} />} onClick={() => choose(onAdvisor)}>AI Advisory</MenuItem>
      {canDelete ? (
        <MenuItem
          destructive
          disabled={deleting}
          icon={<Trash2 size={15} />}
          onClick={() => choose(onDelete)}
        >
          Delete
        </MenuItem>
      ) : null}
    </div>
  ) : null;

  return (
    <div className="relative flex justify-end overflow-visible">
      <Button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Actions for ${product.name}`}
        ref={buttonRef}
        size="icon"
        type="button"
        variant="ghost"
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal size={17} />
      </Button>
      {menu ? createPortal(menu, document.body) : null}
    </div>
  );
}

function MenuItem({
  children,
  destructive,
  disabled,
  icon,
  onClick,
}: {
  children: string;
  destructive?: boolean;
  disabled?: boolean;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50",
        destructive && "text-destructive hover:bg-destructive/10",
      )}
      disabled={disabled}
      role="menuitem"
      type="button"
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}
