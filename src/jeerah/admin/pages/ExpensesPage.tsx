import { useState } from "react";
import { z } from "zod";
import { useDemoDispatch, useDemoState } from "../../data/DemoProvider";
import { formatDate, formatSar } from "../../domain/format";
import { demoId } from "../../domain/ids";
import { invoiceStatusMessageKey } from "../../i18n/messages";
import { useI18n } from "../../i18n/I18nProvider";
import { useAdminAnnounce } from "../AdminShell";
import { DataTable } from "../components/DataTable";
import { DialogField, EditDialog } from "../components/EditDialog";

export function ExpensesPage() {
  const state = useDemoState();
  const dispatch = useDemoDispatch();
  const { t, locale } = useI18n();
  const announce = useAdminAnnounce();
  const [creating, setCreating] = useState(false);

  const schema = z.object({
    titleEn: z.string().trim().min(1, t("admin.validation_required")),
    titleAr: z.string().trim().min(1, t("admin.validation_required")),
    amount: z.coerce.number().positive(t("admin.validation_positive_amount")),
    dueDate: z
      .string()
      .refine((value) => !Number.isNaN(Date.parse(value)), t("admin.validation_required"))
      .refine((value) => Date.parse(value) >= Date.parse(state.now), t("admin.validation_due_date")),
    buildingId: z.string().refine((value) => state.buildings.some((building) => building.id === value), t("admin.validation_required")),
  });

  const rows = [...state.invoices].sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id));

  return (
    <section className="admin-page">
      <div className="admin-page__header">
        <h1>{t("nav.finance")}</h1>
        <button type="button" className="admin-button admin-button--primary" onClick={() => setCreating(true)}>
          {t("admin.new_invoice")}
        </button>
      </div>
      <DataTable
        label={t("nav.finance")}
        rows={rows}
        columns={[
          { key: "title", header: t("table.invoice"), render: (invoice) => <strong>{invoice.title[locale]}</strong> },
          {
            key: "building",
            header: t("table.property"),
            render: (invoice) => state.buildings.find((building) => building.id === invoice.buildingId)?.name[locale] ?? invoice.buildingId,
          },
          { key: "amount", header: t("table.amount"), render: (invoice) => <bdi>{formatSar(invoice.total, locale)}</bdi> },
          { key: "due", header: t("table.due_date"), render: (invoice) => formatDate(invoice.dueDate, locale) },
          { key: "status", header: t("table.status"), render: (invoice) => t(invoiceStatusMessageKey[invoice.status]) },
        ]}
      />

      {creating ? (
        <EditDialog
          title={t("admin.new_invoice")}
          open
          onOpenChange={(open) => {
            if (!open) setCreating(false);
          }}
          onSubmit={async (form) => {
            const parsed = schema.safeParse({
              titleEn: form.get("titleEn"),
              titleAr: form.get("titleAr"),
              amount: form.get("amount"),
              dueDate: form.get("dueDate"),
              buildingId: form.get("buildingId"),
            });
            if (!parsed.success) return parsed.error.issues[0]?.message ?? t("admin.validation_required");
            const amount = Math.round(parsed.data.amount * 100) / 100;
            await dispatch({
              type: "invoice/created",
              invoice: {
                id: demoId("invoice"),
                buildingId: parsed.data.buildingId,
                title: { en: parsed.data.titleEn, ar: parsed.data.titleAr },
                category: "maintenance",
                subtotal: amount,
                tax: 0,
                total: amount,
                dueDate: new Date(parsed.data.dueDate).toISOString(),
                status: "due",
                createdAt: state.now,
              },
            });
            announce(t("admin.saved"));
            return null;
          }}
        >
          <DialogField label={t("admin.title_en")} name="titleEn" defaultValue="" />
          <DialogField label={t("admin.title_ar")} name="titleAr" defaultValue="" />
          <label className="admin-field">
            <span>{t("table.amount")}</span>
            <input name="amount" type="number" min="1" step="0.01" defaultValue="" />
          </label>
          <label className="admin-field">
            <span>{t("table.due_date")}</span>
            <input name="dueDate" type="date" defaultValue="" />
          </label>
          <label className="admin-field">
            <span>{t("table.property")}</span>
            <select name="buildingId" defaultValue={state.currentBuildingId}>
              {state.buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name[locale]}
                </option>
              ))}
            </select>
          </label>
        </EditDialog>
      ) : null}
    </section>
  );
}
