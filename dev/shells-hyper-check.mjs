// GU Hyper's ShellElements in render/shells.js (hyperShellElement; rom-map "Hyper ShellElements -- the -1 aura ID"): a shell whose
// hit side is on and whose +0x15bc is -1 (no aura ID: 0xcad9c passes it whenever Hyper is on) or a held ID, and whose base number
// (+0x15a8) matches an entry of a held ID (-1: element 1's table first, then element 2's) is made at ScaleRate (the unit / effect parent,
// and the hit shapes x ScaleRate); Hyper off, or no held ID with an entry for its class: as before. stepShells alone on a stand-in pose.
//
//   node dev/shells-hyper-check.mjs
//
// Exit code 1 when anything fails.
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const HM = JSON.parse(readFileSync('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/hyper-motion.json', 'utf8'));
const f = Math.fround;
let pass = 0, fail = 0;
const ok = (c, msg, detail = '') => { if (c) pass++; else fail++; console.log((c ? 'PASS ' : 'FAIL ') + msg + (detail ? '  -- ' + detail : '')); };
const mat = t => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, t[0], t[1], t[2], 1].map(f);
const J = () => mat([0, 300, 300]);
function run(mon, list, clip, variant, len, hyper, extra = {}){
  const st = S.createShellState(mon), made = [];
  for (let i = 0; i <= len; i++){
    const out = S.stepShells(st, { monId: mon, list, clip, frame: i, joints: J, rock: { variant, floorY: 0.0, target: { x: 0, y: 0, z: 1500 } },
      owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 }, ground: 0.0, size: [1.0, 1.0], baseScale: 1.0, hitLife: true, rank: 5,
      hyperShells: hyper, ...extra });
    for (const sh of out.spawned) made.push(sh);
  }
  return made;
}
const sig = ms => ms.map(s => s.shell + '/' + s.modeIndex + ':' + (s.unitScale == null ? '-' : (+s.unitScale).toFixed(3)) + (s.hyper ? '*' + s.hyper.id : '')).join(' ');
// Lagiacrus L4 M2 (7, 0x6e): shell01 modes 26 / 3 / ... carry aura ID 5 (normal file: ID 5 -> class 1 x1.3 scale)
const N046 = HM.em046_00.normal.shells, G046 = HM.em046_00.g.shells;
const off = run('em046_00', '4', 'Motion[2]', '7:0x6e', 280, undefined);
const on5 = run('em046_00', '4', 'Motion[2]', '7:0x6e', 280, { ids: [5, 1], shells: N046 });
const onX = run('em046_00', '4', 'Motion[2]', '7:0x6e', 280, { ids: [2, 3], shells: N046 });
ok(off.length > 0 && off.every(s => !s.hyper), 'Lagiacrus L4 M2 Hyper off: no shell scaled', sig(off));
ok(on5.length === off.length && on5.filter(s => s.shell === 'shell01').every(s => s.hyper && s.hyper.id === 5 && Math.abs(s.hyper.scale - 1.3) < 1e-6),
   'Lagiacrus L4 M2 holding ID 5 (normal): every sp_01 at ScaleRate 1.3', sig(on5));
ok(on5.filter(s => s.shell === 'shell01').every((s, i) => { const o = off.filter(x => x.shell === 'shell01')[i]; const b = o.unitScale != null ? o.unitScale : o.mode.scale; return Math.abs(s.unitScale - f(b * 1.3)) < 1e-4; }),
   'its unit scale = ShellScale x 1.3');
