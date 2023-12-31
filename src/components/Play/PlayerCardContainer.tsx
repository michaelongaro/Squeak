import { useState, useEffect, useRef } from "react";
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
    currentVolume,
    gameData,
    holdingASqueakCard,
    hoveredSqueakStack,
    holdingADeckCard,
    proposedCardBoxShadow,
    decksAreBeingRotated,
    soundPlayStates,
    setSoundPlayStates,
    originIndexForHeldSqueakCard,
    setHoldingADeckCard,
    cardBeingMovedProgramatically,
    squeakDeckBeingMovedProgramatically,
    setOriginIndexForHeldSqueakCard,
    setHoldingASqueakCard,
    setHoveredSqueakStack,
    currentPlayerSqueakStackBeingDragged,
    setCurrentPlayerSqueakStackBeingDragged,
  } = useRoomContext();

  const [hoveringOverDeck, setHoveringOverDeck] = useState(false);

  const [drawingFromDeck, setDrawingFromDeck] = useState(false);

  useTrackHoverOverSqueakStacks();
  useRotatePlayerDecks();

  const cardDimensions = useResponsiveCardDimensions();

  const audioRef = useRef<HTMLAudioElement>(null);

  function dynamicTopValue(
    squeakStackIdx: number,
    squeakStackLength: number,
    cardIdx: number
  ) {
    // ah damn maybe need edge case to not even bother with dynamically changing if the combined total of the
    // squeak stack being moved and the squeak stack being hovered over is greater than 12 since it's not possible?

    let lengthOfSqueakStackBeingDragged = 0;
    if (currentPlayerSqueakStackBeingDragged !== null) {
      lengthOfSqueakStackBeingDragged =
        currentPlayerSqueakStackBeingDragged.length;
    }

    // 0 1 2 3
    // stack being dragged

    // special handling for squeak stack being dragged
    if (
      holdingASqueakCard &&
      squeakStackIdx === currentPlayerSqueakStackBeingDragged!.squeakStackIdx &&
      cardIdx >= currentPlayerSqueakStackBeingDragged!.startingDepth
    ) {
      if (
        hoveredSqueakStack !== null &&
        originIndexForHeldSqueakCard !== hoveredSqueakStack
      ) {
        const hoveredSqueakStackLength =
          gameData.players[userID]!.squeakHand[hoveredSqueakStack]!.length;

        squeakStackLength =
          hoveredSqueakStackLength + lengthOfSqueakStackBeingDragged;
      }
    }

    // otherwise, part of regular squeak stacks
    else {
      if (hoveredSqueakStack !== null) {
        if (holdingASqueakCard) {
          // narrowing down to correct squeak stack
          if (originIndexForHeldSqueakCard === squeakStackIdx) {
            if (squeakStackIdx !== hoveredSqueakStack) {
              squeakStackLength -= lengthOfSqueakStackBeingDragged;
            }
          } else if (hoveredSqueakStack === squeakStackIdx) {
            squeakStackLength += lengthOfSqueakStackBeingDragged;
          }
        } else if (holdingADeckCard && squeakStackIdx === hoveredSqueakStack) {
          squeakStackLength++;
        }
      } else {
        // not hovering over any squeak stack but still grabbing a squeak stack
        if (holdingASqueakCard) {
          if (originIndexForHeldSqueakCard === squeakStackIdx) {
            squeakStackLength -= lengthOfSqueakStackBeingDragged;
          }
        }
      }
    }

    return `${(20 - squeakStackLength) * cardIdx}px`;
  }

  useEffect(() => {
    if (soundPlayStates.currentPlayer && audioRef.current) {
      audioRef.current.volume = currentVolume * 0.01;
      // restarting audio from beginning if it's already playing
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setSoundPlayStates({ ...soundPlayStates, currentPlayer: false });
    }
  }, [soundPlayStates, currentVolume, setSoundPlayStates]);

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
    <div className={`${cardContainerClass}`}>
      <audio ref={audioRef} src="/sounds/firstSuccessfulMove.wav" />
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
                            ? 501
                            : "auto",
                        top: dynamicTopValue(
                          squeakStackIdx,
                          cards.length,
                          cardIdx
                        ),
                        transition: "top 0.25s ease-in-out",
                      }}
                      className={`absolute left-0 h-[64px] w-[48px] select-none tall:h-[87px] tall:w-[67px]`}
                      onMouseDown={() => {
                        setOriginIndexForHeldSqueakCard(squeakStackIdx);
                        setHoldingASqueakCard(true);
                        setCurrentPlayerSqueakStackBeingDragged({
                          squeakStackIdx,
                          startingDepth: cardIdx,
                          length: cards.length - cardIdx,
                        });
                        setHoveredSqueakStack(null);
                      }}
                      onMouseUp={() => {
                        setHoldingASqueakCard(false);
                        setCurrentPlayerSqueakStackBeingDragged(null);
                        // ^^ kinda don't want to immediately do this, since if it is a valid move
                        // then it will just move back whenever server response comes in resulting in jerky motion
                        // maybe do it after a cardDropDenied or cardDropAccepted?
                        setOriginIndexForHeldSqueakCard(null);
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
            className={`${classes.squeakDeck} baseFlex z-[500] h-full w-full select-none`}
          >
            {gameData.players[userID]!.squeakDeck.length > 0 && (
              <div className="relative h-full w-full">
                {gameData.players[userID]?.squeakDeck.map((card, cardIdx) => (
                  <div
                    key={`${userID}squeakDeckCard${card.suit}${card.value}`}
                    style={{
                      zIndex:
                        cardIdx === 0 &&
                        squeakDeckBeingMovedProgramatically[userID] &&
                        !holdingADeckCard &&
                        !holdingASqueakCard &&
                        !cardBeingMovedProgramatically[userID]
                          ? 502
                          : 499,
                      transition: "top 0.25s ease-in-out",
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
              zIndex:
                cardBeingMovedProgramatically[userID] === true ||
                holdingADeckCard
                  ? 501
                  : 499,
            }}
            className={`${classes.playerHand} relative h-[64px] w-[48px] select-none tall:h-[87px] tall:w-[67px]`}
          >
            <>
              {gameData.players[userID]?.topCardsInDeck.map(
                (card, idx) =>
                  card !== null && (
                    <div
                      key={`${userID}handCard${card.suit}${card.value}`}
                      className="absolute left-0 top-0 select-none"
                      onMouseEnter={() => {
                        setHoveringOverDeck(false);
                      }}
                      onMouseDown={() => {
                        if (
                          idx ===
                          gameData.players[userID]!.topCardsInDeck.length - 1
                        )
                          setHoldingADeckCard(true);
                      }}
                      onMouseUp={() => {
                        setHoldingADeckCard(false);
                        setHoveredSqueakStack(null);
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

          <div
            className={`${classes.playerDeck} z-[500] h-[64px] w-[48px] select-none tall:h-[87px] tall:w-[67px]`}
          >
            <div
              id={`${userID}deck`}
              style={{
                boxShadow:
                  hoveringOverDeck && !holdingADeckCard && !drawingFromDeck
                    ? "0px 0px 4px 3px rgba(184,184,184,1)"
                    : "none",
                cursor: drawingFromDeck ? "auto" : "pointer",
              }}
              className="h-full w-full select-none rounded-[0.1rem] transition-shadow"
              onMouseEnter={() => {
                setHoveringOverDeck(true);
              }}
              onMouseLeave={() => {
                setHoveringOverDeck(false);
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
                        style={{
                          zIndex:
                            gameData.players[userID]?.nextTopCardInDeck
                              ?.suit === card.suit &&
                            gameData.players[userID]?.nextTopCardInDeck
                              ?.value === card.value &&
                            !holdingADeckCard
                              ? 500
                              : 499,
                          transition: "top 0.25s ease-in-out",
                        }}
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

          <AnimatePresence mode={"wait"}>
            {decksAreBeingRotated && (
              <motion.div
                key={"decksAreBeingRotatedTooltip"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  color: "hsl(120deg 100% 86%)",
                  borderColor: "hsl(120deg 100% 86%)",
                }}
                className="baseVertFlex absolute bottom-4 left-[-22rem] gap-2 rounded-sm border-2 bg-green-800 p-2"
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
                    20) *
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
