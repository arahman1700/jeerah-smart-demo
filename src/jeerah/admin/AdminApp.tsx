import { HashRouter, Route, Routes } from "react-router-dom";
import { AdminShell } from "./AdminShell";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { AnnouncementsPage } from "./pages/AnnouncementsPage";
import { ContactMessagesPage } from "./pages/ContactMessagesPage";
import { AuditLogPage } from "./pages/AuditLogPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { MarketplacePage } from "./pages/MarketplacePage";
import { OrdersPage } from "./pages/OrdersPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { PropertiesPage } from "./pages/PropertiesPage";
import { ResidentsPage } from "./pages/ResidentsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SubscriptionsPage } from "./pages/SubscriptionsPage";
import { UnitsPage } from "./pages/UnitsPage";
import { VisitorsAmenitiesPage } from "./pages/VisitorsAmenitiesPage";

/** The admin route tree, router-agnostic so tests can mount it in memory. */
export function AdminRoutes() {
  return (
    <AdminShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/units" element={<UnitsPage />} />
        <Route path="/residents" element={<ResidentsPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/messages" element={<ContactMessagesPage />} />
        <Route path="/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/visitors-amenities" element={<VisitorsAmenitiesPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/audit" element={<AuditLogPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<DashboardPage />} />
      </Routes>
    </AdminShell>
  );
}

/** Hash routing keeps admin deep links refreshable on GitHub Pages. */
export function AdminApp() {
  return (
    <HashRouter>
      <AdminRoutes />
    </HashRouter>
  );
}
