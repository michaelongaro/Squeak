import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import useResponsiveCardDimensions from "../../hooks/useResponsiveCardDimensions";
import Card from "./Card";
import PlayerIcon from "../playerIcons/PlayerIcon";
import { FaRedoAlt } from "react-icons/fa";
import classes from "./OtherPlayersCardContainers.module.css";

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
  const { gameData, playerMetadata, playerIDWhoSqueaked } = useRoomContext();
  const { value: userID } = useUserIDContext();

  const cardDimensions = useResponsiveCardDimensions();

  return (
    <>
      {Object.keys(gameData.players)
        .filter((playerID) => playerID !== userID)
        .map((playerID, idx) => (
          <div key={playerID} className={orderedClassNames[idx]}>
            <div className={internalOrderedGridClassNames[idx]}>
              <div
                id={`${playerID}squeakDeck`}
                className={`${classes.squeakDeck} h-[64px] w-[48px] tall:h-[87px] tall:w-[67px]`}
              >
                {gameData.players[playerID]!.squeakDeck.length > 0 ? (
                  <div className="relative h-full w-full">
                    <div className="absolute top-0 left-0 h-full w-full">
                      <Card
                        showCardBack={true}
                        draggable={false}
                        ownerID={playerID}
                        startID={`${playerID}squeakDeck`}
                        rotation={rotationOrder[idx] as number}
                      />
                    </div>
                    <div className="absolute top-0 left-0 h-full w-full">
                      <Card
                        value={gameData.players[playerID]?.squeakDeck[0]!.value}
                        suit={gameData.players[playerID]?.squeakDeck[0]!.suit}
                        showCardBack={true} // this would need to be changed halfway through card flip
                        draggable={false}
                        ownerID={playerID}
                        startID={`${playerID}squeakDeck`}
                        rotation={rotationOrder[idx] as number}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    style={{
                      boxShadow:
                        playerIDWhoSqueaked === playerID
                          ? "0px 0px 20px 5px rgba(184,184,184,1)"
                          : "none",
                      transition: "box-shadow 0.85s ease-in-out",
                    }}
                    className="bg-green-300 p-4 transition-colors hover:bg-green-200"
                    disabled={true}
                  >
                    Squeak!
                  </button>
                )}
              </div>

              {gameData.players[playerID]?.squeakHand.map((cards, cardsIdx) => (
                <div
                  key={`${playerID}squeakStack${cardsIdx}`}
                  // @ts-expect-error asdf
                  className={`${cardClassMap[cardsIdx]} relative h-[64px] w-[48px] tall:h-[87px] tall:w-[67px]`}
                >
                  <div
                    id={`${playerID}squeakHand${cardsIdx}`}
                    style={{
                      height:
                        cards.length === 1
                          ? cardDimensions.height
                          : `${
                              cards.length * (15 - cardsIdx) +
                              cardDimensions.height
                            }px`,
                    }}
                    className="absolute h-full w-full"
                  >
                    {cards.map((card, cardIdx) => (
                      <div
                        key={`${playerID}card${cardIdx}`} //${card.suit}${card.value}
                        id={`${playerID}squeakStack${cardsIdx}${cardIdx}`}
                        className={`absolute left-0 h-full w-full`}
                        style={{
                          top: `${(15 - cards.length) * cardIdx}px`,
                        }}
                      >
                        <Card
                          value={card.value}
                          suit={card.suit}
                          draggable={false}
                          origin={"squeak"}
                          ownerID={playerID}
                          startID={`${playerID}squeakStack${cardsIdx}${cardIdx}`}
                          rotation={rotationOrder[idx] as number}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div
                className={`${classes.playerDeck} z-[500] h-[64px] w-[48px] tall:h-[87px] tall:w-[67px]`}
              >
                <div id={`${playerID}deck`} className="h-full w-full">
                  {gameData?.players[playerID]?.nextTopCardInDeck ? (
                    <div className="relative h-full w-full">
                      <div className="absolute top-0 left-0 h-full w-full">
                        <Card
                          showCardBack={true}
                          draggable={false}
                          ownerID={playerID}
                          startID={`${playerID}deck`}
                          rotation={rotationOrder[idx] as number}
                        />
                      </div>
                      <div className="topBackFacingCardInDeck absolute top-0 left-0 h-full w-full">
                        <Card
                          value={
                            gameData?.players[playerID]?.nextTopCardInDeck
                              ?.value
                          }
                          suit={
                            gameData?.players[playerID]?.nextTopCardInDeck?.suit
                          }
                          showCardBack={true} // separate state inside overrides this halfway through flip
                          draggable={false}
                          ownerID={playerID}
                          startID={`${playerID}deck`}
                          rotation={rotationOrder[idx] as number}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 items-center justify-items-center">
                      <div className="col-start-1 row-start-1">
                        <FaRedoAlt size={"1.5rem"} />
                      </div>
                      <div className="col-start-1 row-start-1 opacity-25">
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

              <div
                id={`${playerID}hand`}
                className={`${classes.playerHand} relative z-[20] h-[64px] w-[48px] select-none tall:h-[87px] tall:w-[67px]`}
              >
                <>
                  {gameData.players[playerID]?.topCardsInDeck.map(
                    (card, topCardsIdx) =>
                      card !== null && ( // necessary?
                        <div
                          key={`${playerID}card${card?.suit}${card?.value}`}
                          className="absolute top-0 left-0"
                          style={{
                            top: `${-1 * (topCardsIdx * 2)}px`,
                          }}
                        >
                          <Card
                            value={card?.value}
                            suit={card?.suit}
                            draggable={true}
                            origin={"deck"}
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
                style={{
                  right: document.getElementById(`${playerID}icon`)
                    ? (document
                        .getElementById(`${playerID}icon`)!
                        .getBoundingClientRect().width +
                        15) *
                      -1
                    : 50,
                }}
                id={`${playerID}icon`}
                className={`${classes.playerAvatar} !items-end`}
              >
                <PlayerIcon
                  avatarPath={
                    playerMetadata[playerID]?.avatarPath ||
                    "/avatars/rabbit.svg"
                  }
                  borderColor={
                    playerMetadata[playerID]?.color || "hsl(352deg, 69%, 61%)"
                  }
                  username={playerMetadata[playerID]?.username}
                  size={"3rem"}
                />
              </div>
            </div>
          </div>
        ))}
    </>
  );
}

export default OtherPlayersCardContainers;
