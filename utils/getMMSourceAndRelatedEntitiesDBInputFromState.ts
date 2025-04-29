import { Prisma } from ".prisma/client";
import { SOURCE_TYPE } from "@prisma/client";
import getMMSourceContributionDBInputFromState from "@/utils/getMMSourceContributionDBInputFromState";
import getMMSourcesOnPieceVersionsDBInputFromState from "@/utils/getMMSourcesOnPieceVersionsDBInputFromState";
import { PersistableFeedFormState } from "@/types/feedFormTypes";

// Prepare the data for persistence in DB of MMSource, References, Contributions, MMSourcesOnPieceVersions, MetronomeMarks
export default function getMMSourceAndRelatedEntitiesDBInputFromState(
  state: PersistableFeedFormState,
  creatorId: string,
): Prisma.MMSourceCreateInput {
  const { mMSourceDescription } = state;
  const { id, title, year, type, link, comment, references } =
    mMSourceDescription;

  // Convert the 'type' and 'references' properties to match the SourceDescriptionInput type
  const mMSourceInput: Prisma.MMSourceCreateInput = {
    id,
    ...(title ? { title } : {}),
    year,
    link,
    type: type as SOURCE_TYPE,
    ...(comment ? { comment } : {}),
    ...(references.length > 0
      ? {
          references: {
            create: references.map((reference) => ({
              type: reference.type,
              reference: reference.reference,
            })),
          },
        }
      : {}),
    contributions: {
      create: state.mMSourceContributions.map((contribution) =>
        getMMSourceContributionDBInputFromState(contribution),
      ),
    },
    pieceVersions: {
      create: state.mMSourcePieceVersions.map((mMSourceOnPieceVersion) =>
        getMMSourcesOnPieceVersionsDBInputFromState(
          mMSourceOnPieceVersion,
          state,
          creatorId,
        ),
      ),
    },
  };

  return mMSourceInput;
}
