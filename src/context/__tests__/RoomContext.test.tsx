import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RoomProvider } from "../RoomContext";
import HomePage from "../../components/HomePage/HomePage";
import { SessionProvider } from "next-auth/react";
import { UserIDProvider } from "../UserIDContext";

import userEvent from "@testing-library/user-event";

vi.mock("next-auth/react");
import { useSession, signIn, signOut } from "next-auth/react";
import { type Session } from "next-auth";

const mockUseSession = useSession as unknown as Session;

describe("RoomProvider", () => {
  it("should render without crashing", () => {
    const { container } = render(
      <SessionProvider session={mockUseSession}>
        <UserIDProvider>
          <RoomProvider>
            <HomePage />
          </RoomProvider>
        </UserIDProvider>
      </SessionProvider>
    );
    expect(container).toBeDefined();

    expect(container).toContain;
  });
});
