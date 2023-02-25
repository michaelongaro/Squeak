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
      className="fixed top-0 left-0 z-[500] flex min-h-[100vh] min-w-[100vw] items-center justify-center bg-black/50 transition-all"
    >
      <div
        ref={signInRef}
        className="baseVertFlex relative gap-8 rounded-md border-2 border-white bg-green-800 p-16"
      >
        <SecondaryButton
          innerText={`${forSignup ? "Sign up" : "Login"} with`}
          icon={<FaGoogle size={"1.25rem"} />}
          extraPadding={true}
          onClickFunction={() => signIn("google")}
        />

        <SecondaryButton
          innerText={`${forSignup ? "Sign up" : "Login"} with`}
          icon={<FaDiscord size={"1.25rem"} />}
          extraPadding={true}
          onClickFunction={() => signIn("discord")}
        />

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
    </motion.div>
  );
}

export default OAuthSignInButtons;
