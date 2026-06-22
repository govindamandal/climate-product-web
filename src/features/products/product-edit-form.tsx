import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Product } from "@/lib/api";

const schema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  manufacturer: z.string().min(2),
  country: z.string().min(2),
  production_method: z.string().min(2),
  description: z.string().optional(),
});

export type ProductEditFormValues = z.infer<typeof schema>;

export function ProductEditForm({
  product,
  onSubmit,
  pending,
}: {
  product: Product;
  onSubmit: (values: ProductEditFormValues) => void;
  pending: boolean;
}) {
  const form = useForm<ProductEditFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product.name,
      category: product.category,
      manufacturer: product.manufacturer,
      country: product.country,
      production_method: product.production_method,
      description: product.description,
    },
  });

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
      <Input placeholder="Product name" {...form.register("name")} />
      <Select {...form.register("category")}>
        {["Concrete", "Cement", "Steel", "Brick", "Glass", "Timber", "Insulation"].map((item) => (
          <option key={item}>{item}</option>
        ))}
      </Select>
      <Input placeholder="Manufacturer" {...form.register("manufacturer")} />
      <Input placeholder="Country" {...form.register("country")} />
      <Input className="md:col-span-2" placeholder="Production method" {...form.register("production_method")} />
      <Input className="md:col-span-2" placeholder="Description" {...form.register("description")} />
      <Button className="md:col-span-2" disabled={pending}>
        Save changes
      </Button>
    </form>
  );
}
