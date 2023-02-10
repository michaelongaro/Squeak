import { useUserIDContext } from "../../../context/UserIDContext";
import {
  type IRoomPlayersMetadata,
  type IRoomPlayer,
} from "../../../pages/api/socket";
import PickerTooltip from "../../playerIcons/PickerTooltip";
import { AnimatePresence, motion } from "framer-motion";
import { type ILocalPlayerSettings } from "./UserSettingsAndStatsModal";
import Filter from "bad-words";

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
  const { value: userID } = useUserIDContext();

  return (
    // play around with with the width, maybe not best to have hardcoded 700px?
    <div
      style={{
        color: "hsl(120deg 100% 86%)",
      }}
      className="baseVertFlex w-[700px] gap-8 bg-green-800 p-8"
    >
      <div className="baseFlex gap-2">
        <label>Username</label>
        <div className="relative">
          <input
            type="text"
            placeholder="username"
            className=" rounded-sm pl-2 text-green-800"
            maxLength={16}
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
            value={localPlayerMetadata?.[userID]?.username}
          />

          <div className="absolute top-[-0.25rem] right-1 text-xl text-red-600">
            *
          </div>

          <AnimatePresence>
            {usernameIsProfane && (
              <motion.div
                key={"joinRoomProfanityWarning"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                  right: "-252px",
                  color: "hsl(120deg 100% 86%)",
                }}
                className="baseVertFlex absolute top-0 gap-2 rounded-md border-2 border-red-700 bg-green-700 pt-2 pb-2 pr-1 pl-1 shadow-md"
              >
                <div>Profanity detected,</div>
                <div className="text-center">please change your username</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="baseFlex gap-12">
        <PickerTooltip
          type={"avatar"}
          localPlayerMetadata={localPlayerMetadata}
          setLocalPlayerMetadata={setLocalPlayerMetadata}
        />
        <PickerTooltip
          type={"color"}
          localPlayerMetadata={localPlayerMetadata}
          setLocalPlayerMetadata={setLocalPlayerMetadata}
        />
      </div>

      <div className="baseFlex mt-4 gap-2">
        <label>Show Squeak Pile on left</label>
        <input
          className="h-[1.15rem] w-[1.15rem] cursor-pointer"
          aria-label="toggle squeak pile location between left and right"
          type="checkbox"
          checked={localPlayerSettings.squeakPileOnLeft}
          onChange={() =>
            setLocalPlayerSettings((prevSettings) => ({
              ...prevSettings,
              squeakPileOnLeft: !prevSettings.squeakPileOnLeft,
            }))
          }
        />
      </div>

      <div className="baseFlex gap-2">
        <label>Enable desktop notifications</label>
        <input
          className="h-[1.15rem] w-[1.15rem] cursor-pointer"
          aria-label="toggle desktop notifications"
          type="checkbox"
          checked={localPlayerSettings.desktopNotifications}
          onChange={() =>
            setLocalPlayerSettings((prevSettings) => ({
              ...prevSettings,
              desktopNotifications: !prevSettings.desktopNotifications,
            }))
          }
        />
      </div>
    </div>
  );
}

export default Settings;
