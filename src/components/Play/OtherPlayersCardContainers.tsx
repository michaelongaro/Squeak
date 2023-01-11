import { useState, useEffect } from "react";
import { useLocalStorageContext } from "../../context/LocalStorageContext";
import { useRoomContext } from "../../context/RoomContext";
import { type IPlayerCardMetadata } from "../../pages/api/socket";
import Card from "./Card";

interface IOtherPlayersCardContainers {
  orderedClassNames: (string | undefined)[];
}

import classes from "./OtherPlayersCardContainers.module.css";

const internalOrderedGridClassNames = [
  classes.topInnerGridContainer,
  classes.leftInnerGridContainer,
  classes.rightInnerGridContainer,
  // add more later
];

const cardClassMap = {
  0: classes.squeakHand0,
  1: classes.squeakHand1,
  2: classes.squeakHand2,
  3: classes.squeakHand3,
};

function OtherPlayersCardContainers({
  orderedClassNames,
}: IOtherPlayersCardContainers) {
  const roomCtx = useRoomContext();
  const localStorageID = useLocalStorageContext();

  const userID = localStorageID.value; // change to ctx.userID ?? localStorageID.value

  const [allPlayersExceptCurrentUser, setAllPlayersExceptCurrentUser] =
    useState<IPlayerCardMetadata[]>([]); // isn't this an array of IPlayerCardMetadata? aka
  // { playerID: string}

  // eventually add this listener

  // socket.on("cardDropApproved", (data) => {
  //   animate the card played from the player who played it to the board
  // });

  // import array of classnames

  useEffect(() => {
    if (roomCtx.gameData?.players) {
      const playersToInclude: IPlayerCardMetadata[] = [];
      for (const playerID of Object.keys(roomCtx.gameData.players)) {
        if (playerID !== userID) {
          // can add playerID to obj below if you need it
          // @ts-expect-error asdf
          playersToInclude.push(roomCtx.gameData.players[playerID]);
        }
      }
      setAllPlayersExceptCurrentUser(playersToInclude);
    }
  }, [roomCtx.gameData.players, userID]);

  return (
    <>
      {allPlayersExceptCurrentUser.map((player, idx) => (
        // I think probably a decent idea to add playerID to IPlayerCardMetadata right?
        <div
          key={idx} // change this key to playerID
          className={orderedClassNames[idx]}
        >
          <div className={internalOrderedGridClassNames[idx]}>
            <div className={classes.squeakDeck}>
              <Card showCardBack={true} draggable={false} />
            </div>

            {player.squeakHand.map((cards, cardsIdx) => (
              <div
                key={`${userID}squeakStack${cardsIdx}`} // another great reason to add playerID to IPlayerCardMetadata
                id={`${userID}SqueakHand${cardsIdx}`}
                // @ts-expect-error asdf
                className={`${cardClassMap[cardsIdx]} relative`}
              >
                <>
                  {cards.map((card, cardIdx) => (
                    <div
                      key={`${userID}card${cardIdx}`} // another great reason to add playerID to IPlayerCardMetadata
                      style={{
                        top: `${cardIdx * 15}px`,
                      }}
                      className={`absolute left-0 h-full w-full`}
                    >
                      <Card
                        value={card.value}
                        suit={card.suit}
                        draggable={false}
                      />
                    </div>
                  ))}
                </>
              </div>
            ))}

            <div className={classes.cardBeingPlayedOnBoard}>test!</div>
          </div>
        </div>
      ))}
    </>
  );
}

export default OtherPlayersCardContainers;
