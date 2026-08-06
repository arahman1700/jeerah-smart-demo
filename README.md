# Jeerah Smart — Demo | جيرة سمارت — النسخة التجريبية

**Live demo:** https://arahman1700.github.io/jeerah-smart-demo/

> **⚠️ Demo only — عرض تجريبي فقط.** Every person, building, provider, invoice, and payment in this
> application is fictional. Payments are visibly simulated: no money moves, and the app never asks
> for a real card number, CVV, bank credential, or OTP. Every receipt states
> «عملية تجريبية — لم يتم الخصم» / “Demo transaction — no money was charged.”

---

## العربية

### ما هذا المشروع؟

ديمو أمامي بالكامل (frontend-only) لمنصة «جيرة سمارت» لإدارة مجتمعات السكن: واجهة ساكن بتصميم
جوال قابلة للتثبيت كتطبيق PWA، ولوحة إدارة متجاوبة، تتشاركان نفس البيانات المحلية وتتزامنان
لحظيًا بين التبويبات عبر `IndexedDB` و`BroadcastChannel`. لا يوجد خادم ولا تُرسل أي بيانات خارج
المتصفح.

### الروابط

| السطح | الرابط |
|---|---|
| واجهة الساكن (معاينة بإطار الجهاز) | https://arahman1700.github.io/jeerah-smart-demo/?preview=1 |
| واجهة الساكن (ملء الشاشة) | https://arahman1700.github.io/jeerah-smart-demo/?surface=app |
| لوحة الإدارة | https://arahman1700.github.io/jeerah-smart-demo/?surface=admin |

### أبرز الميزات

- الرئيسية: هوية الساكن سيف الدين، مبنى 89، نبض المجتمع، فاتورة صيانة المصعد SAR 700.
- رحلة دفع تجريبية آمنة: Apple Pay / مدى (رمز تجريبي ظاهر `1234`) / Visa — بدون أي حقول بطاقة حقيقية.
- سوق خدمات من 8 عائلات و35 خدمة: بحث عربي/إنجليزي بمرادفات، مقارنة مزودين، حجز فوري ومجدول
  ومتكرر، طلب عرض سعر، صفقات جماعية، وعروض حصرية للمشتركين.
- المجتمع: إعلانات، استبيانات وتصويت، فعاليات وRSVP، هدايا الجيران، تصاريح زوار برمز QR، وحجز المرافق.
- لوحة الإدارة: مؤشرات مشتقة من نفس البيانات، إدارة العقارات والوحدات والسكان والمالية والمدفوعات
  والطلبات والسوق والنشر والزوار والمرافق والتحليلات وسجل التدقيق واستوديو السيناريو.
- عربي/إنجليزي كاملان مع RTL/LTR حقيقيين، ووصولية: أهداف لمس 44×44، مناطق `aria-live`، وتباين معتمد.

### التشغيل محليًا

```bash
npm ci
npm run dev        # ثم افتح الرابط المعروض
npm run test:run   # كل الاختبارات
npm run verify:release  # كل بوابات الإصدار
```

### التثبيت على الجوال

- **Android (Chrome):** افتح رابط الديمو ← قائمة المتصفح ← «تثبيت التطبيق»، أو استخدم زر التثبيت
  داخل شاشة «التثبيت» في التطبيق.
- **iPhone (Safari):** افتح رابط الديمو ← زر المشاركة ← «الإضافة إلى الشاشة الرئيسية».

بعد التثبيت يمكن تصفح البيانات المخزنة دون اتصال؛ الدفع والحجز والنشر تتطلب اتصالًا وتُمنع دونه
برسالة واضحة.

### إعادة الضبط

من لوحة الإدارة: الإعدادات ← استوديو السيناريو ← اكتب `RESET` ثم «إعادة ضبط الديمو». تعود بيانات
الديمو الأصلية مع الحفاظ على لغتك.

### الخصوصية

كل البيانات محلية داخل متصفحك (IndexedDB) ولا تغادر جهازك. لا توجد حسابات حقيقية ولا تتبّع ولا
طلبات شبكة خارجية من التطبيق.

---

## English

### What is this?

A frontend-only demo of the Jeerah Smart residential community platform: an installable
mobile-first resident PWA and a responsive admin console sharing one local dataset that
synchronizes live across tabs via `IndexedDB` + `BroadcastChannel`. There is no backend and no
data ever leaves the browser.

### URLs

| Surface | URL |
|---|---|
| Resident (device-frame preview) | https://arahman1700.github.io/jeerah-smart-demo/?preview=1 |
| Resident (full screen) | https://arahman1700.github.io/jeerah-smart-demo/?surface=app |
| Admin console | https://arahman1700.github.io/jeerah-smart-demo/?surface=admin |

### Demo identity

The seeded resident is **Saifeldeen**, owner of **Unit 1204, Building 89** (fictional), with a
SAR 700 elevator-maintenance invoice due. The admin surface operates the same fictional portfolio
of four buildings. No sign-in is required — the demo opens straight into these roles.

### Highlights

- Safe simulated payment journey (`method → review → verify → processing → result`) with official
  Apple Pay, mada, and Visa artwork, a visibly displayed mada demo OTP `1234`, and atomic
  invoice/payment/audit/activity updates. No real payment fields exist anywhere.
- Marketplace with 8 families and 35 services: bilingual alias search, provider comparison,
  on-demand/scheduled/recurring booking, quote requests, group deals, and subscriber-exclusive
  offers with upgrade path.
- Community: announcements, polls, events with RSVP, neighbor gifts, QR visitor passes
  (QR content is only `{ demo, passId, expiresAt }`), and amenity booking.
- Admin: state-derived KPIs and analytics, properties/units/residents, finance and demo refunds,
  order provider assignment and quotes, marketplace management, publishing, audit log with local
  CSV export, and a Scenario Studio (normal/empty/offline/overdue/declined/urgent) with a
  typed-`RESET` protected reset that preserves your language.
- Full Arabic/English with real RTL/LTR, reduced-motion support, 44×44 touch targets, `aria-live`
  status regions, and manifest-sourced alt text.

### Run locally

```bash
npm ci
npm run dev             # open the printed URL
npm run test:run        # full Vitest suite
npm run verify:release  # every release gate + Pages artifact checks
```

### Install on a phone

- **Android (Chrome):** open the demo URL → browser menu → *Install app*, or use the in-app
  install button on the Install screen.
- **iPhone (Safari):** open the demo URL → *Share* → *Add to Home Screen*.

Installed or offline, cached data stays readable; demo payments, bookings, and publishing require
a connection and are blocked with a clear localized message.

### Reset

Admin → Settings → Scenario Studio → type `RESET` → *Reset demo*. Seed fixtures return and your
language choice is preserved.

### Architecture

React 19 + TypeScript + Vite on a protected mobile device-preview runtime. App code lives in
`src/jeerah/`: a pure domain reducer, deterministic fictional fixtures, an IndexedDB repository
with BroadcastChannel sync, typed bilingual i18n, the resident FlowStack app, the React Router
admin console, and a build-time-generated service worker (`scripts/generate-sw.mjs`). Icons are
Phosphor Duotone; payment marks are Simple Icons plus the official mada SVG; all brand assets come
from the official Jeerah archive (see `CREDITS.md`).

### Privacy

Everything is stored locally in your browser (IndexedDB). No real accounts, no analytics, no
external network calls from the app.
