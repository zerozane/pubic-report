import fs from "node:fs";
import path from "node:path";

const [, , inputPath, outputPath] = process.argv;

if (!inputPath || !outputPath) {
  throw new Error("Usage: node scripts/repair-tiktok-review-encoding.mjs <input> <output>");
}

const cp1252Extended = new Map([
  ["€", 0x80], ["‚", 0x82], ["ƒ", 0x83], ["„", 0x84], ["…", 0x85],
  ["†", 0x86], ["‡", 0x87], ["ˆ", 0x88], ["‰", 0x89], ["Š", 0x8a],
  ["‹", 0x8b], ["Œ", 0x8c], ["Ž", 0x8e], ["‘", 0x91], ["’", 0x92],
  ["“", 0x93], ["”", 0x94], ["•", 0x95], ["–", 0x96], ["—", 0x97],
  ["˜", 0x98], ["™", 0x99], ["š", 0x9a], ["›", 0x9b], ["œ", 0x9c],
  ["ž", 0x9e], ["Ÿ", 0x9f],
]);

function toCp1252Bytes(value) {
  const bytes = [];

  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint <= 0xff) {
      bytes.push(codePoint);
      continue;
    }

    const mappedByte = cp1252Extended.get(character);
    if (mappedByte === undefined) return null;
    bytes.push(mappedByte);
  }

  return Buffer.from(bytes);
}

function mojibakeScore(value) {
  const matches = value.match(/(?:Ã|Â|à|â|ð|[-])/g);
  return matches ? matches.length : 0;
}

function repairString(value) {
  let current = value;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (mojibakeScore(current) === 0) break;

    const bytes = toCp1252Bytes(current);
    if (!bytes) break;

    const decoded = bytes.toString("utf8");
    if (decoded.includes("\uFFFD") || mojibakeScore(decoded) >= mojibakeScore(current)) break;
    current = decoded;
  }

  return current;
}

function repairValue(value) {
  if (typeof value === "string") return repairString(value);
  if (Array.isArray(value)) return value.map(repairValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, repairValue(entry)]));
  }
  return value;
}

const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const repaired = repairValue(input);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(repaired, null, 2)}\n`, "utf8");

console.log(`Wrote repaired JSON: ${outputPath}`);
