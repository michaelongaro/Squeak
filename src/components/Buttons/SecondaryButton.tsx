import { useState } from "react";
import { GiClubs, GiDiamonds, GiHearts, GiSpades } from "react-icons/gi";

interface ISecondaryButton {
  extraPadding: boolean;
  innerText?: string;
  onClickFunction?: () => void;
  showLoadingSpinnerOnClick?: boolean;
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

  return (
    <button
      style={{
        borderColor:
          hoveringOnButton || forceHover
            ? "hsl(120deg 100% 18%)"
            : "hsl(120deg 100% 86%)",
        backgroundColor:
          hoveringOnButton || forceHover
            ? "hsl(120deg 100% 86%)"
            : "hsl(120deg 100% 18%)",
        color:
          hoveringOnButton || forceHover
            ? "hsl(120deg 100% 18%)"
            : "hsl(120deg 100% 86%)",
        filter: `brightness(${brightness})`,
        padding: extraPadding ? "1.15rem 1.5rem" : "0.5rem",
        width: width ?? "100%",
        height: height ?? "100%",
        cursor: disabled || tempDisabled ? "not-allowed" : "pointer",
        opacity: disabled || tempDisabled ? 0.25 : 1,
        ...style,
      }}
      className="baseFlex relative h-full w-full gap-2 rounded-md border-2 transition-all"
      onMouseEnter={() => setHoveringOnButton(true)}
      onMouseLeave={() => {
        setHoveringOnButton(false);
        setBrightness(1);
      }}
      onMouseDown={() => setBrightness(0.75)}
      onMouseUp={() => setBrightness(1)}
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
        }
      }}
    >
      {extraPadding && (
        <>
          <GiClubs
            size={"1rem"}
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
            size={"1rem"}
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
            size={"1rem"}
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
            size={"1rem"}
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
        ></div>
      )}
    </button>
  );
}

export default SecondaryButton;
