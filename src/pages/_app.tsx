import { trpc } from "../utils/trpc";
import { SessionProvider } from "next-auth/react";
import { LocalStorageProvider } from "../context/LocalStorageContext";
import { RoomProvider } from "../context/RoomContext";

import { type AppType } from "next/app";
import { type Session } from "next-auth";

import "../styles/globals.css";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <LocalStorageProvider>
      <RoomProvider>
        <SessionProvider session={session}>
          <Component {...pageProps} />
        </SessionProvider>
      </RoomProvider>
    </LocalStorageProvider>
  );
};

export default trpc.withTRPC(MyApp);
