import { CaretRight, MapPin, UsersThree } from "@phosphor-icons/react";
import type { FlowControls } from "../../../mobile/FlowStack";
import { MobileScroll } from "../../../mobile/MobileScroll";
import { useDemoState } from "../../data/DemoProvider";
import { useI18n } from "../../i18n/I18nProvider";
import { getBuildingScreen } from "../ResidentApp";
import { PropertyImage } from "../components/PropertyGallery";

export function PropertiesPage({ flow }: { flow: FlowControls }) {
  const state = useDemoState();
  const { locale, t } = useI18n();

  return (
    <MobileScroll className="resident-mobile-page">
      <div
        className="resident-page-content resident-page-content--footer-clearance resident-page-content--padded"
        data-testid="resident-page-content"
        data-resident-screen="properties"
      >
        <header className="resident-page-title">
          <p className="resident-eyebrow">{t("app.name")}</p>
          <h1>{t("nav.properties")}</h1>
          <p className="resident-page-title__intro">{t("resident.properties_intro")}</p>
        </header>
        {state.buildings.length ? (
          <ul className="resident-property-list">
            {state.buildings.map((building) => {
              const unitCount = state.units.filter((unit) => unit.buildingId === building.id).length;
              return (
                <li key={building.id}>
                  <button
                    type="button"
                    className="resident-card resident-property-card"
                    onClick={() => flow.push(getBuildingScreen(building.id))}
                  >
                    <PropertyImage imageId={building.imageIds[0]} locale={locale} label={building.name[locale]} />
                    <span className="resident-property-card__body">
                      <strong>{building.name[locale]}</strong>
                      <small><MapPin aria-hidden="true" weight="duotone" /> {building.address[locale]}</small>
                      <small><UsersThree aria-hidden="true" weight="duotone" /> {t("message.items", { count: unitCount })}</small>
                    </span>
                    <CaretRight aria-hidden="true" weight="bold" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="resident-card resident-empty">{t("empty.properties")}</p>
        )}
      </div>
    </MobileScroll>
  );
}
