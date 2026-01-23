type PieceVersionLink = {
  rank: number | null;
  pieceVersion?: {
    category?: string | null;
    piece?: {
      title?: string | null;
    } | null;
  } | null;
};

export function buildPieceVersionLabels(links: PieceVersionLink[]): string[] {
  return links.map((link) => {
    const rank = typeof link.rank === "number" ? link.rank : null;
    const title = link.pieceVersion?.piece?.title ?? "Untitled piece";
    const category = link.pieceVersion?.category ?? "UNKNOWN";
    if (rank !== null) {
      return `#${rank} ${title} (${category})`;
    }
    return `${title} (${category})`;
  });
}
