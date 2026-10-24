import { readFileSync, readdirSync } from 'node:fs';
const dir = 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/rom/effect/';
await import('file:///' + dir + 'proof.js'); await import('file:///' + dir + 'live.js').catch(() => {});
const { lifted } = await import('file:///' + dir + 'cpu.js');
const roots = process.argv.slice(2).map(x => parseInt(x, 16));
const src = readdirSync(dir).filter(f => f.startsWith('lifted-')).map(f => readFileSync(dir + f, 'utf8')).join('\n');
const seen = new Set(), missing = new Set(), q = [...roots];
while (q.length){
  const a = q.pop(); if (seen.has(a)) continue; seen.add(a);
  const i = src.indexOf('export function L_' + a.toString(16) + '(');
  if (i < 0){ if (!lifted(a)) missing.add(a); continue; }
  const j = src.indexOf('\n}\n', i), body = src.slice(i, j);
  for (const m of body.matchAll(/call\(m, c, (\d+)\)/g)){ const t = +m[1]; if (!lifted(t)) missing.add(t); else q.push(t); }
}
console.log('walked', seen.size, 'missing', [...missing].map(x => '0x' + x.toString(16)).join(' '));
