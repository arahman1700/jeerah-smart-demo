import { CaretRight, Crown, Translate, UserCircle, Wallet } from "@phosphor-icons/react";
import type { FlowControls } from "../../../mobile/FlowStack";
import { useDemoState } from "../../data/DemoProvider";
import { currentResident, isSubscriber, residentOrders, residentPlans } from "../../domain/residentView";
import { useI18n } from "../../i18n/I18nProvider";
import { residentRoleMessageKey } from "../../i18n/messages";
import { getResidentRoute } from "../ResidentApp";
import { ResidentPage } from "../components/ResidentPage";

/** The resident's own identity, membership, and shortcuts. No other resident. */
export function ProfilePage({ flow }: { flow: FlowControls }) {
  const state = useDemoState();
  const { locale, setLocale, t } = useI18n();
  const resident = currentResident(state);
  const unit = state.units.find((item) => item.id === resident?.unitId);
  const building = state.buildings.find((item) => item.id === state.currentBuildingId);
  const subscriber = isSubscriber(state);
  const nextLocale = locale === "ar" ? "en" : "ar";

  return (
    <ResidentPage screen="profile" footerClearance>
      <header className="resident-page-title">
        <span className="resident-page-title__icon" aria-hidden="true"><UserCircle weight="duotone" /></span>
        <h1>{resident?.name[locale] ?? t("app.name")}</h1>
        <p className="resident-page-title__intro">{t("resident.profile_intro")}</p>
      </header>

      {resident ? (
        <dl className="resident-card resident-facts">
          <div>
            <dt>{t("table.status")}</dt>
            <dd>{t(residentRoleMessageKey[resident.role])}</dd>
          </div>
          <div>
            <dt>{t("profile.home")}</dt>
            <dd>{unit?.label[locale]} · {building?.name[locale]}</dd>
          </div>
          <div>
            <dt>{t("profile.membership")}</dt>
            <dd data-testid="profile-membership">{subscriber ? t("profile.member") : t("profile.guest")}</dd>
          </div>
          <div>
            <dt>{t("nav.orders")}</dt>
            <dd className="jeerah-numeric">{residentOrders(state).length}</dd>
          </div>
          <div>
            <dt>{t("nav.plans")}</dt>
            <dd className="jeerah-numeric">{residentPlans(state).length}</dd>
          </div>
        </dl>
      ) : <p className="resident-card resident-empty">{t("resident.unavailable")}</p>}

      <div className="resident-row-list">
        <button type="button" className="resident-card resident-row" data-testid="profile-wallet" onClick={() => flow.push(getResidentRoute({ kind: "wallet" }))}>
          <Wallet aria-hidden="true" weight="duotone" />
          <span className="resident-row__copy"><strong>{t("profile.wallet_row")}</strong></span>
          <CaretRight aria-hidden="true" weight="bold" />
        </button>
        <button type="button" className="resident-card resident-row" onClick={() => flow.push(getResidentRoute({ kind: "offers" }))}>
          <Crown aria-hidden="true" weight="duotone" />
          <span className="resident-row__copy"><strong>{t("market.exclusive_title")}</strong></span>
          <CaretRight aria-hidden="true" weight="bold" />
        </button>
        <button type="button" className="resident-card resident-row" onClick={() => flow.push(getResidentRoute({ kind: "plans" }))}>
          <span className="resident-row__copy"><strong>{t("plan.title")}</strong></span>
          <CaretRight aria-hidden="true" weight="bold" />
        </button>
        <button type="button" className="resident-card resident-row" onClick={() => void setLocale(nextLocale)}>
          <Translate aria-hidden="true" weight="duotone" />
          <span className="resident-row__copy">
            <strong>{t("profile.language")}</strong>
            <small>{t(nextLocale === "ar" ? "language.switch_to_arabic" : "language.switch_to_english")}</small>
          </span>
          <CaretRight aria-hidden="true" weight="bold" />
        </button>
        <button type="button" className="resident-card resident-row" onClick={() => flow.replace(getResidentRoute({ kind: "root", id: "install" }))}>
          <span className="resident-row__copy"><strong>{t("nav.install")}</strong></span>
          <CaretRight aria-hidden="true" weight="bold" />
        </button>
      </div>
    </ResidentPage>
  );
}
