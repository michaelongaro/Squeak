export function adjustCoordinatesByRotation(
  x: number,
  y: number,
  rotation: number
): { x: number; y: number } {
  if (rotation === 180) {
    return { x: x * -1, y: y * -1 };
  } else if (rotation === 90) {
    return { x: y, y: x * -1 };
  } else if (rotation === 270) {
    return { x: y * -1, y: x };
  }

  return { x, y };
}
