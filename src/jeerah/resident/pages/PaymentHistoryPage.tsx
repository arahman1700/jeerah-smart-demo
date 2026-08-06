import { Receipt } from "@phosphor-icons/react";
import { useDemoState } from "../../data/DemoProvider";
import { formatDate, formatSar } from "../../domain/format";
import type { Payment } from "../../domain/models";
import { paymentMethodMessageKey, paymentStatusMessageKey } from "../../i18n/messages";
import { useI18n } from "../../i18n/I18nProvider";
import { Ltr, ResidentPage } from "../components/ResidentPage";

/** Committed payments only, newest first, with ties broken by stable ID. */
export function residentPaymentHistory(payments: Payment[], residentId: string | undefined): Payment[] {
  if (!residentId) return [];
  return payments
    .filter((payment) => payment.residentId === residentId)
    .slice()
    .sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt) || left.id.localeCompare(right.id));
}

export function PaymentHistoryPage() {
  const state = useDemoState();
  const { locale, t } = useI18n();
  const resident = state.residents.find((item) => item.id === state.currentResidentId);
  const payments = residentPaymentHistory(state.payments, resident?.id);

  return (
    <ResidentPage screen="payment-history">
      <header className="resident-detail-title">
        <p className="resident-eyebrow">{t("payment.title")}</p>
        <h1>{t("invoice.history")}</h1>
      </header>

      {!resident ? (
        <p className="resident-card resident-empty">{t("resident.unavailable")}</p>
      ) : payments.length ? (
        <ul className="resident-row-list">
          {payments.map((payment) => (
            <li key={payment.id} className="resident-card resident-row" data-testid={`history-row-${payment.id}`}>
              <Receipt aria-hidden="true" weight="duotone" />
              <span className="resident-row__copy">
                <strong>{t(paymentMethodMessageKey[payment.method])}</strong>
                <small>
                  <Ltr>{payment.reference}</Ltr>
                  {" · "}
                  {t(paymentStatusMessageKey[payment.status])}
                  {" · "}
                  {formatDate(payment.occurredAt, locale)}
                </small>
              </span>
              <b className="jeerah-numeric"><Ltr>{formatSar(payment.amount, locale)}</Ltr></b>
            </li>
          ))}
        </ul>
      ) : (
        <p className="resident-card resident-empty">{t("empty.payments")}</p>
      )}
    </ResidentPage>
  );
}
