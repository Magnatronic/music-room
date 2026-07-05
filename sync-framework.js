#!/usr/bin/env node
/*
 * sync-framework.js — propagate the shared framework into every animation file.
 *
 * Each standalone animation duplicates the framework (settings, audio, input,
 * UI, lifecycle). To avoid hand-editing 11 copies, edit it once in template.html
 * and run:  node sync-framework.js
 *
 * It copies each region marked  FRAMEWORK-<NAME> START ... FRAMEWORK-<NAME> END
 * from template.html into the matching region of every other .html file.
 * The per-animation ANIMATION block is never touched.
 */
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const SRC = 'template.html';
const REGIONS = ['CSS', 'HTML', 'JS'];
const EXCLUDE = new Set(['index.html', 'template.html']);

function regionRe(name){ return new RegExp('FRAMEWORK-' + name + ' START[\\s\\S]*?FRAMEWORK-' + name + ' END'); }

const src = fs.readFileSync(path.join(dir, SRC), 'utf8');
const blocks = {};
for (const name of REGIONS) {
  const m = src.match(regionRe(name));
  if (!m) { console.error(`✗ ${SRC} is missing the FRAMEWORK-${name} region.`); process.exit(1); }
  blocks[name] = m[0];
}

const targets = fs.readdirSync(dir).filter(f => f.endsWith('.html') && !EXCLUDE.has(f));
if (!targets.length) { console.log('No animation files found to sync.'); process.exit(0); }

let changed = 0;
for (const f of targets) {
  const p = path.join(dir, f);
  let txt = fs.readFileSync(p, 'utf8');
  const before = txt;
  const applied = [];
  for (const name of REGIONS) {
    const re = regionRe(name);
    if (re.test(txt)) { txt = txt.replace(re, () => blocks[name]); applied.push(name); }
  }
  if (txt !== before) { fs.writeFileSync(p, txt); changed++; console.log(`✓ ${f}  [${applied.join(', ')}]`); }
  else console.log(`· ${f}  (no change)`);
}
console.log(`\nDone — ${changed} file(s) updated from ${SRC}.`);
