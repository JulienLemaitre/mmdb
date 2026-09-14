"use client";

import React from "react";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { LoaderCentered } from "@/ui/LoaderCentered";
import UserCircleIcon from "@/ui/svg/UserCircleIcon";
import { URL_ADMIN, URL_DASHBOARD } from "@/utils/routes";

export default function UserProfileMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center">
        <LoaderCentered />
      </div>
    );
  }

  if (!session || !session.user) {
    return (
      <button
        type="button"
        onClick={() => signIn()}
        className="btn btn-secondary btn-sm md:btn-md"
      >
        Sign In
      </button>
    );
  }

  const role = session.user.role;
  const isAdmin = role === "ADMIN";

  return (
    <div className="dropdown dropdown-end dropdown-hover">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost normal-case flex items-center gap-2"
        aria-label="User profile menu"
      >
        <UserCircleIcon className="w-6 h-6 text-primary" />
        <span className="font-medium text-sm max-w-[140px] truncate">
          {session.user.name || session.user.email}
        </span>
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu menu-sm bg-base-100 rounded-box z-50 w-52 p-2 shadow-lg border border-base-200"
      >
        <li>
          <Link href={URL_DASHBOARD} className="py-2">
            Dashboard
          </Link>
        </li>
        {isAdmin ? (
          <li>
            <Link href={URL_ADMIN} className="py-2">
              Admin
            </Link>
          </li>
        ) : null}
        <div className="divider my-1" />
        <li>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-error py-2 hover:bg-error/10"
          >
            Sign Out
          </button>
        </li>
      </ul>
    </div>
  );
}
