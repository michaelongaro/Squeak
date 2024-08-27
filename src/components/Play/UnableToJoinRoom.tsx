import { useRouter } from "next/router";
import { IoHome, IoWarningOutline } from "react-icons/io5";
import { Button } from "~/components/ui/button";

interface IUnableToJoinRoom {
  header: string;
  body: string;
}

function UnableToJoinRoom({ header, body }: IUnableToJoinRoom) {
  const router = useRouter();

  return (
    <div className="baseVertFlex min-h-[100dvh] py-16">
      <div className="baseVertFlex w-10/12 gap-4 rounded-md border-2 border-lightGreen bg-gradient-to-br from-green-800 to-green-850 p-4 text-lightGreen md:w-[500px] md:p-8">
        <div className="baseFlex gap-2">
          <IoWarningOutline className="size-6 tablet:size-8" />
          <h1 className="text-lg font-semibold tablet:text-2xl">{header}</h1>
        </div>
        <p className="text-center tablet:text-lg">{body}</p>

        <Button onClick={() => router.push("/")} className="mt-4 gap-3">
          <IoHome size={"1.25rem"} />
          Return home
        </Button>
      </div>
    </div>
  );
}

export default UnableToJoinRoom;
