"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { FormInput } from "@/components/ReactHookForm/FormInput";
import { Suspense } from "react";
import preventEnterKeySubmission from "@/utils/preventEnterKeySubmission";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function LoginPage() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const callbackUrl = searchParams.get("callbackUrl");
  console.log(`[Login] message :`, message);
  console.log(`[Login] callbackUrl :`, callbackUrl);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
  } = useForm({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data) => {
    console.log("data", data);
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: true,
      callbackUrl: callbackUrl ?? `/`,
    });
  };

  return (
    <div className="flex-col items-center">
      <h1 className="mb-4 text-4xl font-bold">Log in to your account</h1>
      {message && <div className="mb-4 text-red-500">{message}</div>}
      <form
        // className="flex flex-col items-center justify-center w-full max-w-md mt-6"
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={preventEnterKeySubmission}
      >
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
        <button
          className="btn btn-primary mt-6 w-full max-w-xs"
          type="submit"
          disabled={isSubmitting}
        >
          Log in
          {isSubmitting && (
            <span className="loading loading-spinner loading-sm"></span>
          )}
        </button>
      </form>
    </div>
  );
}

export default function Login() {
  return (
    // You could have a loading skeleton as the `fallback` too
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
