import { render, screen } from "@testing-library/react";

jest.mock("./lib/api", () => ({
  registerVisitorHit: jest.fn(() => Promise.resolve({ today: 1, total: 1 }))
}));
jest.mock("./components/Footer", () => () => <div>Footer</div>);
jest.mock("./components/Home/Home", () => () => <div>nahollo home</div>);
jest.mock("./components/Navbar", () => () => <div>Navbar</div>);
jest.mock("./components/Pre", () => ({ load }: { load: boolean }) => <div>{load ? "loading" : "ready"}</div>);
jest.mock("./components/Canvas/CanvasPage", () => () => <div>canvas page</div>);
jest.mock("./components/Games/GamesPage", () => () => <div>games page</div>);
jest.mock("./components/Games/TypingGamePage", () => () => <div>typing page</div>);
jest.mock("./components/Games/JumpGamePage", () => () => <div>jump page</div>);
jest.mock("./components/Games/AdventureGamePage", () => () => <div>adventure page</div>);
jest.mock("./components/Homelab/HomelabPage", () => () => <div>homelab page</div>);
jest.mock("./components/Tools/ToolsPage", () => () => <div>tools page</div>);
jest.mock("./components/ScrollToTop", () => () => null);

import App from "./App";

test("renders the nahollo home page", () => {
  render(<App />);
  expect(screen.getByText(/nahollo home/i)).toBeInTheDocument();
});
