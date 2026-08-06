import { cleanup, fireEvent, render, screen, within, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode, type ReactElement, type ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach } from "vitest";
import { AdminRoutes } from "../../../src/jeerah/admin/AdminApp";
import { DemoProvider } from "../../../src/jeerah/data/DemoProvider";
import { createMemoryDemoRepository, type DemoRepository } from "../../../src/jeerah/data/repository";
import { createSeedState } from "../../../src/jeerah/domain/fixtures";
import type { DemoState, Locale } from "../../../src/jeerah/domain/models";
import type { SimulatedPaymentOutcome } from "../../../src/jeerah/domain/paymentSimulator";
import { I18nProvider } from "../../../src/jeerah/i18n/I18nProvider";
import { ResidentApp, type ResidentScreenId } from "../../../src/jeerah/resident/ResidentApp";
import type { PaymentSimulationConfig } from "../../../src/jeerah/resident/PaymentSimulation";
import { MobileRuntime } from "../../../src/mobile/MobileRuntime";

export function renderDemo(ui: ReactElement, options?: RenderOptions) {
  return render(<MobileRuntime>{ui}</MobileRuntime>, options);
}

/**
 * The protected FlowStack binds a use-gesture drag whose tap filter cancels
 * synthetic pointer clicks under jsdom. Real pointer input is unaffected, so
 * anything inside FlowStack is activated directly.
 */
export function tap(element: HTMLElement) {
  fireEvent.click(element);
}

type ResidentRenderOptions = RenderOptions & {
  locale?: Locale;
  repository?: DemoRepository;
  screenId?: ResidentScreenId;
  simulation?: PaymentSimulationConfig;
  state?: DemoState;
  strict?: boolean;
};

const liveRenders = new Set<() => void>();
let renderSequence = 0;

/** Every render owns an isolated broadcast channel so parallel cases cannot bleed. */
function nextChannelName() {
  renderSequence += 1;
  const unique = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `jeerah-resident-${renderSequence}-${unique}`;
}

/**
 * Renders the resident app the way production composes it, in the protected
 * mobile runtime, and hands the caller the seeded state plus its repository.
 */
export function renderResident(options: ResidentRenderOptions = {}) {
  const {
    locale,
    repository: suppliedRepository,
    screenId = "home",
    simulation,
    state: suppliedState,
    strict = false,
    ...renderOptions
  } = options;

  const state = structuredClone(suppliedState ?? createSeedState());
  if (locale) state.locale = locale;
  const channelName = nextChannelName();
  const repository = suppliedRepository ?? createMemoryDemoRepository(state, channelName);
  const user = userEvent.setup();
  const tree: ReactNode = (
    <MobileRuntime>
      <DemoProvider repository={repository}>
        <I18nProvider>
          <ResidentApp initialScreen={screenId} simulation={simulation} />
        </I18nProvider>
      </DemoProvider>
    </MobileRuntime>
  );
  const result = render(strict ? <StrictMode>{tree}</StrictMode> : tree, renderOptions);

  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    liveRenders.delete(dispose);
    result.unmount();
    if (!suppliedRepository) repository.close();
  };
  liveRenders.add(dispose);

  return { ...result, user, state, repository, channelName, cleanup: dispose };
}

export function renderResidentAt(screenId: ResidentScreenId, options: Omit<ResidentRenderOptions, "screenId"> = {}) {
  return renderResident({ ...options, screenId });
}

type AdminRenderOptions = RenderOptions & {
  locale?: Locale;
  repository?: DemoRepository;
  state?: DemoState;
  viewportWidth?: number;
  initialPath?: string;
};

/** Simulates a viewport width with `window` state and a resize event, per the plan. */
function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: width });
  window.dispatchEvent(new Event("resize"));
}

/**
 * Renders the admin surface the way production composes it (minus the URL
 * router shell, replaced by a memory router so tests can deep-link).
 */
