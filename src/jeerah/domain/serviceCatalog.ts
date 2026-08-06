import { normalizeSearchText } from "./format";
import type {
  DemoState, LocalizedText, MemberOffer, NeighborDeal, PricingModel, RecurringPlan, ServiceFamily,
  ServiceFamilyId, ServiceFulfillment, ServiceOffering, ServiceOrder, ServiceProvider, ServiceScope,
} from "./models";

export interface ServiceCatalogFilters {
  familyId?: ServiceFamilyId;
  scope?: ServiceScope;
  fulfillment?: ServiceFulfillment;
  pricingModel?: PricingModel;
  active?: boolean;
  providerId?: string;
}

/** The curated haystack for one offering: keys, both names, and every alias. */
export function serviceSearchTerms(service: ServiceOffering): string[] {
  return [service.key, service.name.ar, service.name.en, ...service.searchAliases];
}

export function matchesServiceQuery(service: ServiceOffering, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  return serviceSearchTerms(service).some((term) => normalizeSearchText(term).includes(normalizedQuery));
}

export function searchServiceCatalog(state: DemoState, query: string, filters: ServiceCatalogFilters = {}): ServiceOffering[] {
  const normalizedQuery = normalizeSearchText(query);
  return state.serviceOfferings.filter((service) => (
    matchesServiceQuery(service, normalizedQuery)
    && (!filters.familyId || service.familyId === filters.familyId)
    && (!filters.scope || service.scope === filters.scope || service.scope === "both")
    && (!filters.fulfillment || service.fulfillment.includes(filters.fulfillment))
    && (!filters.pricingModel || service.pricingModel === filters.pricingModel)
    && (filters.active === undefined || service.active === filters.active)
    && (!filters.providerId || service.providerIds.includes(filters.providerId))
  ));
}

/** The CTA a service card offers, in the order a resident expects to see it. */
export const FULFILLMENT_PRIORITY: ServiceFulfillment[] = ["on-demand", "scheduled", "recurring", "quote", "group"];

export type ServiceNextAction =
  | { kind: "book"; fulfillment: ServiceFulfillment }
  | { kind: "unavailable" };

export interface ServicePriceModel {
  model: PricingModel;
  amount?: number;
  unitLabel?: LocalizedText;
  range?: { min: number; max: number };
}

export interface ServiceExperience {
  service: ServiceOffering;
  family: ServiceFamily;
  providers: ServiceProvider[];
  primaryProvider?: ServiceProvider;
  imageId: string;
  fulfillment: ServiceFulfillment[];
  price: ServicePriceModel;
  offers: MemberOffer[];
  deal?: NeighborDeal;
  plan?: RecurringPlan;
  orders: ServiceOrder[];
  nextAction: ServiceNextAction;
}

export function servicePriceModel(service: ServiceOffering): ServicePriceModel {
  if (service.pricingModel === "fixed") return { model: "fixed", amount: service.price };
  if (service.pricingModel === "starting-at") return { model: "starting-at", amount: service.startingPrice };
  if (service.pricingModel === "per-unit") return { model: "per-unit", amount: service.price, unitLabel: service.unitLabel };
  return { model: "quote-required", range: service.quoteRange };
}

/**
 * The single pure selector every services screen reads. Its exhaustive test over
 * all 35 offerings is the no-dead-card contract: a family, a provider, an image,
 * a price model, and one valid next action for every active service.
 */
export function resolveServiceExperience(state: DemoState, serviceId: string): ServiceExperience | undefined {
  const service = state.serviceOfferings.find((item) => item.id === serviceId);
  if (!service) return undefined;
  const family = state.serviceFamilies.find((item) => item.id === service.familyId);
  if (!family) return undefined;

  const providers = state.providers.filter((provider) => service.providerIds.includes(provider.id));
  const fulfillment = FULFILLMENT_PRIORITY.filter((mode) => service.fulfillment.includes(mode));
  const usable = service.active && providers.length > 0 && fulfillment.length > 0;

  return {
    service,
    family,
    providers,
    primaryProvider: providers[0],
    imageId: service.imageId,
    fulfillment,
    price: servicePriceModel(service),
    offers: state.memberOffers.filter((offer) => offer.serviceId === service.id && offer.active),
    deal: state.neighborDeals.find((item) => item.serviceId === service.id && item.buildingId === state.currentBuildingId),
    plan: state.recurringPlans.find((item) => item.serviceId === service.id && item.residentId === state.currentResidentId),
    orders: state.orders.filter((order) => order.serviceId === service.id && order.residentId === state.currentResidentId),
    nextAction: usable ? { kind: "book", fulfillment: fulfillment[0] } : { kind: "unavailable" },
  };
}

export function dealParticipantCount(deal: NeighborDeal): number {
  return deal.participantIds.length + deal.anonymousParticipants;
}

/** Unit price at the current headcount: the deepest threshold already reached. */
export function dealUnitPrice(deal: NeighborDeal, count = dealParticipantCount(deal)): number {
  return deal.thresholds.reduce((price, tier) => count >= tier.count ? tier.unitPrice : price, deal.basePrice);
}

export function dealNextThreshold(deal: NeighborDeal, count = dealParticipantCount(deal)) {
  return deal.thresholds.find((tier) => count < tier.count);
}

/** A group order may only exist once the ladder starts and the building agrees. */
export function dealIsOrderable(deal: NeighborDeal, count = dealParticipantCount(deal)): boolean {
  return deal.buildingApproved && count >= (deal.thresholds[0]?.count ?? 0);
}

export function offerSavings(offer: MemberOffer) {
  const amount = offer.regularPrice - offer.memberPrice;
  return { amount, percent: Math.round((amount / offer.regularPrice) * 100) };
}
