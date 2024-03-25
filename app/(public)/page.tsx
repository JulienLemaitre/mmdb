import { Metadata } from "next";
import Link from "next/link";
import { URL_EXPLORE, URL_EDITION } from "@/utils/routes";
import NavBar from "@/app/NavBar";

export const metadata: Metadata = {
  title: "The Metronome Mark Database",
  icons: {
    icon: "./favicon.ico",
    // shortcut: '/shortcut-icon.png',
    // apple: '/apple-icon.png',
    // other: {
    //   rel: 'apple-touch-icon-precomposed',
    //   url: '/apple-touch-icon-precomposed.png',
    // },
  },
};

export default function Home() {
  return (
    <>
      <NavBar isHome />
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <h1 className="mb-8 text-4xl font-bold">The Metronome Mark Database</h1>
        <div className="flex flex-col items-stretch gap-6 w-full max-w-xs">
          <Link href={URL_EXPLORE} className="btn btn-primary">
            Explore data
          </Link>
          <Link href={URL_EDITION} className="btn btn-primary">
            Edit new Metronome Marks
          </Link>
          <button className="btn btn-disabled">Review</button>
        </div>
      </div>
    </>
  );
}
