interface IUpdateLocalStoragePlayerMetadata {
  avatarPath: string;
  color: string;
  deckVariant: string;
  deckHueRotation: number;
}

export function updateLocalStoragePlayerMetadata({
  avatarPath,
  color,
  deckVariant,
  deckHueRotation,
}: IUpdateLocalStoragePlayerMetadata) {
  localStorage.setItem(
    "squeak-playerMetadata",
    JSON.stringify({
      avatarPath,
      color,
      deckVariant,
      deckHueRotation,
    }),
  );
}
