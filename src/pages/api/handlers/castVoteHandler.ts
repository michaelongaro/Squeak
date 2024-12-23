import { type Server, type Socket } from "socket.io";
import { type IRoomData, type IMiscRoomData, type IGameData } from "../socket";
import { generateAndEmitScoreboard } from "./roundOverHandler";
import { type ICard } from "~/utils/generateDeckAndSqueakCards";

interface IVoteReceived {
  io: Server;
  roomCode: string;
  gameData: IGameData;
  miscRoomData: IMiscRoomData;
  roomData: IRoomData;
  voteType: "rotateDecks" | "endRound";
  voteDirection: "for" | "against";
}

export function castVoteHandler(
  io: Server,
  socket: Socket,
  gameData: IGameData,
  miscRoomData: IMiscRoomData,
  roomData: IRoomData,
) {
  socket.on(
    "castVote",
    ({
      roomCode,
      voteType,
      voteDirection,
    }: {
      roomCode: string;
      voteType: "rotateDecks" | "endRound";
      voteDirection: "for" | "against";
    }) =>
      voteReceived({
        io,
        roomCode,
        gameData,
        miscRoomData,
        roomData,
        voteType,
        voteDirection,
      }),
  );
}

function voteReceived({
  io,
  roomCode,
  gameData,
  miscRoomData,
  roomData,
  voteType,
  voteDirection,
}: IVoteReceived) {
  const players = roomData[roomCode]?.players;
  const game = gameData[roomCode];
  const miscRoomDataObj = miscRoomData[roomCode];

  if (!players || !game || !miscRoomDataObj) return;

  // immediately return if vote is for a different category than the current one
  // being voted on (this would only happen during a race condition)
  if (
    miscRoomDataObj.voteType !== null &&
    miscRoomDataObj.voteType !== voteType
  )
    return;

  // starting a new vote
  if (miscRoomDataObj.currentVotes.length === 0) {
    miscRoomDataObj.voteType = voteType;
    miscRoomDataObj.currentVotes.push("agree");

    // any players who left midgame/bots in the room will automatically vote yes
    const playerIDs = Object.keys(players);
    playerIDs.forEach((playerID) => {
      if (
        game.playerIDsThatLeftMidgame.includes(playerID) ||
        players[playerID]?.botDifficulty !== undefined
      ) {
        miscRoomDataObj.currentVotes.push("agree");
      }
    });

    // start countdown to reset voting metadata if timer runs out
    setTimeout(() => {
      // technically all the players could have left, and room's objects would be deleted,
      // so trying to set undefined fields would result in a runtime error.
      if (miscRoomDataObj === undefined) return;

      miscRoomDataObj.voteType = null;
      miscRoomDataObj.currentVotes = [];
    }, 30000);
  }

  // if not the first vote, then this is a subsequent vote from a player
  else {
    if (voteDirection === "for") {
      miscRoomDataObj.currentVotes.push("agree");
    } else {
      miscRoomDataObj.currentVotes.push("disagree");
    }
  }

  // if all players have voted
  if (miscRoomDataObj.currentVotes.length === Object.keys(players).length) {
    const agreeVotes = miscRoomDataObj.currentVotes.filter(
      (vote) => vote === "agree",
    ).length;

    // if the vote passed (100% of players voted yes)
    // fyi: technically could do majority wins, but that isn't how I
    // grew up playing the game.
    if (agreeVotes === Object.keys(players).length) {
      if (miscRoomDataObj.voteType === "rotateDecks") {
        const players = gameData[roomCode]?.players;

        if (!players) return;

        Object.keys(players).map((playerID) => {
          const player = players[playerID];

          if (!player) return;

          // merge all cards in hand back into deck + clear hand
          player.deck.push(...player.hand);
          player.hand = [];

          player.deck = rotateDeckByOneCard(player.deck);
        });
        io.in(roomCode).emit("decksWereRotated", gameData[roomCode]);
      } else if (miscRoomDataObj.voteType === "endRound") {
        generateAndEmitScoreboard({
          io,
          roomCode,
          gameData,
          miscRoomData,
          roomData,
          playerWhoSqueakedID: "", // no player won since the round was ended early
        });
      }
    }

    // still need to emit "voteHasBeenCast" so client can update ui
    io.in(roomCode).emit("voteHasBeenCast", {
      voteType,
      currentVotes: miscRoomDataObj.currentVotes,
      voteIsFinished: true,
    });

    // reset voting metadata
    miscRoomDataObj.voteType = null;
    miscRoomDataObj.currentVotes = [];
    return;
  }

  io.in(roomCode).emit("voteHasBeenCast", {
    voteType,
    currentVotes: miscRoomDataObj.currentVotes,
    voteIsFinished: miscRoomDataObj.voteType === null,
  });
}

function rotateDeckByOneCard(deck: ICard[]): ICard[] {
  if (deck.length === 0 || deck.length === 1) return deck;
  deck.push(deck.shift()!); // deck isn't empty here, so this should be fine
  return deck;
}
