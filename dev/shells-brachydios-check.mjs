// Brachydios's (em063_00) and Raging Brachydios's (em063_05) shells in render/shells.js against what the class was read to do
// (dev/em063_00-effects-spec.md 5; dev/rom-map.md "uEm063_00 shells"): the fists' pools sp_35 (0x112 / 0x115, base35: a 300 / 150
// frame timer, then sp_01 6 / 7 / 21 at its spot), the enraged / Red fists' instant sp_01, L2 M3's pair, L2 M41 / M42's sp_11 lines,
// L2 M22's frame-handler fists, and Raging's eruption 0xf46234 (sp_01 23..38 at joints 3 / 40 / 50 / 143) on the slime timer's
// burn-out. stepShells alone, on a stand-in pose (fixed joints) over a flat floor -- not an emulator comparison: the spawn sites,
// modes, timers and keys are the read values (archive gapQ), the positions are the stand-in pose's.
//
//   node dev/shells-brachydios-check.mjs
//
// Exit code 1 when anything fails.
import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const f = Math.fround;
let pass = 0, fail = 0;
const ok = (c, msg, detail = '') => { if (c) pass++; else fail++; console.log((c ? 'PASS ' : 'FAIL ') + msg + (detail ? '  -- ' + detail : '')); };
const T = { 0: [0, 300, 0], 3: [0, 420, 380], 40: [160, 120, 300], 50: [-160, 120, 300], 143: [0, 250, -700] };
const mat = t => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, t[0], t[1], t[2], 1].map(f);
const J = gid => mat(T[gid] || T[0]);
function run(mon, plays, x = {}){
  const st = S.createShellState(mon), ev = [];
  const steps = [];
  for (const q of plays) for (let i = 0; i <= q.len; i++) steps.push({ q, frame: i });
  const last = steps[steps.length - 1];
  for (let i = 0; i < (x.hold || 400); i++) steps.push({ q: last.q, frame: last.q.len });
  steps.forEach(({ q, frame }, step) => {
    const er = x.erupt && (x.erupt.at === step || (x.erupt.also || []).includes(step)) ? { slots: x.erupt.slots, seq: x.erupt.seq } : undefined;
    const out = S.stepShells(st, { monId: mon, list: q.list, clip: q.clip, frame, joints: J, rock: { variant: q.variant, floorY: 0.0 },
      owner: { x: 0, y: 0x4000, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 }, ground: 0.0, size: [1.0, 1.0], baseScale: 1.0, hitLife: true, rank: 5,
      rage: !!x.rage, arm063: x.arm063, slime063: x.slime063, breaks063: x.breaks063, tailSevered: !!x.severed, erupt063: er });
    for (const sh of out.spawned){
      const starts = sh.base === 'base35' ? (sh.start ? [sh.start] : []) : (sh.starts || []);
      ev.push({ step, shell: sh.shell, id: sh.globalId, mode: sh.modeIndex, keys: starts.map(r => r.key), timer: sh.timer, pos: sh.position.slice() });
    }
  });
  return ev;
}
const P = (list, clip, len, variant) => ({ list, clip, len, variant });
const sig = ev => ev.map(e => `${e.step}:${e.shell}/${e.mode}:${e.keys.join('+')}`).join(' ');
const want = (name, ev, exp) => ok(sig(ev) === exp, name, sig(ev) || '(nothing)');

want('L2 M28 (7, 3) calm: a pool sp_35 0 (u 0) at f72, sp_01 6 (u 1) 299 later', run('em063_00', [P('2', 'Motion[28]', 120)]),
     '73:shell35/0:0 372:shell01/6:1');
want('L2 M28 with the left arm Depleted: nothing (the fist gate, arm level 0)', run('em063_00', [P('2', 'Motion[28]', 120)], { arm063: [0, 2], hold: 10 }), '');
want('L2 M11 (7, 0x1a) enraged: sp_01 3 (u 50) at once', run('em063_00', [P('2', 'Motion[11]', 60)], { rage: true, hold: 40 }), '27:shell01/3:50');
want('L2 M3 (7, 0x13) calm: two pools, two explosions', run('em063_00', [P('2', 'Motion[3]', 80, '7:0x13')], { hold: 320 }),
     '9:shell35/0:0 9:shell35/0:0 308:shell01/6:1 308:shell01/6:1');
want('L2 M3 (7, 0x13) enraged: both sp_01 4 (u 40)', run('em063_00', [P('2', 'Motion[3]', 80, '7:0x13')], { rage: true, hold: 40 }),
     '35:shell01/4:40 35:shell01/4:40');
