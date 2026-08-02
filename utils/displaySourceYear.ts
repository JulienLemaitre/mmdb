import { MMSource } from "@/prisma/client";

export function displaySourceYear(
  mMSource: Pick<MMSource, "year" | "isYearEstimated">,
): string | number {
  if (mMSource.year == null) {
    return "No date";
  }
  return mMSource.isYearEstimated ? `(${mMSource.year})` : mMSource.year;
}