export function renderAdmin(options: AdminRenderOptions = {}) {
  const {
    locale,
    repository: suppliedRepository,
    state: suppliedState,
    viewportWidth = 1280,
    initialPath = "/",
    ...renderOptions
  } = options;

  const state = structuredClone(suppliedState ?? createSeedState());
  if (locale) state.locale = locale;
  const channelName = nextChannelName();
  const repository = suppliedRepository ?? createMemoryDemoRepository(state, channelName);
  const user = userEvent.setup();
  setViewportWidth(viewportWidth);

  const result = render(
    <DemoProvider repository={repository}>
      <I18nProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <AdminRoutes />
        </MemoryRouter>
      </I18nProvider>
    </DemoProvider>,
    renderOptions,
  );

  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    liveRenders.delete(dispose);
    result.unmount();
    if (!suppliedRepository) repository.close();
  };
  liveRenders.add(dispose);

  return { ...result, user, state, repository, channelName, cleanup: dispose };
}

type PaymentRenderOptions = Omit<ResidentRenderOptions, "screenId" | "simulation"> & {
  forcedOutcome?: SimulatedPaymentOutcome;
  invoiceId?: string;
  delayMs?: number;
  now?: () => Date;
  createId?: () => string;
};

let simulationSequence = 0;
/** Deterministic, collision-free demo identifiers that never look like the demo OTP. */
const nextSimulationId = () => `sim${(simulationSequence += 1).toString(36).padStart(4, "0")}`;

/**
 * Drives the real Expenses -> Invoice -> Payment FlowStack route and leaves the
 * caller on the payment method step with async access to committed snapshots.
 */
export async function renderPayment(options: PaymentRenderOptions = {}) {
  const {
    forcedOutcome,
    invoiceId = "invoice-elevator",
    delayMs = 0,
    now,
    createId = nextSimulationId,
    ...residentOptions
  } = options;

  const view = renderResident({
    ...residentOptions,
    screenId: "expenses",
    simulation: { forcedOutcome, delayMs, now, createId },
  });

  tap(await screen.findByTestId(`expense-row-${invoiceId}`));
  tap(await screen.findByTestId("invoice-pay"));
  await screen.findByTestId("payment-step-method");

  return { ...view, snapshot: () => view.repository.load() };
}

type LiveTwinOptions = {
  residentScreen?: ResidentScreenId;
  locale?: Locale;
  adminPath?: string;
};

/**
 * Renders the resident and admin surfaces side by side on two repository
 * instances joined by the same in-memory channel — the live-twin proof
 * harness. Query surfaces through `resident`/`admin` scoped queries and
 * mutate through the domain-level drivers.
 */
