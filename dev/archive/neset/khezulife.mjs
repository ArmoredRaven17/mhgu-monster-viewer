// khezulife.mjs: Khezu's timer-0 shell01 children with input.hitLife on (the page's), their life in moves
const S = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js');
const id = () => { const m = new Array(16).fill(0); m[0] = m[5] = m[10] = m[15] = 1; m[13] = 500; return m; };
for (const [list, clip, len, variant] of [['2', 'Motion[75]', 200, '7:0x33'], ['2', 'Motion[61]', 260, '7:0x3f']]){
  const st = S.createShellState('em003_00'); const seen = new Map(); const ref = [];
  for (let k = 0; k < len + 300; k++){
    const fr = Math.min(k, len);
    const out = S.stepShells(st, { monId: 'em003_00', list, clip, frame: fr, joints: () => id(), hitLife: false,
      rock: { variant, target: { x: 0, y: 0, z: 1500 }, floorY: 0 }, owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: 0, y: 200, z: 0 } });
    for (const r of out.refused) ref.push(r.why);
    for (const sh of out.spawned) seen.set(sh.id, { shell: sh.shell, mode: sh.modeIndex, born: k, gone: null });
    for (const sh of out.alive || []) if (seen.has(sh.id) && sh.state === 1) seen.get(sh.id).gone = k + 1;
  }
  console.log(clip, JSON.stringify([...seen.values()].filter(x => x.shell === 'shell01').map(x => [x.mode, x.gone - x.born])), ref.slice(0, 2));
}
