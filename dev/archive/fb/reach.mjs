// reach.mjs <mon> [...]: every clip of the monster (docs/monsters.json lists) x every variant the shells module offers for it, played through
// stepShells with stand-in inputs; prints the EffectList records (pel:key) the spawned shells name in their ef params (the records to export)
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const ROOT = 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/';
const S = await import(pathToFileURL(ROOT + 'render/shells.js').href);
const M = JSON.parse(readFileSync(ROOT + 'monsters.json', 'utf8'));
const arr = Array.isArray(M) ? M : M.monsters;
const jm = gid => { const m = new Float32Array(16); m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1; m[12] = 40 + (gid % 7) * 10; m[13] = 250 + (gid % 5) * 20; m[14] = 150 + (gid % 3) * 30; return m; };
for (const mon of process.argv.slice(2)){
  const e = arr.find(x => x.id === mon);
  const D = S.SHELL_DATA[mon];
  if (!e || !D){ console.log(mon, 'no monster / no SHELL_DATA'); continue; }
  const recs = new Map(), byMode = new Map();
  for (const L of e.lists){
    for (const c of L.clips){
      const bare = c.clip.replace(/_loop$/, '').replace(/_start$/, '');
      if (c.clip.endsWith('_start')) continue;
      let vs = [];
      try { vs = S.pickVariantsFor(mon, L.id, bare, {}) || []; } catch (err) { vs = []; }
      if (!vs.length) vs = [null];
      const len = Math.max(2, Math.round(c.dur * 60) + (c.clip.endsWith('_loop') ? 120 : 0));
      for (const v of vs){
        for (const rank of [5, 3]){
          const st = S.createShellState(mon);
          for (let fr = 0; fr <= len + 400; fr++){
            const frame = Math.min(fr, len);
            let out;
            try {
              out = S.stepShells(st, { monId: mon, list: L.id, clip: bare, frame, joints: jm,
                rock: { variant: v, target: { x: 900, y: 40, z: 2400 }, floorY: 0 }, owner: { x: 0, y: 0x3000, z: 0 },
                ownerPos: { x: 120.5, y: 15.25, z: -80.75 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, rank, questLevel: 10 });
            } catch (err) { console.log(mon, L.id, bare, v, 'THROWS', String(err).slice(0, 160)); break; }
            for (const sh of out.spawned){
              const def = D.shells[sh.shell], lists = (def && def.lists) || D.lists;
              const km = sh.shell + ':' + sh.modeIndex;
              byMode.set(km, (byMode.get(km) || new Set()).add('L' + L.id + ' ' + bare + (v ? ' ' + v : '')));
              const md = sh.mode || (def && def.modes[sh.modeIndex]);
              if (!md || !md.ef){ console.log(mon, 'no mode ef', sh.shell, sh.modeIndex); continue; }
              for (const [li, key] of md.ef){
                if (li > 7 || key < 0) continue;
                const pel = lists[li] && lists[li].pel;
                if (!pel){ console.log(mon, 'no list', li, sh.shell); continue; }
                const k = pel + ':' + key;
                recs.set(k, (recs.get(k) || new Set()).add(km));
              }
            }
          }
        }
      }
    }
  }
  const per = {};
  for (const k of recs.keys()){ const [p, key] = k.split(':'); (per[p] = per[p] || []).push(+key); }
  console.log(mon, Object.entries(per).map(([p, ks]) => p + ':' + ks.sort((a, b) => a - b).join(',')).join(' '));
  console.log('   modes', [...byMode.keys()].sort().join(' '));
}
