import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

import { trpc } from "../utils/trpc";
import HomePage from "../components/HomePage/HomePage";
import { useLocalStorageContext } from "../context/LocalStorageContext";
import { useEffect } from "react";
import cryptoRandomString from "crypto-random-string";

import { io, type Socket } from "socket.io-client";
export const socket = io();

const Home: NextPage = () => {
  const { data: session, status } = useSession();
  const localStorageID = useLocalStorageContext();

  // if not loading and not logged in, then create a new userID for them
  // and store it in localstorage
  // aka set up auth z

  useEffect(() => {
    if (status === "unauthenticated" && !session && !localStorageID.value) {
      const userID = cryptoRandomString({ length: 16 });
      if (localStorage.getItem("userID") === null) {
        localStorage.setItem("userID", userID);
      }
      localStorageID.setValue(userID);
    }
  }, [status, session, localStorageID]);

  return (
    <>
      <Head>
        <title>Squeak</title>
        <meta
          name="description"
          content="Welcome to Squeak! A fun, fast-paced multiplayer rendition of solitaire.
                   Games can be played with up to eight people, lasting around 10 minutes."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <HomePage />
    </>
  );
};

export default Home;
