import { trpc } from "../utils/trpc";
import { SessionProvider } from "next-auth/react";
import { UserIDProvider } from "../context/UserIDContext";
import { RoomProvider } from "../context/RoomContext";

import { type AppType } from "next/app";
import { type Session } from "next-auth";

import "../styles/globals.css";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <UserIDProvider>
        <RoomProvider>
          <Component {...pageProps} />
        </RoomProvider>
      </UserIDProvider>
    </SessionProvider>
  );
};

export default trpc.withTRPC(MyApp);
