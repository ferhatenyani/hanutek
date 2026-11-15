import fs from "node:fs";
import path from "node:path";

const fr = JSON.parse(fs.readFileSync("messages/fr.json", "utf8"));
const ar = JSON.parse(fs.readFileSync("messages/ar.json", "utf8"));

const at = (tree, dotted) =>
  dotted.split(".").reduce((node, key) => (node == null ? undefined : node[key]), tree);

const files = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }
};
walk("components");
walk("app");
walk("lib");

const problems = [];

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");

  for (const match of text.matchAll(/useTranslations\("([a-z]+)"\)/g)) {
    const namespace = match[1];
    if (!(namespace in fr)) problems.push(`${file}: namespace "${namespace}" absent from fr.json`);
    if (!(namespace in ar)) problems.push(`${file}: namespace "${namespace}" absent from ar.json`);
  }

  const aliases = {};
  for (const match of text.matchAll(/const (\w+) = useTranslations\("([a-z]+)"\)/g)) {
    aliases[match[1]] = match[2];
  }

  for (const [alias, namespace] of Object.entries(aliases)) {
    for (const match of text.matchAll(new RegExp(`\\b${alias}\\(([\`"])([a-zA-Z0-9._$ {}]+)\\1`, "g"))) {
      const key = match[2];
      if (key.includes("${")) continue;
      for (const [lang, tree] of [["fr", fr], ["ar", ar]]) {
        if (at(tree[namespace] ?? {}, key) === undefined) {
          problems.push(`${file}: ${namespace}.${key} missing in ${lang}.json`);
        }
      }
    }
  }
}

const unique = [...new Set(problems)];
console.log(
  unique.length
    ? unique.join("\n")
    : "All statically analysable message keys resolve in both locales.",
);
