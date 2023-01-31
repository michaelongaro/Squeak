import React, { useState, useEffect } from "react";

import { AnimatePresence } from "framer-motion";
import OAuthSignInButtons from "./OAuthSignInButtons";

interface ILogIn {
  gap: string;
}

function LogIn({ gap }: ILogIn) {
  const [showModal, setShowModal] = useState<boolean>(false);

  return (
    <>
      <div style={{ gap: gap }} className="flex items-center justify-center">
        <button
          className="primaryBtn"
          aria-label="Sign Up"
          onClick={() => setShowModal(true)}
        >
          Sign Up
        </button>
        <button
          className="secondaryBtn"
          aria-label="Log In"
          onClick={() => setShowModal(true)}
        >
          Log In
        </button>
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
