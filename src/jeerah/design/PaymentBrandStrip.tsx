import { PAYMENT_METHODS } from "../domain/models";
import { PaymentBrand } from "./PaymentBrand";

/**
 * A compact, evenly spaced row of every official demo payment mark. Used as a
 * trust strip on the launcher and as a legend on the payment method step.
 */
export function PaymentBrandStrip({ label }: { label: string }) {
  return (
    <ul className="jeerah-payment-brands" role="group" aria-label={label}>
      {PAYMENT_METHODS.map((method) => (
        <li key={method} className="jeerah-payment-brands__item">
          <PaymentBrand brand={method} />
        </li>
      ))}
    </ul>
  );
}
