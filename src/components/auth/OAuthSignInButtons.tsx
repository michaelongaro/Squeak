import { useRef } from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import useOnClickOutside from "../../hooks/useOnClickOutside";
import SecondaryButton from "../Buttons/SecondaryButton";
import { IoClose } from "react-icons/io5";
import { FaGoogle, FaDiscord } from "react-icons/fa";

interface IOAuthSignInButtons {
  forSignup: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
}

function OAuthSignInButtons({ forSignup, setShowModal }: IOAuthSignInButtons) {
  const signInRef = useRef<HTMLDivElement>(null);

  useOnClickOutside({
    ref: signInRef,
    setShowModal,
  });

  return (
    <motion.div
      key={"loginModal"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed left-0 top-0 z-[1000] flex min-h-[100dvh] min-w-[100vw] items-center justify-center bg-black/50"
    >
      <motion.div
        ref={signInRef}
        key={"loginModalInner"}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="baseVertFlex relative gap-8 rounded-md border-2 border-white bg-green-800 px-16 py-8"
      >
        <div
          style={{
            color: "hsl(120deg 100% 86%)",
            filter: "drop-shadow(2px 3px 2px rgba(0, 0, 0, 0.2))",
          }}
          className="text-xl font-medium"
        >
          {forSignup ? "Sign up" : "Login"}
        </div>

        <SecondaryButton
          innerText={"Continue with"}
          icon={<FaGoogle size={"1.25rem"} />}
          extraPadding={true}
          style={{
            gap: "0.75rem",
            marginRight: "0.25rem",
          }}
          onClickFunction={() => signIn("google")}
        />

        <SecondaryButton
          innerText={"Continue with"}
          icon={<FaDiscord size={"1.25rem"} />}
          extraPadding={true}
          style={{
            gap: "0.75rem",
            marginRight: "0.25rem",
          }}
          onClickFunction={() => signIn("discord")}
        />

        <SecondaryButton
          icon={<IoClose size={"1.5rem"} />}
          extraPadding={false}
          onClickFunction={() => setShowModal(false)}
          width={"2rem"}
          height={"2rem"}
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

export default OAuthSignInButtons;
