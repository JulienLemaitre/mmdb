// API routes

export const URL_API_GETALL_COLLECTION_PIECES = "/api/getAll/collectionPieces";
export const URL_API_GETALL_COMPOSERS = "/api/getAll/composers";
export const URL_API_GETALL_COMPOSER_COLLECTION =
  "/api/getAll/composerCollections";
export const URL_API_GETALL_COMPOSER_PIECES = "/api/getAll/composerPieces";
export const URL_API_GETALL_PIECE_PIECE_VERSIONS =
  "/api/getAll/piecePieceVersions";
export const URL_API_GETALL_TEMPO_INDICATIONS = "/api/getAll/tempoIndications";
export const URL_API_GETALL_PERSONS_AND_ORGANIZATIONS =
  "/api/getAll/personsAndOrganizations";
export const URL_API_GETMANY_PIECEVERSIONS = "/api/pieceVersion/getMany";
export const URL_API_FEEDFORM_SUBMIT = "/api/feedForm";
export const URL_API_REVIEW_START = "/api/review/start";
export const URL_API_TO_REVIEW = "/api/mMSource/toReview";

// FRONT routes

export const URL_HOME = "/";
export const URL_EXPLORE = "/explore";
export const URL_FEED = "/feed";
export const URL_REVIEW_LIST = "/review";
export const GET_URL_REVIEW_CHECKLIST = (reviewId: string) =>
  `/review/${reviewId}/checklist`;
