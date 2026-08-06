import { useState } from "react";
import { useDemoDispatch, useDemoState } from "../../data/DemoProvider";
import type { Resident } from "../../domain/models";
import { residentRoleMessageKey, residentStatusMessageKey } from "../../i18n/messages";
import { useI18n } from "../../i18n/I18nProvider";
import { useAdminAnnounce } from "../AdminShell";
import { DataTable } from "../components/DataTable";
import { EditDialog } from "../components/EditDialog";

const RESIDENT_STATUSES: Array<Resident["status"]> = ["active", "invited", "inactive"];
const RESIDENT_ROLES: Array<Resident["role"]> = ["owner", "tenant", "family"];

export function ResidentsPage() {
  const state = useDemoState();
  const dispatch = useDemoDispatch();
  const { t, locale } = useI18n();
  const announce = useAdminAnnounce();
  const [editing, setEditing] = useState<Resident | null>(null);

  const rows = [...state.residents].sort((a, b) => a.unitId.localeCompare(b.unitId) || a.id.localeCompare(b.id));

  return (
    <section className="admin-page">
      <h1>{t("nav.residents")}</h1>
      <DataTable
        label={t("nav.residents")}
        rows={rows}
        columns={[
          { key: "name", header: t("table.resident"), render: (resident) => <strong>{resident.name[locale]}</strong> },
          {
            key: "unit",
            header: t("table.unit"),
            render: (resident) => state.units.find((unit) => unit.id === resident.unitId)?.label[locale] ?? resident.unitId,
          },
          { key: "role", header: t("table.role"), render: (resident) => t(residentRoleMessageKey[resident.role]) },
          { key: "status", header: t("table.status"), render: (resident) => t(residentStatusMessageKey[resident.status]) },
          {
            key: "subscriber",
            header: t("label.subscriber"),
            render: (resident) => (resident.subscriber ? t("label.yes") : t("label.no")),
          },
          {
            key: "actions",
            header: t("action.edit"),
            render: (resident) => (
              <button
                type="button"
                className="admin-button admin-button--ghost"
                aria-label={`${t("action.edit")} ${resident.name[locale]}`}
                onClick={() => setEditing(resident)}
              >
                {t("action.edit")}
              </button>
            ),
          },
        ]}
      />

      {editing ? (
        <EditDialog
          title={t("admin.edit_resident")}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          onSubmit={async (form) => {
            const role = form.get("role");
            const status = form.get("status");
            if (!RESIDENT_ROLES.includes(role as Resident["role"]) || !RESIDENT_STATUSES.includes(status as Resident["status"])) {
              return t("admin.validation_required");
            }
            await dispatch({
              type: "resident/updated",
              residentId: editing.id,
              patch: { role: role as Resident["role"], status: status as Resident["status"] },
            });
            announce(t("admin.saved"));
            return null;
          }}
        >
          <label className="admin-field">
            <span>{t("table.role")}</span>
            <select name="role" defaultValue={editing.role}>
              {RESIDENT_ROLES.map((role) => (
                <option key={role} value={role}>
                  {t(residentRoleMessageKey[role])}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-field">
            <span>{t("table.status")}</span>
            <select name="status" defaultValue={editing.status}>
              {RESIDENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(residentStatusMessageKey[status])}
                </option>
              ))}
            </select>
          </label>
        </EditDialog>
      ) : null}
    </section>
  );
}
