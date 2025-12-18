"use client";

import React from "react";
import { signIn, signOut, useSession } from "next-auth/react";

const SignInButton = () => {
  const { data: session, status } = useSession();
  if (session && session.user) {
    return (
      <div className="flex gap-4 ml-auto">
        <div className="flex items-center">
          <div className="text-sm font-medium text-gray-500">
            {session.user.name}
          </div>
        </div>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="btn btn-neutral"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 ml-auto">
      <div className="flex items-center">
        {status === "loading" ? (
          <div className="text-sm font-medium text-gray-500">Loading...</div>
        ) : (
          <button
            type="button"
            onClick={() => signIn()}
            className="btn btn-secondary"
          >
            Sign In
          </button>
        )}
      </div>
    </div>
  );
};

export default SignInButton;
