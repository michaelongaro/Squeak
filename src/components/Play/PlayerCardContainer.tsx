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
    proposedCardBoxShadow,
    decksAreBeingRotated,
    soundPlayStates,
    setSoundPlayStates,
    currentVolume,
    originIndexForHeldSqueakCard,
    setHoldingADeckCard,
    cardBeingMovedProgramatically,
    setOriginIndexForHeldSqueakCard,
    setHoldingASqueakCard,
    setHoveredSqueakStack,
  } = useRoomContext();
  const { mirrorPlayerContainer } = useRoomContext();
  const { value: userID } = useUserIDContext();

  const [hoveringOverDeck, setHoveringOverDeck] = useState(false);

  const [showFirstDummyCardBeneathDeck, setShowFirstDummyCardBeneathDeck] =
    useState(false);

  const [showSecondDummyCardBeneathDeck, setShowSecondDummyCardBeneathDeck] =
    useState(false);

  useTrackHoverOverSqueakStacks();
  useRotatePlayerDecks();

  const cardDimensions = useResponsiveCardDimensions();

  const [drawingFromDeckInProgress, setDrawingFromDeckInProgress] =
    useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement>(null);

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

  useEffect(() => {
    const player = gameData.players[userID];

    if (!player) return;

    setShowSecondDummyCardBeneathDeck(player.deck.length - player.deckIdx >= 2);
    setShowFirstDummyCardBeneathDeck(player.deck.length - player.deckIdx >= 1);
  }, [gameData.players, userID]);

  function getBoxShadowStyles({
    id,
    squeakStackIdx,
  }: IGetBoxShadowStyles): string {
    if (holdingADeckCard || holdingASqueakCard) {
      return `0px 0px 4px ${
        hoveredSqueakStack && hoveredSqueakStack === squeakStackIdx
          ? "4px"
          : "3px"
      } rgba(184,184,184,1)`;
    } else if (proposedCardBoxShadow?.id === id) {
      return proposedCardBoxShadow.boxShadowValue;
    }

    return "none";
  }

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
          <div
            id={`${userID}squeakDeck`}
            className={`${classes.squeakDeck} baseFlex h-full w-full select-none`}
          >
            {gameData.players[userID]!.squeakDeck.length > 0 ? (
              <div className="relative h-full w-full">
                {/* dummy cards to show "depth" of deck visually */}
                {gameData.players[userID]!.squeakDeck.length > 2 && (
                  <div className="absolute top-[2px] left-0 h-full w-full select-none">
                    <Card
                      showCardBack={true}
                      draggable={false}
                      ownerID={userID}
                      startID={`${userID}squeakDeck`}
                      rotation={0}
                    />
                  </div>
                )}

                {gameData.players[userID]!.squeakDeck.length > 1 && (
                  <div className="absolute top-[1px] left-0 h-full w-full select-none">
                    <Card
                      showCardBack={true}
                      draggable={false}
                      ownerID={userID}
                      startID={`${userID}squeakDeck`}
                      rotation={0}
                    />
                  </div>
                )}

                <div className="absolute top-0 left-0 h-full w-full select-none">
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
              <Buzzer
                playerID={userID}
                roomID={roomConfig.code}
                interactive={true}
              />
            )}
          </div>

          {gameData?.players[userID]?.squeakHand.map((cards, cardsIdx) => (
            <div
              key={`${userID}card${cardsIdx}`}
              // @ts-expect-error asdf
              className={`${cardClassMap[cardsIdx]} relative h-full w-full select-none`}
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
                      ? 0.35
                      : 1,
                  height:
                    cards.length === 0 || cards.length === 1
                      ? `${cardDimensions.height}px`
                      : `${
                          (cards.length - 1) * (20 - cardsIdx) +
                          cardDimensions.height
                        }px`,
                }}
                className="absolute w-full select-none rounded-lg transition-all"
              >
                {cards.map((card, cardIdx) => (
                  <div
                    key={`${userID}card${cardIdx}`}
                    id={`${userID}squeakStack${cardsIdx}${cardIdx}`}
                    style={{
                      zIndex:
                        originIndexForHeldSqueakCard === cardsIdx
                          ? 501
                          : "auto",
                      top: `${(20 - cards.length) * cardIdx}px`,
                    }}
                    className={`absolute left-0 h-[64px] w-[48px] select-none tall:h-[87px] tall:w-[67px]`}
                    onMouseDown={() => {
                      setOriginIndexForHeldSqueakCard(cardsIdx);
                      setHoldingASqueakCard(true);
                      setHoveredSqueakStack(null);
                    }}
                    onMouseUp={() => {
                      setHoldingASqueakCard(false);
                      setOriginIndexForHeldSqueakCard(null);
                    }}
                  >
                    <Card
                      value={card.value}
                      suit={card.suit}
                      draggable={true}
                      origin={"squeak"}
                      squeakStackLocation={[cardsIdx, cardIdx]}
                      // implement this functionality in a refactor later
                      // offsetSqueakStackHeight={
                      //   cardIdx === 0 ? 0 : (20 - cards.length) * cardIdx
                      // }
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
            className={`${classes.playerDeck} z-[500] h-[64px] w-[48px] select-none tall:h-[87px] tall:w-[67px]`}
          >
            <div
              id={`${userID}deck`}
              style={{
                boxShadow:
                  hoveringOverDeck &&
                  !holdingADeckCard &&
                  !drawingFromDeckInProgress
                    ? "0px 0px 4px 3px rgba(184,184,184,1)"
                    : "none",
                cursor: drawingFromDeckInProgress ? "auto" : "pointer",
              }}
              className="h-full w-full select-none transition-shadow"
              onMouseEnter={() => {
                setHoveringOverDeck(true);
              }}
              onMouseLeave={() => {
                setHoveringOverDeck(false);
              }}
              onClick={() => {
                if (drawingFromDeckInProgress) return;

                setDrawingFromDeckInProgress(true);
                setTimeout(() => {
                  setDrawingFromDeckInProgress(false);
                }, 270);
                socket.emit("playerDrawFromDeck", {
                  playerID: userID,
                  roomCode: roomConfig.code,
                });
              }}
            >
              {gameData?.players[userID]?.nextTopCardInDeck ? (
                <div className="relative h-full w-full select-none">
                  {/* dummy cards to show "depth" of deck visually */}
                  {showSecondDummyCardBeneathDeck && (
                    <div className="absolute top-[2px] left-0 h-full w-full select-none">
                      <Card
                        showCardBack={true}
                        draggable={false}
                        ownerID={userID}
                        startID={`${userID}deck`}
                        rotation={0}
                      />
                    </div>
                  )}

                  {showFirstDummyCardBeneathDeck && (
                    <div className="absolute top-[1px] left-0 h-full w-full select-none">
                      <Card
                        showCardBack={true}
                        draggable={false}
                        ownerID={userID}
                        startID={`${userID}deck`}
                        rotation={0}
                      />
                    </div>
                  )}

                  <div
                    style={{
                      animationPlayState: decksAreBeingRotated
                        ? "running"
                        : "paused",
                    }}
                    className="topBackFacingCardInDeck absolute top-0 left-0 h-full w-full select-none"
                  >
                    <Card
                      value={
                        gameData?.players[userID]?.nextTopCardInDeck?.value
                      }
                      suit={gameData?.players[userID]?.nextTopCardInDeck?.suit}
                      showCardBack={true} // separate state inside overrides this halfway through flip
                      draggable={false}
                      ownerID={userID}
                      origin={"deck"}
                      startID={`${userID}deck`}
                      rotation={0}
                    />
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
            style={{
              zIndex:
                cardBeingMovedProgramatically[userID] === true ||
                holdingADeckCard
                  ? 500
                  : 499,
            }}
            className={`${classes.playerHand} relative h-[64px] w-[48px] select-none tall:h-[87px] tall:w-[67px]`}
          >
            <>
              {gameData.players[userID]?.topCardsInDeck.map(
                (card, idx) =>
                  card !== null && ( // necessary?
                    <div
                      key={`${userID}card${card?.suit}${card?.value}`}
                      className="absolute top-0 left-0 select-none"
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
                        origin={"hand"}
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
