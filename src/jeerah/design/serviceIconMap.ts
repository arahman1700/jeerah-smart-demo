import {
  Armchair, Barbell, Basket, Bed, Broom, Bug, CarProfile, ChargingStation, Couch, Cylinder, Drop, Elevator,
  Engine, Fan, FireExtinguisher, Funnel, Gift, Hammer, IdentificationCard, Lightning, LockKey, Package,
  PaintBrush, PicnicTable, Pipe, Recycle, Rows, SecurityCamera, ShieldCheck, ShoppingCart, Sparkle,
  SprayBottle, Sticker, Storefront, Toolbox, Truck, Tire, Umbrella, UsersThree, WashingMachine, WifiHigh,
  Wrench, type Icon,
} from "@phosphor-icons/react";
import { createElement } from "react";
import type { RequiredServiceKey, ServiceFamilyId } from "../domain/models";
import { BrandIcon } from "./BrandIcon";

/** One curated Phosphor Duotone glyph per family — never repeated across families. */
export const serviceFamilyIconMap: Record<ServiceFamilyId, Icon> = {
  "care-cleaning": Broom,
  "home-maintenance": Wrench,
  "building-tech-safety": ShieldCheck,
  "water-utilities": Drop,
  "automotive-mobility": CarProfile,
  "daily-needs": Basket,
  "home-fitout-moving": Armchair,
  "community-membership": UsersThree,
};

/** Every one of the 35 offerings resolves to its own glyph, so no card is generic. */
export const serviceIconMap: Record<RequiredServiceKey, Icon> = {
  "hvac-maintenance": Fan,
  "electrical-maintenance": Lightning,
  "plumbing-maintenance": Pipe,
  "general-maintenance": Toolbox,
  "hourly-handyman": Hammer,
  "appliance-maintenance": WashingMachine,
  "home-cleaning": Broom,
  "pest-control": Bug,
  "bedding-laundry": Bed,
  "building-washing": SprayBottle,
  "entrance-fragrance": Sparkle,
  "cleaning-supplies": Basket,
  "grocery-delivery": ShoppingCart,
  "produce-delivery": PicnicTable,
  "neighbor-gifts": Gift,
  "gas-delivery": Cylinder,
  "water-delivery": Drop,
  "tank-fill": Truck,
  "sewage-service": Recycle,
  "naqi-water-filtration": Funnel,
  "furniture-moving": Package,
  "interior-design": PaintBrush,
  "awning-installation": Umbrella,
  "shutter-installation": Rows,
  "stickers-signage": Sticker,
  "elevator-maintenance": Elevator,
  "elevator-access-controls": IdentificationCard,
  "fire-safety": FireExtinguisher,
  "ev-charger-installation": ChargingStation,
  "camera-installation": SecurityCamera,
  "smart-lock-installation": LockKey,
  "internet-installation": WifiHigh,
  "mobile-car-wash": CarProfile,
  "mobile-car-maintenance": Engine,
  "mobile-tire-change": Tire,
};

/** Amenity glyphs are keyed by the trailing segment of the amenity ID. */
export const amenityIconMap: Record<string, Icon> = {
  lounge: Couch,
  gym: Barbell,
  "meeting-room": Storefront,
  parking: CarProfile,
};

export function amenityIcon(amenityId: string): Icon {
  return amenityIconMap[amenityId.split("-").slice(3).join("-")] ?? Couch;
}

export function ServiceFamilyIcon({ familyId, serviceKey, label }: {
  familyId: ServiceFamilyId;
  serviceKey?: RequiredServiceKey;
  label: string;
}) {
  const icon = serviceKey ? serviceIconMap[serviceKey] : serviceFamilyIconMap[familyId];
  return createElement(BrandIcon, { icon, label });
}
