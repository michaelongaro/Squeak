import { useState, type CSSProperties } from "react";
import { socket } from "../../pages";
import { motion } from "framer-motion";
import { useUserIDContext } from "../../context/UserIDContext";
import { useRoomContext } from "../../context/RoomContext";
import SecondaryButton from "../Buttons/SecondaryButton";
import DangerButton from "../Buttons/DangerButton";
import { type IRoomPlayer } from "../../pages/api/socket";
import { AiOutlinePlus, AiOutlineClose } from "react-icons/ai";
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
import useGetViewportLabel from "~/hooks/useGetViewportLabel";
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
  style?: CSSProperties;
  transparentBackground?: boolean;
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
  style,
  transparentBackground,
}: IPlayerIcon) {
  const userID = useUserIDContext();

  const { roomConfig } = useRoomContext();

  const [friendInviteSent, setFriendInviteSent] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const viewportLabel = useGetViewportLabel();

  return (
    <>
      {avatarPath && borderColor ? (
        <motion.div
          key={`playerIcon${playerID}`}
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.75 }}
          transition={{ duration: 0.15 }}
          style={{
            ...style,
            color: "hsl(120deg 100% 86%)",
          }}
          className="baseVertFlex gap-2"
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
                      open={drawerOpen}
                      onOpenChange={(open) => {
                        if (!open) setDrawerOpen(false);
                      }}
                    >
                      <DrawerTrigger asChild>
                        <Button
                          variant={"secondary"}
                          disabled={friendInviteSent}
                          isDisabled={friendInviteSent}
                          icon={
                            friendInviteSent ? (
                              <FiCheck size={"1rem"} />
                            ) : (
                              <AiOutlinePlus size={"1rem"} />
                            )
                          }
                          className="absolute left-[-1rem] top-[-0.75rem] h-[30px] w-[30px] rounded-[50%] p-0"
                          onClick={() => {
                            setDrawerOpen(true);
                          }}
                        />
                      </DrawerTrigger>
                      <DrawerContent>
                        <div className="baseVertFlex gap-2 p-4">
                          <p className="text-lg text-darkGreen">
                            Send friend invite to &ldquo;{username}&rdquo;?
                          </p>
                          <Button
                            variant={"secondary"}
                            disabled={friendInviteSent}
                            isDisabled={friendInviteSent}
                            innerText={friendInviteSent ? "Sent!" : "Send"}
                            icon={<FiMail size={"1rem"} />}
                            className="gap-2"
                            onClick={() => {
                              socket.emit("modifyFriendData", {
                                action: "sendFriendInvite",
                                initiatorID: userID,
                                targetID: playerID,
                              });

                              setFriendInviteSent(true);
                              setTimeout(() => {
                                setFriendInviteSent(false);
                                setDrawerOpen(false);
                              }, 1000);
                            }}
                          />
                        </div>
                      </DrawerContent>
                    </Drawer>
                  </div>
                ) : (
                  <div className="absolute left-0 top-0 h-0 w-0">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={"secondary"}
                            disabled={friendInviteSent}
                            isDisabled={friendInviteSent}
                            icon={
                              friendInviteSent ? (
                                <FiCheck size={"1rem"} />
                              ) : (
                                <AiOutlinePlus size={"1rem"} />
                              )
                            }
                            className="absolute left-[-1rem] top-[-0.75rem] h-[30px] w-[30px] rounded-[50%] p-0"
                            onClick={() => {
                              socket.emit("modifyFriendData", {
                                action: "sendFriendInvite",
                                initiatorID: userID,
                                targetID: playerID,
                              });

                              setFriendInviteSent(true);
                              setTimeout(() => {
                                setFriendInviteSent(false);
                              }, 1000);
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent
                          side={"bottom"}
                          className="border-2 border-lightGreen bg-darkGreen text-lightGreen"
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
                      open={drawerOpen}
                      onOpenChange={(open) => {
                        if (!open) setDrawerOpen(false);
                      }}
                    >
                      <DrawerTrigger asChild>
                        <Button
                          variant={"destructive"}
                          icon={<AiOutlineClose size={"1rem"} />}
                          className="absolute right-[-2rem] top-[-0.75rem] h-[30px] w-[30px] rounded-[50%] p-0"
                          onClick={() => {
                            setDrawerOpen(true);
                          }}
                        />
                      </DrawerTrigger>
                      <DrawerContent>
                        <div className="baseVertFlex gap-2 p-4">
                          <p className="text-lg text-darkGreen">
                            Are you sure you want to kick &ldquo;{username}
                            &rdquo;?
                          </p>
                          <Button
                            variant={"destructive"}
                            innerText={"Kick"}
                            onClick={() => {
                              setDrawerOpen(false);

                              setTimeout(() => {
                                if (!playerID) return;
                                socket.emit("leaveRoom", {
                                  playerID,
                                  roomCode: roomConfig.code,
                                  playerWasKicked: true,
                                });
                              }, 350);
                            }}
                          />
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
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant={"destructive"}
                                disabled={friendInviteSent}
                                isDisabled={friendInviteSent}
                                icon={<AiOutlineClose size={"1rem"} />}
                                className="absolute right-0 top-0 h-[30px] w-[30px] rounded-[50%] p-0"
                                onClick={() => setPopoverOpen(true)}
                              />
                            </TooltipTrigger>
                            <TooltipContent
                              side={"bottom"}
                              className="border-2 border-[hsl(0,84%,60%)] bg-[hsl(0,84%,95%)] text-[hsl(0,84%,40%)]"
                            >
                              <p>Kick player</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </PopoverTrigger>
                      <PopoverContent
                        redArrow
                        className="text-[hsl(0,84%,40%) border-2 border-[hsl(0,84%,60%)] bg-[hsl(0,84%,95%)]"
                      >
                        <div className="baseVertFlex w-64 gap-3 p-2">
                          <p className="text-center font-semibold text-[hsl(0,84%,40%)]">
                            Are you sure you want to kick &ldquo;{username}
                            &rdquo;?
                          </p>
                          <Button
                            variant={"destructive"}
                            innerText={"Kick"}
                            onClick={() => {
                              setPopoverOpen(false);

                              setTimeout(() => {
                                if (!playerID) return;
                                socket.emit("leaveRoom", {
                                  playerID,
                                  roomCode: roomConfig.code,
                                  playerWasKicked: true,
                                });
                              }, 350);
                            }}
                          />
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
          {username ? username : null}

          {/* difficulty toggle button that rotates through easy medium and hard */}
          {playerMetadata?.botDifficulty && (
            <div
              className={`baseVertFlex relative w-16 ${
                roomHostIsRendering ? "mb-8 gap-1" : "gap-1"
              }`}
            >
              {/* <p className="text-sm italic underline">Difficulty</p> */}
              <div className="baseFlex w-full gap-2">
                <div className="h-2 w-full rounded-md bg-lightGreen"></div>
                <div
                  className={`${
                    playerMetadata.botDifficulty === "Medium" ||
                    playerMetadata.botDifficulty === "Hard"
                      ? "bg-lightGreen"
                      : "bg-lightGreen/20"
                  } h-2 w-full rounded-md`}
                ></div>
                <div
                  className={`${
                    playerMetadata.botDifficulty === "Hard"
                      ? "bg-lightGreen"
                      : "bg-lightGreen/20"
                  } h-2 w-full rounded-md`}
                ></div>
              </div>
              {roomHostIsRendering ? (
                <SecondaryButton
                  innerText={playerMetadata.botDifficulty}
                  extraPadding={false}
                  style={{
                    padding: "0.75rem 0.25rem",
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    minWidth: "fit-content",
                    marginTop: "2rem",
                  }}
                  onClickFunction={() => {
                    if (!playerID) return;
                    socket.emit("updatePlayerMetadata", {
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
                />
              ) : (
                <p>{playerMetadata.botDifficulty}</p>
              )}
            </div>
          )}
        </motion.div>
      ) : (
        <div className="skeletonLoading h-12 w-12 rounded-[50%]"></div>
      )}
    </>
  );
}

export default PlayerIcon;
