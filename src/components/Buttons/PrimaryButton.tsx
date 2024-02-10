import { useState } from "react";

interface IPrimaryButton {
  innerText?: string;
  innerTextWhenLoading?: string;
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
  innerTextWhenLoading,
  disabled = false,
  showLoadingSpinnerOnClick = false,
  width,
  height,
  icon,
  iconOnLeft,
  onClickFunction,
}: IPrimaryButton) {
  const [brightness, setBrightness] = useState<number>(1);
  const [showLoadingSpinner, setShowLoadingSpinner] = useState<boolean>(false);
  const [tempDisabled, setTempDisabled] = useState<boolean>(false);

  return (
    <button
      style={{
        backgroundColor: "hsl(120deg 100% 86%)",
        color: "hsl(120deg 100% 18%)",
        filter: `brightness(${brightness})`,
        padding: "1.15rem 1.5rem",
        width: width ?? "100%",
        height: height ?? "100%",
        cursor: disabled || tempDisabled ? "not-allowed" : "pointer",
        opacity: disabled || tempDisabled ? 0.25 : 1,
      }}
      className="baseFlex relative gap-2 rounded-md transition-all"
      onPointerEnter={() => {
        setBrightness(0.9);
      }}
      onPointerLeave={() => {
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
        }
      }}
    >
      {iconOnLeft && icon}
      {showLoadingSpinner ? innerTextWhenLoading : innerText}
      {!iconOnLeft && !showLoadingSpinner && icon}
      {showLoadingSpinner && (
        <div
          style={{
            width: "1.5rem",
            height: "1.5rem",
            borderTop: `0.35rem solid hsla(120deg, 100%, 18%, 40%)`,
            borderRight: `0.35rem solid hsla(120deg, 100%, 18%, 40%)`,
            borderBottom: `0.35rem solid hsla(120deg, 100%, 18%, 40%)`,
            borderLeft: `0.35rem solid hsl(120deg, 100%, 18%)`,
          }}
          className="loadingSpinner"
        ></div>
      )}
    </button>
  );
}

export default PrimaryButton;
