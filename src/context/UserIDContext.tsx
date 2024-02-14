import cryptoRandomString from "crypto-random-string";
import { useAuth } from "@clerk/nextjs";
import { createContext, useContext, useState, useEffect } from "react";

const UserIDContext = createContext<string | null>(null);

export function UserIDProvider(props: { children: React.ReactNode }) {
  const { userId, isLoaded } = useAuth();

  const [value, setValue] = useState<string>(""); // way to avoid init of ""?

  useEffect(() => {
    if (!isLoaded) return;

    if (!userId) {
      let userID: string;
      if (localStorage.getItem("squeakUserID") === null) {
        userID = cryptoRandomString({ length: 16 });
        localStorage.setItem("squeakUserID", userID);
      } else {
        userID = localStorage.getItem("squeakUserID") as string;
      }
      setValue(userID);
    } else {
      if (localStorage.getItem("squeakUserID") !== null) {
        localStorage.removeItem("squeakUserID");
      }
      setValue(userId);
    }
  }, [userId, isLoaded]);

  return (
    <UserIDContext.Provider value={value}>
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
