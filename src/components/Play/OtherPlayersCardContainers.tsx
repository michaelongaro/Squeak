import { useState, useEffect, useRef } from "react";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import useResponsiveCardDimensions from "../../hooks/useResponsiveCardDimensions";
import Card from "./Card";
import { FaRedoAlt } from "react-icons/fa";
import isEqual from "lodash.isequal";
import classes from "./OtherPlayersCardContainers.module.css";
import useRotatePlayerDecks from "../../hooks/useRotatePlayerDecks";
import Buzzer from "./Buzzer";
import Image from "next/image";
import disconnectIcon from "../../../public/disconnect/disconnect.svg";
import { AnimatePresence } from "framer-motion";
import useFilterCardsInHandFromDeck from "../../hooks/useFilterCardsInHandFromDeck";

interface IOtherPlayersCardContainers {
  orderedClassNames: (string | undefined)[];
}

const internalOrderedGridClassNames = [
  classes.topInnerGridContainer,
  classes.leftInnerGridContainer,
  classes.rightInnerGridContainer,
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
  const userID = useUserIDContext();

  const {
    currentVolume,
    playerMetadata,
    gameData,
    decksAreBeingRotated,
    squeakDeckBeingMovedProgramatically,
    setSoundPlayStates,
    soundPlayStates,
    cardBeingMovedProgramatically,
    roomConfig,
    otherPlayerSqueakStacksBeingDragged,
    setOtherPlayerSqueakStacksBeingDragged,
  } = useRoomContext();

  const otherPlayerIDs = Object.keys(gameData.players).filter(
    (playerID) => playerID !== userID
  );

  const [showDummyDeckCardStates, setShowDummyDeckCardStates] = useState<{
    [playerID: string]: [boolean, boolean, boolean, boolean];
  }>();

  useEffect(() => {
    let tempDummyDeckCardStates = { ...showDummyDeckCardStates };

    for (const playerID of otherPlayerIDs) {
      const player = gameData.players[playerID];

      if (!player) return;

      if (player.squeakHand.length > 0) {
        tempDummyDeckCardStates = {
          ...tempDummyDeckCardStates,
          [playerID]: [
            player.deck.length - player.deckIdx >= 2,
            player.deck.length - player.deckIdx >= 1,
            player.squeakDeck.length > 2,
            player.squeakDeck.length > 1,
          ],
        };
      }
    }

    if (!isEqual(tempDummyDeckCardStates, showDummyDeckCardStates)) {
      setShowDummyDeckCardStates(tempDummyDeckCardStates);
    }
  }, [gameData.players, otherPlayerIDs, showDummyDeckCardStates]);

  const audioRef0 = useRef<HTMLAudioElement>(null);
  const audioRef1 = useRef<HTMLAudioElement>(null);
  const audioRef2 = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (Object.values(soundPlayStates.otherPlayers).includes(true)) {
      const audioRefs = [audioRef0, audioRef1, audioRef2];

      for (const index in otherPlayerIDs) {
        if (soundPlayStates.otherPlayers[otherPlayerIDs[index]!]) {
          audioRefs[index]!.current!.volume = currentVolume * 0.01;
          // restarting audio from beginning if it's already playing
          audioRefs[index]!.current!.pause();
          audioRefs[index]!.current!.currentTime = 0;
          audioRefs[index]!.current!.play();

          setSoundPlayStates({
            ...soundPlayStates,
            otherPlayers: {
              ...soundPlayStates.otherPlayers,
              [otherPlayerIDs[index]!]: false,
            },
          });
        }
      }
    }
  }, [soundPlayStates, currentVolume, otherPlayerIDs, setSoundPlayStates]);

  const cardDimensions = useResponsiveCardDimensions();
  useRotatePlayerDecks();

  // necessary to prevent card in hand + card in .mapped deck from both being
  // moved at the same time.
  const filteredCardsInHandFromDeck = [
    useFilterCardsInHandFromDeck({
      array: gameData.players[otherPlayerIDs[0]!]?.deck,
      playerID: otherPlayerIDs[0],
    }),
    useFilterCardsInHandFromDeck({
      array: gameData.players[otherPlayerIDs[1]!]?.deck,
      playerID: otherPlayerIDs[1],
    }),
    useFilterCardsInHandFromDeck({
      array: gameData.players[otherPlayerIDs[2]!]?.deck,
      playerID: otherPlayerIDs[2],
    }),
  ];

  function dynamicTopValue(
    squeakStackIdx: number,
    squeakStackLength: number,
    cardIdx: number,
    playerID: string
  ) {
    const draggedData = otherPlayerSqueakStacksBeingDragged[playerID];

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

  return (
    <>
      <audio ref={audioRef0} src="/sounds/otherPlayerCardMove.wav" />
      <audio ref={audioRef1} src="/sounds/otherPlayerCardMove.wav" />
      <audio ref={audioRef2} src="/sounds/otherPlayerCardMove.wav" />

      {otherPlayerIDs.map((playerID, idx) => (
        <div
          key={playerID}
          className={`${orderedClassNames[idx]} relative select-none`}
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
                          top: dynamicTopValue(
                            squeakStackIdx,
                            cards.length,
                            cardIdx,
                            playerID
                          ),
                          transition: "top 0.25s ease-in-out",
                        }}
                        className={`absolute left-0 h-[64px] w-[48px] select-none tall:h-[87px] tall:w-[67px]`}
                      >
                        <Card
                          value={card.value}
                          suit={card.suit}
                          draggable={false}
                          origin={"squeakHand"}
                          ownerID={playerID}
                          hueRotation={
                            playerMetadata[playerID]?.deckHueRotation || 0
                          }
                          startID={`${playerID}squeakStack${squeakStackIdx}${cardIdx}`}
                          // implement this functionality in a refactor later
                          // squeakStackLocation={[squeakStackIdx, cardIdx]}
                          // offsetSqueakStackHeight={
                          //   cardIdx === 0 ? 0 : (20 - cards.length) * cardIdx
                          // }
                          rotation={rotationOrder[idx] as number}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            <div
              id={`${playerID}squeakDeck`}
              className={`${classes.squeakDeck} baseFlex z-[500] h-full w-full select-none`}
            >
              {gameData.players[playerID]!.squeakDeck.length > 0 && (
                <div className="relative h-full w-full">
                  {showDummyDeckCardStates?.[playerID]?.[2] && (
                    <div className="absolute left-0 top-[2px] h-full w-full select-none">
                      <Card
                        showCardBack={true}
                        draggable={false}
                        ownerID={playerID}
                        hueRotation={
                          playerMetadata[playerID]?.deckHueRotation || 0
                        }
                        startID={`${playerID}squeakDeck`}
                        rotation={rotationOrder[idx] as number}
                      />
                    </div>
                  )}

                  {showDummyDeckCardStates?.[playerID]?.[3] && (
                    <div className="absolute left-0 top-[1px] h-full w-full select-none">
                      <Card
                        showCardBack={true}
                        draggable={false}
                        ownerID={playerID}
                        hueRotation={
                          playerMetadata[playerID]?.deckHueRotation || 0
                        }
                        startID={`${playerID}squeakDeck`}
                        rotation={rotationOrder[idx] as number}
                      />
                    </div>
                  )}

                  {gameData.players[playerID]?.squeakDeck.map(
                    (card, cardIdx) => (
                      <div
                        key={`${playerID}squeakDeckCard${card.suit}${card.value}`}
                        style={{
                          zIndex:
                            cardIdx === 0 &&
                            squeakDeckBeingMovedProgramatically[playerID] &&
                            !cardBeingMovedProgramatically[playerID]
                              ? 502
                              : 499,
                        }}
                        className="absolute left-0 top-0 h-full w-full select-none "
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
                    )
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
                  cardBeingMovedProgramatically[playerID] === true ? 501 : 499,
              }}
              className={`${classes.playerHand} relative h-[64px] w-[48px] select-none tall:h-[87px] tall:w-[67px]`}
            >
              <>
                {gameData.players[playerID]?.topCardsInDeck.map(
                  (card, topCardsIdx) =>
                    card !== null && (
                      <div
                        key={`${playerID}handCard${card.suit}${card.value}`}
                        className="absolute left-0 top-0 select-none"
                        style={{
                          top: `${-1 * (topCardsIdx * 2)}px`,
                        }}
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
                    )
                )}
              </>
            </div>

            <div
              className={`${classes.playerDeck} z-[500] h-[64px] w-[48px] select-none tall:h-[87px] tall:w-[67px]`}
            >
              <div id={`${playerID}deck`} className="h-full w-full">
                {gameData?.players[playerID]?.nextTopCardInDeck ? (
                  <div className="relative h-full w-full select-none">
                    {showDummyDeckCardStates?.[playerID]?.[0] && (
                      <div className="absolute left-0 top-[2px] h-full w-full select-none">
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
                    )}

                    {showDummyDeckCardStates?.[playerID]?.[1] && (
                      <div className="absolute left-0 top-[1px] h-full w-full select-none">
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
                    )}
                    <div
                      style={{
                        animationPlayState: decksAreBeingRotated
                          ? "running"
                          : "paused",
                      }}
                      className="topBackFacingCardInDeck absolute left-0 top-0 h-full w-full select-none"
                    >
                      {filteredCardsInHandFromDeck[idx]?.map(
                        (card, cardIdx) => (
                          <div
                            key={`${playerID}deckCard${card.suit}${card.value}`}
                            style={{
                              zIndex:
                                gameData.players[playerID]?.nextTopCardInDeck
                                  ?.suit === card.suit &&
                                gameData.players[playerID]?.nextTopCardInDeck
                                  ?.value === card.value
                                  ? 500
                                  : 499,
                            }}
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
                        )
                      )}
                    </div>
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
            <Image
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
              src={disconnectIcon}
              alt={"player has disconnected icon"}
              className="absolute z-[999] h-14 w-14"
            />
          )}
        </div>
      ))}
    </>
  );
}

export default OtherPlayersCardContainers;
