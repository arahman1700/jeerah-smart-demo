import type {
  Activity, AmenityBooking, Announcement, Building, CommunityEvent, DemoState, Invoice, MemberOffer,
  NeighborDeal, NeighborGift, NeighborRelationship, OrderStatus, Payment, Poll, RecurringPlan, Resident,
  RequiredServiceKey, ServiceFamily, ServiceFamilyId, ServiceOffering, ServiceOrder, ServiceProvider,
  Unit, VisitorPass,
} from "./models";

export const BUILDING_IDS = ["building-89", "nakheel-court", "jeddah-view", "wadi-homes"] as const;
export const SERVICE_FAMILY_IDS = ["care-cleaning", "home-maintenance", "building-tech-safety", "water-utilities", "automotive-mobility", "daily-needs", "home-fitout-moving", "community-membership"] as const;
export const CURRENT_RESIDENT_ID = "resident-saif";
export const CURRENT_BUILDING_ID = "building-89";

const DATE = "2026-08-03T12:00:00+03:00";
const text = (ar: string, en: string) => ({ ar, en });

const buildings: Building[] = [
  ["building-89", "مبنى ٨٩", "Building 89", "الرياض، حي الياسمين", "Riyadh, Al Yasmin", "فريق جيرة", "Jeerah Team"],
  ["nakheel-court", "مجمع النخيل", "Nakheel Court", "الرياض، النخيل", "Riyadh, Al Nakheel", "سارة العتيبي", "Sara Alotaibi"],
  ["jeddah-view", "إطلالة جدة", "Jeddah View", "جدة، الشاطئ", "Jeddah, Al Shati", "فهد الحربي", "Fahad Alharbi"],
  ["wadi-homes", "منازل الوادي", "Wadi Homes", "الدمام، الفيصلية", "Dammam, Al Faisaliyah", "ريم السالم", "Reem Alsalem"],
].map(([id, arName, enName, arAddress, enAddress, arManager, enManager]) => ({
  id, name: text(arName, enName), address: text(arAddress, enAddress), manager: text(arManager, enManager), imageIds: ["building-exterior"], amenityIds: ["lounge", "gym"],
}));

const unitIds = ["unit-89-101", "unit-89-202", "unit-89-303", "unit-nakheel-101", "unit-nakheel-202", "unit-nakheel-303", "unit-jeddah-101", "unit-jeddah-202", "unit-jeddah-303", "unit-wadi-101", "unit-wadi-202", "unit-wadi-303"];
const units: Unit[] = unitIds.map((id, index) => ({
  id, buildingId: BUILDING_IDS[Math.floor(index / 3)], label: text(`شقة ${101 + (index % 3) * 101}`, `Apartment ${101 + (index % 3) * 101}`), floor: (index % 3) + 1,
  status: index === 8 ? "maintenance" : index === 11 ? "vacant" : "occupied", residentIds: [], imageIds: ["unit-living-room"],
}));
const residents: Resident[] = [
  ["resident-saif", "unit-89-101", "سيف الشمري", "Saif Alshammari", "owner", "active"], ["resident-lina", "unit-89-202", "لينا الحربي", "Lina Alharbi", "tenant", "active"],
  ["resident-omar", "unit-89-303", "عمر العتيبي", "Omar Alotaibi", "family", "active"], ["resident-noura", "unit-nakheel-101", "نورة السالم", "Noura Alsalem", "owner", "active"],
  ["resident-yara", "unit-nakheel-202", "يارا الدوسري", "Yara Aldosari", "tenant", "active"], ["resident-hassan", "unit-jeddah-101", "حسن الغامدي", "Hassan Alghamdi", "owner", "active"],
  ["resident-maha", "unit-jeddah-202", "مها القحطاني", "Maha Alqahtani", "tenant", "invited"], ["resident-adel", "unit-wadi-101", "عادل السبيعي", "Adel Alsubaie", "owner", "inactive"],
].map(([id, unitId, ar, en, role, status]) => ({ id, unitId, name: text(ar, en), role: role as Resident["role"], status: status as Resident["status"] }));
for (const unit of units) unit.residentIds = residents.filter((resident) => resident.unitId === unit.id).map((resident) => resident.id);

