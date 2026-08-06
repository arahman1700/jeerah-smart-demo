import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { useDemoDispatch, useDemoState } from "../../data/DemoProvider";
import type { DemoScenario } from "../../domain/models";
import { useI18n } from "../../i18n/I18nProvider";
import { useAdminAnnounce } from "../AdminShell";
import type { MessageKey } from "../../i18n/messages";

const SCENARIOS: Array<{ id: DemoScenario; labelKey: MessageKey }> = [
  { id: "normal", labelKey: "scenario.normal" },
  { id: "empty", labelKey: "scenario.empty" },
  { id: "offline", labelKey: "scenario.offline" },
  { id: "overdue", labelKey: "scenario.overdue" },
  { id: "declined", labelKey: "scenario.declined" },
  { id: "urgent-maintenance", labelKey: "scenario.urgent_maintenance" },
];

export function ScenarioStudio() {
  const state = useDemoState();
  const dispatch = useDemoDispatch();
  const { t } = useI18n();
  const announce = useAdminAnnounce();
  const [selected, setSelected] = useState<DemoScenario>(state.scenario);
  const [confirming, setConfirming] = useState(false);
  const [resetText, setResetText] = useState("");

  return (
    <section className="admin-card" aria-label={t("admin.scenario_studio")}>
      <h2>{t("admin.scenario_studio")}</h2>
      <p className="admin-muted">{t("scenario.reset_instruction")}</p>

      <fieldset className="admin-scenarios">
        <legend>{t("scenario.title")}</legend>
        {SCENARIOS.map((scenario) => (
          <label key={scenario.id} className="admin-scenario" data-selected={selected === scenario.id ? "true" : "false"}>
            <input
              type="radio"
              name="scenario"
              value={scenario.id}
              checked={selected === scenario.id}
              onChange={() => setSelected(scenario.id)}
            />
            <span>{t(scenario.labelKey)}</span>
            {state.scenario === scenario.id ? <span className="admin-demo-badge">{t("admin.active")}</span> : null}
          </label>
        ))}
      </fieldset>
      <button
        type="button"
        className="admin-button admin-button--primary"
        disabled={selected === state.scenario}
        onClick={() => setConfirming(true)}
      >
        {t("admin.apply_scenario")}
      </button>

      <Dialog.Root open={confirming} onOpenChange={setConfirming}>
        <Dialog.Portal>
          <Dialog.Overlay className="admin-drawer__overlay" />
          <Dialog.Content className="admin-dialog" aria-describedby={undefined}>
            <Dialog.Title className="admin-dialog__title">{t("admin.reset_confirmation")}</Dialog.Title>
            <p>{t("admin.scenario_confirm_body")}</p>
            <div className="admin-dialog__actions">
              <Dialog.Close asChild>
                <button type="button" className="admin-button admin-button--ghost">
                  {t("action.cancel")}
                </button>
              </Dialog.Close>
              <button
                type="button"
                className="admin-button admin-button--primary"
                onClick={async () => {
                  await dispatch({ type: "scenario/set", scenario: selected });
                  setConfirming(false);
                  announce(t("admin.saved"));
                }}
              >
                {t("action.confirm")}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="admin-reset">
        <h3>{t("admin.reset_demo")}</h3>
        <label className="admin-field">
          <span>{t("admin.type_reset")}</span>
          <input value={resetText} onChange={(event) => setResetText(event.target.value)} placeholder="RESET" />
        </label>
        <button
          type="button"
          className="admin-button admin-button--primary"
          disabled={resetText !== "RESET"}
          onClick={async () => {
            await dispatch({ type: "demo/reset" });
            setResetText("");
            announce(t("admin.reset_done"));
          }}
        >
          {t("admin.reset_demo")}
        </button>
      </div>
    </section>
  );
}
