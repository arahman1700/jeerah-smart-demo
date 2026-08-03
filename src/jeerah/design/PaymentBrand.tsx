import { siApplepay, siVisa } from "simple-icons/icons";
import { assetUrl } from "../assets/url";
import type { PaymentMethod } from "../domain/models";

const vectorBrands = { "apple-pay": siApplepay, visa: siVisa } as const;

export function PaymentBrand({ brand }: { brand: PaymentMethod }) {
  if (brand === "mada") {
    return <img role="img" aria-label="mada" src={assetUrl("brands/mada.svg")} alt="" />;
  }

  const icon = vectorBrands[brand];
  return <svg role="img" aria-label={icon.title} viewBox="0 0 24 24"><path d={icon.path} /></svg>;
}
