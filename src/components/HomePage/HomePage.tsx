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
      <AnimatePresence
        initial={false}
        mode={"wait"}
        onExitComplete={() => null}
      >
      {pageToRender === "home" && <MainOptions />}
      {pageToRender === "createRoom" && <CreateRoom />}
      {pageToRender === "joinRoom" && <JoinRoom />}
      {pageToRender === "play" && connectedToRoom && <Play />}
    </AnimatePresence>
  );
}

export default HomePage;
