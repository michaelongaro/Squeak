// import { expect, test } from "vitest";
// import { render, screen, within } from "@testing-library/react";
// import MainOptions from "../src/components/MainOptions/MainOptions";

// test("home", () => {
//   render(<MainOptions />);
//   const main = within(screen.getByRole("main"));
//   expect(
//     main.getByRole("heading", { level: 1, name: /welcome to next\.js!/i })
//   ).toBeDefined();

//   const footer = within(screen.getByRole("contentinfo"));
//   const link = within(footer.getByRole("link"));
//   expect(link.getByRole("img", { name: /vercel logo/i })).toBeDefined();
// });

import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MainOptions from "../src/components/MainOptions/MainOptions";

// fix paths
// vi.mock("next-auth/client");
vi.mock("../src/context/UserIDProvider");
vi.mock("../src/context/useUserIDContext");
vi.mock("../src/utils/trpc");
vi.mock("../src/context/useRoomContext");

vi.mock("next-auth/react", () => {
  const originalModule = vi.importActual("next-auth/react");
  const mockSession = {
    expires: new Date(Date.now() + 2 * 86400).toISOString(),
    user: { username: "admin" },
  };
  return {
    __esModule: true,
    ...originalModule,
    useSession: vi.fn(() => {
      return { data: mockSession, status: "authenticated" }; // return type is [] in v3 but changed to {} in v4
    }),
  };
});

describe("MainOptions", () => {
  test("renders the login button when not authenticated", () => {
    const useSessionMock = vi.fn(() => ({
      data: null,
      status: "unauthenticated",
    }));
    const useUserIDContextMock = vi.fn(() => ({ value: 123 }));

    render(<MainOptions />);

    expect(screen.getByRole("button", { name: /login/i })).toBeDefined();
  });

  test("renders the user info when authenticated", () => {
    const useSessionMock = vi.fn(() => ({
      data: {},
      status: "authenticated",
    }));
    const useUserIDContextMock = vi.fn(() => ({ value: 123 }));
    const getUserByIDMock = vi.fn(() => ({
      data: { username: "testuser", avatarPath: "testpath", color: "red" },
    }));
    const setPageToRenderMock = vi.fn();

    render(<MainOptions />);

    expect(screen.getByText(/testuser/i)).toBeDefined();
    expect(screen.getByAltText(/squeak logo/i)).toBeDefined();
  });

  test('calls setPageToRender when "Create room" button is clicked', () => {
    const useSessionMock = vi.fn(() => ({
      data: {},
      status: "authenticated",
    }));
    const useUserIDContextMock = vi.fn(() => ({ value: 123 }));
    const getUserByIDMock = vi.fn(() => ({
      data: { username: "testuser", avatarPath: "testpath", color: "red" },
    }));
    const setPageToRenderMock = vi.fn();

    render(<MainOptions />);

    const createRoomButton = screen.getByRole("button", {
      name: /create room/i,
    });
    createRoomButton.click();

    expect(setPageToRenderMock).toHaveBeenCalledWith("createRoom");
  });

  test('calls setShowTutorialModal when "How to play" button is clicked', () => {
    const useSessionMock = vi.fn(() => ({
      data: {},
      status: "authenticated",
    }));
    const useUserIDContextMock = vi.fn(() => ({ value: 123 }));
    const getUserByIDMock = vi.fn(() => ({
      data: { username: "testuser", avatarPath: "testpath", color: "red" },
    }));
    const setShowTutorialModalMock = vi.fn();

    render(<MainOptions />);

    const howToPlayButton = screen.getByRole("button", {
      name: /how to play/i,
    });
    howToPlayButton.click();

    expect(setShowTutorialModalMock).toHaveBeenCalledWith(true);
  });
});
