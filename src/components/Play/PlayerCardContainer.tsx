import { useEffect, useState } from "react";
import { socket } from "../../pages";
import { useLocalStorageContext } from "../../context/LocalStorageContext";
import { useRoomContext } from "../../context/RoomContext";
import Card from "./Card";
import { FaRedoAlt } from "react-icons/fa";

import { type ICard } from "../../utils/generateDeckAndSqueakCards";
import classes from "./PlayerCardContainer.module.css";
import useTrackHoverOverSqueakStacks from "../../hooks/useTrackHoverOverSqueakStacks";
import {
  IPlayerDrawFromDeck,
  type IDrawFromSqueakDeck,
} from "../../pages/api/socket";

interface IPlayerCardContainer {
  cardContainerClass: string | undefined;
}

const cardClassMap = {
  0: classes.squeakHand0,
  1: classes.squeakHand1,
  2: classes.squeakHand2,
  3: classes.squeakHand3,
};

function PlayerCardContainer({ cardContainerClass }: IPlayerCardContainer) {
  const roomCtx = useRoomContext();
  const localStorageID = useLocalStorageContext();
  const userID = localStorageID.value; // change to ctx.userID ?? localStorageID.value
  useTrackHoverOverSqueakStacks();

  const [currDeckIdx, setCurrDeckIdx] = useState<number>(-1);
  const [currRevealedCardsFromDeck, setCurrRevealedCardsFromDeck] = useState<
    (ICard | null)[]
  >([null, null, null]);
  const [deckHasBeenDrawnFrom, setDeckHasBeenDrawnFrom] =
    useState<boolean>(false);

  useEffect(() => {
    socket.emit("playerDrawFromDeck", {
      topCardsInDeck: currRevealedCardsFromDeck,
      playerID: userID,
      roomCode: roomCtx.roomConfig.code,
    });
  }, [userID, roomCtx.roomConfig.code, currRevealedCardsFromDeck]);

  // TODO: extract to util function (will need to pass in ctx vars + setters)
  function cycleThroughDeck() {
    // @ts-expect-error asdf
    const currDeckLength = roomCtx.gameData?.players[userID]?.deck.length;

    // these are actually rendered with the last card in the array at the top

    if (currDeckIdx + 3 <= currDeckLength) {
      setCurrRevealedCardsFromDeck([
        roomCtx.gameData?.players[userID!]?.deck[currDeckIdx + 3] || null,
        roomCtx.gameData?.players[userID!]?.deck[currDeckIdx + 2] || null,
        roomCtx.gameData?.players[userID!]?.deck[currDeckIdx + 1] || null,
      ]);

      if (currDeckIdx + 3 === currDeckLength) {
        setCurrDeckIdx(-1);
      } else {
        setCurrDeckIdx((prevIdx) => prevIdx + 3);
      }
    } else if (currDeckIdx + 2 === currDeckLength) {
      setCurrRevealedCardsFromDeck([
        null,
        roomCtx.gameData?.players[userID!]?.deck[currDeckIdx + 2] || null,
        roomCtx.gameData?.players[userID!]?.deck[currDeckIdx + 1] || null,
      ]);
      setCurrDeckIdx(-1);
    } else if (currDeckIdx + 1 === currDeckLength) {
      setCurrRevealedCardsFromDeck([
        null,
        null,
        roomCtx.gameData?.players[userID!]?.deck[currDeckIdx + 1] || null,
      ]);
      setCurrDeckIdx(-1);
    } else {
      setCurrRevealedCardsFromDeck([null, null, null]);
      setCurrDeckIdx(-1);
    }
  }

  function emptySqueakStackIdx() {
    let emptySqueakStackIdx = -1;

    roomCtx.gameData?.players[userID!]?.squeakHand.some(
      (squeakStack, squeakIdx) => {
        if (squeakStack.length === 0) emptySqueakStackIdx = squeakIdx;
      }
    );

    return emptySqueakStackIdx;
  }

  return (
    <div className={`${cardContainerClass}`}>
      <div className={`${classes.gridContainer}`}>
        <div
          id={`${userID}squeakDeck`}
          style={{
            boxShadow:
              emptySqueakStackIdx() !== -1
                ? "0px 0px 10px 3px rgba(184,184,184,1)"
                : "none",
            cursor: emptySqueakStackIdx() !== -1 ? "pointer" : "default",
          }}
          className={`${classes.squeakDeck} h-full w-full`}
          onClick={() => {
            const indexToDrawTo = emptySqueakStackIdx();

            if (indexToDrawTo !== -1) {
              socket.emit("drawFromSqueakDeck", {
                indexToDrawTo: indexToDrawTo,
                playerID: userID,
                roomCode: roomCtx.roomConfig.code,
              });
            }
          }}
        >
          {roomCtx.gameData.players[userID!]!.squeakDeck.length > 0 ? (
            <div className="relative h-full w-full">
              <div className="absolute top-0 left-0 h-full w-full">
                <Card
                  showCardBack={true}
                  draggable={false}
                  ownerID={userID!}
                  startID={`${userID}squeakDeck`}
                  animationConfig={{
                    xMultiplier: 1,
                    yMultiplier: 1,
                    rotation: 0,
                  }}
                />
              </div>
              <div className="absolute top-0 left-0 h-full w-full">
                <Card
                  value={
                    roomCtx.gameData.players[userID!]!.squeakDeck[0]!.value
                  }
                  suit={roomCtx.gameData.players[userID!]!.squeakDeck[0]!.suit}
                  showCardBack={true} // this would need to be changed halfway through card flip
                  draggable={false}
                  ownerID={userID!}
                  startID={`${userID}squeakDeck`}
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

        {userID &&
          roomCtx.gameData?.players[userID]?.squeakHand.map(
            (cards, cardsIdx) => (
              <div
                key={`${userID}card${cardsIdx}`}
                id={`${userID}squeakHand${cardsIdx}`}
                // @ts-expect-error asdf
                className={`${cardClassMap[cardsIdx]} relative h-full w-full`}
              >
                <div
                  style={{
                    boxShadow:
                      roomCtx.holdingADeckCard || roomCtx.holdingASqueakCard
                        ? "0px 0px 10px 3px rgba(184,184,184,1)"
                        : "none",
                    height:
                      cards.length === 1 ? 72 : `${cards.length * 15 + 72}px`,
                  }}
                  className="absolute w-full"
                >
                  {cards.map((card, cardIdx) => (
                    <div
                      key={`${userID}card${cardIdx}`} //${card.suit}${card.value}
                      id={`${userID}squeakStack${cardsIdx}${cardIdx}`}
                      className={`absolute left-0 h-full w-full`}
                      style={{
                        zIndex:
                          roomCtx.originIndexForHeldSqueakCard === cardsIdx
                            ? 501
                            : "auto",
                        top: `${cardIdx * 15}px`,
                      }}
                      onMouseEnter={() => {
                        roomCtx.setHoveredSqueakStack(cardsIdx);
                      }}
                      onMouseLeave={() => {
                        roomCtx.setHoveredSqueakStack(null);
                      }}
                      onMouseDown={() => {
                        roomCtx.setOriginIndexForHeldSqueakCard(cardsIdx);
                        roomCtx.setHoldingASqueakCard(true);
                        roomCtx.setHoveredSqueakStack(null);
                      }}
                      onMouseUp={() => {
                        roomCtx.setHoldingASqueakCard(false);
                        roomCtx.setOriginIndexForHeldSqueakCard(null);
                        roomCtx.setResetHeldSqueakStackLocation([
                          cardsIdx,
                          cardIdx,
                        ]);
                      }}
                    >
                      <Card
                        value={card.value}
                        suit={card.suit}
                        draggable={true}
                        origin={"squeak"}
                        squeakStackLocation={[cardsIdx, cardIdx]}
                        ownerID={userID!}
                        startID={`${userID}squeakStack${cardsIdx}${cardIdx}`}
                        animationConfig={{
                          xMultiplier: 1,
                          yMultiplier: 1,
                          rotation: 0,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

        {userID && (
          <>
            <div className={`${classes.playerDeck}`}>
              <div
                id={`${userID}deck`}
                className="grid cursor-pointer grid-cols-1 items-center justify-items-center"
                onClick={() => {
                  setDeckHasBeenDrawnFrom(true);
                  cycleThroughDeck();
                }}
              >
                <div
                  style={{
                    opacity: currDeckIdx === -1 && deckHasBeenDrawnFrom ? 1 : 0,
                  }}
                  className="col-start-1 row-start-1"
                >
                  <FaRedoAlt size={"1rem"} />
                </div>
                <div
                  style={{
                    opacity:
                      currDeckIdx === -1 && deckHasBeenDrawnFrom ? 0.25 : 1,
                  }}
                  className="col-start-1 row-start-1"
                >
                  <Card
                    showCardBack={true}
                    draggable={false}
                    ownerID={userID!}
                    startID={`${userID}deck`}
                    animationConfig={{
                      xMultiplier: 1,
                      yMultiplier: 1,
                      rotation: 0,
                    }}
                  />
                </div>
              </div>
            </div>

            {currDeckIdx > -1 && (
              <div
                id={`${userID}hand`}
                className={`${classes.playerHand} relative h-[64px] w-[48px] select-none lg:h-[72px] lg:w-[56px]`}
              >
                <>
                  {currRevealedCardsFromDeck.map((card, idx) => (
                    <div
                      key={`${userID}card${card?.suit}${card?.value}`}
                      className="absolute top-0 left-0"
                      style={{
                        top: `${-1 * (idx * 2)}px`,
                      }}
                      onMouseDown={() => {
                        console.log("mouse down on deck card");

                        roomCtx.setHoldingADeckCard(true);
                      }}
                      onMouseUp={() => {
                        roomCtx.setHoldingADeckCard(false);
                        roomCtx.setHoveredSqueakStack(null);
                      }}
                    >
                      <Card
                        value={card?.value}
                        suit={card?.suit}
                        draggable={true} // only if currentlyShownOpenCardIdx === idx or something (already is good enough as is?)
                        origin={"deck"}
                        ownerID={userID!}
                        startID={`${userID}hand`}
                        animationConfig={{
                          xMultiplier: 1,
                          yMultiplier: 1,
                          rotation: 0,
                        }}
                      />
                    </div>
                  ))}
                </>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default PlayerCardContainer;
