import React, { useState } from "react";

import { AnimatePresence } from "framer-motion";
import OAuthSignInButtons from "./OAuthSignInButtons";
import SecondaryButton from "../Buttons/SecondaryButton";
import PrimaryButton from "../Buttons/PrimaryButton";

interface ILogIn {
  gap: string;
}

function LogIn({ gap }: ILogIn) {
  const [forSignup, setForSignup] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);

  return (
    <>
      <div style={{ gap: gap }} className="flex items-center justify-center">
        <PrimaryButton
          innerText={"Sign up"}
          width={"8rem"}
          height={"2rem"}
          onClickFunction={() => {
            setForSignup(true);
            setShowModal(true);
          }}
        />

        <SecondaryButton
          innerText={"Login"}
          extraPadding={false}
          width={"8rem"}
          height={"2.5rem"}
          onClickFunction={() => {
            setForSignup(false);
            setShowModal(true);
          }}
        />
      </div>
      <AnimatePresence
        initial={false}
        mode={"wait"}
        onExitComplete={() => null}
      >
        {showModal && (
          <OAuthSignInButtons
            forSignup={forSignup}
            setShowModal={setShowModal}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default LogIn;
