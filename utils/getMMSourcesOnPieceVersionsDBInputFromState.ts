import { MMSourcePieceVersionsState } from "@/types/formTypes";
import { Prisma } from "@prisma/client";
import getPieceNestedDBInputFromState from "@/utils/getPieceNestedDBInputFromState";
import getTempoIndicationNestedDBInputFromState from "@/utils/getTempoIndicationNestedDBInputFromState";
import { PersistableFeedFormState } from "@/types/feedFormTypes";

export default function getMMSourcesOnPieceVersionsDBInputFromState(
  mMSourcesOnPieceVersion: MMSourcePieceVersionsState,
  state: PersistableFeedFormState,
  creatorId: string,
): Prisma.MMSourcesOnPieceVersionsCreateWithoutMMSourceInput {
  const newPieceVersion = state.pieceVersions.find(
    (pv) => pv.id === mMSourcesOnPieceVersion.pieceVersionId && pv.isNew,
  );

  return {
    rank: mMSourcesOnPieceVersion.rank,
    pieceVersion: {
      ...(newPieceVersion
        ? {
            create: {
              piece: getPieceNestedDBInputFromState(
                newPieceVersion.pieceId,
                state,
                creatorId,
              ),
              id: newPieceVersion.id,
              category: newPieceVersion.category,
              creator: {
                connect: {
                  id: creatorId,
                },
              },
              movements: {
                create: newPieceVersion.movements
                  .sort((a, b) => a.rank - b.rank)
                  .map((movement) => ({
                    id: movement.id,
                    rank: movement.rank,
                    key: movement.key,
                    sections: {
                      create: movement.sections
                        .sort((a, b) => a.rank - b.rank)
                        .map((section) => ({
                          id: section.id,
                          rank: section.rank,
                          metreNumerator: section.metreNumerator,
                          metreDenominator: section.metreDenominator,
                          isCommonTime: section.isCommonTime,
                          isCutTime: section.isCutTime,
                          fastestStructuralNotesPerBar:
                            section.fastestStructuralNotesPerBar,
                          fastestStaccatoNotesPerBar:
                            section.fastestStaccatoNotesPerBar,
                          fastestRepeatedNotesPerBar:
                            section.fastestRepeatedNotesPerBar,
                          fastestOrnamentalNotesPerBar:
                            section.fastestOrnamentalNotesPerBar,
                          isFastestStructuralNoteBelCanto:
                            section.isFastestStructuralNoteBelCanto,
                          tempoIndication:
                            getTempoIndicationNestedDBInputFromState(
                              section.tempoIndication.id,
                              state,
                              creatorId,
                            ),
                          ...(section.comment
                            ? {
                                comment: section.comment,
                              }
                            : {}),
                        })),
                    },
                  })),
              },
            },
          }
        : {
            connect: {
              id: mMSourcesOnPieceVersion.pieceVersionId,
            },
          }),
    },
  };
}
