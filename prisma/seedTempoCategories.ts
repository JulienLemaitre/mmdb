import "dotenv/config";
import { db } from "@/utils/server/db";
import { normalizeForSearch } from "@/utils/normalizeForSearch";

export const CORE_CATEGORIES: ReadonlyArray<{ name: string; rank: number }> = [
  { name: "Adagio", rank: 1 },
  { name: "Andante", rank: 2 },
  { name: "Allegretto", rank: 3 },
  { name: "Allegro", rank: 4 },
  { name: "Presto", rank: 5 },
  { name: "Minuet / Menuetto", rank: 6 },
  { name: "Waltz", rank: 7 },
];

/**
 * Core category terms + A_Core_Links directly related terms.
 * Note: "Assai vivace", "Molto vivace", and "Più vivace" appear under both
 * Allegro and Presto in A_Core_Links. Since only one primary link per
 * TempoIndication is created initially, they are linked to Allegro (consistent
 * with Vivace, Un poco più vivace, and Molto vivace e giocoso).
 */
export const CORE_LINKS: ReadonlyArray<{ term: string; category: string }> = [
  // Adagio
  { term: "Adagio", category: "Adagio" },
  { term: "Grave", category: "Adagio" },
  { term: "Largo", category: "Adagio" },
  { term: "Larghetto", category: "Adagio" },
  { term: "Lento", category: "Adagio" },
  { term: "Langsam", category: "Adagio" },
  { term: "Ziemlich langsam", category: "Adagio" },

  // Andante
  { term: "Andante", category: "Andante" },
  { term: "Andantino", category: "Andante" },
  { term: "In gehender Bewegung", category: "Andante" },
  { term: "Moderato quasi Adagio", category: "Andante" },

  // Allegretto
  { term: "Allegretto", category: "Allegretto" },
  { term: "Moderato", category: "Allegretto" },
  { term: "Moderato assai", category: "Allegretto" },
  { term: "Moderato con anima", category: "Allegretto" },
  { term: "Moderato mosso", category: "Allegretto" },
  { term: "Tempo moderato", category: "Allegretto" },
  { term: "Mäßig bewegt", category: "Allegretto" },

  // Allegro
  { term: "Allegro", category: "Allegro" },
  { term: "Vivace", category: "Allegro" },
  { term: "Assai vivace", category: "Allegro" },
  { term: "Molto vivace", category: "Allegro" },
  { term: "Più vivace", category: "Allegro" },

  // Presto
  { term: "Presto", category: "Presto" },
  { term: "Prestissimo", category: "Presto" },
  { term: "Velocissimo", category: "Presto" },

  // Minuet / Menuetto
  { term: "Menuetto", category: "Minuet / Menuetto" },
  { term: "Minuetto", category: "Minuet / Menuetto" },
  { term: "Minuet", category: "Minuet / Menuetto" },
  { term: "Menuet", category: "Minuet / Menuetto" },
  { term: "Tempo di Menuetto", category: "Minuet / Menuetto" },
  { term: "Tempo di Minuetto", category: "Minuet / Menuetto" },

  // Waltz
  { term: "Waltz", category: "Waltz" },
  { term: "Walzer", category: "Waltz" },
  { term: "Valse", category: "Waltz" },
  { term: "Wals", category: "Waltz" },
  { term: "Valzer", category: "Waltz" },
];

/**
 * B_Additional_Links (Tempo term -> Linked to).
 */
export const ADDITIONAL_LINKS: ReadonlyArray<{ term: string; category: string }> = [
  { term: "Allegrissimo", category: "Allegro" },
  { term: "Feierlich", category: "Allegro" },
  { term: "Langsam, marschmäßig", category: "Adagio" },
  { term: "Leggiero e vivace", category: "Allegro" },
  { term: "Maestoso", category: "Andante" },
  { term: "Molto agitato", category: "Allegro" },
  { term: "Molto vivace e giocoso", category: "Allegro" },
  { term: "Molto vivo e velocissimo", category: "Presto" },
  { term: "Risoluto e Agitato", category: "Allegro" },
  { term: "Tempestuoso", category: "Allegro" },
  { term: "Un poco più vivace", category: "Allegro" },
  { term: "Vivo e agitato", category: "Allegro" },
  { term: "Vivo e brillante", category: "Allegro" },
  { term: "Ziemlich anhaltend", category: "Adagio" },
  { term: "Ziemlich langsam und mit Ausdruck", category: "Adagio" },
  { term: "Ziemlich lebhaft und entschlossen", category: "Allegro" },
];

/**
 * Terms from C_Needs_Context, D_Separate_or_Review, and none placeholders
 * that must remain uncategorized.
 */
const EXCLUDED_TERMS: ReadonlyArray<string> = [
  "-- None --",
  "none",
  // C_Needs_Context
  "Con moto",
  "Etwas bewegter",
  "L'istesso tempo",
  "Meno",
  "Molto meno mosso",
  "Molto più tranquillo",
  "No che prima",
  "Più animato",
  "Più lento",
  "Più mosso",
  "Più mosso, ma maestoso",
  "Più moto",
  "Più sostenuto",
  "Poco meno",
  "Poco sostenuto",
  "Sostenuto",
  "Tempo I",
  "Tempo I.",
  "Un poco con moto",
  "Un poco più animato",
  "Un poco sostenuto",
  // D_Separate_or_Review
  "Alla breve",
];

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findVariantCategory(normalizedText: string): string | null {
  // Find the earliest whole-word match among CORE_LINKS; break ties by longest term.
  let bestMatch: { index: number; length: number; category: string } | null = null;

  for (const { term, category } of CORE_LINKS) {
    const normalizedTerm = normalizeForSearch(term);
    if (!normalizedTerm) continue;

    const regex = new RegExp(`(?:^|\\b)${escapeRegExp(normalizedTerm)}(?:\\b|$)`);
    const match = regex.exec(normalizedText);
    if (!match) continue;

    if (
      !bestMatch ||
      match.index < bestMatch.index ||
      (match.index === bestMatch.index && normalizedTerm.length > bestMatch.length)
    ) {
      bestMatch = {
        index: match.index,
        length: normalizedTerm.length,
        category,
      };
    }
  }

  return bestMatch ? bestMatch.category : null;
}

