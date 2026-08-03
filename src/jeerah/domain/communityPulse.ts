import type { CommunityPulse, DemoState, OrderStatus } from "./models";

export function calculateCommunityPulse(state: DemoState, buildingId: string): CommunityPulse {
  const buildingInvoices = state.invoices.filter((invoice) => invoice.buildingId === buildingId);
  const paid = buildingInvoices.filter((invoice) => invoice.status === "paid").length;
  const collection = buildingInvoices.length === 0 ? 100 : Math.round((paid / buildingInvoices.length) * 100);
  const terminal = new Set<OrderStatus>(["completed", "cancelled", "refunded"]);
  const openOrders = state.orders.filter((order) => order.buildingId === buildingId && !terminal.has(order.status)).length;
  const urgentAlerts = state.announcements.filter((item) => item.buildingId === buildingId && item.priority === "urgent").length;
  const maintenance = Math.max(0, 100 - openOrders * 8);
  const alerts = Math.max(0, 100 - urgentAlerts * 20);
  const score = Math.round(collection * 0.45 + maintenance * 0.35 + alerts * 0.2);
  return { score, status: score >= 80 ? "healthy" : score >= 60 ? "attention" : "critical", factors: [
    { key: "collection", score: collection }, { key: "maintenance", score: maintenance }, { key: "alerts", score: alerts },
  ] };
}
