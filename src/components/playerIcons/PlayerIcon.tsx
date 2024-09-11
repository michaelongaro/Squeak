import { useState, type CSSProperties } from "react";
import { socket } from "~/pages/_app";
import { motion } from "framer-motion";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import { type IRoomPlayer } from "../../pages/api/socket";
import { AiOutlinePlus, AiOutlineClose } from "react-icons/ai";
import { FaCrown } from "react-icons/fa6";
import { FiCheck } from "react-icons/fi";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Sheet, SheetTrigger, SheetContent } from "~/components/ui/sheet";
import { FiMail } from "react-icons/fi";

interface IPlayerIcon {
  avatarPath?: string;
  borderColor?: string;
  size: string;
  username?: string;
  playerID?: string;
  showAddFriendButton?: boolean;
  showRemovePlayerFromRoomButton?: boolean;
  onlineStatus?: boolean;
  playerMetadata?: IRoomPlayer;
  roomHostIsRendering?: boolean;
  playerIsHost?: boolean;
  style?: CSSProperties;
  transparentBackground?: boolean;
  forWhilePlayingSheet?: boolean;
  animatePresence?: boolean;
  animateLayout?: boolean;
}

function PlayerIcon({
  avatarPath,
  borderColor,
  size,
  username,
  showAddFriendButton,
  playerID,
  showRemovePlayerFromRoomButton,
  onlineStatus,
  playerMetadata,
  roomHostIsRendering,
  playerIsHost,
  style,
  transparentBackground,
  forWhilePlayingSheet,
  animatePresence,
  animateLayout = true,
}: IPlayerIcon) {
  const userID = useUserIDContext();

  const { roomConfig, viewportLabel } = useRoomContext();

  const [friendInviteSent, setFriendInviteSent] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [kickPlayerSheetOpen, setKickPlayerSheetOpen] = useState(false);
  const [sendFriendInviteSheetOpen, setSendFriendInviteSheetOpen] =
    useState(false);

  return (
    <>
      {avatarPath && borderColor && (
        <motion.div
          key={`playerIcon${playerID}`}
          layout={animateLayout ? "position" : undefined}
          initial={{
            opacity: 0,
            scale: 0,
            width: animatePresence ? 0 : "auto",
            height: animatePresence ? 0 : "auto",
            margin: animatePresence
              ? viewportLabel.includes("mobile")
                ? "1rem"
                : "0 1rem"
              : 0,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            width: "auto",
            height: "auto",
            margin: animatePresence
              ? viewportLabel.includes("mobile")
                ? "1rem"
                : "0 1rem"
              : 0,
          }}
          exit={{
            opacity: 0,
            scale: 0,
            width: 0,
            height: 0,
            margin: "0",
          }}
          transition={{
            duration: 0.3,
            opacity: { duration: 0.15 },
            scale: { duration: 0.15 },
            ease: "easeOut",
          }}
          style={{
            ...style,
          }}
          className={`baseVertFlex shrink-0 ${forWhilePlayingSheet ? "text-darkGreen" : "text-lightGreen"}`}
        >
          <div
            style={{
              outline: `4px solid ${borderColor}`,
              backgroundColor: transparentBackground
                ? "transparent"
                : "rgba(255, 255, 255, 0.8)",
            }}
            className="relative rounded-[50%] bg-opacity-80"
          >
            <img
              style={{
                width: size,
                height: size,
              }}
              className="p-2"
              src={avatarPath}
              alt={"Player Icon"}
              draggable="false"
            />

            {showAddFriendButton && (
              <>
                {viewportLabel.includes("mobile") ? (
                  <div className="absolute left-0 top-0 h-0 w-0">
                    <Sheet
                      open={sendFriendInviteSheetOpen}
                      onOpenChange={(open) => {
                        if (!open) setSendFriendInviteSheetOpen(false);
                      }}
                    >
                      <SheetTrigger asChild>
                        <Button
                          variant={"secondary"}
                          disabled={friendInviteSent}
                          className="absolute left-[-1rem] top-[-0.75rem] h-[30px] w-[30px] rounded-[50%] p-0"
                          onClick={() => {
                            setSendFriendInviteSheetOpen(true);
                          }}
                        >
                          {friendInviteSent ? (
                            <FiCheck size={"1rem"} />
                          ) : (
                            <AiOutlinePlus size={"1rem"} />
                          )}
                        </Button>
                      </SheetTrigger>
                      <SheetContent>
                        <div className="baseVertFlex gap-4 p-4">
                          <p className="max-w-64 text-center text-lg text-darkGreen">
                            Send friend invite to &ldquo;{username}&rdquo;?
                          </p>
                          <Button
                            variant={"secondary"}
                            disabled={friendInviteSent}
                            className="gap-2 !px-8"
                            onClick={() => {
                              socket.volatile.emit("modifyFriendData", {
                                action: "sendFriendInvite",
                                initiatorID: userID,
                                targetID: playerID,
                              });

                              setFriendInviteSent(true);
                              setTimeout(() => {
                                setFriendInviteSent(false);
                                setSendFriendInviteSheetOpen(false);
                              }, 1000);
                            }}
                          >
                            {friendInviteSent ? "Sent!" : "Send"}
                            <FiMail size={"1rem"} />
                          </Button>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                ) : (
                  <div className="absolute left-0 top-0 h-0 w-0">
                    <TooltipProvider delayDuration={500}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={"secondary"}
                            disabled={friendInviteSent}
                            includeMouseEvents
                            className="absolute left-[-1rem] top-[-0.75rem] h-[30px] w-[30px] rounded-[50%] p-0"
                            onClick={() => {
                              socket.volatile.emit("modifyFriendData", {
                                action: "sendFriendInvite",
                                initiatorID: userID,
                                targetID: playerID,
                              });

                              setFriendInviteSent(true);
                              setTimeout(() => {
                                setFriendInviteSent(false);
                              }, 1000);
                            }}
                          >
                            {friendInviteSent ? (
                              <FiCheck size={"1rem"} />
                            ) : (
                              <AiOutlinePlus size={"1rem"} />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent
                          side={"bottom"}
                          className="border-2 border-lightGreen bg-gradient-to-br from-green-800 to-green-850 text-lightGreen"
                        >
                          <p>Send friend invite</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </>
            )}

            {showRemovePlayerFromRoomButton && (
              <>
                {viewportLabel.includes("mobile") ? (
                  <div className="absolute left-0 top-0 h-0 w-0">
                    <Sheet
                      open={kickPlayerSheetOpen}
                      onOpenChange={(open) => {
                        if (!open) setKickPlayerSheetOpen(false);
                      }}
                    >
                      <SheetTrigger asChild>
                        <Button
                          variant={"destructive"}
                          className="absolute right-[-2rem] top-[-0.75rem] h-[30px] w-[30px] rounded-[50%] p-0"
                          onClick={() => {
                            setKickPlayerSheetOpen(true);
                          }}
                        >
                          <AiOutlineClose size={"1rem"} />
                        </Button>
                      </SheetTrigger>
                      <SheetContent>
                        <div className="baseVertFlex gap-4 p-4">
                          <p className="max-w-64 text-center text-lg text-darkGreen">
                            Are you sure you want to kick &ldquo;{username}
                            &rdquo;?
                          </p>
                          <Button
                            variant={"destructive"}
                            onClick={() => {
                              setKickPlayerSheetOpen(false);

                              setTimeout(() => {
                                if (!playerID) return;
                                socket.volatile.emit("leaveRoom", {
                                  playerID,
                                  roomCode: roomConfig.code,
                                  playerWasKicked: true,
                                });
                              }, 350);
                            }}
                          >
                            Kick
                          </Button>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                ) : (
                  <div className="absolute right-[1rem] top-[-0.75rem] h-0 w-0">
                    <Popover
                      open={popoverOpen}
                      onOpenChange={(open) => {
                        if (!open) setPopoverOpen(false);
                      }}
                    >
                      <PopoverTrigger>
                        <TooltipProvider>
                          <Tooltip delayDuration={500}>
                            <TooltipTrigger asChild>
                              <Button
                                variant={"destructive"}
                                disabled={friendInviteSent}
                                includeMouseEvents
                                className="absolute right-0 top-0 h-[30px] w-[30px] rounded-[50%] p-0"
                                onClick={() => setPopoverOpen(true)}
                              >
                                <AiOutlineClose size={"1rem"} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent
                              side={"bottom"}
                              className="border-2 border-[hsl(0,84%,60%)] bg-[hsl(0,84%,98%)] text-[hsl(0,84%,40%)]"
                            >
                              <p>Kick player</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </PopoverTrigger>
                      <PopoverContent
                        redArrow
                        className="text-[hsl(0,84%,40%) border-2 border-[hsl(0,84%,60%)] bg-gradient-to-br from-red-50 to-red-100"
                      >
                        <div className="baseVertFlex w-64 gap-3 p-2">
                          <p className="text-center font-semibold text-[hsl(0,84%,40%)]">
                            Are you sure you want to kick &ldquo;{username}
                            &rdquo;?
                          </p>
                          <Button
                            variant={"destructive"}
                            onClick={() => {
                              setPopoverOpen(false);

                              setTimeout(() => {
                                if (!playerID) return;
                                socket.volatile.emit("leaveRoom", {
                                  playerID,
                                  roomCode: roomConfig.code,
                                  playerWasKicked: true,
                                });
                              }, 175);
                            }}
                          >
                            Kick
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </>
            )}

            {onlineStatus !== undefined && (
              <div
                className={`absolute -bottom-1 -right-1 size-4 rounded-full shadow-xl ${
                  onlineStatus
                    ? "bg-gradient-to-br from-green-500 to-green-700"
                    : "bg-gradient-to-br from-red-500 to-red-700"
                }`}
              ></div>
            )}
          </div>

          {username && (
            <div
              className={`baseFlex mt-2 gap-2 whitespace-nowrap text-nowrap ${forWhilePlayingSheet ? "mb-4" : ""}`}
            >
              {playerIsHost && (
                <FaCrown
                  size={"0.9rem"}
                  viewBox="0 0 591 512"
                  className="mb-[0.1rem] shrink-0"
                />
              )}
              {username}
            </div>
          )}

          {/* difficulty toggle button that rotates through easy, medium, and hard */}
          {!forWhilePlayingSheet && playerMetadata?.botDifficulty && (
            <div className="baseVertFlex relative mt-2 w-16 gap-1">
              <div className="baseFlex w-full gap-2">
                <div
                  className={`h-2 w-full rounded-md transition-all ${forWhilePlayingSheet ? "bg-darkGreen" : "bg-lightGreen"}`}
                ></div>
                <div
                  className={`${
                    playerMetadata.botDifficulty === "Medium" ||
                    playerMetadata.botDifficulty === "Hard"
                      ? `${forWhilePlayingSheet ? "bg-darkGreen" : "bg-lightGreen"}`
                      : `${forWhilePlayingSheet ? "bg-darkGreen/20" : "bg-lightGreen/20"}`
                  } h-2 w-full rounded-md transition-all`}
                ></div>
                <div
                  className={`${
                    playerMetadata.botDifficulty === "Hard"
                      ? `${forWhilePlayingSheet ? "bg-darkGreen" : "bg-lightGreen"}`
                      : `${forWhilePlayingSheet ? "bg-darkGreen/20" : "bg-lightGreen/20"}`
                  } h-2 w-full rounded-md transition-all`}
                ></div>
              </div>
              {roomHostIsRendering ? (
                <Button
                  variant={"secondary"}
                  onClick={() => {
                    if (!playerID) return;
                    socket.volatile.emit("updatePlayerMetadata", {
                      playerID,
                      roomCode: roomConfig.code,
                      newPlayerMetadata: {
                        ...playerMetadata,
                        botDifficulty:
                          playerMetadata.botDifficulty === "Easy"
                            ? "Medium"
                            : playerMetadata.botDifficulty === "Medium"
                              ? "Hard"
                              : "Easy",
                      },
                    });
                  }}
                  className="mt-2 h-4 w-20 !px-2 !py-3 text-sm"
                >
                  {playerMetadata.botDifficulty}
                </Button>
              ) : (
                <p className="mt-1 text-sm">{playerMetadata.botDifficulty}</p>
              )}
            </div>
          )}
        </motion.div>
      )}
    </>
  );
}

export default PlayerIcon;
