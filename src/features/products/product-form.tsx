import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

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
  compressive_strength_mpa: z.coerce.number().min(0).optional(),
  description: z.string().optional(),
  recycled_content_pct: z.coerce.number().min(0).max(100).optional(),
  certification_name: z.string().optional(),
  co2_kg: z.coerce.number().min(0).optional(),
  water_liters: z.coerce.number().min(0).optional(),
  energy_kwh: z.coerce.number().min(0).optional(),
  transportation_kg_co2: z.coerce.number().min(0).optional(),
  recyclability_score: z.coerce.number().min(0).max(100).optional(),
  sustainability_score: z.coerce.number().min(0).max(100).optional(),
});

export type ProductFormValues = z.infer<typeof schema>;

export function ProductForm({
  onSubmit,
  pending,
}: {
  onSubmit: (values: ProductFormValues) => void;
  pending: boolean;
}) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: "Concrete",
      country: "Germany",
      manufacturer: "Emidat Demo Manufacturing",
      production_method: "Verified batch production",
      declared_unit: "1 m3",
      lifecycle_scope: "cradle-to-gate",
      data_quality: "estimated",
      primary_material_pct: 100,
      recyclability_score: 80,
      sustainability_score: 80,
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
      <Input placeholder="Compressive strength MPa" type="number" min="0" step="0.1" {...form.register("compressive_strength_mpa")} />
      <Input className="md:col-span-2" placeholder="Description" {...form.register("description")} />
      <Input placeholder="Recycled content %" type="number" min="0" max="100" {...form.register("recycled_content_pct")} />
      <Input placeholder="Certification name" {...form.register("certification_name")} />
      <Input placeholder="CO2e kg" type="number" min="0" step="0.1" {...form.register("co2_kg")} />
      <Input placeholder="Water liters" type="number" min="0" step="0.1" {...form.register("water_liters")} />
      <Input placeholder="Energy kWh" type="number" min="0" step="0.1" {...form.register("energy_kwh")} />
      <Input placeholder="Transport CO2e kg" type="number" min="0" step="0.1" {...form.register("transportation_kg_co2")} />
      <Input placeholder="Recyclability score" type="number" min="0" max="100" {...form.register("recyclability_score")} />
      <Input placeholder="Sustainability score" type="number" min="0" max="100" {...form.register("sustainability_score")} />
      <Button className="md:col-span-2" disabled={pending}>
        Create product
      </Button>
    </form>
  );
}
