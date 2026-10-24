// pfcmp.mjs (2026-10-19): the per-frame census (pfgen.py -> pf_<mon>.txt) against the viewer's per-frame rows -- any SHELL_DATA[mon]
// array field whose entries carry `ids` + `frame` / `frames` + `mode` (dust, perFrame, perFrame0NN). A create no row names is printed:
// mot / frame / shell id / mode, with whether a clip of that motion id ships (docs/poses). Pulse rows (no frames) match any frame.
// Usage: node pfcmp.mjs [mon..]
import { readFileSync, existsSync, readdirSync } from 'fs';
const V = 'C:/MHGU-Extract/MHGU-Monster-Viewer/';
const D = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const S = await import('file:///' + V + 'docs/render/shells.js');
const only = process.argv.slice(2);
const files = readdirSync(D).filter(f => /^pf_em\d{3}_\d{2}\.txt$/.test(f)).map(f => f.slice(3, 11)).filter(m => !only.length || only.includes(m)).sort();
for (const mon of files){
  const L = readFileSync(D + 'pf_' + mon + '.txt', 'utf8').split(/\r?\n/);
  const pf = [];
  for (const l of L){
    const m = l.match(/^PF \+(0x[0-9a-f]+) (0x[0-9a-f]+) mot (0x[0-9a-f]+) (\{.*\})$/); if (!m) continue;
    for (const k of m[4].matchAll(/'(0x[0-9a-f]+) m(\d+) f([^ ]+) (0x[0-9a-f]+)'/g))
      if (!k[3].startsWith('ALL')) pf.push({ slot: m[1], fn: m[2], mot: parseInt(m[3], 16), id: parseInt(k[1], 16), mode: +k[2], frame: +k[3], site: k[4] });
  }
  if (!pf.length) continue;
  const Dm = S.SHELL_DATA[mon];
  const rows = [];
  if (Dm) for (const [key, val] of Object.entries(Dm)) if (Array.isArray(val)) for (const r of val)
    if (r && Array.isArray(r.ids) && r.mode != null) rows.push({ key, ids: r.ids, frames: r.frames || (r.frame != null ? [r.frame] : null), mode: r.mode });
  const hit = p => rows.some(r => r.ids.includes(p.mot) && r.mode === p.mode && (!r.frames || r.frames.some(F => Math.abs(F - p.frame) < 1e-3)));
  const miss = pf.filter(p => !hit(p));
  console.log('==', mon, 'per-frame creates', pf.length, '| rows', rows.length, rows.length ? '(' + [...new Set(rows.map(r => r.key))].join(',') + ')' : '', '| not in a row', miss.length, Dm ? '' : '| NO SHELL_DATA');
  for (const p of miss) console.log('   ', 'L' + (p.mot >> 8) + ' M' + (p.mot & 0xff), 'f' + p.frame, '0x' + p.id.toString(16), 'm' + p.mode, p.slot, p.fn, p.site);
}
