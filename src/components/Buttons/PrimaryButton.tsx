import { useState } from "react";

interface IPrimaryButton {
  innerText?: string;
  onClickFunction?: () => void;
  showLoadingSpinnerOnClick?: boolean;
  width?: string;
  height?: string;
  disabled?: boolean;
  icon?: JSX.Element;
  iconOnLeft?: boolean;
}

function PrimaryButton({
  innerText,
  disabled = false,
  showLoadingSpinnerOnClick = false,
  width,
  height,
  icon,
  iconOnLeft,
  onClickFunction,
}: IPrimaryButton) {
  const [hoveringOnButton, setHoveringOnButton] = useState<boolean>(false);
  const [brightness, setBrightness] = useState<number>(1);
  const [showLoadingSpinner, setShowLoadingSpinner] = useState<boolean>(false);
  const [tempDisabled, setTempDisabled] = useState<boolean>(false);

  return (
    <button
      style={{
        borderColor: hoveringOnButton
          ? "hsl(120deg 100% 86%)"
          : "hsl(120deg 100% 18%)",
        backgroundColor: hoveringOnButton
          ? "hsl(120deg 100% 18%)"
          : "hsl(120deg 100% 86%)",
        color: hoveringOnButton
          ? "hsl(120deg 100% 86%)"
          : "hsl(120deg 100% 18%)",
        filter: `brightness(${brightness})`,
        padding: "1.15rem 1.5rem",
        width: width ?? "100%",
        height: height ?? "100%",
        cursor: disabled || tempDisabled ? "not-allowed" : "pointer",
        opacity: disabled || tempDisabled ? 0.25 : 1,
      }}
      className="baseFlex relative gap-2 rounded-md border-2 transition-all"
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
          }, 1500);
        } else {
          onClickFunction?.();
        }
      }}
    >
      {iconOnLeft && icon}
      {innerText}
      {!iconOnLeft && !showLoadingSpinner && icon}
      {showLoadingSpinner && (
        <div
          style={{
            width: "1.5rem",
            height: "1.5rem",
            borderTop: `0.35rem solid hsla(120deg, 100%, ${
              hoveringOnButton ? "86%" : "18%"
            }, 40%)`,
            borderRight: `0.35rem solid hsla(120deg, 100%, ${
              hoveringOnButton ? "86%" : "18%"
            }, 40%)`,
            borderBottom: `0.35rem solid hsla(120deg, 100%, ${
              hoveringOnButton ? "86%" : "18%"
            }, 40%)`,
            borderLeft: `0.35rem solid hsl(120deg 100% ${
              hoveringOnButton ? "86%" : "18%"
            })`,
          }}
          className="loadingSpinner"
        ></div>
      )}
    </button>
  );
}

export default PrimaryButton;
