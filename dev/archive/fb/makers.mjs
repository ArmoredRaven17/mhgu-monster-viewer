// makers.mjs: for every unstarted record (drawtable.json, not found by nodesweep), the shell modes naming it and whether any action /
// per-frame row in SHELL_DATA names that shell + mode (spawns[].shell / mode / modes)
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const rows = JSON.parse(readFileSync('drawtable.json', 'utf8')), NS = JSON.parse(readFileSync('nodesweep.json', 'utf8')), efmap = JSON.parse(readFileSync('efmap.json', 'utf8'));
const src = readFileSync('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js', 'utf8');
const out = {};
for (const r of rows){
  if (/^draws|^CONTACT|^NO DRAW/.test(r[5])) continue;
  const pk = r[1] + ':' + r[2]; if (NS[r[0]] && NS[r[0]][pk]) continue;
  const D = S.SHELL_DATA[r[0]]; const slots = (efmap[r[0]] || {})[pk] || [];
  const info = slots.map(([n, b, m, sl]) => {
    let named = false;
    const scan = x => { const s = JSON.stringify(x); return s.includes('"shell":"' + n + '"') && (new RegExp('"modes?":\[?[^\]]*\b' + m + '\b')).test(s); };
    for (const a of D.actions || []) if (scan(a)) named = true;
    for (const k of Object.keys(D)) if (/perFrame|rows|cannon|arm/i.test(k) && Array.isArray(D[k]) && D[k].some(scan)) named = true;
    return n + ' ' + b + ' m' + m + ' ef' + sl + (named ? ' [a row makes it]' : '');
  });
  out[r[0] + ':' + pk] = { status: r[5].slice(0, 60), slots: info };
}
writeFileSync('makers.json', JSON.stringify(out, null, 1));
const c = {}; for (const v of Object.values(out)){ const k = v.slots.length === 0 ? 'no mode' : v.slots.some(s => s.includes('[a row')) ? 'a row makes it' : 'no row names the mode'; c[k] = (c[k] || 0) + 1; }
console.log(Object.keys(out).length, c);
