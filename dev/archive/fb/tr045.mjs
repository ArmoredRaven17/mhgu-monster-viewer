import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const jm = gid => { const m = new Float32Array(16); m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1; m[12] = 40; m[13] = 380; m[14] = 440; return m; };
for (const v of ['7:0xe6', '7:0xea']){
  const st = S.createShellState('em045_04');
  for (let fr = 0; fr <= 400; fr++){
    const out = S.stepShells(st, { monId: 'em045_04', list: '9', clip: 'Motion[1]', frame: Math.min(fr, 200), joints: jm,
      rock: { variant: v, target: { x: 900, y: 40, z: 2400 }, floorY: 0 }, owner: { x: 0, y: 0x3000, z: 0 },
      ownerPos: { x: 120.5, y: 15.25, z: -80.75 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, rank: 5, questLevel: 10 });
    for (const s of out.spawned) console.log(v, fr, 'spawn', s.shell, s.modeIndex, JSON.stringify(s.launch && s.launch.velocity), s.timer, s.flight);
    for (const s of out.started) console.log(v, fr, 'start', s.start && s.start.key, s.start && s.start.kind);
    for (const s of out.ended) console.log(v, fr, 'ended', s.shell, JSON.stringify(Object.fromEntries(Object.entries(s).filter(([k, x]) => typeof x !== 'object' || x === null))).slice(0, 900), JSON.stringify(s.slots));
    for (const s of out.removed || []) console.log(v, fr, 'removed', s.shell);
    if (out.refused.length) console.log(v, fr, 'refused', JSON.stringify(out.refused));
  }
}
