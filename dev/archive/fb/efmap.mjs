// efmap.mjs: for every SHELL_DATA monster, every record its shells' modes name: [shell, base, mode, ef slot]
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const out = {};
for (const [mon, D] of Object.entries(S.SHELL_DATA)){
  const m = out[mon] = {};
  for (const [n, def] of Object.entries(D.shells || {})) for (const [mi, md] of Object.entries(def.modes || {})){
    const lists = def.lists || D.lists;
    (md.ef || []).forEach(([li, k], slot) => { if (li > 7 || k < 0 || !lists[li]) return; const key = lists[li].pel + ':' + k; (m[key] = m[key] || []).push([n, def.base, +mi, slot]); });
  }
}
writeFileSync('efmap.json', JSON.stringify(out));
console.log(Object.keys(out).length);
