export type SourceContent = {
  joinId: string;
  mMSourceId: string;
  pieceVersionId: string;
  rank: number;
  pieceId: string;
  collectionId?: string;
  collectionRank?: number;
};

// API payload shape from /api/review/[reviewId]/overview
export type ApiOverview = {
  reviewId: string;
  graph: any; // ChecklistGraph-like
  globallyReviewed: {
    personIds: string[];
    organizationIds: string[];
    collectionIds: string[];
    pieceIds: string[];
  };
  sourceContents: Array<SourceContent>;
  progress: {
    source: { required: number; checked: number };
    perCollection: Record<string, { required: number; checked: number }>;
    perPiece: Record<string, { required: number; checked: number }>;
  };
};
