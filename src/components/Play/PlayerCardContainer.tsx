import { useState, useEffect, type PointerEvent } from "react";
import { socket } from "../../pages";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import Card from "./Card";
import { FaRedoAlt } from "react-icons/fa";

import classes from "./PlayerCardContainer.module.css";
import { type IGetBoxShadowStyles } from "./Board";
import useRotatePlayerDecks from "../../hooks/useRotatePlayerDecks";
import PlayerIcon from "../playerIcons/PlayerIcon";
import useResponsiveCardDimensions from "../../hooks/useResponsiveCardDimensions";
import { AnimatePresence } from "framer-motion";
import Buzzer from "./Buzzer";
import useFilterCardsInHandFromDeck from "../../hooks/useFilterCardsInHandFromDeck";
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
    originIndexForHeldSqueakCard,
    setHoldingADeckCard,
    cardBeingMovedProgramatically,
    squeakDeckBeingMovedProgramatically,
    setOriginIndexForHeldSqueakCard,
    setHoldingASqueakCard,
    setHoveredSqueakStack,
    squeakStackDragAlterations,
    hoveredCell,
    setHoveredCell,
  } = useRoomContext();

  const [hoveringOverDeck, setHoveringOverDeck] = useState(false);
  const [pointerDownOnDeck, setPointerDownOnDeck] = useState(false);
  const [drawingFromDeck, setDrawingFromDeck] = useState(false);

  useRotatePlayerDecks();

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
    cardIdx: number
  ) {
    const draggedData = squeakStackDragAlterations[userID];

    const draggedStack = draggedData?.draggedStack ?? null;
    const squeakStackDepthAlterations =
      draggedData?.squeakStackDepthAlterations ?? null;

    let lengthOfSqueakStackBeingDragged = 0;
    if (draggedStack !== null) {
      lengthOfSqueakStackBeingDragged = draggedStack.length;
    }

    // special handling for squeak stack being dragged
    if (
      squeakStackIdx === draggedStack?.squeakStackIdx &&
      cardIdx >= draggedStack?.startingDepth
    ) {
      squeakStackLength =
        draggedStack.lengthOfTargetStack + lengthOfSqueakStackBeingDragged;
    }

    // otherwise, part of regular squeak stacks
    else {
      squeakStackLength += squeakStackDepthAlterations?.[squeakStackIdx] ?? 0;
    }

    return `${(20 - squeakStackLength) * cardIdx}px`;
  }

  function pointerMoveHandler(e: PointerEvent<HTMLDivElement>) {
    if (userID === null) return;

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
        e.clientX > squeakHand0.left &&
        e.clientX < squeakHand0.right &&
        e.clientY > squeakHand0.top &&
        e.clientY < squeakHand0.bottom
      ) {
        setHoveredSqueakStack(0);
      } else if (
        e.clientX > squeakHand1.left &&
        e.clientX < squeakHand1.right &&
        e.clientY > squeakHand1.top &&
        e.clientY < squeakHand1.bottom
      ) {
        setHoveredSqueakStack(1);
      } else if (
        e.clientX > squeakHand2.left &&
        e.clientX < squeakHand2.right &&
        e.clientY > squeakHand2.top &&
        e.clientY < squeakHand2.bottom
      ) {
        setHoveredSqueakStack(2);
      } else if (
        e.clientX > squeakHand3.left &&
        e.clientX < squeakHand3.right &&
        e.clientY > squeakHand3.top &&
        e.clientY < squeakHand3.bottom
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

  // necessary to prevent card in hand + card in .mapped deck from both being
  // moved at the same time.
  const filteredCardsInHandFromDeck = useFilterCardsInHandFromDeck({
    array: gameData.players[userID]?.deck,
    playerID: userID,
  });

  return (
    <div
      id={"playerContainer"}
      className={`${cardContainerClass}`}
      onPointerMove={(e) => pointerMoveHandler(e)}
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
                          cardIdx
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
            )
          )}

          <div
            id={`${userID}squeakDeck`}
            className={`${classes.squeakDeck} baseFlex h-full w-full select-none`}
          >
            {gameData.players[userID]!.squeakDeck.length > 0 && (
              <div className="relative h-full w-full">
                {gameData.players[userID]?.squeakDeck.map((card, cardIdx) => (
                  <div
                    key={`${userID}squeakDeckCard${card.suit}${card.value}`}
                    style={{
                      zIndex:
                        cardIdx ===
                          gameData.players[userID]!.squeakDeck.length - 1 &&
                        squeakDeckBeingMovedProgramatically[userID] &&
                        !holdingADeckCard &&
                        !holdingASqueakCard &&
                        !cardBeingMovedProgramatically[userID]
                          ? 150
                          : 90,
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
            <>
              {gameData.players[userID]?.topCardsInDeck.map(
                (card, idx) =>
                  card !== null && (
                    <div
                      key={`${userID}handCard${card.suit}${card.value}`}
                      className="absolute left-0 top-0 select-none"
                      onPointerEnter={() => {
                        setHoveringOverDeck(false);
                      }}
                      onPointerDown={() => {
                        if (
                          idx ===
                          gameData.players[userID]!.topCardsInDeck.length - 1
                        )
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
                          idx ===
                          gameData.players[userID]!.topCardsInDeck.length - 1
                        }
                        origin={"hand"}
                        ownerID={userID}
                        hueRotation={
                          playerMetadata[userID]?.deckHueRotation || 0
                        }
                        startID={`${userID}hand`}
                        rotation={0}
                      />
                    </div>
                  )
              )}
            </>
          </div>

          <div className={`${classes.playerDeck} cardDimensions select-none`}>
            <div
              id={`${userID}deck`}
              style={{
                boxShadow:
                  hoveringOverDeck &&
                  !holdingADeckCard &&
                  !drawingFromDeck &&
                  !pointerDownOnDeck
                    ? "0px 0px 4px 3px rgba(184,184,184,1)"
                    : "none",
                cursor: drawingFromDeck ? "auto" : "pointer",
                pointerEvents: drawingFromDeck ? "none" : "auto",
                filter: pointerDownOnDeck ? "brightness(0.8)" : "none",
                transition:
                  "box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1), filter 150ms ease-in-out",
              }}
              className="h-full w-full select-none rounded-[0.1rem]"
              onPointerEnter={() => {
                if (drawingFromDeck) return;
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
                if (drawingFromDeck) return;

                setHoldingADeckCard(false);
                setDrawingFromDeck(true);

                setTimeout(() => {
                  setDrawingFromDeck(false);
                }, 375);

                socket.emit("playerDrawFromDeck", {
                  playerID: userID,
                  roomCode: roomConfig.code,
                });
              }}
            >
              {gameData?.players[userID]?.nextTopCardInDeck ? (
                <div className="relative h-full w-full select-none">
                  <>
                    <div
                      style={{
                        animationPlayState: decksAreBeingRotated
                          ? "running"
                          : "paused",
                      }}
                      className="topBackFacingCardInDeck absolute left-0 top-0 h-full w-full select-none"
                    >
                      {filteredCardsInHandFromDeck?.map((card) => (
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
                    <div className="absolute left-0 top-0 h-full w-full select-none">
                      <Card
                        showCardBack={true}
                        draggable={false}
                        ownerID={userID}
                        hueRotation={
                          playerMetadata[userID]?.deckHueRotation || 0
                        }
                        origin={"deck"}
                        rotation={0}
                      />
                    </div>
                  </>
                </div>
              ) : (
                <div className="grid cursor-pointer select-none grid-cols-1 items-center justify-items-center">
                  <div className="col-start-1 row-start-1 select-none">
                    <FaRedoAlt size={"1.5rem"} />
                  </div>
                  <div className="col-start-1 row-start-1 select-none opacity-25">
                    <Card
                      showCardBack={true}
                      draggable={false}
                      ownerID={userID}
                      hueRotation={playerMetadata[userID]?.deckHueRotation || 0}
                      startID={`${userID}deck`}
                      rotation={0}
                    />
                  </div>
                </div>
              )}
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