export function renderLiveTwin(options: LiveTwinOptions = {}) {
  const { residentScreen = "home", locale = "en", adminPath = "/" } = options;
  const state = structuredClone(createSeedState());
  state.locale = locale;
  const channelName = nextChannelName();
  const residentRepository = createMemoryDemoRepository(structuredClone(state), channelName);
  const adminRepository = createMemoryDemoRepository(structuredClone(state), channelName);
  const user = userEvent.setup();

  const residentView = render(
    <MobileRuntime>
      <DemoProvider repository={residentRepository}>
        <I18nProvider>
          <ResidentApp initialScreen={residentScreen} />
        </I18nProvider>
      </DemoProvider>
    </MobileRuntime>,
  );
  const adminView = render(
    <DemoProvider repository={adminRepository}>
      <I18nProvider>
        <MemoryRouter initialEntries={[adminPath]}>
          <AdminRoutes />
        </MemoryRouter>
      </I18nProvider>
    </DemoProvider>,
  );

  const residentQueries = within(residentView.container);
  const adminQueries = within(adminView.container);

  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    liveRenders.delete(dispose);
    residentView.unmount();
    adminView.unmount();
    residentRepository.close();
    adminRepository.close();
  };
  liveRenders.add(dispose);

  const admin = {
    ...adminQueries,
    repository: adminRepository,
    container: adminView.container,
    async goTo(linkName: RegExp | string) {
      await user.click(adminQueries.getByRole("link", { name: linkName }));
    },
    async createInvoice(input: { title: string; amount: number; dueDate: string }) {
      const { state: current } = await adminRepository.load();
      await adminRepository.dispatch({
        type: "invoice/created",
        invoice: {
          id: `invoice-twin-${(state.invoices.length + 1).toString(36)}-${input.title.replaceAll(/\W+/g, "-").toLowerCase()}`,
          buildingId: current.currentBuildingId,
          unitId: current.residents.find((resident) => resident.id === current.currentResidentId)?.unitId,
          residentId: current.currentResidentId,
          title: { en: input.title, ar: input.title },
          category: "maintenance",
          subtotal: input.amount,
          tax: 0,
          total: input.amount,
          dueDate: new Date(input.dueDate).toISOString(),
          status: "due",
          createdAt: current.now,
        },
      });
    },
    async setServiceAvailability(serviceKey: string, active: boolean) {
      const { state: current } = await adminRepository.load();
      const offering = current.serviceOfferings.find((item) => item.key === serviceKey);
      if (!offering) throw new Error(`Unknown service key ${serviceKey}`);
      await adminRepository.dispatch({ type: "service/availability-changed", serviceId: offering.id, active });
    },
    async approveQuote(orderId: string, amount: number) {
      const { state: current } = await adminRepository.load();
      await adminRepository.dispatch({ type: "quote/provided", orderId, amount, occurredAt: current.now });
      await adminRepository.dispatch({ type: "quote/approved", orderId, amount, occurredAt: current.now });
    },
    async getInvoiceStatus(invoiceId: string) {
      const { state: current } = await adminRepository.load();
      return current.invoices.find((invoice) => invoice.id === invoiceId)?.status;
    },
  };

  const resident = {
    ...residentQueries,
    repository: residentRepository,
    container: residentView.container,
    async pay(invoiceId: string, method: "apple-pay" | "mada" | "visa", status: "paid" | "declined") {
      const { state: current } = await residentRepository.load();
      const invoice = current.invoices.find((item) => item.id === invoiceId);
      if (!invoice) throw new Error(`Unknown invoice ${invoiceId}`);
      await residentRepository.dispatch({
        type: "payment/recorded",
        payment: {
          id: `payment-twin-${invoiceId}`,
          invoiceId,
          residentId: current.currentResidentId,
          method,
          status,
          amount: invoice.total,
          occurredAt: current.now,
          reference: `DEMO-TWIN-${invoiceId.toUpperCase()}`,
          ...(method === "mada" ? { last4: "4455" as const } : method === "visa" ? { last4: "4242" as const } : {}),
        },
      });
    },
    async requestQuote(serviceKey: string) {
      const { state: current } = await residentRepository.load();
      const offering = current.serviceOfferings.find((item) => item.key === serviceKey);
      if (!offering) throw new Error(`Unknown service key ${serviceKey}`);
      const orderId = `order-twin-${serviceKey}`;
      const providerId = offering.providerIds[0];
      if (!providerId) throw new Error(`Service ${serviceKey} has no provider`);
      await residentRepository.dispatch({
        type: "order/created",
        order: {
          id: orderId,
          serviceId: offering.id,
          providerId,
          buildingId: current.currentBuildingId,
          unitId: current.residents.find((resident) => resident.id === current.currentResidentId)?.unitId,
          residentId: current.currentResidentId,
          fulfillment: "quote",
          status: "awaiting-quote",
          timeline: [
            {
              id: `${orderId}-created`,
              status: "awaiting-quote",
              occurredAt: current.now,
              note: { en: "Quote requested", ar: "تم طلب عرض السعر" },
            },
          ],
          createdAt: current.now,
        },
      });
      return orderId;
    },
  };

  return { user, resident, admin, channelName, cleanup: dispose };
}

afterEach(() => {
  liveRenders.forEach((dispose) => dispose());
  cleanup();
});
