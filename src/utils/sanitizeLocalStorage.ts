const defaultPlayerMetadata = {
  avatarPath: "/avatars/rabbit.svg",
  color: "oklch(64.02% 0.171 15.38)",
  deckVariant: "Simple",
  deckHueRotation: 232,
};

export function sanitizeLocalStorage() {
  // FYI: no need to sanitize the userID field because it's normal
  // for signed in users to not have this field set.

  const username = localStorage.getItem("squeak-username");
  const metadata = localStorage.getItem("squeak-playerMetadata");
  const volume = localStorage.getItem("squeak-volume");

  if (username) {
    try {
      const parsedUsername = JSON.parse(username);

      if (typeof parsedUsername !== "string") {
        throw new Error("Invalid username format");
      }
    } catch (e) {
      localStorage.setItem("squeak-username", "");
    }
  } else {
    localStorage.setItem("squeak-username", "");
  }

  if (metadata) {
    try {
      const parsedMetadata = JSON.parse(metadata);

      if (
        typeof parsedMetadata.avatarPath !== "string" ||
        typeof parsedMetadata.color !== "string" ||
        typeof parsedMetadata.deckVariant !== "string" ||
        typeof parsedMetadata.deckHueRotation !== "number"
      ) {
        throw new Error("Invalid metadata format");
      }
    } catch (e) {
      localStorage.setItem(
        "squeak-playerMetadata",
        JSON.stringify(defaultPlayerMetadata),
      );
    }
  } else {
    localStorage.setItem(
      "squeak-playerMetadata",
      JSON.stringify(defaultPlayerMetadata),
    );
  }

  if (volume) {
    try {
      const parsedVolume = JSON.parse(volume);

      if (typeof parsedVolume !== "number") {
        throw new Error("Invalid volume format");
      }
    } catch (e) {
      localStorage.setItem("squeak-volume", "25");
    }
  } else {
    localStorage.setItem("squeak-volume", "25");
  }
}
