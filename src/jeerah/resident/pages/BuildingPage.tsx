import { CaretRight, MapPin, UserCircle, UsersThree } from "@phosphor-icons/react";
import type { FlowControls } from "../../../mobile/FlowStack";
import { MobileScroll } from "../../../mobile/MobileScroll";
import { useDemoState } from "../../data/DemoProvider";
import { calculateCommunityPulse } from "../../domain/communityPulse";
import type { Locale } from "../../domain/models";
import { communityPulseStatusMessageKey, unitStatusMessageKey } from "../../i18n/messages";
import { useI18n } from "../../i18n/I18nProvider";
import { getUnitScreen } from "../ResidentApp";
import { PropertyGallery } from "../components/PropertyGallery";

const amenityNames: Record<string, Record<Locale, string>> = {
  lounge: { ar: "صالة السكان", en: "Resident lounge" },
  gym: { ar: "النادي الرياضي للسكان", en: "Resident gym" },
};

const factorLabelKey = {
  collection: "label.collection",
  maintenance: "label.maintenance",
  alerts: "label.alerts",
} as const;

export function BuildingPage({ buildingId, flow }: { buildingId: string; flow: FlowControls }) {
  const state = useDemoState();
  const { locale, t } = useI18n();
  const building = state.buildings.find((item) => item.id === buildingId);

  if (!building) {
    return (
      <MobileScroll className="resident-mobile-page">
        <div
          className="resident-page-content resident-page-content--footer-clearance resident-page-content--padded"
          data-testid="resident-page-content"
          data-resident-screen="building"
        >
          <p className="resident-card resident-empty">{t("empty.properties")}</p>
        </div>
      </MobileScroll>
    );
  }

  const pulse = calculateCommunityPulse(state, building.id);
  const units = state.units.filter((unit) => unit.buildingId === building.id);

  return (
    <MobileScroll className="resident-mobile-page">
      <div
        className="resident-page-content resident-page-content--footer-clearance"
        data-testid="resident-page-content"
        data-resident-screen="building"
      >
        <PropertyGallery imageIds={building.imageIds} locale={locale} label={t("resident.property_gallery")} />

        <div className="resident-detail-body">
          <header className="resident-detail-title">
            <p className="resident-eyebrow">{t("property.building")}</p>
            <h1>{building.name[locale]}</h1>
            <p className="resident-detail-title__meta">
              <MapPin aria-hidden="true" weight="duotone" /> {building.address[locale]}
            </p>
          </header>

          <dl className="resident-card resident-facts">
            <div>
              <dt><UserCircle aria-hidden="true" weight="duotone" /> {t("resident.manager")}</dt>
              <dd>{building.manager[locale]}</dd>
            </div>
            <div>
              <dt><UsersThree aria-hidden="true" weight="duotone" /> {t("nav.units")}</dt>
              <dd className="jeerah-numeric">{units.length}</dd>
            </div>
          </dl>

          <section className="resident-section" aria-labelledby="resident-amenities-heading">
            <h2 id="resident-amenities-heading" className="resident-eyebrow">{t("resident.amenities")}</h2>
            <ul className="resident-chips">
              {building.amenityIds.map((id) => (
                <li key={id}>{amenityNames[id]?.[locale] ?? id}</li>
              ))}
            </ul>
          </section>

          <section className="resident-section" aria-labelledby="resident-pulse-heading">
            <div className="resident-section__heading">
              <h2 id="resident-pulse-heading" className="resident-eyebrow">{t("resident.community_pulse")}</h2>
              <strong className="jeerah-numeric">{pulse.score}/100</strong>
            </div>
            <div className={`resident-card resident-factors resident-factors--${pulse.status}`}>
              <p className="resident-factors__status">{t(communityPulseStatusMessageKey[pulse.status])}</p>
              {pulse.factors.map((factor) => (
                <div className="resident-factor" key={factor.key}>
                  <span>{t(factorLabelKey[factor.key])}</span>
                  <meter min={0} max={100} value={factor.score}>{factor.score}</meter>
                  <strong className="jeerah-numeric">{factor.score}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="resident-section" aria-labelledby="resident-units-heading">
            <h2 id="resident-units-heading" className="resident-eyebrow">{t("nav.units")}</h2>
            {units.length ? (
              <ul className="resident-row-list">
                {units.map((unit) => (
                  <li key={unit.id}>
                    <button type="button" className="resident-card resident-row" onClick={() => flow.push(getUnitScreen(unit.id))}>
                      <span className="resident-row__copy">
                        <strong>{unit.label[locale]}</strong>
                        <small>{t("resident.floor", { floor: unit.floor })} · {t(unitStatusMessageKey[unit.status])}</small>
                      </span>
                      <CaretRight aria-hidden="true" weight="bold" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="resident-card resident-empty">{t("empty.units")}</p>
            )}
          </section>
        </div>
      </div>
    </MobileScroll>
  );
}
