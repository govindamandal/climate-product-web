import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle2,
  DatabaseZap,
  Filter,
  MailPlus,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { KPIWidget } from "@/components/ui/kpi-widget";
import { LoadingState } from "@/components/ui/loading-state";
import { Select } from "@/components/ui/select";
import { api, DataGovernanceRequest, User } from "@/lib/api";
import { permissionsFor } from "@/lib/permissions";
import { useAuthStore } from "@/stores/auth-store";

type InviteRole = "org_admin" | "org_user";
type DataRequestType = DataGovernanceRequest["request_type"];
type DataRequestSubject = DataGovernanceRequest["subject_type"];

export function OrganizationPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InviteRole>("org_user");
  const [auditSearch, setAuditSearch] = useState("");
  const [auditAction, setAuditAction] = useState("");
  const [auditEntity, setAuditEntity] = useState("");
  const [requestType, setRequestType] = useState<DataRequestType>("export");
  const [subjectType, setSubjectType] = useState<DataRequestSubject>("organization");
  const [subjectId, setSubjectId] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [requestStatus, setRequestStatus] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const teamQuery = useQuery({ queryKey: ["organization", "team"], queryFn: api.team });
  const permissions = permissionsFor(currentUser);
  const privacyQuery = useQuery({ queryKey: ["organization", "privacy-settings"], queryFn: api.privacySettings });
  const dataRequestsQuery = useQuery({
    queryKey: ["organization", "data-requests", requestStatus],
    queryFn: () => api.dataRequests({ status: requestStatus || undefined }),
  });
  const auditQuery = useQuery({
    queryKey: ["organization", "audit-logs", auditSearch, auditAction, auditEntity],
    queryFn: () =>
      api.auditLogs({
        limit: 30,
        search: auditSearch || undefined,
        action: auditAction || undefined,
        entityType: auditEntity || undefined,
      }),
    enabled: permissions.canViewAuditTrail,
  });

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
  const privacyMutation = useMutation({
    mutationFn: api.updatePrivacySettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organization"] }),
    meta: {
      successMessage: "Privacy controls updated",
      errorMessage: "Could not update privacy controls",
    },
  });
  const createRequestMutation = useMutation({
    mutationFn: api.createDataRequest,
    onSuccess: () => {
      setRequestType("export");
      setSubjectType("organization");
      setSubjectId("");
      setRequestReason("");
      queryClient.invalidateQueries({ queryKey: ["organization", "data-requests"] });
      queryClient.invalidateQueries({ queryKey: ["organization", "audit-logs"] });
    },
    meta: {
      successMessage: "Data governance request created",
      errorMessage: "Could not create data governance request",
    },
  });
  const reviewRequestMutation = useMutation({
    mutationFn: ({ id, status, resolution_notes }: { id: string; status: "completed" | "rejected"; resolution_notes?: string }) =>
      api.reviewDataRequest(id, { status, resolution_notes }),
    onSuccess: () => {
      setResolutionNotes({});
      queryClient.invalidateQueries({ queryKey: ["organization", "data-requests"] });
      queryClient.invalidateQueries({ queryKey: ["organization", "audit-logs"] });
    },
    meta: {
      successMessage: "Data governance request updated",
      errorMessage: "Could not update data governance request",
    },
  });

  const onInvite = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    inviteMutation.mutate();
  };

  const onCreateDataRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createRequestMutation.mutate({
      request_type: requestType,
      subject_type: subjectType,
      subject_id: subjectId,
      reason: requestReason,
    });
  };

  if (teamQuery.isLoading || privacyQuery.isLoading || dataRequestsQuery.isLoading || (permissions.canViewAuditTrail && auditQuery.isLoading)) {
    return <LoadingState label="Loading organization" />;
  }
  if (!teamQuery.data) return <EmptyState title="Organization unavailable" />;

  const { organization, members } = teamQuery.data;
  const activeMembers = members.filter((member) => member.is_active).length;
  const admins = members.filter((member) => member.role === "org_admin").length;
  const privacy = privacyQuery.data;
  const openRequests = dataRequestsQuery.data?.items.filter((item) => item.status === "open").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Organization Management</h1>
        <p className="text-sm text-muted-foreground">
          Manage tenant profile, team access, roles, and organization activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KPIWidget label="Organization" value={organization.name} trend={organization.slug} icon={<Building2 size={18} />} />
        <KPIWidget label="Subscription" value={formatStatus(organization.subscription_status)} trend={organization.country} icon={<CheckCircle2 size={18} />} />
        <KPIWidget label="Team members" value={members.length.toLocaleString()} trend={`${activeMembers} active`} icon={<Users size={18} />} />
        <KPIWidget label="Admins" value={admins.toLocaleString()} trend="Organization admins" icon={<Shield size={18} />} />
        <KPIWidget label="Privacy queue" value={openRequests.toLocaleString()} trend="Open requests" icon={<ShieldCheck size={18} />} />
      </div>

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold">Invite Team Member</h2>
            <p className="text-sm text-muted-foreground">New users receive temporary demo credentials for this portfolio build.</p>
          </div>
          {!permissions.canInviteTeam ? <span className="text-sm text-muted-foreground">Only admins can invite members.</span> : null}
        </div>
        <form className="grid gap-3 md:grid-cols-[1fr_1fr_180px_auto]" onSubmit={onInvite}>
          <Input
            placeholder="Full name"
            value={inviteName}
            onChange={(event) => setInviteName(event.target.value)}
            disabled={!permissions.canInviteTeam || inviteMutation.isPending}
            required
          />
          <Input
            type="email"
            placeholder="Email address"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            disabled={!permissions.canInviteTeam || inviteMutation.isPending}
            required
          />
          <Select
            value={inviteRole}
            onChange={(event) => setInviteRole(event.target.value as InviteRole)}
            disabled={!permissions.canInviteTeam || inviteMutation.isPending}
          >
            <option value="org_user">User</option>
            <option value="org_admin">Admin</option>
          </Select>
          <Button disabled={!permissions.canInviteTeam || inviteMutation.isPending}>
            <MailPlus size={16} /> Invite
          </Button>
        </form>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div>
            <h2 className="font-semibold">Privacy And Enterprise Controls</h2>
            <p className="text-sm text-muted-foreground">Configure tenant data handling, AI processing, and export governance.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            <DatabaseZap size={14} /> Updated {privacy ? new Date(privacy.updated_at).toLocaleDateString() : "pending"}
          </div>
        </div>
        {privacy ? (
          <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium">Data region</span>
                <Input
                  key={`region-${privacy.updated_at}`}
                  defaultValue={privacy.data_region}
                  disabled={!permissions.canManagePrivacyControls || privacyMutation.isPending}
                  onBlur={(event) => {
                    if (event.target.value && event.target.value !== privacy.data_region) {
                      privacyMutation.mutate({ data_region: event.target.value });
                    }
                  }}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">Retention period</span>
                <Select
                  value={String(privacy.retention_period_days)}
                  disabled={!permissions.canManagePrivacyControls || privacyMutation.isPending}
                  onChange={(event) => privacyMutation.mutate({ retention_period_days: Number(event.target.value) })}
                >
                  <option value="365">1 year</option>
                  <option value="1095">3 years</option>
                  <option value="2555">7 years</option>
                  <option value="3650">10 years</option>
                </Select>
              </label>
              <label className="space-y-1 text-sm md:col-span-2">
                <span className="font-medium">Data processing contact</span>
                <Input
                  type="email"
                  placeholder="privacy@company.com"
                  key={`contact-${privacy.updated_at}`}
                  defaultValue={privacy.data_processing_contact_email ?? ""}
                  disabled={!permissions.canManagePrivacyControls || privacyMutation.isPending}
                  onBlur={(event) => {
                    const value = event.target.value || null;
                    if (value !== privacy.data_processing_contact_email) {
                      privacyMutation.mutate({ data_processing_contact_email: value });
                    }
                  }}
                />
              </label>
            </div>
            <div className="grid gap-3">
              <PrivacyToggle
                label="Allow AI processing"
                description="Permit product and certificate data to be used for AI advisory and report generation."
                checked={privacy.allow_ai_processing}
                disabled={!permissions.canManagePrivacyControls || privacyMutation.isPending}
                onChange={(checked) => privacyMutation.mutate({ allow_ai_processing: checked })}
              />
              <PrivacyToggle
                label="Allow public DPP sharing"
                description="Permit tokenized public Digital Product Passport links for external buyers and auditors."
                checked={privacy.allow_public_passport_sharing}
                disabled={!permissions.canManagePrivacyControls || privacyMutation.isPending}
                onChange={(checked) => privacyMutation.mutate({ allow_public_passport_sharing: checked })}
              />
              <PrivacyToggle
                label="Require verification before exports"
                description="Force evidence review before compliance-ready exports are shared outside the tenant."
                checked={privacy.require_verification_for_exports}
                disabled={!permissions.canManagePrivacyControls || privacyMutation.isPending}
                onChange={(checked) => privacyMutation.mutate({ require_verification_for_exports: checked })}
              />
            </div>
          </div>
        ) : (
          <EmptyState title="Privacy settings unavailable" />
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex flex-col justify-between gap-3 xl:flex-row xl:items-start">
          <div>
            <h2 className="font-semibold">Data Governance Requests</h2>
            <p className="text-sm text-muted-foreground">Track export, deletion, and correction workflows for tenant data.</p>
          </div>
          <Select className="w-full xl:w-44" value={requestStatus} onChange={(event) => setRequestStatus(event.target.value)}>
            <option value="">All requests</option>
            <option value="open">Open</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </Select>
        </div>
        <form className="mb-5 grid gap-3 xl:grid-cols-[150px_170px_1fr_1.4fr_auto]" onSubmit={onCreateDataRequest}>
          <Select value={requestType} onChange={(event) => setRequestType(event.target.value as DataRequestType)} disabled={createRequestMutation.isPending}>
            <option value="export">Export</option>
            <option value="deletion">Deletion</option>
            <option value="correction">Correction</option>
          </Select>
          <Select value={subjectType} onChange={(event) => setSubjectType(event.target.value as DataRequestSubject)} disabled={createRequestMutation.isPending}>
            <option value="organization">Organization</option>
            <option value="product">Product</option>
            <option value="user">User</option>
            <option value="certificate">Certificate</option>
            <option value="report">Report</option>
          </Select>
          <Input
            placeholder="Subject id or reference"
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            disabled={createRequestMutation.isPending}
          />
          <Input
            placeholder="Reason"
            value={requestReason}
            onChange={(event) => setRequestReason(event.target.value)}
            disabled={createRequestMutation.isPending}
          />
          <Button disabled={createRequestMutation.isPending}>Create</Button>
        </form>
        {dataRequestsQuery.isFetching ? (
          <LoadingState label="Loading data requests" />
        ) : dataRequestsQuery.data?.items.length ? (
          <div className="space-y-3">
            {dataRequestsQuery.data.items.map((request) => (
              <div key={request.id} className="rounded-md border border-border px-4 py-3 text-sm">
                <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{formatStatus(request.request_type)} request</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{request.status}</span>
                      <span className="text-xs text-muted-foreground">{request.subject_type}{request.subject_id ? ` · ${request.subject_id}` : ""}</span>
                    </div>
                    <p className="mt-1 text-muted-foreground">{request.reason || "No reason provided."}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Requested by {request.requested_by_email ?? "Unknown"} on {new Date(request.created_at).toLocaleString()}
                    </p>
                    {request.resolution_notes ? (
                      <p className="mt-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">{request.resolution_notes}</p>
                    ) : null}
                  </div>
                  {permissions.canManagePrivacyControls && request.status === "open" ? (
                    <div className="grid gap-2 lg:w-80">
                      <Input
                        placeholder="Resolution notes"
                        value={resolutionNotes[request.id] ?? ""}
                        onChange={(event) => setResolutionNotes((current) => ({ ...current, [request.id]: event.target.value }))}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={reviewRequestMutation.isPending}
                          onClick={() =>
                            reviewRequestMutation.mutate({
                              id: request.id,
                              status: "rejected",
                              resolution_notes: resolutionNotes[request.id],
                            })
                          }
                        >
                          Reject
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={reviewRequestMutation.isPending}
                          onClick={() =>
                            reviewRequestMutation.mutate({
                              id: request.id,
                              status: "completed",
                              resolution_notes: resolutionNotes[request.id],
                            })
                          }
                        >
                          Complete
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No data governance requests" />
        )}
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
                disabled={!permissions.canManageTeam || member.id === currentUser?.id || member.role === "super_admin" || updateMutation.isPending}
                onChange={(event) => updateMutation.mutate({ id: member.id, values: { role: event.target.value as User["role"] } })}
              >
                <option value="org_user">User</option>
                <option value="org_admin">Admin</option>
              </Select>
              <button
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  member.is_active ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-muted text-muted-foreground"
                }`}
                disabled={!permissions.canManageTeam || member.id === currentUser?.id || updateMutation.isPending}
                onClick={() => updateMutation.mutate({ id: member.id, values: { is_active: !member.is_active } })}
              >
                {member.is_active ? "Active" : "Inactive"}
              </button>
              <div className="flex justify-end">
                <Button
                  variant="danger"
                  size="icon"
                  aria-label={`Remove ${member.full_name}`}
                  disabled={!permissions.canManageTeam || member.id === currentUser?.id || removeMutation.isPending}
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

      {permissions.canViewAuditTrail ? (
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex flex-col justify-between gap-3 xl:flex-row xl:items-end">
            <div>
              <h2 className="font-semibold">Audit Trail</h2>
              <p className="text-sm text-muted-foreground">Filterable tenant activity across organization and team operations.</p>
            </div>
            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_150px_180px]">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
                <Input
                  className="pl-9"
                  placeholder="Search actor or entity"
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
              <Select value={auditEntity} onChange={(event) => setAuditEntity(event.target.value)}>
                <option value="">All entities</option>
                <option value="organization">Organization</option>
                <option value="user_invite">User invite</option>
                <option value="team_member">Team member</option>
                <option value="product">Product</option>
                <option value="certificate_extraction">Certificate extraction</option>
              </Select>
            </div>
          </div>
          {auditQuery.isFetching ? (
            <LoadingState label="Loading audit trail" />
          ) : auditQuery.data?.items.length ? (
            <div className="space-y-3">
              {auditQuery.data.items.map((log) => (
                <div key={log.id} className="flex flex-col justify-between gap-2 rounded-md border border-border px-4 py-3 text-sm md:flex-row md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{log.description ?? `${formatAuditAction(log.action)} ${log.entity_type.replace("_", " ")}`}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        <Filter size={12} /> {log.action}
                      </span>
                    </div>
                    <div className="mt-1 text-muted-foreground">
                      {log.actor_full_name ?? log.actor_email ?? "System"} · {log.entity_id ?? "Organization scope"}
                    </div>
                    {Object.keys(log.metadata_json).length ? (
                      <div className="mt-1 truncate text-xs text-muted-foreground">
                        {JSON.stringify(log.metadata_json)}
                      </div>
                    ) : null}
                  </div>
                  <div className="text-muted-foreground">{new Date(log.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No audit activity yet" />
          )}
        </section>
      ) : (
        <EmptyState title="Audit trail restricted">
          Organization activity logs are available to organization admins.
        </EmptyState>
      )}
    </div>
  );
}

function formatStatus(status: string) {
  return status.replace("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatAuditAction(action: string) {
  return action.charAt(0).toUpperCase() + action.slice(1);
}

function PrivacyToggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-md border border-border p-3 text-sm">
      <span>
        <span className="block font-medium">{label}</span>
        <span className="mt-1 block text-muted-foreground">{description}</span>
      </span>
      <input
        type="checkbox"
        className="mt-1 h-5 w-5 rounded border-border accent-primary"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
