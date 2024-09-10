import { useState } from "react";
import { useUserIDContext } from "../../../context/UserIDContext";
import {
  type IRoomPlayersMetadata,
  type IRoomPlayer,
} from "../../../pages/api/socket";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTrigger,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { type ILocalPlayerSettings } from "./UserSettingsAndStatisticsDialog";
import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import PlayerCustomizationPopover from "~/components/popovers/PlayerCustomizationPopover";
import { Button } from "~/components/ui/button";
import { FaTrashAlt } from "react-icons/fa";
import { api } from "~/utils/api";
import { useAuth } from "@clerk/nextjs";

const obscenityMatcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

interface ISettings {
  localPlayerMetadata: IRoomPlayersMetadata;
  setLocalPlayerMetadata: React.Dispatch<
    React.SetStateAction<IRoomPlayersMetadata>
  >;
  localPlayerSettings: ILocalPlayerSettings;
  setLocalPlayerSettings: React.Dispatch<
    React.SetStateAction<ILocalPlayerSettings>
  >;
  usernameIsProfane: boolean;
  setUsernameIsProfane: React.Dispatch<React.SetStateAction<boolean>>;
  saveButtonText: string;
}

function Settings({
  localPlayerMetadata,
  setLocalPlayerMetadata,
  localPlayerSettings,
  setLocalPlayerSettings,
  usernameIsProfane,
  setUsernameIsProfane,
  saveButtonText,
}: ISettings) {
  const userID = useUserIDContext();
  const { signOut } = useAuth();

  const { mutate: deleteUser } = api.users.delete.useMutation({
    onSuccess: async () => {
      setTimeout(() => setDeleteButtonText("Account deleted"), 2000);

      setTimeout(() => {
        void signOut({ redirectUrl: "/" });
      }, 4000);
    },
    onError: (error) => {
      console.log(error);
    },
  });

  const [focusedInInput, setFocusedInInput] = useState<boolean>(false);

  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false);
  const [deleteButtonText, setDeleteButtonText] = useState("Delete account");
  const [hoveringOnDeleteButton, setHoveringOnDeleteButton] = useState(false);

  return (
    <motion.div
      key={"settings"}
      initial={{ opacity: 0, x: "-25%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "-25%" }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="baseVertFlex relative text-lightGreen"
    >
      <div className="baseVertFlex gap-8">
        <div className="baseFlex gap-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <Input
              id="username"
              disabled={saveButtonText !== "Save"}
              type="text"
              placeholder="username"
              maxLength={16}
              onFocus={() => setFocusedInInput(true)}
              onBlur={() => setFocusedInInput(false)}
              onChange={(e) => {
                setUsernameIsProfane(obscenityMatcher.hasMatch(e.target.value));

                setLocalPlayerMetadata((prevMetadata) => ({
                  ...prevMetadata,
                  [userID]: {
                    ...prevMetadata?.[userID],
                    username: e.target.value,
                  } as IRoomPlayer,
                }));
              }}
              value={localPlayerMetadata[userID]?.username || ""}
            />

            <div
              style={{
                opacity:
                  focusedInInput ||
                  localPlayerMetadata[userID]?.username?.length === 0
                    ? 1
                    : 0,
              }}
              className="absolute right-1 top-0 text-xl text-red-600 transition-opacity"
            >
              *
            </div>

            <AnimatePresence>
              {usernameIsProfane && (
                <motion.div
                  key={"settingsProfanityWarning"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="baseVertFlex absolute -right-2 top-11 z-[200] whitespace-nowrap rounded-md border-2 border-[hsl(0,84%,60%)] bg-gradient-to-br from-red-50 to-red-100 px-4 py-2 text-sm text-[hsl(0,84%,40%)] shadow-md"
                >
                  <div>Username not allowed,</div>
                  <div className="text-center">please choose another one</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div
          className={`baseFlex gap-12 transition-opacity ${saveButtonText !== "Save" ? "opacity-50" : "opacity-100"}`}
        >
          <div className="baseVertFlex gap-2">
            <PlayerCustomizationPopover
              type={"avatar"}
              localPlayerMetadata={localPlayerMetadata}
              setLocalPlayerMetadata={setLocalPlayerMetadata}
            />
            <p className="mt-[0.3rem] text-lightGreen">Avatar</p>
          </div>
          <div className="baseVertFlex gap-2">
            <PlayerCustomizationPopover
              type={"front"}
              localPlayerMetadata={localPlayerMetadata}
              setLocalPlayerMetadata={setLocalPlayerMetadata}
            />
            <p className="text-lightGreen">Front</p>
          </div>
          <div className="baseVertFlex gap-2">
            <PlayerCustomizationPopover
              type={"back"}
              localPlayerMetadata={localPlayerMetadata}
              setLocalPlayerMetadata={setLocalPlayerMetadata}
            />
            <p className="text-lightGreen">Back</p>
          </div>
        </div>
      </div>

      <div className="baseVertFlex mt-4 gap-4">
        <div
          style={{
            gridTemplateColumns: "minmax(204px, auto) auto",
          }}
          className="mt-4 grid grid-cols-2 gap-4"
        >
          <Label
            htmlFor="squeakPileOnLeft"
            className="self-center justify-self-start"
          >
            Show Squeak Pile on left
          </Label>
          <Switch
            id="squeakPileOnLeft"
            disabled={saveButtonText !== "Save"}
            checked={localPlayerSettings.squeakPileOnLeft}
            onCheckedChange={() =>
              setLocalPlayerSettings((prevSettings) => ({
                ...prevSettings,
                squeakPileOnLeft: !prevSettings.squeakPileOnLeft,
              }))
            }
            className="self-center"
          />
        </div>

        <div
          style={{
            gridTemplateColumns: "minmax(204px, auto) auto",
          }}
          className="grid grid-cols-2 items-center gap-4"
        >
          <Label
            htmlFor="enableDesktopNotifications"
            className="justify-self-start"
          >
            Enable desktop notifications
          </Label>
          <Switch
            id="enableDesktopNotifications"
            disabled={saveButtonText !== "Save"}
            checked={localPlayerSettings.desktopNotifications}
            onCheckedChange={() => {
              Notification.requestPermission().then((result) => {
                if (result === "granted") {
                  setLocalPlayerSettings((prevSettings) => ({
                    ...prevSettings,
                    desktopNotifications: !prevSettings.desktopNotifications,
                  }));
                }
              });
            }}
            className="self-center"
          />
        </div>
      </div>

      <AlertDialog open={showDeleteUserDialog}>
        <AlertDialogTrigger asChild>
          <Button
            variant={"destructive"}
            disabled={saveButtonText !== "Save"}
            className={`baseFlex !absolute right-[-19px] top-[-19px] min-w-[36px] !px-2 transition-all ${hoveringOnDeleteButton ? "gap-2" : "gap-0"} `}
            onMouseEnter={() => setHoveringOnDeleteButton(true)}
            onMouseLeave={() => setHoveringOnDeleteButton(false)}
            onClick={() => setShowDeleteUserDialog(true)}
          >
            <FaTrashAlt />
            <AnimatePresence>
              {hoveringOnDeleteButton && (
                <motion.div
                  key={"deleteAccountText"}
                  initial={{
                    opacity: 0,
                    width: 0,
                  }}
                  animate={{
                    opacity: 1,
                    width: "auto",
                  }}
                  exit={{
                    opacity: 0,
                    width: 0,
                  }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="text-sm"
                >
                  Delete account
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogTitle className="font-semibold">
            Delete account
          </AlertDialogTitle>

          <AlertDialogDescription className="baseVertFlex mb-8 gap-4">
            <p>
              Are you sure you want to delete your account? This action is
              <span className="font-semibold italic"> irreversible</span> and
              all of your data will be lost.
            </p>
          </AlertDialogDescription>

          <AlertDialogFooter className="baseFlex w-full !flex-row !justify-between gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteUserDialog(false)}
              className="!px-4"
            >
              Cancel
            </Button>
            <Button
              variant={"destructive"}
              disabled={deleteButtonText !== "Delete account"}
              onClick={() => {
                setDeleteButtonText("Deleting account");
                deleteUser(userID);
              }}
            >
              <AnimatePresence mode={"popLayout"} initial={false}>
                <motion.div
                  key={deleteButtonText}
                  layout
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{
                    duration: 0.25,
                  }}
                  className="baseFlex gap-2"
                >
                  <FaTrashAlt />

                  {deleteButtonText}

                  {deleteButtonText === "Deleting account" && (
                    <div
                      className="text-offwhite inline-block size-4 animate-spin rounded-full border-[2px] border-white border-t-transparent"
                      role="status"
                      aria-label="loading"
                    >
                      <span className="sr-only">Loading...</span>
                    </div>
                  )}
                  {deleteButtonText === "Account deleted" && (
                    <svg
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      className="text-offwhite size-4"
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
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

export default Settings;
