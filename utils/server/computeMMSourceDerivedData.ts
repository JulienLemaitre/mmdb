import { FeedFormState } from "@/types/feedFormTypes";
import getIMSLPPermaLink from "@/utils/getIMSLPPermaLink";

export type MMSourceDerivedData = {
  sectionCount: number;
  permalink: string;
};

/**
 * Pure server helper computing MMSource derived fields from a FeedFormState:
 * - sectionCount: total number of sections across all piece versions linked to the source (after fork remapping).
 * - permalink: canonical IMSLP permanent link derived from mMSourceDescription.link (or empty string if missing).
 */
export function computeMMSourceDerivedData(
  state: FeedFormState,
): MMSourceDerivedData {
  const includedPieceVersionIds = new Set(
    (state.mMSourceOnPieceVersions ?? [])
      .map((pv) => pv.pieceVersionId)
      .filter((id): id is string => Boolean(id)),
  );

  const includedPieceVersions = (state.pieceVersions ?? []).filter((pv) =>
    includedPieceVersionIds.has(pv.id),
  );

  const sectionCount = includedPieceVersions.reduce(
    (acc, pv) =>
      acc +
      (pv.movements ?? []).reduce(
        (mAcc, mv) => mAcc + (mv.sections ?? []).length,
        0,
      ),
    0,
  );

  const rawLink = state.mMSourceDescription?.link?.trim() ?? "";
  const permalink = rawLink ? getIMSLPPermaLink(rawLink) : "";

  return {
    sectionCount,
    permalink,
  };
}

export default computeMMSourceDerivedData;
