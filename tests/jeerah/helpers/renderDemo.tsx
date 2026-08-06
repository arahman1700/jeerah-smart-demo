import { cleanup, render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { afterEach } from "vitest";
import { DemoProvider } from "../../../src/jeerah/data/DemoProvider";
import { createMemoryDemoRepository, type DemoRepository } from "../../../src/jeerah/data/repository";
import { createSeedState } from "../../../src/jeerah/domain/fixtures";
import type { DemoState, Locale } from "../../../src/jeerah/domain/models";
import { I18nProvider } from "../../../src/jeerah/i18n/I18nProvider";
import { ResidentApp, type ResidentScreenId } from "../../../src/jeerah/resident/ResidentApp";
import { MobileRuntime } from "../../../src/mobile/MobileRuntime";

export function renderDemo(ui: ReactElement, options?: RenderOptions) {
  return render(<MobileRuntime>{ui}</MobileRuntime>, options);
}

type ResidentRenderOptions = RenderOptions & {
  locale?: Locale;
  repository?: DemoRepository;
  screenId?: ResidentScreenId;
  state?: DemoState;
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
    state: suppliedState,
    ...renderOptions
  } = options;

  const state = structuredClone(suppliedState ?? createSeedState());
  if (locale) state.locale = locale;
  const channelName = nextChannelName();
  const repository = suppliedRepository ?? createMemoryDemoRepository(state, channelName);
  const user = userEvent.setup();
  const result = render(
    <MobileRuntime>
      <DemoProvider repository={repository}>
        <I18nProvider>
          <ResidentApp initialScreen={screenId} />
        </I18nProvider>
      </DemoProvider>
    </MobileRuntime>,
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

export function renderResidentAt(screenId: ResidentScreenId, options: Omit<ResidentRenderOptions, "screenId"> = {}) {
  return renderResident({ ...options, screenId });
}

afterEach(() => {
  liveRenders.forEach((dispose) => dispose());
  cleanup();
});