ok(onX.every(s => !s.hyper), 'Lagiacrus holding IDs 2 / 3 (not 5): unchanged', sig(onX));
// Lagiacrus L4 M36 (7, 0x9a): shell01 mode 20 carries ID 1 -- only the G file lists ID 1 class 1 (x1.3)
const g1 = run('em046_00', '4', 'Motion[36]', '7:0x9a', 60, { ids: [1, 5], shells: G046 });
const n1 = run('em046_00', '4', 'Motion[36]', '7:0x9a', 60, { ids: [1, 5], shells: N046 });
ok(g1.some(s => s.hyper && s.hyper.id === 1) && n1.every(s => !s.hyper), 'Lagiacrus L4 M36 mode 20 (ID 1): G file scales it, the normal file has no ID 1 entry', sig(g1) + ' | ' + sig(n1));
// Rathalos: his shells carry no aura ID (+0x15bc -1), so holding ID 1 scales them by its entries (class 0 x1.3, class 1 x1.5);
// holding IDs without entries (2 / 3): unchanged. [The first read's "never apply" was the WITHDRAWN -1 reading.]
const D2 = S.SHELL_DATA.em002_00, a2 = D2.actions.find(a => (a.spawns || []).some(sp => sp.shell === 'shell00'));
if (a2){
  const r2 = run('em002_00', a2.list, a2.clip, a2.variant, 200, { ids: [1, 3], shells: HM.em002_00.normal.shells });
  const r2x = run('em002_00', a2.list, a2.clip, a2.variant, 200, { ids: [2, 3], shells: HM.em002_00.normal.shells });
  ok(r2.length > 0 && r2.filter(s => s.shell === 'shell00').every(s => s.hyper && s.hyper.id === 1 && Math.abs(s.hyper.scale - 1.3) < 1e-6),
     'Rathalos holding ID 1: sp_00 at x1.3 (aura -1 takes element 1 entry)', sig(r2).slice(0, 200));
  ok(r2x.every(s => !s.hyper), 'Rathalos holding 2 / 3 (no entries): unchanged', sig(r2x).slice(0, 200));
}
// Khezu (Raven, 2026-10-27): his ground lightning sp_03 (base03 -> class 3, +0x15bc -1) takes ID 1's (3, x1.2, x1.3)
const K = HM.em003_00.normal.shells;
const k0 = run('em003_00', '2', 'Motion[3]', '7:0x0e', 220, undefined);
const k1 = run('em003_00', '2', 'Motion[3]', '7:0x0e', 220, { ids: [2, 1], shells: K });
const k2 = run('em003_00', '2', 'Motion[3]', '7:0x0e', 220, { ids: [2, 3], shells: K });
ok(k0.length === 3 && k0.every(s => s.shell === 'shell03' && !s.hyper), 'Khezu L2 M3 (7, 0x0e) Hyper off: three sp_03 bolts unscaled', sig(k0));
ok(k1.length === 3 && k1.every(s => s.hyper && s.hyper.id === 1 && Math.abs(s.unitScale - 1.3) < 1e-6), 'Khezu holding 2 / 1: each bolt at x1.3 (element 2 entry: element 1 has none for class 3)', sig(k1));
ok(k2.every(s => !s.hyper), 'Khezu holding 2 / 3 (no class 3 entries): unchanged', sig(k2));
// Nerscylla (G file): L2 M57 (7, 0x34) sp_00 modes 33..35 carry ID 2 -> class 0 x1.6; (7, 5)'s sp_13 carry none
const G070 = HM.em070_00.g.shells;
const n70 = run('em070_00', '2', 'Motion[57]', '7:0x34', 120, { ids: [4, 2], shells: G070 });
ok(n70.filter(x => x.shell === 'shell00').length > 0 && n70.filter(x => x.shell === 'shell00').every(x => x.hyper && Math.abs(x.hyper.scale - 1.6) < 1e-6),
   'Nerscylla L2 M57 (7, 0x34) holding 4 / 2 (G): sp_00 at x1.6', sig(n70));
const n70b = run('em070_00', '2', 'Motion[57]', '7:0x05', 120, { ids: [4, 2], shells: G070 });
ok(n70b.filter(x => x.shell === 'shell13').length > 0 && n70b.filter(x => x.shell === 'shell13').every(x => x.hyper && x.hyper.id === 2 && Math.abs(x.hyper.scale - 1.6) < 1e-6),
   'Nerscylla (7, 5) sp_13 (aura -1) holding 4 / 2 (G): ID 2 class 13 entry, x1.6', sig(n70b));
