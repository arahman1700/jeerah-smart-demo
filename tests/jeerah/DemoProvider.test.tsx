import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode, useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { DemoProvider, useDemoDispatch, useDemoMeta, useDemoState } from "../../src/jeerah/data/DemoProvider";
import { createMemoryDemoRepository, type DemoRepository } from "../../src/jeerah/data/repository";

const repositories = new Set<DemoRepository>();

afterEach(() => {
  repositories.forEach((repository) => repository.close());
  repositories.clear();
});

function Consumer() {
  const state = useDemoState();
  const meta = useDemoMeta();
  const dispatch = useDemoDispatch();
  const [returnedLocale, setReturnedLocale] = useState("none");
  return <button onClick={() => void dispatch({ type: "locale/set", locale: "en" }).then((next) => setReturnedLocale(next.locale))}>
    {state.locale}:{meta.revision}:{returnedLocale}
  </button>;
}

describe("DemoProvider", () => {
  it("owns StrictMode repositories per effect lifecycle and exposes live state, meta, and dispatch", async () => {
    const channelName = "provider-strict";
    const peer = createMemoryDemoRepository(undefined, channelName);
    repositories.add(peer);
    const closed: string[] = [];
    let created = 0;
    const createRepository = () => {
      const repository = createMemoryDemoRepository(undefined, channelName);
      const close = repository.close.bind(repository);
      const id = `owned-${created++}`;
      repository.close = () => {
        closed.push(id);
        close();
      };
      return repository;
    };
    const view = render(<StrictMode><DemoProvider createRepository={createRepository}><Consumer /></DemoProvider></StrictMode>);

    await screen.findByRole("button", { name: "ar:0:none" });
    fireEvent.click(screen.getByRole("button"));
    await screen.findByRole("button", { name: "en:1:en" });

    await peer.dispatch({ type: "locale/set", locale: "ar" });
    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("ar:2:en"));

    view.unmount();
    expect(created).toBe(2);
    expect(closed).toEqual(["owned-0", "owned-1"]);
  });

  it("leaves a supplied repository open for its caller", async () => {
    const repository = createMemoryDemoRepository(undefined, "provider-supplied");
    repositories.add(repository);
    let closes = 0;
    const close = repository.close.bind(repository);
    repository.close = () => {
      closes += 1;
      close();
    };
    const view = render(<DemoProvider repository={repository}><Consumer /></DemoProvider>);

    await screen.findByRole("button", { name: "ar:0:none" });
    view.unmount();

    expect(closes).toBe(0);
  });
});
