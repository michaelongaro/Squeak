import { useState, useEffect } from "react";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import useResponsiveCardDimensions from "../../hooks/useResponsiveCardDimensions";
import Card from "./Card";
import { FaRedoAlt } from "react-icons/fa";
import classes from "./OtherPlayersCardContainers.module.css";
import useRotatePlayerDecks from "../../hooks/useRotatePlayerDecks";
import Buzzer from "./Buzzer";
import { AnimatePresence } from "framer-motion";
import DisconnectIcon from "~/components/ui/DisconnectIcon";

interface IOtherPlayersCardContainers {
  orderedClassNames: (string | undefined)[];
}

const internalOrderedGridClassNames = [
  classes.topInnerGridContainer,
  classes.leftInnerGridContainer,
  classes.rightInnerGridContainer,
  classes.topInnerGridContainer,
];

const cardClassMap = {
  0: classes.squeakHand0,
  1: classes.squeakHand1,
  2: classes.squeakHand2,
  3: classes.squeakHand3,
};

const rotationOrder = [180, 90, 270, 180];

function OtherPlayersCardContainers({
  orderedClassNames,
}: IOtherPlayersCardContainers) {
  const userID = useUserIDContext();

  const {
    playerMetadata,
    gameData,
    decksAreBeingRotated,
    setDecksAreBeingRotated,
    squeakDeckBeingMovedProgramatically,
    cardBeingMovedProgramatically,
    roomConfig,
    squeakStackDragAlterations,
    viewportLabel,
  } = useRoomContext();

  const otherPlayerIDs = Object.keys(gameData.players).filter(
    (playerID) => playerID !== userID,
  );

  const [topOffsetsFromBoard, setTopOffsetsFromBoard] = useState([
    -9999, -9999, -9999, -9999,
  ]); // making sure that the inital render doesn't for a brief moment show
  // the other player's cards on the screen

  useEffect(() => {
    const boardElement = document.getElementById("board");
    if (!boardElement) return;

    const updateOffsets = () => {
      const { top, left } = boardElement.getBoundingClientRect();
      setTopOffsetsFromBoard([top, left, left]);
    };

    const mutationObserver = new MutationObserver(updateOffsets);
    const resizeObserver = new ResizeObserver(updateOffsets);

    mutationObserver.observe(boardElement, { attributes: true });
    resizeObserver.observe(boardElement);

    updateOffsets();

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, []);

  const cardDimensions = useResponsiveCardDimensions();
  useRotatePlayerDecks();

  function getDynamicTopValue(
    squeakStackIdx: number,
    squeakStackLength: number,
    cardIdx: number,
    playerID: string,
  ) {
    const draggedData = squeakStackDragAlterations[playerID];

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

  if (viewportLabel !== "desktop") {
    return (
      <>
        {otherPlayerIDs.map((playerID, idx) => (
          <div
            key={playerID}
            className={`${orderedClassNames[idx]} select-none`}
          >
            <div
              id={`${playerID}container`}
              style={{
                opacity: gameData.playerIDsThatLeftMidgame.includes(playerID)
                  ? 0.25
                  : 1,
              }}
              className={`${internalOrderedGridClassNames[idx]} relative block select-none`}
            >
              <div
                style={{
                  width: `${cardDimensions.width}px`,
                  height: `${cardDimensions.height}px`,
                  top: `${topOffsetsFromBoard[idx]}px`,
                  left: `${-cardDimensions.width / 2}px`,
                }}
                className="absolute"
              >
                {gameData.players[playerID]?.squeakHand.map(
                  (cards, squeakStackIdx) => (
                    <div
                      key={`${playerID}squeakStack${squeakStackIdx}`}
                      className={`absolute left-0 top-0 h-full w-full select-none`}
                    >
                      <div
                        id={`${playerID}squeakHand${squeakStackIdx}`}
                        style={{
                          height:
                            cards.length === 0 || cards.length === 1
                              ? `${cardDimensions.height}px`
                              : `${
                                  (cards.length - 1) * (20 - cards.length) +
                                  cardDimensions.height
                                }px`,
                        }}
                        className="absolute h-full w-full select-none"
                      >
                        {cards.map((card, cardIdx) => (
                          <div
                            key={`${playerID}squeakCard${card.suit}${card.value}`}
                            id={`${playerID}squeakStack${squeakStackIdx}${cardIdx}`}
                            className={
                              "cardDimenions absolute left-0 top-0 select-none"
                            }
                          >
                            <Card
                              value={card.value}
                              suit={card.suit}
                              draggable={false}
                              origin={"squeakHand"}
                              squeakStackLocation={[squeakStackIdx, cardIdx]}
                              ownerID={playerID}
                              hueRotation={
                                playerMetadata[playerID]?.deckHueRotation || 0
                              }
                              startID={`${playerID}squeakStack${squeakStackIdx}${cardIdx}`}
                              rotation={rotationOrder[idx] as number}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                )}

                <div
                  id={`${playerID}squeakDeck`}
                  className={`${classes.squeakDeck} baseFlex h-full w-full select-none`}
                >
                  {gameData.players[playerID]!.squeakDeck.length > 0 && (
                    <div className="relative h-full w-full">
                      {gameData.players[playerID]?.squeakDeck.map(
                        (card, cardIdx) => (
                          <div
                            key={`${playerID}squeakDeckCard${card.suit}${card.value}`}
                            style={{
                              zIndex:
                                cardIdx ===
                                  gameData.players[playerID]!.squeakDeck
                                    .length -
                                    1 &&
                                squeakDeckBeingMovedProgramatically[playerID] &&
                                !cardBeingMovedProgramatically[playerID]
                                  ? 150
                                  : 90,
                            }}
                            className="absolute left-0 top-0 h-full w-full select-none"
                          >
                            <Card
                              value={card.value}
                              suit={card.suit}
                              showCardBack={true} // this would need to be changed halfway through card flip
                              draggable={false}
                              ownerID={playerID}
                              hueRotation={
                                playerMetadata[playerID]?.deckHueRotation || 0
                              }
                              startID={`${playerID}squeakDeck`}
                              origin={"squeakDeck"}
                              rotation={rotationOrder[idx] as number}
                            />
                          </div>
                        ),
                      )}
                    </div>
                  )}

                  {gameData.players[playerID]!.squeakDeck.length === 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: `${
                          topOffsetsFromBoard[idx]
                            ? -topOffsetsFromBoard[idx]!
                            : 0
                        }px`,
                        left: viewportLabel === "tablet" ? 25 : 0,
                        width: viewportLabel === "tablet" ? "75px" : "auto",
                        height: viewportLabel === "tablet" ? "50px" : "auto",
                      }}
                    >
                      <Buzzer
                        playerID={playerID}
                        roomCode={roomConfig.code}
                        interactive={false}
                      />
                    </div>
                  )}
                </div>

                <div
                  id={`${playerID}hand`}
                  style={{
                    zIndex:
                      cardBeingMovedProgramatically[playerID] === true
                        ? 150
                        : 100,
                  }}
                  className={`absolute left-0 top-0 h-full w-full select-none`}
                >
                  {gameData.players[playerID]?.hand.map(
                    (card) =>
                      card !== null && (
                        <div
                          key={`${playerID}handCard${card.suit}${card.value}`}
                          className="absolute left-0 top-0 select-none"
                        >
                          <Card
                            value={card.value}
                            suit={card.suit}
                            draggable={false}
                            origin={"hand"}
                            ownerID={playerID}
                            hueRotation={
                              playerMetadata[playerID]?.deckHueRotation || 0
                            }
                            startID={`${playerID}hand`}
                            rotation={rotationOrder[idx] as number}
                          />
                        </div>
                      ),
                  )}
                </div>

                <div className={`${classes.playerDeck} select-none`}>
                  <div id={`${playerID}deck`} className="h-full w-full">
                    {gameData?.players[playerID]?.deck.length ? (
                      <div className="relative h-full w-full select-none">
                        {gameData?.players[playerID]?.deck.map((card) => (
                          <div
                            key={`${playerID}deckCard${card.suit}${card.value}`}
                            className="absolute left-0 top-0 h-full w-full select-none"
                          >
                            <Card
                              value={card.value}
                              suit={card.suit}
                              showCardBack={true} // separate state inside overrides this halfway through flip
                              draggable={false}
                              ownerID={playerID}
                              hueRotation={
                                playerMetadata[playerID]?.deckHueRotation || 0
                              }
                              origin={"deck"}
                              startID={`${playerID}deck`}
                              rotation={rotationOrder[idx] as number}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid select-none grid-cols-1 items-center justify-items-center">
                        <div className="col-start-1 row-start-1">
                          <FaRedoAlt size={"1.5rem"} />
                        </div>
                        <div className="col-start-1 row-start-1 select-none opacity-25">
                          <Card
                            showCardBack={true}
                            draggable={false}
                            ownerID={playerID}
                            hueRotation={
                              playerMetadata[playerID]?.deckHueRotation || 0
                            }
                            startID={`${playerID}deck`}
                            rotation={rotationOrder[idx] as number}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {otherPlayerIDs.map((playerID, idx) => (
        <div
          key={playerID}
          className={`${orderedClassNames[idx]} select-none rounded-md bg-gradient-to-br from-green-800 to-green-850`}
        >
          <div
            id={`${playerID}container`}
            style={{
              opacity: gameData.playerIDsThatLeftMidgame.includes(playerID)
                ? 0.25
                : 1,
            }}
            className={`${internalOrderedGridClassNames[idx]} relative select-none`}
          >
            {gameData.players[playerID]?.squeakHand.map(
              (cards, squeakStackIdx) => (
                <div
                  key={`${playerID}squeakStack${squeakStackIdx}`}
                  // @ts-expect-error asdf
                  className={`${cardClassMap[squeakStackIdx]} relative h-full w-full select-none`}
                >
                  <div
                    id={`${playerID}squeakHand${squeakStackIdx}`}
                    style={{
                      height:
                        cards.length === 0 || cards.length === 1
                          ? `${cardDimensions.height}px`
                          : `${
                              (cards.length - 1) * (20 - cards.length) +
                              cardDimensions.height
                            }px`,
                    }}
                    className="absolute h-full w-full select-none"
                  >
                    {cards.map((card, cardIdx) => (
                      <div
                        key={`${playerID}squeakCard${card.suit}${card.value}`}
                        id={`${playerID}squeakStack${squeakStackIdx}${cardIdx}`}
                        style={{
                          top: getDynamicTopValue(
                            squeakStackIdx,
                            cards.length,
                            cardIdx,
                            playerID,
                          ),
                          transition: "top 0.25s ease-in-out",
                        }}
                        className={"cardDimensions absolute left-0 select-none"}
                      >
                        <Card
                          value={card.value}
                          suit={card.suit}
                          draggable={false}
                          origin={"squeakHand"}
                          squeakStackLocation={[squeakStackIdx, cardIdx]}
                          ownerID={playerID}
                          hueRotation={
                            playerMetadata[playerID]?.deckHueRotation || 0
                          }
                          startID={`${playerID}squeakStack${squeakStackIdx}${cardIdx}`}
                          rotation={rotationOrder[idx] as number}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ),
            )}

            <div
              id={`${playerID}squeakDeck`}
              className={`${classes.squeakDeck} baseFlex h-full w-full select-none`}
            >
              {gameData.players[playerID]!.squeakDeck.length > 0 && (
                <div className="relative h-full w-full">
                  {gameData.players[playerID]?.squeakDeck.map(
                    (card, cardIdx) => (
                      <div
                        key={`${playerID}squeakDeckCard${card.suit}${card.value}`}
                        style={{
                          zIndex:
                            cardIdx ===
                              gameData.players[playerID]!.squeakDeck.length -
                                1 &&
                            squeakDeckBeingMovedProgramatically[playerID] &&
                            !cardBeingMovedProgramatically[playerID]
                              ? 150
                              : 90,
                        }}
                        className="absolute left-0 top-0 h-full w-full select-none"
                      >
                        <Card
                          value={card.value}
                          suit={card.suit}
                          showCardBack={true} // this would need to be changed halfway through card flip
                          draggable={false}
                          ownerID={playerID}
                          hueRotation={
                            playerMetadata[playerID]?.deckHueRotation || 0
                          }
                          startID={`${playerID}squeakDeck`}
                          origin={"squeakDeck"}
                          rotation={rotationOrder[idx] as number}
                        />
                      </div>
                    ),
                  )}
                </div>
              )}

              <AnimatePresence mode={"popLayout"}>
                {gameData.players[playerID]!.squeakDeck.length === 0 && (
                  <Buzzer
                    playerID={playerID}
                    roomCode={roomConfig.code}
                    interactive={false}
                  />
                )}
              </AnimatePresence>
            </div>

            <div
              id={`${playerID}hand`}
              style={{
                zIndex:
                  cardBeingMovedProgramatically[playerID] === true ? 150 : 100,
              }}
              className={`${classes.playerHand} cardDimensions relative select-none`}
            >
              <>
                {gameData.players[playerID]?.hand.map(
                  (card) =>
                    card !== null && (
                      <div
                        key={`${playerID}handCard${card.suit}${card.value}`}
                        className="absolute left-0 top-0 select-none"
                      >
                        <Card
                          value={card.value}
                          suit={card.suit}
                          draggable={false}
                          origin={"hand"}
                          ownerID={playerID}
                          hueRotation={
                            playerMetadata[playerID]?.deckHueRotation || 0
                          }
                          startID={`${playerID}hand`}
                          rotation={rotationOrder[idx] as number}
                        />
                      </div>
                    ),
                )}
              </>
            </div>

            <div className={`${classes.playerDeck} cardDimensions select-none`}>
              <div id={`${playerID}deck`} className="h-full w-full">
                {gameData?.players[playerID]?.deck.length ? (
                  <div className="relative h-full w-full select-none">
                    <>
                      <div
                        onAnimationEnd={() => setDecksAreBeingRotated(false)}
                        className={`${
                          decksAreBeingRotated ? "topBackFacingCardInDeck" : ""
                        } select-none" absolute left-0 top-0 h-full w-full`}
                      >
                        {gameData?.players[playerID]?.deck.map((card) => (
                          <div
                            key={`${playerID}deckCard${card.suit}${card.value}`}
                            className="absolute left-0 top-0 h-full w-full select-none"
                          >
                            <Card
                              value={card.value}
                              suit={card.suit}
                              showCardBack={true} // separate state inside overrides this halfway through flip
                              draggable={false}
                              ownerID={playerID}
                              hueRotation={
                                playerMetadata[playerID]?.deckHueRotation || 0
                              }
                              origin={"deck"}
                              startID={`${playerID}deck`}
                              rotation={rotationOrder[idx] as number}
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
                            playerMetadata[playerID]?.deckHueRotation || 0
                          }
                          origin={"deck"}
                          rotation={0}
                        />
                      </div>
                    </>
                  </div>
                ) : (
                  <div className="grid select-none grid-cols-1 items-center justify-items-center">
                    <div className="col-start-1 row-start-1">
                      <FaRedoAlt size={"1.5rem"} />
                    </div>
                    <div className="col-start-1 row-start-1 select-none opacity-25">
                      <Card
                        showCardBack={true}
                        draggable={false}
                        ownerID={playerID}
                        hueRotation={
                          playerMetadata[playerID]?.deckHueRotation || 0
                        }
                        startID={`${playerID}deck`}
                        rotation={rotationOrder[idx] as number}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {gameData.playerIDsThatLeftMidgame.includes(playerID) && (
            <DisconnectIcon className="absolute left-1/2 top-1/2 size-14 -translate-x-1/2 -translate-y-1/2" />
          )}
        </div>
      ))}
    </>
  );
}

export default OtherPlayersCardContainers;
