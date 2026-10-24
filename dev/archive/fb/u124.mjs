import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const jm = gid => { const m = new Float32Array(16); m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1; m[12] = 118; m[13] = 210.5; m[14] = -60.25; return m; };
const st = S.createShellState('em072_00');
for (let fr = 0; fr <= 750; fr++){
  const out = S.stepShells(st, { monId: 'em072_00', list: '4', clip: 'Motion[15]', frame: Math.min(fr, 103), joints: jm,
    rock: { variant: '7:0x55', target: { x: 900, y: 40, z: 2400 }, floorY: 0 }, owner: { x: 0, y: 0x3000, z: 0 },
    ownerPos: { x: 120.5, y: 15.25, z: -80.75 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, rank: 5, questLevel: 10 });
  for (const s of out.started) if (s.shell && s.shell.shell === "shell03") console.log(fr, JSON.stringify(Object.fromEntries(Object.entries(s).filter(([k]) => k !== "shell"))).slice(0, 300));
  for (const s of []) if (0) console.log('f', fr, 'key', s.key, JSON.stringify(s.requester && s.requester.position || s.position));
  for (const s of out.ended) if (s.shell === 'shell03') console.log('f', fr, 'ended', s.shell, s.modeIndex, s.position && [...s.position].map(x => x.toFixed(1)).join(','));
}
