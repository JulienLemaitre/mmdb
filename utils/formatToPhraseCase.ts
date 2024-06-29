export default function formatToPhraseCase(label: string): string {
  return label
    .toLowerCase()
    .split("_")
    .map((word, index) =>
      index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word,
    )
    .join(" ");
}
