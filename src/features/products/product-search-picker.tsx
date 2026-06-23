import { useQuery } from "@tanstack/react-query";
import { Check, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { Product, api } from "@/lib/api";
import { cn } from "@/lib/utils";

function useDebouncedValue(value: string, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debounced;
}

export function ProductSearchPicker({
  selectedProduct,
  onSelect,
}: {
  selectedProduct?: Product | null;
  onSelect: (product: Product) => void;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const { data, isFetching, isLoading } = useQuery({
    queryKey: ["products", "search-picker", debouncedSearch],
    queryFn: () => api.products({ search: debouncedSearch, pageSize: 8 }),
  });
  const products = data?.items ?? [];

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
        <Input
          className="pl-9"
          placeholder="Search product by name"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      <div className="min-h-44 rounded-lg border border-border bg-background p-2">
        {isLoading || isFetching ? (
          <LoadingState label="Searching products" />
        ) : products.length ? (
          <div className="space-y-1">
            {products.map((product) => {
              const selected = product.id === selectedProduct?.id;
              return (
                <button
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary",
                    selected && "bg-primary/10",
                  )}
                  key={product.id}
                  type="button"
                  onClick={() => onSelect(product)}
                >
                  {product.image_url ? (
                    <img className="h-10 w-10 rounded-md object-cover" src={product.image_url} alt="" />
                  ) : (
                    <span className="h-10 w-10 shrink-0 rounded-md bg-muted" aria-hidden="true" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{product.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {product.category} - {product.manufacturer}
                    </span>
                  </span>
                  {selected ? <Check className="text-primary" size={16} /> : null}
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No products found">Try a different product name.</EmptyState>
        )}
      </div>
    </div>
  );
}
