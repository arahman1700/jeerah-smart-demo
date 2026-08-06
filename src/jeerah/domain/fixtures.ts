import type {
  Activity, Amenity, AmenityBooking, Announcement, Building, CommunityEvent, DemoState, Invoice, MemberOffer,
  NeighborDeal, NeighborGift, NeighborRelationship, OrderStatus, OrderTimelineEvent, Payment, Poll, RecurringPlan,
  Resident, RequiredServiceKey, ServiceFamily, ServiceFamilyId, ServiceFulfillment, ServiceOffering, ServiceOrder,
  ServiceProvider, Unit, VisitorPass,
} from "./models";
import { PAYMENT_METHOD_MASK } from "./models";

export const BUILDING_IDS = ["building-89", "nakheel-court", "jeddah-view", "wadi-homes"] as const;
export const SERVICE_FAMILY_IDS = ["care-cleaning", "home-maintenance", "building-tech-safety", "water-utilities", "automotive-mobility", "daily-needs", "home-fitout-moving", "community-membership"] as const;
export const CURRENT_RESIDENT_ID = "resident-saif";
export const CURRENT_BUILDING_ID = "building-89";

const DATE = "2026-08-03T12:00:00+03:00";
const text = (ar: string, en: string) => ({ ar, en });
const buildingImages: Record<(typeof BUILDING_IDS)[number], string[]> = {
  "building-89": ["building-89-night", "building-89-day", "lobby", "gym", "meeting-room", "parking"],
  "nakheel-court": ["nakheel-court"],
  "jeddah-view": ["jeddah-view"],
  "wadi-homes": ["building-89-day"],
};

const amenitySpecs: Array<[string, string, string, string, string, string, number, string[]]> = [
  ["lounge", "lobby", "ردهة الجيران", "Neighbors lounge", "مساحة استقبال مشتركة لاجتماعات السكان القصيرة", "Shared reception space for short resident gatherings", 20, ["18:00", "19:00", "20:00"]],
  ["gym", "gym", "الصالة الرياضية", "Resident gym", "صالة مجهزة لسكان المبنى مع فترات حجز ساعة واحدة", "Equipped gym for building residents in one-hour slots", 8, ["06:00", "18:00", "19:00"]],
  ["meeting-room", "meeting-room", "غرفة الاجتماعات", "Meeting room", "غرفة هادئة لاجتماعات ملاك الوحدات", "Quiet room for unit-owner meetings", 10, ["10:00", "17:00", "19:00"]],
  ["parking", "parking", "موقف الزوار", "Visitor parking", "موقف مخصص لزوار السكان لفترات قصيرة", "Reserved short-stay bay for resident visitors", 4, ["16:00", "18:00", "20:00"]],
];
const amenitySlot = (time: string) => `2026-08-05T${time}:00+03:00`;
const amenities: Amenity[] = BUILDING_IDS.flatMap((buildingId) => (
  amenitySpecs
    .filter(([key]) => buildingId === "building-89" || key === "lounge" || key === "gym")
    .map(([key, imageId, arName, enName, arDescription, enDescription, capacity, slots]) => ({
      id: `amenity-${buildingId}-${key}`,
      buildingId,
      name: text(arName, enName),
      description: text(arDescription, enDescription),
      imageId,
      capacity,
      slots: slots.map(amenitySlot),
    }))
));

const buildings: Building[] = [
  ["building-89", "مبنى ٨٩", "Building 89", "الرياض، حي الياسمين", "Riyadh, Al Yasmin", "فريق جيرة", "Jeerah Team"],
  ["nakheel-court", "مجمع النخيل", "Nakheel Court", "الرياض، النخيل", "Riyadh, Al Nakheel", "سارة العتيبي", "Sara Alotaibi"],
  ["jeddah-view", "إطلالة جدة", "Jeddah View", "جدة، الشاطئ", "Jeddah, Al Shati", "فهد الحربي", "Fahad Alharbi"],
  ["wadi-homes", "منازل الوادي", "Wadi Homes", "الدمام، الفيصلية", "Dammam, Al Faisaliyah", "ريم السالم", "Reem Alsalem"],
].map(([id, arName, enName, arAddress, enAddress, arManager, enManager]) => ({
  id, name: text(arName, enName), address: text(arAddress, enAddress), manager: text(arManager, enManager),
  imageIds: buildingImages[id as (typeof BUILDING_IDS)[number]],
  amenityIds: amenities.filter((amenity) => amenity.buildingId === id).map((amenity) => amenity.id),
}));

const unitIds = ["unit-89-1204", "unit-89-202", "unit-89-303", "unit-nakheel-101", "unit-nakheel-202", "unit-nakheel-303", "unit-jeddah-101", "unit-jeddah-202", "unit-jeddah-303", "unit-wadi-101", "unit-wadi-202", "unit-wadi-303"];
const units: Unit[] = unitIds.map((id, index) => ({
  id,
  buildingId: BUILDING_IDS[Math.floor(index / 3)],
  label: id === "unit-89-1204" ? text("الوحدة ١٢٠٤", "Unit 1204") : text(`شقة ${101 + (index % 3) * 101}`, `Apartment ${101 + (index % 3) * 101}`),
  floor: id === "unit-89-1204" ? 12 : (index % 3) + 1,
  status: index === 8 ? "maintenance" : index === 11 ? "vacant" : "occupied",
  residentIds: [],
  imageIds: id === "unit-89-1204" ? ["living-room", "kitchen", "bedroom", "balcony"] : ["living-room"],
}));
const residents: Resident[] = [
  ["resident-saif", "unit-89-1204", "سيف الدين", "Saifeldeen", "owner", "active", ""], ["resident-lina", "unit-89-202", "لينا الحربي", "Lina Alharbi", "tenant", "active", "subscriber"],
  ["resident-omar", "unit-89-303", "عمر العتيبي", "Omar Alotaibi", "family", "active", ""], ["resident-noura", "unit-nakheel-101", "نورة السالم", "Noura Alsalem", "owner", "active", "subscriber"],
  ["resident-yara", "unit-nakheel-202", "يارا الدوسري", "Yara Aldosari", "tenant", "active", ""], ["resident-hassan", "unit-jeddah-101", "حسن الغامدي", "Hassan Alghamdi", "owner", "active", ""],
  ["resident-maha", "unit-jeddah-202", "مها القحطاني", "Maha Alqahtani", "tenant", "invited", ""], ["resident-adel", "unit-wadi-101", "عادل السبيعي", "Adel Alsubaie", "owner", "inactive", ""],
].map(([id, unitId, ar, en, role, status, subscriber]) => ({ id, unitId, name: text(ar, en), role: role as Resident["role"], status: status as Resident["status"], subscriber: subscriber === "subscriber" }));
for (const unit of units) unit.residentIds = residents.filter((resident) => resident.unitId === unit.id).map((resident) => resident.id);

const invoiceRows: Array<[string, string, string | undefined, string | undefined, string, string, number, Invoice["status"]]> = [
  ["invoice-elevator", "building-89", "unit-89-1204", "resident-saif", "صيانة المصعد", "Elevator maintenance", 700, "due"], ["invoice-89-paid-1", "building-89", "unit-89-202", "resident-lina", "رسوم اتحاد الملاك", "HOA fee", 950, "paid"],
  ["invoice-89-paid-2", "building-89", "unit-89-303", "resident-omar", "خدمات المبنى", "Building services", 450, "paid"], ["invoice-89-paid-3", "building-89", "unit-89-1204", "resident-saif", "صيانة المداخل", "Entrance maintenance", 300, "paid"],
  ["invoice-nakheel-due", "nakheel-court", "unit-nakheel-101", "resident-noura", "فاتورة ماء", "Water invoice", 260, "due"], ["invoice-nakheel-overdue", "nakheel-court", "unit-nakheel-202", "resident-yara", "رسوم تأخير", "Late fee", 180, "overdue"],
  ["invoice-jeddah-upcoming", "jeddah-view", "unit-jeddah-101", "resident-hassan", "تنظيف الخزان", "Tank cleaning", 520, "upcoming"], ["invoice-jeddah-paid", "jeddah-view", "unit-jeddah-202", "resident-maha", "اشتراك الأمن", "Security subscription", 330, "paid"],
  ["invoice-wadi-due", "wadi-homes", "unit-wadi-101", "resident-adel", "صيانة دورية", "Routine maintenance", 410, "due"], ["invoice-wadi-upcoming", "wadi-homes", "unit-wadi-101", "resident-adel", "تشجير الحي", "Neighborhood landscaping", 680, "upcoming"],
];
const invoices: Invoice[] = invoiceRows.map(([id, buildingId, unitId, residentId, ar, en, subtotal, status], index) => ({ id, buildingId, unitId, residentId, title: text(ar, en), category: "demo", subtotal, tax: 0, total: subtotal, dueDate: id === "invoice-elevator" ? "2026-08-08T12:00:00+03:00" : `2026-08-${String(4 + index).padStart(2, "0")}T12:00:00+03:00`, status, createdAt: DATE }));

