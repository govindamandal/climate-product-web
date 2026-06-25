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
  product_code: z.string().optional(),
  declared_unit: z.string().min(1),
  functional_unit: z.string().optional(),
  lifecycle_scope: z.string().min(2),
  manufacturing_site: z.string().optional(),
  plant_code: z.string().optional(),
  product_standard: z.string().optional(),
  pcr: z.string().optional(),
  geography: z.string().optional(),
  data_quality: z.string().min(2),
  reference_service_life_years: z.coerce.number().min(0).max(200).optional(),
  primary_material: z.string().optional(),
  primary_material_pct: z.coerce.number().min(0).max(100).optional(),
  primary_material_supplier: z.string().optional(),
  primary_material_origin_country: z.string().optional(),
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
      product_code: product.product_code,
      declared_unit: product.declared_unit,
      functional_unit: product.functional_unit,
      lifecycle_scope: product.lifecycle_scope,
      manufacturing_site: product.manufacturing_site,
      plant_code: product.plant_code,
      product_standard: product.product_standard,
      pcr: product.pcr,
      geography: product.geography,
      data_quality: product.data_quality,
      reference_service_life_years: product.reference_service_life_years ?? undefined,
      primary_material: product.material_components[0]?.material_name ?? "",
      primary_material_pct: product.material_components[0]?.percentage ?? undefined,
      primary_material_supplier: product.material_components[0]?.supplier ?? "",
      primary_material_origin_country: product.material_components[0]?.origin_country ?? "",
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
      <Input placeholder="Product code / SKU" {...form.register("product_code")} />
      <Input placeholder="Declared unit" {...form.register("declared_unit")} />
      <Input className="md:col-span-2" placeholder="Functional unit" {...form.register("functional_unit")} />
      <Select {...form.register("lifecycle_scope")}>
        <option value="cradle-to-gate">Cradle to gate</option>
        <option value="cradle-to-site">Cradle to site</option>
        <option value="cradle-to-grave">Cradle to grave</option>
        <option value="module-specific">Module specific</option>
      </Select>
      <Select {...form.register("data_quality")}>
        <option value="estimated">Estimated</option>
        <option value="hybrid">Hybrid</option>
        <option value="measured">Measured</option>
        <option value="verified">Verified</option>
      </Select>
      <Input placeholder="Manufacturing site" {...form.register("manufacturing_site")} />
      <Input placeholder="Plant code" {...form.register("plant_code")} />
      <Input placeholder="Product standard" {...form.register("product_standard")} />
      <Input placeholder="PCR" {...form.register("pcr")} />
      <Input placeholder="Geography" {...form.register("geography")} />
      <Input placeholder="Reference service life years" type="number" min="0" max="200" {...form.register("reference_service_life_years")} />
      <Input placeholder="Primary material" {...form.register("primary_material")} />
      <Input placeholder="Primary material %" type="number" min="0" max="100" {...form.register("primary_material_pct")} />
      <Input placeholder="Primary material supplier" {...form.register("primary_material_supplier")} />
      <Input placeholder="Material origin country" {...form.register("primary_material_origin_country")} />
      <Input className="md:col-span-2" placeholder="Description" {...form.register("description")} />
      <Button className="md:col-span-2" disabled={pending}>
        Save changes
      </Button>
    </form>
  );
}
