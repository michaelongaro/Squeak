import { useState } from "react";

import classes from "./Radio.module.css";

interface IRadio {
  values: (string | number)[];
  currentValueIndex: number;
  onClickFunctions: (() => void)[];
  disabledIndicies?: number[];
  minHeight?: string;
  forMobileLeaderboard?: boolean;
}

function Radio({
  values,
  currentValueIndex,
  onClickFunctions,
  disabledIndicies,
  minHeight,
  forMobileLeaderboard,
}: IRadio) {
  const [hoveredOptionIndex, setHoveredOptionIndex] = useState<number>(-1);

  return (
    <div
      style={{
        borderColor: "hsl(120deg 100% 86%)",
      }}
      className={`${classes.horizontal} baseFlex relative h-full w-full snap-x snap-mandatory !justify-start overflow-x-auto rounded-md border-2 transition-all`}
    >
      {values.map((value, index) => (
        <button
          key={value}
          disabled={disabledIndicies?.includes(index)}
          style={{
            borderColor: "hsl(120deg 100% 86%)",
            borderLeft: index !== 0 ? "1px solid hsl(120deg 100% 86%)" : "none",
            borderRight:
              index !== values.length - 1
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
            width: "100%",
            minWidth: forMobileLeaderboard ? "150px" : "auto",
          }}
          className={`${classes.radioButton} relative h-full snap-center border-x text-sm transition-all tablet:min-w-fit`}
          onPointerEnter={() => setHoveredOptionIndex(index)}
          onPointerLeave={() => setHoveredOptionIndex(-1)}
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
