import { useState, useEffect } from "react";
import { Range, getTrackBackground } from "react-range";
import { useRoomContext } from "../../context/RoomContext";
import {
  BsFillVolumeMuteFill,
  BsFillVolumeUpFill,
  BsFillVolumeDownFill,
} from "react-icons/bs";

function AudioLevelSlider() {
  const { setCurrentVolume } = useRoomContext();

  const [values, setValues] = useState([0]);
  const [hovered, setHovered] = useState(false);

  const [initialSetOfVolumeComplete, setInitialSetOfVolumeComplete] =
    useState(false);

  useEffect(() => {
    const volume = localStorage.getItem("volume");
    if (volume) {
      setValues([parseInt(volume)]);
    }

    setInitialSetOfVolumeComplete(true);
  }, []);

  useEffect(() => {
    if (values[0] === undefined || !initialSetOfVolumeComplete) return;

    setCurrentVolume(values[0]);
    localStorage.setItem("volume", values[0].toString());
  }, [values, setCurrentVolume, initialSetOfVolumeComplete]);

  return (
    <div
      style={{
        borderColor: "hsl(120deg 100% 86%)",
        color: "hsl(120deg 100% 86%)",
        backgroundColor: "hsl(120deg 100% 18%)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`baseFlex !justify-start 
      ${hovered ? "w-full" : "w-[40px] md:w-full"}
      ${hovered ? "h-full" : "h-[40px] md:h-full"}
      ${hovered ? "gap-2" : "gap-0"} rounded-md border-2 p-2 transition-all`}
    >
      {hovered && <div className="w-4">{values[0]}</div>}

      <div
        style={{
          background: getTrackBackground({
            values: values,
            colors: ["hsl(120deg 100% 86%)", "#ccc"],
            min: 0,
            max: 100,
          }),
          margin: hovered ? "0 0.5rem" : "0",
          width: hovered ? "10rem" : "0rem",
        }}
        className="ml-2 mr-2 h-full transition-all"
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
                height: hovered ? "6px" : "0px",
                opacity: hovered ? "1" : "0",
                width: hovered ? "10rem" : "0rem",
                transition: "width 0.2s",
              }}
            >
              {children}
            </div>
          )}
          renderThumb={({ props }) => (
            <div
              {...props}
              style={{
                ...props.style,
                height: "16px",
                width: "16px",
                backgroundColor: "hsl(120deg 100% 86%)",
                borderRadius: "0.175rem",
              }}
            />
          )}
        />
      </div>

      {values[0] === 0 && <BsFillVolumeMuteFill size={"1.5rem"} />}
      {values[0] && values[0] > 0 && values[0] < 50 ? (
        <BsFillVolumeDownFill size={"1.5rem"} />
      ) : null}
      {values[0] && values[0] >= 50 ? (
        <BsFillVolumeUpFill size={"1.5rem"} />
      ) : null}
    </div>
  );
}

export default AudioLevelSlider;