want('L2 M3 (7, 0xb2) enraged, right arm Depleted: the left alone sp_01 5 (u 41)', run('em063_00', [P('2', 'Motion[3]', 80, '7:0xb2')], { rage: true, arm063: [2, 0], hold: 40 }),
     '31:shell01/5:41');
{
  const ev = run('em063_00', [P('2', 'Motion[42]', 200, '7:0x08')], { hold: 80 });
  ok(ev.length === 9 && ev[0].shell === 'shell11' && ev[0].mode === 1 && ev.slice(1).every(e => e.shell === 'shell01' && e.mode === 1 && e.keys[0] === 30),
     'L2 M42 (7, 8): the line sp_11 1 -> eight sp_01 1 (u 30)', sig(ev));
}
{
  const ev = run('em063_00', [P('2', 'Motion[41]', 260, '7:0x09')], { hold: 100 });
  ok(ev.length === 13 && ev[0].shell === 'shell11' && ev[0].mode === 0 && ev.slice(1).every(e => e.shell === 'shell01' && e.mode === 0 && e.keys[0] === 31),
     'L2 M41 (7, 9): sp_11 0 -> twelve sp_01 0 (u 31)', sig(ev));
}
want('L2 M42 (7, 0x15): the big pool sp_35 1 (u 10), sp_01 7 (u 11)', run('em063_00', [P('2', 'Motion[42]', 200, '7:0x15')], { hold: 320 }),
     '91:shell35/1:10 390:shell01/7:11');
want('L2 M22 (the frame handler 0xf3552c): three pools', run('em063_00', [P('2', 'Motion[22]', 200)], { hold: 320 }),
     '115:shell35/0:0 153:shell35/0:0 181:shell35/0:0 414:shell01/6:1 452:shell01/6:1 480:shell01/6:1');
want('L0 M62 (3, 4) enraged: three sp_01 3', run('em063_00', [P('0', 'Motion[62]', 80)], { rage: true, hold: 10 }),
     '10:shell01/3:50 30:shell01/3:50 59:shell01/3:50');
{
  const ev = run('em063_00', [P('2', 'Motion[28]', 120)]);
  ok(ev[0] && ev[0].timer === 299, 'Brachydios\'s pool timer 300 (sp_35 0x112)', String(ev[0] && ev[0].timer));
}
want('Raging, Red Slime off: pool sp_35 0 (u 100), 150 later sp_01 6 (u 1)', run('em063_05', [P('2', 'Motion[28]', 120)], { hold: 200 }),
     '73:shell35/0:100 222:shell01/6:1');
want('Raging, Red Slime on: sp_01 14 (u 50) at once', run('em063_05', [P('2', 'Motion[28]', 120)], { rage: true, hold: 40 }), '73:shell01/14:50');
want('Raging, left arm spent (Yellow): pool sp_35 4 (u 110), then sp_01 21 (u 111)',
     run('em063_05', [P('2', 'Motion[28]', 120)], { rage: true, slime063: [0, 2, 2, 2], hold: 200 }), '73:shell35/4:110 222:shell01/21:111');
want('Raging, Red: L2 M3 (7, 0x13) both sp_01 17 (u 130)', run('em063_05', [P('2', 'Motion[3]', 80, '7:0x13')], { rage: true, hold: 40 }),
     '35:shell01/17:130 35:shell01/17:130');
{
  const ev = run('em063_05', [P('0', 'Motion[0]', 1)], { rage: true, slime063: [2, 2, 2, 2], erupt: { at: 5, slots: [0, 1, 2, 3] }, hold: 40 });
  want('Raging enraged, the four eruptions: modes 0x1a / 0x1c / 0x18 / 0x1e (u 210)', ev, '5:shell01/26:210 5:shell01/28:210 5:shell01/24:210 5:shell01/30:210');
}
want('Raging calm, head broken and tail severed: 0x19 / 0x1b / 0x1f / 0x25',
     run('em063_05', [P('0', 'Motion[0]', 1)], { slime063: [2, 2, 2, 2], breaks063: { 0: 2 }, severed: true, erupt: { at: 5, slots: [0, 1, 2, 3] }, hold: 40 }),
     '5:shell01/25:210 5:shell01/27:210 5:shell01/31:210 5:shell01/37:210');
// the timer's input (motion-states.js slime063, 0xf36100's machine): the raw state, still Red (2) on the burn-out step; the same seq on
// two steps (one viewer frame, several game frames) -- one explosion; a slot not Red at the burn-out (3, to Yellow) -- none (0xf46234)
want('the timer\'s input (Red on its burn-out step, the same seq on two steps): one explosion',
     run('em063_05', [P('0', 'Motion[0]', 1)], { rage: true, slime063: [2, 0, 1, 3], erupt: { at: 5, also: [6], slots: [0], seq: 7 }, hold: 40 }), '5:shell01/26:210');