const serviceFamilies: ServiceFamily[] = [
  ["care-cleaning", "العناية والتنظيف", "Care & cleaning", "خدمات نظافة المنزل والمبنى", "Home and building cleaning", "broom"], ["home-maintenance", "صيانة المنزل", "Home maintenance", "إصلاحات موثوقة عند الطلب", "Trusted repairs on demand", "wrench"],
  ["building-tech-safety", "تقنية وسلامة المبنى", "Building tech & safety", "حماية وتحكم ذكي", "Smart protection and control", "shield-check"], ["water-utilities", "المياه والمرافق", "Water & utilities", "إمدادات ومرافق أساسية", "Essential utilities", "drop"],
  ["automotive-mobility", "السيارات والتنقل", "Automotive & mobility", "خدمة السيارة حيث تقيم", "Car service where you live", "car-profile"], ["daily-needs", "الاحتياجات اليومية", "Daily needs", "طلبات سريعة للمنزل", "Quick home essentials", "basket"],
  ["home-fitout-moving", "التجهيز والنقل", "Home fitout & moving", "تجهيز المنزل والانتقال", "Fit out and move home", "armchair"], ["community-membership", "المجتمع والعضوية", "Community & membership", "عروض جيرة الخاصة", "Jeerah member benefits", "users-three"],
].map(([id, ar, en, arDescription, enDescription, iconKey]) => ({ id: id as ServiceFamilyId, name: text(ar, en), description: text(arDescription, enDescription), iconKey }));

interface ServiceSpec {
  key: RequiredServiceKey;
  familyId: ServiceFamilyId;
  name: [string, string];
  description: [string, string];
  requirements: [string, string];
  aliases: string[];
  imageId: string;
  scope: ServiceOffering["scope"];
  fulfillment: ServiceFulfillment[];
  pricing: Pick<ServiceOffering, "pricingModel" | "price" | "startingPrice" | "unitLabel" | "quoteRange">;
  etaMinutes?: number;
  slaMinutes: number;
  durationMinutes: number;
  warrantyDays: number;
}

const fixed = (price: number) => ({ pricingModel: "fixed" as const, price });
const startingAt = (startingPrice: number) => ({ pricingModel: "starting-at" as const, startingPrice });
const perUnit = (price: number, ar: string, en: string) => ({ pricingModel: "per-unit" as const, price, unitLabel: text(ar, en) });
const quoted = (min: number, max: number) => ({ pricingModel: "quote-required" as const, quoteRange: { min, max } });

/**
 * Every offering carries its own localized description, requirements, curated
 * Arabic and English search aliases, and the closest demo photograph, so no
 * catalog card can render without a story or a next action.
 */