export async function seedTempoCategories() {
  console.log("[seedTempoCategories] Upserting core tempo categories...");

  const categoryIdByName = new Map<string, string>();
  for (const { name, rank } of CORE_CATEGORIES) {
    const cat = await db.tempoCategory.upsert({
      where: { name },
      update: { rank },
      create: { name, rank },
      select: { id: true, name: true },
    });
    categoryIdByName.set(cat.name, cat.id);
  }

  const allTempoIndications = await db.tempoIndication.findMany({
    select: {
      id: true,
      text: true,
      tempoCategories: {
        select: { id: true, tempoCategoryId: true },
      },
    },
    orderBy: { text: "asc" },
  });

  const dbByNormalizedText = new Map<
    string,
    Array<{ id: string; text: string; hasCategory: boolean }>
  >();
  for (const ti of allTempoIndications) {
    const norm = normalizeForSearch(ti.text);
    const list = dbByNormalizedText.get(norm) ?? [];
    list.push({
      id: ti.id,
      text: ti.text,
      hasCategory: ti.tempoCategories.length > 0,
    });
    dbByNormalizedText.set(norm, list);
  }

  const excludedNormalized = new Set(
    EXCLUDED_TERMS.map((t) => normalizeForSearch(t)),
  );

  const createdInDb: Array<{ term: string; category: string; source: string }> = [];
  const plannedLinks = new Map<string, { tempoIndicationId: string; text: string; category: string; matchType: "exact" | "variant" }>();

  // Pass 1: exact normalized matches from A_Core_Links and B_Additional_Links
  // If a term is absent from the DB, create the TempoIndication first.
  const allExcelEntries = [
    ...CORE_LINKS.map((e) => ({ ...e, source: "A_Core_Links" })),
    ...ADDITIONAL_LINKS.map((e) => ({ ...e, source: "B_Additional_Links" })),
  ];

  for (const entry of allExcelEntries) {
    const norm = normalizeForSearch(entry.term);
    let matches = dbByNormalizedText.get(norm);
    if (!matches || matches.length === 0) {
      const created = await db.tempoIndication.upsert({
        where: { text: entry.term },
        update: {},
        create: { text: entry.term },
        select: { id: true, text: true },
      });
      const createdEntry = {
        id: created.id,
        text: created.text,
        hasCategory: false,
      };
      matches = [createdEntry];
      dbByNormalizedText.set(norm, matches);
      createdInDb.push(entry);
    }

    for (const ti of matches) {
      if (!ti.hasCategory && !plannedLinks.has(ti.id)) {
        plannedLinks.set(ti.id, {
          tempoIndicationId: ti.id,
          text: ti.text,
          category: entry.category,
          matchType: "exact",
        });
      }
    }
  }

  // Pass 2: Practical rule - literal/composed variants of CORE_LINKS in DB
  for (const ti of allTempoIndications) {
    if (ti.tempoCategories.length > 0 || plannedLinks.has(ti.id)) continue;

    const norm = normalizeForSearch(ti.text);
    if (excludedNormalized.has(norm)) continue;

    const matchedCategory = findVariantCategory(norm);
    if (matchedCategory) {
      plannedLinks.set(ti.id, {
        tempoIndicationId: ti.id,
        text: ti.text,
        category: matchedCategory,
        matchType: "variant",
      });
    }
  }

  const linksToCreate = Array.from(plannedLinks.values()).map((link) => ({
    tempoIndicationId: link.tempoIndicationId,
    tempoCategoryId: categoryIdByName.get(link.category)!,
    isPrimary: true,
  }));

  if (linksToCreate.length > 0) {
    await db.tempoCategoriesOnTempoIndications.createMany({
      data: linksToCreate,
      skipDuplicates: true,
    });
  }

  const alreadyLinkedCount = allTempoIndications.filter(
    (ti) => ti.tempoCategories.length > 0,
  ).length;
  const exactCount = Array.from(plannedLinks.values()).filter(
    (l) => l.matchType === "exact",
  ).length;
  const variantCount = Array.from(plannedLinks.values()).filter(
    (l) => l.matchType === "variant",
  ).length;
  const totalTempoIndications = allTempoIndications.length + createdInDb.length;
  const totalLinked = alreadyLinkedCount + linksToCreate.length;
  const uncategorizedCount = totalTempoIndications - totalLinked;

  console.log(`[seedTempoCategories] Summary:`);
  console.log(`  - Categories upserted: ${CORE_CATEGORIES.length}`);
  console.log(`  - Total TempoIndications in DB (after seed): ${totalTempoIndications}`);
  console.log(`  - TempoIndications created from Excel: ${createdInDb.length}`);
  for (const item of createdInDb) {
    console.log(`      * [${item.source}] "${item.term}" -> ${item.category}`);
  }
  console.log(`  - Already linked before run: ${alreadyLinkedCount}`);
  console.log(`  - Newly linked (exact): ${exactCount}`);
  console.log(`  - Newly linked (variant): ${variantCount}`);
  console.log(`  - Remaining uncategorized: ${uncategorizedCount}`);
}

seedTempoCategories()
  .catch((err) => {
    console.error("[seedTempoCategories] Error:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
