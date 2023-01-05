import { useState, useEffect } from "react";
import { io, type Socket } from "socket.io-client";
import { useLocalStorageContext } from "../../context/LocalStorageContext";
import { useRoomContext } from "../../context/RoomContext";
import Board from "./Board";
import Card from "./Card";

import classes from "./Play.module.css";

let socket: Socket;

function Play() {
  const roomCtx = useRoomContext();
  const localStorageID = useLocalStorageContext();

  const userID = localStorageID.value; // change to ctx.userID ?? localStorageID.value
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  useEffect(() => {
    // could also maybe put socket = io() in room context <---- seems like good idea
    if (!roomCtx.gameData) {
      socket = io();

      // seems like this is necessary..
      socket.emit("playerRejoinRoom", roomCtx.roomConfig.code);

      // may have to put this behind a .on("roomRejoinSuccessful") or in another effect or something
      socket.emit("playerReadyToReceiveInitGameData", roomCtx.roomConfig.code);

      socket.on("initGameData", (initGameData) => {
        console.log("initGameData: ", initGameData);
        roomCtx.setGameData(initGameData);
        socket.emit("playerFullyReady", roomCtx.roomConfig.code);
      });

      socket.on("gameStarted", () => {
        setGameStarted(true);
      });
    }
    // maybe you need to have a disconnect function that runs
    // when the component unmounts?
  }, [roomCtx]);

  return (
    <div className={`${classes.fullBoardGrid} relative bg-green-700`}>
      {gameStarted && (
        <>
          {/* should prob filter out current player from below */}
          {/* {roomCtx.gameData.players.map((player) => (
        return <OtherPlayerCardContainer player={player} /> 
        ))}*/}

          {/* maybe just need to wrap this with a div that has classes.board? */}
          <Board boardClass={classes.board} />

          {/* <PlayerCardContainer /> */}
          <div className={`${classes.currentPlayerCards}`}>
            {/* deck, squeakpile, squeakrow */}
            <div className="grid grid-cols-5 gap-2">
              <div className="baseFlex gap-2">
                <div>
                  {/* actually could maybe just do default down card position, unless
                you were trying to show slight depth to knwo a bit how many are left.. */}
                  Squeak Pile
                </div>
                <div className="baseFlex gap-2">
                  {userID &&
                    roomCtx.gameData?.players[userID]?.squeakRow.map((card) => (
                      <div key={`${userID}card${card.suit}${card.value}`}>
                        {/* this should be like a <StackedSqueakCards /> or something */}
                        <Card
                          value={card.value}
                          suit={card.suit}
                          draggable={true}
                        />
                      </div>
                    ))}
                </div>
              </div>
              <div>
                {/* opting to just have deck be a big stack of cards w/ current card showing */}
                Deck
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Play;
