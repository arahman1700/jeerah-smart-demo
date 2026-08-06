import { ArrowLeft, ArrowRight, CircleNotch, Printer, ShieldWarning } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import type { FlowControls } from "../../../mobile/FlowStack";
import { KeyboardInput, useKeyboard } from "../../../mobile/Keyboard";
import { useDemoDispatch, useDemoState } from "../../data/DemoProvider";
import { formatDate, formatSar } from "../../domain/format";
import { PAYMENT_METHODS, PAYMENT_METHOD_MASK, type PaymentMethod } from "../../domain/models";
import { isAbortError, simulatePayment } from "../../domain/paymentSimulator";
import { PaymentBrand } from "../../design/PaymentBrand";
import {
  paymentMethodMessageKey,
  paymentOutcomeMessageKey,
  paymentStatusMessageKey,
  type MessageKey,
} from "../../i18n/messages";
import { useI18n } from "../../i18n/I18nProvider";
import { getResidentScreen } from "../ResidentApp";
import { usePaymentSimulation } from "../PaymentSimulation";
import { Ltr, ResidentPage } from "../components/ResidentPage";

export type PaymentStep = "method" | "review" | "verify" | "processing" | "result";

/** The only demo code the journey ever accepts, and it is always shown on screen. */
export const DEMO_OTP = "1234";

const methodInstructionKey: Record<PaymentMethod, MessageKey> = {
  "apple-pay": "payment.apple_pay_instruction",
  mada: "payment.otp_instruction",
  visa: "payment.3ds_instruction",
};

const maskLabel = (last4: string) => `•••• ${last4}`;

