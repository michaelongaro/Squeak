import { type NextPage } from "next";
import Head from "next/head";
import HomePage from "../components/HomePage/HomePage";
import { io } from "socket.io-client";
import useReceiveFriendData from "../hooks/useReceiveFriendData";
import useInitializeUserStats from "../hooks/useInitializeUserStats";
import { NextSeo } from "next-seo";

export const socket = io({
  path: "/api/socket",
  closeOnBeforeunload: false,
});

const Home: NextPage = () => {
  useReceiveFriendData();
  useInitializeUserStats();

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
        <link rel="canonical" href="https://playsqueak.com" />
      </Head>

      <NextSeo
        title="Squeak"
        description="Welcome to Squeak! A fun, fast-paced multiplayer rendition of solitaire. Games can be played with 2-4 players, lasting around 20 minutes."
        canonical="www.playsqueak.com"
        openGraph={{
          url: "www.playsqueak.com",
          title: "Squeak",
          description:
            "Welcome to Squeak! A fun, fast-paced multiplayer rendition of solitaire. Games can be played with 2-4 players, lasting around 20 minutes.",
          images: [
            {
              url: "https://i.imgur.com/EpwvpXH.png",
              width: 960,
              height: 465,
              alt: "Screenshot of a Squeak game",
            },
          ],
          site_name: "Squeak",
        }}
      />
      <HomePage />
    </>
  );
};

export default Home;
