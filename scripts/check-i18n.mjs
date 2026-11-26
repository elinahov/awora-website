// Lists UI keys that exist in one language file but not the other, plus keys used in code
// (t('…')) that neither file has. Exits with 1 when anything is missing.
// Run: npm run i18n:check
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import en from '../src/locales/en.js';
import hy from '../src/locales/hy.js';

const langs = { en, hy };
let problems = 0;
const report = (title, keys) => {
  if (!keys.length) return;
  problems += keys.length;
  console.log(`\n${title} (${keys.length}):`);
  keys.forEach(k => console.log('  ' + k));
};

for (const [a, A] of Object.entries(langs))
  for (const [b, B] of Object.entries(langs))
    if (a !== b) report(`In ${a}.js but missing from ${b}.js`, Object.keys(A).filter(k => !(k in B)));

// Keys written literally in the source: t('key') / t("key"). Template keys like t(`p.accent.${kind}`) are skipped.
const files = [];
const walk = d => readdirSync(d).forEach(f => { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : /\.(jsx?|mjs)$/.test(f) && files.push(p); });
walk('src');
const used = new Set();
for (const f of files) for (const m of readFileSync(f, 'utf8').matchAll(/\bt\(\s*['"]([\w.-]+)['"]/g)) used.add(m[1]);
report('Used in code but missing from both files', [...used].filter(k => !(k in en) && !(k in hy)).sort());

console.log(problems ? `\n${problems} problem(s).` : `All ${Object.keys(en).length} keys present in en and hy.`);
process.exit(problems ? 1 : 0);
