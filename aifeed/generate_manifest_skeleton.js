#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const DEFAULT_ROOT = "/home/julien/Documents/MMDB/sources";
const DEFAULT_OUT = path.join("aifeed", "manifest", "mm_sources_manifest.json");

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

function parseArgs(argv) {
  const args = {
    root: DEFAULT_ROOT,
    out: DEFAULT_OUT,
    force: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--root") {
      args.root = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--out") {
      args.out = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--force") {
      args.force = true;
      continue;
    }
  }

  return args;
}

function listDirectories(rootDir) {
  return fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const rootDir = path.resolve(expandTilde(args.root));
  const outPath = path.resolve(expandTilde(args.out));

  if (!fs.existsSync(rootDir)) {
    console.error(`Root folder not found: ${rootDir}`);
    process.exit(1);
  }

  if (fs.existsSync(outPath) && !args.force) {
    console.error(
      `Manifest already exists: ${outPath} (use --force to overwrite)`,
    );
    process.exit(1);
  }

  const entries = listDirectories(rootDir).map((dirName) => {
    const sourceDir = path.join(rootDir, dirName);
    const pagesDir = path.join(sourceDir, "pages");
    const imslpTxtPath = path.join(sourceDir, "imslp.txt");

    const entry = {
      batchId: dirName,
      composer: "",
      workTitle: "",
      imslpLink: "",
      imslpTxtPath: "",
      pdfLink: "",
      pagesDir,
      status: "draft",
      notes: "",
    };

    if (fs.existsSync(imslpTxtPath)) {
      entry.imslpTxtPath = imslpTxtPath;
    }

    return entry;
  });

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");

  console.log(`Manifest written: ${outPath}`);
  console.log(`Entries: ${entries.length}`);
}

main();
