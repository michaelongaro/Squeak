import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SecondaryButton from "./SecondaryButton";

interface IDangerButton {
  innerText?: string;
  innerTooltipText?: string;
  relativeTooltipPosition?: "top" | "bottom" | "left" | "right";
  onClickFunction?: () => void;
  showLoadingSpinnerOnClick?: boolean;
  width?: string;
  height?: string;
  icon?: JSX.Element;
  style?: React.CSSProperties;
}

function DangerButton({
  innerText,
  innerTooltipText,
  relativeTooltipPosition,
  showLoadingSpinnerOnClick = false,
  width,
  height,
  icon,
  style,
  onClickFunction,
}: IDangerButton) {
  const [hoveringOnButton, setHoveringOnButton] = useState<boolean>(false);
  const [brightness, setBrightness] = useState<number>(1);
  const [showLoadingSpinner, setShowLoadingSpinner] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const [tempDisabled, setTempDisabled] = useState<boolean>(false);

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
        ...style,
      }}
      className="baseFlex relative cursor-pointer gap-2 rounded-md border-2 p-2 transition-all"
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
        // if (showLoadingSpinnerOnClick) {
        //   setShowLoadingSpinner(true);
        //   setTempDisabled(true);

        //   setTimeout(() => {
        //     setShowLoadingSpinner(false);
        //     setTempDisabled(false);
        //     onClickFunction?.();
        //   }, 1500);
        // } else {
        //   onClickFunction?.();
        // }
        if (innerTooltipText && !showTooltip) {
          setShowTooltip(true);
        } else {
          onClickFunction?.();
        }
      }}
    >
      <AnimatePresence
        initial={false}
        mode={"wait"}
        onExitComplete={() => null}
      >
        {showTooltip && (
          <motion.div
            key={innerTooltipText}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            // left and top... hmm + tooltip triangle (add class)

            style={{
              backgroundColor: "hsl(0, 84%, 95%)",
              borderColor: "hsl(0, 84%, 50%)",
              color: "hsl(0, 84%, 50%)",
              left:
                relativeTooltipPosition === "bottom" // currently only supporting left/bottom
                  ? "-60px"
                  : "-150px", // guesstimates
              top: relativeTooltipPosition === "bottom" ? "32px" : "-45px", // guesstimates
            }}
            className="baseVertFlex absolute cursor-default gap-2 rounded-md border-2 p-2 shadow-md"
          >
            {innerTooltipText}
            <div className="baseFlex gap-2">
              <DangerButton
                innerText="Confirm"
                width={"4rem"}
                height={"2.5rem"}
                onClickFunction={() => {
                  onClickFunction;
                }}
                // style={{
                //   padding: "0.5rem",
                // }}
              />
              <SecondaryButton innerText="Deny" extraPadding={false} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!innerTooltipText && innerText}
      {!showLoadingSpinner && icon}
      {showLoadingSpinner && (
        <div
          style={{
            width: "1.5rem",
            height: "1.5rem",
            borderTop: `0.35rem solid hsla(120deg, 100%, ${
              hoveringOnButton ? "18%" : "86%"
            }, 40%)`,
            borderRight: `0.35rem solid hsla(120deg, 100%, ${
              hoveringOnButton ? "18%" : "86%"
            }, 40%)`,
            borderBottom: `0.35rem solid hsla(120deg, 100%, ${
              hoveringOnButton ? "18%" : "86%"
            }, 40%)`,
            borderLeft: `0.35rem solid hsl(120deg 100% ${
              hoveringOnButton ? "18%" : "86%"
            })`,
          }}
          className="loadingSpinner"
        ></div>
      )}
    </button>
  );
}

export default DangerButton;
