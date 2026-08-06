import { Bell, CaretRight, ChatCircleDots, Storefront, Translate } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import type { FlowControls } from "../../../mobile/FlowStack";
import { MobileScroll } from "../../../mobile/MobileScroll";
import { assetUrl } from "../../assets/url";
import { useDemoState } from "../../data/DemoProvider";
import { calculateCommunityPulse } from "../../domain/communityPulse";
import type { Activity, Invoice } from "../../domain/models";
import { JeerahLogo } from "../../design/JeerahLogo";
import { useI18n } from "../../i18n/I18nProvider";
import { getBuildingScreen, getResidentScreen } from "../ResidentApp";
import { ActivityFeed } from "../components/ActivityFeed";
import { CommunityPulseCard } from "../components/CommunityPulseCard";
import { getResidentAsset } from "../components/PropertyGallery";
import { QuickActions } from "../components/QuickActions";

/** Newest first, with ties broken by id and then by seeded source order. */
export function orderedBuildingActivities(activities: Activity[], buildingId?: string) {
  if (!buildingId) return [];
  return activities
    .map((activity, sourceIndex) => ({ activity, sourceIndex }))
    .filter(({ activity }) => activity.buildingId === buildingId)
    .sort((left, right) => (
      Date.parse(right.activity.occurredAt) - Date.parse(left.activity.occurredAt)
      || left.activity.id.localeCompare(right.activity.id)
      || left.sourceIndex - right.sourceIndex
    ))
    .map(({ activity }) => activity);
}

/** Soonest unpaid invoice for the signed-in resident in their current building. */
export function nextResidentInvoice(invoices: Invoice[], residentId?: string, buildingId?: string) {
  if (!residentId || !buildingId) return undefined;
  return invoices
    .map((invoice, sourceIndex) => ({ invoice, sourceIndex }))
    .filter(({ invoice }) => (
      invoice.buildingId === buildingId && invoice.residentId === residentId && invoice.status !== "paid"
    ))
    .sort((left, right) => (
      Date.parse(left.invoice.dueDate) - Date.parse(right.invoice.dueDate)
      || left.invoice.id.localeCompare(right.invoice.id)
      || left.sourceIndex - right.sourceIndex
    ))[0]?.invoice;
}

export function HomePage({ flow }: { flow: FlowControls }) {
  const state = useDemoState();
  const { locale, setLocale, t } = useI18n();
  const reduceMotion = useReducedMotion();

  const resident = state.residents.find((item) => item.id === state.currentResidentId);
  const building = state.buildings.find((item) => item.id === state.currentBuildingId);
  const invoice = nextResidentInvoice(state.invoices, resident?.id, building?.id);
  const activities = orderedBuildingActivities(state.activities, building?.id);
  const pulse = building ? calculateCommunityPulse(state, building.id) : undefined;
  const heroAsset = getResidentAsset(building?.imageIds[0] ?? "");
  const demoNow = invoice?.createdAt ?? activities[0]?.occurredAt ?? new Date().toISOString();
  const nextLocale = locale === "ar" ? "en" : "ar";

  const openCommunity = () => flow.replace(getResidentScreen("community"));
  const openMarketplace = () => flow.replace(getResidentScreen("marketplace"));
  const openExpenses = () => flow.replace(getResidentScreen("expenses"));

  return (
    <MobileScroll className="resident-mobile-page">
      <div
        className="resident-page-content resident-page-content--footer-clearance"
        data-testid="resident-page-content"
        data-resident-screen="home"
      >
        <header className="resident-hero">
          {heroAsset ? (
            <img className="resident-hero__photo" src={assetUrl(heroAsset.path)} alt={heroAsset.alt[locale]} draggable={false} />
          ) : null}
          <span
            className="resident-hero__pattern"
            aria-hidden="true"
            style={{ backgroundImage: `url(${assetUrl("brand/patterns/pattern-overlay.png")})` }}
          />

          <div className="resident-hero__topbar">
            <span className="resident-hero__logo"><JeerahLogo locale={locale} background="dark" /></span>
            <div className="resident-hero__actions">
              <button type="button" className="resident-locale-toggle" onClick={() => void setLocale(nextLocale)}>
                <Translate aria-hidden="true" weight="duotone" />
                {t(nextLocale === "ar" ? "language.arabic" : "language.english")}
              </button>
              <button type="button" className="resident-icon-button" aria-label={t("resident.messages")} onClick={openCommunity}>
                <ChatCircleDots aria-hidden="true" weight="duotone" />
              </button>
              <motion.button
                type="button"
                className="resident-icon-button"
                aria-label={t("resident.notifications")}
                onClick={openCommunity}
                animate={reduceMotion ? undefined : { rotate: [0, -7, 7, -4, 4, 0] }}
                transition={{ type: "spring", stiffness: 360, damping: 17, delay: 0.55 }}
              >
                <Bell aria-hidden="true" weight="duotone" />
                <span className="resident-icon-button__dot" aria-hidden="true" />
              </motion.button>
            </div>
          </div>

          <div className="resident-hero__greeting">
            <div className="resident-hero__greeting-copy">
              <time dateTime={demoNow}>
                {new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
                  weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Riyadh",
                }).format(new Date(demoNow))}
              </time>
              {resident ? <p>{t("resident.good_afternoon")}</p> : null}
              <h1>{resident ? resident.name[locale] : t("app.name")}</h1>
            </div>
            {resident ? (
              <span className="resident-hero__avatar" aria-hidden="true">
                {Array.from(resident.name[locale])[0]}
              </span>
            ) : null}
          </div>
        </header>

        <div className="resident-home-body">
          <CommunityPulseCard
            building={building}
            pulse={pulse}
            invoice={invoice}
            onOpenBuilding={() => building && flow.push(getBuildingScreen(building.id))}
            onPay={openExpenses}
          />

          <QuickActions
            onExpenses={openExpenses}
            onServices={openMarketplace}
            onMarketplace={openMarketplace}
          />

          <ActivityFeed activities={activities.slice(0, 2)} locale={locale} onViewAll={openCommunity} />

          <button type="button" className="resident-card resident-market-banner" onClick={openMarketplace}>
            <span className="resident-market-banner__icon" aria-hidden="true">
              <Storefront weight="duotone" />
            </span>
            <span className="resident-market-banner__copy">
              <strong>{t("resident.marketplace")}</strong>
              <small>{t("resident.marketplace_description")}</small>
            </span>
            <CaretRight aria-hidden="true" weight="bold" />
          </button>
        </div>
      </div>
    </MobileScroll>
  );
}
