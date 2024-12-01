import { motion } from "framer-motion";
import { MdBrowserUpdated } from "react-icons/md";

function UnsupportedBrowserDetected() {
  return (
    <motion.div
      key={"UnsupportedBrowserDetected"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="baseVertFlex h-screen w-full"
    >
      <div className="baseVertFlex from-offwhite relative max-w-80 gap-0 overflow-hidden rounded-lg border-2 border-white bg-darkGreen px-6 py-8 text-lightGreen shadow-md tablet:max-w-2xl tablet:p-12 tablet:pb-8">
        <MdBrowserUpdated className="mb-4 size-10" />

        <div className="baseVertFlex gap-4 pb-6">
          <p className="text-center text-lg font-medium">Unsupported Browser</p>

          <p className="text-center text-sm md:text-base">
            It looks like you&apos;re using an outdated browser that does not
            support some of the required features to play Squeak. To ensure the
            best experience while playing, please update your browser to the
            latest version. Thank you!
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default UnsupportedBrowserDetected;
