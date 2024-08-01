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
          <IoWarningOutline className="h-8 w-8" />
          <h1 className="text-2xl font-semibold">{header}</h1>
        </div>
        <p className="text-center text-lg">{body}</p>

        <Button
          icon={<IoHome size={"1.25rem"} />}
          innerText={"Return home"}
          iconOnLeft
          onClickFunction={() => router.push("/")}
          className="mt-4 gap-3"
        />
      </div>
    </div>
  );
}

export default UnableToJoinRoom;
