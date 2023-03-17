import { expect, describe, it, vi } from "vitest";
import { type ICard } from "../../../../utils/generateDeckAndSqueakCards";
import { type IGameData } from "../../socket";
import { squeakToSqueak } from "../squeakToSqueak";

vi.useFakeTimers();
vi.spyOn(global, "setTimeout");

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
            value: "10",
            suit: "C",
          },
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
              value: "A",
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

describe("squeakToSqueak", () => {
  it("should update player state and draw another squeak card if card placement is valid", () => {
    const gameData = { ...samplePlayerCardData };
    const card: ICard = { value: "Q", suit: "H" };
    const squeakStartLocation = 2;
    const squeakEndLocation = 0;
    const playerID = "player1";
    const roomCode = "room123";
    const io = {
      in: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    };

    squeakToSqueak({
      gameData,
      card,
      squeakStartLocation,
      squeakEndLocation,
      playerID,
      roomCode,
      // @ts-expect-error io implementation is mocked
      io,
    });

    // not sure if good practice to test parts that probably shouldn't be changing.
    expect(gameData.room123?.players.player1?.topCardsInDeck).toEqual([
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
    ]);

    expect(
      gameData.room123?.players["player1"]?.squeakHand[squeakStartLocation]
    ).toEqual([]);

    expect(
      gameData.room123?.players["player1"]?.squeakHand[squeakEndLocation]
    ).toEqual([
      {
        value: "K",
        suit: "C",
      },
      {
        value: "Q",
        suit: "H",
      },
    ]);

    // testing if new card is drawn (in function this action is delayed by 350ms)
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 350);

    const indexWithinSqueakStack = 1;
    const squeakStackLength = 2;

    expect(io.in).toHaveBeenCalledWith("room123");
    expect(io.emit).toHaveBeenCalledWith("cardDropApproved", {
      playerID: "player1",
      card,
      endID: `${playerID}squeakHand${squeakEndLocation}`,
      squeakEndCoords: {
        offsetHeight: indexWithinSqueakStack * (20 - squeakStackLength),
        stackOfCardsMoved: [card],
      },
      updatedBoard: gameData.room123?.board,
      updatedPlayerCards: gameData.room123?.players,
    });
  });
});
