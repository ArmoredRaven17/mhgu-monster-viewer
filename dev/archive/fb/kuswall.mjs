const S = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js');
const f = Math.fround, I = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,300,0,1].map(f);
const D = S.SHELL_DATA.em024_00;
const clips = new Map();
for (const a of D.actions) clips.set(a.list + '|' + a.clip, (clips.get(a.list + '|' + a.clip) || []).concat([a.variant]));
for (const wz of [-1500, -800, 800, 1500]) for (const [key, vars] of clips) for (const v of [...new Set(vars)]){
  const [list, clip] = key.split('|');
  const st = S.createShellState('em024_00'); const ev = {};
  for (let i = 0; i < 1400; i++){
    const out = S.stepShells(st, { monId: 'em024_00', list, clip, frame: Math.min(i, 300), joints: g => I,
      rock: { variant: v, target: { x: 0, y: 0, z: -2100 }, floorY: 0, wall: { axis: 'z', at: wz, facing: wz < 0 ? 1 : -1 } },
      owner: { x: 0, y: 0x8000, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 }, ground: 0, hitLife: true, aura: 3, level: 3 });
    for (const sh of out.alive.concat(out.ended)) for (const e of sh.events || []) if (e.ev) { const k = sh.shell + ' ' + e.ev + (e.type != null ? e.type : ''); ev[k] = (ev[k] || 0) + 1; }
    for (const x of out.started){ const k = 'start ' + x.start.list + x.start.key; ev[k] = (ev[k] || 0) + 1; }
  }
  if (wz === -1500) console.log(wz, key, v, JSON.stringify(ev));
}
