import React from "react";
import { BiErrorAlt } from "react-icons/bi";
import PrimaryButton from "../components/Buttons/PrimaryButton";

function Custom404() {
  return (
    <div className="baseVertFlex min-h-[100vh] w-[100vw]">
      <div
        style={{
          color: "hsl(120, 100%, 86%)",
        }}
        className="baseVertFlex rounded-md border-2 border-white bg-green-800 p-8 shadow-lg"
      >
        <BiErrorAlt size={"3rem"} />

        <div className="baseVertFlex mt-8 gap-4">
          <div className="text-2xl">404 - Page Not Found</div>

          <PrimaryButton
            innerText={"Go back to home page"}
            onClickFunction={() => (window.location.href = "/")}
          />
        </div>
      </div>
    </div>
  );
}

export default Custom404;
