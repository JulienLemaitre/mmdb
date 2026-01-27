# AI Feed: Musical Score Analysis Workflow

This folder contains scripts and conventions to prepare musical scores, run AI analysis, and store results in a consistent way.

All source files (PDFs, JPG pages, IMSLP extracts) live outside the project in:

```
/home/julien/Documents/MMDB/
```

All manifests, scripts, and AI results live inside this project in:

```
/home/julien/MonCode/mmdb/aifeed/
```

## Folder Structure

Recommended layout:

```
/home/julien/MonCode/mmdb/aifeed/
  README.md
  validate_manifest.js
  generate_pages_from_pdfs.js
  generate_manifest_skeleton.js
  manifest/
    mm_sources_manifest.json
  results/
    <batchId>.json
  logs/

/home/julien/Documents/MMDB/
  sources/
    <batchId>/
      pages/
        001.jpg
        002.jpg
        003.jpg
      imslp.txt
      score.pdf
```

Notes:
- `batchId` should be human-readable and stable (not a UUID).
- JPG pages must be ordered and numbered in reading order.
- `imslp.txt` is an optional local extract of the IMSLP descriptive page.
- `score.pdf` is optional for archive only; AI analysis uses JPG pages.

## What You Must Prepare

For each musical source (one edition):
1) A folder named with a human `batchId`.
2) A `pages/` folder with JPG pages named `001.jpg`, `002.jpg`, etc.
3) An IMSLP descriptive page link (`imslpLink`).
4) A direct online PDF link for the score (`pdfLink`).

Optional:
- `imslp.txt`: local text extract of the IMSLP descriptive page.
- `score.pdf`: local PDF stored for your archive.

## Manifest

The manifest is a JSON array, one entry per score. It is the single source of truth for automation and batching.

Location:
```
/home/julien/MonCode/mmdb/aifeed/manifest/mm_sources_manifest.json
```

Example entry:

```json
{
  "batchId": "schumann-kinderszenen-op15-no4-001",
  "composer": "Schumann, Robert",
  "workTitle": "Kinderszenen, Op. 15 No. 4",
  "imslpLink": "https://imslp.org/wiki/Kinderszenen,_Op.15_(Schumann,_Robert)",
  "imslpTxtPath": "/home/julien/Documents/MMDB/sources/schumann-kinderszenen-op15-no4-001/imslp.txt",
  "pdfLink": "https://imslp.org/xyz/score.pdf",
  "pagesDir": "/home/julien/Documents/MMDB/sources/schumann-kinderszenen-op15-no4-001/pages",
  "status": "ready",
  "notes": ""
}
```

## Scripts

### 1) Validate manifest and source data

Purpose:
- Check required fields.
- Verify `pagesDir` exists and has JPGs.
- Verify `imslpTxtPath` if provided.

Usage:
```
node aifeed/validate_manifest.js --manifest /home/julien/MonCode/mmdb/aifeed/manifest/mm_sources_manifest.json --list
```

### 2) Generate JPG pages from local PDFs

Purpose:
- For each folder in `/home/julien/Documents/MMDB/sources`,
  if a PDF exists but `pages/` does not, create `pages/`
  and generate JPG pages with `pdftoppm`.

Requires:
- `pdftoppm` from `poppler-utils` installed.

Usage:
```
node aifeed/generate_pages_from_pdfs.js
```

Options:
```
node aifeed/generate_pages_from_pdfs.js --root /home/julien/Documents/MMDB/sources --dpi 400
```

Output:
- `pages/001.jpg`, `pages/002.jpg`, ...

### 3) Generate a manifest skeleton

Purpose:
- Build a draft manifest from the folder tree.
- Fill `batchId`, `pagesDir`, and `imslpTxtPath` if present.

Usage:
```
node aifeed/generate_manifest_skeleton.js
```

Options:
```
node aifeed/generate_manifest_skeleton.js --root /home/julien/Documents/MMDB/sources --out /home/julien/MonCode/mmdb/aifeed/manifest/mm_sources_manifest.json --force
```

## Full Process: From Raw Sources to AI Output

### Step 1: Create source folders

For each score edition, create:
```
/home/julien/Documents/MMDB/sources/<batchId>/
```

Inside, add:
- `pages/001.jpg`, `002.jpg`, ...
- Optionally `imslp.txt`
- Optionally `score.pdf`

### Step 2: Create or update the manifest

Run the skeleton generator, then fill missing fields:
- `composer`
- `workTitle`
- `imslpLink`
- `pdfLink`
- `status`

### Step 3: Validate

Run:
```
node aifeed/validate_manifest.js --manifest /home/julien/MonCode/mmdb/aifeed/manifest/mm_sources_manifest.json
```

Fix any errors (missing pages, wrong paths, etc).

### Step 4: Prepare AI input

Use the prompt in:
```
specs/ai_score_analysis/prompt_mm_feedform_batch.md
```

Construct a batch input from the manifest. For each entry:
- `batchId`
- `pdfLink`
- `imslpLink`
- optional `imslpTxtPath`
- ordered list of JPG pages

Keep batch size small (1-3 pieces) to reduce confusion.

### Step 5: Ask the AI

Provide:
- The batch prompt.
- The ordered JPG pages for each entry.
- `imslp.txt` content if available.

Tell the AI:
- Use `imslp.txt` as the primary metadata source if provided.
- Always choose the first IMSLP edition.
- Output only the JSON batch array.

### Step 6: Save AI outputs

For each entry in the batch result:
- Save as `/home/julien/MonCode/mmdb/aifeed/results/<batchId>.json`
- Optionally update `status` in the manifest to `done`.

### Step 7: Prepare the next batch

1) Review `results/<batchId>.json` quickly for obvious errors.
2) If needed, log corrections for a human reviewer.
3) Update manifest `status` to `reviewed` or `needs_fix`.
4) Move on to the next `ready` entries.

## Tips

- Keep `batchId` consistent across folders, manifest, and results.
- Always number pages in reading order.
- If you have `imslp.txt`, do not rely on web access for metadata.
- If a score has multiple editions on IMSLP, always select the first listed edition.
