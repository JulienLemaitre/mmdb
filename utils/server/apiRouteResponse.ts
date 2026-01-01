import { NextResponse } from "next/server";

export const forbiddenResponse = () =>
  NextResponse.json(
    { error: "Forbidden: Insufficient role permissions" },
    { status: 403 },
  );

export const unauthorizedResponse = () =>
  NextResponse.json({ error: "Unauthorized: Please log in" }, { status: 401 });
