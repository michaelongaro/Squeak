import { useRef } from "react";
import useOnClickOutside from "../../hooks/useOnClickOutside";
import { motion } from "framer-motion";
import SecondaryButton from "../Buttons/SecondaryButton";
import { IoClose } from "react-icons/io5";
import { AiOutlineInfoCircle } from "react-icons/ai";
import Image from "next/image";

import labeledPlayerContainer from "../../../public/tutorial/labeledPlayerContainer.png";
import boardPlacementExample from "../../../public/tutorial/boardPlacementExample.png";
import squeakStackPlacementExample from "../../../public/tutorial/squeakStackPlacementExample.png";
import { HiExternalLink } from "react-icons/hi";

interface ITutorialModal {
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
}

function TutorialModal({ setShowModal }: ITutorialModal) {
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
      className="baseFlex fixed top-0 left-0 z-[1000] min-h-[100dvh] min-w-[100vw] bg-black/50 transition-all lg:z-[500]"
    >
      <motion.div
        ref={modalRef}
        key={"tutorialModalInner"}
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        transition={{ duration: 0.15 }}
        className="baseVertFlex rounded-md border-2 border-white shadow-lg"
      >
        {/* combine these classes with above? */}
        <div className="baseVertFlex relative max-h-[90vh] w-[93vw] !justify-start gap-8 overflow-y-scroll rounded-md rounded-t-md bg-green-800 p-8 lg:w-full">
          <div
            style={{
              color: "hsl(120deg 100% 86%)",
            }}
            className="baseFlex gap-4 text-xl lg:text-2xl"
          >
            <AiOutlineInfoCircle size={"2rem"} />
            How to play
          </div>

          {/* maybe use other green instead of green-800 */}
          <fieldset className="mt-4 rounded-md border-2 border-white bg-green-800 p-4">
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
                  Squeak is a multiplayer rendition of Solitaire, otherwise
                  known as
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
                  The player&apos;s remaining deck stays below their Squeak pile
                  as shown below.
                </p>
              </div>

              <Image
                src={labeledPlayerContainer}
                alt={"Example of a player's card placement with labels"}
                className="h-auto w-auto rounded-md border-[1px] border-white shadow-lg"
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
              The goal of each round is to get rid of all the cards in your
              Squeak pile, which reveals your &quot;Squeak&quot; button. When
              pressed, it ends the round and adds ten extra points to your
              total. You may delay pressing the Squeak button if you think you
              can still get more points.
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
              className="baseVertFlex w-auto !justify-start gap-4 p-4 text-sm lg:w-[1000px] lg:text-base"
            >
              <div className="baseFlex w-full !items-start !justify-start gap-4">
                <div className="baseFlex w-auto rounded-full border-2 border-white px-2 py-1 lg:w-[45px] lg:p-2">
                  1
                </div>
                <p className="baseVertFlex w-full gap-4">
                  To earn points, you must place cards on piles on the board.
                  Each pile must start with an ace, and every card placed
                  afterwards on that pile must be of the same suit and be one
                  value higher than the previous card (ex. Ace of Hearts, 2 of
                  Hearts, 3 of Hearts). Each card placed is worth one point.
                  <Image
                    src={boardPlacementExample}
                    alt={"Example of a card being placed on the board"}
                    className="h-auto w-auto rounded-md border-[1px] border-white shadow-lg"
                  />
                </p>
              </div>
              <div className="baseFlex w-full !items-start !justify-start gap-4">
                <div className="baseFlex w-auto rounded-full border-2 border-white px-2 py-1 lg:w-[45px] lg:p-2">
                  2
                </div>
                <p className="baseVertFlex w-full gap-4">
                  You may place cards on your squeak stacks as well, however
                  each card must be of opposite color and one value lower than
                  the previous card, similar to Solitaire (ex. Jack of Spades,
                  10 of Hearts, 9 of Clubs). Only the last card in your squeak
                  stack is able to be played on the board, however you can move
                  sections of one stack to another as long as the stacking rules
                  are followed.
                  <Image
                    src={squeakStackPlacementExample}
                    alt={"Example of a card being placed on the board"}
                    className="h-auto w-auto rounded-md border-[1px] border-white shadow-lg"
                  />
                </p>
              </div>
              <div className="baseFlex w-full !items-start !justify-start gap-4">
                <div className="baseFlex w-auto rounded-full border-2 border-white px-2 py-1 lg:w-[45px] lg:p-2">
                  3
                </div>
                <p className="w-full">
                  There are no turns in Squeak, you may place cards anywhere at
                  any time as long as they follow the above rules.
                </p>
              </div>
              <div className="baseFlex w-full !items-start !justify-start gap-4">
                <div className="baseFlex w-auto rounded-full border-2 border-white px-2 py-1 lg:w-[45px] lg:p-2">
                  4
                </div>
                <p className="w-3/4">
                  If no player has a valid move to make, each player will
                  automatically rotate their deck by one card, and the round
                  will continue.
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
              Scoring
            </legend>
            <p
              style={{
                color: "hsl(120deg 100% 86%)",
              }}
              className="w-auto p-4 text-sm lg:w-[1000px] lg:text-base"
            >
              Points are calculated after the end of each round. Each card a
              player placed onto a board pile is worth one point. The player who
              Squeaked gets an additional ten points, while every other player
              loses a point for every card left in their Squeak pile. When a
              player reaches the room&apos;s predetermined point threshold, that
              player has won and the game is over.
            </p>
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
        </div>
      </motion.div>
    </motion.div>
  );
}

export default TutorialModal;
