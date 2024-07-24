import { useState, useEffect } from "react";
import React, { useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import useOnClickOutside from "../../../hooks/useOnClickOutside";
import Settings from "./Settings";
import Stats from "./Stats";
import {
  type IRoomPlayersMetadata,
  type IRoomPlayer,
} from "../../../pages/api/socket";
import { useUserIDContext } from "../../../context/UserIDContext";
import { useRoomContext } from "../../../context/RoomContext";
import { api } from "~/utils/api";
import { motion } from "framer-motion";
import SecondaryButton from "../../Buttons/SecondaryButton";
import {
  IoSettingsSharp,
  IoStatsChart,
  IoClose,
  IoSave,
} from "react-icons/io5";
import PrimaryButton from "../../Buttons/PrimaryButton";

export interface ILocalPlayerSettings {
  prefersSimpleCardAssets: boolean;
  squeakPileOnLeft: boolean;
  desktopNotifications: boolean;
}

interface IUserSettingsAndStatsModalProps {
  setShowModal: (showSettingsModal: boolean) => void;
}

function UserSettingsAndStatsModal({
  setShowModal,
}: IUserSettingsAndStatsModalProps) {
  const userID = useUserIDContext();
  const { signOut } = useAuth();

  const {
    playerMetadata,
    setPlayerMetadata,
    connectedToRoom,
    setMirrorPlayerContainer,
  } = useRoomContext();

  const utils = api.useUtils();
  const { data: user } = api.users.getUserByID.useQuery(userID);
  const updateUser = api.users.updateUser.useMutation({
    onMutate: () => {
      // relatively sure we are doing this wrong with the "keys" that it is going off of.
      utils.users.getUserByID.cancel(userID);
      const optimisticUpdate = utils.users.getUserByID.getData(userID);

      if (optimisticUpdate) {
        // does this implementation of userID as a query string work?
        utils.users.getUserByID.setData(userID, optimisticUpdate);
      }
    },
    onSettled: () => {
      utils.users.getUserByID.invalidate(userID);
    },
  });

  // if not showing settings, stats are being shown instead
  const [showSettings, setShowSettings] = useState<boolean>(true);

  const [localPlayerMetadata, setLocalPlayerMetadata] =
    useState<IRoomPlayersMetadata>({} as IRoomPlayersMetadata);
  const [localPlayerSettings, setLocalPlayerSettings] =
    useState<ILocalPlayerSettings>({} as ILocalPlayerSettings);
  const [ableToSave, setAbleToSave] = useState<boolean>(false);
  const [usernameIsProfane, setUsernameIsProfane] = useState<boolean>(false);

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
      prefersSimpleCardAssets: user.prefersSimpleCardAssets,
      squeakPileOnLeft: user.squeakPileOnLeft,
      desktopNotifications: user.desktopNotifications,
    });
  }, [user, userID, localPlayerMetadata, localPlayerSettings]);

  useEffect(() => {
    if (user === undefined || user === null) return;

    if (
      (localPlayerMetadata[userID]?.username !== user.username &&
        localPlayerMetadata[userID]?.username.length !== 0) ||
      localPlayerMetadata[userID]?.avatarPath !== user.avatarPath ||
      localPlayerMetadata[userID]?.color !== user.color ||
      localPlayerMetadata[userID]?.deckHueRotation !== user.deckHueRotation ||
      localPlayerSettings.prefersSimpleCardAssets !==
        user.prefersSimpleCardAssets ||
      localPlayerSettings.squeakPileOnLeft !== user.squeakPileOnLeft ||
      localPlayerSettings.desktopNotifications !== user.desktopNotifications
    ) {
      setAbleToSave(true);
      return;
    }

    setAbleToSave(false);
  }, [localPlayerMetadata, userID, user, localPlayerSettings]);

  function updateUserHandler() {
    const updatedMetadata = localPlayerMetadata[userID];
    if (user === undefined || user === null || updatedMetadata === undefined)
      return;

    updateUser.mutate({
      userId: userID,
      username: updatedMetadata.username,
      avatarPath: updatedMetadata.avatarPath,
      color: updatedMetadata.color,
      deckHueRotation: updatedMetadata.deckHueRotation,
      prefersSimpleCardAssets: localPlayerSettings.prefersSimpleCardAssets,
      squeakPileOnLeft: localPlayerSettings.squeakPileOnLeft,
      desktopNotifications: localPlayerSettings.desktopNotifications,
    });

    setMirrorPlayerContainer(!localPlayerSettings.squeakPileOnLeft);

    // cannot update while connected to room because it could show incorrect/out of date
    // metadata compared to what the server has
    if (!connectedToRoom) {
      setPlayerMetadata({
        ...playerMetadata,
        [userID]: {
          username: updatedMetadata.username,
          avatarPath: updatedMetadata.avatarPath,
          color: updatedMetadata.color,
          deckHueRotation: updatedMetadata.deckHueRotation,
        },
      });
    }

    // Reset the ableToSave state after the user is updated
    setAbleToSave(false);
  }

  return (
    <motion.div
      key={"settingsModal"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="baseFlex fixed left-0 top-0 z-[200] min-h-[100dvh] min-w-[100vw] bg-black/50"
    >
      <motion.div
        ref={modalRef}
        key={"settingsModalInner"}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="baseVertFlex rounded-md border-2 border-white shadow-md"
      >
        <div className="baseFlex relative w-full gap-4 rounded-t-md bg-green-900 pb-4 pl-20 pr-20 pt-4">
          <SecondaryButton
            innerText="Settings"
            icon={<IoSettingsSharp size={"1.25rem"} />}
            extraPadding={true}
            forceHover={showSettings}
            onClickFunction={() => setShowSettings(true)}
          />

          <SecondaryButton
            innerText="Statistics"
            icon={<IoStatsChart size={"1.25rem"} />}
            extraPadding={true}
            forceHover={!showSettings}
            onClickFunction={() => setShowSettings(false)}
          />

          <SecondaryButton
            icon={<IoClose size={"1.5rem"} />}
            extraPadding={false}
            onClickFunction={() => setShowModal(false)}
            width={"2.25rem"}
            height={"2.25rem"}
            style={{
              position: "absolute",
              top: "0.5rem",
              right: "0.5rem",
            }}
          />
        </div>

        {showSettings && (
          <Settings
            localPlayerMetadata={localPlayerMetadata}
            setLocalPlayerMetadata={setLocalPlayerMetadata}
            localPlayerSettings={localPlayerSettings}
            setLocalPlayerSettings={setLocalPlayerSettings}
            usernameIsProfane={usernameIsProfane}
            setUsernameIsProfane={setUsernameIsProfane}
          />
        )}

        {!showSettings && <Stats />}

        <div className="baseFlex w-full gap-16 rounded-b-md bg-green-900 pb-4 pl-12 pr-12 pt-4">
          <SecondaryButton
            innerText="Log out"
            extraPadding={false}
            width={"10rem"}
            height={"3rem"}
            onClickFunction={() => {
              setShowModal(false);
              signOut();
            }}
          />
          {showSettings && (
            <PrimaryButton
              innerText="Save"
              innerTextWhenLoading={"Saving"}
              icon={<IoSave size={"1.25rem"} />}
              width={"10rem"}
              height={"3rem"}
              disabled={!ableToSave || usernameIsProfane}
              onClickFunction={() => updateUserHandler()}
              showLoadingSpinnerOnClick={true}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default UserSettingsAndStatsModal;
