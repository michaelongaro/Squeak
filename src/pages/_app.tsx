import { ClerkProvider } from "@clerk/nextjs";
import { UserIDProvider } from "../context/UserIDContext";
import type { AppProps } from "next/app";
import { RoomProvider } from "../context/RoomContext";
import { api } from "~/utils/api";
import { io } from "socket.io-client";
import GeneralLayout from "~/components/layout/GeneralLayout";

import "react-awesome-animated-number/dist/index.css";
import "../styles/globals.css";

export const socket = io({
  path: "/api/socket",
  closeOnBeforeunload: false, // TODO: do we want this to be false?
});

// might in some way mess with t3 bootstrapping, be wary
type ComponentWithPageLayout = AppProps & {
  Component: AppProps["Component"] & {
    PageLayout?: React.ComponentType;
  };
};

function MyApp({ Component, pageProps }: ComponentWithPageLayout) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        variables: {
          colorPrimary: "rgb(0, 92, 0)",
          colorInputBackground: "rgb(255, 255, 255)",
          colorTextSecondary: "rgb(0, 41, 0)",
          fontFamily: "'Montserrat', sans-serif",
          borderRadius: "0.375rem",
          colorDanger: "rgb(220, 38, 38)",
          colorSuccess: "rgb(184, 255, 184)",
          colorInputText: "rgb(0, 71, 0)",
          colorBackground: "rgb(255, 255, 255)",
          colorText: "rgb(0, 71, 0)",
        },
      }}
      {...pageProps}
    >
      <UserIDProvider>
        <RoomProvider>
          <GeneralLayout>
            <Component {...pageProps} />
          </GeneralLayout>
        </RoomProvider>
      </UserIDProvider>
    </ClerkProvider>
  );
}

export default api.withTRPC(MyApp);
