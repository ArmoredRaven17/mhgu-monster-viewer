const J = g => [1,0,0,0,0,1,0,0,0,0,1,0, ...({157:[160,260,-40]}[g]||[120.5,200,-80.75]), 1];
for (const p of ['file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js', './shells.js']){
  const S = await import(new URL(p, import.meta.url));
  const st = S.createShellState('em083_00'); let sh = null;
  for (let i = 0; i <= 20; i++){ const o = S.stepShells(st, { monId:'em083_00', list:'2', clip:'Motion[62]', frame:i, joints:J,
    rock:{variant:'7:0xd3', target:{x:900,y:40,z:2400}, floorY:0}, owner:{x:0,y:0x3000,z:0}, ownerPos:{x:120.5,y:15.25,z:-80.75}, ground:0, size:[1,1], baseScale:1, rank:5 });
    if (o.spawned.length) sh = o.spawned[0]; }
  console.log(p.slice(-12), sh && sh.launch.angles);
}
