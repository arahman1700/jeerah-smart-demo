import { calculateCommunityPulse } from "../domain/communityPulse";
import type { DemoState, OrderStatus, ServiceOrder } from "../domain/models";

const TERMINAL_ORDER_STATUSES = new Set<OrderStatus>(["completed", "cancelled", "refunded"]);

export function selectPropertyCount(state: DemoState): number {
  return state.buildings.length;
}

export function selectUnitCounts(state: DemoState) {
  const counts = { total: state.units.length, occupied: 0, vacant: 0, maintenance: 0 };
  for (const unit of state.units) counts[unit.status] += 1;
  return counts;
}

export function selectTotalCollected(state: DemoState): number {
  return state.payments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + payment.amount, 0);
}

export function selectOutstandingBalance(state: DemoState): number {
  return state.invoices
    .filter((invoice) => invoice.status === "due" || invoice.status === "overdue")
    .reduce((sum, invoice) => sum + invoice.total, 0);
}

export function selectOpenOrders(state: DemoState): ServiceOrder[] {
  return state.orders.filter((order) => !TERMINAL_ORDER_STATUSES.has(order.status));
}

export function selectOpenOrderCount(state: DemoState): number {
  return selectOpenOrders(state).length;
}

export function selectAveragePulse(state: DemoState): number {
  if (state.buildings.length === 0) return 0;
  const total = state.buildings.reduce(
    (sum, building) => sum + calculateCommunityPulse(state, building.id).score,
    0,
  );
  return Math.round(total / state.buildings.length);
}

/** Paid collections grouped by calendar month of occurrence, oldest first. */
export function selectCollectionsByMonth(state: DemoState): Array<{ month: string; amount: number }> {
  const byMonth = new Map<string, number>();
  for (const payment of state.payments) {
    if (payment.status !== "paid") continue;
    const month = payment.occurredAt.slice(0, 7);
    byMonth.set(month, (byMonth.get(month) ?? 0) + payment.amount);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }));
}

export function selectOrdersByStatus(state: DemoState): Array<{ status: OrderStatus; count: number }> {
  const byStatus = new Map<OrderStatus, number>();
  for (const order of state.orders) byStatus.set(order.status, (byStatus.get(order.status) ?? 0) + 1);
  return [...byStatus.entries()].map(([status, count]) => ({ status, count }));
}

/** Open orders on units flagged for maintenance, or urgent by scenario semantics. */
export function selectUrgentOrders(state: DemoState): ServiceOrder[] {
  const maintenanceUnitIds = new Set(state.units.filter((unit) => unit.status === "maintenance").map((unit) => unit.id));
  return selectOpenOrders(state)
    .filter((order) => (order.unitId ? maintenanceUnitIds.has(order.unitId) : false) || order.status === "awaiting-quote")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}

export function selectRecentActivities(state: DemoState, limit = 6) {
  return [...state.activities]
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || a.id.localeCompare(b.id))
    .slice(0, limit);
}

export function selectUnitsForBuilding(state: DemoState, buildingId: string) {
  return state.units.filter((unit) => unit.buildingId === buildingId);
}

export function selectResidentsForUnit(state: DemoState, unitId: string) {
  return state.residents.filter((resident) => resident.unitId === unitId);
}
