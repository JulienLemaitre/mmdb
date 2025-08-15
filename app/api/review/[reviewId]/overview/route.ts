import { NextResponse } from "next/server";
import { ChecklistGraph } from "@/utils/ReviewChecklistSchema";
import { computeOverviewProgress } from "@/utils/reviewProgress";

export async function GET(
  _req: Request,
  { params }: { params: { reviewId: string } },
) {
  // For skeleton purposes, return a deterministic mock graph based on reviewId
  const reviewId = params.reviewId;

  // Mock entities
  const sourceId = "src-1";
  const collectionId = "col-1";
  const pieceAId = "p-1";
  const pieceBId = "p-2";
  const pvAId = "pv-1";
  const pvBId = "pv-2";
  const movA1Id = "mv-1";
  const movB1Id = "mv-2";
  const secA1Id = "s-1";
  const secB1Id = "s-2";
  const tiAId = "ti-1";
  const tiBId = "ti-2";
  const mmAId = "mm-1";
  const mmBId = "mm-2";

  const graph: ChecklistGraph = {
    source: {
      id: sourceId,
      title: `Mock Review Source ${reviewId}`,
      type: "SCORE",
      link: "https://example.com/score",
      permalink: "https://perma.example/score",
      year: 1820,
      comment: "Demo comment",
    },
    collections: [
      { id: collectionId, title: "Op. 10", composerId: "person-1" },
    ],
    pieces: [
      {
        id: pieceAId,
        title: "Op. 10 No. 1",
        nickname: "Allegro",
        composerId: "person-1",
        yearOfComposition: 1798,
        collectionId,
        collectionRank: 1,
      },
      {
        id: pieceBId,
        title: "Op. 10 No. 2",
        nickname: "Adagio",
        composerId: "person-1",
        yearOfComposition: 1798,
        collectionId,
        collectionRank: 2,
      },
    ],
    pieceVersions: [
      { id: pvAId, pieceId: pieceAId, category: "URTEXT" },
      { id: pvBId, pieceId: pieceBId, category: "URTEXT" },
    ],
    movements: [
      { id: movA1Id, pieceVersionId: pvAId, rank: 1, key: "C minor" },
      { id: movB1Id, pieceVersionId: pvBId, rank: 1, key: "F major" },
    ],
    sections: [
      {
        id: secA1Id,
        movementId: movA1Id,
        rank: 1,
        metreNumerator: 4,
        metreDenominator: 4,
        isCommonTime: true,
        isCutTime: false,
        fastestStructuralNotesPerBar: 16,
        fastestStaccatoNotesPerBar: 16,
        fastestRepeatedNotesPerBar: 16,
        fastestOrnamentalNotesPerBar: 16,
        isFastestStructuralNoteBelCanto: false,
        tempoIndicationId: tiAId,
        comment: "",
        commentForReview: "",
      },
      {
        id: secB1Id,
        movementId: movB1Id,
        rank: 1,
        metreNumerator: 3,
        metreDenominator: 4,
        isCommonTime: false,
        isCutTime: false,
        fastestStructuralNotesPerBar: 12,
        fastestStaccatoNotesPerBar: 12,
        fastestRepeatedNotesPerBar: 12,
        fastestOrnamentalNotesPerBar: 12,
        isFastestStructuralNoteBelCanto: false,
        tempoIndicationId: tiBId,
        comment: "",
        commentForReview: "",
      },
    ],
    tempoIndications: [
      { id: tiAId, text: "Allegro" },
      { id: tiBId, text: "Andante" },
    ],
    metronomeMarks: [
      { id: mmAId, sectionId: secA1Id, beatUnit: "quarter", bpm: 120, comment: "" },
      { id: mmBId, sectionId: secB1Id, beatUnit: "quarter", bpm: 88, comment: "" },
    ],
    references: [
      { id: "ref-1", type: "URL", reference: "https://example.com/op10" },
    ],
    contributions: [
      { id: "cont-1", role: "MM_PROVIDER", personId: "person-1" },
    ],
    persons: [
      { id: "person-1", firstName: "Ludwig", lastName: "Beethoven", birthYear: 1770, deathYear: 1827 },
    ],
    organizations: [],
    sourceContents: [
      {
        joinId: "join-1",
        mMSourceId: sourceId,
        pieceVersionId: pvAId,
        rank: 1,
        pieceId: pieceAId,
        collectionId,
        collectionRank: 1,
      },
      {
        joinId: "join-2",
        mMSourceId: sourceId,
        pieceVersionId: pvBId,
        rank: 2,
        pieceId: pieceBId,
        collectionId,
        collectionRank: 2,
      },
    ],
  };

  // Pretend person-1 already globally reviewed to exercise filtering in UI
  const globallyReviewed = {
    personIds: ["person-1"],
    organizationIds: [],
    collectionIds: [],
    pieceIds: [],
  };

  const progress = computeOverviewProgress(graph);

  return NextResponse.json({
    reviewId,
    graph,
    globallyReviewed,
    sourceContents: graph.sourceContents,
    progress,
  });
}
