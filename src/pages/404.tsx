import React from "react";
import { BiErrorAlt } from "react-icons/bi";
import PrimaryButton from "../components/Buttons/PrimaryButton";
import { useRouter } from "next/navigation";

function Custom404() {
  const { push } = useRouter();

  return (
    <div className="baseVertFlex min-h-[100dvh] w-[100vw]">
      <div
        style={{
          color: "hsl(120, 100%, 86%)",
        }}
        className="baseVertFlex rounded-md border-2 border-white bg-gradient-to-br from-green-800 to-green-850 bg-fixed p-8 shadow-lg"
      >
        <BiErrorAlt size={"3rem"} />

        <div className="baseVertFlex mt-8 gap-4">
          <div className="text-2xl">404 - Page Not Found</div>

          <PrimaryButton
            innerText={"Go back to home page"}
            onClickFunction={() => push("/")}
          />
        </div>
      </div>
    </div>
  );
}

export default Custom404;