const serviceSpecs: ServiceSpec[] = [
  {
    key: "hvac-maintenance", familyId: "home-maintenance", name: ["صيانة وتنظيف المكيفات", "HVAC maintenance"],
    description: ["فحص وتنظيف وحدات التكييف السبليت والمركزي مع قياس كفاءة التبريد.", "Inspection and deep cleaning for split and central air conditioning with a cooling-efficiency check."],
    requirements: ["يلزم وصول آمن للوحدة الخارجية ومصدر كهرباء قريب.", "Safe access to the outdoor unit and a nearby power outlet are required."],
    aliases: ["مكيف", "مكيفات", "تكييف", "التكييف", "تبريد", "سبليت", "ac", "air conditioning", "hvac", "cooling"],
    imageId: "hvac-technician", scope: "both", fulfillment: ["on-demand", "scheduled", "group"], pricing: startingAt(180),
    etaMinutes: 45, slaMinutes: 120, durationMinutes: 90, warrantyDays: 60,
  },
  {
    key: "electrical-maintenance", familyId: "home-maintenance", name: ["صيانة كهربائية", "Electrical maintenance"],
    description: ["إصلاح الإنارة والمفاتيح ولوحات التوزيع بواسطة فني كهرباء معتمد في العرض التجريبي.", "Lighting, switch, and distribution-board repairs by a certified demo electrician."],
    requirements: ["يجب فصل التيار عن الدائرة المتأثرة قبل وصول الفني.", "Power to the affected circuit must be switched off before the technician arrives."],
    aliases: ["كهربائي", "كهرباء", "كهربا", "انارة", "قواطع", "electrician", "electrical", "wiring", "power"],
    imageId: "hvac-technician", scope: "both", fulfillment: ["on-demand", "scheduled"], pricing: startingAt(150),
    etaMinutes: 40, slaMinutes: 120, durationMinutes: 60, warrantyDays: 45,
  },
  {
    key: "plumbing-maintenance", familyId: "home-maintenance", name: ["صيانة سباكة", "Plumbing maintenance"],
    description: ["معالجة التسريبات وانسداد الصرف وتغيير الخلاطات مع اختبار ضغط بعد الإصلاح.", "Leak, blockage, and mixer repairs with a post-repair pressure test."],
    requirements: ["يلزم الوصول إلى محبس المياه الرئيسي للوحدة.", "Access to the unit's main water valve is required."],
    aliases: ["سباك", "سباكة", "تسريب", "صرف", "مواسير", "plumber", "plumbing", "leak", "drain"],
    imageId: "hvac-technician", scope: "both", fulfillment: ["on-demand", "scheduled"], pricing: startingAt(160),
    etaMinutes: 35, slaMinutes: 120, durationMinutes: 60, warrantyDays: 45,
  },
  {
    key: "general-maintenance", familyId: "home-maintenance", name: ["صيانة عامة", "General maintenance"],
    description: ["زيارة فحص شاملة تعالج الأعطال الصغيرة في الأبواب والدهان والتركيبات.", "A broad inspection visit covering small door, paint, and fixture faults."],
    requirements: ["يفضل تجهيز قائمة بالأعطال قبل الزيارة.", "A short fault list before the visit keeps the demo call efficient."],
    aliases: ["صيانة", "صيانه عامه", "اصلاح", "ترميم", "maintenance", "repair", "handywork"],
    imageId: "hvac-technician", scope: "both", fulfillment: ["on-demand", "scheduled"], pricing: startingAt(140),
    etaMinutes: 50, slaMinutes: 180, durationMinutes: 75, warrantyDays: 30,
  },
  {
    key: "hourly-handyman", familyId: "home-maintenance", name: ["فني بالساعة", "Hourly handyman"],
    description: ["فني متعدد المهارات يعمل بالساعة لتركيب الرفوف والستائر والمهام الصغيرة.", "A multi-skilled technician billed hourly for shelves, curtains, and small jobs."],
    requirements: ["يبدأ الاحتساب من وصول الفني، والحد الأدنى ساعة واحدة.", "Billing starts on arrival with a one-hour minimum."],
    aliases: ["فني", "بالساعه", "نجار", "تركيب", "handyman", "hourly", "fitting"],
    imageId: "hvac-technician", scope: "apartment", fulfillment: ["on-demand"], pricing: perUnit(85, "للساعة", "per hour"),
    etaMinutes: 30, slaMinutes: 90, durationMinutes: 60, warrantyDays: 14,
  },
  {
    key: "appliance-maintenance", familyId: "home-maintenance", name: ["صيانة الأجهزة المنزلية", "Appliance maintenance"],
    description: ["فحص وإصلاح الغسالات والثلاجات والأفران مع تقرير حالة مكتوب.", "Washer, fridge, and oven diagnostics and repair with a written condition report."],
    requirements: ["يلزم إفراغ الجهاز قبل الفحص وتوفير مساحة حوله.", "The appliance must be emptied and clear of obstructions."],
    aliases: ["غساله", "ثلاجه", "فرن", "اجهزه", "appliance", "washer", "fridge", "oven"],
    imageId: "hvac-technician", scope: "apartment", fulfillment: ["on-demand", "scheduled"], pricing: startingAt(170),
    etaMinutes: 55, slaMinutes: 180, durationMinutes: 70, warrantyDays: 60,
  },
  {
    key: "home-cleaning", familyId: "care-cleaning", name: ["تنظيف المنزل", "Home cleaning"],
    description: ["فريق تنظيف كامل للشقة يشمل الأرضيات والحمامات والمطبخ بمواد آمنة.", "A full apartment clean covering floors, bathrooms, and kitchen with safe products."],
    requirements: ["يفضل إخلاء الأسطح من المقتنيات الشخصية قبل الموعد.", "Clearing personal items from surfaces before the visit is recommended."],
    aliases: ["تنظيف", "نظافه", "عماله", "ترتيب", "cleaning", "housekeeping", "deep clean"],
    imageId: "cleaning-team", scope: "apartment", fulfillment: ["scheduled", "recurring"], pricing: startingAt(220),
    slaMinutes: 240, durationMinutes: 180, warrantyDays: 7,
  },
  {
    key: "pest-control", familyId: "care-cleaning", name: ["مكافحة الحشرات", "Pest control"],
    description: ["رش وقائي معتمد للحشرات المنزلية مع متابعة بعد أسبوعين.", "Certified preventive treatment for household pests with a two-week follow-up."],
    requirements: ["يلزم مغادرة الوحدة لمدة ساعتين بعد الرش.", "The unit must be vacated for two hours after treatment."],
    aliases: ["حشرات", "مكافحه", "رش", "صراصير", "نمل", "pest", "insects", "spray"],
    imageId: "cleaning-team", scope: "apartment", fulfillment: ["scheduled", "recurring"], pricing: startingAt(260),
    slaMinutes: 180, durationMinutes: 90, warrantyDays: 30,
  },
  {
    key: "bedding-laundry", familyId: "care-cleaning", name: ["غسيل المفروشات", "Bedding laundry"],
    description: ["استلام وغسل وكي المفروشات والستائر وإعادتها معلّقة خلال يومين.", "Pickup, wash, and press for bedding and curtains, returned hung within two days."],
    requirements: ["يلزم تجهيز القطع في كيس واحد عند نقطة الاستلام.", "Items must be bagged together at the pickup point."],
    aliases: ["مفروشات", "غسيل", "ستائر", "مغسله", "laundry", "bedding", "linen"],
    imageId: "cleaning-team", scope: "apartment", fulfillment: ["scheduled", "recurring"], pricing: startingAt(140),
    slaMinutes: 2880, durationMinutes: 45, warrantyDays: 7,
  },
  {
    key: "building-washing", familyId: "care-cleaning", name: ["غسيل واجهات المبنى", "Building washing"],
    description: ["غسيل الواجهات والمداخل بضغط الماء مع تأمين المنطقة أثناء العمل.", "Pressure washing for facades and entrances with the work area secured."],
    requirements: ["يلزم اعتماد إدارة المبنى وإغلاق الشرفات أثناء العمل.", "Building-management approval and closed balconies are required."],
    aliases: ["واجهات", "غسيل المبنى", "ضغط", "facade", "building wash", "pressure wash"],
    imageId: "cleaning-team", scope: "building", fulfillment: ["quote", "group"], pricing: quoted(900, 1400),
    slaMinutes: 1440, durationMinutes: 300, warrantyDays: 30,
  },
  {
    key: "entrance-fragrance", familyId: "care-cleaning", name: ["تعطير المداخل", "Entrance fragrance"],
    description: ["برنامج تعطير دوري للمداخل والمصاعد بروائح خفيفة معتمدة.", "A recurring fragrance programme for entrances and lifts using light approved scents."],
    requirements: ["يلزم اعتماد إدارة المبنى لاختيار الرائحة.", "Building management approves the selected scent."],
    aliases: ["تعطير", "معطر", "روائح", "مداخل", "fragrance", "scent", "aroma"],
    imageId: "cleaning-team", scope: "building", fulfillment: ["recurring", "group"], pricing: startingAt(140),
    slaMinutes: 720, durationMinutes: 40, warrantyDays: 14,
  },
  {
    key: "cleaning-supplies", familyId: "daily-needs", name: ["مستلزمات التنظيف", "Cleaning supplies"],
    description: ["سلة مستلزمات تنظيف أساسية تصل إلى باب الوحدة خلال ساعة.", "A core cleaning-supplies basket delivered to the unit door within the hour."],
    requirements: ["يلزم وجود مستلم عند الباب لإتمام التسليم.", "Someone must be at the door to receive the delivery."],
    aliases: ["مستلزمات", "منظفات", "صابون", "supplies", "detergent", "cleaning kit"],
    imageId: "cleaning-team", scope: "apartment", fulfillment: ["on-demand", "scheduled"], pricing: fixed(95),
    etaMinutes: 45, slaMinutes: 90, durationMinutes: 15, warrantyDays: 3,
  },
  {
    key: "grocery-delivery", familyId: "daily-needs", name: ["توصيل البقالة", "Grocery delivery"],
    description: ["طلب بقالة يومي من متجر الحي مع اختيار بديل عند نفاد الصنف.", "A daily neighbourhood grocery run with substitutions when an item is out of stock."],
    requirements: ["يلزم تحديد بدائل مقبولة للأصناف غير المتوفرة.", "Acceptable substitutions must be selected for unavailable items."],
    aliases: ["بقاله", "تسوق", "سوبرماركت", "grocery", "supermarket", "shopping"],
    imageId: "delivery-utilities", scope: "apartment", fulfillment: ["on-demand", "scheduled"], pricing: fixed(35),
    etaMinutes: 40, slaMinutes: 90, durationMinutes: 20, warrantyDays: 1,
  },
  {
    key: "produce-delivery", familyId: "daily-needs", name: ["توصيل الخضار والفواكه", "Produce delivery"],
    description: ["صندوق خضار وفواكه موسمي يُجهز صباح يوم التوصيل.", "A seasonal fruit and vegetable box packed on the morning of delivery."],
    requirements: ["يتم التوصيل ضمن فترة صباحية محددة مسبقًا.", "Delivery happens inside a pre-selected morning window."],
    aliases: ["خضار", "فواكه", "صندوق", "produce", "vegetables", "fruit box"],
    imageId: "delivery-utilities", scope: "apartment", fulfillment: ["scheduled", "recurring"], pricing: fixed(110),
    slaMinutes: 720, durationMinutes: 20, warrantyDays: 1,
  },
  {
    key: "neighbor-gifts", familyId: "community-membership", name: ["هدايا الجيران", "Neighbor gifts"],
    description: ["إهداء خدمة أو سلة ترحيب لجار عبر قائمة علاقات تجريبية آمنة.", "Gift a service or welcome basket to a neighbour through a safe fictional relationship list."],
    requirements: ["لا يتم كشف أي بيانات اتصال أو أرقام وحدات للجيران.", "No neighbour contact details or apartment numbers are ever revealed."],
    aliases: ["هديه", "هدايا", "جار", "اهداء", "gift", "neighbor", "present"],
    imageId: "delivery-utilities", scope: "apartment", fulfillment: ["on-demand"], pricing: fixed(75),
    etaMinutes: 60, slaMinutes: 120, durationMinutes: 20, warrantyDays: 3,
  },
  {
    key: "gas-delivery", familyId: "water-utilities", name: ["توصيل أسطوانات الغاز", "Gas delivery"],
    description: ["توصيل أسطوانة غاز مفحوصة مع تركيبها واختبار التسريب.", "A checked gas cylinder delivered, fitted, and leak-tested."],
    requirements: ["يلزم إغلاق المصدر الحالي قبل وصول الفني.", "The current supply must be closed before the technician arrives."],
    aliases: ["غاز", "اسطوانه", "انبوبه", "gas", "cylinder", "lpg"],
    imageId: "delivery-utilities", scope: "apartment", fulfillment: ["on-demand", "scheduled"], pricing: fixed(120),
    etaMinutes: 60, slaMinutes: 180, durationMinutes: 25, warrantyDays: 7,
  },
  {
    key: "water-delivery", familyId: "water-utilities", name: ["توصيل مياه الشرب", "Water delivery"],
    description: ["قوارير مياه شرب معبأة تُسلم إلى المطبخ مع سحب الفارغ.", "Sealed drinking-water bottles delivered to the kitchen with empties collected."],
    requirements: ["يلزم توفر مكان تخزين داخل الوحدة للقوارير.", "In-unit storage space for the bottles is required."],
    aliases: ["ماء", "مياه", "قوارير", "شرب", "water", "bottles", "drinking water"],
    imageId: "delivery-utilities", scope: "apartment", fulfillment: ["scheduled", "recurring"], pricing: fixed(60),
    slaMinutes: 720, durationMinutes: 15, warrantyDays: 1,
  },
  {
    key: "tank-fill", familyId: "water-utilities", name: ["تعبئة خزان المياه", "Tank fill"],
    description: ["وايت مياه معتمد لتعبئة خزان المبنى مع قراءة عداد قبل وبعد التعبئة.", "A certified water tanker fills the building tank with a meter reading before and after."],
    requirements: ["يلزم وصول الوايت إلى فتحة الخزان واعتماد الإدارة.", "Tanker access to the tank inlet and management approval are required."],
    aliases: ["وايت", "خزان", "تعبئه", "ماء الخزان", "tank", "tanker", "water tank"],
    imageId: "delivery-utilities", scope: "building", fulfillment: ["on-demand", "scheduled"], pricing: startingAt(220),
    etaMinutes: 90, slaMinutes: 240, durationMinutes: 45, warrantyDays: 3,
  },
  {
    key: "sewage-service", familyId: "water-utilities", name: ["خدمة الصرف الصحي", "Sewage service"],
    description: ["شفط وتنظيف بيارة المبنى مع تعقيم المحيط بعد العمل.", "Building sump pump-out and cleaning with the surrounding area disinfected."],
    requirements: ["يلزم اعتماد إدارة المبنى وإخلاء المواقف المجاورة.", "Management approval and cleared adjacent parking are required."],
    aliases: ["صرف", "بياره", "شفط", "مجاري", "sewage", "drainage", "sump"],
    imageId: "delivery-utilities", scope: "building", fulfillment: ["quote"], pricing: quoted(600, 1100),
    slaMinutes: 1440, durationMinutes: 120, warrantyDays: 14,
  },
  {
    key: "naqi-water-filtration", familyId: "water-utilities", name: ["فلترة مياه نقي", "Naqi water filtration"],
    description: ["تركيب وتغيير فلاتر المياه المنزلية مع اختبار جودة الماء بعد التركيب.", "Home water-filter installation and cartridge changes with a post-fit quality test."],
    requirements: ["يلزم وجود مخرج مياه أسفل حوض المطبخ.", "A water outlet under the kitchen sink is required."],
    aliases: ["فلتر", "فلاتر", "نقي", "تنقيه", "filter", "filtration", "water quality"],
    imageId: "delivery-utilities", scope: "apartment", fulfillment: ["scheduled", "recurring"], pricing: startingAt(190),
    slaMinutes: 720, durationMinutes: 60, warrantyDays: 90,
  },
  {
    key: "furniture-moving", familyId: "home-fitout-moving", name: ["نقل الأثاث", "Furniture moving"],
    description: ["فك وتغليف ونقل الأثاث بين الوحدات مع إعادة التركيب في الموقع الجديد.", "Dismantling, wrapping, and moving furniture between units with reassembly on arrival."],
    requirements: ["يلزم حجز المصعد وموقف الشاحنة مسبقًا.", "The service lift and a truck bay must be reserved in advance."],
    aliases: ["نقل", "عفش", "اثاث", "ترحيل", "moving", "furniture", "relocation"],
    imageId: "delivery-utilities", scope: "both", fulfillment: ["quote"], pricing: quoted(800, 2200),
    slaMinutes: 2880, durationMinutes: 300, warrantyDays: 14,
  },
  {
    key: "interior-design", familyId: "home-fitout-moving", name: ["تصميم داخلي", "Interior design"],
    description: ["استشارة تصميم داخلي مع مخطط ألوان ولوحة مواد للوحدة.", "An interior-design consultation with a colour scheme and material board for the unit."],
    requirements: ["يلزم رفع صور تجريبية للمساحة قبل الاستشارة.", "Demo photos of the space are attached before the consultation."],
    aliases: ["تصميم", "ديكور", "داخلي", "اثاث داخلي", "interior", "design", "decor"],
    imageId: "home-technology", scope: "apartment", fulfillment: ["quote"], pricing: quoted(1500, 4500),
    slaMinutes: 4320, durationMinutes: 120, warrantyDays: 30,
  },
  {
    key: "awning-installation", familyId: "home-fitout-moving", name: ["تركيب مظلات", "Awning installation"],
    description: ["تصنيع وتركيب مظلات للشرفات والمواقف بقياسات الموقع.", "Made-to-measure awnings fabricated and fitted for balconies and parking bays."],
    requirements: ["تلزم زيارة موقع لأخذ المقاسات قبل التسعير النهائي.", "A site visit for measurements is required before final pricing."],
    aliases: ["مظلات", "مظله", "سواتر", "awning", "canopy", "shade"],
    imageId: "elevator-maintenance", scope: "both", fulfillment: ["quote"], pricing: quoted(1200, 3600),
    slaMinutes: 4320, durationMinutes: 240, warrantyDays: 365,
  },
  {
    key: "shutter-installation", familyId: "home-fitout-moving", name: ["تركيب الشتر والستائر", "Shutter installation"],
    description: ["تركيب شتر كهربائي أو يدوي للنوافذ مع ضبط الحساسات.", "Electric or manual window shutters fitted with sensor calibration."],
    requirements: ["يلزم مخرج كهرباء قريب للشتر الكهربائي.", "A nearby power outlet is required for electric shutters."],
    aliases: ["شتر", "ستائر", "رول", "shutter", "blinds", "roller"],
    imageId: "elevator-maintenance", scope: "apartment", fulfillment: ["quote"], pricing: quoted(900, 2800),
    slaMinutes: 4320, durationMinutes: 180, warrantyDays: 365,
  },
  {
    key: "stickers-signage", familyId: "home-fitout-moving", name: ["ملصقات ولوحات إرشادية", "Stickers & signage"],
    description: ["تصميم وتركيب لوحات إرشادية وملصقات أرقام للوحدات والمواقف.", "Wayfinding signs and unit or bay number decals designed and applied."],
    requirements: ["يلزم اعتماد النص النهائي قبل الطباعة.", "Final wording must be approved before printing."],
    aliases: ["ملصقات", "لوحات", "ارشاديه", "استيكر", "signage", "stickers", "wayfinding"],
    imageId: "elevator-maintenance", scope: "both", fulfillment: ["quote"], pricing: quoted(350, 1200),
    slaMinutes: 2880, durationMinutes: 120, warrantyDays: 180,
  },
  {
    key: "elevator-maintenance", familyId: "building-tech-safety", name: ["صيانة المصاعد", "Elevator maintenance"],
    description: ["صيانة دورية للمصعد تشمل الكوابل والفرامل وأنظمة الطوارئ.", "Scheduled lift servicing covering cables, brakes, and emergency systems."],
    requirements: ["يلزم إيقاف المصعد عن الخدمة أثناء الصيانة.", "The lift must be taken out of service during the visit."],
    aliases: ["مصعد", "مصاعد", "اسانسير", "elevator", "lift", "hoist"],
    imageId: "elevator-maintenance", scope: "building", fulfillment: ["quote"], pricing: quoted(700, 1800),
    slaMinutes: 1440, durationMinutes: 180, warrantyDays: 90,
  },
  {
    key: "elevator-access-controls", familyId: "building-tech-safety", name: ["تحكم دخول المصعد", "Elevator access controls"],
    description: ["ربط المصعد ببطاقات دخول تحدد الأدوار المسموح بها لكل ساكن.", "Card-based lift access that limits which floors each resident may reach."],
    requirements: ["يلزم اعتماد إدارة المبنى وقائمة الأدوار المسموح بها.", "Management approval and an allowed-floor list are required."],
    aliases: ["تحكم", "بطاقات", "دخول المصعد", "access control", "keycard", "floor lock"],
    imageId: "elevator-maintenance", scope: "building", fulfillment: ["quote"], pricing: quoted(2400, 6000),
    slaMinutes: 4320, durationMinutes: 300, warrantyDays: 180,
  },
  {
    key: "fire-safety", familyId: "building-tech-safety", name: ["السلامة من الحريق", "Fire safety"],
    description: ["فحص طفايات الحريق وأنظمة الإنذار وتحديث بطاقات الصيانة.", "Extinguisher and alarm inspection with maintenance tags refreshed."],
    requirements: ["يلزم الوصول إلى غرفة المضخات ولوحة الإنذار.", "Access to the pump room and alarm panel is required."],
    aliases: ["طفايات", "سلامه", "حريق", "انذار", "fire", "safety", "extinguisher", "alarm"],
    imageId: "elevator-maintenance", scope: "building", fulfillment: ["quote"], pricing: quoted(850, 2400),
    slaMinutes: 1440, durationMinutes: 150, warrantyDays: 365,
  },
  {
    key: "ev-charger-installation", familyId: "building-tech-safety", name: ["تركيب شاحن السيارات الكهربائية", "EV charger installation"],
    description: ["تركيب شاحن للسيارات الكهربائية في الموقف مع عداد استهلاك مستقل.", "A parking-bay EV charger fitted with its own consumption meter."],
    requirements: ["يلزم اعتماد إدارة المبنى وسعة كهربائية كافية.", "Management approval and sufficient electrical capacity are required."],
    aliases: ["شاحن", "كهربائيه", "سياره كهربائيه", "ev", "charger", "electric vehicle"],
    imageId: "elevator-maintenance", scope: "building", fulfillment: ["quote"], pricing: quoted(2800, 7500),
    slaMinutes: 4320, durationMinutes: 300, warrantyDays: 365,
  },
  {
    key: "camera-installation", familyId: "building-tech-safety", name: ["تركيب كاميرات المراقبة", "Camera installation"],
    description: ["تركيب كاميرات مراقبة للمداخل والممرات مع تخزين محلي مشفر.", "Entrance and corridor cameras installed with encrypted local storage."],
    requirements: ["يلزم اعتماد الإدارة والالتزام بمواضع تصوير المناطق العامة فقط.", "Management approval is required and cameras cover public areas only."],
    aliases: ["كاميرات", "كاميرا", "مراقبه", "camera", "cctv", "surveillance"],
    imageId: "home-technology", scope: "both", fulfillment: ["quote"], pricing: quoted(1100, 3200),
    slaMinutes: 2880, durationMinutes: 240, warrantyDays: 180,
  },
  {
    key: "smart-lock-installation", familyId: "building-tech-safety", name: ["تركيب الأقفال الذكية", "Smart lock installation"],
    description: ["تركيب قفل ذكي للباب الرئيسي مع رموز مؤقتة للزوار وسجل دخول.", "A smart lock fitted to the main door with temporary visitor codes and an access log."],
    requirements: ["يلزم أن تكون سماكة الباب ضمن نطاق القفل المختار.", "The door thickness must fall inside the selected lock's range."],
    aliases: ["اقفال ذكيه", "قفل ذكي", "اقفال", "قفل", "دجيتال", "smart lock", "digital lock", "keyless"],
    imageId: "home-technology", scope: "apartment", fulfillment: ["scheduled", "quote"], pricing: startingAt(450),
    slaMinutes: 1440, durationMinutes: 90, warrantyDays: 365,
  },
  {
    key: "internet-installation", familyId: "building-tech-safety", name: ["تركيب الإنترنت", "Internet installation"],
    description: ["تمديد ألياف بصرية داخل الوحدة وضبط الراوتر وقياس السرعة.", "In-unit fibre routing with router setup and a speed check."],
    requirements: ["يلزم توفر نقطة ألياف نشطة في المبنى.", "An active building fibre point is required."],
    aliases: ["انترنت", "شبكه", "الياف", "راوتر", "internet", "fiber", "router", "wifi"],
    imageId: "home-technology", scope: "apartment", fulfillment: ["scheduled"], pricing: fixed(350),
    slaMinutes: 2880, durationMinutes: 120, warrantyDays: 90,
  },
  {
    key: "mobile-car-wash", familyId: "automotive-mobility", name: ["غسيل سيارات متنقل", "Mobile car wash"],
    description: ["غسيل خارجي وداخلي للسيارة في الموقف باستخدام ماء محدود.", "Interior and exterior car wash at your bay using a low-water method."],
    requirements: ["يلزم أن تكون السيارة في موقف يسمح بالوصول من كل الجهات.", "The car must sit in a bay reachable from all sides."],
    aliases: ["غسيل سياره", "غسيل سيارات", "تلميع", "car wash", "detailing", "valet"],
    imageId: "mobile-car-care", scope: "apartment", fulfillment: ["on-demand", "scheduled"], pricing: fixed(90),
    etaMinutes: 40, slaMinutes: 120, durationMinutes: 50, warrantyDays: 2,
  },
  {
    key: "mobile-car-maintenance", familyId: "automotive-mobility", name: ["صيانة سيارات متنقلة", "Mobile car maintenance"],
    description: ["فحص وصيانة خفيفة للسيارة في الموقع مثل الزيوت والبطارية والفلاتر.", "On-site light car servicing such as oil, battery, and filter work."],
    requirements: ["يلزم إيقاف المحرك وتبريده قبل بدء العمل.", "The engine must be off and cooled before work starts."],
    aliases: ["صيانه سياره", "زيت", "بطاريه", "ميكانيكي", "car service", "oil change", "battery"],
    imageId: "mobile-car-care", scope: "apartment", fulfillment: ["quote"], pricing: quoted(300, 900),
    slaMinutes: 1440, durationMinutes: 120, warrantyDays: 60,
  },
  {
    key: "mobile-tire-change", familyId: "automotive-mobility", name: ["تغيير الإطارات المتنقل", "Mobile tire change"],
    description: ["تغيير أو إصلاح الإطارات في الموقف مع ضبط ضغط الهواء والاتزان.", "Tyre replacement or repair at your bay with pressure and balance checks."],
    requirements: ["يلزم توفر الإطار الاحتياطي أو تحديد المقاس المطلوب.", "A spare tyre or the exact required size must be available."],
    aliases: ["كفرات", "اطارات", "كفر", "بنشر", "tire", "tyre", "puncture", "wheel"],
    imageId: "mobile-car-care", scope: "apartment", fulfillment: ["on-demand"], pricing: startingAt(180),
    etaMinutes: 35, slaMinutes: 90, durationMinutes: 45, warrantyDays: 30,
  },
];

