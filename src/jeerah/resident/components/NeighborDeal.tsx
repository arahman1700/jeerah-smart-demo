import { Info, UsersThree } from "@phosphor-icons/react";
import { formatDate, formatSar } from "../../domain/format";
import type { NeighborDeal as NeighborDealRecord } from "../../domain/models";
import { dealIsOrderable, dealNextThreshold, dealParticipantCount, dealUnitPrice } from "../../domain/serviceCatalog";
import { useI18n } from "../../i18n/I18nProvider";
import { Ltr } from "./ResidentPage";

/**
 * A group price ladder rendered from fixed thresholds. Only the aggregate
 * neighbour count is ever shown — never a name, a unit, or a vote.
 */
export function NeighborDealCard({ deal, title, joined, onJoin }: {
  deal: NeighborDealRecord;
  title: string;
  joined: boolean;
  onJoin: () => void;
}) {
  const { locale, t } = useI18n();
  const count = dealParticipantCount(deal);
  const unitPrice = dealUnitPrice(deal, count);
  const next = dealNextThreshold(deal, count);
  const orderable = dealIsOrderable(deal, count);

  return (
    <section className="resident-card resident-deal" aria-label={title} data-testid={`deal-${deal.id}`}>
      <header className="resident-deal__header">
        <span className="resident-deal__glyph" aria-hidden="true"><UsersThree weight="duotone" /></span>
        <div>
          <p className="resident-eyebrow">{t("deal.neighbor")}</p>
          <h3>{title}</h3>
        </div>
      </header>

      <p className="resident-deal__price">
        <span>{t("deal.current_price")}</span>
        <Ltr testId={`deal-price-${deal.id}`}><b className="jeerah-numeric">{formatSar(unitPrice, locale)}</b></Ltr>
      </p>
      <p className="resident-deal__base">
        {t("deal.base_price")} <Ltr><s className="jeerah-numeric">{formatSar(deal.basePrice, locale)}</s></Ltr>
      </p>

      <ol className="resident-deal__ladder">
        {deal.thresholds.map((tier) => (
          <li key={tier.count} data-reached={count >= tier.count ? "true" : "false"}>
            <span className="jeerah-numeric">{tier.count}</span>
            <Ltr><b className="jeerah-numeric">{formatSar(tier.unitPrice, locale)}</b></Ltr>
          </li>
        ))}
      </ol>

      <p className="resident-deal__progress" data-testid={`deal-progress-${deal.id}`}>
        {t("deal.participants_count", { count })}
      </p>
      <p className="resident-deal__next">
        {next
          ? t("deal.next_tier", { count: next.count - count, price: formatSar(next.unitPrice, locale) })
          : t("deal.best_tier")}
      </p>
      <p className="resident-deal__closes">{t("deal.closes", { date: formatDate(deal.closesAt, locale) })}</p>
      {deal.buildingApproved ? null : <p className="resident-notice">{t("deal.awaiting_approval")}</p>}
      {orderable ? null : <p className="resident-notice">{t("book.group_locked")}</p>}

      <p className="resident-passport__copy resident-deal__privacy">
        <Info aria-hidden="true" weight="duotone" /> {t("deal.privacy")}
      </p>

      <button
        type="button"
        className="resident-primary-button"
        onClick={onJoin}
        disabled={joined}
        data-testid={`deal-join-${deal.id}`}
      >
        {joined ? t("deal.joined") : t("action.join_deal")}
      </button>
    </section>
  );
}
