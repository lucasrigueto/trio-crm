import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const roots = ["src/app", "src/components"];
const ignoredFragments = [
  "WhatsApp",
  "API",
  "URL",
  "Meta",
  "Supabase",
  "OpenAI",
  "Next.js",
];

const jsxTextPattern = />\s*([^<>{}\n]*[A-Za-z][^<>{}\n]*)\s*</g;
const attrPattern =
  /\b(?:aria-label|alt|title|placeholder)\s*=\s*["']([^"']*[A-Za-z][^"']*)["']/g;

function isIgnored(text) {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (/^[A-Z0-9_\-/.: ]+$/.test(trimmed)) return true;
  if (ignoredFragments.includes(trimmed)) return true;
  if (/^(GET|POST|PUT|PATCH|DELETE)\s+\//.test(trimmed)) return true;
  return false;
}

const findings = [];

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) return walk(path);
    return path.endsWith(".tsx") ? [path] : [];
  });
}

for (const file of roots.flatMap(walk)) {
  const source = readFileSync(file, "utf8");
  for (const pattern of [jsxTextPattern, attrPattern]) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(source))) {
      const text = match[1].replace(/\s+/g, " ").trim();
      if (isIgnored(text)) continue;
      const line = source.slice(0, match.index).split(/\r?\n/).length;
      findings.push({
        file: relative(process.cwd(), file),
        line,
        text,
      });
    }
  }
}

if (findings.length > 0) {
  console.log(`Potential hardcoded UI strings: ${findings.length}`);
  for (const finding of findings) {
    console.log(`${finding.file}:${finding.line}: ${finding.text}`);
  }
} else {
  console.log("No obvious hardcoded JSX UI strings found.");
}
