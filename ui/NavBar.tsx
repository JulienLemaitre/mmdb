import UserProfileMenu from "@/ui/UserProfileMenu";
import React from "react";
import QuestionMarkCircleIcon from "@/ui/svg/QuestionMarkCircleIcon";
import Link from "next/link";

export default function NavBar({
  title,
  hasHelpSection,
  isHome,
}: {
  title?: string;
  hasHelpSection?: boolean;
  isHome?: boolean;
}) {
  return (
    <div className="navbar bg-base-100 px-4 sticky top-0 z-40 shadow-sm">
      <div className="flex-none">
        {title ? <span className="text-lg font-bold">{title}</span> : null}
      </div>
      <div className="flex-1 px-2 mx-2 text-center flex justify-center">
        {isHome ? null : (
          <Link className="btn btn-ghost normal-case text-xl" href="/">
            MM Database
          </Link>
        )}
      </div>

      {hasHelpSection ? (
        <div className="flex-none">
          <label htmlFor="my-drawer-4" className="drawer-button btn btn-link">
            <QuestionMarkCircleIcon className="w-7 h-7" />
          </label>
        </div>
      ) : null}
      <div className="flex-none">
        <UserProfileMenu />
      </div>
    </div>
  );
}