const invoiceRows: Array<[string, string, string | undefined, string | undefined, string, string, number, Invoice["status"]]> = [
  ["invoice-elevator", "building-89", "unit-89-101", "resident-saif", "صيانة المصعد", "Elevator maintenance", 700, "due"], ["invoice-89-paid-1", "building-89", "unit-89-202", "resident-lina", "رسوم اتحاد الملاك", "HOA fee", 950, "paid"],
  ["invoice-89-paid-2", "building-89", "unit-89-303", "resident-omar", "خدمات المبنى", "Building services", 450, "paid"], ["invoice-89-paid-3", "building-89", "unit-89-101", "resident-saif", "صيانة المداخل", "Entrance maintenance", 300, "paid"],
  ["invoice-nakheel-due", "nakheel-court", "unit-nakheel-101", "resident-noura", "فاتورة ماء", "Water invoice", 260, "due"], ["invoice-nakheel-overdue", "nakheel-court", "unit-nakheel-202", "resident-yara", "رسوم تأخير", "Late fee", 180, "overdue"],
  ["invoice-jeddah-upcoming", "jeddah-view", "unit-jeddah-101", "resident-hassan", "تنظيف الخزان", "Tank cleaning", 520, "upcoming"], ["invoice-jeddah-paid", "jeddah-view", "unit-jeddah-202", "resident-maha", "اشتراك الأمن", "Security subscription", 330, "paid"],
  ["invoice-wadi-due", "wadi-homes", "unit-wadi-101", "resident-adel", "صيانة دورية", "Routine maintenance", 410, "due"], ["invoice-wadi-upcoming", "wadi-homes", "unit-wadi-101", "resident-adel", "تشجير الحي", "Neighborhood landscaping", 680, "upcoming"],
];
const invoices: Invoice[] = invoiceRows.map(([id, buildingId, unitId, residentId, ar, en, subtotal, status], index) => ({ id, buildingId, unitId, residentId, title: text(ar, en), category: "demo", subtotal, tax: 0, total: subtotal, dueDate: `2026-08-${String(4 + index).padStart(2, "0")}T12:00:00+03:00`, status, createdAt: DATE }));

const serviceFamilies: ServiceFamily[] = [
  ["care-cleaning", "العناية والتنظيف", "Care & cleaning", "خدمات نظافة المنزل والمبنى", "Home and building cleaning", "sparkle"], ["home-maintenance", "صيانة المنزل", "Home maintenance", "إصلاحات موثوقة عند الطلب", "Trusted repairs on demand", "wrench"],
  ["building-tech-safety", "تقنية وسلامة المبنى", "Building tech & safety", "حماية وتحكم ذكي", "Smart protection and control", "shield"], ["water-utilities", "المياه والمرافق", "Water & utilities", "إمدادات ومرافق أساسية", "Essential utilities", "drop"],
  ["automotive-mobility", "السيارات والتنقل", "Automotive & mobility", "خدمة السيارة حيث تقيم", "Car service where you live", "car"], ["daily-needs", "الاحتياجات اليومية", "Daily needs", "طلبات سريعة للمنزل", "Quick home essentials", "basket"],
  ["home-fitout-moving", "التجهيز والنقل", "Home fitout & moving", "تجهيز المنزل والانتقال", "Fit out and move home", "sofa"], ["community-membership", "المجتمع والعضوية", "Community & membership", "عروض جيرة الخاصة", "Jeerah member benefits", "users"],
].map(([id, ar, en, arDescription, enDescription, iconKey]) => ({ id: id as ServiceFamilyId, name: text(ar, en), description: text(arDescription, enDescription), iconKey }));

