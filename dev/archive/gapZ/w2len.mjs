import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const HM = JSON.parse(readFileSync('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/hyper-motion.json', 'utf8'));
const f = Math.fround, mat = t => [1,0,0,0,0,1,0,0,0,0,1,0,t[0],t[1],t[2],1].map(f), J = () => mat([0,300,300]);
for (const hyper of [undefined, { ids: [1, 2], shells: HM.em003_00.normal.shells }]){
  const st = S.createShellState('em003_00'), track = new Map();
  const seq = [...Array.from({ length: 201 }, (_, i) => [i, null]), ...Array.from({ length: 215 }, (_, i) => [40 + i, 40]), ...Array.from({ length: 101 }, (_, i) => [i, null, 'Motion[13]'])];
  for (const [fr, ls, clip] of seq){
    const out = S.stepShells(st, { monId: 'em003_00', list: '2', clip: clip || 'Motion[3]', frame: fr, loopStart: ls, joints: J, rock: { variant: '7:0x4d', floorY: 0.0, target: { x: 0, y: 0, z: 1500 } },
      owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 }, ground: 0.0, size: [1, 1], baseScale: 1.0, hitLife: true, rank: 5, hyperShells: hyper });
    for (const sh of st.shells) if (sh.shell === 'shell03' && sh.position){
      const t = track.get(sh.id) || { mode: sh.modeIndex, p0: sh.position.slice(), p1: null, n: 0 };
      t.p1 = sh.position.slice(); t.n++; track.set(sh.id, t);
    }
  }
  for (const t of track.values()){
    const d = Math.hypot(t.p1[0] - t.p0[0], t.p1[2] - t.p0[2]), ang = Math.atan2(t.p1[0] - t.p0[0], t.p1[2] - t.p0[2]) * 180 / Math.PI;
    console.log(hyper ? 'HYPER' : 'off  ', 'mode', t.mode, 'steps', t.n, 'from', t.p0.map(Math.round), 'reach', Math.round(d), 'bearing', ang.toFixed(1));
  }
}
