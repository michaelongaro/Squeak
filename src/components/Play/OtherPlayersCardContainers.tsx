import { useEffect, useCallback } from "react";
import { socket } from "../../pages/";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import { type IDrawFromDeck } from "../../pages/api/socket";
import Card from "./Card";

interface IOtherPlayersCardContainers {
  orderedClassNames: (string | undefined)[];
}

import classes from "./OtherPlayersCardContainers.module.css";
import { FaRedoAlt } from "react-icons/fa";
import PlayerIcon from "../playerIcons/PlayerIcon";

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
  const {
    gameData,
    setGameData,
    playerMetadata,
    playerIDWhoSqueaked,
    setHoldingADeckCard,
    setHoveredSqueakStack,
  } = useRoomContext();
  const { value: userID } = useUserIDContext();

  const handleCardDrawnFromDeck = useCallback(
    ({ playerID, updatedBoard, updatedPlayerCards }: IDrawFromDeck) => {
      if (playerID === userID) return;

      setGameData({
        ...gameData,
        board: updatedBoard || gameData?.board,
        players: updatedPlayerCards || gameData?.players,
      });
    },
    [gameData, setGameData, userID]
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
      {Object.keys(gameData.players)
        .filter((playerID) => playerID !== userID)
        .map((playerID, idx) => (
          <div key={playerID} className={orderedClassNames[idx]}>
            <div className={internalOrderedGridClassNames[idx]}>
              <div
                id={`${playerID}squeakDeck`}
                className={`${classes.squeakDeck} h-[64px] w-[48px] lg:h-[72px] lg:w-[56px]`}
              >
                {gameData.players[playerID]!.squeakDeck.length > 0 ? (
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
                        value={gameData.players[playerID]?.squeakDeck[0]!.value}
                        suit={gameData.players[playerID]?.squeakDeck[0]!.suit}
                        showCardBack={true} // this would need to be changed halfway through card flip
                        draggable={false}
                        ownerID={playerID}
                        startID={`${playerID}squeakDeck`}
                        rotation={rotationOrder[idx] as number}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    style={{
                      boxShadow:
                        playerIDWhoSqueaked === playerID
                          ? "0px 0px 20px 5px rgba(184,184,184,1)"
                          : "none",
                      transition: "box-shadow 0.85s ease-in-out",
                    }}
                    className="bg-green-300 p-4 transition-colors hover:bg-green-200"
                    disabled={true}
                  >
                    Squeak!
                  </button>
                )}
              </div>

              {gameData.players[playerID]?.squeakHand.map((cards, cardsIdx) => (
                <div
                  key={`${playerID}squeakStack${cardsIdx}`}
                  id={`${playerID}squeakHand${cardsIdx}`}
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
              ))}

              <div
                className={`${classes.playerDeck} z-[500] h-[64px] w-[48px] lg:h-[72px] lg:w-[56px]`}
              >
                <div id={`${playerID}deck`} className="h-full w-full">
                  {gameData?.players[playerID]?.nextTopCardInDeck ? (
                    <div className="relative h-full w-full">
                      <div className="absolute top-0 left-0 h-full w-full">
                        <Card
                          showCardBack={true}
                          draggable={false}
                          ownerID={playerID}
                          startID={`${playerID}deck`}
                          rotation={0}
                        />
                      </div>
                      <div className="topBackFacingCardInDeck absolute top-0 left-0 h-full w-full">
                        <Card
                          value={
                            gameData?.players[playerID]?.nextTopCardInDeck
                              ?.value
                          }
                          suit={
                            gameData?.players[playerID]?.nextTopCardInDeck?.suit
                          }
                          showCardBack={true} // separate state inside overrides this halfway through flip
                          draggable={false}
                          ownerID={playerID}
                          startID={`${playerID}deck`}
                          rotation={0}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid cursor-pointer grid-cols-1 items-center justify-items-center">
                      <div className="col-start-1 row-start-1">
                        <FaRedoAlt size={"1rem"} />
                      </div>
                      <div className="col-start-1 row-start-1 opacity-25">
                        <Card
                          showCardBack={true}
                          draggable={false}
                          ownerID={playerID}
                          startID={`${playerID}deck`}
                          rotation={0}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div
                id={`${playerID}hand`}
                className={`${classes.playerHand} relative h-[64px] w-[48px] select-none lg:h-[72px] lg:w-[56px]`}
              >
                <>
                  {gameData.players[playerID]?.topCardsInDeck.map(
                    (card, idx) =>
                      card !== null && ( // necessary?
                        <div
                          key={`${playerID}card${card?.suit}${card?.value}`}
                          className="absolute top-0 left-0"
                          style={{
                            top: `${-1 * (idx * 2)}px`,
                          }}
                          onMouseDown={() => {
                            setHoldingADeckCard(true);
                          }}
                          onMouseUp={() => {
                            setHoldingADeckCard(false);
                            setHoveredSqueakStack(null);
                          }}
                        >
                          <Card
                            value={card?.value}
                            suit={card?.suit}
                            draggable={true}
                            origin={"deck"}
                            ownerID={playerID}
                            startID={`${playerID}hand`}
                            rotation={0}
                          />
                        </div>
                      )
                  )}
                </>
              </div>

              <div className={classes.playerAvatar}>
                <PlayerIcon
                  avatarPath={
                    playerMetadata[playerID]?.avatarPath ||
                    "/avatars/rabbit.svg"
                  }
                  borderColor={
                    playerMetadata[playerID]?.color || "hsl(352deg, 69%, 61%)"
                  }
                  username={playerMetadata[playerID]?.username}
                  size={"3rem"}
                />
              </div>
            </div>
          </div>
        ))}
    </>
  );
}

export default OtherPlayersCardContainers;
