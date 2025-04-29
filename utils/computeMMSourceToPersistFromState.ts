import { FeedFormState } from "@/types/feedFormTypes";

export default function computeMMSourceToPersistFromState(
  state: FeedFormState,
) {
  return {
    ...state.mMSourceDescription,
    references: state.mMSourceDescription?.references,
    contributions: state.mMSourceContributions,
    pieceVersions: state.mMSourcePieceVersions?.map((pvs) => {
      const pieceVersion = state.pieceVersions?.find(
        (pv) => pv.id === pvs.pieceVersionId,
      );
      const piece = state.pieces?.find((p) => p.id === pieceVersion?.pieceId);
      return {
        rank: pvs.rank,
        pieceVersion: {
          ...pieceVersion,
          piece: {
            ...piece,
            composer: state.persons?.find((p) => p.id === piece?.composerId),
            collection: state.collections?.find(
              (c) => c.id === piece?.collectionId,
            ),
          },
          movements: pieceVersion?.movements?.map((mvt) => ({
            ...mvt,
            sections: mvt?.sections?.map((section) => ({
              ...section,
              metronomeMarks: state.metronomeMarks?.filter(
                (mm) => mm.sectionId === section.id,
              ),
            })),
          })),
        },
      };
    }),
  };
}
