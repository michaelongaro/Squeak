import { useState, useEffect } from "react";
import { socket } from "~/pages/_app";
import toast from "react-hot-toast";
import { useMainStore } from "~/stores/MainStore";

function resetAnimation(element: Element | null, className: string) {
  if (element) {
    // Remove the animation class to stop the current animation
    element.classList.remove(className);

    // Force a reflow to restart the animation
    // @ts-expect-error asdf
    void element.offsetWidth;

    // Re-add the class to start the animation from the beginning
    element.classList.add(className);
  }
}

function resetCooldownPercentages() {
  const elements = [
    { selector: ".countdownTimerToast", className: "countdownTimerToast" },
    { selector: ".cooldownVoteTimer", className: "cooldownVoteTimer" },
    {
      selector: ".sheetCooldownVoteTimer",
      className: "sheetCooldownVoteTimer",
    },
    {
      selector: ".countdownTimerMobileVotingPreview",
      className: "countdownTimerMobileVotingPreview",
    },
  ];

  elements.forEach(({ selector, className }) => {
    const element = document.querySelector(selector);
    resetAnimation(element, className);
  });
}

interface IVoteHasBeenCast {
  voteType: "rotateDecks" | "finishRound";
  currentVotes: ("agree" | "disagree")[];
  voteIsFinished: boolean;
}

function useVoteHasBeenCast() {
  const {
    viewportLabel,
    currentVotes,
    setCurrentVotes,
    setVoteType,
    setVotingIsLockedOut,
    setVotingLockoutStartTimestamp,
    passiveVoteResolutionTimerId,
    setPassiveVoteResolutionTimerId,
  } = useMainStore((state) => ({
    viewportLabel: state.viewportLabel,
    currentVotes: state.currentVotes,
    setCurrentVotes: state.setCurrentVotes,
    setVoteType: state.setVoteType,
    setVotingIsLockedOut: state.setVotingIsLockedOut,
    setVotingLockoutStartTimestamp: state.setVotingLockoutStartTimestamp,
    passiveVoteResolutionTimerId: state.passiveVoteResolutionTimerId,
    setPassiveVoteResolutionTimerId: state.setPassiveVoteResolutionTimerId,
  }));

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
            toast.dismiss();

            setTimeout(
              () => {
                resetCooldownPercentages();
              },
              viewportLabel.includes("mobile") ? 500 : 0,
            );
            // waiting for <MobileVotingPreview /> to animate out first.
            // Not an issue with regular voting modal on tablet+

            setVotingIsLockedOut(true);
            setVotingLockoutStartTimestamp(Date.now());

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
        setVotingIsLockedOut(true);

        setTimeout(() => {
          setCurrentVotes([]);
          setVoteType(null);
          toast.dismiss();

          setTimeout(
            () => {
              resetCooldownPercentages();
            },
            viewportLabel.includes("mobile") ? 500 : 0,
          );
          // waiting for <MobileVotingPreview /> to animate out first.
          // Not an issue with regular voting modal on tablet+

          setVotingLockoutStartTimestamp(Date.now());

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
    viewportLabel,
  ]);
}

export default useVoteHasBeenCast;
