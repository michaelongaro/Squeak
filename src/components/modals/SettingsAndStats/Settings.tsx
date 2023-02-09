import React from "react";
import { useUserIDContext } from "../../../context/UserIDContext";
import {
  type IRoomPlayersMetadata,
  type IRoomPlayer,
} from "../../../pages/api/socket";
import PickerTooltip from "../../playerIcons/PickerTooltip";
import { type ILocalPlayerSettings } from "./UserSettingsAndStatsModal";

interface ISettings {
  localPlayerMetadata: IRoomPlayersMetadata;
  setLocalPlayerMetadata: React.Dispatch<
    React.SetStateAction<IRoomPlayersMetadata>
  >;
  localPlayerSettings: ILocalPlayerSettings;
  setLocalPlayerSettings: React.Dispatch<
    React.SetStateAction<ILocalPlayerSettings>
  >;
}

function Settings({
  localPlayerMetadata,
  setLocalPlayerMetadata,
  localPlayerSettings,
  setLocalPlayerSettings,
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
        <input
          type="text"
          placeholder="username"
          className=" rounded-sm pl-2 text-green-800"
          maxLength={16}
          onChange={(e) => {
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
