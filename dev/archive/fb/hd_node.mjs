// hd_node.mjs [mon ...]: THE HUNTER CONTROL's reach in the shells -- node replay of stepShells over every clip x pick of every
// SHELL_DATA monster, the target at the default (2100 ahead; the Rath line 6300) and at each control setting; per monster the
// records started per setting and the shells spawned (count), and the difference against the default.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const ROOT = 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/';
const S = await import(pathToFileURL(ROOT + 'render/shells.js').href);
const M = JSON.parse(readFileSync(ROOT + 'monsters.json', 'utf8'));
const arr = Array.isArray(M) ? M : M.monsters;
const jm = gid => { const m = new Float32Array(16); m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1; m[12] = 40 + (gid % 7) * 10; m[13] = 250 + (gid % 5) * 20; m[14] = 150 + (gid % 3) * 30; return m; };
const RATH = new Set(['em001_00', 'em001_02', 'em001_04', 'em002_00', 'em002_02', 'em002_04']);
const OWN = [120.5, 15.25, -80.75], YAW16 = 0x3000, YAW = YAW16 * 2 * Math.PI / 65536;
const SETS = [['default', -1, 0], ['at', 0, 0], ['near', 500, 0], ['mid', 1200, 0], ['left', -1, 90], ['right', -1, -90], ['behind', -1, 180],
              ['nearBehind', 500, 180]];
const tgt = (mon, d, side) => { const a = d < 0 ? (RATH.has(mon) ? 6300 : 2100) : d, y = YAW + side * Math.PI / 180;
  return { x: OWN[0] + a * Math.sin(y), y: 0, z: OWN[2] + a * Math.cos(y) }; };
const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(S.SHELL_DATA);
const res = {};
for (const mon of ids){
  const e = arr.find(x => x.id === mon);
  if (!e || !S.SHELL_DATA[mon]) continue;
  const per = {};
  for (const [name, d, side] of SETS){
    const recs = new Map(), spawned = new Map();
    for (const L of e.lists) for (const c of L.clips){
      if (c.clip.endsWith('_start')) continue;
      const bare = c.clip.replace(/_(loop|start)$/, '');
      let vs = []; try { vs = S.pickVariantsFor(mon, L.id, bare, {}) || []; } catch (err) {}
      if (!vs.length) vs = [null];
      const sib = L.clips.find(x => x.clip === bare + '_start');
      const len = Math.max(2, Math.round((c.dur + (sib ? sib.dur : 0)) * 60));
      for (const v of vs){
        const st = S.createShellState(mon);
        const key = L.id + '|' + bare + (v ? '#' + v : '');
        for (let fr = 0; fr <= len + 600; fr++){
          let out;
          try { out = S.stepShells(st, { monId: mon, list: L.id, clip: bare, frame: Math.min(fr, len), joints: jm,
            rock: { variant: v, target: tgt(mon, d, side), floorY: 0 }, owner: { x: 0, y: YAW16, z: 0 },
            ownerPos: { x: OWN[0], y: OWN[1], z: OWN[2] }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, rank: 5, questLevel: 10 }); }
          catch (err) { break; }
          for (const s of out.started){ const q = s.start; if (q && q.pel){ const k = q.pel + ':' + q.key; if (!recs.has(k)) recs.set(k, new Set()); recs.get(k).add(key); } }
          for (const sh of out.spawned){
            spawned.set(key, (spawned.get(key) || 0) + 1);
            const q = sh.start; if (q && q.pel){ const k = q.pel + ':' + q.key; if (!recs.has(k)) recs.set(k, new Set()); recs.get(k).add(key); }
          }
          if (fr > len && !st.shells.length) break;
        }
      }
    }
    per[name] = { recs, spawned };
  }
  const base = per.default, diff = {};
  for (const [name] of SETS.slice(1)){
    const p = per[name];
    const gained = [...p.recs.keys()].filter(k => !base.recs.has(k)).map(k => k + ' @' + [...p.recs.get(k)].slice(0, 3).join(','));
    const lost = [...base.recs.keys()].filter(k => !p.recs.has(k));
    const spawnDiff = [...new Set([...p.spawned.keys(), ...base.spawned.keys()])]
      .filter(k => (p.spawned.get(k) || 0) !== (base.spawned.get(k) || 0)).map(k => k + ' ' + (base.spawned.get(k) || 0) + '->' + (p.spawned.get(k) || 0));
    if (gained.length || lost.length || spawnDiff.length) diff[name] = { gained, lost, spawnDiff: spawnDiff.slice(0, 12), spawnDiffN: spawnDiff.length };
  }
  res[mon] = diff;
  if (Object.keys(diff).length) console.log(mon, JSON.stringify(diff).slice(0, 600));
}
writeFileSync('hd_node.json', JSON.stringify(res, null, 1));
console.log('done', Object.keys(res).length);
