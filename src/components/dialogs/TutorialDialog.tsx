import { type ReactNode } from "react";
import Image from "next/image";
import { IoClose } from "react-icons/io5";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { HiExternalLink } from "react-icons/hi";
import labeledPlayerContainer from "../../../public/tutorial/labeledPlayerContainer.png";
import mobileLabeledPlayerContainer from "../../../public/tutorial/mobileLabeledPlayerContainer.png";
import boardPlacementExample from "../../../public/tutorial/boardPlacementExample.png";
import { GiClubs, GiHearts, GiSpades } from "react-icons/gi";
import squeakStackPlacementExample from "../../../public/tutorial/squeakStackPlacementExample.png";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "~/components/ui/button";

import {
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "~/components/ui/dialog";
import { useMainStore } from "~/stores/MainStore";

interface ITutorialDialog {
  setShowDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

function TutorialDialog({ setShowDialog }: ITutorialDialog) {
  const { viewportLabel } = useMainStore((state) => ({
    viewportLabel: state.viewportLabel,
  }));

  return (
    <DialogContent className="baseVertFlex h-[95%] w-[95%] !justify-start overflow-y-scroll rounded-md rounded-t-md border-2 border-white bg-gradient-to-br from-green-800 to-green-850 shadow-lg tablet:max-h-[90dvh] tablet:max-w-4xl">
      <VisuallyHidden>
        <DialogTitle>How to play</DialogTitle>
        <DialogDescription>Learn how to play Squeak</DialogDescription>
      </VisuallyHidden>

      <div className="baseFlex sticky left-0 top-0 z-10 w-full rounded-t-md border-b border-white bg-gradient-to-br from-green-800 to-green-850 py-3 shadow-lg sm:py-4 tablet:max-w-4xl">
        <div className="baseFlex gap-2 text-lg font-medium text-lightGreen lg:text-xl">
          <AiOutlineInfoCircle size={"1.5rem"} />
          How to play
        </div>

        <Button
          variant={"text"}
          size={"icon"}
          className="!absolute right-1 top-1 size-8"
          onClick={() => setShowDialog(false)}
        >
          <IoClose size={"1.5rem"} />
        </Button>
      </div>

      <div className="baseVertFlex w-full !justify-start gap-8 p-4 py-8 md:p-8 tablet:max-w-3xl">
        <DynamicSectionContainer
          viewportLabel={viewportLabel}
          title={"Preparation"}
        >
          <div className="baseVertFlex gap-4">
            <div className="w-auto pt-0 text-sm text-lightGreen lg:w-[725px] lg:text-base tablet:p-4">
              <p>
                Squeak is a multiplayer rendition of Solitaire, otherwise known
                as
                <a
                  href="https://en.wikipedia.org/wiki/Nerts"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1 pl-1 underline underline-offset-2"
                >
                  Nerts
                  <HiExternalLink className="size-4 lg:size-[18px]" />
                </a>
                . Games can be played with 2-5 players, where each player starts
                with a regular deck of cards. After shuffling, each player
                places 13 cards in their &quot;Squeak deck&quot;, with an
                additional four cards from their deck face up beside it. These
                four cards will be referred to as the player&apos;s &quot;Squeak
                piles&quot;. Cards are drawn from the player&apos;s deck to
                their hand three at a time, however only the top card from the
                player&apos;s hand is available for play.
              </p>
            </div>

            <Image
              src={
                viewportLabel.includes("mobile")
                  ? mobileLabeledPlayerContainer
                  : labeledPlayerContainer
              }
              alt={"Example of a player's card placement with labels"}
              className="h-[196px] w-[306px] rounded-md border-[1px] border-white shadow-lg tablet:h-[237px] tablet:w-[727px]"
              placeholder="blur"
            />
          </div>
        </DynamicSectionContainer>

        <DynamicSectionContainer
          viewportLabel={viewportLabel}
          title={"Objective"}
        >
          <p className="w-auto pt-0 text-sm text-lightGreen lg:w-[725px] lg:text-base tablet:p-4">
            The goal of each round is to accrue as many points as possible and
            empty your Squeak deck, which reveals your Squeak button. When
            pressed, it ends the current round and adds ten extra points to your
            total. You may delay pressing the Squeak button indefinitely if you
            think you can still get more points.
          </p>
        </DynamicSectionContainer>

        <DynamicSectionContainer viewportLabel={viewportLabel} title={"Rules"}>
          <ul className="baseVertFlex w-auto list-disc !justify-start gap-8 pl-4 pt-0 text-sm text-lightGreen sm:gap-4 lg:w-[725px] lg:text-base tablet:p-4 tablet:pl-8">
            <li>
              <div className="baseVertFlex w-full !items-start !justify-start gap-4 sm:!flex-row sm:gap-8">
                <p>
                  To earn points, you must place cards on piles on the board.
                  Each pile must start with an ace, and every card placed
                  afterwards on that pile must be of the{" "}
                  <span className="font-semibold underline underline-offset-2">
                    same suit
                  </span>{" "}
                  and be{" "}
                  <span className="font-semibold underline underline-offset-2">
                    one rank higher
                  </span>{" "}
                  than the previous card (ex. A
                  <span className="inline-flex font-semibold underline underline-offset-2">
                    <GiClubs size="0.7rem" className="ml-0.5" />
                  </span>{" "}
                  , 2
                  <span className="inline-flex font-semibold underline underline-offset-2">
                    <GiClubs size="0.7rem" className="ml-0.5" />
                  </span>{" "}
                  , 3
                  <span className="inline-flex font-semibold underline underline-offset-2">
                    <GiClubs size="0.7rem" className="mx-0.5" />
                  </span>
                  ). Each card placed is worth one point.
                </p>
                <Image
                  src={boardPlacementExample}
                  alt={"Example of a card being placed on the board"}
                  width={263}
                  height={203}
                  className="h-[203px] w-[263px] rounded-md border-[1px] border-white shadow-lg"
                  placeholder="blur"
                />
              </div>
            </li>
            <li>
              <div className="baseVertFlex w-full !items-start !justify-start gap-4 sm:!flex-row sm:gap-8">
                <p>
                  You may place cards on your squeak piles as well, however each
                  card must be of{" "}
                  <span className="font-semibold underline underline-offset-2">
                    opposite color
                  </span>{" "}
                  and{" "}
                  <span className="font-semibold underline underline-offset-2">
                    one rank lower
                  </span>{" "}
                  than the previous card, similar to Solitaire (ex. J
                  <span className="inline-flex font-semibold underline underline-offset-2">
                    <GiSpades size="0.7rem" className="ml-0.5" />
                  </span>{" "}
                  , 10
                  <span className="inline-flex font-semibold underline underline-offset-2">
                    <GiHearts size="0.7rem" className="ml-0.5" />
                  </span>{" "}
                  , 9
                  <span className="inline-flex font-semibold underline underline-offset-2">
                    <GiClubs size="0.7rem" className="mx-0.5" />
                  </span>
                  ). Only the last card in your squeak pile is able to be played
                  on the board, however you can move a group of cards between
                  piles as long as the stacking rules are followed.
                </p>
                <Image
                  src={squeakStackPlacementExample}
                  alt={"Example of a card being placed on the board"}
                  width={302}
                  height={186}
                  className="h-[186px] w-[302px] rounded-md border-[1px] border-white shadow-lg"
                  placeholder="blur"
                />
              </div>
            </li>
            <li>
              <p className="w-full">
                There are no turns in Squeak, you may place cards anywhere at
                any time as long as they follow the above rules.
              </p>
            </li>
          </ul>
        </DynamicSectionContainer>

        <DynamicSectionContainer
          viewportLabel={viewportLabel}
          title={"Scoring"}
        >
          <ul className="baseVertFlex w-auto list-disc !items-start gap-4 pl-4 pt-0 text-sm text-lightGreen lg:w-[725px] lg:text-base tablet:p-4 tablet:pl-8">
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
        </DynamicSectionContainer>

        <DynamicSectionContainer viewportLabel={viewportLabel} title={"Voting"}>
          <ul className="baseVertFlex w-auto list-disc !items-start gap-4 pl-4 pt-0 text-sm text-lightGreen lg:w-[725px] lg:text-base tablet:p-4 tablet:pl-8">
            <li>
              If a player feels that no one has a valid move to make, they may
              start a vote to rotate everyone&apos;s deck by one card. This
              should increase the chance for more valid moves to be made.
            </li>
            <li>
              If the decks have been rotated multiple times and it feels like
              the game is at a standstill, players may vote to end the round
              where it is. Note that nobody will receive the Squeak bonus if
              this vote passes.
            </li>
            <li>Votes require every player to agree in order to pass.</li>
          </ul>
        </DynamicSectionContainer>
      </div>
    </DialogContent>
  );
}

export default TutorialDialog;

interface IDynamicSectionContainer {
  viewportLabel: "mobile" | "mobileLarge" | "tablet" | "desktop";
  title: string;
  children: ReactNode;
}

function DynamicSectionContainer({
  viewportLabel,
  title,
  children,
}: IDynamicSectionContainer) {
  return (
    <>
      {viewportLabel.includes("mobile") ? (
        <div className="baseVertFlex w-full !items-start gap-2 px-2">
          <p className="text-base font-medium text-lightGreen underline underline-offset-2">
            {title}
          </p>
          {children}
        </div>
      ) : (
        <fieldset className="mt-4 rounded-md border-2 border-white p-4">
          <legend className="pl-4 pr-4 text-left text-base text-lightGreen lg:text-lg">
            {title}
          </legend>
          {children}
        </fieldset>
      )}
    </>
  );
}