type ServiceSpec = readonly [RequiredServiceKey, ServiceFamilyId, string, string, ServiceOffering["scope"], ServiceOffering["fulfillment"][number], ServiceOffering["pricingModel"]];
const serviceSpecs: ServiceSpec[] = [
  ["pest-control", "care-cleaning", "مكافحة الحشرات", "Pest control", "apartment", "scheduled", "starting-at"], ["general-maintenance", "home-maintenance", "صيانة عامة", "General maintenance", "both", "on-demand", "starting-at"], ["hourly-handyman", "home-maintenance", "فني بالساعة", "Hourly handyman", "apartment", "on-demand", "per-unit"], ["gas-delivery", "water-utilities", "توصيل الغاز", "Gas delivery", "apartment", "scheduled", "fixed"], ["water-delivery", "water-utilities", "توصيل المياه", "Water delivery", "apartment", "scheduled", "fixed"],
  ["cleaning-supplies", "daily-needs", "مستلزمات التنظيف", "Cleaning supplies", "apartment", "on-demand", "fixed"], ["elevator-maintenance", "building-tech-safety", "صيانة المصاعد", "Elevator maintenance", "building", "quote", "quote-required"], ["tank-fill", "water-utilities", "تعبئة الخزان", "Tank fill", "building", "scheduled", "starting-at"], ["sewage-service", "water-utilities", "خدمة الصرف الصحي", "Sewage service", "building", "quote", "quote-required"], ["mobile-car-wash", "automotive-mobility", "غسيل سيارات متنقل", "Mobile car wash", "apartment", "scheduled", "fixed"],
  ["mobile-car-maintenance", "automotive-mobility", "صيانة سيارات متنقلة", "Mobile car maintenance", "apartment", "quote", "quote-required"], ["mobile-tire-change", "automotive-mobility", "تغيير إطارات متنقل", "Mobile tire change", "apartment", "on-demand", "starting-at"], ["grocery-delivery", "daily-needs", "توصيل البقالة", "Grocery delivery", "apartment", "on-demand", "fixed"], ["produce-delivery", "daily-needs", "توصيل الخضار", "Produce delivery", "apartment", "scheduled", "fixed"], ["bedding-laundry", "care-cleaning", "غسيل المفروشات", "Bedding laundry", "apartment", "scheduled", "starting-at"],
  ["home-cleaning", "care-cleaning", "تنظيف المنزل", "Home cleaning", "apartment", "recurring", "starting-at"], ["camera-installation", "building-tech-safety", "تركيب كاميرات", "Camera installation", "both", "quote", "quote-required"], ["neighbor-gifts", "community-membership", "هدايا الجيران", "Neighbor gifts", "apartment", "on-demand", "fixed"], ["building-washing", "care-cleaning", "غسيل المبنى", "Building washing", "building", "scheduled", "quote-required"], ["appliance-maintenance", "home-maintenance", "صيانة الأجهزة", "Appliance maintenance", "apartment", "on-demand", "starting-at"],
  ["furniture-moving", "home-fitout-moving", "نقل الأثاث", "Furniture moving", "apartment", "quote", "quote-required"], ["fire-safety", "building-tech-safety", "السلامة من الحريق", "Fire safety", "building", "quote", "quote-required"], ["stickers-signage", "home-fitout-moving", "ملصقات ولوحات", "Stickers & signage", "both", "quote", "starting-at"], ["smart-lock-installation", "building-tech-safety", "تركيب قفل ذكي", "Smart lock installation", "apartment", "scheduled", "starting-at"], ["internet-installation", "building-tech-safety", "تركيب الإنترنت", "Internet installation", "apartment", "scheduled", "fixed"],
  ["ev-charger-installation", "building-tech-safety", "تركيب شاحن سيارات", "EV charger installation", "building", "quote", "quote-required"], ["elevator-access-controls", "building-tech-safety", "تحكم دخول المصعد", "Elevator access controls", "building", "quote", "quote-required"], ["entrance-fragrance", "care-cleaning", "تعطير المداخل", "Entrance fragrance", "building", "recurring", "starting-at"], ["awning-installation", "home-fitout-moving", "تركيب المظلات", "Awning installation", "both", "quote", "quote-required"], ["interior-design", "home-fitout-moving", "تصميم داخلي", "Interior design", "apartment", "quote", "quote-required"],
  ["shutter-installation", "home-fitout-moving", "تركيب الشتر", "Shutter installation", "apartment", "quote", "starting-at"], ["naqi-water-filtration", "water-utilities", "فلترة مياه نقي", "Naqi water filtration", "apartment", "scheduled", "starting-at"], ["hvac-maintenance", "home-maintenance", "صيانة التكييف", "HVAC maintenance", "apartment", "on-demand", "starting-at"], ["electrical-maintenance", "home-maintenance", "صيانة كهرباء", "Electrical maintenance", "both", "on-demand", "starting-at"], ["plumbing-maintenance", "home-maintenance", "صيانة سباكة", "Plumbing maintenance", "both", "on-demand", "starting-at"],
];
const pricing = (model: ServiceOffering["pricingModel"], index: number): Pick<ServiceOffering, "price" | "startingPrice" | "unitLabel"> => {
  const amount = 50 + index * 10;
  if (model === "fixed") return { price: amount };
  if (model === "starting-at") return { startingPrice: amount };
  if (model === "per-unit") return { price: amount, unitLabel: text("للساعة", "per hour") };
  return {};
};
const serviceOfferings: ServiceOffering[] = serviceSpecs.map(([key, familyId, ar, en, scope, fulfillment, pricingModel], index) => ({ id: `service-${key}`, key, familyId, providerIds: [`provider-${(index % 18) + 1}`], name: text(ar, en), scope, fulfillment: [fulfillment], pricingModel, ...pricing(pricingModel, index), etaMinutes: 30 + (index % 4) * 15, slaMinutes: 60, durationMinutes: 45, warrantyDays: 30, active: true }));
const providerNames = [
  ["شركة المدار للخدمات المنزلية", "Al Madar Home Services"], ["صيانة أركان", "Arkan Maintenance"], ["فنيون بالساعة", "Hourly Technicians"], ["غاز البيت", "Bayt Gas"], ["مياه صفاء", "Safa Water"], ["تجهيز النظافة", "Clean Supply Co."], ["مصاعد المدار", "Al Madar Elevators"], ["خزانات نقاء", "Naqaa Tanks"], ["مرافق الصرف", "Sarf Utilities"], ["غسيل سيارتي", "My Car Wash"], ["ورشة الطريق", "Road Workshop"], ["إطاراتك", "Your Tires"], ["بقالة الدار", "Dar Groceries"], ["خضار الحي", "Hay Produce"], ["مفروشات لينة", "Lina Linens"], ["بيت نظيف", "Clean Home"], ["رؤية آمنة", "Safe Vision Systems"], ["تصميم وجيرة", "Design & Jeerah"],
];
const providers: ServiceProvider[] = providerNames.map(([ar, en], index) => ({ id: `provider-${index + 1}`, name: text(ar, en), serviceIds: serviceOfferings.filter((service) => service.providerIds.includes(`provider-${index + 1}`)).map((service) => service.id), rating: 4 + (index % 10) / 10, reviewCount: 12 + index * 7, responseMinutes: 10 + index, status: "verified-demo", imageId: "provider-avatar" }));

