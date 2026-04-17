import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";

export async function calculateSha256(targetPath) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(targetPath);

    stream.on("error", reject);
    stream.on("data", (chunk) => {
      hash.update(chunk);
    });
    stream.on("end", () => {
      resolve(hash.digest("hex"));
    });
  });
}

export async function writeSha256ChecksumsFile(targetPath, entries) {
  const lines = entries.map((entry) => `${entry.sha256}  ${entry.path}`);
  await fs.writeFile(targetPath, `${lines.join("\n")}\n`, "utf8");
}

export async function readSha256ChecksumsFile(targetPath, options = {}) {
  const {
    allowMissing = false,
    sortEntries = false
  } = options;

  let contents;

  try {
    contents = await fs.readFile(targetPath, "utf8");
  } catch (error) {
    if (allowMissing && error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }

  const entries = contents
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const parts = line.split(/\s{2,}/u);
      return {
        sha256: parts[0] ?? "",
        path: parts.slice(1).join("  ")
      };
    })
    .filter((entry) => entry.sha256.length > 0 && entry.path.length > 0);

  return sortEntries
    ? entries.sort((left, right) => left.path.localeCompare(right.path))
    : entries;
}
