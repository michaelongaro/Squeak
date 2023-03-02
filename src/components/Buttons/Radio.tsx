import { useState } from "react";

interface IRadio {
  values: (string | number)[];
  currentValueIndex: number;
  onClickFunctions: (() => void)[];
  minHeight?: string;
}

function Radio({
  values,
  currentValueIndex,
  onClickFunctions,
  minHeight,
}: IRadio) {
  const [hoveredOptionIndex, setHoveredOptionIndex] = useState<number>(-1);

  return (
    <div
      style={{
        borderColor: "hsl(120deg 100% 86%)",
      }}
      className={`baseFlex relative h-full w-full ${
        minHeight && "flex-wrap"
      } rounded-md border-2 transition-all lg:flex-nowrap`}
    >
      {values.map((value, index) => (
        <button
          key={value}
          style={{
            borderTopLeftRadius: index === 0 ? "0.250rem" : "0",
            borderBottomLeftRadius: index === 0 ? "0.25rem" : "0",
            borderTopRightRadius: index === values.length - 1 ? "0.25rem" : "0",
            borderBottomRightRadius:
              index === values.length - 1 ? "0.25rem" : "0",
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
          className="relative h-full w-full transition-all"
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