const providerSpecs: Array<[string, string, string, RequiredServiceKey[], string, number, number, number]> = [
  ["provider-madar-home", "المدار للخدمات المنزلية", "Al Madar Home Services", ["general-maintenance", "hourly-handyman", "appliance-maintenance", "electrical-maintenance", "plumbing-maintenance"], "hvac-technician", 4.7, 214, 25],
  ["provider-coolair", "كول إير لخدمات التكييف", "Coolair Climate Care", ["hvac-maintenance"], "hvac-technician", 4.8, 186, 20],
  ["provider-nasma-hvac", "نسمة للتكييف والأجهزة", "Nasma HVAC & Appliances", ["hvac-maintenance", "appliance-maintenance"], "hvac-technician", 4.5, 132, 35],
  ["provider-noor-electric", "نور للأعمال الكهربائية", "Noor Electrical Works", ["electrical-maintenance", "ev-charger-installation"], "hvac-technician", 4.6, 98, 30],
  ["provider-masar-plumbing", "مسار للسباكة", "Masar Plumbing", ["plumbing-maintenance", "sewage-service"], "hvac-technician", 4.4, 121, 28],
  ["provider-safa-water", "مياه صفاء", "Safa Water", ["water-delivery", "tank-fill"], "delivery-utilities", 4.6, 176, 45],
  ["provider-naqi-filtration", "نقي لفلترة المياه", "Naqi Water Filtration", ["naqi-water-filtration", "water-delivery", "tank-fill"], "delivery-utilities", 4.5, 87, 50],
  ["provider-bayt-gas", "غاز البيت", "Bayt Gas", ["gas-delivery"], "delivery-utilities", 4.3, 143, 40],
  ["provider-lamsa-clean", "لمسة نظافة", "Lamsa Cleaning", ["home-cleaning", "bedding-laundry", "entrance-fragrance"], "cleaning-team", 4.8, 231, 30],
  ["provider-hasana-pest", "حصانة لمكافحة الحشرات", "Hasana Pest Control", ["pest-control"], "cleaning-team", 4.7, 109, 55],
  ["provider-wajha-facade", "واجهة للعناية بالمباني", "Wajha Building Care", ["building-washing", "entrance-fragrance", "home-cleaning"], "cleaning-team", 4.4, 76, 60],
  ["provider-madar-elevators", "مصاعد المدار", "Al Madar Elevators", ["elevator-maintenance", "elevator-access-controls"], "elevator-maintenance", 4.6, 64, 90],
  ["provider-safe-vision", "رؤية آمنة للأنظمة", "Safe Vision Systems", ["camera-installation", "smart-lock-installation"], "home-technology", 4.7, 158, 35],
  ["provider-hemaya-safety", "حماية لأنظمة السلامة", "Hemaya Safety Systems", ["fire-safety", "camera-installation", "smart-lock-installation"], "elevator-maintenance", 4.5, 92, 45],
  ["provider-shabaka-connect", "شبكة الوصل للاتصالات", "Shabaka Connect", ["internet-installation"], "home-technology", 4.2, 118, 60],
  ["provider-tariq-auto", "ورشة الطريق المتنقلة", "Road Workshop Mobile", ["mobile-car-maintenance", "mobile-tire-change", "mobile-car-wash"], "mobile-car-care", 4.5, 137, 30],
  ["provider-dar-market", "سوق الدار", "Dar Market", ["grocery-delivery", "produce-delivery", "cleaning-supplies", "neighbor-gifts"], "delivery-utilities", 4.6, 264, 25],
  ["provider-diwan-fitout", "ديوان للتجهيز والنقل", "Diwan Fitout & Moving", ["furniture-moving", "interior-design", "awning-installation", "shutter-installation", "stickers-signage"], "home-technology", 4.4, 71, 120],
];

