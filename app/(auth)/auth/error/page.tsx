"use client";

import { useRouter } from "next/navigation";

export default function AuthError() {
  const router = useRouter();

  return (
    <>
      <h1 className="mb-4 text-4xl font-bold">Something went wrong...</h1>
      <p>{`An error occur in the authentication process`}</p>
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
