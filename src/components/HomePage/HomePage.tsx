import { useEffect, useState } from "react";
import CreateRoom from "../CreateRoom/CreateRoom";
import JoinRoom from "../JoinRoom/JoinRoom";
import Play from "../Play/Play";
import { useRoomContext } from "../../context/RoomContext";
import MainOptions from "../MainOptions/MainOptions";
import { AnimatePresence } from "framer-motion";

function HomePage() {
  const { connectedToRoom, pageToRender } = useRoomContext();

  return (
    // could make this into a card and have 2-3 diagonal-ish layered playing cards that are peeking out behind left and right sides of card
    <AnimatePresence>
      {pageToRender === "home" && <MainOptions />}
      {pageToRender === "createRoom" && <CreateRoom />}
      {pageToRender === "joinRoom" && <JoinRoom />}
      {pageToRender === "play" && connectedToRoom && <Play />}
    </AnimatePresence>
  );
}

export default HomePage;
