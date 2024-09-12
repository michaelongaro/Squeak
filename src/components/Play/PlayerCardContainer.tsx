import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import Card from "./Card";
import { FaRedoAlt } from "react-icons/fa";
import classes from "./PlayerCardContainer.module.css";
import { type IGetBoxShadowStyles } from "./Board";
import PlayerIcon from "../playerIcons/PlayerIcon";
import useResponsiveCardDimensions from "../../hooks/useResponsiveCardDimensions";
import { AnimatePresence, motion } from "framer-motion";
import Buzzer from "./Buzzer";
import StaticCard from "~/components/Play/StaticCard";
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
  const userID = useUserIDContext();

  const {
    mirrorPlayerContainer,
    roomConfig,
    playerMetadata,
    gameData,
    holdingASqueakCard,
    hoveredSqueakStack,
    holdingADeckCard,
    proposedCardBoxShadow,
    decksAreBeingRotated,
    setDecksAreBeingRotated,
    originIndexForHeldSqueakCard,
    setHoldingADeckCard,
    squeakDeckBeingMovedProgramatically,
    setOriginIndexForHeldSqueakCard,
    setHoldingASqueakCard,
    setHoveredSqueakStack,
    squeakStackDragAlterations,
    hoveredCell,
    setHoveredCell,
    currentPlayerIsDrawingFromDeck,
    setCurrentPlayerIsDrawingFromDeck,
    fallbackPlayerIsDrawingFromDeckTimerIdRef,
  } = useRoomContext();

  const [hoveringOverDeck, setHoveringOverDeck] = useState(false);
  const [pointerDownOnDeck, setPointerDownOnDeck] = useState(false);

  const cardDimensions = useResponsiveCardDimensions();

  useEffect(() => {
    if (!holdingADeckCard && !holdingASqueakCard) {
      setHoveredCell(null);
      setHoveredSqueakStack(null);
    }
  }, [
    holdingADeckCard,
    holdingASqueakCard,
    hoveredCell,
    setHoveredCell,
    setHoveredSqueakStack,
  ]);

  function getDynamicTopValue(
    squeakStackIdx: number,
    squeakStackLength: number,
    cardIdx: number,
  ) {
    const draggedData = squeakStackDragAlterations[userID];

    // early return if no dragged data, since we don't need to calculate anything
    if (!draggedData) {
      return `${(20 - squeakStackLength) * cardIdx}px`;
    }

    const draggedStack = draggedData?.draggedStack ?? null;
    const squeakStackDepthAlterations =
      draggedData?.squeakStackDepthAlterations ?? null;

    // special handling for squeak stack being dragged, since it's possible
    // only a part of the stack is being dragged

    if (
      squeakStackIdx === draggedStack?.squeakStackIdx &&
      cardIdx >= draggedStack?.indexWithinStartStack
    ) {
      squeakStackLength = draggedStack.lengthOfTargetStack;
    }

    // otherwise, part of regular squeak stacks
    else if (squeakStackDepthAlterations) {
      squeakStackLength += squeakStackDepthAlterations[squeakStackIdx] ?? 0;
    }

    return `${(20 - squeakStackLength) * cardIdx}px`;
  }

  function pointerMoveHandler(clientX: number, clientY: number) {
    if (userID === null || (!holdingADeckCard && !holdingASqueakCard)) return;

    const squeakHand0 = document
      .getElementById(`${userID}squeakHand0`)
      ?.getBoundingClientRect();
    const squeakHand1 = document
      .getElementById(`${userID}squeakHand1`)
      ?.getBoundingClientRect();
    const squeakHand2 = document
      .getElementById(`${userID}squeakHand2`)
      ?.getBoundingClientRect();
    const squeakHand3 = document
      .getElementById(`${userID}squeakHand3`)
      ?.getBoundingClientRect();

    if (squeakHand0 && squeakHand1 && squeakHand2 && squeakHand3) {
      if (
        clientX > squeakHand0.left &&
        clientX < squeakHand0.right &&
        clientY > squeakHand0.top &&
        clientY < squeakHand0.bottom
      ) {
        setHoveredSqueakStack(0);
      } else if (
        clientX > squeakHand1.left &&
        clientX < squeakHand1.right &&
        clientY > squeakHand1.top &&
        clientY < squeakHand1.bottom
      ) {
        setHoveredSqueakStack(1);
      } else if (
        clientX > squeakHand2.left &&
        clientX < squeakHand2.right &&
        clientY > squeakHand2.top &&
        clientY < squeakHand2.bottom
      ) {
        setHoveredSqueakStack(2);
      } else if (
        clientX > squeakHand3.left &&
        clientX < squeakHand3.right &&
        clientY > squeakHand3.top &&
        clientY < squeakHand3.bottom
      ) {
        setHoveredSqueakStack(3);
      } else {
        setHoveredSqueakStack(null);
      }
    }
  }

  function getBoxShadowStyles({
    id,
    squeakStackIdx,
  }: IGetBoxShadowStyles): string {
    if (holdingADeckCard || holdingASqueakCard) {
      return `0px 0px 4px ${
        hoveredSqueakStack !== originIndexForHeldSqueakCard &&
        hoveredSqueakStack === squeakStackIdx
          ? "4px"
          : "2px"
      } rgba(184,184,184,1)`;
    } else if (proposedCardBoxShadow?.id === id) {
      return proposedCardBoxShadow.boxShadowValue;
    }

    return "none";
  }

  return (
    <div
      id={"playerContainer"}
      className={`${cardContainerClass} rounded-md bg-gradient-to-br from-green-800 to-green-850`}
      onMouseMove={(e) => pointerMoveHandler(e.clientX, e.clientY)}
      onTouchMove={(e) => {
        if (e.touches.length > 0) {
          const touch = e.touches[0];
          if (!touch) return;
          pointerMoveHandler(touch.clientX, touch.clientY);
        }
      }}
    >
      {userID && (
        <div
          className={`${
            mirrorPlayerContainer
              ? classes.reversedGridContainer
              : classes.gridContainer
          } select-none`}
        >
          {gameData?.players[userID]?.squeakHand.map(
            (cards, squeakStackIdx) => (
              <div
                key={`${userID}squeakStack${squeakStackIdx}`}
                // @ts-expect-error asdf
                className={`${cardClassMap[squeakStackIdx]} relative h-full w-full select-none`}
              >
                <div
                  id={`${userID}squeakHand${squeakStackIdx}`}
                  style={{
                    boxShadow: getBoxShadowStyles({
                      id: `${userID}squeakHand${squeakStackIdx}`,
                      squeakStackIdx: -1,
                    }),
                    opacity:
                      hoveredSqueakStack !== originIndexForHeldSqueakCard &&
                      hoveredSqueakStack === squeakStackIdx &&
                      (holdingADeckCard || holdingASqueakCard)
                        ? 0.35
                        : 1,
                    height:
                      cards.length === 0 || cards.length === 1
                        ? `${cardDimensions.height}px`
                        : `${
                            (cards.length - 1) * (20 - cards.length) +
                            cardDimensions.height
                          }px`,
                  }}
                  className="absolute w-full select-none rounded-[0.2rem] transition-all"
                >
                  {cards.map((card, cardIdx) => (
                    <div
                      key={`${userID}squeakCard${card.suit}${card.value}`}
                      id={`${userID}squeakStack${squeakStackIdx}${cardIdx}`}
                      style={{
                        zIndex:
                          originIndexForHeldSqueakCard === squeakStackIdx
                            ? 150
                            : "auto",
                        top: getDynamicTopValue(
                          squeakStackIdx,
                          cards.length,
                          cardIdx,
                        ),
                        transition: "top 0.25s ease-in-out",
                      }}
                      className={"cardDimensions absolute left-0 select-none"}
                      onPointerDown={() => {
                        setOriginIndexForHeldSqueakCard(squeakStackIdx);
                        setHoldingASqueakCard(true);
                        setHoveredSqueakStack(null);
                      }}
                      onPointerUp={() => {
                        // pointer events fire before the drop event in <Card />,
                        // so just waiting for next event loop tick
                        setTimeout(() => {
                          setHoldingASqueakCard(false);
                          setOriginIndexForHeldSqueakCard(null);
                        }, 0);
                      }}
                    >
                      <Card
                        value={card.value}
                        suit={card.suit}
                        draggable={true}
                        origin={"squeakHand"}
                        squeakStackLocation={[squeakStackIdx, cardIdx]}
                        ownerID={userID}
                        hueRotation={
                          playerMetadata[userID]?.deckHueRotation || 0
                        }
                        startID={`${userID}squeakStack${squeakStackIdx}${cardIdx}`}
                        rotation={0}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ),
          )}

          <div
            id={`${userID}squeakDeck`}
            className={`${classes.squeakDeck} baseFlex h-full w-full select-none`}
          >
            {gameData.players[userID]!.squeakDeck.length > 0 && (
              <div className="relative h-full w-full">
                {gameData.players[userID]?.squeakDeck.map((card) => (
                  <div
                    key={`${userID}squeakDeckCard${card.suit}${card.value}`}
                    style={{
                      zIndex: squeakDeckBeingMovedProgramatically[userID]
                        ? 140 // 140 since the card shouldn't be above any moving cards, which are at 150
                        : 90, // otherwise default to 90 so regular cards fly above this whole deck
                    }}
                    className="absolute left-0 top-0 h-full w-full select-none"
                  >
                    <Card
                      value={card.value}
                      suit={card.suit}
                      showCardBack={true} // separate state inside overrides this halfway through flip
                      draggable={false}
                      ownerID={userID}
                      hueRotation={playerMetadata[userID]?.deckHueRotation || 0}
                      startID={`${userID}squeakDeck`}
                      origin={"squeakDeck"}
                      rotation={0}
                    />
                  </div>
                ))}
              </div>
            )}

            <AnimatePresence mode={"popLayout"}>
              {gameData.players[userID]!.squeakDeck.length === 0 && (
                <Buzzer
                  playerID={userID}
                  roomCode={roomConfig.code}
                  interactive={true}
                />
              )}
            </AnimatePresence>
          </div>

          <div
            id={`${userID}hand`}
            style={{
              zIndex: holdingADeckCard ? 150 : 100,
              opacity: decksAreBeingRotated ? 0 : 1,
            }}
            className={`${classes.playerHand} cardDimensions relative select-none transition-opacity`}
          >
            {gameData.players[userID]?.hand.map(
              (card, idx) =>
                card !== null && (
                  <div
                    key={`${userID}handCard${card.suit}${card.value}`}
                    className="absolute left-0 top-0 select-none"
                    onPointerEnter={() => {
                      setHoveringOverDeck(false);
                    }}
                    onPointerDown={() => {
                      if (idx === gameData.players[userID]!.hand.length - 1)
                        setHoldingADeckCard(true);
                    }}
                    onPointerUp={() => {
                      // pointer events fire before the drop event in <Card />,
                      // so just waiting for next event loop tick
                      setTimeout(() => {
                        setHoldingADeckCard(false);
                      }, 0);
                    }}
                  >
                    <Card
                      value={card.value}
                      suit={card.suit}
                      draggable={
                        idx === gameData.players[userID]!.hand.length - 1
                      }
                      origin={"hand"}
                      ownerID={userID}
                      hueRotation={playerMetadata[userID]?.deckHueRotation || 0}
                      startID={`${userID}hand`}
                      rotation={0}
                    />
                  </div>
                ),
            )}
          </div>

          <div
            className={`${classes.playerDeck} cardDimensions select-none ${currentPlayerIsDrawingFromDeck ? "z-[100]" : ""}`}
          >
            <div
              id={`${userID}deck`}
              style={{
                boxShadow:
                  hoveringOverDeck &&
                  !holdingADeckCard &&
                  !currentPlayerIsDrawingFromDeck &&
                  !pointerDownOnDeck
                    ? "0px 0px 4px 3px rgba(184,184,184,1)"
                    : "none",
                cursor: currentPlayerIsDrawingFromDeck ? "auto" : "pointer",
                pointerEvents: currentPlayerIsDrawingFromDeck ? "none" : "auto",
                filter: pointerDownOnDeck ? "brightness(0.8)" : "none",
                transition:
                  "box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1), filter 150ms ease-in-out",
              }}
              className="h-full w-full select-none rounded-[0.1rem]"
              onPointerEnter={() => {
                if (currentPlayerIsDrawingFromDeck) return;
                setHoveringOverDeck(true);
              }}
              onPointerLeave={() => {
                setHoveringOverDeck(false);
                setPointerDownOnDeck(false);
              }}
              onPointerDown={() => {
                setPointerDownOnDeck(true);
              }}
              onPointerUp={() => {
                setPointerDownOnDeck(false);
              }}
              onClick={() => {
                if (currentPlayerIsDrawingFromDeck) return;

                setCurrentPlayerIsDrawingFromDeck(true);
                setHoldingADeckCard(false);

                fallbackPlayerIsDrawingFromDeckTimerIdRef.current = setTimeout(
                  () => {
                    setCurrentPlayerIsDrawingFromDeck(false);
                  },
                  500,
                );

                socket.volatile.emit("playerDrawFromDeck", {
                  playerID: userID,
                  roomCode: roomConfig.code,
                });
              }}
            >
              <AnimatePresence mode={"popLayout"} initial={false}>
                {gameData?.players[userID]?.deck?.length ? (
                  <motion.div
                    key={`animated${userID}Deck`}
                    initial={{ opacity: 0, scale: 0.75 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.325 }}
                    className="relative h-full w-full select-none"
                  >
                    <div
                      style={{
                        transform: pointerDownOnDeck ? "scale(0.95)" : "none",
                        transition: "transform 150ms ease-in-out",
                      }}
                      className="baseFlex"
                    >
                      <div
                        onAnimationEnd={() => setDecksAreBeingRotated(false)}
                        className={`${
                          decksAreBeingRotated ? "topBackFacingCardInDeck" : ""
                        } absolute left-0 top-0 h-full w-full select-none`}
                      >
                        {gameData?.players[userID]?.deck?.map((card) => (
                          <div
                            key={`${userID}deckCard${card.suit}${card.value}`}
                            className="absolute left-0 top-0 h-full w-full select-none"
                          >
                            <Card
                              value={card.value}
                              suit={card.suit}
                              showCardBack={true} // separate state inside overrides this halfway through flip
                              draggable={false}
                              ownerID={userID}
                              hueRotation={
                                playerMetadata[userID]?.deckHueRotation || 0
                              }
                              origin={"deck"}
                              startID={`${userID}deck`}
                              rotation={0}
                            />
                          </div>
                        ))}
                      </div>

                      {/* dummy card for when deck is drawing last 1/2/3 cards so that the last cards that
                          are supposed to be moving with the top card that is animating don't get revealed
                          to be actually static during the animation.*/}
                      <div className="absolute left-0 top-0 h-full w-full select-none">
                        <StaticCard
                          showCardBack={true}
                          hueRotation={
                            playerMetadata[userID]?.deckHueRotation || 0
                          }
                          suit={"S"} // placeholder
                          value={"2"} // placeholder
                          deckVariantIndex={0} // placeholder
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`animated${userID}DeckReset`}
                    initial={{ opacity: 0, scale: 0.75 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.75 }}
                    transition={{ duration: 0.325 }}
                    className="baseFlex cursor-pointer select-none"
                  >
                    <div
                      style={{
                        transform: pointerDownOnDeck ? "scale(0.95)" : "none",
                        transition: "transform 150ms ease-in-out",
                      }}
                      className="grid grid-cols-1 items-center justify-items-center"
                    >
                      <div className="col-start-1 row-start-1 select-none">
                        <FaRedoAlt className="size-6 scale-x-flip" />
                      </div>
                      <div className="col-start-1 row-start-1 select-none opacity-25">
                        <StaticCard
                          showCardBack={true}
                          hueRotation={
                            playerMetadata[userID]?.deckHueRotation || 0
                          }
                          suit={"S"} // placeholder
                          value={"2"} // placeholder
                          deckVariantIndex={0} // placeholder
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div
            style={{
              right: document.getElementById(`${userID}icon`)
                ? (document
                    .getElementById(`${userID}icon`)!
                    .getBoundingClientRect().width +
                    20) *
                  -1
                : 50,
            }}
            id={`${userID}icon`}
            className={`${classes.playerAvatar} hidden tablet:block`}
          >
            <PlayerIcon
              avatarPath={
                playerMetadata[userID]?.avatarPath || "/avatars/rabbit.svg"
              }
              borderColor={
                playerMetadata[userID]?.color || "oklch(64.02% 0.171 15.38)"
              }
              username={playerMetadata[userID]?.username}
              size={"3rem"}
              animateLayout={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerCardContainer;
