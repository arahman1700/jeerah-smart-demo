import { useState } from "react";
import { z } from "zod";
import { useDemoDispatch, useDemoState } from "../../data/DemoProvider";
import { calculateCommunityPulse } from "../../domain/communityPulse";
import type { Building } from "../../domain/models";
import { useI18n } from "../../i18n/I18nProvider";
import { useAdminAnnounce } from "../AdminShell";
import { DataTable } from "../components/DataTable";
import { DialogField, EditDialog } from "../components/EditDialog";
import { selectUnitsForBuilding } from "../selectors";

const localizedField = (message: string) => z.string().trim().min(1, message);

export function PropertiesPage() {
  const state = useDemoState();
  const dispatch = useDemoDispatch();
  const { t, locale } = useI18n();
  const announce = useAdminAnnounce();
  const [editing, setEditing] = useState<Building | null>(null);

  const schema = z.object({
    nameEn: localizedField(t("admin.validation_required")),
    nameAr: localizedField(t("admin.validation_required")),
    addressEn: localizedField(t("admin.validation_required")),
    addressAr: localizedField(t("admin.validation_required")),
    managerEn: localizedField(t("admin.validation_required")),
    managerAr: localizedField(t("admin.validation_required")),
  });

  return (
    <section className="admin-page">
      <h1>{t("nav.properties")}</h1>
      <DataTable
        label={t("nav.properties")}
        rows={state.buildings}
        columns={[
          { key: "name", header: t("table.property"), render: (building) => <strong>{building.name[locale]}</strong> },
          { key: "address", header: t("resident.address"), render: (building) => building.address[locale] },
          { key: "manager", header: t("resident.manager"), render: (building) => building.manager[locale] },
          {
            key: "units",
            header: t("nav.units"),
            render: (building) => selectUnitsForBuilding(state, building.id).length,
          },
          {
            key: "pulse",
            header: t("resident.community_pulse"),
            render: (building) => `${calculateCommunityPulse(state, building.id).score}/100`,
          },
          {
            key: "actions",
            header: t("action.edit"),
            render: (building) => (
              <button
                type="button"
                className="admin-button admin-button--ghost"
                aria-label={`${t("action.edit")} ${building.name[locale]}`}
                onClick={() => setEditing(building)}
              >
                {t("action.edit")}
              </button>
            ),
          },
        ]}
      />

      {editing ? (
        <EditDialog
          title={t("admin.edit_property")}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          onSubmit={async (form) => {
            const parsed = schema.safeParse({
              nameEn: form.get("nameEn"),
              nameAr: form.get("nameAr"),
              addressEn: form.get("addressEn"),
              addressAr: form.get("addressAr"),
              managerEn: form.get("managerEn"),
              managerAr: form.get("managerAr"),
            });
            if (!parsed.success) return parsed.error.issues[0]?.message ?? t("admin.validation_required");
            await dispatch({
              type: "building/updated",
              buildingId: editing.id,
              patch: {
                name: { en: parsed.data.nameEn, ar: parsed.data.nameAr },
                address: { en: parsed.data.addressEn, ar: parsed.data.addressAr },
                manager: { en: parsed.data.managerEn, ar: parsed.data.managerAr },
              },
            });
            announce(t("admin.saved"));
            return null;
          }}
        >
          <DialogField label={t("admin.name_en")} name="nameEn" defaultValue={editing.name.en} />
          <DialogField label={t("admin.name_ar")} name="nameAr" defaultValue={editing.name.ar} />
          <DialogField label={t("admin.address_en")} name="addressEn" defaultValue={editing.address.en} />
          <DialogField label={t("admin.address_ar")} name="addressAr" defaultValue={editing.address.ar} />
          <DialogField label={t("admin.manager_en")} name="managerEn" defaultValue={editing.manager.en} />
          <DialogField label={t("admin.manager_ar")} name="managerAr" defaultValue={editing.manager.ar} />
        </EditDialog>
      ) : null}
    </section>
  );
}
