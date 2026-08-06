import { CalendarDots, Receipt } from "@phosphor-icons/react";
import type { FlowControls } from "../../../mobile/FlowStack";
import { useDemoState } from "../../data/DemoProvider";
import { formatDate, formatSar } from "../../domain/format";
import { invoiceStatusMessageKey } from "../../i18n/messages";
import { useI18n } from "../../i18n/I18nProvider";
import { getPaymentHistoryScreen, getPaymentScreen } from "../ResidentApp";
import { Ltr, ResidentPage } from "../components/ResidentPage";

/** Every value on this screen is derived from the one re-selected invoice entity. */
export function InvoicePage({ invoiceId, flow }: { invoiceId: string; flow: FlowControls }) {
  const state = useDemoState();
  const { locale, t } = useI18n();
  const invoice = state.invoices.find((item) => item.id === invoiceId);

  if (!invoice) {
    return (
      <ResidentPage screen="invoice">
        <p className="resident-card resident-empty">{t("invoice.unavailable")}</p>
      </ResidentPage>
    );
  }

  const isPaid = invoice.status === "paid";

  return (
    <ResidentPage screen="invoice">
      <header className="resident-detail-title">
        <p className="resident-eyebrow">{t("invoice.title")}</p>
        <h1>{invoice.title[locale]}</h1>
        <p className="resident-detail-title__meta">
          <CalendarDots aria-hidden="true" weight="duotone" />
          {t("resident.due_on", { date: formatDate(invoice.dueDate, locale) })}
          {" · "}
          {t(invoiceStatusMessageKey[invoice.status])}
        </p>
      </header>

      <section className="resident-card resident-section" aria-label={t("invoice.breakdown")}>
        <h2 className="resident-section__title">{t("invoice.breakdown")}</h2>
        <dl className="resident-amount-list">
          <div>
            <dt>{t("invoice.subtotal")}</dt>
            <dd className="jeerah-numeric"><Ltr>{formatSar(invoice.subtotal, locale)}</Ltr></dd>
          </div>
          <div>
            <dt>{t("invoice.tax")}</dt>
            <dd className="jeerah-numeric"><Ltr>{formatSar(invoice.tax, locale)}</Ltr></dd>
          </div>
          <div className="resident-amount-list__total">
            <dt>{t("invoice.total")}</dt>
            <dd className="jeerah-numeric"><Ltr testId="invoice-total">{formatSar(invoice.total, locale)}</Ltr></dd>
          </div>
        </dl>
      </section>

      <p className="resident-warning" role="note">{t("payment.warning")}</p>

      {isPaid ? (
        <p className="resident-card resident-empty">{t("payment.already_paid")}</p>
      ) : (
        <button
          type="button"
          className="resident-primary-button"
          data-testid="invoice-pay"
          onClick={() => flow.push(getPaymentScreen(invoice.id))}
        >
          {t("action.pay_now")}
        </button>
      )}

      <button
        type="button"
        className="resident-secondary-button"
        data-testid="invoice-history"
        onClick={() => flow.push(getPaymentHistoryScreen())}
      >
        <Receipt aria-hidden="true" weight="duotone" />
        <span>{t("invoice.history")}</span>
      </button>
    </ResidentPage>
  );
}
