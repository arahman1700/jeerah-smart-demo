import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Prototype from "../../src/Prototype";
import { MobileRuntime } from "../../src/mobile/MobileRuntime";

it("renders the launcher on the bare link with all three surface doors", async () => {
  render(<MobileRuntime><Prototype /></MobileRuntime>);
  expect(await screen.findByTestId("launcher-page")).toBeInTheDocument();
  expect(screen.getByTestId("launcher-app")).toBeInTheDocument();
  expect(screen.getByTestId("launcher-preview")).toBeInTheDocument();
  expect(screen.getByTestId("launcher-admin")).toBeInTheDocument();
});

it("gates the app surface behind the demo sign-in and accepts admin/admin", async () => {
  window.history.replaceState({}, "", "/?surface=app");
  const user = userEvent.setup();
  render(<MobileRuntime><Prototype /></MobileRuntime>);
  const login = await screen.findByTestId("login-page");
  expect(within(login).getByTestId("login-demo-hint")).toBeInTheDocument();
  await user.type(screen.getByLabelText(/username|اسم المستخدم/i), "admin");
  await user.type(screen.getByLabelText(/password|كلمة المرور/i), "wrong");
  await user.click(screen.getByTestId("login-submit"));
  expect(await screen.findByRole("alert")).toBeInTheDocument();
  await user.clear(screen.getByLabelText(/password|كلمة المرور/i));
  await user.type(screen.getByLabelText(/password|كلمة المرور/i), "admin");
  await user.click(screen.getByTestId("login-submit"));
  expect(await screen.findByRole("application", { name: /jeerah smart demo/i })).toBeInTheDocument();
  window.history.replaceState({}, "", "/");
});
