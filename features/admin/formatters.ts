export function formatDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

export function formatDateTime(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export function formatPieceTitles(titles: string[], max = 3): string {
  if (!titles.length) return "-";
  if (titles.length <= max) return titles.join(", ");
  const shown = titles.slice(0, max).join(", ");
  const remaining = titles.length - max;
  return `${shown} +${remaining}`;
}
