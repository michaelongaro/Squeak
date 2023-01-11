import { useEffect, useState } from "react";
import { socket } from "../../pages";
import { useLocalStorageContext } from "../../context/LocalStorageContext";
import { useRoomContext } from "../../context/RoomContext";
import Card from "./Card";
import { FaRedoAlt } from "react-icons/fa";

import { type ICard } from "../../utils/generateDeckAndSqueakCards";
import classes from "./PlayerCardContainer.module.css";
import useTrackHoverOverSqueakStacks from "../../hooks/useTrackHoverOverSqueakStacks";
import { type IDrawFromSqueakDeck } from "../../pages/api/socket";

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

  useEffect(() => {
    socket.on("cardDrawnFromSqueakDeck", (data) =>
      handleCardDrawnFromSqueakDeck(data)
    );
  }, []);

  function handleCardDrawnFromSqueakDeck({
    playerID,
    updatedBoard,
    updatedPlayerCards,
  }: Partial<IDrawFromSqueakDeck>) {
    if (playerID === userID) {
      roomCtx.setGameData({
        ...roomCtx.gameData,
        board: updatedBoard || roomCtx.gameData?.board, // board will be set to null otherwise, not sure why
        players: updatedPlayerCards || roomCtx.gameData?.players,
      });
    }
  }

  // TODO: extract to util function (will need to pass in ctx vars + setters)
  function cycleThroughDeck() {
    // @ts-expect-error asdf
    const currDeckLength = roomCtx.gameData?.players[userID]?.deck.length;

    if (currDeckIdx + 3 <= currDeckLength) {
      setCurrRevealedCardsFromDeck([
        roomCtx.gameData?.players[userID!]?.deck[currDeckIdx + 1] || null,
        roomCtx.gameData?.players[userID!]?.deck[currDeckIdx + 2] || null,
        roomCtx.gameData?.players[userID!]?.deck[currDeckIdx + 3] || null,
      ]);

      if (currDeckIdx + 3 === currDeckLength) {
        setCurrDeckIdx(-1);
      } else {
        setCurrDeckIdx((prevIdx) => prevIdx + 3);
      }
    } else if (currDeckIdx + 2 === currDeckLength) {
      setCurrRevealedCardsFromDeck([
        roomCtx.gameData?.players[userID!]?.deck[currDeckIdx + 1] || null,
        roomCtx.gameData?.players[userID!]?.deck[currDeckIdx + 2] || null,
        null,
      ]);
      setCurrDeckIdx(-1);
    } else if (currDeckIdx + 1 === currDeckLength) {
      setCurrRevealedCardsFromDeck([
        roomCtx.gameData?.players[userID!]?.deck[currDeckIdx + 1] || null,
        null,
        null,
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

  // really not sure why the board gets set to null one squeak draw, however since the server looks like
  // it is sending the correct data, try to just send back the board as well.

  return (
    <div className={`${cardContainerClass}`}>
      <div className={`${classes.gridContainer}`}>
        <div
          id={"currUserSqueakDeck"}
          style={{
            boxShadow:
              emptySqueakStackIdx() !== -1
                ? "0px 0px 10px 3px rgba(184,184,184,1)"
                : "none",
            cursor: emptySqueakStackIdx() !== -1 ? "pointer" : "default",
          }}
          className={`${classes.squeakDeck}`}
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
          <Card showCardBack={true} draggable={false} />
        </div>

        {userID &&
          roomCtx.gameData?.players[userID]?.squeakHand.map(
            (cards, cardsIdx) => (
              <div
                key={`${userID}card${cardsIdx}`}
                id={`currUserSqueakHand${cardsIdx}`}
                // style={{
                //   boxShadow:
                //     roomCtx.holdingADeckCard || roomCtx.holdingASqueakCard
                //       ? "0px 0px 10px 3px rgba(184,184,184,1)"
                //       : "none",
                //   height:
                //     cards.length === 1 ? 72 : `${cards.length * 15 + 72}px`,
                // }}
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
                        if (cardIdx === cards.length - 1) {
                          roomCtx.setOriginIndexForHeldSqueakCard(cardsIdx);
                          roomCtx.setHoldingASqueakCard(true);
                          roomCtx.setHoveredSqueakStack(null);
                        }
                      }}
                      onMouseUp={() => {
                        roomCtx.setHoldingASqueakCard(false);
                        roomCtx.setOriginIndexForHeldSqueakCard(null);
                      }}
                    >
                      <Card
                        value={card.value}
                        suit={card.suit}
                        draggable={true} //cardIdx === cards.length - 1
                        origin={"squeak"}
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
                id={"currUserDeck"}
                className="grid cursor-pointer grid-cols-1 items-center justify-items-center"
                onClick={() => cycleThroughDeck()}
              >
                <div
                  style={{
                    opacity: currDeckIdx === -1 ? 1 : 0, // would I guess have to have a check to make sure it
                    // doesn't show right at start
                  }}
                  className="col-start-1 row-start-1"
                >
                  <FaRedoAlt size={"1rem"} />
                </div>
                <div
                  style={{
                    opacity: currDeckIdx === -1 ? 0.25 : 1, // would I guess have to have a check to make sure it
                    // doesn't show right at start
                  }}
                  className="col-start-1 row-start-1"
                >
                  <Card showCardBack={true} draggable={false} />
                </div>
              </div>
            </div>

            {currDeckIdx > -1 && (
              <div
                id={"currUserDeckHand"}
                className={`${classes.playerHand} relative h-full w-full`}
              >
                <>
                  {currRevealedCardsFromDeck.map((card, idx) => (
                    <div
                      key={`${userID}card${card?.suit}${card?.value}`}
                      className="absolute top-0 left-0"
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
