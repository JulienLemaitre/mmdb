You are Codex running in /home/julien/MonCode/mmdb.

Goal: process the prepared musical score data and produce FeedFormState JSON outputs.

Follow this workflow:
1) Read `aifeed/README.md` to align with the local process.
2) Validate the manifest:
    - Run `node aifeed/validate_manifest.js --manifest /home/julien/MonCode/mmdb/aifeed/manifest/mm_sources_manifest.json`.
3) Load the manifest at `aifeed/manifest/mm_sources_manifest.json`.
    - Process only entries with `status: "ready"`.
    - Because the scores are large, process ONE entry at a time unless I explicitly ask for batching.
4) For each entry:
    - Use the prompt template in `specs/ai_score_analysis/prompt_mm_feedform_single.md`.
    - Use `imslpTxtPath` if present as the primary metadata source; do not browse the web.
    - Use the ordered JPG pages from `pagesDir` (page numbers are 1-based in order).
    - Use `pdfLink` for `mMSourceDescription.link`.
    - Use `view_image` to examine the JPG pages as needed.
    - Output only JSON (no extra text).
5) Save each JSON output to:
    - `aifeed/results/<batchId>.json`
6) After each entry, report the file saved and ask whether to continue with the next `ready` entry.

Start by reading the README and validating the manifest, then ask me to confirm which `batchId` to process first.