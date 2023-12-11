"use client";

import { useRouter } from "next/navigation";

export default function NotAuthorized() {
  const router = useRouter();

  return (
    <>
      <h1 className="mb-4 text-4xl font-bold">You are not authorized</h1>
      <p>{`Your don't have the necessary access rights to view this page.`}</p>
      <button
        onClick={() => {
          router.push("/");
        }}
        className="btn btn-primary mt-4"
      >
        Back to homepage
      </button>
    </>
  );
}
