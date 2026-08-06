import { useMemo, useState } from "react";
import { useDemoDispatch, useDemoState } from "../../data/DemoProvider";
import { normalizeSearchText } from "../../domain/format";
import type { Unit } from "../../domain/models";
import { unitStatusMessageKey } from "../../i18n/messages";
import { useI18n } from "../../i18n/I18nProvider";
import { useAdminAnnounce } from "../AdminShell";
import { AdminEmptyState } from "../components/AdminEmptyState";
import { DataTable } from "../components/DataTable";
import { EditDialog } from "../components/EditDialog";
import { selectResidentsForUnit } from "../selectors";

const UNIT_STATUSES: Array<Unit["status"]> = ["occupied", "vacant", "maintenance"];

export function UnitsPage() {
  const state = useDemoState();
  const dispatch = useDemoDispatch();
  const { t, locale } = useI18n();
  const announce = useAdminAnnounce();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Unit["status"]>("all");
  const [editing, setEditing] = useState<Unit | null>(null);

  const rows = useMemo(() => {
    const query = normalizeSearchText(search);
    return state.units
      .filter((unit) => statusFilter === "all" || unit.status === statusFilter)
      .filter((unit) => {
        if (!query) return true;
        const building = state.buildings.find((item) => item.id === unit.buildingId);
        const haystack = normalizeSearchText(
          [unit.label.ar, unit.label.en, building?.name.ar ?? "", building?.name.en ?? ""].join(" "),
        );
        return haystack.includes(query);
      })
      .sort((a, b) => a.buildingId.localeCompare(b.buildingId) || a.floor - b.floor || a.id.localeCompare(b.id));
  }, [state, search, statusFilter]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  return (
    <section className="admin-page">
      <h1>{t("nav.units")}</h1>
      <div className="admin-filters">
        <label className="admin-field admin-field--inline">
          <span>{t("admin.search_units")}</span>
          <input
            type="search"
            role="searchbox"
            aria-label={t("admin.search_units")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className="admin-field admin-field--inline">
          <span>{t("admin.status_filter")}</span>
          <select
            aria-label={t("admin.status_filter")}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "all" | Unit["status"])}
          >
            <option value="all">{t("admin.all_statuses")}</option>
            {UNIT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(unitStatusMessageKey[status])}
              </option>
            ))}
          </select>
        </label>
      </div>

      <DataTable
        label={t("nav.units")}
        rows={rows}
        empty={<AdminEmptyState onReset={resetFilters} />}
        columns={[
          { key: "unit", header: t("table.unit"), render: (unit) => <strong>{unit.label[locale]}</strong> },
          {
            key: "property",
            header: t("table.property"),
            render: (unit) => state.buildings.find((item) => item.id === unit.buildingId)?.name[locale] ?? unit.buildingId,
          },
          { key: "floor", header: t("table.floor"), render: (unit) => unit.floor },
          { key: "status", header: t("table.status"), render: (unit) => t(unitStatusMessageKey[unit.status]) },
          {
            key: "residents",
            header: t("nav.residents"),
            render: (unit) => selectResidentsForUnit(state, unit.id).length,
          },
          {
            key: "actions",
            header: t("action.edit"),
            render: (unit) => (
              <button
                type="button"
                className="admin-button admin-button--ghost"
                aria-label={`${t("action.edit")} ${unit.label[locale]}`}
                onClick={() => setEditing(unit)}
              >
                {t("action.edit")}
              </button>
            ),
          },
        ]}
      />

      {editing ? (
        <EditDialog
          title={t("admin.edit_unit")}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          onSubmit={async (form) => {
            const status = form.get("status");
            if (status !== "occupied" && status !== "vacant" && status !== "maintenance") {
              return t("admin.validation_required");
            }
            await dispatch({ type: "unit/updated", unitId: editing.id, patch: { status } });
            announce(t("admin.saved"));
            return null;
          }}
        >
          <label className="admin-field">
            <span>{t("table.status")}</span>
            <select name="status" defaultValue={editing.status}>
              {UNIT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(unitStatusMessageKey[status])}
                </option>
              ))}
            </select>
          </label>
        </EditDialog>
      ) : null}
    </section>
  );
}
