import { expect, describe, it, vi } from "vitest";
import { type ICard } from "../../../../utils/generateDeckAndSqueakCards";
import { type IGameData } from "../../socket";
import { deckToBoard } from "../deckToBoard";

const samplePlayerCardData: IGameData = {
  room123: {
    board: [
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
    ],
    players: {
      player1: {
        squeakDeck: [
          {
            value: "3",
            suit: "S",
          },
          {
            value: "2",
            suit: "H",
          },
          {
            value: "5",
            suit: "D",
          },
          {
            value: "9",
            suit: "H",
          },
          {
            value: "A",
            suit: "C",
          },
          {
            value: "J",
            suit: "H",
          },
          {
            value: "8",
            suit: "S",
          },
          {
            value: "4",
            suit: "C",
          },
          {
            value: "J",
            suit: "S",
          },
        ],
        squeakHand: [
          [
            {
              value: "K",
              suit: "C",
            },
          ],
          [
            {
              value: "J",
              suit: "D",
            },
          ],
          [
            {
              value: "Q",
              suit: "H",
            },
          ],
          [
            {
              value: "10",
              suit: "C",
            },
          ],
        ],
        deck: [
          {
            value: "K",
            suit: "S",
          },
          {
            value: "5",
            suit: "S",
          },
          {
            value: "Q",
            suit: "C",
          },
          {
            value: "7",
            suit: "H",
          },
          {
            value: "10",
            suit: "H",
          },
          {
            value: "K",
            suit: "D",
          },
          {
            value: "4",
            suit: "S",
          },
          {
            value: "6",
            suit: "C",
          },
          {
            value: "J",
            suit: "C",
          },
          {
            value: "3",
            suit: "D",
          },
          {
            value: "5",
            suit: "C",
          },
          {
            value: "10",
            suit: "D",
          },
          {
            value: "8",
            suit: "H",
          },
          {
            value: "A",
            suit: "S",
          },
          {
            value: "7",
            suit: "C",
          },
          {
            value: "8",
            suit: "C",
          },
          {
            value: "5",
            suit: "H",
          },
          {
            value: "9",
            suit: "D",
          },
          {
            value: "A",
            suit: "H",
          },
          {
            value: "3",
            suit: "H",
          },
          {
            value: "8",
            suit: "D",
          },
          {
            value: "2",
            suit: "S",
          },
          {
            value: "7",
            suit: "D",
          },
          {
            value: "4",
            suit: "H",
          },
          {
            value: "6",
            suit: "H",
          },
          {
            value: "7",
            suit: "S",
          },
          {
            value: "K",
            suit: "H",
          },
          {
            value: "6",
            suit: "S",
          },
          {
            value: "A",
            suit: "D",
          },
          {
            value: "3",
            suit: "C",
          },
          {
            value: "2",
            suit: "D",
          },
          {
            value: "Q",
            suit: "S",
          },
          {
            value: "6",
            suit: "D",
          },
          {
            value: "10",
            suit: "S",
          },
          {
            value: "Q",
            suit: "D",
          },
          {
            value: "4",
            suit: "D",
          },
          {
            value: "9",
            suit: "C",
          },
          {
            value: "2",
            suit: "C",
          },
          {
            value: "9",
            suit: "S",
          },
        ],
        deckIdx: -1,
        topCardsInDeck: [
          {
            value: "5",
            suit: "H",
          },
          {
            value: "9",
            suit: "D",
          },
          {
            value: "A",
            suit: "H",
          },
        ],
        nextTopCardInDeck: {
          value: "Q",
          suit: "C",
        },

        totalPoints: 0,
        rankInRoom: -1,
      },
    },
    currentRound: 1,
    playerIDsThatLeftMidgame: [],
  },
};

describe("deckToBoard", () => {
  it("should update player and board state if card placement is valid", () => {
    const gameData = { ...samplePlayerCardData };
    const card: ICard = { value: "A", suit: "H" };
    const boardEndLocation = { row: 0, col: 0 };
    const playerID = "player1";
    const roomCode = "room123";
    const io = {
      in: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    };

    // @ts-expect-error io implementation is mocked
    deckToBoard({ gameData, card, boardEndLocation, playerID, roomCode, io });

    expect(gameData.room123?.board[0]?.[0]).toEqual(card);
    expect(gameData.room123?.players.player1?.topCardsInDeck).toEqual([
      null,
      {
        value: "5",
        suit: "H",
      },
      {
        value: "9",
        suit: "D",
      },
    ]);

    const shouldntHave = [card];
    shouldntHave.map((card) =>
      expect(gameData.room123?.players.player1?.deck).not.toContain(card)
    );

    expect(io.in).toHaveBeenCalledWith("room123");
    expect(io.emit).toHaveBeenCalledWith("cardDropApproved", {
      playerID: "player1",
      card,
      endID: "cell00",
      updatedBoard: gameData.room123?.board,
      updatedPlayerCards: gameData.room123?.players,
    });
  });

  it("should not update player or board state if card placement is invalid", () => {
    const gameData = { ...samplePlayerCardData };
    const card: ICard = { value: "9", suit: "D" };
    const boardEndLocation = { row: 2, col: 3 };
    const playerID = "player1";
    const roomCode = "room123";
    const io = {
      in: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    };

    // @ts-expect-error io implementation is mocked
    deckToBoard({ gameData, card, boardEndLocation, playerID, roomCode, io });

    expect(gameData.room123?.board[2]?.[3]).toEqual(null);
    expect(gameData.room123?.players.player1?.topCardsInDeck).toEqual([
      null,
      {
        value: "5",
        suit: "H",
      },
      {
        value: "9",
        suit: "D",
      },
    ]);
    expect(gameData.room123?.players.player1?.deck).toEqual(
      gameData.room123?.players.player1?.deck
    );
    expect(io.in).toHaveBeenCalledWith("room123");
    expect(io.emit).toHaveBeenCalledWith("cardDropDenied", {
      playerID: "player1",
    });
  });
});
