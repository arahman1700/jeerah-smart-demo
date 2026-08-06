import { HashRouter, Route, Routes } from "react-router-dom";
import { AdminShell } from "./AdminShell";
import { DashboardPage } from "./pages/DashboardPage";
import { PropertiesPage } from "./pages/PropertiesPage";
import { ResidentsPage } from "./pages/ResidentsPage";
import { UnitsPage } from "./pages/UnitsPage";

/** The admin route tree, router-agnostic so tests can mount it in memory. */
export function AdminRoutes() {
  return (
    <AdminShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/units" element={<UnitsPage />} />
        <Route path="/residents" element={<ResidentsPage />} />
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
