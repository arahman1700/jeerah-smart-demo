import { useDemoDispatch, useDemoState } from "../../data/DemoProvider";
import { formatDateTime, formatSar } from "../../domain/format";
import { paymentMethodMessageKey, paymentStatusMessageKey } from "../../i18n/messages";
import { useI18n } from "../../i18n/I18nProvider";
import { useAdminAnnounce } from "../AdminShell";
import { PaymentBrand } from "../../design/PaymentBrand";
import { DataTable } from "../components/DataTable";

export function PaymentsPage() {
  const state = useDemoState();
  const dispatch = useDemoDispatch();
  const { t, locale } = useI18n();
  const announce = useAdminAnnounce();

  const rows = [...state.payments].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || a.id.localeCompare(b.id));

  return (
    <section className="admin-page">
      <div className="admin-page__header">
        <h1>{t("nav.payments")}</h1>
        <p className="admin-demo-note">{t("admin.payments_note")}</p>
      </div>
      <div className="admin-table-scroll">
        <table className="admin-table" aria-label={t("nav.payments")}>
          <thead>
            <tr>
              <th scope="col">{t("table.payment_method")}</th>
              <th scope="col">{t("table.amount")}</th>
              <th scope="col">{t("table.status")}</th>
              <th scope="col">{t("table.reference")}</th>
              <th scope="col">{t("table.timestamp")}</th>
              <th scope="col">{t("action.manage")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((payment) => (
              <tr key={payment.id} data-testid={`admin-payment-${payment.id}`}>
                <td>
                  <span className="admin-payment-brand">
                    <PaymentBrand brand={payment.method === "apple-pay" ? "apple-pay" : payment.method} />
                    <span>{t(paymentMethodMessageKey[payment.method])}</span>
                    {payment.last4 ? <bdi>•••• {payment.last4}</bdi> : null}
                  </span>
                </td>
                <td><bdi>{formatSar(payment.amount, locale)}</bdi></td>
                <td>
                  {t(paymentStatusMessageKey[payment.status])}
                  <span className="admin-demo-badge">{t("label.demo_only")}</span>
                </td>
                <td><bdi dir="ltr">{payment.reference}</bdi></td>
                <td>{formatDateTime(payment.occurredAt, locale)}</td>
                <td>
                  {payment.status === "paid" ? (
                    <button
                      type="button"
                      className="admin-button admin-button--ghost"
                      aria-label={`${t("admin.refund")} ${payment.reference}`}
                      onClick={async () => {
                        await dispatch({
                          type: "payment/status-changed",
                          paymentId: payment.id,
                          status: "refunded",
                          occurredAt: state.now,
                        });
                        announce(t("admin.refunded"));
                      }}
                    >
                      {t("admin.refund")}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? <p>{t("empty.payments")}</p> : null}
    </section>
  );
}
