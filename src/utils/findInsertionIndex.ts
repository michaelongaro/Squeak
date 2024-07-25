import { type gameDataUpdatesQueue } from "~/context/RoomContext";

export function findInsertionIndex(
  array: gameDataUpdatesQueue,
  timestamp: number,
): number {
  let low = 0;
  let high = array.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (array[mid] && array[mid][0] < timestamp) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}
