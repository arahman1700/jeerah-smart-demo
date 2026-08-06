import { QrCode, Receipt, Storefront, Wrench, X } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { useI18n } from "../../i18n/I18nProvider";

export function QuickActions({ onExpenses, onServices, onMarketplace }: {
  onExpenses: () => void;
  onServices: () => void;
  onMarketplace: () => void;
}) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const [joinNoticeOpen, setJoinNoticeOpen] = useState(false);
  const actions = [
    { label: t("nav.expenses"), detail: t("resident.track_and_pay"), icon: Receipt, onClick: onExpenses },
    { label: t("nav.services"), detail: t("resident.maintenance"), icon: Wrench, onClick: onServices },
    { label: t("resident.join_with_code"), detail: t("resident.enter_invite_code"), icon: QrCode, onClick: () => setJoinNoticeOpen(true) },
    { label: t("nav.marketplace"), detail: t("resident.find_providers"), icon: Storefront, onClick: onMarketplace },
  ];

  return (
    <section className="resident-section" aria-labelledby="resident-quick-actions-heading">
      <h2 id="resident-quick-actions-heading" className="resident-eyebrow">{t("resident.quick_actions")}</h2>
      <div className="resident-card resident-quick-actions">
        {actions.map(({ detail, icon: Icon, label, onClick }, index) => (
          <motion.button
            type="button"
            key={label}
            className="resident-quick-actions__item"
            onClick={onClick}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.035 * index, duration: reduceMotion ? 0 : 0.22 }}
          >
            <Icon aria-hidden="true" weight="duotone" />
            <strong>{label}</strong>
            <small>{detail}</small>
          </motion.button>
        ))}
      </div>
      {joinNoticeOpen ? (
        <div className="resident-notice" role="status">
          <span>{t("resident.join_notice")}</span>
          <button type="button" className="resident-icon-button resident-icon-button--compact" aria-label={t("action.close")} onClick={() => setJoinNoticeOpen(false)}>
            <X aria-hidden="true" weight="bold" />
          </button>
        </div>
      ) : null}
    </section>
  );
}
