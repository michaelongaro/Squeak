import { useState, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import SecondaryButton from "../Buttons/SecondaryButton";
import { IoClose } from "react-icons/io5";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { HiExternalLink } from "react-icons/hi";
import useOnClickOutside from "../../hooks/useOnClickOutside";

import labeledPlayerContainer from "../../../public/tutorial/labeledPlayerContainer.png";
import boardPlacementExample from "../../../public/tutorial/boardPlacementExample.png";
import squeakStackPlacementExample from "../../../public/tutorial/squeakStackPlacementExample.png";

interface ITutorialModal {
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
}

function TutorialModal({ setShowModal }: ITutorialModal) {
  const [labeledPlayerContainerLoaded, setLabeledPlayerContainerLoaded] =
    useState(false);
  const [boardPlacementExampleLoaded, setBoardPlacementExampleLoaded] =
    useState(false);
  const [
    squeakStackPlacementExampleLoaded,
    setSqueakStackPlacementExampleLoaded,
  ] = useState(false);

  const modalRef = useRef(null);

  useOnClickOutside({
    ref: modalRef,
    setShowModal,
  });

  return (
    <motion.div
      key={"tutorialModal"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="baseFlex fixed left-0 top-0 z-[200] h-[100dvh] min-w-[100vw] bg-black/50"
    >
      <motion.div
        ref={modalRef}
        key={"tutorialModalInner"}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="baseVertFlex relative h-[95%] w-[95%] !justify-start gap-8 overflow-y-scroll rounded-md rounded-t-md border-2 border-white bg-green-800 p-4 shadow-lg md:p-8 tablet:max-h-[90dvh] tablet:w-auto"
      >
        <div
          style={{
            color: "hsl(120deg 100% 86%)",
          }}
          className="baseFlex gap-4 pt-4 text-xl font-medium lg:text-2xl"
        >
          <AiOutlineInfoCircle size={"2rem"} />
          How to play
        </div>

        {/* maybe use other green instead of green-800 */}
        <fieldset className="rounded-md border-2 border-white bg-green-800 p-4">
          <legend
            style={{
              color: "hsl(120deg 100% 86%)",
            }}
            className="pl-4 pr-4 text-left text-base lg:text-lg"
          >
            Preparation
          </legend>

          <div className="baseVertFlex gap-4">
            <div
              style={{
                color: "hsl(120deg 100% 86%)",
              }}
              className="w-auto p-4 text-sm lg:w-[1000px] lg:text-base"
            >
              <p>
                Squeak is a multiplayer rendition of Solitaire, otherwise known
                as
                <a
                  href="https://en.wikipedia.org/wiki/Nerts"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1 pl-1 underline underline-offset-4"
                >
                  Nerts
                  <HiExternalLink size={"1.25rem"} />
                </a>
                . Games can be played with 2-4 players, each player starting
                with a regular deck of cards. After shuffling, each player
                places 13 cards in their &quot;Squeak pile&quot;, with an
                additional four cards face up beside it. These four cards will
                be referred to as the player&apos;s &quot;Squeak stacks&quot;.
                Cards are drawn three at a time, however only the top card from
                these three is immediately available for play. The player&apos;s
                remaining deck stays below their Squeak pile as shown below.
              </p>
            </div>

            <Image
              src={labeledPlayerContainer}
              alt={"Example of a player's card placement with labels"}
              className={`rounded-md shadow-lg ${
                labeledPlayerContainerLoaded ? "border-[1px] border-white" : ""
              }`}
              placeholder="blur"
              onLoad={() => setLabeledPlayerContainerLoaded(true)}
            />
          </div>
        </fieldset>

        <fieldset className="mt-4 rounded-md border-2 border-white bg-green-800 p-4">
          <legend
            style={{
              color: "hsl(120deg 100% 86%)",
            }}
            className="pl-4 pr-4 text-left text-base lg:text-lg"
          >
            Objective
          </legend>
          <p
            style={{
              color: "hsl(120deg 100% 86%)",
            }}
            className="w-auto p-4 text-sm lg:w-[1000px] lg:text-base"
          >
            The goal of each round is to accrue as many points as possible and
            empty your Squeak pile, which reveals your &quot;Squeak&quot;
            button. When pressed, it ends the round and adds ten extra points to
            your total. You may delay pressing the Squeak button if you think
            you can still get more points.
          </p>
        </fieldset>

        <fieldset className="mt-4 rounded-md border-2 border-white bg-green-800 p-4">
          <legend
            style={{
              color: "hsl(120deg 100% 86%)",
            }}
            className="pl-4 pr-4 text-left text-base lg:text-lg"
          >
            Rules
          </legend>

          <div
            style={{
              color: "hsl(120deg 100% 86%)",
            }}
            className="baseVertFlex w-auto !justify-start gap-8 p-4 text-sm sm:gap-4 lg:w-[1000px] lg:text-base"
          >
            <div className="baseVertFlex w-full !items-start !justify-start gap-4 sm:!flex-row">
              <div className="baseFlex h-[35px] w-[35px] rounded-full border-2 border-white sm:h-[35px] sm:w-[38px]">
                1
              </div>
              <div className="baseVertFlex w-full gap-4">
                <p>
                  To earn points, you must place cards on piles on the board.
                  Each pile must start with an ace, and every card placed
                  afterwards on that pile must be of the same suit and be one
                  value higher than the previous card (ex. Ace of Hearts, 2 of
                  Hearts, 3 of Hearts). Each card placed is worth one point.
                </p>
                <Image
                  src={boardPlacementExample}
                  alt={"Example of a card being placed on the board"}
                  className={`rounded-md shadow-lg ${
                    boardPlacementExampleLoaded
                      ? "border-[1px] border-white"
                      : ""
                  }`}
                  placeholder="blur"
                  onLoad={() => setBoardPlacementExampleLoaded(true)}
                />
              </div>
            </div>
            <div className="baseVertFlex w-full !items-start !justify-start gap-4 sm:!flex-row">
              <div className="baseFlex h-[35px] w-[35px] rounded-full border-2 border-white sm:h-[35px] sm:w-[38px]">
                2
              </div>
              <div className="baseVertFlex w-full gap-4">
                <p>
                  You may place cards on your squeak stacks as well, however
                  each card must be of{" "}
                  <span className="font-semibold underline underline-offset-2">
                    opposite color
                  </span>{" "}
                  and{" "}
                  <span className="font-semibold underline underline-offset-2">
                    one rank lower
                  </span>{" "}
                  than the previous card, similar to Solitaire (ex. Jack of
                  Spades, 10 of Hearts, 9 of Clubs). Only the last card in your
                  squeak stack is able to be played on the board, however you
                  can move sections of one stack to another as long as the
                  stacking rules are followed.
                </p>
                <Image
                  src={squeakStackPlacementExample}
                  alt={"Example of a card being placed on the board"}
                  className={`rounded-md shadow-lg ${
                    squeakStackPlacementExampleLoaded
                      ? "border-[1px] border-white"
                      : ""
                  }`}
                  placeholder="blur"
                  onLoad={() => setSqueakStackPlacementExampleLoaded(true)}
                />
              </div>
            </div>
            <div className="baseVertFlex w-full !items-start !justify-start gap-4 sm:!flex-row">
              <div className="baseFlex h-[35px] w-[35px] rounded-full border-2 border-white sm:h-[35px] sm:w-[38px]">
                3
              </div>
              <p className="w-full">
                There are no turns in Squeak, you may place cards anywhere at
                any time as long as they follow the above rules.
              </p>
            </div>
          </div>
        </fieldset>

        <fieldset className="mt-4 rounded-md border-2 border-white bg-green-800 p-4">
          <legend
            style={{
              color: "hsl(120deg 100% 86%)",
            }}
            className="pl-4 pr-4 text-left text-base lg:text-lg"
          >
            Voting
          </legend>
          <ul
            style={{
              color: "hsl(120deg 100% 86%)",
            }}
            className="baseVertFlex w-auto list-disc !items-start gap-4 p-4 pl-8 text-sm lg:w-[1000px] lg:text-base"
          >
            <li>
              If a player feels that no one has a valid move to make, they may
              start a vote to rotate everyone&apos;s deck by one card. This
              should hopefully allow for more valid moves to be made.
            </li>
            <li>
              Otherwise, if the decks have been rotated multiple times and it
              feels like the game is at a standstill, players may vote to end
              the round where it is. Note that nobody will receive the Squeak
              bonus if this vote passes.
            </li>
            <li>Votes require each player to agree in order to pass.</li>
          </ul>
        </fieldset>

        <fieldset className="mt-4 rounded-md border-2 border-white bg-green-800 p-4">
          <legend
            style={{
              color: "hsl(120deg 100% 86%)",
            }}
            className="pl-4 pr-4 text-left text-base lg:text-lg"
          >
            Scoring
          </legend>
          <ul
            style={{
              color: "hsl(120deg 100% 86%)",
            }}
            className="baseVertFlex w-auto list-disc !items-start gap-4 p-4 pl-8 text-sm lg:w-[1000px] lg:text-base"
          >
            <li>
              Points are calculated after the end of each round. Each card a
              player placed onto a board pile is worth one point.
            </li>
            <li>
              The player who Squeaked receives an additional ten points, while
              every other player loses a point for every card left in their
              Squeak pile.
            </li>
            <li>
              When a player reaches the room&apos;s predetermined point
              threshold, that player has won and the game is over.
            </li>
          </ul>
        </fieldset>

        <SecondaryButton
          icon={<IoClose size={"1.5rem"} />}
          extraPadding={false}
          onClickFunction={() => setShowModal(false)}
          width={"2.25rem"}
          height={"2.25rem"}
          style={{
            position: "absolute",
            top: "0.5rem",
            right: "0.5rem",
          }}
        />
      </motion.div>
    </motion.div>
  );
}

export default TutorialModal;
