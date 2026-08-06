export type Locale = "ar" | "en";
export type DemoScenario = "normal" | "empty" | "offline" | "overdue" | "declined" | "urgent-maintenance";
export type InvoiceStatus = "due" | "paid" | "overdue" | "upcoming";
export const PAYMENT_METHODS = ["apple-pay", "mada", "visa"] as const;
export const PAYMENT_STATUSES = ["paid", "pending", "declined", "cancelled", "timed-out", "refunded"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type PaymentMask = "4455" | "4242";
/** The demo only ever shows these masks, and Apple Pay never exposes one. */
export const PAYMENT_METHOD_MASK: Record<PaymentMethod, PaymentMask | undefined> = {
  "apple-pay": undefined, mada: "4455", visa: "4242",
};
export type LocalizedText = { ar: string; en: string };
export type ServiceFamilyId =
  | "care-cleaning" | "home-maintenance" | "building-tech-safety" | "water-utilities"
  | "automotive-mobility" | "daily-needs" | "home-fitout-moving" | "community-membership";

export const REQUIRED_SERVICE_KEYS = [
  "pest-control", "general-maintenance", "hourly-handyman", "gas-delivery", "water-delivery",
  "cleaning-supplies", "elevator-maintenance", "tank-fill", "sewage-service", "mobile-car-wash",
  "mobile-car-maintenance", "mobile-tire-change", "grocery-delivery", "produce-delivery", "bedding-laundry",
  "home-cleaning", "camera-installation", "neighbor-gifts", "building-washing", "appliance-maintenance",
  "furniture-moving", "fire-safety", "stickers-signage", "smart-lock-installation", "internet-installation",
  "ev-charger-installation", "elevator-access-controls", "entrance-fragrance", "awning-installation",
  "interior-design", "shutter-installation", "naqi-water-filtration", "hvac-maintenance",
  "electrical-maintenance", "plumbing-maintenance",
] as const;
export type RequiredServiceKey = (typeof REQUIRED_SERVICE_KEYS)[number];
export type ServiceScope = "apartment" | "building" | "both";
export type ServiceFulfillment = "on-demand" | "scheduled" | "recurring" | "quote" | "group";
export type PricingModel = "fixed" | "starting-at" | "per-unit" | "quote-required";
export type OrderStatus =
  | "awaiting-quote" | "quote-ready" | "scheduled" | "confirmed" | "assigned" | "en-route"
  | "in-progress" | "awaiting-resident-approval" | "completed" | "cancelled" | "refunded";

export interface CommunityPulse { score: number; status: "healthy" | "attention" | "critical"; factors: Array<{ key: "collection" | "maintenance" | "alerts"; score: number }>; }
export interface Building { id: string; name: LocalizedText; address: LocalizedText; manager: LocalizedText; imageIds: string[]; amenityIds: string[]; }
export interface Unit { id: string; buildingId: string; label: LocalizedText; floor: number; status: "occupied" | "vacant" | "maintenance"; residentIds: string[]; imageIds: string[]; }
export interface Resident { id: string; unitId: string; name: LocalizedText; role: "owner" | "tenant" | "family"; status: "active" | "invited" | "inactive"; }
export interface Invoice { id: string; buildingId: string; unitId?: string; residentId?: string; title: LocalizedText; category: string; subtotal: number; tax: number; total: number; dueDate: string; status: InvoiceStatus; createdAt: string; }
export interface ServiceFamily { id: ServiceFamilyId; name: LocalizedText; description: LocalizedText; iconKey: string; }
export interface ServiceProvider { id: string; name: LocalizedText; serviceIds: string[]; rating: number; reviewCount: number; responseMinutes: number; status: "verified-demo" | "new" | "paused" | "review"; imageId?: string; }
export interface OrderTimelineEvent { id: string; status: OrderStatus; occurredAt: string; note: LocalizedText; imageId?: string; }
export interface ServiceOrder { id: string; serviceId: string; providerId?: string; buildingId: string; unitId?: string; residentId: string; fulfillment: ServiceFulfillment; status: OrderStatus; paymentStatus?: PaymentStatus; amount?: number; quoteAmount?: number; scheduledAt?: string; etaMinutes?: number; timeline: OrderTimelineEvent[]; rating?: number; createdAt: string; }
export interface Announcement { id: string; buildingId: string; title: LocalizedText; body: LocalizedText; priority: "normal" | "important" | "urgent"; publishedAt: string; }
export interface PollOption { id: string; label: LocalizedText; voterIds: string[]; }
export interface Poll { id: string; buildingId: string; question: LocalizedText; options: PollOption[]; closesAt: string; }
export interface CommunityEvent { id: string; buildingId: string; title: LocalizedText; startsAt: string; attendeeIds: string[]; capacity: number; }
export interface VisitorPass { id: string; buildingId: string; unitId: string; residentId: string; guestName: string; expiresAt: string; status: "active" | "expired" | "revoked"; }
export interface AmenityBooking { id: string; buildingId: string; residentId: string; amenityId: string; startsAt: string; status: "upcoming" | "completed" | "cancelled"; }
export interface Activity { id: string; buildingId: string; kind: string; title: LocalizedText; description: LocalizedText; occurredAt: string; }
export interface AuditEntry { id: string; actorId: string; action: string; entityType: string; entityId: string; description: LocalizedText; occurredAt: string; }
export interface MemberOffer { id: string; serviceId: string; title: LocalizedText; regularPrice: number; memberPrice: number; active: boolean; }
export interface RecurringPlan { id: string; serviceId: string; residentId: string; cadence: "weekly" | "monthly" | "quarterly" | "seasonal"; nextDate: string; active: boolean; skippedDates: string[]; }
export interface NeighborDeal { id: string; serviceId: string; buildingId: string; participantIds: string[]; thresholds: Array<{ count: number; unitPrice: number }>; closesAt: string; }
export interface NeighborRelationship { id: string; displayName: LocalizedText; relation: "neighbor" | "friend" | "family"; }
export interface NeighborGift { id: string; serviceId: string; senderId: string; recipientRelationshipId: string; message: string; status: "sent" | "redeemed"; createdAt: string; }
export interface ServiceOffering { id: string; familyId: ServiceFamilyId; providerIds: string[]; key: RequiredServiceKey; name: LocalizedText; scope: ServiceScope; fulfillment: ServiceFulfillment[]; pricingModel: PricingModel; price?: number; startingPrice?: number; unitLabel?: LocalizedText; etaMinutes?: number; slaMinutes?: number; durationMinutes?: number; warrantyDays?: number; active: boolean; }
export interface Payment { id: string; invoiceId: string; residentId: string; method: PaymentMethod; status: PaymentStatus; amount: number; occurredAt: string; reference: string; last4?: PaymentMask; }
export interface DemoState { schemaVersion: 2; locale: Locale; scenario: DemoScenario; currentResidentId: string; currentBuildingId: string; buildings: Building[]; units: Unit[]; residents: Resident[]; invoices: Invoice[]; payments: Payment[]; serviceFamilies: ServiceFamily[]; serviceOfferings: ServiceOffering[]; providers: ServiceProvider[]; orders: ServiceOrder[]; memberOffers: MemberOffer[]; recurringPlans: RecurringPlan[]; neighborDeals: NeighborDeal[]; neighborRelationships: NeighborRelationship[]; announcements: Announcement[]; polls: Poll[]; events: CommunityEvent[]; visitorPasses: VisitorPass[]; amenityBookings: AmenityBooking[]; gifts: NeighborGift[]; activities: Activity[]; auditLog: AuditEntry[]; }

export type DemoAction =
  | { type: "locale/set"; locale: Locale } | { type: "scenario/set"; scenario: DemoScenario }
  | { type: "invoice/created"; invoice: Invoice } | { type: "payment/recorded"; payment: Payment }
  | { type: "payment/status-changed"; paymentId: string; status: PaymentStatus; occurredAt: string }
  | { type: "order/created"; order: ServiceOrder } | { type: "order/status-changed"; orderId: string; status: OrderStatus; occurredAt: string }
  | { type: "order/provider-assigned"; orderId: string; providerId: string; occurredAt: string } | { type: "order/rated"; orderId: string; rating: number; occurredAt: string }
  | { type: "service/availability-changed"; serviceId: string; active: boolean } | { type: "service/updated"; serviceId: string; patch: Partial<Pick<ServiceOffering, "price" | "startingPrice" | "etaMinutes" | "slaMinutes" | "durationMinutes" | "warrantyDays">> }
  | { type: "quote/approved"; orderId: string; amount: number; occurredAt: string } | { type: "quote/rejected"; orderId: string; occurredAt: string }
  | { type: "member-offer/upserted"; offer: MemberOffer } | { type: "member-offer/disabled"; offerId: string }
  | { type: "recurring-plan/upserted"; plan: RecurringPlan } | { type: "recurring-plan/toggled"; planId: string; active: boolean } | { type: "recurring-plan/next-skipped"; planId: string; date: string }
  | { type: "neighbor-deal/joined"; dealId: string; residentId: string } | { type: "neighbor-gift/sent"; gift: NeighborGift }
  | { type: "building/updated"; buildingId: string; patch: Partial<Pick<Building, "name" | "address" | "manager">> } | { type: "unit/updated"; unitId: string; patch: Partial<Pick<Unit, "status" | "label">> } | { type: "resident/updated"; residentId: string; patch: Partial<Pick<Resident, "status" | "role">> }
  | { type: "announcement/published"; announcement: Announcement } | { type: "poll/created"; poll: Poll } | { type: "visitor-pass/created"; pass: VisitorPass } | { type: "amenity-booking/created"; booking: AmenityBooking }
  | { type: "poll/voted"; pollId: string; optionId: string; residentId: string } | { type: "event/rsvp"; eventId: string; residentId: string; attending: boolean } | { type: "demo/reset" };
