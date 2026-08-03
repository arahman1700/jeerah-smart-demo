import { render, screen } from "@testing-library/react";
import Prototype from "../../src/Prototype";
import { MobileRuntime } from "../../src/mobile/MobileRuntime";

it("renders the Jeerah prototype root", async () => {
  render(<MobileRuntime><Prototype /></MobileRuntime>);
  expect(await screen.findByRole("application", { name: /jeerah smart demo/i })).toBeInTheDocument();
});
