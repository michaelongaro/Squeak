interface IUpdateLocalStoragePlayerMetadata {
  avatarPath: string;
  color: string;
  deckVariantIndex: number;
  deckHueRotation: number;
}

export function updateLocalStoragePlayerMetadata({
  avatarPath,
  color,
  deckVariantIndex,
  deckHueRotation,
}: IUpdateLocalStoragePlayerMetadata) {
  localStorage.setItem(
    "squeak-playerMetadata",
    JSON.stringify({
      avatarPath,
      color,
      deckVariantIndex,
      deckHueRotation,
    }),
  );
}
