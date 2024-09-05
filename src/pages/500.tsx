import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { IoWarningOutline } from "react-icons/io5";

function Custom500() {
  const { push } = useRouter();

  return (
    <div className="baseVertFlex min-h-[100dvh] w-[100vw]">
      <div className="baseVertFlex rounded-md border-2 border-white bg-gradient-to-br from-green-800 to-green-850 p-12 text-lightGreen shadow-lg">
        <IoWarningOutline className="size-12" />

        <div className="baseVertFlex mt-8 gap-4">
          <div className="text-2xl">500 - An unexpected error occured</div>

          <Button onClick={() => push("/")} className="mt-4">
            Return to homepage
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Custom500;
