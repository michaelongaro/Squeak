import { avatarPaths } from "~/utils/avatarPaths";
import { oklchToDeckHueRotations } from "~/utils/oklchToDeckHueRotations";

export const cardFrontVariants = ["Simple", "Standard", "Antique"] as const;
export const cardBackVariants = [
  "Standard",
  "Waves",
  "Geometric",
  "Kaleidoscope",
] as const;

export const DEFAULT_AVATAR_PATH = "/avatars/rabbit.svg";
export const DEFAULT_DECK_VARIANT = "Simple";
export const DEFAULT_CARD_BACK_VARIANT = "Standard";
export const DEFAULT_COLOR = "oklch(64.02% 0.171 15.38)";
export const DEFAULT_DECK_HUE_ROTATION = 232;

export interface ILocalPlayerMetadata {
  avatarPath: string;
  color: string;
  deckVariant: string;
  cardBackVariant: string;
  deckHueRotation: number;
}

export const defaultLocalPlayerMetadata: ILocalPlayerMetadata = {
  avatarPath: DEFAULT_AVATAR_PATH,
  color: DEFAULT_COLOR,
  deckVariant: DEFAULT_DECK_VARIANT,
  cardBackVariant: DEFAULT_CARD_BACK_VARIANT,
  deckHueRotation: DEFAULT_DECK_HUE_ROTATION,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function normalizeAvatarPath(avatarPath: unknown): string {
  return typeof avatarPath === "string" && avatarPaths.includes(avatarPath)
    ? avatarPath
    : DEFAULT_AVATAR_PATH;
}

export function normalizeDeckVariant(deckVariant: unknown): string {
  return typeof deckVariant === "string" &&
    cardFrontVariants.some((variant) => variant === deckVariant)
    ? deckVariant
    : DEFAULT_DECK_VARIANT;
}

export function normalizeCardBackVariant(cardBackVariant: unknown): string {
  return typeof cardBackVariant === "string" &&
    cardBackVariants.some((variant) => variant === cardBackVariant)
    ? cardBackVariant
    : DEFAULT_CARD_BACK_VARIANT;
}

export function normalizeLocalPlayerMetadata(
  metadata: unknown,
): ILocalPlayerMetadata {
  if (!isRecord(metadata)) {
    return defaultLocalPlayerMetadata;
  }

  const color =
    typeof metadata.color === "string" &&
    Object.prototype.hasOwnProperty.call(
      oklchToDeckHueRotations,
      metadata.color,
    )
      ? metadata.color
      : DEFAULT_COLOR;

  const deckHueRotation =
    oklchToDeckHueRotations[color as keyof typeof oklchToDeckHueRotations];

  return {
    avatarPath: normalizeAvatarPath(metadata.avatarPath),
    color,
    deckVariant: normalizeDeckVariant(metadata.deckVariant),
    cardBackVariant: normalizeCardBackVariant(metadata.cardBackVariant),
    deckHueRotation,
  };
}

export function parseAndNormalizeLocalPlayerMetadata(
  serializedMetadata: string | null,
): ILocalPlayerMetadata {
  if (!serializedMetadata) {
    return defaultLocalPlayerMetadata;
  }

  try {
    const parsedMetadata = JSON.parse(serializedMetadata) as unknown;
    return normalizeLocalPlayerMetadata(parsedMetadata);
  } catch {
    return defaultLocalPlayerMetadata;
  }
}
