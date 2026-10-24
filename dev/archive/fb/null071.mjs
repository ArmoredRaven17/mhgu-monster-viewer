const S = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js');
for (const v of ['7:0x52', '7:0x58', '7:0x59', '7:0x5b', null]){
  const st = S.createShellState('em071_00');
  for (let k = 0; k < 2; k++) for (let i = 0; i <= 285; i++){
    const out = S.stepShells(st, { monId: 'em071_00', list: '2', clip: 'Motion[7]', frame: i, joints: () => null, rock: { variant: v, target: { x: 900, y: 0, z: 2400 }, floorY: 0 },
      owner: { x: 0, y: 0x3000, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 }, hitLife: true });
    for (const s of out.started) if (!s.start) console.log('null start', v, i, s.shell.shell, s.shell.modeIndex);
    for (const sh of out.alive) for (const e of sh.events || []) if (e.ev === 'start' && !e.start) console.log('null ev start', v, i, sh.shell, sh.modeIndex, e.kind);
  }
}
console.log('done');
