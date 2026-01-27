You receive a batch of entries as an ordered list. Each entry contains:
- batchId: unique identifier for the work (provided by the user).
- pdfLink: direct online PDF link for the score (use for mMSourceDescription.link).
- imslpLink: IMSLP descriptive page for the edition.
- imslpTxtPath (optional): local text extract of the IMSLP descriptive page (analysis only, do not store in output).
- pages: ordered list of JPG files (e.g., 001.jpg, 002.jpg, ...).
- context: (optional) extra information.

Main goals (for each entry):
1) Describe the source (MM Source) and its contributions.
2) Segment the score into sections.
3) For each section, capture metronome marks (or absence) and compute the fastest note values.
4) Output all data as a JSON object matching FeedFormState.

Apply the definitions, rules, and schema from the SINGLE prompt below to every entry.

--- SINGLE PROMPT (apply per entry) ---

<definition>
A Section is defined by the following three characteristics:
- Time signature
- Tempo indication
- Metronome mark
If any of these change, a new section must be defined.
If the tempo indication changes within a movement but no new metronome mark is given, the section is defined without a metronome mark.
</definition>

<additional definitions>
- Movement: a part of the piece identified by a title, a roman numeral (I, II...), a clear double bar, or a clear change of character/main tempo. Assign rank (1, 2, 3...) in order.
- PieceVersion: the version of the piece as presented by this edition (may contain one or more movements).
- Piece: the work (composition title) associated with a composer.
- Collection: a set/opus/cycle of pieces (e.g., "Op. 15", "Kinderszenen").
- Tempo indication: the exact printed text (e.g., "Allegro moderato", "Andante cantabile"). If none, use "No indication".
- Fastest notes per bar: the count of notes needed to fill one full bar using the fastest note value observed (compute from the metre).
- Structural notes: ordinary notes (not grace, not ornamental, not staccato, not repeated via tremolo).
- Staccato notes: notes marked staccato (dot or staccato accent).
- Repeated notes: immediately repeated notes (same pitch or explicit repetition/tremolo figure).
- Ornamental notes: grace/ornament notes written in small size (grace notes, appoggiaturas, acciaccaturas, etc).
</additional definitions>

IMSLP selection rule:
- The IMSLP page may list multiple editions. Always choose the FIRST listed edition, even if a manuscript is available. Ignore later editions unless the first one is missing required data.

INSTRUCTIONS (musical analysis)
- Segment into sections according to the definition above.
- For each section, capture:
  - time signature (metreNumerator, metreDenominator) + isCommonTime/isCutTime
  - tempo indication (exact text)
  - metronome mark if present (note value + bpm); otherwise noMM = true
  - the fastest note value for each note type (structural, staccato, repeated, ornamental)
  - a verification anchor: page number and bar number for each fastest note value and for each metronome mark
- Put ALL verification anchors, uncertainties, or remarks in commentForReview on the section.
- Page numbers are based on the JPG order (1-based index).
- Express fastest notes as "notes per bar" (e.g., eighths in 4/4 => 8).
- For tuplets, use real duration (e.g., triplet eighths in 4/4 => 12).
- If a value is uncertain, still provide it and explain in commentForReview.
- If the key is ambiguous or atonal, choose the best estimate and explain in commentForReview.

INSTRUCTIONS (IMSLP metadata + source)
- From the IMSLP page and the score:
  - composer (first name, last name, dates)
  - exact piece title
  - collection/opus if applicable (collection title + piece rank within collection)
  - year of composition if available
  - source type (EDITION, MANUSCRIPT, BOOK, etc)
  - edition year (year) + isYearEstimated if approximate
  - references (ISBN, ISMN, PLATE_NUMBER) if available
  - contributors: editor, arranger, transcriber, translator, publisher, MM provider, etc.
- If imslpTxtPath is provided, use it as the primary metadata source and do not browse the web. If there is a conflict, follow imslpTxtPath and note it in mMSourceDescription.comment.
- mMSourceDescription.link must be the direct online PDF link (pdfLink input).
- If useful, mention the IMSLP descriptive page in mMSourceDescription.comment.
- Use mMSourceDescription.comment as a general comment to flag reviewer attention.

BATCH OUTPUT:
- Output a single JSON array of objects.
- Each object must include the input batchId and one feedFormState object.
- No text outside JSON.

Batch output format:
[
  { "batchId": "work-001", "feedFormState": { ... } },
  { "batchId": "work-002", "feedFormState": { ... } }
]

General rules:
- IDs: generate unique UUID v4 values per entry.
- All references between objects must use those IDs.
- If data is missing, do not invent it; note the gap in commentForReview (section) or mMSourceDescription.comment (global).
- Never include imslpTxtPath in the output.

FeedFormState schema (all keys must exist):

{
  "formInfo": {},
  "mMSourceDescription": { ... },
  "mMSourceContributions": [ ... ],
  "mMSourceOnPieceVersions": [ ... ],
  "organizations": [ ... ],
  "collections": [ ... ],
  "persons": [ ... ],
  "pieces": [ ... ],
  "pieceVersions": [ ... ],
  "tempoIndications": [ ... ],
  "metronomeMarks": [ ... ]
}

Enum values:

NOTE_VALUE:
WHOLE, HALF, DOTTED_HALF, QUARTER, DOTTED_QUARTER, EIGHTH, DOTTED_EIGHTH, SIXTEENTH, DOTTED_SIXTEENTH, THIRTYSECOND, DOTTED_THIRTYSECOND

KEY:
A_FLAT_MAJOR, A_FLAT_MINOR, A_MAJOR, A_MINOR, A_SHARP_MAJOR, A_SHARP_MINOR,
B_FLAT_MAJOR, B_FLAT_MINOR, B_MAJOR, B_MINOR,
C_FLAT_MAJOR, C_FLAT_MINOR, C_MAJOR, C_MINOR, C_SHARP_MAJOR, C_SHARP_MINOR,
D_FLAT_MAJOR, D_FLAT_MINOR, D_MAJOR, D_MINOR, D_SHARP_MAJOR, D_SHARP_MINOR,
E_FLAT_MAJOR, E_FLAT_MINOR, E_MAJOR, E_MINOR,
F_FLAT_MAJOR, F_FLAT_MINOR, F_MAJOR, F_MINOR, F_SHARP_MAJOR, F_SHARP_MINOR,
G_FLAT_MAJOR, G_FLAT_MINOR, G_MAJOR, G_MINOR, G_SHARP_MAJOR, G_SHARP_MINOR

PIECE_CATEGORY:
KEYBOARD, CHAMBER_INSTRUMENTAL, ORCHESTRAL, VOCAL, OTHER

SOURCE_TYPE:
ARTICLE, BOOK, DIARY, EDITION, LETTER, MANUSCRIPT, OTHER

REFERENCE_TYPE:
ISBN, ISMN, PLATE_NUMBER

CONTRIBUTION_ROLE:
ARRANGER, EDITOR, MM_PROVIDER, PUBLISHER, TRANSCRIBER, TRANSLATOR, OTHER

Reason silently. If something is missing or ambiguous, still output the final JSON and record issues in commentForReview or mMSourceDescription.comment.