const providerIdsByServiceKey = new Map<RequiredServiceKey, string[]>();
for (const [providerId, , , keys] of providerSpecs) {
  for (const key of keys) providerIdsByServiceKey.set(key, [...(providerIdsByServiceKey.get(key) ?? []), providerId]);
}

const serviceOfferings: ServiceOffering[] = serviceSpecs.map((spec) => ({
  id: `service-${spec.key}`,
  key: spec.key,
  familyId: spec.familyId,
  providerIds: providerIdsByServiceKey.get(spec.key) ?? [],
  name: text(spec.name[0], spec.name[1]),
  description: text(spec.description[0], spec.description[1]),
  requirements: text(spec.requirements[0], spec.requirements[1]),
  searchAliases: spec.aliases,
  imageId: spec.imageId,
  scope: spec.scope,
  fulfillment: spec.fulfillment,
  ...spec.pricing,
  ...(spec.etaMinutes === undefined ? {} : { etaMinutes: spec.etaMinutes }),
  slaMinutes: spec.slaMinutes,
  durationMinutes: spec.durationMinutes,
  warrantyDays: spec.warrantyDays,
  active: true,
}));

const providers: ServiceProvider[] = providerSpecs.map(([id, ar, en, keys, imageId, rating, reviewCount, responseMinutes]) => ({
  id, name: text(ar, en), serviceIds: keys.map((key) => `service-${key}`), rating, reviewCount, responseMinutes,
  status: "verified-demo", imageId,
}));

