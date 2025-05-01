import { SOURCE_TYPE } from "@prisma/client";

export default function getSourceTypeLabel(sourceType: SOURCE_TYPE): string {
  switch (sourceType) {
    case SOURCE_TYPE.ARTICLE:
      return "Article";
    case SOURCE_TYPE.BOOK:
      return "Book";
    case SOURCE_TYPE.DIARY:
      return "Diary";
    case SOURCE_TYPE.EDITION:
      return "Edition";
    case SOURCE_TYPE.LETTER:
      return "Letter";
    case SOURCE_TYPE.MANUSCRIPT:
      return "Manuscript";
    case SOURCE_TYPE.OTHER:
      return "Other";
    default:
      throw new Error(`Unknown source type: ${sourceType}`);
  }
}
