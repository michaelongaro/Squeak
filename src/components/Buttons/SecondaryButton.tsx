import { useRef, useState } from "react";
import { GiClubs, GiDiamonds, GiHearts, GiSpades } from "react-icons/gi";

interface ISecondaryButton {
  extraPadding: boolean;
  innerText?: string;
  onClickFunction?: () => void;
  showLoadingSpinnerOnClick?: boolean;
  hoverTooltipText?: string;
  hoverTooltipTextPosition?: "left" | "bottom";
  postClickTooltipText?: string;
  hoverTooltipTextTop?: string;
  width?: string;
  height?: string;
  forceHover?: boolean;
  disabled?: boolean;
  icon?: JSX.Element;
  iconOnLeft?: boolean;
  rotateIcon?: boolean;
  style?: React.CSSProperties;
}

function SecondaryButton({
  innerText,
  disabled = false,
  showLoadingSpinnerOnClick = false,
  width,
  height,
  forceHover,
  hoverTooltipText,
  postClickTooltipText,
  hoverTooltipTextPosition,
  hoverTooltipTextTop,
  icon,
  iconOnLeft,
  rotateIcon,
  extraPadding,
  style,
  onClickFunction,
}: ISecondaryButton) {
  const [hoveringOnButton, setHoveringOnButton] = useState<boolean>(false);
  const [brightness, setBrightness] = useState<number>(1);
  const [showLoadingSpinner, setShowLoadingSpinner] = useState<boolean>(false);
  const [tempDisabled, setTempDisabled] = useState<boolean>(false);
  const [showPostClickTooltipText, setShowPostClickTooltipText] =
    useState<boolean>(false);

  const openToLeftTooltipRef = useRef<HTMLDivElement>(null);

  const dynamicOpacity =
    disabled || tempDisabled
      ? hoveringOnButton || forceHover
        ? 0.35
        : 0.25
      : 1;

  return (
    <button
      style={{
        borderColor:
          hoveringOnButton || forceHover
            ? `hsl(120deg 100% 18% / ${dynamicOpacity})`
            : `hsl(120deg 100% 86% / ${dynamicOpacity})`,
        backgroundColor:
          hoveringOnButton || forceHover
            ? `hsl(120deg 100% 86% / ${dynamicOpacity})`
            : `hsl(120deg 100% 18% / ${dynamicOpacity})`,
        color:
          hoveringOnButton || forceHover
            ? `hsl(120deg 100% 18% / ${dynamicOpacity})`
            : `hsl(120deg 100% 86% / ${dynamicOpacity})`,
        filter: `brightness(${brightness})`,
        padding: extraPadding ? "1.15rem 1.5rem" : "0.5rem",
        width: width ?? "100%",
        height: height ?? "100%",
        cursor: disabled || tempDisabled ? "not-allowed" : "pointer",
        ...style,
      }}
      className="baseFlex relative h-full w-full gap-2 rounded-md border-2 transition-all"
      onPointerEnter={() => setHoveringOnButton(true)}
      onPointerLeave={() => {
        setHoveringOnButton(false);
        setBrightness(1);
      }}
      onPointerDown={() => setBrightness(0.75)}
      onPointerUp={() => setBrightness(1)}
      onClick={() => {
        if (disabled) return;

        if (showLoadingSpinnerOnClick) {
          setShowLoadingSpinner(true);
          setTempDisabled(true);

          setTimeout(() => {
            setShowLoadingSpinner(false);
            setTempDisabled(false);
            onClickFunction?.();
          }, 1000);
        } else {
          onClickFunction?.();
          if (postClickTooltipText) {
            setShowPostClickTooltipText(true);
            setTimeout(() => {
              setShowPostClickTooltipText(false);
            }, 1000);
          }
        }
      }}
    >
      {extraPadding && (
        <>
          <GiClubs
            size={"0.9rem"}
            style={{
              position: "absolute",
              color: "hsl(120deg 100% 18%)",
              left: "0.25rem",
              top: "0.25rem",
              transform: "rotate(315deg)",
              opacity: hoveringOnButton || forceHover ? 1 : 0,
            }}
          />
          <GiDiamonds
            size={"0.9rem"}
            style={{
              position: "absolute",
              color: "hsl(120deg 100% 18%)",
              right: "0.25rem",
              top: "0.25rem",
              transform: "rotate(45deg)",
              opacity: hoveringOnButton || forceHover ? 1 : 0,
            }}
          />
          <GiHearts
            size={"0.9rem"}
            style={{
              position: "absolute",
              color: "hsl(120deg 100% 18%)",
              left: "0.25rem",
              bottom: "0.25rem",
              transform: "rotate(225deg)",
              opacity: hoveringOnButton || forceHover ? 1 : 0,
            }}
          />
          <GiSpades
            size={"0.9rem"}
            style={{
              position: "absolute",
              color: "hsl(120deg 100% 18%)",
              right: "0.25rem",
              bottom: "0.25rem",
              transform: "rotate(135deg)",
              opacity: hoveringOnButton || forceHover ? 1 : 0,
            }}
          />
        </>
      )}

      {iconOnLeft && icon && (
        <div
          style={{
            transform: rotateIcon ? "rotate(540deg)" : "rotate(0deg)",
            transition: "transform 0.5s ease-in-out",
          }}
        >
          {icon}
        </div>
      )}
      {innerText}
      {!iconOnLeft && !showLoadingSpinner && icon && (
        <div
          style={{
            transform: rotateIcon ? "rotate(540deg)" : "rotate(0deg)",
            transition: "transform 0.5s ease-in-out",
          }}
        >
          {icon}
        </div>
      )}
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
          data-testid="loadingSpinner"
        ></div>
      )}

      {hoverTooltipText && hoverTooltipTextPosition === "bottom" && (
        <div
          style={{
            top: hoverTooltipTextTop ?? "100%",
            left: "50%",
            transform: "translate(-50%, 0.5rem)",
            background: "hsl(120deg 100% 18%)",
            color: "hsl(120deg 100% 86%)",
            border: "1px solid white",
            opacity: hoveringOnButton || forceHover ? 1 : 0,
            transition: "opacity 0.15s ease-in-out",
          }}
          className="pointer-events-none absolute min-h-max min-w-max rounded-md p-2 shadow-2xl"
        >
          {showPostClickTooltipText ? postClickTooltipText : hoverTooltipText}
        </div>
      )}

      {hoverTooltipText && hoverTooltipTextPosition === "left" && disabled && (
        <div
          ref={openToLeftTooltipRef}
          style={{
            left: openToLeftTooltipRef.current
              ? `${
                  (openToLeftTooltipRef.current.getBoundingClientRect().width +
                    15) *
                  -1
                }px`
              : "50%",
            background: "hsl(120deg 100% 18%)",
            color: "hsl(120deg 100% 86%)",
            border: "1px solid white",
            opacity: hoveringOnButton || forceHover ? 1 : 0,
            transition: "opacity 0.15s ease-in-out",
          }}
          className="pointer-events-none absolute min-h-max min-w-max rounded-md p-2 shadow-2xl"
        >
          {showPostClickTooltipText ? postClickTooltipText : hoverTooltipText}
        </div>
      )}
    </button>
  );
}

export default SecondaryButton;