const residentById = new Map(residents.map((resident) => [resident.id, resident]));
const unitById = new Map(units.map((unit) => [unit.id, unit]));
const serviceById = new Map(serviceOfferings.map((service) => [service.id, service]));
const residentLocation = (residentId: string) => {
  const resident = residentById.get(residentId)!;
  const unit = unitById.get(resident.unitId)!;
  return { residentId, unitId: unit.id, buildingId: unit.buildingId };
};

const EXECUTION_CHAIN: OrderStatus[] = ["assigned", "en-route", "in-progress", "awaiting-resident-approval", "completed", "refunded"];
/** The full legal status chain a demo order of this fulfillment mode can walk. */
function statusChain(fulfillment: ServiceFulfillment): OrderStatus[] {
  if (fulfillment === "quote") return ["awaiting-quote", "quote-ready", "scheduled", ...EXECUTION_CHAIN];
  if (fulfillment === "on-demand") return ["confirmed", ...EXECUTION_CHAIN];
  return ["scheduled", "confirmed", ...EXECUTION_CHAIN];
}
/** Every seeded order carries the whole path it walked, never a lone event. */
function timelinePath(fulfillment: ServiceFulfillment, status: OrderStatus): OrderStatus[] {
  const chain = statusChain(fulfillment);
  if (status === "cancelled") return [chain[0], "cancelled"];
  const index = chain.indexOf(status);
  return chain.slice(0, index + 1);
}

export const ORDER_STATUS_NOTES: Record<OrderStatus, [string, string]> = {
  "awaiting-quote": ["تم استلام الطلب وجارٍ إعداد عرض السعر التجريبي.", "Request received; the demo quote is being prepared."],
  "quote-ready": ["عرض السعر التجريبي جاهز للمراجعة.", "The demo quote is ready for review."],
  scheduled: ["تم تثبيت الموعد ضمن الفترة المختارة.", "The visit is booked inside the selected window."],
  confirmed: ["تم تأكيد الطلب وإشعار المزود.", "The order is confirmed and the provider is notified."],
  assigned: ["تم تعيين فني تجريبي للطلب.", "A demo technician is assigned to the order."],
  "en-route": ["الفني في الطريق ضمن وقت الوصول المتوقع.", "The technician is on the way inside the expected arrival time."],
  "in-progress": ["العمل جارٍ داخل الموقع.", "Work is under way on site."],
  "awaiting-resident-approval": ["اكتمل العمل وبانتظار موافقة الساكن.", "Work is finished and waiting for resident approval."],
  completed: ["اعتمد الساكن العمل واكتمل الطلب.", "The resident approved the work and the order is complete."],
  cancelled: ["تم إلغاء الطلب التجريبي.", "The demo order was cancelled."],
  refunded: ["تم استرداد المبلغ التجريبي للطلب.", "The demo amount for this order was refunded."],
};

const HOUR = 60 * 60 * 1000;
function buildTimeline(orderId: string, fulfillment: ServiceFulfillment, status: OrderStatus, startedAt: string, images: Partial<Record<OrderStatus, string>> = {}): OrderTimelineEvent[] {
  const path = timelinePath(fulfillment, status);
  const start = Date.parse(startedAt);
  return path.map((step, index) => ({
    id: `${orderId}-${step}`,
    status: step,
    occurredAt: new Date(start + index * HOUR).toISOString(),
    note: text(ORDER_STATUS_NOTES[step][0], ORDER_STATUS_NOTES[step][1]),
    ...(images[step] ? { imageId: images[step] } : {}),
  }));
}

interface OrderRow {
  id: string; status: OrderStatus; serviceKey: RequiredServiceKey; fulfillment: ServiceFulfillment; residentId: string;
  providerId: string; paymentStatus: ServiceOrder["paymentStatus"]; amount?: number; quoteAmount?: number;
  quantity?: number; dealId?: string; startedAt: string; etaMinutes?: number; scheduledAt?: string;
}
const orderRows: OrderRow[] = [
  { id: "order-1", status: "completed", serviceKey: "hvac-maintenance", fulfillment: "on-demand", residentId: "resident-saif", providerId: "provider-coolair", paymentStatus: "paid", amount: 180, quantity: 1, startedAt: "2026-08-01T08:00:00+03:00", etaMinutes: 45 },
  { id: "order-2", status: "cancelled", serviceKey: "general-maintenance", fulfillment: "on-demand", residentId: "resident-lina", providerId: "provider-madar-home", paymentStatus: "cancelled", startedAt: "2026-07-30T09:00:00+03:00" },
  { id: "order-3", status: "scheduled", serviceKey: "produce-delivery", fulfillment: "scheduled", residentId: "resident-omar", providerId: "provider-dar-market", paymentStatus: "paid", amount: 110, quantity: 1, startedAt: "2026-08-02T09:00:00+03:00", scheduledAt: "2026-08-06T08:00:00+03:00" },
  { id: "order-4", status: "en-route", serviceKey: "hourly-handyman", fulfillment: "on-demand", residentId: "resident-saif", providerId: "provider-madar-home", paymentStatus: "paid", amount: 170, quantity: 2, startedAt: "2026-08-03T10:00:00+03:00", etaMinutes: 30 },
  { id: "order-5", status: "assigned", serviceKey: "water-delivery", fulfillment: "scheduled", residentId: "resident-noura", providerId: "provider-safa-water", paymentStatus: "paid", amount: 60, quantity: 1, startedAt: "2026-08-02T10:00:00+03:00", scheduledAt: "2026-08-05T09:00:00+03:00" },
  { id: "order-6", status: "confirmed", serviceKey: "cleaning-supplies", fulfillment: "on-demand", residentId: "resident-yara", providerId: "provider-dar-market", paymentStatus: "paid", amount: 95, quantity: 1, startedAt: "2026-08-03T09:00:00+03:00", etaMinutes: 45 },
  { id: "order-7", status: "in-progress", serviceKey: "elevator-maintenance", fulfillment: "quote", residentId: "resident-noura", providerId: "provider-madar-elevators", paymentStatus: "paid", amount: 1200, quoteAmount: 1200, startedAt: "2026-07-29T08:00:00+03:00" },
  { id: "order-8", status: "awaiting-resident-approval", serviceKey: "tank-fill", fulfillment: "scheduled", residentId: "resident-hassan", providerId: "provider-safa-water", paymentStatus: "pending", amount: 220, quantity: 1, startedAt: "2026-08-01T06:00:00+03:00", scheduledAt: "2026-08-02T06:00:00+03:00" },
  { id: "order-9", status: "awaiting-quote", serviceKey: "sewage-service", fulfillment: "quote", residentId: "resident-maha", providerId: "provider-masar-plumbing", paymentStatus: "pending", startedAt: "2026-08-03T07:00:00+03:00" },
  { id: "order-10", status: "quote-ready", serviceKey: "mobile-car-maintenance", fulfillment: "quote", residentId: "resident-hassan", providerId: "provider-tariq-auto", paymentStatus: "pending", quoteAmount: 620, startedAt: "2026-08-02T11:00:00+03:00" },
  { id: "order-11", status: "refunded", serviceKey: "mobile-tire-change", fulfillment: "on-demand", residentId: "resident-adel", providerId: "provider-tariq-auto", paymentStatus: "refunded", amount: 180, quantity: 1, startedAt: "2026-07-28T12:00:00+03:00", etaMinutes: 35 },
  { id: "order-12", status: "completed", serviceKey: "grocery-delivery", fulfillment: "on-demand", residentId: "resident-adel", providerId: "provider-dar-market", paymentStatus: "paid", amount: 35, quantity: 1, startedAt: "2026-07-31T13:00:00+03:00", etaMinutes: 40 },
  { id: "order-13", status: "quote-ready", serviceKey: "awning-installation", fulfillment: "quote", residentId: "resident-saif", providerId: "provider-diwan-fitout", paymentStatus: "pending", quoteAmount: 2400, startedAt: "2026-08-02T14:00:00+03:00" },
  { id: "order-14", status: "scheduled", serviceKey: "bedding-laundry", fulfillment: "scheduled", residentId: "resident-lina", providerId: "provider-lamsa-clean", paymentStatus: "paid", amount: 140, quantity: 1, startedAt: "2026-08-03T08:00:00+03:00", scheduledAt: "2026-08-07T10:00:00+03:00" },
  { id: "order-15", status: "assigned", serviceKey: "home-cleaning", fulfillment: "recurring", residentId: "resident-omar", providerId: "provider-lamsa-clean", paymentStatus: "paid", amount: 220, quantity: 1, startedAt: "2026-08-02T08:00:00+03:00", scheduledAt: "2026-08-04T08:00:00+03:00" },
  { id: "order-16", status: "in-progress", serviceKey: "camera-installation", fulfillment: "quote", residentId: "resident-noura", providerId: "provider-safe-vision", paymentStatus: "paid", amount: 2100, quoteAmount: 2100, startedAt: "2026-07-30T07:00:00+03:00" },
  { id: "order-17", status: "confirmed", serviceKey: "neighbor-gifts", fulfillment: "on-demand", residentId: "resident-hassan", providerId: "provider-dar-market", paymentStatus: "paid", amount: 75, quantity: 1, startedAt: "2026-08-03T11:00:00+03:00", etaMinutes: 60 },
  { id: "order-18", status: "completed", serviceKey: "building-washing", fulfillment: "group", residentId: "resident-lina", providerId: "provider-wajha-facade", paymentStatus: "paid", amount: 780, quantity: 1, dealId: "deal-facade", startedAt: "2026-07-25T07:00:00+03:00", scheduledAt: "2026-07-26T07:00:00+03:00" },
];

