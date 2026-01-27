#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const DEFAULT_MANIFEST = path.join(
  "aifeed",
  "manifest",
  "mm_sources_manifest.json",
);

function expandTilde(value) {
  if (!value || typeof value !== "string") {
    return value;
  }
  if (value.startsWith("~")) {
    const home = process.env.HOME || "";
    return path.join(home, value.slice(1));
  }
  return value;
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function isJpg(name) {
  return /\.jpe?g$/i.test(name);
}

function listJpgFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && isJpg(entry.name))
    .map((entry) => entry.name)
    .sort();
}

function parseArgs(argv) {
  const args = {
    manifestPath: DEFAULT_MANIFEST,
    list: false,
    json: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--manifest" || arg === "-m") {
      args.manifestPath = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--list") {
      args.list = true;
      continue;
    }
    if (arg === "--json") {
      args.json = true;
      continue;
    }
  }

  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifestPath = path.resolve(expandTilde(args.manifestPath));

  if (!fs.existsSync(manifestPath)) {
    console.error(`Manifest not found: ${manifestPath}`);
    process.exit(1);
  }

  const manifest = readJson(manifestPath);
  if (!Array.isArray(manifest)) {
    console.error(`Manifest must be a JSON array: ${manifestPath}`);
    process.exit(1);
  }

  const requiredFields = [
    "batchId",
    "pdfLink",
    "imslpLink",
    "pagesDir",
    "imslpTxtPath",
  ];
  const seenBatchIds = new Set();
  const errors = [];
  const entriesSummary = [];

  manifest.forEach((entry, index) => {
    const entryErrors = [];
    const entryId = entry?.batchId || `index-${index}`;

    requiredFields.forEach((field) => {
      if (!entry || typeof entry[field] !== "string" || !entry[field].trim()) {
        entryErrors.push(`missing ${field}`);
      }
    });

    if (entry?.batchId) {
      if (seenBatchIds.has(entry.batchId)) {
        entryErrors.push("duplicate batchId");
      } else {
        seenBatchIds.add(entry.batchId);
      }
    }

    const pagesDir = entry?.pagesDir ? expandTilde(entry.pagesDir) : null;
    let jpgFiles = [];
    let pagesDirExists = false;
    if (pagesDir && fs.existsSync(pagesDir)) {
      pagesDirExists = true;
      try {
        jpgFiles = listJpgFiles(pagesDir);
        if (jpgFiles.length === 0) {
          entryErrors.push("pagesDir has no JPG files");
        }
      } catch (err) {
        entryErrors.push(`pagesDir read error: ${err.message}`);
      }
    } else if (pagesDir) {
      entryErrors.push("pagesDir not found");
    }

    const imslpTxtPath = entry?.imslpTxtPath
      ? expandTilde(entry.imslpTxtPath)
      : null;
    let imslpTxtExists = false;
    if (imslpTxtPath) {
      imslpTxtExists = fs.existsSync(imslpTxtPath);
      if (!imslpTxtExists) {
        entryErrors.push("imslpTxtPath not found");
      }
    }

    if (entryErrors.length > 0) {
      errors.push({ batchId: entryId, errors: entryErrors });
    }

    entriesSummary.push({
      batchId: entryId,
      pagesDir: pagesDir || null,
      pagesDirExists,
      jpgCount: jpgFiles.length,
      jpgFiles,
      imslpTxtPath: imslpTxtPath || null,
      imslpTxtExists,
    });
  });

  if (args.json) {
    const output = {
      entries: entriesSummary,
      errors,
      manifestPath,
      ok: errors.length === 0,
    };
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  } else {
    entriesSummary.forEach((entry) => {
      console.log(`batchId: ${entry.batchId}`);
      console.log(`pagesDir: ${entry.pagesDir || "n/a"}`);
      console.log(`pagesDirExists: ${entry.pagesDirExists}`);
      console.log(`jpgCount: ${entry.jpgCount}`);
      if (args.list) {
        entry.jpgFiles.forEach((name) => console.log(`- ${name}`));
      } else if (entry.jpgCount > 0) {
        console.log(`jpgFirst: ${entry.jpgFiles[0]}`);
        console.log(`jpgLast: ${entry.jpgFiles[entry.jpgFiles.length - 1]}`);
      }
      if (entry.imslpTxtPath) {
        console.log(`imslpTxtPath: ${entry.imslpTxtPath}`);
        console.log(`imslpTxtExists: ${entry.imslpTxtExists}`);
      }
      console.log("---");
    });

    if (errors.length > 0) {
      console.log("Errors:");
      errors.forEach((err) => {
        console.log(`${err.batchId}: ${err.errors.join(", ")}`);
      });
    }
  }

  if (errors.length > 0) {
    process.exit(1);
  }
}

main();
