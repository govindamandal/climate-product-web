import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Building2, CreditCard, Factory, Plus, Search, Server, Users } from "lucide-react";
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
  const [auditSearch, setAuditSearch] = useState("");
  const [auditAction, setAuditAction] = useState("");
  const analytics = useQuery({ queryKey: ["platform", "analytics"], queryFn: api.platformAnalytics });
  const operations = useQuery({
    queryKey: ["platform", "operations-status"],
    queryFn: api.operationsStatus,
    refetchInterval: 60000,
  });
  const organizations = useQuery({ queryKey: ["platform", "organizations"], queryFn: api.platformOrganizations });
  const users = useQuery({ queryKey: ["platform", "users"], queryFn: api.platformUsers });
  const auditLogs = useQuery({
    queryKey: ["platform", "audit-logs", auditSearch, auditAction],
    queryFn: () =>
      api.platformAuditLogs({
        limit: 30,
        search: auditSearch || undefined,
        action: auditAction || undefined,
      }),
  });
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

  if (analytics.isLoading || operations.isLoading || organizations.isLoading || users.isLoading || auditLogs.isLoading) {
    return <LoadingState label="Loading platform console" />;
  }
  const data = analytics.data;
  if (!data) return <EmptyState title="Platform analytics unavailable" />;
  const operationsStatus = operations.data;

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
        <KPIWidget label="System status" value={formatStatus(operationsStatus?.status ?? "unknown")} icon={<Activity size={18} />} />
      </div>

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div>
            <h2 className="font-semibold">Operational Status</h2>
            <p className="text-sm text-muted-foreground">Runtime health, dependency latency, and environment visibility.</p>
          </div>
          {operationsStatus ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
              <Server size={14} /> {operationsStatus.environment} · uptime {formatUptime(operationsStatus.uptime_seconds)}
            </div>
          ) : null}
        </div>
        {operations.isFetching ? <LoadingState label="Refreshing operations status" /> : null}
        {operationsStatus ? (
          <div className="grid gap-3 md:grid-cols-3">
            {operationsStatus.checks.map((check) => (
              <div key={check.name} className="rounded-md border border-border p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium capitalize">{check.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(check.status)}`}>
                    {check.status}
                  </span>
                </div>
                <div className="mt-2 text-muted-foreground">
                  {check.latency_ms == null ? "Latency unavailable" : `${check.latency_ms} ms`}
                </div>
                {check.detail ? <div className="mt-2 line-clamp-2 text-xs text-muted-foreground">{check.detail}</div> : null}
              </div>
            ))}
            <div className="rounded-md border border-border p-4 text-sm">
              <div className="font-medium">Last checked</div>
              <div className="mt-2 text-muted-foreground">{new Date(operationsStatus.generated_at).toLocaleString()}</div>
              <div className="mt-2 text-xs text-muted-foreground">{operationsStatus.service}</div>
            </div>
          </div>
        ) : (
          <EmptyState title="Operations status unavailable" />
        )}
      </section>

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
        <div className="min-w-[1100px]">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_120px_120px_180px_180px] gap-x-4 bg-muted px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
            <span>Organization</span>
            <span>Slug</span>
            <span>Country</span>
            <span>Users</span>
            <span>Products</span>
            <span>Billing plan</span>
            <span>Subscription</span>
          </div>
          {(organizations.data?.items ?? []).map((organization) => (
            <div key={organization.id} className="grid grid-cols-[1.5fr_1fr_1fr_120px_120px_180px_180px] items-center gap-x-4 border-t border-border px-4 py-3 text-sm">
              <span className="truncate font-medium">{organization.name}</span>
              <span className="truncate text-muted-foreground">{organization.slug}</span>
              <span>{organization.country}</span>
              <span>{organization.user_count}</span>
              <span>{organization.product_count}</span>
              <span className="truncate text-muted-foreground">
                {organization.billing_plan_name ?? "Starter"} · {organization.billing_cycle ?? "monthly"}
              </span>
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
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div>
              <h2 className="font-semibold">Platform Audit Logs</h2>
              <p className="text-sm text-muted-foreground">Search tenant, actor, or entity activity.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_140px]">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
                <Input
                  className="pl-9"
                  placeholder="Search logs"
                  value={auditSearch}
                  onChange={(event) => setAuditSearch(event.target.value)}
                />
              </div>
              <Select value={auditAction} onChange={(event) => setAuditAction(event.target.value)}>
                <option value="">All actions</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="login">Login</option>
                <option value="export">Export</option>
              </Select>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {auditLogs.isFetching ? <LoadingState label="Loading audit logs" /> : null}
            {!auditLogs.isFetching && (auditLogs.data?.items ?? []).slice(0, 8).map((log) => (
              <div key={log.id} className="rounded-md border border-border px-4 py-3 text-sm">
                <div className="font-medium">{log.description ?? `${log.action} ${log.entity_type.replace("_", " ")}`}</div>
                <div className="text-muted-foreground">
                  {log.organization_name ?? "Platform"} · {log.actor_full_name ?? log.actor_email ?? "System"}
                </div>
                <div className="text-muted-foreground">{new Date(log.created_at).toLocaleString()}</div>
              </div>
            ))}
            {!auditLogs.isFetching && !auditLogs.data?.items.length ? <EmptyState title="No audit logs found" /> : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function formatStatus(status: string) {
  return status.replace("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatUptime(seconds: number) {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function statusClass(status: string) {
  if (status === "ok") return "bg-primary/10 text-primary";
  if (status === "degraded") return "bg-amber-500/10 text-amber-600 dark:text-amber-300";
  return "bg-destructive/10 text-destructive";
}
