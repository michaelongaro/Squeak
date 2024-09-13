export function adjustCoordinatesByRotation(
  x: number,
  y: number,
  rotation: number,
  psuedoVerticalDepthDifferential: number,
): { x: number; y: number } {
  if (rotation === 180) {
    return { x: x * -1, y: (y + psuedoVerticalDepthDifferential) * -1 };
  } else if (rotation === 90) {
    return { x: y, y: (x + psuedoVerticalDepthDifferential) * -1 };
  } else if (rotation === 270) {
    return { x: (y + psuedoVerticalDepthDifferential) * -1, y: x };
  }

  return { x, y: y - psuedoVerticalDepthDifferential };
}
