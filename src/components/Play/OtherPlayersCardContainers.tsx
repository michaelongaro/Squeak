import { useState, useEffect, useCallback } from "react";
import { socket } from "../../pages/";
import { useLocalStorageContext } from "../../context/LocalStorageContext";
import { useRoomContext } from "../../context/RoomContext";
import { type IDrawFromDeck } from "../../pages/api/socket";
import { type IPlayerCards } from "../../utils/generateDeckAndSqueakCards";
import Card from "./Card";

interface IOtherPlayersCardContainers {
  orderedClassNames: (string | undefined)[];
}

interface IOtherPlayers extends IPlayerCards {
  playerID: string;
  animationConfig: IAnimationConfig;
}

export interface IAnimationConfig {
  xMultiplier: number;
  yMultiplier: number;
  rotation: number;
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

function OtherPlayersCardContainers({
  orderedClassNames,
}: IOtherPlayersCardContainers) {
  const roomCtx = useRoomContext();
  const localStorageID = useLocalStorageContext();

  const userID = localStorageID.value; // change to ctx.userID ?? localStorageID.value

  const [allPlayersExceptCurrentUser, setAllPlayersExceptCurrentUser] =
    useState<IOtherPlayers[]>([]);

  useEffect(() => {
    if (roomCtx.gameData?.players) {
      const playersToInclude: IOtherPlayers[] = [];
      let playerCounter = 0;
      Object.keys(roomCtx.gameData.players).forEach((playerID) => {
        if (playerID !== userID) {
          // since each player's container is rotated, we need to adjust the
          // polarities(?) of the x and y coordinates to make sure the cards are
          // moving in the correct spot + card will need to be rotated correctly
          let animationConfig: IAnimationConfig = {
            xMultiplier: 1,
            yMultiplier: 1,
            rotation: 0,
          };

          if (playerCounter === 0) {
            animationConfig = {
              xMultiplier: -1,
              yMultiplier: -1,
              rotation: 180,
            };
          } else if (playerCounter === 1) {
            animationConfig = { xMultiplier: 1, yMultiplier: -1, rotation: 90 };
          } else if (playerCounter === 2) {
            animationConfig = {
              xMultiplier: -1,
              yMultiplier: 1,
              rotation: -90,
            }; // or just 90?
          }

          // @ts-expect-error asdf
          playersToInclude.push({
            ...roomCtx.gameData.players[playerID],
            playerID: playerID,
            animationConfig: animationConfig,
          });

          playerCounter++;
        }
      });
      setAllPlayersExceptCurrentUser(playersToInclude);
    }
  }, [roomCtx.gameData.players, userID]);

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
      {allPlayersExceptCurrentUser.map((player, idx) => (
        <div key={player.playerID} className={orderedClassNames[idx]}>
          <div className={internalOrderedGridClassNames[idx]}>
            <div
              id={`${player.playerID}squeakDeck`}
              className={`${classes.squeakDeck} h-[64px] w-[48px] lg:h-[72px] lg:w-[56px]`}
            >
              {player.squeakDeck.length > 0 ? (
                <div className="relative h-full w-full">
                  <div className="absolute top-0 left-0 h-full w-full">
                    <Card
                      showCardBack={true}
                      draggable={false}
                      ownerID={player.playerID}
                      startID={`${player.playerID}squeakDeck`}
                      animationConfig={player.animationConfig}
                    />
                  </div>
                  <div className="absolute top-0 left-0 h-full w-full">
                    <Card
                      value={player.squeakDeck[0]!.value}
                      suit={player.squeakDeck[0]!.suit}
                      showCardBack={true} // this would need to be changed halfway through card flip
                      draggable={false}
                      ownerID={player.playerID}
                      startID={`${player.playerID}squeakDeck`}
                      animationConfig={{
                        xMultiplier: 1,
                        yMultiplier: 1,
                        rotation: 0,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <button>Squeak!</button>
              )}
            </div>

            {player.squeakHand.map((cards, cardsIdx) => (
              <div
                key={`${player.playerID}squeakStack${cardsIdx}`}
                id={`${player.playerID}squeakHand${cardsIdx}`}
                // @ts-expect-error asdf
                className={`${cardClassMap[cardsIdx]} relative h-[64px] w-[48px] lg:h-[72px] lg:w-[56px]`}
              >
                <div
                  style={{
                    height:
                      cards.length === 1 ? 72 : `${cards.length * 15 + 72}px`,
                  }}
                  className="absolute w-full"
                >
                  {cards.map((card, cardIdx) => (
                    <div
                      key={`${player.playerID}card${cardIdx}`} //${card.suit}${card.value}
                      id={`${player.playerID}squeakStack${cardsIdx}${cardIdx}`}
                      className={`absolute left-0 h-full w-full`}
                      style={{
                        // zIndex:
                        //   roomCtx.originIndexForHeldSqueakCard === cardsIdx
                        //     ? 501
                        //     : "auto",
                        top: `${cardIdx * 15}px`,
                      }}
                    >
                      <Card
                        value={card.value}
                        suit={card.suit}
                        draggable={false}
                        origin={"squeak"}
                        ownerID={player.playerID}
                        startID={`${player.playerID}squeakStack${cardsIdx}${cardIdx}`}
                        animationConfig={player.animationConfig}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div
              className={classes.cardBeingPlayedOnBoard}
              id={`${player.playerID}hand h-[64px] w-[48px] lg:h-[72px] lg:w-[56px]`}
            >
              <Card
                value={player.topCardsInDeck?.[2]?.value}
                suit={player.topCardsInDeck?.[2]?.suit}
                showCardBack={false}
                origin={"deck"} // probably only needed for current player
                draggable={false}
                ownerID={player.playerID}
                startID={`${player.playerID}hand`}
                animationConfig={player.animationConfig}
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
