import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, ClipboardList, CreditCard, Factory, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { KPIWidget } from "@/components/ui/kpi-widget";
import { LoadingState } from "@/components/ui/loading-state";
import { Select } from "@/components/ui/select";
import { api, Organization } from "@/lib/api";

type SubscriptionStatus = Organization["subscription_status"];

export function PlatformPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [country, setCountry] = useState("Germany");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const analytics = useQuery({ queryKey: ["platform", "analytics"], queryFn: api.platformAnalytics });
  const organizations = useQuery({ queryKey: ["platform", "organizations"], queryFn: api.platformOrganizations });
  const users = useQuery({ queryKey: ["platform", "users"], queryFn: api.platformUsers });
  const auditLogs = useQuery({ queryKey: ["platform", "audit-logs"], queryFn: () => api.platformAuditLogs(30) });
  const createMutation = useMutation({
    mutationFn: () =>
      api.createPlatformOrganization({
        name,
        slug,
        country,
        admin_full_name: adminName,
        admin_email: adminEmail,
      }),
    onSuccess: () => {
      setName("");
      setSlug("");
      setCountry("Germany");
      setAdminName("");
      setAdminEmail("");
      queryClient.invalidateQueries({ queryKey: ["platform"] });
    },
    meta: {
      successMessage: "Organization created",
      errorMessage: "Could not create organization",
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, subscription_status }: { id: string; subscription_status: SubscriptionStatus }) =>
      api.updatePlatformOrganization(id, { subscription_status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["platform"] }),
    meta: {
      successMessage: "Subscription updated",
      errorMessage: "Could not update subscription",
    },
  });

  const onCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createMutation.mutate();
  };

  if (analytics.isLoading || organizations.isLoading || users.isLoading || auditLogs.isLoading) {
    return <LoadingState label="Loading platform console" />;
  }
  const data = analytics.data;
  if (!data) return <EmptyState title="Platform analytics unavailable" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Super Admin Console</h1>
        <p className="text-sm text-muted-foreground">
          Manage tenants, subscriptions, users, and platform-wide audit activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KPIWidget label="Organizations" value={data.organization_count.toLocaleString()} icon={<Building2 size={18} />} />
        <KPIWidget label="Active subscriptions" value={data.active_subscription_count.toLocaleString()} icon={<CreditCard size={18} />} />
        <KPIWidget label="Users" value={data.user_count.toLocaleString()} icon={<Users size={18} />} />
        <KPIWidget label="Products" value={data.product_count.toLocaleString()} icon={<Factory size={18} />} />
        <KPIWidget label="Audit logs" value={data.audit_log_count.toLocaleString()} icon={<ClipboardList size={18} />} />
      </div>

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4">
          <h2 className="font-semibold">Create Organization</h2>
          <p className="text-sm text-muted-foreground">Provision a new tenant and first organization admin.</p>
        </div>
        <form className="grid gap-3 lg:grid-cols-[1fr_180px_150px_1fr_1fr_auto]" onSubmit={onCreate}>
          <Input placeholder="Organization name" value={name} onChange={(event) => setName(event.target.value)} required />
          <Input placeholder="tenant-slug" value={slug} onChange={(event) => setSlug(event.target.value)} required />
          <Input placeholder="Country" value={country} onChange={(event) => setCountry(event.target.value)} required />
          <Input placeholder="Admin full name" value={adminName} onChange={(event) => setAdminName(event.target.value)} required />
          <Input type="email" placeholder="Admin email" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} required />
          <Button disabled={createMutation.isPending}>
            <Plus size={16} /> Create
          </Button>
        </form>
      </section>

      <section className="overflow-x-auto rounded-lg border border-border bg-card">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_120px_120px_180px] gap-x-4 bg-muted px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
            <span>Organization</span>
            <span>Slug</span>
            <span>Country</span>
            <span>Users</span>
            <span>Products</span>
            <span>Subscription</span>
          </div>
          {(organizations.data?.items ?? []).map((organization) => (
            <div key={organization.id} className="grid grid-cols-[1.5fr_1fr_1fr_120px_120px_180px] items-center gap-x-4 border-t border-border px-4 py-3 text-sm">
              <span className="truncate font-medium">{organization.name}</span>
              <span className="truncate text-muted-foreground">{organization.slug}</span>
              <span>{organization.country}</span>
              <span>{organization.user_count}</span>
              <span>{organization.product_count}</span>
              <Select
                value={organization.subscription_status}
                disabled={updateMutation.isPending}
                onChange={(event) =>
                  updateMutation.mutate({
                    id: organization.id,
                    subscription_status: event.target.value as SubscriptionStatus,
                  })
                }
              >
                <option value="trial">Trial</option>
                <option value="active">Active</option>
                <option value="past_due">Past due</option>
                <option value="canceled">Canceled</option>
              </Select>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-semibold">Platform Users</h2>
          <div className="mt-4 space-y-3">
            {(users.data?.items ?? []).slice(0, 8).map((user) => (
              <div key={user.id} className="flex justify-between gap-3 rounded-md border border-border px-4 py-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{user.full_name}</div>
                  <div className="truncate text-muted-foreground">{user.email}</div>
                </div>
                <span className="shrink-0 text-muted-foreground">{user.role.replace("_", " ")}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-semibold">Platform Audit Logs</h2>
          <div className="mt-4 space-y-3">
            {(auditLogs.data?.items ?? []).slice(0, 8).map((log) => (
              <div key={log.id} className="rounded-md border border-border px-4 py-3 text-sm">
                <div className="font-medium">{log.action} {log.entity_type.replace("_", " ")}</div>
                <div className="text-muted-foreground">{new Date(log.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
