import SignInButton from "@/ui/SignInButton";
import React from "react";
import QuestionMarkCircleIcon from "@/ui/svg/QuestionMarkCircleIcon";
import Link from "next/link";

export default function NavBar({
  title,
  isFeedForm,
  isHome,
}: {
  title?: string;
  isFeedForm?: boolean;
  isHome?: boolean;
}) {
  return (
    <div className="navbar bg-base-100 px-4">
      <div className="flex-none">
        {title ? <span className="text-lg font-bold">{title}</span> : null}
      </div>
      <div className="flex-1 px-2 mx-2 text-center flex justify-center">
        {isHome ? null : (
          <Link className="btn btn-ghost normal-case text-xl" href="/public">
            MM Database
          </Link>
        )}
      </div>

      {isFeedForm ? (
        <div className="flex-none">
          <label htmlFor="my-drawer-4" className="drawer-button btn btn-link">
            <QuestionMarkCircleIcon className="w-7 h-7" />
          </label>
        </div>
      ) : null}
      <div className="flex-none">
        <SignInButton />
        {/*<div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
            <div className="w-10 rounded-full">
              <img src="https://ui-avatars.com/api/?name=Julien+Lemaître" />
            </div>
          </label>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content mt-3 z-1 p-2 shadow bg-base-100 rounded-box w-52"
          >
            <li>
              <a className="justify-between">
                Profile
                <span className="badge">New</span>
              </a>
            </li>
            <li>
              <a>Settings</a>
            </li>
            <li>
              <SignInButton />
            </li>
          </ul>
        </div>*/}
      </div>
    </div>
  );
}
