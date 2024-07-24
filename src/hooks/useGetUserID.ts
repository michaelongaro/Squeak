import { useAuth } from "@clerk/nextjs";
import cryptoRandomString from "crypto-random-string";
import { useEffect, useState } from "react";

function useGetUserID() {
  const { userId, isLoaded } = useAuth();

  const [userID, setUserID] = useState<string>(""); // way to avoid init of ""?

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
      setUserID(userID);
    } else {
      if (localStorage.getItem("squeakUserID") !== null) {
        localStorage.removeItem("squeakUserID");
      }
      setUserID(userId);
    }
  }, [userId, isLoaded]);

  return userID;
}

export default useGetUserID;
