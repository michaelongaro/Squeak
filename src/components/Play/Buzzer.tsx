import { useState } from "react";

interface IBuzzer {
  playerID: string;
  interactive: boolean;
  onClickFunction: () => void;
}

function Buzzer({ playerID, interactive, onClickFunction }: IBuzzer) {
  // will need effect + timeout to simulate pressing the button when somebody else
  // squeaks (also play sound from here at same time) OOOO maybe idk could send out a pulsewave
  // like 10% opacity of that persons color that expands across whole screen then fades out?
  // would have to have borderRadius 50% and then just animate the width and height to 100vw/100vh

  // maybe have useeffect listener to play sound from here?
  // need to add <audio> w/ ref

  const [hoveringOnButton, setHoveringOnButton] = useState<boolean>(false);

  const [mouseDownOnButton, setMouseDownOnButton] = useState<boolean>(false);

  return (
    <div
      style={{
        boxShadow:
          interactive && hoveringOnButton
            ? "0px 0px 10px 3px rgba(184,184,184,1)"
            : "none",
      }}
      className="relative h-[40px] w-[75px] cursor-pointer rounded-[50%] transition-all"
      onMouseEnter={() => {
        if (interactive) setHoveringOnButton(true);
      }}
      onMouseLeave={() => {
        if (interactive) {
          setHoveringOnButton(false);
          setMouseDownOnButton(false);
        }
      }}
      onMouseDown={() => {
        if (interactive) setMouseDownOnButton(true);
      }}
      onMouseUp={() => {
        if (interactive) setMouseDownOnButton(false);
      }}
      onClick={() => {
        if (interactive) onClickFunction();
      }}
    >
      {/* grey baseplate for button */}
      <div className="absolute top-0 left-0">
        <img
          draggable={false}
          src="/buzzer/baseplate.png"
          alt="baseplate for buzzer"
          className="h-[40px] w-[75px]"
        />
      </div>

      {/* actual button container */}
      <div className="absolute left-[12px] top-[-5px] h-[35px] w-[50px] ">
        <img
          style={{
            top: mouseDownOnButton ? "8px" : "0px",
            transform: mouseDownOnButton ? "rotateX(60deg)" : "rotateX(0deg)",
          }}
          draggable={false}
          src="/buzzer/buzzerButton.png"
          alt="buzzer"
          className="absolute h-[35px] w-[50px] transition-all"
        />
      </div>
    </div>
  );
}

export default Buzzer;
