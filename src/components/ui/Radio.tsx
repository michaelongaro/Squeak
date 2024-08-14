import { useState } from "react";

import { Button } from "~/components/ui/button";

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
  // didn't make a special button variant for "radio" since it bloated up the optional
  // params for the button component too much, this is fine for now

  return (
    <div
      style={{
        borderColor: "hsl(120deg 100% 86%)",
      }}
      className={`baseFlex relative h-full w-full snap-x snap-mandatory !justify-start overflow-x-auto rounded-md border-2 transition-all`}
    >
      {values.map((value, index) => (
        <RadioButton
          key={value}
          values={values}
          currentValueIndex={currentValueIndex}
          onClickFunction={onClickFunctions[index]!}
          disabledIndicies={disabledIndicies}
          minHeight={minHeight}
          forMobileLeaderboard={forMobileLeaderboard}
          value={value}
          index={index}
        />
      ))}
    </div>
  );
}

export default Radio;

interface IRadioButton {
  values: (string | number)[];
  currentValueIndex: number;
  onClickFunction: () => void;
  disabledIndicies?: number[];
  minHeight?: string;
  forMobileLeaderboard?: boolean;
  value: string | number;
  index: number;
}

function RadioButton({
  values,
  currentValueIndex,
  onClickFunction,
  disabledIndicies,
  minHeight,
  forMobileLeaderboard,
  value,
  index,
}: IRadioButton) {
  const [hoveredOptionIndex, setHoveredOptionIndex] = useState<number>(-1);
  const [brightness, setBrightness] = useState<number>(1);

  return (
    <Button
      key={value}
      disabled={disabledIndicies?.includes(index)}
      onPointerDown={() => setBrightness(0.75)}
      onPointerUp={() => setBrightness(1)}
      onPointerEnter={() => setHoveredOptionIndex(index)}
      onPointerLeave={() => {
        setBrightness(1);
        setHoveredOptionIndex(-1);
      }}
      onTouchStart={() => setBrightness(0.75)}
      onTouchEnd={() => setBrightness(1)}
      onTouchCancel={() => setBrightness(1)}
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
        filter: `brightness(${brightness})`,
      }}
      className={`relative h-full snap-center text-wrap rounded-none border-x text-sm transition-all first:border-l-0 last:border-r-0 tablet:min-w-fit`}
      onClick={() => onClickFunction()}
    >
      {value}
    </Button>
  );
}