const HVAC_CHECKLIST: Array<[string, string, string]> = [
  ["filter", "تنظيف الفلاتر واستبدال التالف", "Filters cleaned and damaged elements replaced"],
  ["coil", "غسيل الملف الداخلي والخارجي", "Indoor and outdoor coils washed"],
  ["drain", "فتح مجرى التصريف واختباره", "Condensate drain cleared and tested"],
  ["gas", "قياس ضغط غاز التبريد", "Refrigerant pressure measured"],
  ["temp", "قياس فرق الحرارة بعد التشغيل", "Post-service temperature differential measured"],
];

const orders: ServiceOrder[] = orderRows.map((row) => {
  const service = serviceById.get(`service-${row.serviceKey}`)!;
  const completedStory = row.id === "order-1";
  const unitPrice = service.price ?? service.startingPrice ?? row.quoteAmount ?? 0;
  return {
    id: row.id,
    serviceId: service.id,
    providerId: row.providerId,
    ...residentLocation(row.residentId),
    fulfillment: row.fulfillment,
    status: row.status,
    paymentStatus: row.paymentStatus,
    ...(row.amount === undefined ? {} : { amount: row.amount }),
    ...(row.quoteAmount === undefined ? {} : { quoteAmount: row.quoteAmount }),
    ...(row.quantity === undefined ? {} : {
      quantity: row.quantity,
      breakdown: [
        { id: `${row.id}-base`, label: service.unitLabel ?? text("سعر الخدمة", "Service price"), amount: unitPrice },
        ...(row.quantity > 1 ? [{ id: `${row.id}-extra`, label: text("وحدات إضافية", "Additional units"), amount: (row.amount ?? unitPrice) - unitPrice }] : []),
      ],
    }),
    ...(row.dealId === undefined ? {} : { dealId: row.dealId }),
    ...(row.scheduledAt === undefined ? {} : { scheduledAt: row.scheduledAt }),
    ...(row.etaMinutes === undefined ? {} : { etaMinutes: row.etaMinutes }),
    timeline: buildTimeline(row.id, row.fulfillment, row.status, row.startedAt, completedStory ? { "in-progress": "living-room", completed: "hvac-technician" } : {}),
    createdAt: row.startedAt,
    warrantyDays: service.warrantyDays,
    ...(completedStory ? {
      technician: { displayName: text("أبو محمد الشمري", "Abu Mohammed Alshammari"), craft: text("فني تكييف معتمد", "Certified HVAC technician"), badgeId: "DEMO-TECH-114" },
      checklist: HVAC_CHECKLIST.map(([id, ar, en]) => ({ id: `${row.id}-${id}`, label: text(ar, en), done: true })),
      beforeImageId: "living-room",
      afterImageId: "hvac-technician",
      residentApprovedAt: "2026-08-01T13:00:00+03:00",
    } : {}),
  };
});

const paymentRows: Array<[string, string, Payment["status"]]> = [
  ["invoice-elevator", "resident-saif", "pending"], ["invoice-89-paid-1", "resident-lina", "paid"], ["invoice-89-paid-2", "resident-omar", "paid"], ["invoice-89-paid-3", "resident-saif", "paid"], ["invoice-nakheel-due", "resident-noura", "declined"], ["invoice-nakheel-overdue", "resident-yara", "cancelled"], ["invoice-jeddah-upcoming", "resident-hassan", "timed-out"], ["invoice-jeddah-paid", "resident-maha", "paid"], ["invoice-wadi-due", "resident-adel", "refunded"], ["invoice-wadi-upcoming", "resident-adel", "pending"], ["invoice-elevator", "resident-saif", "pending"], ["invoice-nakheel-due", "resident-noura", "declined"],
];
const payments: Payment[] = paymentRows.map(([invoiceId, residentId, status], index) => {
  const method = (["mada", "visa", "apple-pay"] as const)[index % 3];
  const last4 = PAYMENT_METHOD_MASK[method];
  return { id: `payment-${index + 1}`, invoiceId, residentId, method, status, amount: invoices.find((invoice) => invoice.id === invoiceId)!.total, occurredAt: DATE, reference: `DEMO-${String(index + 1).padStart(4, "0")}`, ...(last4 ? { last4 } : {}) };
});

const OFFER_TERMS: [string, string] = [
  "يسري لمشتركي جيرة بلس في مبنى ٨٩، طلب واحد لكل شهر، ولا يجمع مع عرض جماعي.",
  "Applies to Jeerah Plus subscribers in Building 89, one order per month, not combinable with a group deal.",
];
const offerRows: Array<[RequiredServiceKey, string, number, number, string]> = [
  ["hvac-maintenance", "provider-coolair", 180, 135, "2026-09-30T20:00:00+03:00"],
  ["home-cleaning", "provider-lamsa-clean", 220, 165, "2026-09-15T20:00:00+03:00"],
  ["mobile-car-wash", "provider-tariq-auto", 90, 65, "2026-08-31T20:00:00+03:00"],
  ["water-delivery", "provider-safa-water", 60, 45, "2026-10-31T20:00:00+03:00"],
  ["pest-control", "provider-hasana-pest", 260, 199, "2026-09-30T20:00:00+03:00"],
  ["bedding-laundry", "provider-lamsa-clean", 140, 105, "2026-08-28T20:00:00+03:00"],
  ["grocery-delivery", "provider-dar-market", 35, 25, "2026-12-31T20:00:00+03:00"],
  ["smart-lock-installation", "provider-safe-vision", 450, 360, "2026-07-31T20:00:00+03:00"],
];
const memberOffers: MemberOffer[] = offerRows.map(([key, providerId, regularPrice, memberPrice, validUntil], index) => ({
  id: `member-offer-${index + 1}`,
  serviceId: `service-${key}`,
  providerId,
  title: serviceById.get(`service-${key}`)!.name,
  regularPrice,
  memberPrice,
  validUntil,
  terms: text(OFFER_TERMS[0], OFFER_TERMS[1]),
  active: index !== 7,
}));

const planRows: Array<[RequiredServiceKey, string, RecurringPlan["cadence"], string, boolean, string[]]> = [
  ["home-cleaning", "provider-lamsa-clean", "weekly", "2026-08-10T09:00:00+03:00", true, []],
  ["pest-control", "provider-hasana-pest", "seasonal", "2026-09-01T09:00:00+03:00", true, []],
  ["water-delivery", "provider-safa-water", "monthly", "2026-08-12T09:00:00+03:00", true, ["2026-07-12T09:00:00+03:00"]],
  ["bedding-laundry", "provider-lamsa-clean", "monthly", "2026-08-20T09:00:00+03:00", false, []],
  ["naqi-water-filtration", "provider-naqi-filtration", "quarterly", "2026-10-05T09:00:00+03:00", true, []],
];
/** Recurring plans belong to the signed-in resident only; no one else's plan is seeded. */
const recurringPlans: RecurringPlan[] = planRows.map(([key, providerId, cadence, nextDate, active, skippedDates], index) => ({
  id: `plan-${index + 1}`, serviceId: `service-${key}`, residentId: CURRENT_RESIDENT_ID, providerId, cadence, nextDate, active, skippedDates,
}));

