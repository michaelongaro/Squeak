import React, { useState, useEffect } from "react";

import { AnimatePresence } from "framer-motion";
import OAuthSignInButtons from "./OAuthSignInButtons";
import SecondaryButton from "../Buttons/SecondaryButton";
import PrimaryButton from "../Buttons/PrimaryButton";

interface ILogIn {
  gap: string;
}

function LogIn({ gap }: ILogIn) {
  const [showModal, setShowModal] = useState<boolean>(false);

  return (
    <>
      <div style={{ gap: gap }} className="flex items-center justify-center">
        <PrimaryButton
          innerText={"Sign Up"}
          width={"8rem"}
          height={"2rem"}
          onClickFunction={() => setShowModal(true)}
        />

        <SecondaryButton
          innerText={"Log In"}
          extraPadding={false}
          width={"8rem"}
          height={"2.5rem"}
          onClickFunction={() => setShowModal(true)}
        />
      </div>
      <AnimatePresence
        initial={false}
        mode={"wait"}
        onExitComplete={() => null}
      >
        {showModal && <OAuthSignInButtons setShowModal={setShowModal} />}
      </AnimatePresence>
    </>
  );
}

export default LogIn;