// Astalos (G file): L2 M27 (7, 0x3a) sp_01 mode 0 carries ID 4 -> class 1 x1.3
const n81 = run('em081_00', '2', 'Motion[27]', '7:0x3a', 120, { ids: [1, 4], shells: HM.em081_00.g.shells }, { chargeTier: 2 });   // the wing slam tests the charge byte
console.log('  (Astalos L2 M27 made: ' + (sig(n81) || 'nothing') + ')');
if (n81.length) ok(n81.filter(x => x.shell === 'shell01' && x.modeIndex === 0).every(x => x.hyper && Math.abs(x.hyper.scale - 1.3) < 1e-6), 'Astalos sp_01 mode 0 holding 1 / 4 (G): x1.3', sig(n81));
// THE BEAM BASE (base02g, beam-types.js): every beam is class 2 with aura -1 -- Agnaktor ID 1 (x1.6), Rajang G ID 3 (x1.5), Zamtrios ID 3 (x1.1)
const OM = { ownerMatrix: mat([0, 0, 0]) }, bsig = ms => ms.map(s => (s.type ? s.type.id : s.shell) + ':' + (s.unitScale == null ? '-' : (+s.unitScale).toFixed(3)) + (s.hyper ? '*' + s.hyper.id : '')).join(' ');
for (const [mon, l, c, v, side, ids, sc] of [['em049_00', '2', 'Motion[4]', '7:0x1f', 'normal', [1, 2], 1.6], ['em023_00', '2', 'Motion[20]', '7:0x34', 'g', [3, 1], 1.5],
                                              ['em067_00', '4', 'Motion[59]', '7:0x1b', 'normal', [3, 1], 1.1]]){
  const b0 = run(mon, l, c, v, 200, undefined, OM), b1 = run(mon, l, c, v, 200, { ids, shells: HM[mon][side].shells }, OM);
  const b2 = run(mon, l, c, v, 200, { ids: ids.slice(1), shells: HM[mon][side].shells }, OM);
  ok(b0.length > 0 && b0.every(s => s.base === 'base02g' && !s.hyper), mon + ' ' + l + '|' + c + ' Hyper off: the beam unscaled', bsig(b0));
  ok(b1.length === b0.length && b1.every(s => s.hyper && s.hyper.id === ids[0] && Math.abs(s.hyper.scale - sc) < 1e-6 && Math.abs(s.unitScale - f(f(s.type.scale) * f(sc))) < 1e-4),
     mon + ' holding ' + ids.join(' / ') + ' (' + side + '): the beam at x' + sc, bsig(b1));
  ok(b2.every(s => !s.hyper), mon + ' holding ' + ids.slice(1).join(' / ') + ' only (no class 2 entry): unchanged', bsig(b2));
}
// Deviljho: the breath sp_04 (base04, class 4) and the G file's sp_55 (base55, class 55), both aura -1: ID 1 x1.3
const dj4 = run('em043_00', '2', 'Motion[25]', '7:0x06', 200, { ids: [1, 2], shells: HM.em043_00.normal.shells });
const dj55 = run('em043_00', '2', 'Motion[41]', '7:0x93', 200, { ids: [1, 2], shells: HM.em043_00.g.shells });
const dj55n = run('em043_00', '2', 'Motion[41]', '7:0x93', 200, { ids: [1, 2], shells: HM.em043_00.normal.shells });
ok(dj4.length > 0 && dj4.every(s => s.shell === 'shell04' && s.hyper && Math.abs(s.unitScale - 1.3) < 1e-6), 'Deviljho L2 M25 (7, 6) holding 1 / 2: sp_04 at x1.3', bsig(dj4));
ok(dj55.length > 0 && dj55.every(s => s.shell === 'shell55' && s.hyper && Math.abs(s.unitScale - 1.3) < 1e-6), 'Deviljho L2 M41 (7, 0x93) holding 1 / 2 (G): sp_55 at x1.3', bsig(dj55));
ok(dj55n.every(s => !s.hyper), 'Deviljho sp_55 under the normal file (no class 55 entry): unchanged', bsig(dj55n));
// KHEZU'S (7, 0x4d) WHOLE (the Special entry's timeline: L2 M3 to 200, again from 40 -- a wrap to 40 for the shells): five bolts, 0 / +-55 then
// +-33 (wave 2, 0xd17130), each with its hit (sp_03 hit records 0 / 1 / 2: one capsule r 150 over its last step, x1.3 under Hyper)
function chain4d(hyper, chain){
  const st = S.createShellState('em003_00'), made = [], radii = new Set();
  const seq = chain ? [...Array.from({ length: 201 }, (_, i) => [i, null]), ...Array.from({ length: 215 }, (_, i) => [40 + i, 40])] : Array.from({ length: 337 }, (_, i) => [i, null]);
  for (const [fr, ls] of seq){
    const o = S.stepShells(st, { monId: 'em003_00', list: '2', clip: 'Motion[3]', frame: fr, loopStart: ls, joints: J, rock: { variant: '7:0x4d', floorY: 0.0, target: { x: 0, y: 0, z: 1500 } },
      owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 }, ground: 0.0, size: [1.0, 1.0], baseScale: 1.0, hitLife: true, rank: 5, hyperShells: hyper });
    for (const sh of o.spawned) made.push(sh);
    for (const h of S.shellHitShapesLive(st)) for (const A of h.shapes) radii.add(Math.round(A.r));
  }
  return { made, radii: [...radii] };
}
const c0 = chain4d(undefined, false), c1 = chain4d(undefined, true), c2 = chain4d({ ids: [1, 2], shells: K }, true);
const msig = r => r.made.map(s => s.modeIndex + (s.wave === 2 ? 'w2' : '') + ':' + (s.unitScale == null ? '-' : (+s.unitScale).toFixed(2))).join(' ') + ' r ' + r.radii.join('/');
ok(c0.made.map(s => s.modeIndex).join() === '15,16,17', 'Khezu (7, 0x4d) on plain L2 M3: the first wave only (15 / 16 / 17)', msig(c0));
ok(c1.made.map(s => s.modeIndex).join() === '15,16,17,18,19' && c1.made.slice(3).every(s => s.wave === 2) && c1.radii.join() === '150',
   'Khezu (7, 0x4d) whole: five bolts, 18 / 19 the second play (+-33), hit capsules r 150', msig(c1));
ok(c2.made.length === 5 && c2.made.every(s => Math.abs(s.unitScale - 1.3) < 1e-6) && c2.radii.join() === '195', 'Khezu (7, 0x4d) whole holding 1 / 2: all five at x1.3, hit r 195', msig(c2));
// the hit shapes take the same factor (0x43aa38): a scaled shell's ShellScale x ScaleRate
console.log(`${pass} pass, ${fail} fail`);
process.exitCode = fail ? 1 : 0;
