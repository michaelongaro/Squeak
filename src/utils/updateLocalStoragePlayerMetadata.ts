interface IUpdateLocalStoragePlayerMetadata {
  avatarPath: string;
  color: string;
  deckVariant: string;
  cardBackVariant: string;
  deckHueRotation: number;
}

export function updateLocalStoragePlayerMetadata({
  avatarPath,
  color,
  deckVariant,
  cardBackVariant,
  deckHueRotation,
}: IUpdateLocalStoragePlayerMetadata) {
  localStorage.setItem(
    "squeak-playerMetadata",
    JSON.stringify({
      avatarPath,
      color,
      deckVariant,
      cardBackVariant,
      deckHueRotation,
    }),
  );
}
