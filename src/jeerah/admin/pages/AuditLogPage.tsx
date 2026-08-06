import { useDemoState } from "../../data/DemoProvider";
import { formatDateTime } from "../../domain/format";
import { useI18n } from "../../i18n/I18nProvider";
import { useAdminAnnounce } from "../AdminShell";
import { DataTable } from "../components/DataTable";

/** Builds a UTF-8 CSV entirely locally; no server request is ever made. */
function toCsv(rows: string[][]): Blob {
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const body = rows.map((row) => row.map(escape).join(",")).join("\r\n");
  return new Blob([`﻿${body}`], { type: "text/csv;charset=utf-8" });
}

export function AuditLogPage() {
  const state = useDemoState();
  const { t, locale } = useI18n();
  const announce = useAdminAnnounce();

  const rows = [...state.auditLog].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || a.id.localeCompare(b.id));

  const exportCsv = () => {
    const csv = toCsv([
      ["occurredAt", "actor", "action", "entityType", "entityId", "description"],
      ...rows.map((entry) => [entry.occurredAt, entry.actorId, entry.action, entry.entityType, entry.entityId, entry.description[locale]]),
    ]);
    const url = URL.createObjectURL(csv);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "jeerah-demo-audit-log.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    announce(t("admin.exported"));
  };

  return (
    <section className="admin-page">
      <div className="admin-page__header">
        <h1>{t("audit.title")}</h1>
        <button type="button" className="admin-button admin-button--ghost" onClick={exportCsv}>
          {t("admin.export_csv")}
        </button>
      </div>
      <DataTable
        label={t("audit.title")}
        rows={rows}
        empty={<p>{t("empty.audit")}</p>}
        columns={[
          { key: "time", header: t("table.timestamp"), render: (entry) => <time dateTime={entry.occurredAt}>{formatDateTime(entry.occurredAt, locale)}</time> },
          { key: "actor", header: t("audit.actor"), render: (entry) => <bdi dir="ltr">{entry.actorId}</bdi> },
          { key: "action", header: t("audit.action"), render: (entry) => <bdi dir="ltr">{entry.action}</bdi> },
          { key: "entity", header: t("audit.entity"), render: (entry) => <bdi dir="ltr">{`${entry.entityType}:${entry.entityId}`}</bdi> },
          { key: "description", header: t("audit.description"), render: (entry) => entry.description[locale] },
        ]}
      />
    </section>
  );
}
