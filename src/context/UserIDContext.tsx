import cryptoRandomString from "crypto-random-string";
import { useSession } from "next-auth/react";
import { createContext, useContext, useState, useEffect } from "react";

interface IUserIDContext {
  value: string;
}

const UserIDContext = createContext<IUserIDContext | null>(null);

export function UserIDProvider(props: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const [value, setValue] = useState<string>(""); // way to avoid init of ""?

  useEffect(() => {
    if (status === "unauthenticated") {
      let userID: string;
      if (localStorage.getItem("userID") === null) {
        userID = cryptoRandomString({ length: 16 });
        localStorage.setItem("userID", userID);
      } else {
        userID = localStorage.getItem("userID") as string;
      }
      setValue(userID);
    }

    if (status === "authenticated" && session.user) {
      if (localStorage.getItem("userID") !== null) {
        localStorage.removeItem("userID");
      }
      setValue(session.user.id);
    }
  }, [status, session]);

  const context: IUserIDContext = {
    value,
  };

  return (
    <UserIDContext.Provider value={context}>
      {props.children}
    </UserIDContext.Provider>
  );
}

export function useUserIDContext() {
  const context = useContext(UserIDContext);
  if (context === null) {
    throw new Error("useUserIDContext must be used within a UserIDProvider");
  }
  return context;
}
