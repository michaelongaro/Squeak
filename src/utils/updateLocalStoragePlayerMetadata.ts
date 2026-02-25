import { normalizeLocalPlayerMetadata } from "~/utils/playerMetadataDefaults";

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
  const normalizedMetadata = normalizeLocalPlayerMetadata({
    avatarPath,
    color,
    deckVariant,
    cardBackVariant,
    deckHueRotation,
  });

  localStorage.setItem(
    "squeak-playerMetadata",
    JSON.stringify(normalizedMetadata),
  );
}
