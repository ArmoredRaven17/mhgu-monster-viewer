// THE SILK BALLS (shell00 = sp_00 on base00, fired by the motion event table's type-8 rows on L2 M26): each ball's spawn (the
// row's kind and frame / clock, its yaw offset), every move to its split against the ROM run (emu00.py: sp_00 ctor / init / move
// with base00 native), the split child's request (point and words), and the child's own flight to its landing at world y 0
const EMU00 = EMU.replace(/emu57\.py$/, 'emu00.py');
const SH00 = S.SHELL_DATA.em088_00.shells.shell00;
const B00 = { pos: [40.0, -90.0, -60.0], y: 0x2345, target: [800.0, 0.0, 3100.0] };
const b00base = v => ({ monId: 'em088_00', joints: () => J1, dt: 1, carry: 4, owner: { x: 0, y: B00.y, z: 0 },
                        ownerPos: { x: B00.pos[0], y: B00.pos[1], z: B00.pos[2] }, effectAlive: () => true,
                        rock: { variant: v, target: { x: B00.target[0], y: B00.target[1], z: B00.target[2] }, floorY: 0 } });
function runBalls(v, plays = 1){
  const st = S.createShellState('em088_00'), base = b00base(v), log = [];
  S.stepShells(st, Object.assign({}, base, { list: '0', clip: 'Motion[1]', frame: 0 }));
  for (let pl = 0; pl < plays; pl++){
    S.stepShells(st, Object.assign({}, base, { list: '0', clip: 'Motion[1]', frame: 0 }));
    for (let fr = 0; fr < 260; fr++){
      const out = S.stepShells(st, Object.assign({}, base, { list: '2', clip: 'Motion[26]', frame: fr }));
      log.push({ fr, out, snap: st.shells.filter(x => x.shell === 'shell00').map(x => ({ id: x.id, m: x.modeIndex, state: x.state, pos: x.position.slice(),
                 words: x.angles.map(w => w >>> 0), vel: x.velocity.slice(), split: x.split, sel: x.selector, creator: x.creator })) });
    }
  }
  return log;
}
const ballCases = [], ballPlan = [];
for (const [v, plays] of [['7:0x0f', 1], ['7:0x15', 2]]){
  const log = runBalls(v, plays);
  const made = log.flatMap(L => L.out.spawned.filter(x => x.shell === 'shell00' && x.modeIndex === 0).map(x => ({ x, fr: L.fr })));
  ballPlan.push({ v, log, made });
  for (const { x } of made)
    ballCases.push({ name: v + '_' + x.id, mode: 0, yaw: x.k.yDeg, ownerPos: B00.pos, ownerWords: [0, B00.y, 0], target: B00.target, joint: J1,
                     sh: { ints: SH00.modes[0].sh.ints, floats: SH00.modes[0].sh.floats, vecs: SH00.modes[0].sh.vecs, ef: SH00.modes[0].ef, hit: SH00.modes[0].hit } });
}
// the children, from what the module made (their request is compared against the ROM's create below)
for (const { v, log } of ballPlan){
  const kids = log.flatMap(L => L.out.spawned.filter(x => x.shell === 'shell00' && x.modeIndex === 1));
  for (const x of kids)
    ballCases.push({ name: v + '_child_' + x.id, mode: 1, yaw: 0, ownerPos: B00.pos, ownerWords: [0, B00.y, 0], target: B00.target, joint: J1,
                     reqPos: x.launchReq.pos, reqWords: x.launchReq.words, frames: 400,
                     sh: { ints: SH00.modes[1].sh.ints, floats: SH00.modes[1].sh.floats, vecs: SH00.modes[1].sh.vecs, ef: SH00.modes[1].ef, hit: SH00.modes[1].hit } });
}
writeFileSync(join(dir, 'balls.json'), JSON.stringify(ballCases));
const py00 = spawnSync('python', [EMU00, join(dir, 'balls.json'), join(dir, 'ballsrom.json')], { encoding: 'utf8' });
if (py00.status !== 0){ console.log(py00.stdout, py00.stderr); process.exit(1); }
const BROM = JSON.parse(readFileSync(join(dir, 'ballsrom.json'), 'utf8'));
for (const { v, log, made } of ballPlan){
  const want = v === '7:0x0f' ? '8' : '12,44,78,44';
  ok(made.map(m => m.fr).join() === (v === '7:0x0f' ? '8' : '13,45,79,45'), v + ': the balls on their rows (kind 1 crossing f8 / kind 5 the clock crossing ' + want + ')',
     made.map(m => 'f' + m.fr + ' sel ' + m.x.selector + ' yaw ' + m.x.k.yDeg).join(', '));
  const all = log.flatMap(L => L.snap.map(s => Object.assign({ fr: L.fr }, s)));
  for (const { x } of made.concat(log.flatMap(L => L.out.spawned.filter(y => y.shell === 'shell00' && y.modeIndex === 1).map(y => ({ x: y }))))){
    const name = x.modeIndex === 0 ? v + '_' + x.id : v + '_child_' + x.id;
    const R = BROM[name].slice(1), mine = all.filter(s => s.id === x.id);
    let bad = null, n = 0;
    for (const a of mine){
      const b = R[n++];
      if (!b){ bad = 'the ROM ran out at move ' + n; break; }
      const st = a.state === 0xfe ? 254 : a.state;
      if (st !== b.state){ bad = 'move ' + n + ': state ' + st + ' / ROM ' + b.state; break; }
      if (!eq(a.pos, b.pos)){ bad = 'move ' + n + ': position ' + a.pos + ' / ROM ' + b.pos; break; }
      if (!eq(a.words, b.words)){ bad = 'move ' + n + ': words ' + a.words + ' / ROM ' + b.words; break; }
      if (a.state === 1 && !eq(a.vel, b.vel)){ bad = 'move ' + n + ': velocity ' + a.vel + ' / ROM ' + b.vel; break; }
      if (a.state === 1 && x.modeIndex === 0 && !eq([a.split], [b.split])){ bad = 'move ' + n + ': split ' + a.split + ' / ROM ' + b.split; break; }
      if (b.creates.length){
        const kid = all.find(s => s.creator === x.id);
        const req = kid && log.flatMap(L => L.out.spawned).find(y => y.id === kid.id).launchReq;
        if (!req || !eq(req.pos, b.creates[0].pos) || !eq(req.words, b.creates[0].words)){ bad = 'move ' + n + ': the split request ' + JSON.stringify(req) + ' / ROM ' + JSON.stringify(b.creates[0]); break; }
      }
      if (a.state !== 1) break;
    }
    ok(!bad && n > 0 && mine[mine.length - 1].state !== 1, name + ': every move bit for bit, to its ' + (x.modeIndex === 0 ? 'split' : 'landing'),
       bad || (n + ' moves, ends at ' + mine[mine.length - 1].pos.map(q => q.toFixed(1)).join(', ')));
  }
}
