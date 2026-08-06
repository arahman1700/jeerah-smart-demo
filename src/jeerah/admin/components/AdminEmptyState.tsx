import { MagnifyingGlass } from "@phosphor-icons/react";
import { BrandIcon } from "../../design/BrandIcon";
import { useI18n } from "../../i18n/I18nProvider";

export function AdminEmptyState({ onReset }: { onReset: () => void }) {
  const { t } = useI18n();
  return (
    <div className="admin-empty" data-testid="admin-empty-state">
      <span aria-hidden="true">
        <BrandIcon icon={MagnifyingGlass} label="" />
      </span>
      <p>{t("admin.empty_results")}</p>
      <button type="button" className="admin-button admin-button--ghost" onClick={onReset}>
        {t("admin.reset_filters")}
      </button>
    </div>
  );
}
