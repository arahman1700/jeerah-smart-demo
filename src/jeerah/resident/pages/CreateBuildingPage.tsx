import { BuildingOffice } from "@phosphor-icons/react";
import { useState } from "react";
import { KeyboardInput, useKeyboard } from "../../../mobile/Keyboard";
import { useDemoDispatch, useDemoState } from "../../data/DemoProvider";
import { demoId } from "../../domain/ids";
import { useI18n } from "../../i18n/I18nProvider";

const FIELDS = [
  { name: "nameAr", labelKey: "create_building.name_ar" },
  { name: "nameEn", labelKey: "create_building.name_en" },
  { name: "addressAr", labelKey: "create_building.address_ar" },
  { name: "addressEn", labelKey: "create_building.address_en" },
] as const;

type FieldName = (typeof FIELDS)[number]["name"];

/**
 * Creates a fictional building through the shared domain, so the admin
 * console sees it live. Manager defaults to the demo operations team.
 */
export function CreateBuildingPage() {
  const state = useDemoState();
  const dispatch = useDemoDispatch();
  const { t } = useI18n();
  const keyboard = useKeyboard();
  const [values, setValues] = useState<Record<FieldName, string>>({ nameAr: "", nameEn: "", addressAr: "", addressEn: "" });
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const offline = state.scenario === "offline";

  const submit = async () => {
    keyboard.hide();
    if (FIELDS.some((field) => values[field.name].trim() === "")) {
      setError(t("admin.validation_required"));
      return;
    }
    const buildingId = demoId("building");
    await dispatch({
      type: "building/created",
      building: {
        id: buildingId,
        name: { ar: values.nameAr.trim(), en: values.nameEn.trim() },
        address: { ar: values.addressAr.trim(), en: values.addressEn.trim() },
        manager: { ar: "فريق جيرة التجريبي", en: "Jeerah Demo Team" },
        imageIds: ["nakheel-court"],
        amenityIds: [],
      },
    });
    setError(null);
    setCreatedId(buildingId);
    setValues({ nameAr: "", nameEn: "", addressAr: "", addressEn: "" });
  };

  return (
    <article className="resident-create-building" data-testid="create-building-page">
      <header className="resident-page-title">
        <span className="resident-page-title__icon" aria-hidden="true"><BuildingOffice weight="duotone" /></span>
        <h1>{t("create_building.title")}</h1>
        <p className="resident-page-title__intro">{t("create_building.intro")}</p>
      </header>

      <section className="resident-card resident-create-building__form">
        {FIELDS.map((field) => (
          <label key={field.name} className="resident-field" htmlFor={`jeerah-create-${field.name}`}>
            <span>{t(field.labelKey)}</span>
            <KeyboardInput
              id={`jeerah-create-${field.name}`}
              autoComplete="off"
              value={values[field.name]}
              onChange={(event) => {
                setValues((current) => ({ ...current, [field.name]: event.target.value }));
                setError(null);
              }}
              onBlur={() => keyboard.hide()}
            />
          </label>
        ))}
        {error ? <p role="alert" className="resident-alert">{error}</p> : null}
        {offline ? <p className="resident-alert">{t("error.offline")}</p> : null}
        <button
          type="button"
          className="resident-primary-button"
          data-testid="create-building-submit"
          disabled={offline}
          onClick={() => void submit()}
        >
          {t("create_building.submit")}
        </button>
        {createdId ? (
          <p role="status" className="resident-card resident-join__joined" data-testid="create-building-success">
            {t("create_building.created")}
          </p>
        ) : null}
        <p className="resident-muted">{t("create_building.demo_note")}</p>
      </section>
    </article>
  );
}
