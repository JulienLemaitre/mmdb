"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { URL_ADMIN } from "@/utils/routes";

type Props = {
  className?: string;
};

export default function AdminLink({ className }: Props) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string | undefined;

  if (role !== "ADMIN") return null;

  return (
    <Link href={URL_ADMIN} className={className || "btn btn-primary"}>
      Admin dashboard
    </Link>
  );
}
