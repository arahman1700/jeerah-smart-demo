import {
  Armchair,
  Broom,
  Buildings,
  Car,
  Drop,
  HouseLine,
  PaintBrush,
  ShoppingBag,
  Sparkle,
  Toolbox,
  Truck,
  Users,
  Wrench,
  type Icon,
} from "@phosphor-icons/react";
import { createElement } from "react";
import type { RequiredServiceKey, ServiceFamilyId } from "../domain/models";
import { BrandIcon } from "./BrandIcon";

export const serviceFamilyIconMap: Record<ServiceFamilyId, Icon> = {
  "care-cleaning": Broom,
  "home-maintenance": Wrench,
  "building-tech-safety": Buildings,
  "water-utilities": Drop,
  "automotive-mobility": Car,
  "daily-needs": ShoppingBag,
  "home-fitout-moving": Armchair,
  "community-membership": Users,
};

export const featuredServiceIconMap: Partial<Record<RequiredServiceKey, Icon>> = {
  "pest-control": Sparkle,
  "general-maintenance": Toolbox,
  "hourly-handyman": Wrench,
  "gas-delivery": Truck,
  "water-delivery": Drop,
  "elevator-maintenance": Buildings,
  "mobile-car-wash": Car,
  "grocery-delivery": ShoppingBag,
  "home-cleaning": Broom,
  "camera-installation": Buildings,
  "furniture-moving": Truck,
  "interior-design": PaintBrush,
  "smart-lock-installation": HouseLine,
};

export function ServiceFamilyIcon({ familyId, serviceKey, label }: {
  familyId: ServiceFamilyId;
  serviceKey?: RequiredServiceKey;
  label: string;
}) {
  const icon = serviceKey ? featuredServiceIconMap[serviceKey] ?? serviceFamilyIconMap[familyId] : serviceFamilyIconMap[familyId];
  return createElement(BrandIcon, { icon, label });
}
