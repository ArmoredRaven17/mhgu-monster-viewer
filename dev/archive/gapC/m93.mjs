import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL(process.argv[2]).href);
const jm = gid => { const m = new Float32Array(16); m[0]=1;m[5]=1;m[10]=1;m[15]=1; m[12] = 40 + (gid % 7) * 10; m[13] = 250 + (gid % 5) * 20; m[14] = 150 + (gid % 3) * 30; return m; };
const frameM = side => [1,0,0,0, 0,1,0,0, 0,0,1,0, side === 'left' ? -300 : 300, 400, 200, 1];
const st = S.createShellState('em084_00');
for (let fr = 0; fr < 400; fr++){
  const out = S.stepShells(st, { monId: 'em084_00', list: 'l_2', clip: 'Motion[93]', frame: Math.min(fr, 300), joints: jm, attachedJoints: { left: jm, right: jm },
    arms: { left: { form: 1, frame: frameM('left') }, right: { form: 1, frame: frameM('right') } }, rock: { floorY: 0 }, owner: { x: 0, y: 0x3000, z: 0 },
    ownerPos: { x: 120.5, y: 15.25, z: -80.75 }, ground: 0, hitLife: true, rank: 5 });
  for (const sh of out.spawned) console.log(fr, 'spawn', sh.shell, sh.modeIndex, sh.start ? sh.start.pel + ':' + sh.start.key : '-');
  for (const s of out.started) console.log(fr, 'started', s.start.pel + ':' + s.start.key, s.start.kind);
}
