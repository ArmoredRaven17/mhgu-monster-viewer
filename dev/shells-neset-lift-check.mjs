// Ahtal-Neset's lifts (render/shells.js act087 (1, 0x15) / (1, 8): Ahtal-Ka's shell57 b6, k 0 / k 1) on the ACTION clock
// (shells lane, 2026-10-26; rom-map trap 162; dev/em088-em087-combined-spec.md 3). The ROM's (1, 0x15) 0x10b029c makes k 0 on its
// first move and k 1 after tune 0x36 (40) more; its (1, 8) 0x10afc44 makes k 1 on its first move -- action frames, while the combined
// list's (1, 0x15) piece enters L0 M9 at 230.0 (rate 0.6) and its (1, 8) piece holds L0 M9 at 0 (rate 0). stepShells alone, a stand-in
// pose; the step each lift is made, counted from the piece's start.
//
//   node dev/shells-neset-lift-check.mjs
//
// Exit code 1 when anything fails.
import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const f = Math.fround;
let pass = 0, fail = 0;
const ok = (c, msg, detail = '') => { if (c) pass++; else fail++; console.log((c ? 'PASS ' : 'FAIL ') + msg + (detail ? '  -- ' + detail : '')); };
const mat = t => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, t[0], t[1], t[2], 1].map(f);
const J = gid => mat([0, 400, 0]);
// steps: [{ list, clip, frame, variant }] one per 1/60 s step; returns 'step:k' for each shell57 the lifts make (mode 0x18 + k)
function run(steps){
  const st = S.createShellState('em087_00'), ev = [];
  steps.forEach((q, i) => {
    const out = S.stepShells(st, { monId: 'em087_00', list: q.list, clip: q.clip, frame: q.frame, joints: J,
      rock: { variant: q.variant, floorY: 0.0 }, owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 }, ground: 0.0, size: [1.0, 1.0],
      baseScale: 1.0, hitLife: true, rank: 5 });
    for (const sh of out.spawned) if (sh.shell === 'shell57' || (sh.modeIndex >= 0x18 && sh.modeIndex <= 0x19)) ev.push(i + ':' + (sh.modeIndex - 0x18));
  });
  return ev.join(' ');
}
const seq = (n, fn) => Array.from({ length: n }, (_, i) => fn(i));
// 1. his own L0 M9 entry: the clip from 0 at rate 1 -- the action clock is the clip's frame, the lifts at frames 1 / 41 as before
const own15 = run(seq(80, i => ({ list: '0', clip: 'Motion[9]', frame: i, variant: '1:0x15' })));
ok(own15 === '1:0 41:1', "his own entry (1, 0x15): k 0 / k 1 on action updates 1 / 41 (the clip rows made them one step later: 2 / 42)", own15);
const own08 = run(seq(40, i => ({ list: '0', clip: 'Motion[9]', frame: i, variant: '1:0x08' })));
ok(own08 === '1:1', 'his own entry (1, 8): k 1 on update 1 (was 2)', own08);
// 2. the combined (1, 0x15) piece: the rise (1, 0x14, no rows) to 230, held, then (1, 0x15) on the same clip from 230 at rate 0.6
const rise = seq(60, i => ({ list: '0', clip: 'Motion[9]', frame: Math.min(230, 170 + i), variant: '1:0x14' }));
const piece15 = seq(80, i => ({ list: '0', clip: 'Motion[9]', frame: f(230 + 0.6 * i), variant: '1:0x15' }));
const c15 = run(rise.concat(piece15));
ok(c15 === (60 + 1) + ':0 ' + (60 + 41) + ':1', 'combined (1, 0x15) entering L0 M9 at 230: k 0 / k 1 at action frames 1 / 41', c15);
// 3. the combined (1, 8) piece: L0 M9 held at 0 for the lift wait (112), then on
const piece08 = seq(112, () => ({ list: '0', clip: 'Motion[9]', frame: 0, variant: '1:0x08' })).concat(seq(40, i => ({ list: '0', clip: 'Motion[9]', frame: i + 1, variant: '1:0x08' })));
const c08 = run(seq(5, () => ({ list: '3', clip: 'Motion[12]', frame: 300, variant: null })).concat(piece08));
ok(c08 === (5 + 1) + ':1', 'combined (1, 8) holding L0 M9 at 0: k 1 on its first move, not after the wait', c08);
// 4. an action change with no clip change resets the clock once: a second (1, 0x15) piece is not made by the first piece's clock
ok(run(rise.concat(piece15, seq(10, i => ({ list: '0', clip: 'Motion[9]', frame: f(278 + i), variant: '1:0x15' })))) === c15,
   'one (1, 0x15) piece: no second pair while its row stays the same');
// 5. the (1, 8) wait: the lift made on update 1 moves 110 times in states 1 / 2 (59 + 51: delay 60.0, behaviour 6's 50.0) -- the hold ends
// on the update after it leaves them, update 111 (the combined lane's read: dev/em088-em087-combined-spec.md 4)
{
  const st = S.createShellState('em087_00'); let made = null, live = 0, gone = null;
  for (let i = 0; i < 200; i++){
    const out = S.stepShells(st, { monId: 'em087_00', list: '0', clip: 'Motion[9]', frame: 0, joints: J, rock: { variant: '1:0x08', floorY: 0.0 },
      owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 }, ground: 0.0, size: [1.0, 1.0], baseScale: 1.0, hitLife: true, rank: 5 });
    for (const sh of out.spawned) if (sh.modeIndex === 0x19 && made == null) made = { i, S: sh };
    if (made && made.S.state >= 1 && made.S.state <= 2 && gone == null) live++;
    if (made && !(made.S.state >= 1 && made.S.state <= 2) && gone == null) gone = i;
  }
  ok(made && made.i === 1 && live === 110 && gone === 111, '(1, 8): made on update 1, 110 moves in states 1 / 2, out of them on update 111 (the 111 wait)',
     JSON.stringify({ made: made && made.i, live, gone }));
}
console.log(`${pass} pass, ${fail} fail`);
process.exitCode = fail ? 1 : 0;
