import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, PauseCircle, PlugZap, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { Select } from "@/components/ui/select";
import { IntegrationConnection, IntegrationEventDelivery, api } from "@/lib/api";
import { cn } from "@/lib/utils";

const eventOptions = [
  "product.created",
  "product.updated",
  "environmental_record.created",
  "lca.calculation.created",
  "passport.shared",
  "report_pack.created",
];

export function IntegrationsPage() {
  const queryClient = useQueryClient();
  const [connectionType, setConnectionType] = useState<IntegrationConnection["connection_type"]>("webhook");
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [events, setEvents] = useState<string[]>(["product.created", "product.updated", "environmental_record.created"]);
  const connections = useQuery({
    queryKey: ["integrations"],
    queryFn: () => api.integrations(),
  });
  const deliveries = useQuery({
    queryKey: ["integration-deliveries"],
    queryFn: () => api.integrationDeliveries(),
  });
  const createMutation = useMutation({
    mutationFn: () =>
      api.createIntegration({
        name,
        provider,
        connection_type: connectionType,
        webhook_url: webhookUrl || undefined,
        webhook_secret: secret || undefined,
        events,
        config: { owner: provider || "operations" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      setName("");
      setProvider("");
      setWebhookUrl("");
      setSecret("");
    },
    meta: {
      successMessage: "Integration connection created",
      errorMessage: "Could not create integration connection",
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status?: IntegrationConnection["status"]; is_active?: boolean } }) =>
      api.updateIntegration(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
    meta: {
      successMessage: "Integration updated",
      errorMessage: "Could not update integration",
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteIntegration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
    meta: {
      successMessage: "Integration paused",
      errorMessage: "Could not pause integration",
    },
  });
  const testMutation = useMutation({
    mutationFn: (id: string) => api.testIntegration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      queryClient.invalidateQueries({ queryKey: ["integration-deliveries"] });
    },
    meta: {
      successMessage: "Integration test delivery recorded",
      errorMessage: "Could not test integration",
    },
  });

  const toggleEvent = (event: string) => {
    setEvents((current) =>
      current.includes(event) ? current.filter((item) => item !== event) : [...current, event],
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Connect product, LCA, DPP, and reporting events to buyer portals, ERP systems, and downstream evidence tools.
        </p>
      </div>

      <section className="grid gap-4 rounded-lg border border-border bg-card p-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Connection name" value={name} onChange={(event) => setName(event.target.value)} />
          <Input placeholder="Provider or system" value={provider} onChange={(event) => setProvider(event.target.value)} />
          <Select
            value={connectionType}
            onChange={(event) => setConnectionType(event.target.value as IntegrationConnection["connection_type"])}
          >
            <option value="webhook">Webhook</option>
            <option value="erp">ERP</option>
            <option value="lca_database">LCA database</option>
            <option value="storage">Storage</option>
          </Select>
          <Input placeholder="Webhook URL" value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} />
          <Input
            placeholder="Webhook secret"
            type="password"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
          />
          <Button
            disabled={!name || !provider || (connectionType === "webhook" && !webhookUrl) || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            <PlugZap size={16} /> Create connection
          </Button>
        </div>
        <div className="space-y-3">
          <div>
            <h2 className="font-semibold">Subscribed events</h2>
            <p className="text-sm text-muted-foreground">Choose the events this connection should receive.</p>
          </div>
          <div className="grid gap-2">
            {eventOptions.map((event) => (
              <label key={event} className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm">
                <input
                  className="h-4 w-4 accent-primary"
                  type="checkbox"
                  checked={events.includes(event)}
                  onChange={() => toggleEvent(event)}
                />
                {event}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Connections</h2>
            <p className="text-sm text-muted-foreground">Admin-managed integration endpoints and external systems.</p>
          </div>
          <div className="text-sm text-muted-foreground">{connections.data?.total ?? 0} configured</div>
        </div>
        {connections.isLoading ? (
          <LoadingState label="Loading integrations" />
        ) : connections.data?.items.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {connections.data.items.map((connection) => (
              <ConnectionCard
                key={connection.id}
                connection={connection}
                pending={updateMutation.isPending || deleteMutation.isPending || testMutation.isPending}
                onToggle={() =>
                  updateMutation.mutate({
                    id: connection.id,
                    payload: {
                      is_active: !connection.is_active,
                      status: connection.is_active ? "paused" : "active",
                    },
                  })
                }
                onTest={() => testMutation.mutate(connection.id)}
                onDelete={() => deleteMutation.mutate(connection.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No integrations configured" />
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Delivery log</h2>
            <p className="text-sm text-muted-foreground">Recent queued and delivered integration events.</p>
          </div>
          <div className="text-sm text-muted-foreground">{deliveries.data?.total ?? 0} events</div>
        </div>
        {deliveries.isLoading ? (
          <LoadingState label="Loading integration deliveries" />
        ) : deliveries.data?.items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">Event</th>
                  <th className="py-2 pr-4">Entity</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Attempts</th>
                  <th className="py-2 pr-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.data.items.map((delivery) => (
                  <DeliveryRow key={delivery.id} delivery={delivery} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No integration deliveries yet" />
        )}
      </section>
    </div>
  );
}

function ConnectionCard({
  connection,
  pending,
  onToggle,
  onTest,
  onDelete,
}: {
  connection: IntegrationConnection;
  pending: boolean;
  onToggle: () => void;
  onTest: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-md border border-border bg-background p-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{connection.name}</h3>
            <span className={cn("rounded-full px-2 py-1 text-xs font-medium", statusClass(connection.status))}>
              {connection.status}
            </span>
            <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
              {connection.connection_type.replace("_", " ")}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {connection.provider} - {connection.webhook_url ?? "Configured without webhook endpoint"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {connection.events_json.map((event) => (
              <span key={event} className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
                {event}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={pending} onClick={onTest}>
            <Send size={16} /> Test
          </Button>
          <Button variant="secondary" disabled={pending} onClick={onToggle}>
            {connection.is_active ? <PauseCircle size={16} /> : <CheckCircle2 size={16} />}
            {connection.is_active ? "Pause" : "Activate"}
          </Button>
          <Button variant="danger" disabled={pending} onClick={onDelete}>
            <Trash2 size={16} /> Delete
          </Button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
        <Meta label="Secret" value={connection.has_secret ? "Configured" : "Not configured"} />
        <Meta label="Last status" value={connection.last_delivery_status ?? "No deliveries"} />
        <Meta label="Updated" value={new Date(connection.updated_at).toLocaleDateString()} />
      </div>
    </article>
  );
}

function DeliveryRow({ delivery }: { delivery: IntegrationEventDelivery }) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-3 pr-4 font-medium">{delivery.event_type}</td>
      <td className="py-3 pr-4 text-muted-foreground">
        {delivery.entity_type} - {delivery.entity_id || "n/a"}
      </td>
      <td className="py-3 pr-4">
        <span className={cn("rounded-full px-2 py-1 text-xs font-medium", statusClass(delivery.status))}>
          {delivery.status}
        </span>
      </td>
      <td className="py-3 pr-4 text-muted-foreground">{delivery.attempts}</td>
      <td className="py-3 pr-4 text-muted-foreground">{new Date(delivery.created_at).toLocaleString()}</td>
    </tr>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

function statusClass(status: string) {
  if (status === "active" || status === "delivered") return "bg-primary/10 text-primary";
  if (status === "failed" || status === "error") return "bg-destructive/10 text-destructive";
  return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200";
}
