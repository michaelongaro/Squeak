import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import Settings from "./Settings";
import Statistics from "./Statistics";
import {
  type IRoomPlayersMetadata,
  type IRoomPlayer,
} from "../../../pages/api/socket";
import { useUserIDContext } from "../../../context/UserIDContext";
import { useRoomContext } from "../../../context/RoomContext";
import { api } from "~/utils/api";
import { AnimatePresence, motion } from "framer-motion";
import {
  IoSettingsSharp,
  IoStatsChart,
  IoClose,
  IoSave,
} from "react-icons/io5";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";

export interface ILocalPlayerSettings {
  deckVariantIndex: number;
  squeakPileOnLeft: boolean;
  desktopNotifications: boolean;
}

interface IUserSettingsAndStatsDialogProps {
  setShowDialog: (showSettingsDialog: boolean) => void;
}

function UserSettingsAndStatsDialog({
  setShowDialog,
}: IUserSettingsAndStatsDialogProps) {
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
      // TODO: relatively sure we are doing this wrong with the "keys" that it is going off of.
      utils.users.getUserByID.cancel(userID);
      const optimisticUpdate = utils.users.getUserByID.getData(userID);

      if (optimisticUpdate) {
        // does this implementation of userID as a query string work?
        utils.users.getUserByID.setData(userID, optimisticUpdate);
      }
    },
    onSettled: () => {
      setTimeout(() => {
        setSaveButtonText("Saved");
        utils.users.getUserByID.invalidate(userID);

        setTimeout(() => {
          setSaveButtonText("Save");
        }, 1000);
      }, 1000);
    },
  });

  // if not showing settings, stats are being shown instead
  const [showSettings, setShowSettings] = useState<boolean>(true);

  const [saveButtonText, setSaveButtonText] = useState<string>("Save");

  const [localPlayerMetadata, setLocalPlayerMetadata] =
    useState<IRoomPlayersMetadata>({} as IRoomPlayersMetadata);
  const [localPlayerSettings, setLocalPlayerSettings] =
    useState<ILocalPlayerSettings>({} as ILocalPlayerSettings);
  const [ableToSave, setAbleToSave] = useState<boolean>(false);
  const [usernameIsProfane, setUsernameIsProfane] = useState<boolean>(false);

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
      deckVariantIndex: user.deckVariantIndex,
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
      localPlayerSettings.deckVariantIndex !== user.deckVariantIndex ||
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
      deckVariantIndex: localPlayerSettings.deckVariantIndex,
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
    <DialogContent className="baseVertFlex w-fit overflow-hidden rounded-md border-2 border-white shadow-md">
      <VisuallyHidden>
        <DialogTitle>{showSettings ? "Settings" : "Statistics"}</DialogTitle>
        <DialogDescription>
          {showSettings
            ? "Customize your Squeak experience with these settings."
            : "View your Squeak statistics."}
        </DialogDescription>
      </VisuallyHidden>

      <div className="baseFlex relative w-full gap-8 rounded-t-md border-b border-white bg-green-900 py-4">
        <Button
          variant={"secondary"}
          forceActive={showSettings}
          showCardSuitAccents
          onClick={() => setShowSettings(true)}
          className="h-[3.5rem] w-48 gap-2"
        >
          <IoSettingsSharp size={"1.25rem"} />
          Settings
        </Button>

        <Button
          variant={"secondary"}
          forceActive={!showSettings}
          showCardSuitAccents
          onClick={() => setShowSettings(false)}
          className="h-[3.5rem] w-48 gap-2"
        >
          <IoStatsChart size={"1.25rem"} />
          Statistics
        </Button>

        <Button
          variant={"text"}
          size={"icon"}
          className="!absolute right-1 top-1 size-8"
          onClick={() => setShowDialog(false)}
        >
          <IoClose size={"1.5rem"} />
        </Button>
      </div>

      <AnimatePresence initial={false}>
        <div className="h-[328px] w-[700px] bg-gradient-to-br from-green-800 to-green-850 p-8">
          {showSettings ? (
            <Settings
              localPlayerMetadata={localPlayerMetadata}
              setLocalPlayerMetadata={setLocalPlayerMetadata}
              localPlayerSettings={localPlayerSettings}
              setLocalPlayerSettings={setLocalPlayerSettings}
              usernameIsProfane={usernameIsProfane}
              setUsernameIsProfane={setUsernameIsProfane}
              saveButtonText={saveButtonText}
            />
          ) : (
            <Statistics />
          )}
        </div>
      </AnimatePresence>

      <div className="baseFlex w-full gap-16 rounded-b-md border-t border-white bg-green-900 px-12 py-4">
        <motion.div layout={"position"}>
          <Button
            variant={"secondary"}
            onClick={() => {
              setShowDialog(false);
              signOut();
            }}
            className="h-[2.75rem] w-[10rem]"
          >
            Log out
          </Button>
        </motion.div>

        <AnimatePresence mode={"popLayout"} initial={false}>
          {showSettings && (
            <motion.div
              key={"saveChangesButton"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                disabled={
                  !ableToSave ||
                  usernameIsProfane ||
                  saveButtonText === "Saving"
                }
                onClick={() => {
                  setSaveButtonText("Saving");
                  updateUserHandler();
                }}
                className="h-[2.75rem] w-[10rem]"
              >
                <AnimatePresence mode={"popLayout"} initial={false}>
                  <motion.div
                    key={saveButtonText}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{
                      duration: 0.25,
                    }}
                    className="baseFlex h-[2.75rem] w-[10rem] gap-2"
                  >
                    {saveButtonText}
                    {saveButtonText === "Save" && <IoSave size={"1.25rem"} />}
                    {saveButtonText === "Saving" && (
                      <div
                        className="inline-block size-4 animate-spin rounded-full border-[2px] border-darkGreen border-t-transparent text-darkGreen"
                        role="status"
                        aria-label="loading"
                      >
                        <span className="sr-only">Loading...</span>
                      </div>
                    )}
                    {saveButtonText === "Saved" && (
                      <svg
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        className="text-offwhite size-5"
                      >
                        <motion.path
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{
                            delay: 0.2,
                            type: "tween",
                            ease: "easeOut",
                            duration: 0.3,
                          }}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </motion.div>
                </AnimatePresence>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DialogContent>
  );
}

export default UserSettingsAndStatsDialog;
