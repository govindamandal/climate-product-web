import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  co2_kg: z.coerce.number().min(0),
  water_liters: z.coerce.number().min(0),
  energy_kwh: z.coerce.number().min(0),
  transportation_kg_co2: z.coerce.number().min(0),
  recyclability_score: z.coerce.number().min(0).max(100),
  sustainability_score: z.coerce.number().min(0).max(100),
  notes: z.string().optional(),
});

export type EnvironmentalRecordFormValues = z.infer<typeof schema>;

export function EnvironmentalRecordForm({
  onSubmit,
  pending,
}: {
  onSubmit: (values: EnvironmentalRecordFormValues) => void;
  pending: boolean;
}) {
  const form = useForm<EnvironmentalRecordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      co2_kg: 0,
      water_liters: 0,
      energy_kwh: 0,
      transportation_kg_co2: 0,
      recyclability_score: 80,
      sustainability_score: 80,
    },
  });

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
      <Input placeholder="CO2e kg" type="number" min="0" step="0.1" {...form.register("co2_kg")} />
      <Input placeholder="Water liters" type="number" min="0" step="0.1" {...form.register("water_liters")} />
      <Input placeholder="Energy kWh" type="number" min="0" step="0.1" {...form.register("energy_kwh")} />
      <Input placeholder="Transport CO2e kg" type="number" min="0" step="0.1" {...form.register("transportation_kg_co2")} />
      <Input placeholder="Recyclability score" type="number" min="0" max="100" {...form.register("recyclability_score")} />
      <Input placeholder="Sustainability score" type="number" min="0" max="100" {...form.register("sustainability_score")} />
      <Input className="md:col-span-2" placeholder="Notes" {...form.register("notes")} />
      <Button className="md:col-span-2" disabled={pending}>
        Add environmental record
      </Button>
    </form>
  );
}
