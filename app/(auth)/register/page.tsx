"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormInput } from "@/ui/form/FormInput";
import { useEffect, useState } from "react";
import preventEnterKeySubmission from "@/utils/preventEnterKeySubmission";

const UserSchema = z
  .object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords don't match",
        path: ["confirmPassword"],
      });
    }
  });

export default function Register() {
  const router = useRouter();
  const { data: session } = useSession();
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    control,
  } = useForm({
    // defaultValues: user,
    resolver: zodResolver(UserSchema),
  });

  useEffect(() => {
    setMessage(null);
  }, [watch]);

  const onSubmit = async (data) => {
    console.log("data", data);
    const response = await fetch("/api/user/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    // console.log(`[] response :`, response);

    if (response.ok) {
      router.push("/register/success");
      return;
    }

    // Error handling
    const dataError = await response.json();
    const errorMessage = dataError?.error;
    console.log(`[] errorMessage :`, errorMessage);
    if (errorMessage) {
      setMessage(errorMessage);
    }
  };

  return (
    <div className="flex-col items-center">
      <h1 className="mb-4 text-4xl font-bold">Register</h1>
      {message ? (
        <div role="alert" className="alert alert-warning">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>{message}</span>
        </div>
      ) : null}
      {session?.user ? (
        <>
          <div className="mb-4 text-xl font-bold">
            You are already logged in as {session.user.name}!
          </div>
          <button className="btn btn-primary" onClick={() => router.push("/")}>
            Go to homepage
          </button>
        </>
      ) : null}
      {!session?.user ? (
        <form
          // className="flex flex-col items-center justify-center w-full max-w-md mt-6"
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={preventEnterKeySubmission}
        >
          <FormInput
            name="name"
            label="Name"
            isRequired
            {...{ register, control, errors }}
          />
          <FormInput
            name="email"
            label="Email"
            isRequired
            {...{ register, control, errors }}
          />
          <FormInput
            name="password"
            label="Password"
            type="password"
            isRequired
            {...{ register, control, errors }}
          />
          <FormInput
            name="confirmPassword"
            label="Confirm password"
            type="password"
            isRequired
            {...{ register, control, errors }}
          />
          <button
            className="btn btn-primary mt-6 w-full max-w-xs"
            type="submit"
            disabled={isSubmitting}
          >
            Register
            {isSubmitting && (
              <span className="loading loading-spinner loading-sm"></span>
            )}
          </button>
        </form>
      ) : null}
    </div>
  );
}
