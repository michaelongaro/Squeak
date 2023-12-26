import { useState } from "react";

import classes from "./Radio.module.css";

interface IRadio {
  values: (string | number)[];
  currentValueIndex: number;
  onClickFunctions: (() => void)[];
  orientation?: "horizontal" | "vertical";
  minHeight?: string;
}

function Radio({
  values,
  currentValueIndex,
  onClickFunctions,
  orientation = "horizontal",
  minHeight,
}: IRadio) {
  const [hoveredOptionIndex, setHoveredOptionIndex] = useState<number>(-1);

  // do same for vertical

  return (
    <div
      style={{
        borderColor: "hsl(120deg 100% 86%)",
      }}
      className={`${
        orientation === "horizontal" ? classes.horizontal : classes.vertical
      } baseFlex relative h-full w-full ${
        minHeight && "flex-wrap"
      } overflow-clip rounded-md border-2 transition-all lg:flex-nowrap`}
    >
      {values.map((value, index) => (
        <button
          key={value}
          style={{
            borderColor: "hsl(120deg 100% 86%)",
            borderLeft:
              orientation === "horizontal" && index !== 0
                ? "1px solid hsl(120deg 100% 86%)"
                : "none",
            borderRight:
              orientation === "horizontal" && index !== values.length - 1
                ? "1px solid hsl(120deg 100% 86%)"
                : "none",
            backgroundColor:
              hoveredOptionIndex === index || currentValueIndex === index
                ? "hsl(120deg 100% 86%)"
                : "hsl(120deg 100% 18%)",
            color:
              hoveredOptionIndex === index || currentValueIndex === index
                ? "hsl(120deg 100% 18%)"
                : "hsl(120deg 100% 86%)",
            padding: "0.5rem",
            height: minHeight ?? "100%",
          }}
          className={`${classes.radioButton} relative h-full w-full text-sm ${
            orientation === "horizontal" ? "border-x" : "border-y"
          } transition-all`}
          onMouseEnter={() => setHoveredOptionIndex(index)}
          onMouseLeave={() => setHoveredOptionIndex(-1)}
          onClick={() => {
            onClickFunctions[index]?.();
          }}
        >
          {value}
        </button>
      ))}
    </div>
  );
}

export default Radio;