export function PaymentPage({ invoiceId, flow }: { invoiceId: string; flow: FlowControls }) {
  const state = useDemoState();
  const dispatch = useDemoDispatch();
  const { dir, locale, t } = useI18n();
  const simulation = usePaymentSimulation();
  const keyboard = useKeyboard();

  const [step, setStep] = useState<PaymentStep>("method");
  const [method, setMethod] = useState<PaymentMethod>("mada");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [committedPaymentId, setCommittedPaymentId] = useState<string | null>(null);
  const [failure, setFailure] = useState<MessageKey | null>(null);

  const mountedRef = useRef(true);
  const submittingRef = useRef(false);
  const attemptRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  // Entities are re-selected by stable ID on every render, so an external reset
  // or a synchronized peer can never leave this screen on a captured object.
  const invoice = state.invoices.find((item) => item.id === invoiceId);
  const resident = state.residents.find((item) => item.id === state.currentResidentId);
  const receiptPayment = committedPaymentId
    ? state.payments.find((payment) => payment.id === committedPaymentId)
    : undefined;
  const offline = state.scenario === "offline";
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  if (!invoice || !resident) {
    return (
      <ResidentPage screen="payment">
        <p className="resident-card resident-empty">{invoice ? t("resident.unavailable") : t("invoice.unavailable")}</p>
      </ResidentPage>
    );
  }

  const alreadyPaid = invoice.status === "paid" && step !== "processing" && step !== "result";
  const isCurrentAttempt = (attempt: number) => mountedRef.current && attempt === attemptRef.current;

  /** The single explicit confirm entry point. Never started from an effect. */
  const startPayment = () => {
    if (submittingRef.current || offline || alreadyPaid) return;
    if (method === "mada" && code.trim() !== DEMO_OTP) {
      setCodeError(true);
      return;
    }

    submittingRef.current = true;
    attemptRef.current += 1;
    const attempt = attemptRef.current;
    const controller = new AbortController();
    abortRef.current = controller;
    keyboard.hide();
    setCodeError(false);
    setFailure(null);
    setStep("processing");

    void simulatePayment(
      { invoiceId: invoice.id, residentId: resident.id, method, amount: invoice.total },
      {
        forcedOutcome: simulation.forcedOutcome ?? (state.scenario === "declined" ? "declined" : undefined),
        delayMs: simulation.delayMs,
        now: simulation.now,
        createId: simulation.createId,
        signal: controller.signal,
      },
    )
      .then(async (payment) => {
        if (!isCurrentAttempt(attempt)) return;
        const next = await dispatch({ type: "payment/recorded", payment });
        if (!isCurrentAttempt(attempt)) return;
        const recorded = next.payments.some((item) => item.id === payment.id);
        setCommittedPaymentId(recorded ? payment.id : null);
        setFailure(recorded ? null : "payment.conflict");
        setStep("result");
      })
      .catch((error: unknown) => {
        if (!isCurrentAttempt(attempt)) return;
        setCommittedPaymentId(null);
        setFailure(isAbortError(error) ? "payment.aborted" : "error.payment_failed");
        setStep("result");
      })
      .finally(() => {
        if (isCurrentAttempt(attempt)) submittingRef.current = false;
      });
  };

  const restart = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    attemptRef.current += 1;
    submittingRef.current = false;
    setCommittedPaymentId(null);
    setFailure(null);
    setCode("");
    setCodeError(false);
    setStep("method");
  };

  const goBack = () => {
    if (step === "processing") return;
    keyboard.hide();
    if (step === "result") flow.replace(getResidentScreen("expenses"));
    else if (step === "verify") setStep("review");
    else if (step === "review") setStep("method");
    else flow.pop();
  };

  return (
    <ResidentPage screen="payment">
      <div className="resident-detail-header resident-detail-header--inline" data-print-hide>
        <button type="button" className="resident-back" onClick={goBack} disabled={step === "processing"}>
          <BackIcon aria-hidden="true" weight="bold" />
          <span>{step === "result" ? t("action.done") : t("action.back")}</span>
        </button>
      </div>

      <p className="resident-warning" role="note" data-testid="payment-warning" data-print-hide>
        <ShieldWarning aria-hidden="true" weight="duotone" />
        <span>{t("payment.warning")}</span>
      </p>

      {offline ? <p className="resident-alert" role="alert" data-print-hide>{t("error.offline")}</p> : null}

      {step === "result" ? null : (
        <section className="resident-card resident-summary" aria-label={t("payment.title")}>
          <p className="resident-eyebrow">{t("invoice.title")}</p>
          <h1>{invoice.title[locale]}</h1>
          <p className="resident-summary__meta">
            {t("resident.due_on", { date: formatDate(invoice.dueDate, locale) })}
          </p>
          <p className="resident-summary__amount">
            <span>{t("payment.amount")}</span>
            <strong className="jeerah-numeric"><Ltr testId="payment-amount-value">{formatSar(invoice.total, locale)}</Ltr></strong>
          </p>
        </section>
      )}

      {alreadyPaid ? <p className="resident-card resident-empty">{t("payment.already_paid")}</p> : null}

      <p className="resident-visually-hidden" role="status" aria-live="polite">
        {t(step === "method" ? "payment.select_method" : step === "review" ? "payment.review" : step === "verify" ? "payment.verify" : step === "processing" ? "payment.processing" : "payment.result")}
      </p>

      {!alreadyPaid && step === "method" ? (
        <>
          <fieldset className="resident-card resident-methods" data-testid="payment-step-method">
            <legend>{t("payment.select_method")}</legend>
            {PAYMENT_METHODS.map((id) => {
              const mask = PAYMENT_METHOD_MASK[id];
              return (
                <label key={id} className="resident-method" data-selected={method === id ? "true" : "false"}>
                  <input
                    type="radio"
                    name="jeerah-payment-method"
                    value={id}
                    data-testid={`payment-method-${id}`}
                    checked={method === id}
                    onChange={() => setMethod(id)}
                  />
                  <PaymentBrand brand={id} decorative />
                  <span className="resident-method__copy">
                    <strong>{t(paymentMethodMessageKey[id])}</strong>
                    <small>
                      {mask ? (
                        <>
                          {t("payment.saved_method")}
                          {" · "}
                          <Ltr>{t("payment.ending_in", { last4: mask })}</Ltr>
                        </>
                      ) : t("payment.demo_badge")}
                    </small>
                  </span>
                </label>
              );
            })}
          </fieldset>
          <button type="button" className="resident-primary-button" onClick={() => setStep("review")}>
            {t("action.continue")}
          </button>
        </>
      ) : null}

      {!alreadyPaid && step === "review" ? (
        <section className="resident-card resident-section" data-testid="payment-step-review" aria-label={t("payment.review")}>
          <h2 className="resident-section__title">{t("payment.review")}</h2>
          <dl className="resident-amount-list">
            <div>
              <dt>{t("payment.method")}</dt>
              <dd>{t(paymentMethodMessageKey[method])}</dd>
            </div>
            {PAYMENT_METHOD_MASK[method] ? (
              <div>
                <dt>{t("payment.saved_method")}</dt>
                <dd><Ltr>{maskLabel(PAYMENT_METHOD_MASK[method]!)}</Ltr></dd>
              </div>
            ) : null}
            <div className="resident-amount-list__total">
              <dt>{t("invoice.total")}</dt>
              <dd className="jeerah-numeric"><Ltr>{formatSar(invoice.total, locale)}</Ltr></dd>
            </div>
          </dl>
          <button type="button" className="resident-primary-button" onClick={() => setStep("verify")}>
            {t("action.confirm")}
          </button>
        </section>
      ) : null}

      {!alreadyPaid && step === "verify" ? (
        <section className="resident-card resident-section" data-testid="payment-step-verify" aria-label={t("payment.verify")}>
          <h2 className="resident-section__title">{t("payment.verify")}</h2>

          {PAYMENT_METHOD_MASK[method] ? (
            <p className="resident-saved-method">
              <PaymentBrand brand={method} decorative />
              <span>{t("payment.saved_method")}</span>
              <Ltr testId="payment-mask-value">{maskLabel(PAYMENT_METHOD_MASK[method]!)}</Ltr>
            </p>
          ) : null}

          <p className="resident-instruction">
            {method === "mada"
              ? t(methodInstructionKey.mada, { code: DEMO_OTP })
              : t(methodInstructionKey[method])}
          </p>

          {method === "mada" ? (
            <>
              <p className="resident-demo-otp" data-testid="payment-demo-otp">
                <span>{t("payment.demo_otp")}</span>
                <Ltr>{DEMO_OTP}</Ltr>
              </p>
              <label className="resident-field" htmlFor="jeerah-demo-code">
                <span>{t("payment.otp_label")}</span>
                <KeyboardInput
                  id="jeerah-demo-code"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={4}
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value.replace(/\D/g, "").slice(0, 4));
                    setCodeError(false);
                  }}
                  onBlur={() => keyboard.hide()}
                />
              </label>
              {codeError ? <p className="resident-alert" role="alert">{t("payment.otp_invalid")}</p> : null}
            </>
          ) : null}

          <button
            type="button"
            className="resident-primary-button"
            data-testid="payment-confirm"
            disabled={offline}
            onClick={startPayment}
          >
            {t("payment.confirm_payment")}
          </button>
        </section>
      ) : null}

      {step === "processing" ? (
        <section
          className="resident-card resident-processing"
          data-testid="payment-step-processing"
          aria-busy="true"
          aria-live="polite"
        >
          <CircleNotch aria-hidden="true" weight="duotone" />
          <p>{t("payment.processing")}</p>
        </section>
      ) : null}

      {step === "result" ? (
        receiptPayment ? (
          <section className="resident-card resident-receipt" data-testid="payment-receipt" aria-label={t("payment.receipt")}>
            <h1>{t("payment.receipt")}</h1>
            <p className="resident-receipt__disclaimer" data-testid="payment-disclaimer">{t("payment.disclaimer")}</p>
            <dl className="resident-amount-list">
              <div>
                <dt>{t("invoice.title")}</dt>
                <dd>{invoice.title[locale]}</dd>
              </div>
              <div>
                <dt>{t("payment.method")}</dt>
                <dd>{t(paymentMethodMessageKey[receiptPayment.method])}</dd>
              </div>
              {receiptPayment.last4 ? (
                <div>
                  <dt>{t("payment.saved_method")}</dt>
                  <dd><Ltr testId="payment-mask-value">{maskLabel(receiptPayment.last4)}</Ltr></dd>
                </div>
              ) : null}
              <div>
                <dt>{t("table.status")}</dt>
                <dd>{t(paymentStatusMessageKey[receiptPayment.status])}</dd>
              </div>
              <div>
                <dt>{t("payment.reference")}</dt>
                <dd><Ltr testId="payment-reference-value">{receiptPayment.reference}</Ltr></dd>
              </div>
              <div>
                <dt>{t("table.timestamp")}</dt>
                <dd data-testid="payment-date-value">{formatDate(receiptPayment.occurredAt, locale)}</dd>
              </div>
              <div className="resident-amount-list__total">
                <dt>{t("payment.amount")}</dt>
                <dd className="jeerah-numeric"><Ltr testId="payment-amount-value">{formatSar(receiptPayment.amount, locale)}</Ltr></dd>
              </div>
            </dl>
            <p className="resident-receipt__outcome">{t(paymentOutcomeMessageKey[receiptPayment.status])}</p>

            <div className="resident-actions" data-print-hide>
              <button type="button" className="resident-secondary-button" onClick={() => window.print()}>
                <Printer aria-hidden="true" weight="duotone" />
                <span>{t("action.print")}</span>
              </button>
              {receiptPayment.status === "paid" ? null : (
                <button type="button" className="resident-primary-button" onClick={restart}>
                  {t("payment.change_method")}
                </button>
              )}
            </div>
          </section>
        ) : (
          <section className="resident-card resident-receipt" aria-label={t("payment.result")}>
            <h1>{t("payment.result")}</h1>
            <p className="resident-receipt__disclaimer" data-testid="payment-disclaimer">{t("payment.disclaimer")}</p>
            <p className="resident-alert" role="alert">{t(failure ?? "payment.unavailable")}</p>
            <div className="resident-actions" data-print-hide>
              <button type="button" className="resident-primary-button" onClick={restart}>
                {t("payment.change_method")}
              </button>
            </div>
          </section>
        )
      ) : null}
    </ResidentPage>
  );
}
