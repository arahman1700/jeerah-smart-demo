import { QrCode, Receipt, Storefront, Wrench } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useI18n } from "../../i18n/I18nProvider";

export function QuickActions({ onExpenses, onServices, onJoinCode, onMarketplace }: {
  onExpenses: () => void;
  onServices: () => void;
  onJoinCode: () => void;
  onMarketplace: () => void;
}) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const actions = [
    { label: t("nav.expenses"), detail: t("resident.track_and_pay"), icon: Receipt, onClick: onExpenses, tint: "amber" },
    { label: t("nav.services"), detail: t("resident.maintenance"), icon: Wrench, onClick: onServices, tint: "blue" },
    { label: t("resident.join_with_code"), detail: t("resident.enter_invite_code"), icon: QrCode, onClick: onJoinCode, tint: "green" },
    { label: t("nav.marketplace"), detail: t("resident.find_providers"), icon: Storefront, onClick: onMarketplace, tint: "purple" },
  ];

  return (
    <section className="resident-section" aria-labelledby="resident-quick-actions-heading">
      <h2 id="resident-quick-actions-heading" className="resident-eyebrow">{t("resident.quick_actions")}</h2>
      <div className="resident-card resident-quick-actions">
        {actions.map(({ detail, icon: Icon, label, onClick, tint }, index) => (
          <motion.button
            type="button"
            key={label}
            className="resident-quick-actions__item"
            onClick={onClick}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.035 * index, duration: reduceMotion ? 0 : 0.22 }}
          >
            <span className="resident-tint-icon" data-tint={tint} aria-hidden="true"><Icon weight="duotone" /></span>
            <strong>{label}</strong>
            <small>{detail}</small>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
