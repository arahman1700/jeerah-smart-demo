import { useState } from "react";
import { z } from "zod";
import { useDemoDispatch, useDemoState } from "../../data/DemoProvider";
import { formatDate, formatSar } from "../../domain/format";
import { demoId } from "../../domain/ids";
import { providerStatusMessageKey, recurringPlanCadenceMessageKey, serviceFulfillmentMessageKey } from "../../i18n/messages";
import { useI18n } from "../../i18n/I18nProvider";
import { useAdminAnnounce } from "../AdminShell";
import { DialogField, EditDialog } from "../components/EditDialog";

export function MarketplacePage() {
  const state = useDemoState();
  const dispatch = useDemoDispatch();
  const { t, locale } = useI18n();
  const announce = useAdminAnnounce();
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [creatingOffer, setCreatingOffer] = useState(false);

  const offerSchema = z.object({
    titleEn: z.string().trim().min(1, t("admin.validation_required")),
    titleAr: z.string().trim().min(1, t("admin.validation_required")),
    serviceId: z.string().refine((value) => state.serviceOfferings.some((item) => item.id === value), t("admin.validation_required")),
    memberPrice: z.coerce.number().positive(t("admin.validation_positive_amount")),
  });

  const editingPrice = editingPriceId ? state.serviceOfferings.find((item) => item.id === editingPriceId) : null;

  return (
    <section className="admin-page">
      <div className="admin-page__header">
        <h1>{t("nav.marketplace")}</h1>
        <button type="button" className="admin-button admin-button--primary" onClick={() => setCreatingOffer(true)}>
          {t("admin.new_offer")}
        </button>
      </div>

      {state.serviceFamilies.map((family) => {
        const offerings = state.serviceOfferings.filter((item) => item.familyId === family.id);
        return (
          <section key={family.id} className="admin-card" aria-label={family.name[locale]}>
            <h2>{family.name[locale]} <span className="admin-muted">({offerings.length})</span></h2>
            <div className="admin-table-scroll">
              <table className="admin-table" aria-label={family.name[locale]}>
                <thead>
                  <tr>
                    <th scope="col">{t("table.service")}</th>
                    <th scope="col">{t("admin.pricing")}</th>
                    <th scope="col">{t("admin.fulfillment")}</th>
                    <th scope="col">{t("table.provider")}</th>
                    <th scope="col">{t("table.status")}</th>
                    <th scope="col">{t("action.manage")}</th>
                  </tr>
                </thead>
                <tbody>
                  {offerings.map((offering) => {
                    const providers = state.providers.filter((provider) => offering.providerIds.includes(provider.id));
                    return (
                      <tr key={offering.id} data-testid={`admin-service-${offering.key}`}>
                        <td><strong>{offering.name[locale]}</strong></td>
                        <td>
                          <bdi>
                            {offering.pricingModel === "quote-required"
                              ? t("service.pricing.quote_required")
                              : offering.pricingModel === "starting-at" && offering.startingPrice !== undefined
                                ? formatSar(offering.startingPrice, locale)
                                : offering.price !== undefined
                                  ? formatSar(offering.price, locale)
                                  : "—"}
                          </bdi>
                        </td>
                        <td>{offering.fulfillment.map((mode) => t(serviceFulfillmentMessageKey[mode])).join(" · ")}</td>
                        <td>
                          {providers.map((provider) => `${provider.name[locale]} (${t(providerStatusMessageKey[provider.status])})`).join("، ") || "—"}
                        </td>
                        <td>{offering.active ? t("admin.active") : t("admin.paused")}</td>
                        <td className="admin-order-actions">
                          <button
                            type="button"
                            className="admin-button admin-button--ghost"
                            aria-label={`${offering.active ? t("action.disable") : t("action.enable")} ${offering.name[locale]}`}
                            onClick={async () => {
                              await dispatch({ type: "service/availability-changed", serviceId: offering.id, active: !offering.active });
                              announce(t("admin.saved"));
                            }}
                          >
                            {offering.active ? t("action.disable") : t("action.enable")}
                          </button>
                          <button
                            type="button"
                            className="admin-button admin-button--ghost"
                            aria-label={`${t("admin.edit_pricing")} ${offering.name[locale]}`}
                            onClick={() => setEditingPriceId(offering.id)}
                          >
                            {t("admin.edit_pricing")}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      <section className="admin-card" aria-label={t("nav.offers")}>
        <h2>{t("nav.offers")}</h2>
        <ul className="admin-offer-list">
          {state.memberOffers.map((offer) => {
            const service = state.serviceOfferings.find((item) => item.id === offer.serviceId);
            return (
              <li key={offer.id} data-testid={`admin-offer-${offer.id}`}>
                <strong>{offer.title[locale]}</strong>
                <span>{service?.name[locale]}</span>
                <bdi>
                  <s>{formatSar(offer.regularPrice, locale)}</s> {formatSar(offer.memberPrice, locale)}
                </bdi>
                <span>{formatDate(offer.validUntil, locale)}</span>
                <span>{offer.active ? t("admin.active") : t("admin.paused")}</span>
                {offer.active ? (
                  <button
                    type="button"
                    className="admin-button admin-button--ghost"
                    aria-label={`${t("action.disable")} ${offer.title[locale]}`}
                    onClick={async () => {
                      await dispatch({ type: "member-offer/disabled", offerId: offer.id });
                      announce(t("admin.saved"));
                    }}
                  >
                    {t("action.disable")}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="admin-card" aria-label={t("nav.plans")}>
        <h2>{t("nav.plans")}</h2>
        <ul className="admin-offer-list">
          {state.recurringPlans.map((plan) => {
            const service = state.serviceOfferings.find((item) => item.id === plan.serviceId);
            return (
              <li key={plan.id} data-testid={`admin-plan-${plan.id}`}>
                <strong>{service?.name[locale] ?? plan.serviceId}</strong>
                <span>{t(recurringPlanCadenceMessageKey[plan.cadence])}</span>
                <span>{formatDate(plan.nextDate, locale)}</span>
                <button
                  type="button"
                  className="admin-button admin-button--ghost"
                  onClick={async () => {
                    await dispatch({ type: "recurring-plan/toggled", planId: plan.id, active: !plan.active });
                    announce(t("admin.saved"));
                  }}
                >
                  {plan.active ? t("action.disable") : t("action.enable")}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {editingPrice ? (
        <EditDialog
          title={`${t("admin.edit_pricing")} — ${editingPrice.name[locale]}`}
          open
          onOpenChange={(open) => {
            if (!open) setEditingPriceId(null);
          }}
          onSubmit={async (form) => {
            const patch: Record<string, number> = {};
            for (const field of ["price", "startingPrice", "etaMinutes", "slaMinutes"] as const) {
              const raw = form.get(field);
              if (typeof raw === "string" && raw.trim() !== "") {
                const value = Number(raw);
                if (!(value > 0)) return t("admin.validation_positive_amount");
                patch[field] = value;
              }
            }
            if (Object.keys(patch).length === 0) return t("admin.validation_required");
            await dispatch({ type: "service/updated", serviceId: editingPrice.id, patch });
            announce(t("admin.saved"));
            return null;
          }}
        >
          {editingPrice.pricingModel === "starting-at" ? (
            <label className="admin-field">
              <span>{t("service.pricing.starting_at")}</span>
              <input name="startingPrice" type="number" min="1" defaultValue={editingPrice.startingPrice ?? ""} />
            </label>
          ) : editingPrice.pricingModel !== "quote-required" ? (
            <label className="admin-field">
              <span>{t("table.amount")}</span>
              <input name="price" type="number" min="1" defaultValue={editingPrice.price ?? ""} />
            </label>
          ) : null}
          <label className="admin-field">
            <span>{t("admin.eta_minutes")}</span>
            <input name="etaMinutes" type="number" min="1" defaultValue={editingPrice.etaMinutes ?? ""} />
          </label>
          <label className="admin-field">
            <span>{t("admin.sla_minutes")}</span>
            <input name="slaMinutes" type="number" min="1" defaultValue={editingPrice.slaMinutes ?? ""} />
          </label>
        </EditDialog>
      ) : null}

      {creatingOffer ? (
        <EditDialog
          title={t("admin.new_offer")}
          open
          onOpenChange={(open) => {
            if (!open) setCreatingOffer(false);
          }}
          onSubmit={async (form) => {
            const parsed = offerSchema.safeParse({
              titleEn: form.get("titleEn"),
              titleAr: form.get("titleAr"),
              serviceId: form.get("serviceId"),
              memberPrice: form.get("memberPrice"),
            });
            if (!parsed.success) return parsed.error.issues[0]?.message ?? t("admin.validation_required");
            const service = state.serviceOfferings.find((item) => item.id === parsed.data.serviceId)!;
            const providerId = service.providerIds[0];
            if (!providerId) return t("admin.validation_required");
            const regular = service.price ?? service.startingPrice ?? Math.round(parsed.data.memberPrice * 1.5);
            await dispatch({
              type: "member-offer/upserted",
              offer: {
                id: demoId("offer"),
                serviceId: service.id,
                providerId,
                title: { en: parsed.data.titleEn, ar: parsed.data.titleAr },
                regularPrice: Math.max(regular, parsed.data.memberPrice),
                memberPrice: parsed.data.memberPrice,
                validUntil: new Date(Date.parse(state.now) + 14 * 24 * 60 * 60 * 1000).toISOString(),
                terms: { en: "Demo subscriber offer — no real charges.", ar: "عرض تجريبي للمشتركين — لا رسوم حقيقية." },
                active: true,
              },
            });
            announce(t("admin.saved"));
            return null;
          }}
        >
          <DialogField label={t("admin.title_en")} name="titleEn" defaultValue="" />
          <DialogField label={t("admin.title_ar")} name="titleAr" defaultValue="" />
          <label className="admin-field">
            <span>{t("table.service")}</span>
            <select name="serviceId" defaultValue={state.serviceOfferings[0]?.id}>
              {state.serviceOfferings.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name[locale]}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-field">
            <span>{t("admin.member_price")}</span>
            <input name="memberPrice" type="number" min="1" defaultValue="" />
          </label>
        </EditDialog>
      ) : null}
    </section>
  );
}
