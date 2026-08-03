import { normalizeSearchText } from "./format";
import type { DemoState, ServiceFamilyId, ServiceFulfillment, ServiceOffering, ServiceScope } from "./models";

export interface ServiceCatalogFilters {
  familyId?: ServiceFamilyId;
  scope?: ServiceScope;
  fulfillment?: ServiceFulfillment;
  active?: boolean;
  providerId?: string;
}

export function searchServiceCatalog(state: DemoState, query: string, filters: ServiceCatalogFilters = {}): ServiceOffering[] {
  const normalizedQuery = normalizeSearchText(query.trim());
  return state.serviceOfferings.filter((service) => {
    const matchesQuery = !normalizedQuery || [service.key, service.name.ar, service.name.en]
      .some((value) => normalizeSearchText(value).includes(normalizedQuery));
    return matchesQuery
      && (!filters.familyId || service.familyId === filters.familyId)
      && (!filters.scope || service.scope === filters.scope || service.scope === "both")
      && (!filters.fulfillment || service.fulfillment.includes(filters.fulfillment))
      && (filters.active === undefined || service.active === filters.active)
      && (!filters.providerId || service.providerIds.includes(filters.providerId));
  });
}
