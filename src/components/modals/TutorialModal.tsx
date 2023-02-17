import { useRef } from "react";
import useOnClickOutside from "../../hooks/useOnClickOutside";
import { motion } from "framer-motion";
import SecondaryButton from "../Buttons/SecondaryButton";
import { IoClose } from "react-icons/io5";
import { AiOutlineInfoCircle } from "react-icons/ai";
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
      key={"leaderboardModal"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="baseFlex fixed top-0 left-0 z-[500] min-h-[100vh] min-w-[100vw] bg-black/50 transition-all"
    >
      <div
        ref={modalRef}
        className="baseVertFlex rounded-md border-2 border-white shadow-md"
      >
        {/* combine these classes with above? */}
        <div className="baseVertFlex relative max-h-[90vh] w-full !justify-start gap-8 overflow-y-scroll rounded-t-md bg-green-800 p-8">
          <div
            style={{
              color: "hsl(120deg 100% 86%)",
            }}
            className="baseFlex gap-4 text-2xl"
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
              className="pl-4 pr-4 text-left text-lg"
            >
              Preparation
            </legend>

            <div
              style={{
                color: "hsl(120deg 100% 86%)",
              }}
              className="baseVertFlex w-[1000px] gap-2 p-4"
            >
              Squeak is a multiplayer rendition of Solitaire, otherwise known as
              "Nerts" or "Blank". Games can be played with 2-4 players, each
              player starting with a regular deck of cards. 13 of those cards
              are placed in each player's "Squeak pile", with four cards face up
              beside it. The remaining deck stays below the Squeak pile.
            </div>
            {/* should have screenshot of player container (not including their icon) */}
          </fieldset>

          <fieldset className="mt-4 rounded-md border-2 border-white bg-green-800 p-4">
            <legend
              style={{
                color: "hsl(120deg 100% 86%)",
              }}
              className="pl-4 pr-4 text-left text-lg"
            >
              Objective
            </legend>
            <div
              style={{
                color: "hsl(120deg 100% 86%)",
              }}
              className="w-[1000px]  p-4"
            >
              The goal of each round is to get rid of all the cards in your
              Squeak pile, allowing you to press the "Squeak" button, which
              signals the end of the round.
            </div>
          </fieldset>

          <fieldset className="mt-4 rounded-md border-2 border-white bg-green-800 p-4">
            <legend
              style={{
                color: "hsl(120deg 100% 86%)",
              }}
              className="pl-4 pr-4 text-left text-lg"
            >
              Rules
            </legend>

            <div
              style={{
                color: "hsl(120deg 100% 86%)",
              }}
              className="baseVertFlex w-[1000px] !justify-start gap-4 p-4"
            >
              {/* use actual <Card />s in examples */}
              <div className="baseFlex w-full !justify-start gap-4">
                <div className="baseFlex w-[45px] rounded-full border-2 border-white p-2">
                  1
                </div>
                <div className="w-full">
                  Placing a card on the board: must start with an ace, and the
                  every card afterwords must be of the same suit and be one
                  value higher than the previous card. (ex. ace of hearts, 2 of
                  hearts, 3 of hearts)
                </div>
              </div>
              <div className="baseFlex w-full !justify-start gap-4">
                <div className="baseFlex w-[45px] rounded-full border-2 border-white p-2">
                  2
                </div>
                <div className="w-full">
                  Stacking cards on top of the cards next to your Squeak pile
                  (the squeak stacks) follows the same rules as Solitaire. Cards
                  can only be placed on cards of alternate color and must be in
                  descending order. (ex. Jack of spades, 10 of hearts, 9 of
                  clubs)
                </div>
              </div>
              <div className="baseFlex w-full !justify-start gap-4">
                <div className="baseFlex w-[45px] rounded-full border-2 border-white p-2">
                  3
                </div>
                <div className="w-full">
                  When the last card of a squeak stack is played, a card from
                  the squeak pile will automatically be drawn and placed on the
                  empty stack.
                </div>
              </div>
              <div className="baseFlex w-full !justify-start gap-4">
                <div className="baseFlex w-[45px] rounded-full border-2 border-white p-2">
                  4
                </div>
                <div className="w-3/4">
                  You may only play on your own squeak stacks or the decks on
                  the board. You may move a card or group of cards from one
                  squeak stack to another as long as they follow the rules of
                  stacking defined earlier.
                </div>
              </div>

              {/* screenshots of board section and squeak stacks to show what is valid card placement wise */}
            </div>
          </fieldset>

          <fieldset className="mt-4 rounded-md border-2 border-white bg-green-800 p-4">
            <legend
              style={{
                color: "hsl(120deg 100% 86%)",
              }}
              className="pl-4 pr-4 text-left text-lg"
            >
              Scoring
            </legend>
            <div
              style={{
                color: "hsl(120deg 100% 86%)",
              }}
              className="w-[1000px] p-4"
            >
              Points are calculated after the end of each round. Each card a
              player played onto the board is worth one point. The player who
              Squeaked gets an additional ten points, while every other player
              gets docked a point for every card left in their Squeak pile. When
              a player reaches the pre-defined threshold of points to win, that
              player has won and the game is over.
            </div>
          </fieldset>

          <SecondaryButton
            icon={<IoClose size={"1.5rem"} />}
            extraPadding={false}
            onClickFunction={() => setShowModal(false)}
            width={"2.5rem"}
            height={"2.5rem"}
            style={{
              position: "absolute",
              top: "0.5rem",
              right: "0.5rem",
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default TutorialModal;
