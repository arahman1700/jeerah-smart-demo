import { ArrowCircleDown, ArrowCircleUp, Wallet } from "@phosphor-icons/react";
import { useState } from "react";
import { BottomSheet } from "../../../mobile/BottomSheet";
import { KeyboardInput, useKeyboard } from "../../../mobile/Keyboard";
import { useDemoDispatch, useDemoState } from "../../data/DemoProvider";
import { formatDateTime, formatSar } from "../../domain/format";
import { demoId } from "../../domain/ids";
import { currentResident, residentWalletBalance, residentWalletTransactions } from "../../domain/residentView";
import { useI18n } from "../../i18n/I18nProvider";
import { Ltr } from "../components/ResidentPage";

const TOP_UP_PRESETS = [50, 100, 200, 500];
const MINIMUM_TOP_UP = 10;

/** The simulated wallet: balance, top-up presets, and movement history. */
export function WalletPage() {
  const state = useDemoState();
  const dispatch = useDemoDispatch();
  const { locale, t } = useI18n();
  const resident = currentResident(state);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [amountText, setAmountText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const keyboard = useKeyboard();
  const offline = state.scenario === "offline";

  if (!resident) return <p className="resident-card resident-empty">{t("resident.unavailable")}</p>;

  const balance = residentWalletBalance(state);
  const transactions = residentWalletTransactions(state);

  const submit = async () => {
    const amount = Number(amountText);
    if (!Number.isFinite(amount) || amount < MINIMUM_TOP_UP) {
      setError(t("wallet.minimum", { amount: MINIMUM_TOP_UP }));
      return;
    }
    await dispatch({
      type: "wallet/topped-up",
      transaction: {
        id: demoId("wallet"),
        residentId: resident.id,
        kind: "top-up",
        amount: Math.round(amount * 100) / 100,
        occurredAt: state.now,
        reference: `DEMO-WALLET-${Math.round(amount)}`,
        note: { ar: "شحن تجريبي للمحفظة", en: "Demo wallet top-up" },
      },
    });
    setError(null);
    setConfirmed(true);
    setSheetOpen(false);
    setAmountText("");
  };

  return (
    <article className="resident-wallet" data-testid="wallet-page">
      <header className="resident-page-title">
        <span className="resident-page-title__icon" aria-hidden="true"><Wallet weight="duotone" /></span>
        <h1>{t("wallet.title")}</h1>
        <p className="resident-page-title__intro">{t("wallet.intro")}</p>
      </header>

      <section className="resident-card resident-wallet__balance" aria-label={t("wallet.balance")}>
        <span>{t("wallet.balance")}</span>
        <strong className="jeerah-numeric" data-testid="wallet-balance"><Ltr>{formatSar(balance, locale)}</Ltr></strong>
        <button
          type="button"
          className="resident-primary-button"
          data-testid="wallet-topup-open"
          disabled={offline}
          onClick={() => {
            setConfirmed(false);
            setSheetOpen(true);
          }}
        >
          {t("wallet.top_up")}
        </button>
        {offline ? <p className="resident-alert">{t("error.offline")}</p> : null}
        {confirmed ? <p role="status" data-testid="wallet-confirmed">{t("wallet.confirmed")}</p> : null}
        <p className="resident-muted">{t("payment.demo_disclaimer_short")}</p>
      </section>

      <section aria-label={t("wallet.history")}>
        <h2 className="resident-section-title">{t("wallet.history")}</h2>
        {transactions.length === 0 ? (
          <p className="resident-card resident-empty">{t("wallet.empty")}</p>
        ) : (
          <ul className="resident-wallet__list">
            {transactions.map((transaction) => (
              <li key={transaction.id} className="resident-card" data-testid={`wallet-row-${transaction.id}`}>
                <span aria-hidden="true">
                  {transaction.kind === "top-up" ? <ArrowCircleUp weight="duotone" /> : <ArrowCircleDown weight="duotone" />}
                </span>
                <span className="resident-row__copy">
                  <strong>{transaction.note[locale]}</strong>
                  <small>{formatDateTime(transaction.occurredAt, locale)} · <Ltr>{transaction.reference}</Ltr></small>
                </span>
                <strong className="jeerah-numeric">
                  <Ltr>{`${transaction.kind === "spend" ? "-" : "+"}${formatSar(transaction.amount, locale)}`}</Ltr>
                </strong>
              </li>
            ))}
          </ul>
        )}
      </section>

      <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen} title={t("wallet.top_up")} description={t("wallet.minimum", { amount: MINIMUM_TOP_UP })}>
        <div className="resident-wallet__sheet">
          <div className="resident-wallet__presets" role="group" aria-label={t("wallet.presets")}>
            {TOP_UP_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className="resident-chip-button"
                data-selected={amountText === String(preset) ? "true" : "false"}
                onClick={() => setAmountText(String(preset))}
              >
                <Ltr>{String(preset)}</Ltr>
              </button>
            ))}
          </div>
          <label className="resident-field" htmlFor="jeerah-wallet-amount">
            <span>{t("wallet.custom_amount")}</span>
            <KeyboardInput
              id="jeerah-wallet-amount"
              inputMode="decimal"
              autoComplete="off"
              value={amountText}
              onChange={(event) => {
                setAmountText(event.target.value.replace(/[^0-9.]/g, ""));
                setError(null);
              }}
              onBlur={() => keyboard.hide()}
            />
          </label>
          {error ? <p role="alert" className="resident-alert">{error}</p> : null}
          <p className="resident-muted">{t("payment.demo_disclaimer_short")}</p>
          <button type="button" className="resident-primary-button" data-testid="wallet-topup-confirm" onClick={() => void submit()}>
            {t("wallet.confirm")}
          </button>
        </div>
      </BottomSheet>
    </article>
  );
}
