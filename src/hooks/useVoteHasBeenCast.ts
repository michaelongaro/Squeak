import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import { useRoomContext } from "../context/RoomContext";

interface IVoteHasBeenCast {
  voteType: "rotateDecks" | "finishRound";
  currentVotes: ("agree" | "disagree")[];
  voteIsFinished: boolean;
}

function useVoteHasBeenCast() {
  const {
    currentVotes,
    setCurrentVotes,
    setVoteType,
    setVotingIsLockedOut,
    setVotingLockoutStartTimestamp,
    passiveVoteResolutionTimerId,
    setPassiveVoteResolutionTimerId,
  } = useRoomContext();

  const [dataFromBackend, setDataFromBackend] =
    useState<IVoteHasBeenCast | null>(null);

  // technically, you might want to add timerID to ctx so that you can clear it out if the
  // vote passes early, but there is already another 30s lockout from voting afterwords so I don't
  // think that any overlap is really possible...

  useEffect(() => {
    socket.on("voteHasBeenCast", (data) => setDataFromBackend(data));

    return () => {
      socket.off("voteHasBeenCast", (data) => setDataFromBackend(data));
    };
  }, []);

  useEffect(() => {
    if (dataFromBackend !== null) {
      setDataFromBackend(null);

      // new vote has been started (skipping if vote is finished because that means
      // that the other players are all bots and we don't have to wait for them to vote)
      if (currentVotes.length === 0 && !dataFromBackend.voteIsFinished) {
        setPassiveVoteResolutionTimerId(
          setTimeout(() => {
            setCurrentVotes([]);
            setVoteType(null);

            setVotingIsLockedOut(true);
            setVotingLockoutStartTimestamp(Date.now());
            // TODO: reset css timer variable % here to 0 if need be

            setTimeout(() => {
              setVotingIsLockedOut(false);
            }, 30000);
          }, 30000),
        );
      }

      setCurrentVotes(dataFromBackend.currentVotes);
      setVoteType(dataFromBackend.voteType);

      if (dataFromBackend.voteIsFinished) {
        clearTimeout(passiveVoteResolutionTimerId);

        setTimeout(() => {
          setCurrentVotes([]);
          setVoteType(null);

          setVotingIsLockedOut(true);
          setVotingLockoutStartTimestamp(Date.now());

          // TODO: reset css timer variable % here to 0 if need be

          setTimeout(() => {
            setVotingIsLockedOut(false);
          }, 30000);
        }, 2000); // allowing leeway for vote verdict to be viewed
      }
    }
  }, [
    dataFromBackend,
    currentVotes.length,
    setCurrentVotes,
    setVoteType,
    setVotingIsLockedOut,
    passiveVoteResolutionTimerId,
    setPassiveVoteResolutionTimerId,
    setVotingLockoutStartTimestamp,
  ]);
}

export default useVoteHasBeenCast;