want('a slot leaving Red (state 3) at the burn-out: no explosion',
     run('em063_05', [P('0', 'Motion[0]', 1)], { rage: true, slime063: [3, 2, 2, 2], erupt: { at: 5, slots: [0], seq: 8 }, hold: 20 }), '');
want('a slot turning Red (state 1) is not Red for the fist: Raging L2 M28 left fist leaves a pool (enraged: sp_35 4, u 110)',
     run('em063_05', [P('2', 'Motion[28]', 120)], { rage: true, slime063: [1, 2, 2, 2], hold: 10 }), '73:shell35/4:110');
// THE LOG (2026-10-25): the timer's eruption log, handed over every step (motion-states.js slime063 t.elog via index.html
// slimeShellInput) -- each id made once, on the first shell step that sees it, whatever the slot reads by then
{
  const runLog = (mon, steps, x) => {
    const st = S.createShellState(mon), ev = [];
    steps.forEach((inp, step) => {
      const out = S.stepShells(st, { monId: mon, list: '0', clip: 'Motion[0]', frame: Math.min(step, 1), joints: J, rock: { floorY: 0.0 },
        owner: { x: 0, y: 0x4000, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 }, ground: 0.0, size: [1.0, 1.0], baseScale: 1.0, hitLife: true, rank: 5,
        rage: true, slime063: inp.sl || [2, 2, 2, 2], erupt063: inp.e });
      for (const sh of out.spawned) ev.push(step + ':' + sh.modeIndex);
    });
    return ev.join(' ');
  };
  const E = (events, now) => ({ slots: [], seq: now, events, now });
  // a burn-out the shells first see two steps late (a viewer frame with no effect step), the slot already turning Yellow (3): made
  ok(runLog('em063_05', [{}, {}, {}, { e: E([{ id: 1, slot: 0, col: 2, n: 3 }], 5), sl: [3, 2, 2, 2] }, { e: E([{ id: 1, slot: 0, col: 2, n: 3 }], 6) }]) === '3:26',
     'the log: a late burn-out is made once, with the state at the burn-out', runLog('em063_05', [{}, {}, {}, { e: E([{ id: 1, slot: 0, col: 2, n: 3 }], 5), sl: [3, 2, 2, 2] }, { e: E([{ id: 1, slot: 0, col: 2, n: 3 }], 6) }]));
  // two burn-outs of different parts handed over in one step, then a third later: three explosions
  const two = [{}, { e: E([{ id: 1, slot: 2, col: 2, n: 1 }, { id: 2, slot: 3, col: 2, n: 1 }], 1) }, { e: E([{ id: 1, slot: 2, col: 2, n: 1 }, { id: 2, slot: 3, col: 2, n: 1 }], 2) },
               { e: E([{ id: 1, slot: 2, col: 2, n: 1 }, { id: 2, slot: 3, col: 2, n: 1 }, { id: 3, slot: 2, col: 2, n: 3 }], 3) }];
  ok(runLog('em063_05', two) === '1:24 1:30 3:24', 'the log: two in one step and the same part again -- three explosions', runLog('em063_05', two));
  // a slot not Red at its burn-out (col 3): none
  ok(runLog('em063_05', [{}, { e: E([{ id: 1, slot: 1, col: 3, n: 1 }], 1) }]) === '', 'the log: col 3 at the burn-out -- no explosion');
  // a fresh shell state (effects re-mounted) does not replay an entry older than 30 timer steps
  ok(runLog('em063_05', [{ e: E([{ id: 7, slot: 0, col: 2, n: 10 }], 60) }, { e: E([{ id: 7, slot: 0, col: 2, n: 10 }, { id: 8, slot: 1, col: 2, n: 61 }], 61) }]) === '1:28',
     'the log: an old entry is not replayed on a fresh state; the next one is made', runLog('em063_05', [{ e: E([{ id: 7, slot: 0, col: 2, n: 10 }], 60) }, { e: E([{ id: 7, slot: 0, col: 2, n: 10 }, { id: 8, slot: 1, col: 2, n: 61 }], 61) }]));
}
want('Brachydios has no eruption', run('em063_00', [P('0', 'Motion[0]', 1)], { rage: true, erupt: { at: 5, slots: [0] }, hold: 10 }), '');
console.log(`${pass} pass, ${fail} fail`);
process.exitCode = fail ? 1 : 0;