const residentById = new Map(residents.map((resident) => [resident.id, resident]));
const unitById = new Map(units.map((unit) => [unit.id, unit]));
const residentLocation = (residentId: string) => {
  const resident = residentById.get(residentId)!;
  const unit = unitById.get(resident.unitId)!;
  return { residentId, unitId: unit.id, buildingId: unit.buildingId };
};
type OrderRow = { id: string; status: OrderStatus; serviceId: string; residentId: string; paymentStatus: ServiceOrder["paymentStatus"]; amount?: number; quoteAmount?: number };
const orderRows: OrderRow[] = [
  { id: "order-1", status: "completed", serviceId: "service-pest-control", residentId: "resident-saif", paymentStatus: "paid", amount: 100 },
  { id: "order-2", status: "cancelled", serviceId: "service-general-maintenance", residentId: "resident-lina", paymentStatus: "cancelled" },
  { id: "order-3", status: "scheduled", serviceId: "service-hourly-handyman", residentId: "resident-omar", paymentStatus: "paid", amount: 150 },
  { id: "order-4", status: "confirmed", serviceId: "service-gas-delivery", residentId: "resident-saif", paymentStatus: "paid", amount: 120 },
  { id: "order-5", status: "assigned", serviceId: "service-water-delivery", residentId: "resident-noura", paymentStatus: "paid", amount: 80 },
  { id: "order-6", status: "en-route", serviceId: "service-cleaning-supplies", residentId: "resident-yara", paymentStatus: "paid", amount: 95 },
  { id: "order-7", status: "in-progress", serviceId: "service-elevator-maintenance", residentId: "resident-noura", paymentStatus: "paid", amount: 700 },
  { id: "order-8", status: "awaiting-resident-approval", serviceId: "service-tank-fill", residentId: "resident-hassan", paymentStatus: "pending", amount: 220 },
  { id: "order-9", status: "awaiting-quote", serviceId: "service-sewage-service", residentId: "resident-maha", paymentStatus: "pending" },
  { id: "order-10", status: "quote-ready", serviceId: "service-mobile-car-maintenance", residentId: "resident-hassan", paymentStatus: "pending", quoteAmount: 420 },
  { id: "order-11", status: "refunded", serviceId: "service-mobile-tire-change", residentId: "resident-adel", paymentStatus: "refunded", amount: 180 },
  { id: "order-12", status: "completed", serviceId: "service-grocery-delivery", residentId: "resident-adel", paymentStatus: "paid", amount: 130 },
  { id: "order-13", status: "scheduled", serviceId: "service-produce-delivery", residentId: "resident-saif", paymentStatus: "paid", amount: 110 },
  { id: "order-14", status: "confirmed", serviceId: "service-bedding-laundry", residentId: "resident-lina", paymentStatus: "paid", amount: 200 },
  { id: "order-15", status: "assigned", serviceId: "service-home-cleaning", residentId: "resident-omar", paymentStatus: "paid", amount: 250 },
  { id: "order-16", status: "en-route", serviceId: "service-camera-installation", residentId: "resident-noura", paymentStatus: "paid", amount: 600 },
  { id: "order-17", status: "in-progress", serviceId: "service-neighbor-gifts", residentId: "resident-hassan", paymentStatus: "paid", amount: 75 },
  { id: "order-18", status: "completed", serviceId: "service-building-washing", residentId: "resident-adel", paymentStatus: "paid", amount: 900 },
];
const serviceById = new Map(serviceOfferings.map((service) => [service.id, service]));
const orders: ServiceOrder[] = orderRows.map((row) => {
  const location = residentLocation(row.residentId);
  const service = serviceById.get(row.serviceId)!;
  return { id: row.id, serviceId: row.serviceId, providerId: service.providerIds[0], ...location, fulfillment: service.fulfillment[0], status: row.status, paymentStatus: row.paymentStatus, ...(row.amount === undefined ? {} : { amount: row.amount }), ...(row.quoteAmount === undefined ? {} : { quoteAmount: row.quoteAmount }), scheduledAt: DATE, etaMinutes: 30, timeline: [{ id: `timeline-${row.id}`, status: row.status, occurredAt: DATE, note: text("تحديث تجريبي", "Demo update") }], createdAt: DATE };
});

