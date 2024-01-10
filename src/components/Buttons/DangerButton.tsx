import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SecondaryButton from "./SecondaryButton";
import { IoClose } from "react-icons/io5";

interface IDangerButton {
  innerText?: string;
  innerTooltipText?: string;
  forFriendsList?: boolean;
  setShowingDeleteFriendConfirmationModal?: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  onClickFunction?: () => void;
  showLoadingSpinnerOnClick?: boolean;
  hoverTooltipText?: string;
  width?: string;
  height?: string;
  icon?: JSX.Element;
  style?: React.CSSProperties;
}

function DangerButton({
  innerText,
  innerTooltipText,
  forFriendsList,
  setShowingDeleteFriendConfirmationModal,
  hoverTooltipText,
  width,
  height,
  icon,
  style,
  onClickFunction,
}: IDangerButton) {
  const [hoveringOnButton, setHoveringOnButton] = useState<boolean>(false);
  const [brightness, setBrightness] = useState<number>(1);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  return (
    <button
      style={{
        // can replace below with tailwind classes (hover: active:)
        borderColor: hoveringOnButton ? "hsl(0, 84%, 50%)" : "hsl(0, 84%, 60%)",
        backgroundColor: hoveringOnButton
          ? "hsl(0, 84%, 50%)"
          : "hsl(0, 84%, 95%)",
        color: hoveringOnButton ? "hsl(0, 84%, 80%)" : "hsl(0, 84%, 40%)", // bumped up to 80% from 60% to see easier
        filter: `brightness(${brightness})`,
        width: width ?? "100%",
        height: height ?? "100%",
        zIndex: showTooltip ? 999 : "auto", // temp fix for tooltip being hidden behind other elements declared after it
        ...style,
      }}
      className="relative grid cursor-pointer place-content-center gap-2 rounded-md border-2 p-2 transition-all"
      onMouseEnter={() => {
        if (!showTooltip) {
          setHoveringOnButton(true);
        }
      }}
      onMouseLeave={() => {
        if (!showTooltip) {
          setHoveringOnButton(false);
          setBrightness(1);
        }
      }}
      onMouseDown={() => {
        if (!showTooltip) {
          setBrightness(0.75);
        }
      }}
      onMouseUp={() => {
        if (!showTooltip) {
          setBrightness(1);
        }
      }}
      onClick={() => {
        if (innerTooltipText && !showTooltip) {
          setShowTooltip(true);

          if (forFriendsList && setShowingDeleteFriendConfirmationModal) {
            setShowingDeleteFriendConfirmationModal(true);
          }
        } else if (innerTooltipText === undefined) {
          onClickFunction?.();
        }
      }}
    >
      <AnimatePresence mode={"wait"}>
        {showTooltip && (
          <motion.div
            key={innerTooltipText}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              backgroundColor: "hsl(0, 84%, 95%)",
              borderColor: "hsl(0, 84%, 50%)",
              color: "hsl(0, 84%, 50%)",
              top: forFriendsList ? "50px" : "32px",
              left: forFriendsList ? "-141px" : "-60px",
              width: "max-content",
            }}
            className="baseVertFlex absolute cursor-default gap-2 rounded-md border-2 p-2 pt-8 shadow-md"
          >
            <SecondaryButton
              icon={<IoClose size={"1rem"} />}
              extraPadding={false}
              onClickFunction={() => {
                setShowTooltip(false);
                setHoveringOnButton(false);
                if (forFriendsList && setShowingDeleteFriendConfirmationModal) {
                  setShowingDeleteFriendConfirmationModal(false);
                }
              }}
              width={"1.5rem"}
              height={"1.5rem"}
              style={{
                position: "absolute",
                top: "0.25rem",
                right: "0.25rem",
              }}
            />

            {innerTooltipText}
            <div className="baseFlex gap-2">
              <DangerButton
                innerText="Confirm"
                height={"2.5rem"}
                onClickFunction={onClickFunction}
              />
              {/* <SecondaryButton
                innerText="Deny"
                extraPadding={false}
                onClickFunction={() => {
                  setShowTooltip(false);
                  setHoveringOnButton(false);
                  if (
                    forFriendsList &&
                    setShowingDeleteFriendConfirmationModal
                  ) {
                    setShowingDeleteFriendConfirmationModal(false);
                  }
                }}
              /> */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* do you need to gate on !innerTooltipText below? */}
      {!innerTooltipText && innerText}
      {icon}

      {hoverTooltipText && !showTooltip && (
        <div
          style={{
            position: "absolute",
            top: forFriendsList ? "2.25rem" : "100%",
            left: forFriendsList ? "-33px" : "50%",
            transform: "translate(-50%, 0.5rem)",
            background: "hsl(0, 84%, 95%)",
            color: "hsl(0, 84%, 40%)",
            border: "1px solid hsl(0, 84%, 60%)",
            opacity: hoveringOnButton ? 1 : 0,
            transition: "opacity 0.15s ease-in-out",
          }}
          className="pointer-events-none min-h-max min-w-max rounded-md p-2 shadow-2xl"
        >
          {hoverTooltipText}
        </div>
      )}
    </button>
  );
}

export default DangerButton;
