"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormInput } from "@/components/ReactHookForm/FormInput";

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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm({
    // defaultValues: user,
    resolver: zodResolver(UserSchema),
  });

  // If logged in, redirect to the homepage
  if (session?.user) {
    router.push("/");
    return null;
  }

  const onSubmit = async (data) => {
    console.log("data", data);
    const response = await fetch("/api/user/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push("/register/success");
    }
  };

  return (
    <div className="flex-col items-center">
      <h1 className="mb-4 text-4xl font-bold">Register</h1>
      <form
        // className="flex flex-col items-center justify-center w-full max-w-md mt-6"
        onSubmit={handleSubmit(onSubmit)}
      >
        <FormInput
          name="name"
          label="Name"
          isRequired
          {...{ register, watch, errors }}
        />
        <FormInput
          name="email"
          label="Email"
          isRequired
          {...{ register, watch, errors }}
        />
        <FormInput
          name="password"
          label="Password"
          type="password"
          isRequired
          {...{ register, watch, errors }}
        />
        <FormInput
          name="confirmPassword"
          label="Confirm password"
          type="password"
          isRequired
          {...{ register, watch, errors }}
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
    </div>
  );
}
