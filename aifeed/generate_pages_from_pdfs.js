#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const DEFAULT_ROOT = "/home/julien/Documents/MMDB/sources";
const DEFAULT_DPI = "400";

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
    dpi: DEFAULT_DPI,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--root") {
      args.root = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--dpi") {
      args.dpi = argv[i + 1];
      i += 1;
      continue;
    }
  }

  return args;
}

function listDirectories(rootDir) {
  return fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(rootDir, entry.name));
}

function listPdfFiles(dirPath) {
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.pdf$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

function renameGeneratedPages(pagesDir) {
  const entries = fs
    .readdirSync(pagesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^page-\d+\.jpe?g$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => {
      const aNum = Number(a.match(/\d+/)?.[0] || 0);
      const bNum = Number(b.match(/\d+/)?.[0] || 0);
      return aNum - bNum;
    });

  if (entries.length === 0) {
    return;
  }

  const maxNumber = entries.reduce((acc, name) => {
    const num = Number(name.match(/\d+/)?.[0] || 0);
    return Math.max(acc, num);
  }, 0);
  const padWidth = Math.max(3, String(maxNumber).length);

  entries.forEach((name) => {
    const num = Number(name.match(/\d+/)?.[0] || 0);
    const padded = String(num).padStart(padWidth, "0");
    const newName = `${padded}.jpg`;
    fs.renameSync(path.join(pagesDir, name), path.join(pagesDir, newName));
  });
}

function generatePagesForFolder(folderPath, dpi) {
  const pdfFiles = listPdfFiles(folderPath);
  if (pdfFiles.length === 0) {
    console.log(`[skip] no PDF in ${folderPath}`);
    return;
  }

  const pagesDir = path.join(folderPath, "pages");
  if (fs.existsSync(pagesDir)) {
    console.log(`[skip] pages already exist in ${folderPath}`);
    return;
  }

  const pdfFile = pdfFiles[0];
  if (pdfFiles.length > 1) {
    console.warn(
      `[warn] multiple PDFs in ${folderPath}, using ${pdfFile} (alphabetical order)`,
    );
  }

  fs.mkdirSync(pagesDir, { recursive: true });

  const pdfPath = path.join(folderPath, pdfFile);
  const result = spawnSync(
    "pdftoppm",
    ["-jpeg", "-r", dpi, pdfPath, "page"],
    {
      cwd: pagesDir,
      stdio: "inherit",
    },
  );

  if (result.error || result.status !== 0) {
    throw new Error(
      `pdftoppm failed for ${pdfPath}: ${result.error?.message || "exit " + result.status}`,
    );
  }

  renameGeneratedPages(pagesDir);
  console.log(`[done] generated pages for ${folderPath}`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const rootDir = path.resolve(expandTilde(args.root));

  if (!fs.existsSync(rootDir)) {
    console.error(`Root folder not found: ${rootDir}`);
    process.exit(1);
  }

  listDirectories(rootDir).forEach((folderPath) => {
    generatePagesForFolder(folderPath, args.dpi);
  });
}

main();
