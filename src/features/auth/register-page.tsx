import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Leaf } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

const registerSchema = z.object({
  organization_name: z.string().min(2).max(160),
  organization_slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only"),
  country: z.string().min(2).max(80),
  full_name: z.string().min(2).max(160),
  email: z.string().email(),
  password: z.string().min(10).max(128),
});

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      organization_name: "",
      organization_slug: "",
      country: "Germany",
      full_name: "",
      email: "",
      password: "",
    },
  });
  const mutation = useMutation({
    mutationFn: api.register,
    meta: {
      successMessage: "Workspace created",
      errorMessage: "Could not create workspace",
    },
    onSuccess: (session) => {
      setSession(session);
      navigate("/");
    },
  });
  const error = mutation.error instanceof Error ? mutation.error.message : null;

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[0.9fr_1.1fr]">
      <section className="flex flex-col justify-between border-r border-border bg-card p-8 md:p-12">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
            <Leaf size={20} />
          </div>
          <span className="font-semibold">Material Passport OS</span>
        </div>
        <div className="max-w-xl">
          <h1 className="text-4xl font-semibold tracking-normal md:text-5xl">
            Start a manufacturer workspace.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Create an organization, invite sustainability teams, and manage product environmental
            data in one tenant-scoped system.
          </p>
        </div>
        <Link className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" to="/login">
          <ArrowLeft size={16} /> Back to sign in
        </Link>
      </section>
      <section className="flex items-center justify-center p-6">
        <form
          className="w-full max-w-2xl space-y-5"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <div>
            <h2 className="text-2xl font-semibold">Create account</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The first user becomes the organization admin.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium">
              Organization name
              <Input {...form.register("organization_name")} />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Organization slug
              <Input placeholder="example-materials" {...form.register("organization_slug")} />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Country
              <Input {...form.register("country")} />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Full name
              <Input {...form.register("full_name")} />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Email
              <Input type="email" {...form.register("email")} />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Password
              <Input type="password" {...form.register("password")} />
            </label>
          </div>
          {Object.values(form.formState.errors).length ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Please fix the highlighted registration fields.
            </div>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button className="w-full" disabled={mutation.isPending}>
            Create workspace
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link className="font-medium text-primary hover:underline" to="/login">
              Sign in
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
