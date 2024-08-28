import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import PlayerCustomizationPicker from "../playerIcons/PlayerCustomizationPicker";
import PlayerCustomizationPreview from "../playerIcons/PlayerCustomizationPreview";
import { type IRoomPlayersMetadata } from "~/pages/api/socket";
import { type ILocalPlayerSettings } from "../dialogs/SettingsAndStats/UserSettingsAndStatsDialog";

interface IPlayerCustomizationPopover {
  type: "avatar" | "front" | "back";
  localPlayerMetadata?: IRoomPlayersMetadata;
  setLocalPlayerMetadata?: React.Dispatch<
    React.SetStateAction<IRoomPlayersMetadata>
  >;
  setLocalPlayerSettings?: React.Dispatch<
    React.SetStateAction<ILocalPlayerSettings>
  >;
}

function PlayerCustomizationPopover({
  type,
  localPlayerMetadata,
  setLocalPlayerMetadata,
  setLocalPlayerSettings,
}: IPlayerCustomizationPopover) {
  return (
    <Popover>
      <PopoverTrigger
        className={`transition-[filter] hover:brightness-75 ${type === "avatar" ? "pb-1" : ""}`}
      >
        <PlayerCustomizationPreview
          renderedView={type}
          renderDescriptionText={false}
          localPlayerMetadata={localPlayerMetadata}
          forCreateAndJoin
        />
      </PopoverTrigger>
      <PopoverContent>
        <PlayerCustomizationPicker
          type={type}
          localPlayerMetadata={localPlayerMetadata}
          setLocalPlayerMetadata={setLocalPlayerMetadata}
          setLocalPlayerSettings={setLocalPlayerSettings}
        />
      </PopoverContent>
    </Popover>
  );
}

export default PlayerCustomizationPopover;
