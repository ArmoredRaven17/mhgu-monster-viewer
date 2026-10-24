// THE WEB ANCHORS (shell60 / shell61): each L2 M30 wind-up's anchors, made on the play's wrap (the hold's start), every move
// against the ROM run (emu60.py: base60 / base61 ctor, init, move native), through the hang; then a release (an L3 clip's
// start) and the end it makes (u 311)
const EMU60 = EMU.replace(/emu57\.py$/, 'emu60.py');
const webCases = [];
const wv = [['1:0x1e', 61, [0, 1, 2]], ['1:0x24', 61, [0, 1, 2, 3]], ['1:0x1c', 60, [6]], ['1:0x22', 60, [11, 12, 8, 9, 0]]];
const OWN = { pos: [150.0, -90.0, -260.0], y: 0x3456, target: [1200.0, 0.0, 3800.0] };
for (const [v, cls, ms] of wv) for (const m of ms){
  const md = S.SHELL_DATA.em088_00.shells['shell' + cls].modes[m];
  webCases.push({ name: v + '_' + m, cls, mode: m, aimed: cls === 60 && m >= 6, R: 2500.0, ownerPos: OWN.pos, ownerY: OWN.y, target: OWN.target,
                  sh: { ints: md.sh.ints, floats: md.sh.floats, vecs: md.sh.vecs, ef: md.ef, hit: md.hit }, frames: 400, releaseAt: 300 });
}
writeFileSync(join(dir, 'web.json'), JSON.stringify(webCases));
const py60 = spawnSync('python', [EMU60, join(dir, 'web.json'), join(dir, 'webrom.json')], { encoding: 'utf8' });
if (py60.status !== 0){ console.log(py60.stdout, py60.stderr); process.exit(1); }
const WROM = JSON.parse(readFileSync(join(dir, 'webrom.json'), 'utf8'));
const webBase = v => ({ monId: 'em088_00', joints: () => J1, dt: 1, carry: 4, owner: { x: 0, y: OWN.y, z: 0 },
                        ownerPos: { x: OWN.pos[0], y: OWN.pos[1], z: OWN.pos[2] }, effectAlive: () => true,
                        rock: { variant: v, target: { x: OWN.target[0], y: OWN.target[1], z: OWN.target[2] }, floorY: 0 } });
// the wind-up played to its end and wrapped (the anchors made), 299 more frames of it, then an L3 clip (the release)
function webSeq(v, hold = 300){
  const seq = [];
  for (let fr = 50; fr < 60; fr++) seq.push(['2', 'Motion[30]', fr]);
  for (let fr = 0; fr < hold; fr++) seq.push(['2', 'Motion[30]', fr]);
  for (let fr = 0; fr < 3; fr++) seq.push(['3', 'Motion[2]', fr]);
  return seq;
}
for (const [v, cls, ms] of wv){
  for (const m of ms){
    const R = WROM[v + '_' + m].slice(1), st = S.createShellState('em088_00'), base = webBase(v);
    let me = null, n = 0, bad = null;
    for (const [l, c, fr] of webSeq(v)){
      const out = S.stepShells(st, Object.assign({}, base, { list: l, clip: c, frame: fr }));
      if (!me) me = out.spawned.find(x => x.modeIndex === m && x.shell === 'shell' + cls) || null;
      if (!me) continue;
      const b = R[n++];
      if (!b){ bad = 'the ROM ran out at move ' + n; break; }
      if (me.state !== b.state || (me.state === 1 && (me.sub !== b.sub || me.phase !== b.phase))){ bad = 'move ' + n + ': state ' + [me.state, me.sub, me.phase] + ' / ROM ' + [b.state, b.sub, b.phase]; break; }
      if (!eq(me.position, b.pos)){ bad = 'move ' + n + ': position ' + me.position + ' / ROM ' + b.pos; break; }
      if (!eq(me.angles.map(w => w >>> 0), b.words)){ bad = 'move ' + n + ': words ' + me.angles + ' / ROM ' + b.words; break; }
      if (me.state === 1 && !eq(me.velocity, b.vel)){ bad = 'move ' + n + ': velocity ' + me.velocity + ' / ROM ' + b.vel; break; }
      const romStarts = b.log.filter(x => x[0] === 'start').map(x => x[1]).sort().join();
      const jsStarts = out.started.filter(x => x.shell === me).map(x => x.start.param)
                         .concat(out.spawned.includes(me) && me.start ? [0] : []).sort().join();
      if (romStarts !== jsStarts){ bad = 'move ' + n + ': effect starts ' + jsStarts + ' / ROM ' + romStarts; break; }
      if (me.state === 0xfe) break;
    }
    ok(!bad && me && me.state === 0xfe, v + ' shell' + cls + ' mode ' + m + ': every move bit for bit, the hang, the release (u 311 at the end)',
       bad || (me ? n + ' moves, hung at ' + me.H.map(x => x.toFixed(1)).join(', ') : 'not made'));
  }
}
{
  const st = S.createShellState('em088_00'), base = webBase('1:0x24');
  for (const [l, c, fr] of webSeq('1:0x24', 200).slice(0, -3)) S.stepShells(st, Object.assign({}, base, { list: l, clip: c, frame: fr }));
  const A = S.webAnchors088(st);
  ok(A.d450.every(x => x && x.point.length === 3) && A.d450.map(x => x.thread).join() === 'true,true,true,false' && A.d420.every(x => x === null),
     'webAnchors088: the four d450 anchors at their points, threads on p 0..2 only (0x10b98a8)', A.d450.map(x => x && x.point.map(q => q.toFixed(0)).join('/')).join('  '));
  S.stepShells(st, Object.assign({}, base, { list: '3', clip: 'Motion[2]', frame: 0 }));
  ok(S.webAnchors088(st).d450.every(x => x === null), 'an L3 clip\'s start releases them (the handles emptied)');
}
