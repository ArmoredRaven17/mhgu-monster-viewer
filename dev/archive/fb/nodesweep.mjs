// nodesweep.mjs: for every record drawtable.json leaves unstarted, replay the monster's clips x picks under each state input the shells
// read (one at a time over the plain inputs) and report which input makes it start -- the record's trigger, for the table's reason
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const ROOT = 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/';
const S = await import(pathToFileURL(ROOT + 'render/shells.js').href);
const M = JSON.parse(readFileSync(ROOT + 'monsters.json', 'utf8')); const arr = Array.isArray(M) ? M : M.monsters;
const rows = JSON.parse(readFileSync('drawtable.json', 'utf8'));
const un = {};
for (const r of rows) if (!/^draws/.test(r[5]) && !/^CONTACT/.test(r[5]) && !/^NO DRAW/.test(r[5])) (un[r[0]] = un[r[0]] || new Set()).add(r[1] + ':' + r[2]);
const jm = gid => { const m = new Float32Array(16); m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1; m[12] = 40 + (gid % 7) * 10; m[13] = 250 + (gid % 5) * 20; m[14] = 150 + (gid % 3) * 30; return m; };
const VARIANTS = [['rage', { rage: true }], ['tired', { tired: true, beamState: { tired: true } }], ['rank 3', { rank: 3 }], ['rank 1', { rank: 1 }],
  ['tailSevered', { tailSevered: true }], ['snow', { snow: true, beamState: { snow: true } }], ['charged', { charged: true }],
  ['chargeTier 1', { chargeTier: 1 }], ['chargeTier 2', { chargeTier: 2 }], ['chargeTier 3', { chargeTier: 3 }],
  ['carry 1', { carry: 1 }], ['carry 2', { carry: 2 }], ['carry 3', { carry: 3 }], ['carry 0', { carry: 0 }],
  ['breakLevel7 1', { breakLevel7: 1 }], ['breakLevel7 2', { breakLevel7: 2 }], ['tusk066 1', { tusk066: 1 }], ['tusk066 2', { tusk066: 2 }],
  ['gas021 1', { gas021: 1 }], ['gas021 2', { gas021: 2 }], ['gas021 3', { gas021: 3 }], ['gas021 4', { gas021: 4 }],
  ['soulFlame082', { soulFlame082: true }], ['mizu082 1', { mizu082: 1 }], ['windAura024 1', { windAura024: 1 }], ['windAura024 3', { windAura024: 3 }],
  ['fireAura027', { fireAura027: 1 }], ['gauge071 20000', { gauge071: 20000 }], ['heat049 1', { heat049: 1 }], ['back070', { back070: true }],
  ['linked', { linked: true, link: true }], ['questLevel 0', { questLevel: 0 }], ['questLevel 3', { questLevel: 3 }], ['trunkSnow083 2', { trunkSnow083: 2 }],
  ['aura', { aura: true }], ['posture 4', { posture: 4 }]];
const res = {};
for (const [mon, set] of Object.entries(un)){
  const e = arr.find(x => x.id === mon), D = S.SHELL_DATA[mon];
  if (!e || !D) continue;
  const found = {};
  for (const [name, extra] of VARIANTS){
    for (const L of e.lists) for (const c of L.clips){
      if (c.clip.endsWith('_start')) continue;
      const bare = c.clip.replace(/_(loop|start)$/, '');
      let vs = []; try { vs = S.pickVariantsFor(mon, L.id, bare, extra.beamState || {}) || []; } catch (err) {}
      if (!vs.length) vs = [null];
      const len = Math.max(2, Math.round(c.dur * 60) + (c.clip.endsWith('_loop') ? 120 : 0));
      for (const v of vs){
        const st = S.createShellState(mon);
        for (let fr = 0; fr <= len + 400; fr++){
          let out; try { out = S.stepShells(st, Object.assign({ monId: mon, list: L.id, clip: bare, frame: Math.min(fr, len), joints: jm,
            rock: { variant: v, target: { x: 900, y: 40, z: 2400 }, floorY: 0 }, owner: { x: 0, y: 0x3000, z: 0 },
            ownerPos: { x: 120.5, y: 15.25, z: -80.75 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, rank: 5, questLevel: 10 }, extra)); } catch (err) { break; }
          const add = q => { if (q && q.pel){ const k = q.pel + ':' + q.key; if (set.has(k) && !found[k]) found[k] = name + ' (L' + L.id + ' ' + bare + (v ? ' ' + v : '') + ')'; } };
          for (const s of out.started) add(s.start);
          for (const sh of out.spawned) add(sh.start);
        }
      }
    }
  }
  res[mon] = found;
  console.log(mon, set.size, 'unstarted;', Object.keys(found).length, 'start under an input:', JSON.stringify(found).slice(0, 300));
}
writeFileSync('nodesweep.json', JSON.stringify(res));