const neighborDeals: NeighborDeal[] = [
  {
    id: "deal-hvac", serviceId: "service-hvac-maintenance", buildingId: "building-89",
    participantIds: ["resident-lina", "resident-omar"], anonymousParticipants: 1,
    thresholds: [{ count: 4, unitPrice: 150 }, { count: 8, unitPrice: 130 }, { count: 12, unitPrice: 110 }],
    basePrice: 180, buildingApproved: true, closesAt: "2026-08-10T18:00:00+03:00",
  },
  {
    id: "deal-facade", serviceId: "service-building-washing", buildingId: "building-89",
    participantIds: ["resident-lina"], anonymousParticipants: 5,
    thresholds: [{ count: 3, unitPrice: 900 }, { count: 6, unitPrice: 780 }, { count: 9, unitPrice: 660 }],
    basePrice: 1050, buildingApproved: true, closesAt: "2026-08-12T18:00:00+03:00",
  },
  {
    id: "deal-fragrance", serviceId: "service-entrance-fragrance", buildingId: "building-89",
    participantIds: [], anonymousParticipants: 1,
    thresholds: [{ count: 3, unitPrice: 120 }, { count: 6, unitPrice: 95 }, { count: 9, unitPrice: 80 }],
    basePrice: 140, buildingApproved: false, closesAt: "2026-08-20T18:00:00+03:00",
  },
];
const neighborRelationships: NeighborRelationship[] = [["neighbor-1", "جار الطابق نفسه", "Neighbor on your floor", "neighbor"], ["neighbor-2", "صديق في المبنى", "Friend in the building", "friend"], ["neighbor-3", "قريب في المبنى", "Relative in the building", "family"]].map(([id, ar, en, relation]) => ({ id, displayName: text(ar, en), relation: relation as NeighborRelationship["relation"] }));
const gifts: NeighborGift[] = [["gift-1", "service-neighbor-gifts", "resident-saif", "neighbor-1", "هدية ترحيب", "sent"], ["gift-2", "service-neighbor-gifts", "resident-lina", "neighbor-2", "شكراً لجيرتك", "redeemed"]].map(([id, serviceId, senderId, recipientRelationshipId, message, status]) => ({ id, serviceId, senderId, recipientRelationshipId, message, status: status as NeighborGift["status"], createdAt: DATE }));
const announcements: Announcement[] = [
  ["announcement-1", "building-89", "تنبيه المصعد", "Elevator notice", "سيتم فحص المصعد مساءً", "The elevator will be inspected this evening", "urgent"], ["announcement-2", "building-89", "تنظيف المداخل", "Entrance cleaning", "تنظيف مجدول غداً", "Cleaning is scheduled tomorrow", "normal"],
  ["announcement-3", "nakheel-court", "تحديث البوابة", "Gate update", "تحديث نظام البوابة", "Gate system update", "important"], ["announcement-4", "jeddah-view", "فعالية الجيران", "Neighbor event", "نلتقي في الصالة", "Meet in the lounge", "normal"],
  ["announcement-5", "wadi-homes", "تنبيه المياه", "Water notice", "اختبار ضغط المياه", "Water pressure test", "important"], ["announcement-6", "nakheel-court", "صيانة دورية", "Routine maintenance", "صيانة خفيفة", "Minor maintenance", "normal"],
].map(([id, buildingId, arTitle, enTitle, arBody, enBody, priority]) => ({ id, buildingId, title: text(arTitle, enTitle), body: text(arBody, enBody), priority: priority as Announcement["priority"], publishedAt: DATE }));
const polls: Poll[] = [
  { id: "poll-1", buildingId: "building-89", question: text("ما أفضل وقت لتنظيف المداخل؟", "What is the best entrance-cleaning time?"), options: [{ id: "poll-1-morning", label: text("الصباح", "Morning"), voterIds: ["resident-saif"] }, { id: "poll-1-evening", label: text("المساء", "Evening"), voterIds: ["resident-lina"] }], closesAt: "2026-08-08T20:00:00+03:00" },
  { id: "poll-2", buildingId: "building-89", question: text("ما وقت البدء المناسب للقاء الجيران؟", "Which start time suits the neighbor meetup?"), options: [{ id: "poll-2-6pm", label: text("٦ مساءً", "6 PM"), voterIds: [] }, { id: "poll-2-7pm", label: text("٧ مساءً", "7 PM"), voterIds: ["resident-lina"] }, { id: "poll-2-8pm", label: text("٨ مساءً", "8 PM"), voterIds: ["resident-omar"] }], closesAt: "2026-08-09T20:00:00+03:00" },
  { id: "poll-3", buildingId: "nakheel-court", question: text("ما أفضل وقت للتنظيف؟", "What is the best cleaning time?"), options: [{ id: "poll-3-morning", label: text("الصباح", "Morning"), voterIds: ["resident-noura"] }, { id: "poll-3-evening", label: text("المساء", "Evening"), voterIds: ["resident-yara"] }], closesAt: "2026-08-08T20:00:00+03:00" },
];
const events: CommunityEvent[] = [
  { id: "event-1", buildingId: "building-89", title: text("لقاء الجيران", "Neighbor meetup"), startsAt: "2026-08-12T19:00:00+03:00", attendeeIds: ["resident-lina", "resident-omar"], capacity: 30 },
  { id: "event-2", buildingId: "jeddah-view", title: text("لقاء الجيران", "Neighbor meetup"), startsAt: "2026-08-12T19:00:00+03:00", attendeeIds: ["resident-hassan", "resident-maha"], capacity: 30 },
];
const visitorPassRows: Array<[string, string, VisitorPass["status"], string]> = [
  ["resident-saif", "Mariam Al Noor", "active", "2026-08-04T12:00:00+03:00"],
  ["resident-lina", "Khaled Rahim", "expired", "2026-08-01T12:00:00+03:00"],
  ["resident-noura", "Noor Al Ameen", "revoked", "2026-08-05T12:00:00+03:00"],
  ["resident-hassan", "Rana Fares", "active", "2026-08-04T20:00:00+03:00"],
  ["resident-adel", "Yusuf Hadi", "active", "2026-08-05T12:00:00+03:00"],
];
const visitorPasses: VisitorPass[] = visitorPassRows.map(([residentId, guestName, status, expiresAt], index) => ({ id: `pass-${index + 1}`, ...residentLocation(residentId), guestName, expiresAt, status }));
const amenityBookingRows: Array<[string, string, AmenityBooking["status"], string]> = [
  ["resident-saif", "gym", "upcoming", amenitySlot("18:00")],
  ["resident-lina", "lounge", "completed", amenitySlot("19:00")],
  ["resident-omar", "meeting-room", "cancelled", amenitySlot("17:00")],
  ["resident-noura", "lounge", "upcoming", amenitySlot("18:00")],
  ["resident-hassan", "gym", "completed", amenitySlot("18:00")],
  ["resident-saif", "lounge", "completed", amenitySlot("20:00")],
];
const amenityBookings: AmenityBooking[] = amenityBookingRows.map(([residentId, amenityKey, status, startsAt], index) => {
  const { buildingId } = residentLocation(residentId);
  return { id: `booking-${index + 1}`, buildingId, residentId, amenityId: `amenity-${buildingId}-${amenityKey}`, startsAt, status };
});
const featuredActivities: Record<string, Pick<Activity, "kind" | "title" | "description" | "occurredAt">> = {
  "activity-1": { kind: "landscaping", title: text("اكتملت أعمال تنسيق الحدائق", "Landscaping completed"), description: text("أمر العمل #L-2458", "Work order #L-2458"), occurredAt: "2026-08-03T10:24:00+03:00" },
  "activity-5": { kind: "notice", title: text("تنبيه مجتمعي", "Community notice"), description: text("صيانة المياه في ٦ أغسطس", "Water maintenance on Aug 6"), occurredAt: "2026-08-02T18:30:00+03:00" },
  "activity-9": { kind: "inspection", title: text("تمت جدولة فحص المصعد", "Elevator inspection scheduled"), description: text("الفحص هذا المساء", "Inspection this evening"), occurredAt: "2026-08-01T16:00:00+03:00" },
};
const activities: Activity[] = Array.from({ length: 12 }, (_, index) => {
  const id = `activity-${index + 1}`;
  return {
    id,
    buildingId: BUILDING_IDS[index % 4],
    ...(featuredActivities[id] ?? { kind: "community", title: text("تحديث المجتمع", "Community update"), description: text("آخر مستجدات المبنى للسكان", "Latest building update for residents"), occurredAt: DATE }),
  };
});

export function createSeedState(now: Date = new Date(DATE)): DemoState {
  return structuredClone({ schemaVersion: 2, locale: "ar", scenario: "normal", now: now.toISOString(), currentResidentId: CURRENT_RESIDENT_ID, currentBuildingId: CURRENT_BUILDING_ID, buildings, units, residents, invoices, payments, serviceFamilies, serviceOfferings, providers, orders, memberOffers, recurringPlans, neighborDeals, neighborRelationships, announcements, polls, events, visitorPasses, amenities, amenityBookings, gifts, activities, auditLog: [] } satisfies DemoState);
}
