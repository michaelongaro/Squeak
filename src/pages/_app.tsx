import { trpc } from "../utils/trpc";
import { SessionProvider } from "next-auth/react";
import { UserIDProvider } from "../context/UserIDContext";
import { RoomProvider } from "../context/RoomContext";
import { Montserrat } from "next/font/google";

import { type AppType } from "next/app";
import { type Session } from "next-auth";

import "react-awesome-animated-number/dist/index.css";
import "../styles/globals.css";
import { Toaster, ToastBar } from "react-hot-toast";

const montserrat = Montserrat({
  weight: "variable",
  subsets: ["latin"],
});

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <UserIDProvider>
        <RoomProvider>
          <main className={montserrat.className}>
            <Component {...pageProps} />
          </main>
          <Toaster
            position={"top-center"}
            toastOptions={{
              duration: 30000,
            }}
          >
            {(t) => <ToastBar toast={t} />}
          </Toaster>
        </RoomProvider>
      </UserIDProvider>
    </SessionProvider>
  );
};

export default trpc.withTRPC(MyApp);
