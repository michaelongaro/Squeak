import { useState } from "react";
import { socket } from "../../pages";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import Card from "./Card";
import { FaRedoAlt } from "react-icons/fa";
import useTrackHoverOverSqueakStacks from "../../hooks/useTrackHoverOverSqueakStacks";

import classes from "./PlayerCardContainer.module.css";
import { type IGetBoxShadowStyles } from "./Board";
import useRotatePlayerDecks from "../../hooks/useRotatePlayerDecks";
import PlayerIcon from "../playerIcons/PlayerIcon";
import useResponsiveCardDimensions from "../../hooks/useResponsiveCardDimensions";
import { AnimatePresence, motion } from "framer-motion";

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
  const {
    gameData,
    roomConfig,
    playerMetadata,
    holdingASqueakCard,
    hoveredSqueakStack,
    holdingADeckCard,
    playerIDWhoSqueaked,
    proposedCardBoxShadow,
    decksAreBeingRotated,
    originIndexForHeldSqueakCard,
    setHoldingADeckCard,
    setOriginIndexForHeldSqueakCard,
    setHoldingASqueakCard,
    setResetHeldSqueakStackLocation,
    setHoveredSqueakStack,
  } = useRoomContext();
  const { value: userID } = useUserIDContext();

  const [hoveringOverDeck, setHoveringOverDeck] = useState(false);

  useTrackHoverOverSqueakStacks();
  useRotatePlayerDecks();

  const cardDimensions = useResponsiveCardDimensions();

  function getBoxShadowStyles({
    id,
    squeakStackIdx,
  }: IGetBoxShadowStyles): string {
    if (holdingADeckCard || holdingASqueakCard) {
      return `0px 0px 10px ${
        hoveredSqueakStack && hoveredSqueakStack === squeakStackIdx
          ? "5px"
          : "3px"
      } rgba(184,184,184,1)`;
    } else if (proposedCardBoxShadow?.id === id) {
      return proposedCardBoxShadow.boxShadowValue;
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
            {gameData.players[userID]!.squeakDeck.length > 0 ? (
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
                    value={gameData.players[userID]!.squeakDeck[0]!.value}
                    suit={gameData.players[userID]!.squeakDeck[0]!.suit}
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
                    playerIDWhoSqueaked === userID
                      ? "0px 0px 20px 5px rgba(184,184,184,1)"
                      : "none",
                  transition: "box-shadow 0.85s ease-in-out",
                }}
                className="bg-green-300 p-4 transition-colors hover:bg-green-200"
                onClick={() => {
                  socket.emit("roundOver", {
                    roomID: roomConfig.code,
                    winner: userID,
                  });
                }}
              >
                Squeak!
              </button>
            )}
          </div>

          {gameData?.players[userID]?.squeakHand.map((cards, cardsIdx) => (
            <div
              key={`${userID}card${cardsIdx}`}
              // @ts-expect-error asdf
              className={`${cardClassMap[cardsIdx]} relative h-full w-full`}
            >
              <div
                id={`${userID}squeakHand${cardsIdx}`}
                style={{
                  boxShadow: getBoxShadowStyles({
                    id: `${userID}squeakHand${cardsIdx}`,
                    squeakStackIdx: -1,
                  }),
                  opacity:
                    hoveredSqueakStack === cardsIdx &&
                    (holdingADeckCard || holdingASqueakCard)
                      ? 0.35 // worst case you leave it like this (was prev 0.75)
                      : 1,
                  height:
                    cards.length === 1
                      ? cardDimensions.height
                      : `${
                          cards.length * (15 - cardsIdx) + cardDimensions.height
                        }px`,
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
                        originIndexForHeldSqueakCard === cardsIdx
                          ? 501
                          : "auto",
                      top: `${(15 - cards.length) * cardIdx}px`, //was just: cardsIdx * 15
                    }}
                    onMouseDown={() => {
                      setOriginIndexForHeldSqueakCard(cardsIdx);
                      setHoldingASqueakCard(true);
                      setHoveredSqueakStack(null);
                    }}
                    onMouseUp={() => {
                      setHoldingASqueakCard(false);
                      setOriginIndexForHeldSqueakCard(null);
                      setResetHeldSqueakStackLocation([cardsIdx, cardIdx]);
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
          ))}

          <div
            className={`${classes.playerDeck} z-[500] h-[64px] w-[48px] tall:h-[87px] tall:w-[67px]`}
          >
            <div
              id={`${userID}deck`}
              style={{
                boxShadow:
                  hoveringOverDeck && !holdingADeckCard
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
                  roomCode: roomConfig.code,
                });
              }}
            >
              {gameData?.players[userID]?.nextTopCardInDeck ? (
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
                    style={{
                      animationPlayState: decksAreBeingRotated
                        ? "running"
                        : "paused",
                    }}
                    className="topBackFacingCardInDeck absolute top-0 left-0 h-full w-full"
                  >
                    <Card
                      value={
                        gameData?.players[userID]?.nextTopCardInDeck?.value
                      }
                      suit={gameData?.players[userID]?.nextTopCardInDeck?.suit}
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
                    <FaRedoAlt size={"1.5rem"} />
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
            className={`${classes.playerHand} relative z-[20] h-[64px] w-[48px] select-none tall:h-[87px] tall:w-[67px]`}
          >
            <>
              {gameData.players[userID]?.topCardsInDeck.map(
                (card, idx) =>
                  card !== null && ( // necessary?
                    <div
                      key={`${userID}card${card?.suit}${card?.value}`}
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
                        ownerID={userID}
                        startID={`${userID}hand`}
                        rotation={0}
                      />
                    </div>
                  )
              )}
            </>
          </div>

          <AnimatePresence
            initial={false}
            mode={"wait"}
            onExitComplete={() => null}
          >
            {decksAreBeingRotated && (
              <motion.div
                key={"decksAreBeingRotatedTooltip"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                style={{
                  color: "hsl(120deg 100% 86%)",
                  borderColor: "hsl(120deg 100% 86%)",
                }}
                className="baseVertFlex absolute left-[-20rem] bottom-4 gap-2 rounded-sm border-2 bg-green-800 p-2"
              >
                <div>No player has valid moves,</div>
                <div>rotating each player&apos;s deck by one card.</div>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            style={{
              right: document.getElementById(`${userID}icon`)
                ? (document
                    .getElementById(`${userID}icon`)!
                    .getBoundingClientRect().width +
                    15) *
                  -1
                : 50,
            }}
            id={`${userID}icon`}
            className={classes.playerAvatar}
          >
            <PlayerIcon
              avatarPath={
                playerMetadata[userID]?.avatarPath || "/avatars/rabbit.svg"
              }
              borderColor={
                playerMetadata[userID]?.color || "hsl(352deg, 69%, 61%)"
              }
              username={playerMetadata[userID]?.username}
              size={"3rem"}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerCardContainer;
