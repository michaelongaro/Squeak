import { type Server, type Socket } from "socket.io";
import { type IGameData } from "../socket";
import { type IQueuedCard } from "~/context/RoomContext";

interface IValidateClientServerSync {
  playerID: string;
  roomCode: string;
  clientGameData: IGameData;
  clientQueuedCards: IQueuedCard;
}

export function validateClientServerSyncHandler(
  io: Server,
  socket: Socket,
  gameData: IGameData,
) {
  function validateClientServerSync({
    playerID,
    roomCode,
    clientGameData,
    clientQueuedCards,
  }: IValidateClientServerSync) {
    const game = gameData[roomCode];

    if (!game) return;

    // deep compare clientGameData and gameData[roomCode]
    const differences = findDifferentValues(clientGameData, game);

    // if any differences are found, check if the different cards found are in the clientQueuedCards

    if (differences.length > 0) {
      const queuedCards = Object.values(clientQueuedCards);

      for (const diff of differences) {
        if (diff?.value && diff?.suit) {
          const foundCard = queuedCards.find(
            (card) => card.value === diff.value && card.suit === diff.suit,
          );

          // TODO: this isn't ideal... only want to emit to the player that needs to sync, not the entire room
          if (!foundCard) {
            console.log("Card not found in queued cards", diff);

            // if the card is not found in the queued cards, emit a "syncClientWithServer" emit with the current gameData[roomCode]
            io.in(roomCode).emit("syncClientWithServer", game);
            return;
          }
        }
      }
    }
  }

  socket.on(
    "checkClientSyncWithServer",
    ({
      playerID,
      roomCode,
      clientGameData,
      clientQueuedCards,
    }: {
      playerID: string;
      roomCode: string;
      clientGameData: IGameData;
      clientQueuedCards: IQueuedCard;
    }) =>
      validateClientServerSync({
        playerID,
        roomCode,
        clientGameData,
        clientQueuedCards,
      }),
  );
}

type AnyObject = { [key: string]: any };

function isObject(value: any): value is AnyObject {
  return value && typeof value === "object" && !Array.isArray(value);
}

function findDifferentValues(obj1: AnyObject, obj2: AnyObject): any[] {
  function getDifferentValues(
    currentObj1: AnyObject,
    currentObj2: AnyObject,
  ): any[] {
    const result: any[] = [];

    // Iterate over the keys in the first object
    for (const key in currentObj1) {
      if (currentObj1.hasOwnProperty(key)) {
        // If the key doesn't exist in the second object, add its value to the result
        if (!currentObj2.hasOwnProperty(key)) {
          result.push(currentObj1[key]);
        } else {
          // If both values are objects, recursively find different values
          if (isObject(currentObj1[key]) && isObject(currentObj2[key])) {
            result.push(
              ...getDifferentValues(currentObj1[key], currentObj2[key]),
            );
          } else if (currentObj1[key] !== currentObj2[key]) {
            // If the values are different, add to the result
            result.push(currentObj1[key]);
          }
        }
      }
    }

    // Iterate over the keys in the second object to find any keys that exist only in the second object
    for (const key in currentObj2) {
      if (currentObj2.hasOwnProperty(key) && !currentObj1.hasOwnProperty(key)) {
        result.push(currentObj2[key]);
      }
    }

    return result;
  }

  // Start the comparison from the root of both objects
  return getDifferentValues(obj1, obj2);
}
