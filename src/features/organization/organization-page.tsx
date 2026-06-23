import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CheckCircle2, MailPlus, Shield, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { KPIWidget } from "@/components/ui/kpi-widget";
import { LoadingState } from "@/components/ui/loading-state";
import { Select } from "@/components/ui/select";
import { api, User } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

type InviteRole = "org_admin" | "org_user";

export function OrganizationPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InviteRole>("org_user");
  const teamQuery = useQuery({ queryKey: ["organization", "team"], queryFn: api.team });
  const auditQuery = useQuery({ queryKey: ["organization", "audit-logs"], queryFn: () => api.auditLogs(20) });
  const isAdmin = currentUser?.role === "org_admin" || currentUser?.role === "super_admin";

  const inviteMutation = useMutation({
    mutationFn: () => api.inviteUser({ email: inviteEmail, full_name: inviteName, role: inviteRole }),
    onSuccess: () => {
      setInviteName("");
      setInviteEmail("");
      setInviteRole("org_user");
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
    meta: {
      successMessage: "Team member invited",
      errorMessage: "Could not invite team member",
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<Pick<User, "role" | "is_active">> }) =>
      api.updateTeamMember(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organization"] }),
    meta: {
      successMessage: "Team member updated",
      errorMessage: "Could not update team member",
    },
  });
  const removeMutation = useMutation({
    mutationFn: api.removeTeamMember,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organization"] }),
    meta: {
      successMessage: "Team member removed",
      errorMessage: "Could not remove team member",
    },
  });

  const onInvite = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    inviteMutation.mutate();
  };

  if (teamQuery.isLoading || auditQuery.isLoading) return <LoadingState label="Loading organization" />;
  if (!teamQuery.data) return <EmptyState title="Organization unavailable" />;

  const { organization, members } = teamQuery.data;
  const activeMembers = members.filter((member) => member.is_active).length;
  const admins = members.filter((member) => member.role === "org_admin").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Organization Management</h1>
        <p className="text-sm text-muted-foreground">
          Manage tenant profile, team access, roles, and organization activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPIWidget label="Organization" value={organization.name} trend={organization.slug} icon={<Building2 size={18} />} />
        <KPIWidget label="Subscription" value={formatStatus(organization.subscription_status)} trend={organization.country} icon={<CheckCircle2 size={18} />} />
        <KPIWidget label="Team members" value={members.length.toLocaleString()} trend={`${activeMembers} active`} icon={<Users size={18} />} />
        <KPIWidget label="Admins" value={admins.toLocaleString()} trend="Organization admins" icon={<Shield size={18} />} />
      </div>

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold">Invite Team Member</h2>
            <p className="text-sm text-muted-foreground">New users receive temporary demo credentials for this portfolio build.</p>
          </div>
          {!isAdmin ? <span className="text-sm text-muted-foreground">Only admins can invite members.</span> : null}
        </div>
        <form className="grid gap-3 md:grid-cols-[1fr_1fr_180px_auto]" onSubmit={onInvite}>
          <Input
            placeholder="Full name"
            value={inviteName}
            onChange={(event) => setInviteName(event.target.value)}
            disabled={!isAdmin || inviteMutation.isPending}
            required
          />
          <Input
            type="email"
            placeholder="Email address"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            disabled={!isAdmin || inviteMutation.isPending}
            required
          />
          <Select
            value={inviteRole}
            onChange={(event) => setInviteRole(event.target.value as InviteRole)}
            disabled={!isAdmin || inviteMutation.isPending}
          >
            <option value="org_user">User</option>
            <option value="org_admin">Admin</option>
          </Select>
          <Button disabled={!isAdmin || inviteMutation.isPending}>
            <MailPlus size={16} /> Invite
          </Button>
        </form>
      </section>

      <section className="overflow-x-auto rounded-lg border border-border bg-card">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-[1.4fr_1.6fr_170px_130px_180px] gap-x-4 bg-muted px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span className="text-right">Action</span>
          </div>
          {members.map((member) => (
            <div key={member.id} className="grid grid-cols-[1.4fr_1.6fr_170px_130px_180px] items-center gap-x-4 border-t border-border px-4 py-3 text-sm">
              <span className="truncate font-medium">{member.full_name}</span>
              <span className="truncate text-muted-foreground">{member.email}</span>
              <Select
                value={member.role}
                disabled={!isAdmin || member.id === currentUser?.id || member.role === "super_admin" || updateMutation.isPending}
                onChange={(event) => updateMutation.mutate({ id: member.id, values: { role: event.target.value as User["role"] } })}
              >
                <option value="org_user">User</option>
                <option value="org_admin">Admin</option>
              </Select>
              <button
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  member.is_active ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-muted text-muted-foreground"
                }`}
                disabled={!isAdmin || member.id === currentUser?.id || updateMutation.isPending}
                onClick={() => updateMutation.mutate({ id: member.id, values: { is_active: !member.is_active } })}
              >
                {member.is_active ? "Active" : "Inactive"}
              </button>
              <div className="flex justify-end">
                <Button
                  variant="danger"
                  size="icon"
                  aria-label={`Remove ${member.full_name}`}
                  disabled={!isAdmin || member.id === currentUser?.id || removeMutation.isPending}
                  onClick={() => {
                    if (window.confirm(`Remove ${member.full_name} from ${organization.name}?`)) {
                      removeMutation.mutate(member.id);
                    }
                  }}
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4">
          <h2 className="font-semibold">Audit Trail</h2>
          <p className="text-sm text-muted-foreground">Recent tenant activity across organization and team operations.</p>
        </div>
        {auditQuery.data?.items.length ? (
          <div className="space-y-3">
            {auditQuery.data.items.map((log) => (
              <div key={log.id} className="flex flex-col justify-between gap-2 rounded-md border border-border px-4 py-3 text-sm md:flex-row md:items-center">
                <div>
                  <div className="font-medium">{formatAuditAction(log.action)} {log.entity_type.replace("_", " ")}</div>
                  <div className="text-muted-foreground">{log.entity_id ?? "Organization scope"}</div>
                </div>
                <div className="text-muted-foreground">{new Date(log.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No audit activity yet" />
        )}
      </section>
    </div>
  );
}

function formatStatus(status: string) {
  return status.replace("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatAuditAction(action: string) {
  return action.charAt(0).toUpperCase() + action.slice(1);
}
