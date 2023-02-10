import { type NextPage } from "next";
import Head from "next/head";
import HomePage from "../components/HomePage/HomePage";

import { io } from "socket.io-client";
export const socket = io({
  closeOnBeforeunload: false,
});

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Squeak</title>
        <meta
          name="description"
          content="Welcome to Squeak! A fun, fast-paced multiplayer rendition of solitaire.
                   Games can be played with 2-4 players, lasting around 20 minutes."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <HomePage />
    </>
  );
};

export default Home;
