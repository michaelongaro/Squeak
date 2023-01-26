import { socket } from "../../pages/";
import { useRoomContext } from "../../context/RoomContext";
import Card from "../Play/Card";
import CountUp from "react-countup";

function ShufflingCountdownModal() {
  const roomCtx = useRoomContext();

  return (
    <div
      style={{
        opacity: roomCtx.showShufflingCountdown ? 1 : 0,
        pointerEvents: roomCtx.showShufflingCountdown ? "auto" : "none",
      }}
      className="baseFlex absolute top-0 left-0 z-[600] h-full w-full bg-black bg-opacity-60 transition-all"
    >
      {/* prob will run into issues and will need framer motion to smoothly animate in/out */}
      {roomCtx.showShufflingCountdown && (
        <div className="h-40 w-40 rounded-md bg-green-200 p-4">
          <div className="baseVertFlex gap-4">
            <div className="text-xl">Shuffling deck</div>
            <div className="relative h-full w-full">
              <div className="absolute top-0 left-0 h-full w-full">
                <Card showCardBack={true} draggable={false} rotation={0} />
              </div>
              <div
                style={{
                  animationPlayState: "running",
                }}
                className={`topBackFacingCardInDeck absolute top-0 left-0 h-full w-full`}
              >
                <Card showCardBack={true} draggable={false} rotation={0} />
              </div>
            </div>

            <div className="baseFlex gap-2">
              <div>Round will begin in:</div>
              <CountUp
                start={3}
                end={1}
                onEnd={() => {
                  roomCtx.setShowShufflingCountdown(false);
                  setTimeout(() => {
                    socket.emit("startGame", {
                      roomCode: roomCtx.roomConfig.code,
                      firstRound: roomCtx.gameData.currentRound === 1,
                    });
                  }, 1000);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShufflingCountdownModal;
