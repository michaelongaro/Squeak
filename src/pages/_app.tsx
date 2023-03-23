import { trpc } from "../utils/trpc";
import { SessionProvider } from "next-auth/react";
import { UserIDProvider } from "../context/UserIDContext";
import { RoomProvider } from "../context/RoomContext";
import { Montserrat } from "@next/font/google";

import { type AppType } from "next/app";
import { type Session } from "next-auth";

import "react-awesome-animated-number/dist/index.css";
import "../styles/globals.css";

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
        </RoomProvider>
      </UserIDProvider>
    </SessionProvider>
  );
};

export default trpc.withTRPC(MyApp);

export async function getStaticProps() {
  return {
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 10 seconds
    revalidate: 86400, // In seconds
  };
}
