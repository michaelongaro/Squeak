import { useState } from "react";
import { GiClubs, GiDiamonds, GiHearts, GiSpades } from "react-icons/gi";

interface ISecondaryButton {
  extraPadding: boolean;
  innerText?: string;
  onClickFunction?: () => void;
  width?: string;
  height?: string;
  forceHover?: boolean;
  disabled?: boolean;
  icon?: JSX.Element;
  iconOnLeft?: boolean;
  style?: React.CSSProperties;
}

function SecondaryButton({
  innerText,
  disabled = false,
  width,
  height,
  forceHover,
  icon,
  iconOnLeft,
  extraPadding,
  style,
  onClickFunction,
}: ISecondaryButton) {
  const [hoveringOnButton, setHoveringOnButton] = useState<boolean>(false);

  // maybe still show some kind of darkening when hovering over a disabled button

  return (
    <button
      style={{
        ...style,
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
        padding: extraPadding ? "1.15rem 1.5rem" : "0.5rem",
        width: width ?? "100%",
        height: height ?? "100%",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.25 : 1,
      }}
      className="baseFlex relative h-full w-full gap-2 rounded-md border-2 transition-all"
      onMouseEnter={() => setHoveringOnButton(true)}
      onMouseLeave={() => setHoveringOnButton(false)}
      onClick={() => {
        if (disabled) return;
        onClickFunction?.();
      }} // prob will have an issue with "() =>"
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

      {iconOnLeft && icon}
      {innerText}
      {!iconOnLeft && icon}
    </button>
  );
}

export default SecondaryButton;
