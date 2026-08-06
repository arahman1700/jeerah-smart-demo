import { siApplepay, siMastercard, siVisa } from "simple-icons/icons";
import { assetUrl } from "../assets/url";
import type { PaymentMethod } from "../domain/models";

const vectorBrands = { "apple-pay": siApplepay, visa: siVisa, mastercard: siMastercard } as const;

/**
 * Official payment artwork only. Pass `decorative` where adjacent visible text
 * already supplies the brand name, so the mark is not announced twice.
 */
export function PaymentBrand({ brand, decorative = false }: { brand: PaymentMethod; decorative?: boolean }) {
  const role = decorative ? undefined : "img";
  const hidden = decorative || undefined;

  if (brand === "mada") {
    return (
      <img
        className="jeerah-payment-brand"
        role={role}
        aria-label={decorative ? undefined : "mada"}
        aria-hidden={hidden}
        src={assetUrl("brands/mada.svg")}
        alt=""
        draggable={false}
      />
    );
  }

  const icon = vectorBrands[brand];
  return (
    <svg
      className="jeerah-payment-brand"
      role={role}
      aria-label={decorative ? undefined : icon.title}
      aria-hidden={hidden}
      viewBox="0 0 24 24"
    >
      <path d={icon.path} />
    </svg>
  );
}
