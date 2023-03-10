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
import { type ICard } from "../../utils/generateDeckAndSqueakCards";
import { AnimatePresence } from "framer-motion";

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
  const {
    roomConfig,
    gameData,
    decksAreBeingRotated,
    soundPlayStates,
    cardBeingMovedProgramatically,
    squeakDeckBeingMovedProgramatically,
    setSoundPlayStates,
    currentVolume,
  } = useRoomContext();
  const { value: userID } = useUserIDContext();

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

  const reverseSqueakDeck = (array: ICard[] | undefined) => {
    if (!array) return [];

    return array.reverse();
  };

  function filteredCardsInHandFromDeck(
    array: ICard[] | undefined,
    playerID: string | undefined
  ) {
    if (!playerID) return;

    const deckIdx = gameData.players[playerID]?.deckIdx;
    const cardsInHand = gameData.players[playerID]?.topCardsInDeck.filter(
      (card) => card !== null
    );
    if (!array || !deckIdx || !cardsInHand) return [];

    const filteredArray = array.filter(
      (card) =>
        !cardsInHand.some(
          (cardInHand) =>
            cardInHand?.suit === card.suit && cardInHand?.value === card.value
        )
    );

    return filteredArray;
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
            {gameData.players[playerID]?.squeakHand.map((cards, cardsIdx) => (
              <div
                key={`${playerID}squeakStack${cardsIdx}`}
                // @ts-expect-error asdf
                className={`${cardClassMap[cardsIdx]} relative h-full w-full select-none`}
              >
                <div
                  id={`${playerID}squeakHand${cardsIdx}`}
                  style={{
                    height:
                      cards.length === 0 || cards.length === 1
                        ? `${cardDimensions.height}px`
                        : `${
                            (cards.length - 1) * (20 - cardsIdx) +
                            cardDimensions.height
                          }px`,
                  }}
                  className="absolute h-full w-full select-none"
                >
                  {cards.map((card, cardIdx) => (
                    <div
                      key={`${playerID}squeakCard${card.suit}${card.value}`}
                      id={`${playerID}squeakStack${cardsIdx}${cardIdx}`}
                      className={`absolute left-0 h-[64px] w-[48px] select-none tall:h-[87px] tall:w-[67px]`}
                      style={{
                        top: `${(20 - cards.length) * cardIdx}px`,
                      }}
                    >
                      <Card
                        value={card.value}
                        suit={card.suit}
                        draggable={false}
                        origin={"squeak"}
                        ownerID={playerID}
                        startID={`${playerID}squeakStack${cardsIdx}${cardIdx}`}
                        // implement this functionality in a refactor later
                        // squeakStackLocation={[cardsIdx, cardIdx]}
                        // offsetSqueakStackHeight={
                        //   cardIdx === 0 ? 0 : (20 - cards.length) * cardIdx
                        // }
                        rotation={rotationOrder[idx] as number}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div
              id={`${playerID}squeakDeck`}
              className={`${classes.squeakDeck} baseFlex z-[500] h-full w-full select-none`}
            >
              {gameData.players[playerID]!.squeakDeck.length > 0 && (
                <div className="relative h-full w-full">
                  {showDummyDeckCardStates?.[playerID]?.[2] && (
                    <div className="absolute top-[2px] left-0 h-full w-full select-none">
                      <Card
                        showCardBack={true}
                        draggable={false}
                        ownerID={playerID}
                        startID={`${playerID}squeakDeck`}
                        rotation={rotationOrder[idx] as number}
                      />
                    </div>
                  )}

                  {showDummyDeckCardStates?.[playerID]?.[3] && (
                    <div className="absolute top-[1px] left-0 h-full w-full select-none">
                      <Card
                        showCardBack={true}
                        draggable={false}
                        ownerID={playerID}
                        startID={`${playerID}squeakDeck`}
                        rotation={rotationOrder[idx] as number}
                      />
                    </div>
                  )}

                  {reverseSqueakDeck(
                    gameData.players[playerID]?.squeakDeck
                  ).map((card, cardIdx) => (
                    <div
                      key={`${playerID}squeakDeckCard${card.suit}${card.value}`}
                      style={{
                        zIndex:
                          cardBeingMovedProgramatically[playerID] &&
                          !squeakDeckBeingMovedProgramatically[playerID]
                            ? 500
                            : 501,
                      }}
                      className="absolute top-0 left-0 h-full w-full select-none"
                    >
                      <Card
                        value={card.value}
                        suit={card.suit}
                        showCardBack={true} // this would need to be changed halfway through card flip
                        draggable={false}
                        ownerID={playerID}
                        startID={`${playerID}squeakDeck`}
                        rotation={rotationOrder[idx] as number}
                      />
                    </div>
                  ))}
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
                        className="absolute top-0 left-0 select-none"
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
                      <div className="absolute top-[2px] left-0 h-full w-full select-none">
                        <Card
                          showCardBack={true}
                          draggable={false}
                          ownerID={playerID}
                          startID={`${playerID}deck`}
                          rotation={rotationOrder[idx] as number}
                        />
                      </div>
                    )}

                    {showDummyDeckCardStates?.[playerID]?.[1] && (
                      <div className="absolute top-[1px] left-0 h-full w-full select-none">
                        <Card
                          showCardBack={true}
                          draggable={false}
                          ownerID={playerID}
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
                      className="topBackFacingCardInDeck absolute top-0 left-0 h-full w-full select-none"
                    >
                      {filteredCardsInHandFromDeck(
                        gameData.players[playerID]?.deck,
                        playerID
                      )?.map((card, cardIdx) => (
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
                          className="absolute top-0 left-0 h-full w-full select-none"
                        >
                          <Card
                            value={card.value}
                            suit={card.suit}
                            showCardBack={true} // separate state inside overrides this halfway through flip
                            draggable={false}
                            ownerID={playerID}
                            origin={"deck"}
                            startID={`${playerID}deck`}
                            rotation={rotationOrder[idx] as number}
                          />
                        </div>
                      ))}
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
