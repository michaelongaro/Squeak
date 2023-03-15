import { motion } from "framer-motion";
import PrimaryButton from "../Buttons/PrimaryButton";
import Image from "next/image";
import mobileWarning from "../../../public/mobileWarning/mobileWarning.svg";
interface IMobileWarningModal {
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
}

function MobileWarningModal({ setShowModal }: IMobileWarningModal) {
  return (
    <motion.div
      key={"mobileWarningModal"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="baseFlex fixed top-0 left-0 z-[9999] min-h-[100dvh] min-w-[100vw] bg-black/50 transition-all"
    >
      <motion.div
        key={"mobileWarningModalInner"}
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        transition={{ duration: 0.15 }}
        className="baseVertFlex w-4/5 rounded-md border-2 border-white shadow-md lg:w-96"
      >
        <div
          style={{
            color: "hsl(120deg 100% 86%)",
          }}
          className="baseVertFlex relative h-full w-full gap-8 rounded-md bg-green-800 p-4 text-center"
        >
          <Image
            src={mobileWarning}
            alt={"mobile warning"}
            className={"h-20 w-20"}
          />

          <div>
            Due to how mobile browsers respond to drag gestures, this game can
            only be played on a desktop browser.
          </div>

          <div>I plan on creating native iOS and Android apps soon.</div>

          <PrimaryButton
            innerText={"Proceed anyway"}
            onClickFunction={() => setShowModal(false)}
          />

          <button
            onClick={() => {
              if (typeof window === "undefined") return;
              localStorage.setItem("allowedToShowMobileWarningModal", "false");
              setShowModal(false);
            }}
            className="text-sm text-white underline"
          >
            Don&apos;t show this message again
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default MobileWarningModal;
