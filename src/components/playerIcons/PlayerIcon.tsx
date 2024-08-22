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
import { Drawer, DrawerTrigger, DrawerContent } from "~/components/ui/drawer";
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
  forWhilePlayingDrawer?: boolean;
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
  forWhilePlayingDrawer,
}: IPlayerIcon) {
  const userID = useUserIDContext();

  const { roomConfig, viewportLabel } = useRoomContext();

  const [friendInviteSent, setFriendInviteSent] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [kickPlayerDrawerOpen, setKickPlayerDrawerOpen] = useState(false);
  const [sendFriendInviteDrawerOpen, setSendFriendInviteDrawerOpen] =
    useState(false);

  return (
    <>
      {avatarPath && borderColor && (
        <motion.div
          key={`playerIcon${playerID}`}
          // layout={"position"} TODO: would like to add this, however when bringing up <Drawer> to
          // add/kick player it causes the player icon to shift around
          initial={{
            opacity: 0,
            scale: 0.75,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            duration: 0.15,
          }}
          style={{
            ...style,
          }}
          className={`baseVertFlex shrink-0 ${forWhilePlayingDrawer ? "text-darkGreen" : "text-lightGreen"}`}
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
                    <Drawer
                      open={sendFriendInviteDrawerOpen}
                      onOpenChange={(open) => {
                        if (!open) setSendFriendInviteDrawerOpen(false);
                      }}
                    >
                      <DrawerTrigger asChild>
                        <Button
                          variant={"secondary"}
                          disabled={friendInviteSent}
                          className="absolute left-[-1rem] top-[-0.75rem] h-[30px] w-[30px] rounded-[50%] p-0"
                          onClick={() => {
                            setSendFriendInviteDrawerOpen(true);
                          }}
                        >
                          {friendInviteSent ? (
                            <FiCheck size={"1rem"} />
                          ) : (
                            <AiOutlinePlus size={"1rem"} />
                          )}
                        </Button>
                      </DrawerTrigger>
                      <DrawerContent>
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
                                setSendFriendInviteDrawerOpen(false);
                              }, 1000);
                            }}
                          >
                            {friendInviteSent ? "Sent!" : "Send"}
                            <FiMail size={"1rem"} />
                          </Button>
                        </div>
                      </DrawerContent>
                    </Drawer>
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
                    <Drawer
                      open={kickPlayerDrawerOpen}
                      onOpenChange={(open) => {
                        if (!open) setKickPlayerDrawerOpen(false);
                      }}
                    >
                      <DrawerTrigger asChild>
                        <Button
                          variant={"destructive"}
                          className="absolute right-[-2rem] top-[-0.75rem] h-[30px] w-[30px] rounded-[50%] p-0"
                          onClick={() => {
                            setKickPlayerDrawerOpen(true);
                          }}
                        >
                          <AiOutlineClose size={"1rem"} />
                        </Button>
                      </DrawerTrigger>
                      <DrawerContent>
                        <div className="baseVertFlex gap-4 p-4">
                          <p className="max-w-64 text-center text-lg text-darkGreen">
                            Are you sure you want to kick &ldquo;{username}
                            &rdquo;?
                          </p>
                          <Button
                            variant={"destructive"}
                            onClick={() => {
                              setKickPlayerDrawerOpen(false);

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
                      </DrawerContent>
                    </Drawer>
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
                style={{
                  backgroundColor: onlineStatus
                    ? "hsl(120deg 100% 35%)"
                    : "hsl(0deg 100% 40%)",
                }}
                className="absolute bottom-0 right-[-0.25rem] h-4 w-4 rounded-[50%] shadow-md"
              ></div>
            )}
          </div>

          {username && (
            <div className="baseFlex mt-2 gap-2 whitespace-nowrap text-nowrap">
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
          {playerMetadata?.botDifficulty && (
            <div className="baseVertFlex relative mt-2 w-16 gap-1">
              {/* <p className="text-sm italic underline">Difficulty</p> */}
              <div className="baseFlex w-full gap-2">
                <div
                  className={`h-2 w-full rounded-md transition-all ${forWhilePlayingDrawer ? "bg-darkGreen" : "bg-lightGreen"}`}
                ></div>
                <div
                  className={`${
                    playerMetadata.botDifficulty === "Medium" ||
                    playerMetadata.botDifficulty === "Hard"
                      ? `${forWhilePlayingDrawer ? "bg-darkGreen" : "bg-lightGreen"}`
                      : `${forWhilePlayingDrawer ? "bg-darkGreen/20" : "bg-lightGreen/20"}`
                  } h-2 w-full rounded-md transition-all`}
                ></div>
                <div
                  className={`${
                    playerMetadata.botDifficulty === "Hard"
                      ? `${forWhilePlayingDrawer ? "bg-darkGreen" : "bg-lightGreen"}`
                      : `${forWhilePlayingDrawer ? "bg-darkGreen/20" : "bg-lightGreen/20"}`
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
                  className="mt-2 h-4 w-min !px-2 !py-3 text-sm"
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
