"use client";

import React, { useEffect } from "react";
import Metronome from "@/ui/Metronome";
import { signOut } from "next-auth/react";

function LogOut() {
  useEffect(() => {
    setTimeout(() => {
      signOut({ callbackUrl: "/login" });
    }, 3000);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-2 flex-1">
      <h1 className="mb-8 text-xl font-bold">
        Your connexion has expired, please login again.
      </h1>
      <div className="flex justify-center">
        <Metronome />
      </div>
    </div>
  );
}

export default LogOut;
