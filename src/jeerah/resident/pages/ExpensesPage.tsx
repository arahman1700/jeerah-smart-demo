import { CaretRight, FileText, Receipt } from "@phosphor-icons/react";
import { useState } from "react";
import type { FlowControls } from "../../../mobile/FlowStack";
import { useDemoState } from "../../data/DemoProvider";
import { formatDate, formatSar } from "../../domain/format";
import type { Invoice, InvoiceStatus } from "../../domain/models";
import { invoiceStatusMessageKey } from "../../i18n/messages";
import { useI18n } from "../../i18n/I18nProvider";
import { getInvoiceScreen, getPaymentHistoryScreen } from "../ResidentApp";
import { Ltr, ResidentPage } from "../components/ResidentPage";

export const EXPENSE_FILTERS = ["all", "due", "paid", "overdue", "upcoming"] as const;
export type ExpenseFilter = (typeof EXPENSE_FILTERS)[number];

/** Current resident only, filtered by status, ordered by due date then stable ID. */
export function residentExpenses(invoices: Invoice[], residentId: string | undefined, filter: ExpenseFilter): Invoice[] {
  if (!residentId) return [];
  return invoices
    .filter((invoice) => invoice.residentId === residentId && (filter === "all" || invoice.status === filter))
    .slice()
    .sort((left, right) => Date.parse(left.dueDate) - Date.parse(right.dueDate) || left.id.localeCompare(right.id));
}

export function ExpensesPage({ flow }: { flow: FlowControls }) {
  const state = useDemoState();
  const { locale, t } = useI18n();
  const [filter, setFilter] = useState<ExpenseFilter>("all");

  const resident = state.residents.find((item) => item.id === state.currentResidentId);
  const invoices = residentExpenses(state.invoices, resident?.id, filter);

  return (
    <ResidentPage screen="expenses" footerClearance>
      <header className="resident-page-title">
        <span className="resident-page-title__icon" aria-hidden="true"><FileText weight="duotone" /></span>
        <h1>{t("nav.expenses")}</h1>
        <p className="resident-page-title__intro">{t("resident.track_and_pay")}</p>
      </header>

      {resident ? (
        <>
          <div className="resident-filter-row" role="group" aria-label={t("expenses.filters")}>
            {EXPENSE_FILTERS.map((id) => (
              <button
                key={id}
                type="button"
                className="resident-filter"
                aria-pressed={filter === id}
                data-selected={filter === id ? "true" : "false"}
                onClick={() => setFilter(id)}
              >
                {id === "all" ? t("expenses.filter_all") : t(invoiceStatusMessageKey[id as InvoiceStatus])}
              </button>
            ))}
          </div>

          {invoices.length ? (
            <ul className="resident-row-list">
              {invoices.map((invoice) => (
                <li key={invoice.id}>
                  <button
                    type="button"
                    className="resident-card resident-row"
                    data-testid={`expense-row-${invoice.id}`}
                    onClick={() => flow.push(getInvoiceScreen(invoice.id))}
                  >
                    <FileText aria-hidden="true" weight="duotone" />
                    <span className="resident-row__copy">
                      <strong>{invoice.title[locale]}</strong>
                      <small>
                        {t("resident.due_on", { date: formatDate(invoice.dueDate, locale) })}
                        {" · "}
                        {t(invoiceStatusMessageKey[invoice.status])}
                      </small>
                    </span>
                    <b className="jeerah-numeric"><Ltr>{formatSar(invoice.total, locale)}</Ltr></b>
                    <CaretRight aria-hidden="true" weight="bold" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="resident-card resident-empty">{t("empty.expenses")}</p>
          )}

          <button
            type="button"
            className="resident-secondary-button"
            data-testid="expenses-history"
            onClick={() => flow.push(getPaymentHistoryScreen())}
          >
            <Receipt aria-hidden="true" weight="duotone" />
            <span>{t("invoice.history")}</span>
          </button>
        </>
      ) : (
        <p className="resident-card resident-empty">{t("resident.unavailable")}</p>
      )}
    </ResidentPage>
  );
}
