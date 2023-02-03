import { useState } from "react";

interface IPrimaryButton {
  innerText?: string;
  onClickFunction?: () => void;
  width?: string;
  height?: string;
  disabled?: boolean;
  icon?: JSX.Element;
  iconOnLeft?: boolean;
}

function PrimaryButton({
  innerText,
  disabled = false,
  width,
  height,
  icon,
  iconOnLeft,
  onClickFunction,
}: IPrimaryButton) {
  const [hoveringOnButton, setHoveringOnButton] = useState<boolean>(false);

  // maybe still show some kind of darkening when hovering over a disabled button

  // probably want a slightly darker than "86%" lightness? play around

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
        padding: "1.15rem 1.5rem",
        width: width ?? "100%",
        height: height ?? "100%",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.25 : 1,
      }}
      className="baseFlex relative gap-2 rounded-md border-2 transition-all"
      onMouseEnter={() => setHoveringOnButton(true)}
      onMouseLeave={() => setHoveringOnButton(false)}
      onClick={() => {
        if (disabled) return;
        onClickFunction?.();
      }} // prob will have an issue with "() =>"
    >
      {iconOnLeft && icon}
      {innerText}
      {!iconOnLeft && icon}
    </button>
  );
}

export default PrimaryButton;
