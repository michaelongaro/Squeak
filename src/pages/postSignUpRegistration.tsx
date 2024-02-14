import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { api } from "~/utils/api";

function PostSignUpRegistration() {
  const { user } = useClerk();
  const { push } = useRouter();

  const { mutate: addNewUser } =
    api.postSignUpRegistration.initializeNewUser.useMutation({
      onSettled: () => void push("/"),
    });

  useEffect(() => {
    if (!user) return;
    addNewUser({
      userId: user.id,
      username: user.username!,
      imageUrl: user.imageUrl,
    });
  }, [user, addNewUser]);

  return null;
}

export default PostSignUpRegistration;
