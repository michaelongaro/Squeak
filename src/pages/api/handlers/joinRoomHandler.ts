import { type Server, type Socket } from "socket.io";
import {
  type IRoomPlayersMetadata,
  type IRoomData,
  type IRoomPlayer,
} from "../socket";
import { avatarPaths } from "../../../utils/avatarPaths";
import { hslToDeckHueRotations } from "../../../utils/hslToDeckHueRotations";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface IJoinRoomConfig {
  code: string;
  userID: string;
  playerMetadata: IRoomPlayer;
}

export function joinRoomHandler(
  io: Server,
  socket: Socket,
  roomData: IRoomData
) {
  socket.on(
    "joinRoom",
    async ({ userID, playerMetadata, code }: IJoinRoomConfig) => {
      const room = roomData[code];
      const players = roomData[code]?.players;

      if (!room || !players) return;

      socket.join(code);

      // checking to see if the playerMetadata is available,
      // if not it will auto select random available settings

      for (const player of Object.values(players)) {
        if (player.avatarPath === playerMetadata.avatarPath) {
          playerMetadata.avatarPath = getAvailableAttribute(
            "avatarPath",
            players
          );
        }

        if (player.color === playerMetadata.color) {
          playerMetadata.color = getAvailableAttribute("color", players);
        }

        playerMetadata.deckHueRotation =
          hslToDeckHueRotations[
            playerMetadata.color as keyof typeof hslToDeckHueRotations
          ];
      }

      players[userID] = playerMetadata;

      io.in(code).emit("playerMetadataUpdated", players);

      room.roomConfig.playersInRoom++;

      io.in(code).emit("roomConfigUpdated", room.roomConfig);

      await prisma.room.update({
        where: {
          code,
        },
        data: {
          playersInRoom: room.roomConfig.playersInRoom,
        },
      });
    }
  );
}

function getAvailableAttribute(
  attribute: "avatarPath" | "color",
  players: IRoomPlayersMetadata
): string {
  if (attribute === "avatarPath") {
    const usedAttributes = Object.values(players).map(
      (player) => player.avatarPath
    );

    const availableAttributes = [...usedAttributes, ...avatarPaths].filter(
      (avatarPath) => !usedAttributes.includes(avatarPath)
    );

    return availableAttributes[
      Math.floor(Math.random() * availableAttributes.length)
    ]!;
  }

  const usedAttributes = Object.values(players).map((player) => player.color);

  const availableAttributes = [
    ...usedAttributes,
    ...Object.keys(hslToDeckHueRotations),
  ].filter((color) => !usedAttributes.includes(color));

  return availableAttributes[
    Math.floor(Math.random() * availableAttributes.length)
  ]!;
}
