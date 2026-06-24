import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Leaf } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";

const schema = z
  .object({
    password: z.string().min(10, "Use at least 10 characters"),
    confirmPassword: z.string().min(10, "Confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type AcceptInviteValues = z.infer<typeof schema>;

export function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";
  const setSession = useAuthStore((state) => state.setSession);
  const addToast = useToastStore((state) => state.addToast);
  const form = useForm<AcceptInviteValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const mutation = useMutation({
    mutationFn: (values: AcceptInviteValues) => api.acceptInvite({ token, password: values.password }),
    onSuccess: (session) => {
      setSession(session);
      addToast({
        title: "Invite accepted",
        description: "Your workspace access is ready.",
        variant: "success",
      });
      navigate(session.user.role === "super_admin" ? "/platform" : "/");
    },
    meta: {
      errorMessage: "Could not accept invite",
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
            Join your organization workspace.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Create a secure password to start managing product passports and sustainability data
            with your team.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">Invite links expire automatically.</div>
      </section>
      <section className="flex items-center justify-center border-l border-border bg-card p-6">
        <form
          className="w-full max-w-md space-y-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <div>
            <h2 className="text-2xl font-semibold">Accept invite</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Set your password to activate your team account.
            </p>
          </div>
          {!token ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              This invite link is missing a token. Ask your organization admin to send a new invite.
            </p>
          ) : null}
          <div>
            <Input aria-label="Password" type="password" {...form.register("password")} />
            {form.formState.errors.password ? (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.password.message}</p>
            ) : null}
          </div>
          <div>
            <Input
              aria-label="Confirm password"
              type="password"
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword ? (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
            ) : null}
          </div>
          {mutation.error ? <p className="text-sm text-destructive">{mutation.error.message}</p> : null}
          <Button className="w-full" disabled={!token || mutation.isPending}>
            Join workspace
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already accepted?{" "}
            <Link className="font-medium text-primary hover:underline" to="/login">
              Back to sign in
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
