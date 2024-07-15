import {
  clerkMiddleware,
  // , createRouteMatcher
} from "@clerk/nextjs/server";
// import { clerkClient } from "@clerk/nextjs/server";
// import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  return;
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
