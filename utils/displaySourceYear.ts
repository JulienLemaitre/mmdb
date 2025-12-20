import { MMSource } from "@/prisma/client";

export function displaySourceYear(
  mMSource: Pick<MMSource, "year" | "isYearEstimated">,
) {
  return mMSource.isYearEstimated ? `(${mMSource.year})` : mMSource.year;
}
