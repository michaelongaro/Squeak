import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { FaPaintRoller } from "react-icons/fa";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetPortal,
  SheetTrigger,
} from "~/components/ui/sheet";
import { useRoomContext } from "~/context/RoomContext";
import PlayerCustomizationPicker from "../playerIcons/PlayerCustomizationPicker";
import PlayerCustomizationPreview from "../playerIcons/PlayerCustomizationPreview";
import { IoIosArrowForward } from "react-icons/io";

const viewLabels = ["avatar", "front", "back"] as const;

function PlayerCustomizationSheet() {
  const { playerMetadata } = useRoomContext();

  const [renderedView, setRenderedView] = useState<
    "avatar" | "front" | "back"
  >();

  function getRenderedViewHeight() {
    switch (renderedView) {
      case "avatar":
        return "350px";
      case "front":
        return "225px";
      case "back":
        return "430px";
      default:
        return "250px";
    }
  }

  return (
    <Sheet onOpenChange={() => setRenderedView(undefined)}>
      <SheetTrigger asChild>
        <Button variant="secondary" className="gap-2 !px-4">
          Customize
          <FaPaintRoller className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetPortal>
        <SheetContent
          style={{
            zIndex: 250,
            // height: "100%", ah this could be tricky to get right here
          }}
          className="text-darkGreen"
        >
          <div
            style={{
              height: getRenderedViewHeight(),
              transition: "height 0.3s ease-in-out",
            }}
            className="baseVertFlex w-full"
          >
            {/* main three buttons */}
            <AnimatePresence mode="popLayout" initial={false}>
              {renderedView === undefined && (
                <motion.div
                  key="mainButtons"
                  initial={{ opacity: 0, translateX: "-100%" }}
                  animate={{ opacity: 1, translateX: "0%" }}
                  exit={{ opacity: 0, translateX: "-100%" }}
                  transition={{
                    duration: 0.3,
                  }}
                  className="baseVertFlex h-full w-full"
                >
                  {viewLabels.map((label) => (
                    <Button
                      key={label}
                      variant="sheet"
                      style={{
                        borderTopWidth: label === "avatar" ? "0px" : "1px",
                      }}
                      showArrow
                      className="baseFlex h-full w-full !justify-start"
                      onClick={() => setRenderedView(label)}
                    >
                      {playerMetadata && (
                        <motion.div
                          key={`${label}PickerPreview`}
                          initial={{ opacity: 0, scale: 0.75 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.75 }}
                          transition={{ duration: 0.15 }}
                          className="baseFlex color-lightGreen h-[96px] cursor-pointer gap-4 border-darkGreen"
                        >
                          <PlayerCustomizationPreview
                            renderedView={label}
                            useDarkerFont
                            transparentAvatarBackground
                            forSheet
                          />
                        </motion.div>
                      )}
                    </Button>
                  ))}
                </motion.div>
              )}

              {/* inner content "views" */}
              {renderedView !== undefined && (
                <motion.div
                  key={`${renderedView}Picker`}
                  initial={{ opacity: 0, translateX: "100%" }}
                  animate={{ opacity: 1, translateX: "0%" }}
                  exit={{ opacity: 0, translateX: "100%" }}
                  transition={{
                    duration: 0.3,
                  }}
                  className={"baseVertFlex relative h-full w-full bg-zinc-200"}
                >
                  <Button
                    variant={"text"}
                    onClick={() => setRenderedView(undefined)}
                    className="baseFlex !absolute left-2 top-0 gap-2 !p-0 text-darkGreen"
                  >
                    <IoIosArrowForward size={"1rem"} className="rotate-180" />
                    Back
                  </Button>
                  <p className="text-lg font-semibold underline underline-offset-2">
                    {renderedView === "avatar"
                      ? "Avatar"
                      : renderedView === "front"
                        ? "Card front"
                        : "Card back"}
                  </p>
                  <PlayerCustomizationPicker type={renderedView} forSheet />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </SheetContent>
      </SheetPortal>
    </Sheet>
  );
}

export default PlayerCustomizationSheet;
