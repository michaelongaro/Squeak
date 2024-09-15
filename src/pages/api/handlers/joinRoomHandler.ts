import { type Server, type Socket } from "socket.io";
import {
  type IRoomPlayersMetadata,
  type IRoomData,
  type IRoomPlayer,
} from "../socket";
import { avatarPaths } from "../../../utils/avatarPaths";
import { oklchToDeckHueRotations } from "../../../utils/oklchToDeckHueRotations";
import { prisma } from "~/server/db";
interface IJoinRoomConfig {
  code: string;
  userID: string;
  playerMetadata: IRoomPlayer;
}

export function joinRoomHandler(
  io: Server,
  socket: Socket,
  roomData: IRoomData,
) {
  socket.on(
    "joinRoom",
    async ({ userID, playerMetadata, code }: IJoinRoomConfig, callback) => {
      const room = roomData[code];
      const players = roomData[code]?.players;

      if (!room || !players) return;

      if (room.roomConfig.playersInRoom >= room.roomConfig.maxPlayers) {
        callback?.("roomIsFull");
        return;
      }

      socket.join(code);

      // checking to see if the playerMetadata is available,
      // if not it will auto select random available settings

      for (const player of Object.values(players)) {
        if (player.avatarPath === playerMetadata.avatarPath) {
          playerMetadata.avatarPath = getAvailableAttribute(
            "avatarPath",
            players,
          );
        }

        if (player.color === playerMetadata.color) {
          playerMetadata.color = getAvailableAttribute("color", players);
        }

        playerMetadata.deckHueRotation =
          oklchToDeckHueRotations[
            playerMetadata.color as keyof typeof oklchToDeckHueRotations
          ];
      }

      players[userID] = playerMetadata;

      io.in(code).emit("playerMetadataUpdated", players);

      room.roomConfig.playersInRoom++;
      room.roomConfig.playerIDsInRoom.push(userID);

      io.in(code).emit("roomConfigUpdated", room.roomConfig);

      // TODO: this prob errors out if not defined in inital socket.emit("joinRoom") right?
      callback?.(undefined);

      await prisma.room.update({
        where: {
          code,
        },
        data: {
          playersInRoom: room.roomConfig.playersInRoom,
          playerIDsInRoom: Object.keys(players),
        },
      });
    },
  );
}

function getAvailableAttribute(
  attribute: "avatarPath" | "color",
  players: IRoomPlayersMetadata,
): string {
  if (attribute === "avatarPath") {
    const usedAttributes = Object.values(players).map(
      (player) => player.avatarPath,
    );

    const availableAttributes = [...usedAttributes, ...avatarPaths].filter(
      (avatarPath) => !usedAttributes.includes(avatarPath),
    );

    return availableAttributes[
      Math.floor(Math.random() * availableAttributes.length)
    ]!;
  }

  const usedAttributes = Object.values(players).map((player) => player.color);

  const availableAttributes = [
    ...usedAttributes,
    ...Object.keys(oklchToDeckHueRotations),
  ].filter((color) => !usedAttributes.includes(color));

  return availableAttributes[
    Math.floor(Math.random() * availableAttributes.length)
  ]!;
}
