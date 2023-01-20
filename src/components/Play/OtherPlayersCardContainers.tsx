import { useEffect, useCallback } from "react";
import { socket } from "../../pages/";
import { useLocalStorageContext } from "../../context/LocalStorageContext";
import { useRoomContext } from "../../context/RoomContext";
import { type IDrawFromDeck } from "../../pages/api/socket";
import Card from "./Card";

interface IOtherPlayersCardContainers {
  orderedClassNames: (string | undefined)[];
}

import classes from "./OtherPlayersCardContainers.module.css";

const internalOrderedGridClassNames = [
  classes.topInnerGridContainer,
  classes.leftInnerGridContainer,
  classes.rightInnerGridContainer,
  // add more later
];

const cardClassMap = {
  0: classes.squeakHand0,
  1: classes.squeakHand1,
  2: classes.squeakHand2,
  3: classes.squeakHand3,
};

const rotationOrder = [180, 90, 270];

function OtherPlayersCardContainers({
  orderedClassNames,
}: IOtherPlayersCardContainers) {
  const roomCtx = useRoomContext();
  const localStorageID = useLocalStorageContext();

  const userID = localStorageID.value; // change to ctx.userID ?? localStorageID.value

  const handleCardDrawnFromDeck = useCallback(
    ({ playerID, updatedBoard, updatedPlayerCards }: IDrawFromDeck) => {
      if (playerID === userID) return;

      roomCtx.setGameData({
        ...roomCtx.gameData,
        board: updatedBoard || roomCtx.gameData?.board,
        players: updatedPlayerCards || roomCtx.gameData?.players,
      });
    },
    [roomCtx, userID]
  );

  useEffect(() => {
    socket.on("playerDrawnFromDeck", (data) => handleCardDrawnFromDeck(data));

    return () => {
      socket.off("playerDrawnFromDeck", (data) =>
        handleCardDrawnFromDeck(data)
      );
    };
  }, [handleCardDrawnFromDeck]);

  return (
    <>
      {Object.keys(roomCtx.gameData.players)
        .filter((playerID) => playerID !== userID)
        .map((playerID, idx) => (
          <div key={playerID} className={orderedClassNames[idx]}>
            <div className={internalOrderedGridClassNames[idx]}>
              <div
                id={`${playerID}squeakDeck`}
                className={`${classes.squeakDeck} h-[64px] w-[48px] lg:h-[72px] lg:w-[56px]`}
              >
                {roomCtx.gameData.players[playerID]!.squeakDeck.length > 0 ? (
                  <div className="relative h-full w-full">
                    <div className="absolute top-0 left-0 h-full w-full">
                      <Card
                        showCardBack={true}
                        draggable={false}
                        ownerID={playerID}
                        startID={`${playerID}squeakDeck`}
                        rotation={rotationOrder[idx] as number}
                      />
                    </div>
                    <div className="absolute top-0 left-0 h-full w-full">
                      <Card
                        value={
                          roomCtx.gameData.players[playerID]?.squeakDeck[0]!
                            .value
                        }
                        suit={
                          roomCtx.gameData.players[playerID]?.squeakDeck[0]!
                            .suit
                        }
                        showCardBack={true} // this would need to be changed halfway through card flip
                        draggable={false}
                        ownerID={playerID}
                        startID={`${playerID}squeakDeck`}
                        rotation={rotationOrder[idx] as number}
                      />
                    </div>
                  </div>
                ) : (
                  <button disabled={true}>Squeak!</button>
                )}
              </div>

              {roomCtx.gameData.players[playerID]?.squeakHand.map(
                (cards, cardsIdx) => (
                  <div
                    key={`${playerID}squeakStack${cardsIdx}`}
                    id={`${playerID}squeakHand${cardsIdx}`}
                    // @ts-expect-error asdf
                    className={`${cardClassMap[cardsIdx]} relative h-[64px] w-[48px] lg:h-[72px] lg:w-[56px]`}
                  >
                    <div
                      style={{
                        height:
                          cards.length === 1
                            ? 72
                            : `${cards.length * 15 + 72}px`,
                      }}
                      className="absolute w-full"
                    >
                      {cards.map((card, cardIdx) => (
                        <div
                          key={`${playerID}card${cardIdx}`} //${card.suit}${card.value}
                          id={`${playerID}squeakStack${cardsIdx}${cardIdx}`}
                          className={`absolute left-0 h-full w-full`}
                          style={{
                            top: `${cardIdx * 15}px`,
                          }}
                        >
                          <Card
                            value={card.value}
                            suit={card.suit}
                            draggable={false}
                            origin={"squeak"}
                            ownerID={playerID}
                            startID={`${playerID}squeakStack${cardsIdx}${cardIdx}`}
                            rotation={rotationOrder[idx] as number}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}

              <div
                className={`${classes.cardBeingPlayedOnBoard} h-[64px] w-[48px] lg:h-[72px] lg:w-[56px]`}
                id={`${playerID}hand`}
              >
                <Card
                  value={
                    roomCtx.gameData.players[playerID]?.deck?.[
                      roomCtx.gameData.players[playerID]!.deckIdx
                    ]?.value
                  }
                  suit={
                    roomCtx.gameData.players[playerID]?.deck?.[
                      roomCtx.gameData.players[playerID]!.deckIdx
                    ]?.suit
                  }
                  showCardBack={false}
                  origin={"deck"} // probably only needed for current player
                  draggable={false}
                  ownerID={playerID}
                  startID={`${playerID}hand`}
                  rotation={rotationOrder[idx] as number}
                />
              </div>

              <div className={classes.playerAvatar}></div>
            </div>
          </div>
        ))}
    </>
  );
}

export default OtherPlayersCardContainers;
