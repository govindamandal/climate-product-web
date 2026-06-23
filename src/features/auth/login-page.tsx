import { zodResolver } from "@hookform/resolvers/zod";
import { Leaf } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";

const schema = z.object({
  organization_slug: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(8),
});

type LoginValues = z.infer<typeof schema>;
const forgotPasswordSchema = z.object({
  email: z.string().email(),
});
type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const addToast = useToastStore((state) => state.addToast);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      organization_slug: "demo-manufacturing",
      email: "admin@demo.com",
      password: "ClimatePass123!",
    },
  });
  const forgotPasswordForm = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "admin@demo.com" },
  });
  const mutation = useMutation({
    mutationFn: api.login,
    meta: {
      successMessage: "Signed in successfully",
      errorMessage: "Sign in failed",
    },
    onSuccess: (session) => {
      setSession(session);
      navigate(session.user.role === "super_admin" ? "/platform" : "/");
    },
  });
  const forgotPasswordMutation = useMutation({
    mutationFn: api.forgotPassword,
    onSuccess: (result) => {
      addToast({
        title: "Password reset requested",
        description: result.message,
        variant: "success",
      });
      setShowForgotPassword(false);
    },
    meta: {
      errorMessage: "Could not request password reset",
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
              Use a tenant account or leave organization blank for platform admin.
            </p>
          </div>
          <Input aria-label="Organization slug" {...form.register("organization_slug")} />
          <Input aria-label="Email" type="email" {...form.register("email")} />
          <Input aria-label="Password" type="password" {...form.register("password")} />
          {mutation.error ? <p className="text-sm text-destructive">{mutation.error.message}</p> : null}
          <Button className="w-full" disabled={mutation.isPending}>
            Sign in
          </Button>
          <Button
            className="w-full"
            type="button"
            variant="ghost"
            onClick={() => setShowForgotPassword((value) => !value)}
          >
            Forgot password?
          </Button>
          {showForgotPassword ? (
            <div className="rounded-lg border border-border bg-background p-4">
              <div>
                <h3 className="text-sm font-semibold">Reset password</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Enter your account email and we will send reset instructions if the account exists.
                </p>
              </div>
              <div className="mt-3 grid gap-3">
                <Input
                  aria-label="Reset email"
                  type="email"
                  {...forgotPasswordForm.register("email")}
                />
                <Button
                  disabled={forgotPasswordMutation.isPending}
                  type="button"
                  variant="secondary"
                  onClick={forgotPasswordForm.handleSubmit((values) => forgotPasswordMutation.mutate(values))}
                >
                  Send reset instructions
                </Button>
              </div>
            </div>
          ) : null}
        </form>
      </section>
    </main>
  );
}
