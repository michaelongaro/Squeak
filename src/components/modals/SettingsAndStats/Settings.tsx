import { useState } from "react";
import { useUserIDContext } from "../../../context/UserIDContext";
import {
  type IRoomPlayersMetadata,
  type IRoomPlayer,
} from "../../../pages/api/socket";
import { AnimatePresence, motion } from "framer-motion";
import { type ILocalPlayerSettings } from "./UserSettingsAndStatsModal";
import Filter from "bad-words";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import PlayerCustomizationPopover from "~/components/popovers/PlayerCustomizationPopover";

const filter = new Filter();

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
}

function Settings({
  localPlayerMetadata,
  setLocalPlayerMetadata,
  localPlayerSettings,
  setLocalPlayerSettings,
  usernameIsProfane,
  setUsernameIsProfane,
}: ISettings) {
  const userID = useUserIDContext();

  const [focusedInInput, setFocusedInInput] = useState<boolean>(false);

  return (
    <div
      style={{
        color: "hsl(120deg 100% 86%)",
      }}
      className="baseVertFlex w-[700px] gap-8 bg-green-800 p-8"
    >
      <div className="baseFlex gap-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <Input
            id="username"
            type="text"
            placeholder="username"
            maxLength={16}
            onFocus={() => setFocusedInInput(true)}
            onBlur={() => setFocusedInInput(false)}
            onChange={(e) => {
              setUsernameIsProfane(filter.isProfane(e.target.value));

              setLocalPlayerMetadata((prevMetadata) => ({
                ...prevMetadata,
                [userID]: {
                  ...prevMetadata?.[userID],
                  username: e.target.value,
                } as IRoomPlayer,
              }));
            }}
            value={localPlayerMetadata[userID]?.username}
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
                style={{
                  right: "-255px",
                  color: "hsl(120deg 100% 86%)",
                }}
                className="baseVertFlex absolute top-0 gap-2 rounded-md border-2 border-red-700 bg-green-700 pb-2 pl-1 pr-1 pt-2 shadow-md"
              >
                <div>Username not allowed,</div>
                <div className="text-center">please choose another one</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="baseFlex gap-12">
        <div className="baseVertFlex gap-2">
          <PlayerCustomizationPopover
            type={"avatar"}
            localPlayerMetadata={localPlayerMetadata}
            setLocalPlayerMetadata={setLocalPlayerMetadata}
          />
          <p className="mt-[0.25rem] text-lightGreen">Avatar</p>
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
  );
}

export default Settings;
