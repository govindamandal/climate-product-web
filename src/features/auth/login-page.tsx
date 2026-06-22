import { zodResolver } from "@hookform/resolvers/zod";
import { Leaf } from "lucide-react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

const schema = z.object({
  organization_slug: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

type LoginValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      organization_slug: "demo-manufacturing",
      email: "admin@demo.com",
      password: "ClimatePass123!",
    },
  });
  const mutation = useMutation({
    mutationFn: api.login,
    meta: {
      successMessage: "Signed in successfully",
      errorMessage: "Sign in failed",
    },
    onSuccess: (session) => {
      setSession(session);
      navigate("/");
    },
  });

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.1fr_0.9fr]">
      <section className="flex flex-col justify-between p-8 md:p-12">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
            <Leaf size={20} />
          </div>
          <span className="font-semibold">Material Passport OS</span>
        </div>
        <div className="max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-normal md:text-6xl">
            Environmental product data for manufacturers.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Manage product LCAs, generate Digital Product Passports, and turn sustainability
            records into operational decisions.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">Built for B2B climate-tech workflows.</div>
      </section>
      <section className="flex items-center justify-center border-l border-border bg-card p-6">
        <form
          className="w-full max-w-md space-y-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <div>
            <h2 className="text-2xl font-semibold">Sign in</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Use the seeded demo account after running the backend seed.
            </p>
          </div>
          <Input aria-label="Organization slug" {...form.register("organization_slug")} />
          <Input aria-label="Email" type="email" {...form.register("email")} />
          <Input aria-label="Password" type="password" {...form.register("password")} />
          {mutation.error ? <p className="text-sm text-destructive">{mutation.error.message}</p> : null}
          <Button className="w-full" disabled={mutation.isPending}>
            Sign in
          </Button>
        </form>
      </section>
    </main>
  );
}
