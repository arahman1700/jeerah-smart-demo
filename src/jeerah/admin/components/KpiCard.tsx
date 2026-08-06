import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { BrandIcon } from "../../design/BrandIcon";

export function KpiCard({
  icon,
  label,
  value,
  detail,
  testId,
}: {
  icon: Icon;
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  testId: string;
}) {
  return (
    <article className="admin-kpi" data-testid={testId} aria-label={label}>
      <span className="admin-kpi__icon" aria-hidden="true">
        <BrandIcon icon={icon} label="" />
      </span>
      <div className="admin-kpi__body">
        <span className="admin-kpi__label">{label}</span>
        <strong className="admin-kpi__value">{value}</strong>
        {detail ? <span className="admin-kpi__detail">{detail}</span> : null}
      </div>
    </article>
  );
}
