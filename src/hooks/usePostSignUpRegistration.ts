import { useClerk, useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { api } from "~/utils/api";

function usePostSignUpRegistration() {
  const { user } = useClerk();
  const { isLoaded, isSignedIn } = useAuth();
  const ctx = api.useUtils();

  const { data: isUserRegistered } = api.users.isUserRegistered.useQuery(
    user?.id ?? "",
    {
      enabled: Boolean(user?.id && isSignedIn),
    },
  );

  const { mutate: addNewUser } = api.users.create.useMutation({
    onSuccess: () => {
      ctx.users.getUserByID.invalidate();
    },
  });

  useEffect(() => {
    if (!isLoaded || !isSignedIn || isUserRegistered || !user) return;

    console.log(
      "trying to add because",

      "isLoaded",
      isLoaded,
      "isSignedIn",
      isSignedIn,
      "isUserRegistered",
      isUserRegistered,
      "user",
      user,
    );

    addNewUser({
      userId: user.id,
      username: user.username ?? "New user",
      imageUrl: user.imageUrl,
    });
  }, [isLoaded, isSignedIn, isUserRegistered, user, addNewUser]);

  return null;
}

export default usePostSignUpRegistration;