const paymentRows: Array<[string, string, Payment["status"]]> = [
  ["invoice-elevator", "resident-saif", "pending"], ["invoice-89-paid-1", "resident-lina", "paid"], ["invoice-89-paid-2", "resident-omar", "paid"], ["invoice-89-paid-3", "resident-saif", "paid"], ["invoice-nakheel-due", "resident-noura", "declined"], ["invoice-nakheel-overdue", "resident-yara", "cancelled"], ["invoice-jeddah-upcoming", "resident-hassan", "timed-out"], ["invoice-jeddah-paid", "resident-maha", "paid"], ["invoice-wadi-due", "resident-adel", "refunded"], ["invoice-wadi-upcoming", "resident-adel", "pending"], ["invoice-elevator", "resident-saif", "pending"], ["invoice-nakheel-due", "resident-noura", "declined"],
];
const payments: Payment[] = paymentRows.map(([invoiceId, residentId, status], index) => ({ id: `payment-${index + 1}`, invoiceId, residentId, method: (["mada", "visa", "apple-pay"] as const)[index % 3], status, amount: invoices.find((invoice) => invoice.id === invoiceId)!.total, occurredAt: DATE, reference: `DEMO-${String(index + 1).padStart(4, "0")}`, last4: index % 2 === 0 ? "4455" : "4242" }));
const memberOffers: MemberOffer[] = Array.from({ length: 8 }, (_, index) => ({ id: `member-offer-${index + 1}`, serviceId: serviceOfferings[index].id, title: serviceOfferings[index].name, regularPrice: 100 + index * 20, memberPrice: 80 + index * 15, active: index !== 7 }));
const recurringPlans: RecurringPlan[] = Array.from({ length: 5 }, (_, index) => ({ id: `plan-${index + 1}`, serviceId: serviceOfferings[15 + index].id, residentId: residents[index].id, cadence: (["weekly", "monthly", "quarterly", "seasonal", "monthly"] as const)[index], nextDate: "2026-08-10T09:00:00+03:00", active: index !== 4, skippedDates: index === 2 ? ["2026-08-10T09:00:00+03:00"] : [] }));
const neighborDeals: NeighborDeal[] = [0, 1, 2].map((index) => ({ id: `deal-${index + 1}`, serviceId: serviceOfferings[27 + index].id, buildingId: "building-89", participantIds: residents.slice(0, index + 1).map((resident) => resident.id), thresholds: [{ count: 3, unitPrice: 75 }, { count: 6, unitPrice: 60 }], closesAt: "2026-08-10T18:00:00+03:00" }));
const neighborRelationships: NeighborRelationship[] = [["neighbor-1", "أم نورة", "Umm Noura", "neighbor"], ["neighbor-2", "سالم", "Salem", "friend"], ["neighbor-3", "خالد", "Khalid", "family"]].map(([id, ar, en, relation]) => ({ id, displayName: text(ar, en), relation: relation as NeighborRelationship["relation"] }));
const gifts: NeighborGift[] = [["gift-1", "service-neighbor-gifts", "resident-saif", "neighbor-1", "هدية ترحيب", "sent"], ["gift-2", "service-neighbor-gifts", "resident-lina", "neighbor-2", "شكراً لجيرتك", "redeemed"]].map(([id, serviceId, senderId, recipientRelationshipId, message, status]) => ({ id, serviceId, senderId, recipientRelationshipId, message, status: status as NeighborGift["status"], createdAt: DATE }));
const announcements: Announcement[] = [
  ["announcement-1", "building-89", "تنبيه المصعد", "Elevator notice", "سيتم فحص المصعد مساءً", "The elevator will be inspected this evening", "urgent"], ["announcement-2", "building-89", "تنظيف المداخل", "Entrance cleaning", "تنظيف مجدول غداً", "Cleaning is scheduled tomorrow", "normal"],
  ["announcement-3", "nakheel-court", "تحديث البوابة", "Gate update", "تحديث نظام البوابة", "Gate system update", "important"], ["announcement-4", "jeddah-view", "فعالية الجيران", "Neighbor event", "نلتقي في الصالة", "Meet in the lounge", "normal"],
  ["announcement-5", "wadi-homes", "تنبيه المياه", "Water notice", "اختبار ضغط المياه", "Water pressure test", "important"], ["announcement-6", "nakheel-court", "صيانة دورية", "Routine maintenance", "صيانة خفيفة", "Minor maintenance", "normal"],
].map(([id, buildingId, arTitle, enTitle, arBody, enBody, priority]) => ({ id, buildingId, title: text(arTitle, enTitle), body: text(arBody, enBody), priority: priority as Announcement["priority"], publishedAt: DATE }));
const polls: Poll[] = [
  { id: "poll-1", buildingId: "building-89", question: text("ما أفضل وقت للتنظيف؟", "What is the best cleaning time?"), options: [{ id: "poll-1-morning", label: text("الصباح", "Morning"), voterIds: ["resident-saif"] }, { id: "poll-1-evening", label: text("المساء", "Evening"), voterIds: ["resident-lina"] }], closesAt: "2026-08-08T20:00:00+03:00" },
  { id: "poll-2", buildingId: "nakheel-court", question: text("ما أفضل وقت للتنظيف؟", "What is the best cleaning time?"), options: [{ id: "poll-2-morning", label: text("الصباح", "Morning"), voterIds: ["resident-noura"] }, { id: "poll-2-evening", label: text("المساء", "Evening"), voterIds: ["resident-yara"] }], closesAt: "2026-08-08T20:00:00+03:00" },
];
const events: CommunityEvent[] = [
  { id: "event-1", buildingId: "building-89", title: text("لقاء الجيران", "Neighbor meetup"), startsAt: "2026-08-12T19:00:00+03:00", attendeeIds: ["resident-saif", "resident-lina", "resident-omar"], capacity: 30 },
  { id: "event-2", buildingId: "jeddah-view", title: text("لقاء الجيران", "Neighbor meetup"), startsAt: "2026-08-12T19:00:00+03:00", attendeeIds: ["resident-hassan", "resident-maha"], capacity: 30 },
];
const visitorPasses: VisitorPass[] = [["resident-saif", "Mariam Al Noor"], ["resident-lina", "Khaled Rahim"], ["resident-noura", "Noor Al Ameen"], ["resident-hassan", "Rana Fares"], ["resident-adel", "Yusuf Hadi"]].map(([residentId, guestName], index) => ({ id: `pass-${index + 1}`, ...residentLocation(residentId), guestName, expiresAt: "2026-08-04T12:00:00+03:00", status: (["active", "expired", "revoked", "active", "active"] as const)[index] }));
const amenityBookings: AmenityBooking[] = ["resident-saif", "resident-lina", "resident-noura", "resident-yara", "resident-hassan", "resident-adel"].map((residentId, index) => {
  const { buildingId } = residentLocation(residentId);
  return { id: `booking-${index + 1}`, buildingId, residentId, amenityId: index % 2 ? "gym" : "lounge", startsAt: "2026-08-05T18:00:00+03:00", status: (["upcoming", "completed", "cancelled", "upcoming", "completed", "upcoming"] as const)[index] };
});
const activities: Activity[] = Array.from({ length: 12 }, (_, index) => ({ id: `activity-${index + 1}`, buildingId: BUILDING_IDS[index % 4], kind: "demo", title: text("تحديث المجتمع", "Community update"), occurredAt: DATE }));

export function createSeedState(_now: Date = new Date(DATE)): DemoState {
  return structuredClone({ schemaVersion: 1, locale: "ar", scenario: "normal", currentResidentId: CURRENT_RESIDENT_ID, currentBuildingId: CURRENT_BUILDING_ID, buildings, units, residents, invoices, payments, serviceFamilies, serviceOfferings, providers, orders, memberOffers, recurringPlans, neighborDeals, neighborRelationships, announcements, polls, events, visitorPasses, amenityBookings, gifts, activities, auditLog: [] } satisfies DemoState);
}
