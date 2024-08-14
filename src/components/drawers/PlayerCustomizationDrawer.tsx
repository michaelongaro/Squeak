import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { FaPaintRoller } from "react-icons/fa";
import { Button } from "~/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerPortal,
  DrawerTrigger,
} from "~/components/ui/drawer";
import { useRoomContext } from "~/context/RoomContext";
import PlayerCustomizationPicker from "../playerIcons/PlayerCustomizationPicker";
import PlayerCustomizationPreview from "../playerIcons/PlayerCustomizationPreview";
import { IoIosArrowForward } from "react-icons/io";

const viewLabels = ["avatar", "front", "back"] as const;

function PlayerCustomizationDrawer() {
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
    <Drawer onOpenChange={() => setRenderedView(undefined)}>
      <DrawerTrigger asChild>
        <Button variant="secondary" className="gap-2 !px-4">
          Customize
          <FaPaintRoller className="size-4" />
        </Button>
      </DrawerTrigger>
      <DrawerPortal>
        <DrawerContent
          style={{
            color: "hsl(120deg 100% 18%)",
            zIndex: 250,
            // height: "100%", ah this could be tricky to get right here
          }}
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
                  className="baseVertFlex h-full w-screen"
                >
                  {viewLabels.map((label) => (
                    <Button
                      key={label}
                      variant="drawer"
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
                            forDrawer
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
                    // delay: 0.3,
                  }}
                  className={
                    "baseVertFlex relative h-full w-screen bg-zinc-200"
                  }
                >
                  <Button
                    variant={"ghost"}
                    onClick={() => setRenderedView(undefined)}
                    className="baseFlex absolute left-2 top-0 gap-2 !p-0"
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
                  <PlayerCustomizationPicker type={renderedView} forDrawer />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}

export default PlayerCustomizationDrawer;
