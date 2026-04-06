import { render, screen } from "@testing-library/react";

jest.mock("./components/About/About", () => () => <div>소개 페이지</div>);
jest.mock("./components/Footer", () => () => <div>Footer</div>);
jest.mock("./components/Home/Home", () => () => <div>nahollo home</div>);
jest.mock("./components/Navbar", () => () => <div>Navbar</div>);
jest.mock("./components/Pre", () => ({ load }: { load: boolean }) => <div>{load ? "loading" : "ready"}</div>);
jest.mock("./components/Projects/Projects", () => () => <div>프로젝트 페이지</div>);
jest.mock("./components/Resume/ResumeNew", () => () => <div>이력서 페이지</div>);
jest.mock("./components/ScrollToTop", () => () => null);

import App from "./App";

test("renders the nahollo home page", () => {
  render(<App />);
  expect(screen.getByText(/nahollo home/i)).toBeInTheDocument();
});
