import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import React, { useRef } from "react";
import useOnClickOutside from "../../../hooks/useOnClickOutside";
import Settings from "./Settings";
import Stats from "./Stats";
import {
  type IRoomPlayersMetadata,
  type IRoomPlayer,
} from "../../../pages/api/socket";
import { useRoomContext } from "../../../context/RoomContext";
import { useUserIDContext } from "../../../context/UserIDContext";
import { trpc } from "../../../utils/trpc";

export interface ILocalPlayerSettings {
  squeakPileOnLeft: boolean;
  desktopNotifications: boolean;
}

interface IUserSettingsAndStatsModalProps {
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
}

function UserSettingsAndStatsModal({
  setShowModal,
}: IUserSettingsAndStatsModalProps) {
  const { playerMetadata } = useRoomContext();
  const { value: userID } = useUserIDContext();

  const { data: user } = trpc.users.getUserByID.useQuery(userID);

  // if not showing settings, stats are being shown instead
  const [showSettings, setShowSettings] = useState<boolean>(true);

  const [localPlayerMetadata, setLocalPlayerMetadata] =
    useState<IRoomPlayersMetadata>({} as IRoomPlayersMetadata);
  const [localPlayerSettings, setLocalPlayerSettings] =
    useState<ILocalPlayerSettings>({} as ILocalPlayerSettings);
  const [ableToSave, setAbleToSave] = useState<boolean>(false);

  const modalRef = useRef<HTMLDivElement>(null);

  useOnClickOutside({ ref: modalRef, setShowModal });

  useEffect(() => {
    if (
      user === undefined ||
      user === null ||
      localPlayerMetadata[userID] ||
      localPlayerSettings.desktopNotifications !== undefined // prob delete, even necessary to check this?
    )
      return;
    setLocalPlayerMetadata({
      [userID]: {
        username: user.username,
        avatarPath: user.avatarPath,
        color: user.color,
        deckHueRotation: user.deckHueRotation,
      } as IRoomPlayer,
    });
    setLocalPlayerSettings({
      squeakPileOnLeft: user.squeakPileOnLeft,
      desktopNotifications: user.desktopNotifications,
    });
  }, [user, userID, localPlayerMetadata, localPlayerSettings]);

  useEffect(() => {
    if (user === undefined || user === null) return;

    if (
      localPlayerMetadata[userID]?.username !== user.username ||
      localPlayerMetadata[userID]?.avatarPath !== user.avatarPath ||
      localPlayerMetadata[userID]?.color !== user.color ||
      localPlayerMetadata[userID]?.deckHueRotation !== user.deckHueRotation ||
      localPlayerSettings.squeakPileOnLeft !== user.squeakPileOnLeft ||
      localPlayerSettings.desktopNotifications !== user.desktopNotifications
    ) {
      setAbleToSave(true);
      return;
    }

    setAbleToSave(false);
  }, [localPlayerMetadata, userID, user, localPlayerSettings]);

  return (
    <div className="fixed top-0 left-0 z-[500] flex min-h-[100vh] min-w-[100vw] items-center justify-center bg-green-700/90 transition-all">
      <div
        ref={modalRef}
        className="baseVertFlex rounded-md border-2 border-white shadow-md"
      >
        <div className="baseFlex relative w-full gap-4 rounded-t-md bg-green-800 pt-4 pb-4 pl-12 pr-12">
          {/* determine what type/family of icons to use */}
          <button
            className="baseFlex gap-2"
            onClick={() => {
              setShowSettings(true);
            }}
          >
            Settings CogIcon
          </button>
          <button
            className="baseFlex gap-2"
            onClick={() => {
              setShowSettings(false);
            }}
          >
            Stats statsIcon
          </button>
          <button
            className="absolute top-2 right-2"
            onClick={() => {
              setShowModal(false);
            }}
          >
            X
          </button>
        </div>

        {showSettings && (
          <Settings
            localPlayerMetadata={localPlayerMetadata}
            setLocalPlayerMetadata={setLocalPlayerMetadata}
            localPlayerSettings={localPlayerSettings}
            setLocalPlayerSettings={setLocalPlayerSettings}
          />
        )}

        {!showSettings && <Stats />}

        <div className="baseFlex w-full gap-4 rounded-b-md bg-green-800 pb-4 pt-4 pl-12 pr-12">
          {/* determine what type/family of icons to use */}
          <button
            onClick={() => {
              signOut();
            }}
          >
            Log out
          </button>
          <button
            disabled={!ableToSave}
            style={{
              filter: ableToSave ? "none" : "grayscale(100%)",
            }}
            onClick={() => {
              setShowSettings(false);
            }}
          >
            Save
          </button>
          <div className="absolute top-2 right-2">X</div>
        </div>
      </div>
    </div>
  );
}

export default UserSettingsAndStatsModal;
