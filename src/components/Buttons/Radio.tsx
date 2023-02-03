import { useState } from "react";

interface IRadio {
  values: (string | number)[];
  onClickFunctions: (() => void)[];
}

function Radio({ values, onClickFunctions }: IRadio) {
  const [currentlySelectedIndex, setCurrentlySelectedIndex] =
    useState<number>(0); // -1 means nothing is selected
  const [hoveredOptionIndex, setHoveredOptionIndex] = useState<number>(-1);

  return (
    <div
      style={{
        borderColor: "hsl(120deg 100% 86%)",
      }}
      className="baseFlex relative h-full w-full rounded-md border-2 transition-all"
    >
      {values.map((value, index) => (
        <button
          key={value}
          style={{
            // borderColor: "hsl(120deg 100% 86%)", maybe need this?
            borderTopLeftRadius: index === 0 ? "0.250rem" : "0",
            borderBottomLeftRadius: index === 0 ? "0.25rem" : "0",
            borderTopRightRadius: index === values.length - 1 ? "0.25rem" : "0",
            borderBottomRightRadius:
              index === values.length - 1 ? "0.25rem" : "0",
            backgroundColor:
              hoveredOptionIndex === index || currentlySelectedIndex === index
                ? "hsl(120deg 100% 86%)"
                : "hsl(120deg 100% 18%)",
            color:
              hoveredOptionIndex === index || currentlySelectedIndex === index
                ? "hsl(120deg 100% 18%)"
                : "hsl(120deg 100% 86%)",
            padding: "0.5rem", // on .map elems
            // maxWidth: extraPadding ? "100%" : "40px", // on .map elems
          }}
          className="relative h-full w-full  transition-all"
          onMouseEnter={() => setHoveredOptionIndex(index)}
          onMouseLeave={() => setHoveredOptionIndex(-1)}
          onClick={() => {
            setCurrentlySelectedIndex(index);
            onClickFunctions[index]?.();
          }} // prob will have an issue with "() =>"
        >
          {value}
        </button>
      ))}
    </div>
  );
}

export default Radio;
