import { useState, useEffect } from "react";
import { Range, getTrackBackground } from "react-range";
import { useRoomContext } from "../../context/RoomContext";
import {
  BsFillVolumeMuteFill,
  BsFillVolumeUpFill,
  BsFillVolumeDownFill,
} from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";

interface IAudioLevelSlider {
  forMobile?: boolean;
}

function AudioLevelSlider({ forMobile }: IAudioLevelSlider) {
  const { currentVolume, setCurrentVolume } = useRoomContext();

  const [values, setValues] = useState([0.01]);
  // not the biggest fan of this workaround, but can't set range below zero..
  // and we want to have this value start at the context value (localStorage value)
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (values[0] === undefined) return;

    if (values[0] === 0.01 && currentVolume !== null) {
      setValues([currentVolume]);
      return;
    }

    if (values[0] !== 0.01 && currentVolume !== values[0]) {
      setCurrentVolume(values[0]);
    }
  }, [values, currentVolume, setCurrentVolume]);

  return (
    <div
      data-vaul-no-drag=""
      style={{
        borderColor: forMobile ? "" : "hsl(120deg 100% 86%)",
      }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className={`baseFlex !justify-start rounded-md border-2 bg-darkGreen p-2 text-lightGreen transition-all ${hovered || forMobile ? "size-full gap-2" : "size-[40px] md:h-full md:w-auto"} ${forMobile ? "" : "border-lightGreen"} `}
    >
      {(hovered || forMobile) && (
        <div className={`text-center ${forMobile ? "min-w-6" : "w-6"}`}>
          {values[0]}
        </div>
      )}

      <div
        style={{
          background: getTrackBackground({
            values: values,
            colors: ["hsl(120deg 100% 86%)", "#d4d4d8"], // lightGreen, zinc-300
            min: 0,
            max: 100,
          }),
          margin: hovered || forMobile ? "0 0.5rem" : "0",
          width: hovered || forMobile ? (forMobile ? "100%" : "9rem") : "0rem",
        }}
        className="ml-2 mr-2 h-[7px] rounded-[0.1rem] transition-all"
      >
        <Range
          aria-label="Volume slider"
          aria-orientation="horizontal"
          aria-valuemin="0"
          aria-valuemax="100"
          step={1}
          min={0}
          max={100}
          values={values}
          onChange={(values) => setValues(values)}
          renderTrack={({ props, children }) => (
            <div
              {...props}
              style={{
                ...props.style,
                height: hovered || forMobile ? "6px" : "0px",
                opacity: hovered || forMobile ? "1" : "0",
                width:
                  hovered || forMobile ? (forMobile ? "100%" : "9rem") : "0rem",
                transition: "width 0.2s",
              }}
            >
              {children}
            </div>
          )}
          renderThumb={({ props }) => (
            <div
              {...props}
              className="size-4 rounded-[0.175rem] bg-lightGreen"
            />
          )}
        />
      </div>

      <AnimatePresence mode="popLayout">
        {values[0] === 0 && (
          <motion.div
            key="muteIcon"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="baseFlex"
          >
            <BsFillVolumeMuteFill size={"1.5rem"} className="shrink-0" />
          </motion.div>
        )}
        {values[0] && values[0] > 0 && values[0] < 50 ? (
          <motion.div
            key="lowVolumeIcon"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="baseFlex"
          >
            <BsFillVolumeDownFill size={"1.5rem"} className="shrink-0" />
          </motion.div>
        ) : null}
        {values[0] && values[0] >= 50 ? (
          <motion.div
            key="highVolumeIcon"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="baseFlex"
          >
            <BsFillVolumeUpFill size={"1.5rem"} className="shrink-0" />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default AudioLevelSlider;
