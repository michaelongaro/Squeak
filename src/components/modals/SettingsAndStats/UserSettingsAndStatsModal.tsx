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
import { useUserIDContext } from "../../../context/UserIDContext";
import { useRoomContext } from "../../../context/RoomContext";
import { trpc } from "../../../utils/trpc";
import { motion } from "framer-motion";
import SecondaryButton from "../../Buttons/SecondaryButton";
import {
  IoSettingsSharp,
  IoStatsChart,
  IoClose,
  IoLogOutOutline,
  IoSave,
} from "react-icons/io5";
import PrimaryButton from "../../Buttons/PrimaryButton";

export interface ILocalPlayerSettings {
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

  const {
    playerMetadata,
    setPlayerMetadata,
    connectedToRoom,
    setMirrorPlayerContainer,
  } = useRoomContext();

  const utils = trpc.useContext();
  const { data: user } = trpc.users.getUserByID.useQuery(userID);
  const updateUser = trpc.users.updateUser.useMutation({
    onMutate: () => {
      // relatively sure we are doing this wrong with the "keys" that it is going off of.
      utils.users.getUserByID.cancel("userData");
      const optimisticUpdate = utils.users.getUserByID.getData("userData");

      if (optimisticUpdate) {
        // does this implementation of "userData" as a query string work?
        utils.users.getUserByID.setData("userData", optimisticUpdate);
      }
    },
    onSettled: () => {
      utils.users.getUserByID.invalidate();
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
      id: userID,
      username: updatedMetadata.username,
      avatarPath: updatedMetadata.avatarPath,
      color: updatedMetadata.color,
      deckHueRotation: updatedMetadata.deckHueRotation,
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
  }

  return (
    <motion.div
      key={"settingsModal"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="baseFlex fixed top-0 left-0 z-[500] min-h-[100dvh] min-w-[100vw] bg-black/50 transition-all"
    >
      <motion.div
        ref={modalRef}
        key={"settingsModalInner"}
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        transition={{ duration: 0.15 }}
        className="baseVertFlex rounded-md border-2 border-white shadow-md"
      >
        <div className="baseFlex relative w-full gap-4 rounded-t-md bg-green-900 pt-4 pb-4 pl-20 pr-20">
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
            width={"2.5rem"}
            height={"2.5rem"}
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

        <div className="baseFlex w-full gap-16 rounded-b-md bg-green-900 pb-4 pt-4 pl-12 pr-12">
          {/* determine what type/family of icons to use */}

          <SecondaryButton
            innerText="Log out"
            icon={<IoLogOutOutline size={"1.25rem"} />}
            extraPadding={false}
            width={"10rem"}
            height={"3rem"}
            onClickFunction={() => signOut()}
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
