// rkcmp.mjs <rom out.json> [cases.json]: shells.js's rockets (input.fire087 = [k]) against the ROM runs of rkrun.py, move by move:
// state, position, words; and every start (key, point)
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const R = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const C = JSON.parse(readFileSync(process.argv[3] || 'rk9.json', 'utf8'));
const f = Math.fround, eq = (a, b) => f(a) === f(b) || (a !== a && b !== b);
let pass = 0, fail = 0;
for (const c of C){
  const rom = R[c.name]; if (!rom || rom.fault){ console.log('ROM FAULT', c.name, rom && rom.fault); fail++; continue; }
  const k = c.steps[0].args[0];
  const st = S.createShellState('em087_00');
  const J = () => c.joints['0'];
  const snaps = [], starts = [];
  let made = null;
  for (let i = 0; i < (c.frames || 700) + 5; i++){
    const out = S.stepShells(st, { monId: 'em087_00', list: '2', clip: 'Motion[3]', frame: i, joints: J,
      rock: { variant: null, target: { x: c.target[0], y: c.target[1], z: c.target[2] }, floorY: 0 },
      owner: { x: c.owner[0], y: c.owner[1], z: c.owner[2] }, ownerPos: { x: c.ownerPos[0], y: c.ownerPos[1], z: c.ownerPos[2] },
      ground: 0, size: [1, 1], baseScale: 1, hitLife: false, rank: 5, questLevel: 10, fire087: i === 0 ? [k] : [],
      patrol087: !!c.patrol, anchor087: false });
    for (const sh of out.spawned) if (sh.base === 'base59') made = sh;
    for (const s of out.started) if (s.shell === made) starts.push([s.start.key, s.start.requester.position.slice()]);
    if (made && (!snaps.length || snaps[snaps.length - 1].moves !== made.moves))
      snaps.push({ moves: made.moves, state: made.state, pos: made.position.slice(), ang: made.angles.slice() });
  }
  const run = rom.shells[0] && rom.shells[0].run;
  let why = null;
  if (!run || !made) why = 'no shell: ROM ' + !!run + ' JS ' + !!made;
  else {
    const sp = run.spawn;
    if (!sp.pos.every((v, i) => eq(v, made.launchPos ? made.launchPos[i] : v))) {}
    for (const fr of run.frames){
      const s = snaps.find(x => x.moves === fr.k);
      if (!s){ if (fr.state >= 0xfe) break; why = 'no JS move ' + fr.k; break; }
      if (s.state !== fr.state){ why = 'move ' + fr.k + ' state ' + s.state + ' vs ROM ' + fr.state; break; }
      if (!s.pos.every((v, i) => eq(v, fr.pos[i]))){ why = 'move ' + fr.k + ' pos ' + JSON.stringify(s.pos) + ' vs ROM ' + JSON.stringify(fr.pos); break; }
      if (!s.ang.every((v, i) => (v & 0xffff) === (fr.ang[i] & 0xffff))){ why = 'move ' + fr.k + ' words ' + JSON.stringify(s.ang) + ' vs ROM ' + JSON.stringify(fr.ang); break; }
    }
    if (!why){
      const rs = run.log.concat(...run.frames.map(x => x.log)).filter(e => e[0] === 'start');
      if (rs.length !== starts.length) why = 'starts ' + JSON.stringify(starts.map(x => x[0])) + ' vs ROM ' + JSON.stringify(rs.map(e => e[2]));
      else for (let i = 0; i < rs.length; i++){
        if (rs[i][2] !== starts[i][0]){ why = 'start ' + i + ' key ' + starts[i][0] + ' vs ' + rs[i][2]; break; }
        if (!rs[i][3].every((v, j) => eq(v, starts[i][1][j]))){ why = 'start ' + i + ' point ' + JSON.stringify(starts[i][1]) + ' vs ' + JSON.stringify(rs[i][3]); break; }
      }
    }
  }
  if (why){ fail++; console.log('FAIL', c.name, why); } else { pass++; console.log('PASS', c.name, run.frames.length, 'moves,', starts.length, 'starts'); }
}
console.log(pass, 'passed', fail, 'failed');
