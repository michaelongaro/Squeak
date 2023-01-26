import { useState } from "react";
import { socket } from "../../pages";
import { useLocalStorageContext } from "../../context/LocalStorageContext";
import { useRoomContext } from "../../context/RoomContext";
import Card from "./Card";
import { FaRedoAlt } from "react-icons/fa";
import useTrackHoverOverSqueakStacks from "../../hooks/useTrackHoverOverSqueakStacks";

import classes from "./PlayerCardContainer.module.css";
import { type IGetBoxShadowStyles } from "./Board";
import useRotatePlayerDecks from "../../hooks/useRotatePlayerDecks";

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

  const [hoveringOverDeck, setHoveringOverDeck] = useState(false);

  useTrackHoverOverSqueakStacks();
  useRotatePlayerDecks();

  function getBoxShadowStyles({
    id,
    squeakStackIdx,
  }: IGetBoxShadowStyles): string {
    if (roomCtx.holdingADeckCard || roomCtx.holdingASqueakCard) {
      return `0px 0px 10px ${
        roomCtx.hoveredSqueakStack &&
        roomCtx.hoveredSqueakStack === squeakStackIdx
          ? "5px"
          : "3px"
      } rgba(184,184,184,1)`;
    } else if (roomCtx.proposedCardBoxShadow?.id === id) {
      return roomCtx.proposedCardBoxShadow.boxShadowValue;
    }

    return "none";
  }

  return (
    <div className={`${cardContainerClass}`}>
      {userID && (
        <div className={`${classes.gridContainer}`}>
          <div
            id={`${userID}squeakDeck`}
            className={`${classes.squeakDeck} h-full w-full`}
          >
            {roomCtx.gameData.players[userID]!.squeakDeck.length > 0 ? (
              <div className="relative h-full w-full">
                <div className="absolute top-0 left-0 h-full w-full">
                  <Card
                    showCardBack={true}
                    draggable={false}
                    ownerID={userID}
                    startID={`${userID}squeakDeck`}
                    rotation={0}
                  />
                </div>
                <div className="absolute top-0 left-0 h-full w-full">
                  <Card
                    value={
                      roomCtx.gameData.players[userID]!.squeakDeck[0]!.value
                    }
                    suit={roomCtx.gameData.players[userID]!.squeakDeck[0]!.suit}
                    showCardBack={true} // separate state inside overrides this halfway through flip
                    draggable={false}
                    ownerID={userID}
                    startID={`${userID}squeakDeck`}
                    rotation={0}
                  />
                </div>
              </div>
            ) : (
              <button
                style={{
                  boxShadow:
                    roomCtx.playerIDWhoSqueaked === userID
                      ? "0px 0px 20px 5px rgba(184,184,184,1)"
                      : "none",
                  transition: "box-shadow 0.85s ease-in-out",
                }}
                className="bg-green-300 p-4 transition-colors hover:bg-green-200"
                onClick={() => {
                  socket.emit("roundOver", {
                    roomID: roomCtx.roomConfig.code,
                    winner: userID,
                  });
                }}
              >
                Squeak!
              </button>
            )}
          </div>

          {roomCtx.gameData?.players[userID]?.squeakHand.map(
            (cards, cardsIdx) => (
              <div
                key={`${userID}card${cardsIdx}`}
                id={`${userID}squeakHand${cardsIdx}`}
                // @ts-expect-error asdf
                className={`${cardClassMap[cardsIdx]} relative h-full w-full`}
              >
                <div
                  style={{
                    boxShadow: getBoxShadowStyles({
                      id: `${userID}squeakHand${cardsIdx}`,
                      squeakStackIdx: -1,
                    }),
                    opacity:
                      roomCtx.hoveredSqueakStack === cardsIdx &&
                      (roomCtx.holdingADeckCard || roomCtx.holdingASqueakCard)
                        ? 0.35 // worst case you leave it like this (was prev 0.75)
                        : 1,
                    height:
                      cards.length === 1 ? 72 : `${cards.length * 15 + 72}px`,
                  }}
                  className="absolute w-full rounded-lg transition-all"
                >
                  {cards.map((card, cardIdx) => (
                    <div
                      key={`${userID}card${cardIdx}`}
                      id={`${userID}squeakStack${cardsIdx}${cardIdx}`}
                      className={`absolute left-0 h-full w-full`}
                      style={{
                        zIndex:
                          roomCtx.originIndexForHeldSqueakCard === cardsIdx
                            ? 501
                            : "auto",
                        top: `${cardIdx * 15}px`,
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
                        ownerID={userID}
                        startID={`${userID}squeakStack${cardsIdx}${cardIdx}`}
                        rotation={0}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          <div
            className={`${classes.playerDeck} z-[500] h-[64px] w-[48px] lg:h-[72px] lg:w-[56px]`}
          >
            <div
              id={`${userID}deck`}
              style={{
                boxShadow:
                  hoveringOverDeck && !roomCtx.holdingADeckCard
                    ? "0px 0px 10px 3px rgba(184,184,184,1)"
                    : "none",
              }}
              className="h-full w-full cursor-pointer transition-shadow"
              onMouseEnter={() => {
                setHoveringOverDeck(true);
              }}
              onMouseLeave={() => {
                setHoveringOverDeck(false);
              }}
              onClick={() => {
                socket.emit("playerDrawFromDeck", {
                  playerID: userID,
                  roomCode: roomCtx.roomConfig.code,
                });
              }}
            >
              {roomCtx.gameData?.players[userID]?.nextTopCardInDeck ? (
                <div className="relative h-full w-full">
                  <div className="absolute top-0 left-0 h-full w-full">
                    <Card
                      showCardBack={true}
                      draggable={false}
                      ownerID={userID}
                      startID={`${userID}deck`}
                      rotation={0}
                    />
                  </div>
                  <div
                    className={`${classes.topBackFacingCardInDeck} absolute top-0 left-0 h-full w-full`}
                  >
                    <Card
                      value={
                        roomCtx.gameData?.players[userID]?.nextTopCardInDeck
                          ?.value
                      }
                      suit={
                        roomCtx.gameData?.players[userID]?.nextTopCardInDeck
                          ?.suit
                      }
                      showCardBack={true} // separate state inside overrides this halfway through flip
                      draggable={false}
                      ownerID={userID}
                      startID={`${userID}deck`}
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
                      ownerID={userID}
                      startID={`${userID}deck`}
                      rotation={0}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            id={`${userID}hand`}
            className={`${classes.playerHand} relative h-[64px] w-[48px] select-none lg:h-[72px] lg:w-[56px]`}
          >
            <>
              {roomCtx.gameData.players[userID]?.topCardsInDeck.map(
                (card, idx) =>
                  card !== null && ( // necessary?
                    <div
                      key={`${userID}card${card?.suit}${card?.value}`}
                      className="absolute top-0 left-0"
                      style={{
                        top: `${-1 * (idx * 2)}px`,
                      }}
                      onMouseDown={() => {
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
                        draggable={true}
                        origin={"deck"}
                        ownerID={userID}
                        startID={`${userID}hand`}
                        rotation={0}
                      />
                    </div>
                  )
              )}
            </>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerCardContainer;
