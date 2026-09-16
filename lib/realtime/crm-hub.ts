import { getApiBaseUrl } from "@/lib/api/config";
import type { OpportunityChangedEvent } from "@/lib/api/opportunities";
import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

export function createCrmHubConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(`${getApiBaseUrl()}/hubs/crm`, { withCredentials: true })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();
}

export function subscribeToOpportunityChanges(
  connection: HubConnection,
  onChange: (change: OpportunityChangedEvent) => void,
): void {
  connection.on("opportunityChanged", onChange);
}

export async function joinTenantGroup(connection: HubConnection, tenantId: string): Promise<void> {
  await connection.start();
  await connection.invoke("JoinTenant", tenantId);
}
