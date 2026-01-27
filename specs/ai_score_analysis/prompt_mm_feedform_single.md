You receive:
- An ordered list of JPG files representing the score pages, numbered in order (e.g., 001.jpg, 002.jpg, ...).
- pdfLink: the direct online PDF link for this score (use it for mMSourceDescription.link).
- imslpLink: the IMSLP descriptive page for the edition (use it for metadata).
- imslpTxtPath (optional): local text extract of the IMSLP descriptive page (analysis only, do not store in output).
- (Optional) additional user context.

Main goals:
1) Describe the source (MM Source) and its contributions.
2) Segment the score into sections.
3) For each section, capture metronome marks (or absence) and compute the fastest note values.
4) Output all data as a JSON object matching FeedFormState.

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

OUTPUT: a strict JSON object matching FeedFormState

General rules:
- IDs: generate unique UUID v4 values (format XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX).
- All references between objects must use those IDs.
- If data is missing, do not invent it; note the gap in commentForReview (section) or mMSourceDescription.comment (global).
- Never include imslpTxtPath in the output.
- Do not include any text outside the JSON.

Expected schema (all keys must exist):

{
  "formInfo": {},

  "mMSourceDescription": {
    "id": "uuid",
    "title": "Edition title (if printed)",
    "type": "SOURCE_TYPE",
    "link": "Direct PDF link",
    "year": 1840,
    "isYearEstimated": false,
    "comment": "General comment + IMSLP link if useful",
    "references": [
      { "id": "uuid", "type": "REFERENCE_TYPE", "reference": "..." }
    ],
    "isNew": true
  },

  "mMSourceContributions": [
    { "id": "uuid", "role": "CONTRIBUTION_ROLE", "person": { ... } },
    { "id": "uuid", "role": "CONTRIBUTION_ROLE", "organization": { ... } }
  ],

  "mMSourceOnPieceVersions": [
    { "rank": 1, "pieceVersionId": "uuid", "isNew": true }
  ],

  "organizations": [
    { "id": "uuid", "name": "Name", "isNew": true }
  ],

  "collections": [
    { "id": "uuid", "composerId": "uuid", "title": "Op. 15", "pieceCount": 13, "isNew": true }
  ],

  "persons": [
    { "id": "uuid", "firstName": "Robert", "lastName": "Schumann", "birthYear": 1810, "deathYear": 1856, "isNew": true }
  ],

  "pieces": [
    {
      "id": "uuid",
      "title": "Piece title",
      "nickname": "Nickname if present",
      "yearOfComposition": 1838,
      "composerId": "uuid",
      "collectionId": "uuid (if applicable)",
      "collectionRank": 4,
      "isNew": true
    }
  ],

  "pieceVersions": [
    {
      "id": "uuid",
      "category": "PIECE_CATEGORY",
      "pieceId": "uuid",
      "movements": [
        {
          "id": "uuid",
          "rank": 1,
          "key": "KEY",
          "sections": [
            {
              "id": "uuid",
              "rank": 1,
              "metreNumerator": 4,
              "metreDenominator": 4,
              "isCommonTime": true,
              "isCutTime": false,
              "tempoIndication": { "id": "uuid", "text": "Andante cantabile" },
              "fastestStructuralNotesPerBar": 8,
              "fastestStaccatoNotesPerBar": 8,
              "fastestRepeatedNotesPerBar": null,
              "fastestOrnamentalNotesPerBar": 16,
              "isFastestStructuralNoteBelCanto": false,
              "comment": "Notes if needed",
              "commentForReview": "p.2 m.12 structural; p.2 m.14 staccato; p.3 m.20 ornamental; MM p.1 m.1"
            }
          ]
        }
      ],
      "isNew": true
    }
  ],

  "tempoIndications": [
    { "id": "uuid", "text": "Andante cantabile", "isNew": true }
  ],

  "metronomeMarks": [
    {
      "id": "uuid",
      "sectionId": "uuid",
      "pieceVersionId": "uuid",
      "noMM": false,
      "beatUnit": "NOTE_VALUE",
      "bpm": 80,
      "comment": "MM seen p.1 m.1"
    },
    {
      "id": "uuid",
      "sectionId": "uuid",
      "pieceVersionId": "uuid",
      "noMM": true
    }
  ]
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
