// recaudit.mjs: every SHELL_DATA shell mode's ef (list, key) against its monster's exported shell records (docs/effects/<mon>.json,
// entries with when 'shell'). A shell that starts a key with no record draws nothing, silently (schedule.js: "no such record exported").
import { readFileSync, existsSync } from 'fs';
const V = 'C:/MHGU-Extract/MHGU-Monster-Viewer/';
const S = await import('file:///' + V + 'docs/render/shells.js');
const out = [];
for (const [mon, D] of Object.entries(S.SHELL_DATA)){
  const p = V + 'docs/effects/' + mon + '.json';
  const J = existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
  const have = new Set();
  if (J) for (const e of J.effects || []) if (e.when === 'shell' && e.record) have.add(e.record.pel + ':' + e.record.key);
  for (const [nm, def] of Object.entries(D.shells || {})){
    for (const [m, mode] of Object.entries(def.modes || {})){
      (mode.ef || []).forEach(([lid, key], param) => {
        if (!(lid <= 7) || !(key >= 0)) return;
        const L = (def.lists || D.lists || {})[lid];
        const pel = L ? L.pel : null;
        const k = pel + ':' + key;
        if (!pel || !have.has(k)) out.push({ mon, json: !!J, shell: nm, base: def.base, mode: +m, param, pel, key });
      });
    }
  }
}
const by = {};
for (const r of out){ const k = r.mon + ' ' + r.pel + ':' + r.key; (by[k] = by[k] || []).push(r.shell + ' m' + r.mode + ' p' + r.param + (r.json ? '' : ' (NO JSON)')); }
for (const [k, v] of Object.entries(by)) console.log(k, '<-', v.slice(0, 6).join(', ') + (v.length > 6 ? ' +' + (v.length - 6) : ''));
console.log(Object.keys(by).length, 'missing (monster, pel:key)');
