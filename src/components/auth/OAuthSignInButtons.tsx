import { useRef } from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import useOnClickOutside from "../../hooks/useOnClickOutside";
import { FaTimes } from "react-icons/fa";

interface IOAuthSignInButtons {
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
}

function OAuthSignInButtons({ setShowModal }: IOAuthSignInButtons) {
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
      style={{ overflow: "hidden" }}
      // was absolute below
      className="fixed top-0 left-0 z-[500] flex min-h-[100vh] min-w-[100vw] items-center justify-center bg-green-600/90 transition-all"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        ref={signInRef}
        className="relative flex flex-col items-center justify-center gap-4 rounded-md bg-green-200/75 p-10"
      >
        <button
          className="secondaryBtn flex items-center justify-center gap-4"
          aria-label="Sign in with Google"
          onClick={() => signIn("google")}
        >
          Sign in with
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            width="25px"
            height="25px"
            viewBox="0 0 48 48"
          >
            <g>
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              ></path>
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              ></path>
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              ></path>
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              ></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </g>
          </svg>
        </button>

        <button
          className="secondaryBtn flex items-center justify-center gap-4"
          aria-label="Sign in with Discord"
          onClick={() => signIn("discord")}
        >
          Sign in with
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 127.14 96.36"
            style={{ fill: "#5865f2", width: "25px", height: "25px" }}
          >
            <g id="图层_2" data-name="图层 2">
              <g id="Discord_Logos" data-name="Discord Logos">
                <g
                  id="Discord_Logo_-_Large_-_White"
                  data-name="Discord Logo - Large - White"
                >
                  <path
                    className="cls-1"
                    d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"
                  />
                </g>
              </g>
            </g>
          </svg>
        </button>

        <button
          className="absolute top-2 right-2 transition hover:opacity-50"
          aria-label="Close modal button"
          onClick={() => setShowModal(false)}
        >
          <FaTimes size={"2rem"} style={{ cursor: "pointer" }} />
        </button>
      </motion.div>
    </motion.div>
  );
}

export default OAuthSignInButtons;
