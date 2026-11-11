import type { IGameData } from "~/types/socket";

// Delayed animations and bot moves must never mutate a replacement round.
export function scheduleRoundTask(
  gameData: IGameData,
  roomCode: string,
  task: () => void,
  delay: number,
) {
  const game = gameData[roomCode];
  const board = game?.board;
  const players = game?.players;
  const round = game?.currentRound;

  return setTimeout(() => {
    const currentGame = gameData[roomCode];
    if (
      !game ||
      currentGame !== game ||
      currentGame.board !== board ||
      currentGame.players !== players ||
      currentGame.currentRound !== round
    )
      return;

    task();
  }, delay);
}
