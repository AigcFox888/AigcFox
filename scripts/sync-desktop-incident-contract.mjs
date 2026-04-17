import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const sourcePath = path.join(rootDir, "packages", "contracts", "src", "desktop-incident.ts");
const targetPath = path.join(rootDir, "apps", "desktop", "src", "shared", "desktop-incident.ts");

async function main() {
  const source = await fs.readFile(sourcePath, "utf8");
  let currentTarget = "";

  try {
    currentTarget = await fs.readFile(targetPath, "utf8");
  } catch {
    currentTarget = "";
  }

  if (currentTarget === source) {
    console.log("Desktop incident contract is already synchronized.");
    return;
  }

  await fs.writeFile(targetPath, source, "utf8");
  console.log(`Synchronized desktop incident contract to ${targetPath}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
