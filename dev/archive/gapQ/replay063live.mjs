// replay063.mjs -- node replay of the em063 SHELL_DATA draft on a PATCHED COPY of render/shells.js (gapQ/patched; built by apply063.py):
// the pools, the explosions, the slime lines and Raging's eruption, each shell's spawn and every record it starts / stops, per step.
//   python apply063.py && node replay063.mjs [case ...]
// No viewer, no browser, no recorder: stepShells alone, on a stand-in pose (fixed joint matrices) over a flat floor at y = 0.
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const S = await import(pathToFileURL(process.env.SHELLS || 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const f = Math.fround;
// the stand-in pose: identity rotations, the fists (40 left, 50 right) 120 above the floor ahead of him, head 3, tail 143
const T = { 0: [0, 300, 0], 3: [0, 420, 380], 40: [160, 120, 300], 50: [-160, 120, 300], 143: [0, 250, -700] };
const mat = t => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, t[0], t[1], t[2], 1].map(f);
const J = gid => mat(T[gid] || T[0]);
const OWN = { x: 0, y: 0x4000, z: 0 };           // facing +x (yaw word 0x4000)
function run(name, mon, plays, x = {}){
  const st = S.createShellState(mon);
  const log = [], seen = new Map();
  let step = 0;
  const steps = [];
  for (const q of plays){ for (let i = 0; i <= q.len; i++) steps.push({ q, frame: i }); }
  const last = steps[steps.length - 1];
  for (let i = 0; i < (x.hold || 400); i++) steps.push({ q: last.q, frame: last.q.len, hold: true });
  for (const { q, frame, hold } of steps){
    const er = x.erupt && (x.erupt.at === step || (x.erupt.also && x.erupt.also.includes(step))) ? { slots: x.erupt.slots, seq: x.erupt.seq } : null;
    const out = S.stepShells(st, { monId: mon, list: q.list, clip: q.clip, frame, joints: J,
      rock: { variant: q.variant, floorY: 0.0 }, owner: OWN, ownerPos: { x: 0, y: 0, z: 0 }, ground: 0.0, size: [1.0, 1.0], baseScale: 1.0,
      hitLife: true, rank: 5, rage: !!x.rage, arm063: x.arm063, slime063: x.slime063, breaks063: x.breaks063, tailSevered: !!x.severed,
      erupt063: er });
    for (const sh of out.spawned){
      const starts = sh.base === 'base35' ? (sh.start ? [sh.start] : []) : (sh.starts || []);
      seen.set(sh.id, { born: step, shell: sh.shell });
      log.push(`  step ${String(step).padStart(4)} ${q.clip}${hold ? ' (held)' : ''} f${frame}: + ${sh.shell} ${sh.globalId.toString(16)} mode ${sh.modeIndex}` +
        `${sh.creator ? ' (by #' + sh.creator + ')' : ''} #${sh.id} at (${sh.position.map(v => v.toFixed(1)).join(', ')})` +
        ` words (${sh.angles.map(w => '0x' + (w & 0xffff).toString(16)).join(', ')})` +
        (starts.length ? ' starts ' + starts.map(r => r.pel + ':' + r.key).join(' ') : ' starts nothing') +
        (sh.slots && sh.slots.length ? ` hit slot (${sh.slots[0].delay}, ${sh.slots[0].duration})` : '') + (sh.timer ? ` timer ${sh.timer}` : ''));
    }
    for (const sh of out.ended){
      const evs = (sh.events || []).filter(e => e.ev === 'stop');
      log.push(`  step ${String(step).padStart(4)}: - ${sh.shell} mode ${sh.modeIndex} #${sh.id} ends (lived ${step - seen.get(sh.id).born})` +
        (evs.length ? ' stops ' + evs.map(e => e.key + ' flag ' + e.flag).join(' ') : ''));
    }
    for (const r of out.refused) log.push(`  step ${String(step).padStart(4)}: REFUSED ${JSON.stringify(r)}`);
    step++;
  }
  console.log(`== ${name} (${mon})`);
  console.log(log.length ? log.join('\n') : '  (nothing)');
}
const P = (list, clip, len, variant) => ({ list, clip, len, variant });
const CASES = {
  punch_calm: () => run('L2 M28 (7, 3) calm: a pool at f72, its explosion 300 later', 'em063_00', [P('2', 'Motion[28]', 120)]),
  punch_depleted: () => run('L2 M28 (7, 3), left arm Depleted: nothing', 'em063_00', [P('2', 'Motion[28]', 120)], { arm063: [0, 2], hold: 10 }),
  side_enraged: () => run('L2 M11 (7, 0x1a) enraged: the explosion at once (sp_01 3, u 50)', 'em063_00', [P('2', 'Motion[11]', 60)], { rage: true, hold: 40 }),
  slam_calm: () => run('L2 M3 (7, 0x13) calm: two pools at 8', 'em063_00', [P('2', 'Motion[3]', 80, '7:0x13')], { hold: 320 }),
  slam_enraged: () => run('L2 M3 (7, 0x13) enraged: both fists sp_01 4 (u 40) at 34', 'em063_00', [P('2', 'Motion[3]', 80, '7:0x13')], { rage: true, hold: 40 }),
  slam_one: () => run('L2 M3 (7, 0xb2) enraged, right arm Depleted: the left alone, sp_01 5 (u 41) at 30', 'em063_00', [P('2', 'Motion[3]', 80, '7:0xb2')], { rage: true, arm063: [2, 0], hold: 40 }),
  line: () => run('L2 M42 (7, 8): the slime line sp_11 1 -> eight sp_01 1 (u 30)', 'em063_00', [P('2', 'Motion[42]', 200, '7:0x08')], { hold: 80 }),
  scatter: () => run('L2 M41 (7, 9): sp_11 0 -> twelve sp_01 0 (u 31) scattered', 'em063_00', [P('2', 'Motion[41]', 260, '7:0x09')], { hold: 100 }),
  big: () => run('L2 M42 (7, 0x15): the big pool sp_35 1 (u 10) 550 ahead, sp_01 7 (u 11) 300 later', 'em063_00', [P('2', 'Motion[42]', 200, '7:0x15')], { hold: 320 }),
  m22: () => run('L2 M22 (the frame handler): three fists at 114 / 152 / 180', 'em063_00', [P('2', 'Motion[22]', 200)], { hold: 320 }),
  walk: () => run('L0 M62 (3, 4): three fists at 9 / 29 / 58', 'em063_00', [P('0', 'Motion[62]', 80)], { hold: 10, rage: true }),
  raging_yellow: () => run('Raging, Red Slime off: L2 M28 -> pool sp_35 0 (u 100), 150 later sp_01 6 (u 1)', 'em063_05', [P('2', 'Motion[28]', 120)], { hold: 200 }),
  raging_red: () => run('Raging, Red Slime on: L2 M28 -> sp_01 14 (u 50) at once', 'em063_05', [P('2', 'Motion[28]', 120)], { rage: true, hold: 40 }),
  raging_spent: () => run('Raging, Red Slime on, left arm erupted (Yellow): L2 M28 -> pool sp_35 4 (u 110), then sp_01 21 (u 111)', 'em063_05',
    [P('2', 'Motion[28]', 120)], { rage: true, slime063: [0, 2, 2, 2], hold: 200 }),
  raging_slam: () => run('Raging, Red Slime on: L2 M3 (7, 0x13) -> both sp_01 17 (u 130) at 34', 'em063_05', [P('2', 'Motion[3]', 80, '7:0x13')], { rage: true, hold: 40 }),
  erupt: () => run('Raging, Red Slime on: the four eruptions (fuse out at step 5): sp_01 0x1a / 0x1c / 0x18 / 0x1e at joints 40 / 50 / 3 / 143', 'em063_05',
    [P('0', 'Motion[0]', 1)], { rage: true, erupt: { at: 5, slots: [0, 1, 2, 3] }, hold: 40 }),
  erupt_broken: () => run('Raging, calm Red slots, head broken (2) and tail severed: the eruptions 0x19 / 0x1b / 0x1f / 0x25', 'em063_05',
    [P('0', 'Motion[0]', 1)], { slime063: [2, 2, 2, 2], breaks063: { 0: 2 }, severed: true, erupt: { at: 5, slots: [0, 1, 2, 3] }, hold: 40 }),
};
// the timer's real input: the slot's state already Yellow on its burn-out step (motion-states.js slime063 t.lv), the same seq on two
// steps (one viewer frame stepping two game frames) -- one explosion
CASES.erupt_timer = () => run('Raging, the timer as index.html passes it: left arm burns out (slime063 already 0 there), seq 7 on steps 5 and 6: one 0x1a', 'em063_05',
    [P('0', 'Motion[0]', 1)], { rage: true, slime063: [0, 2, 2, 2], erupt: { at: 5, also: [6], slots: [0], seq: 7 }, hold: 40 });
const want = process.argv.slice(2);
for (const [k, fn] of Object.entries(CASES)) if (!want.length || want.includes(k)) fn();
if (process.argv[2] === 'h2'){
  run('Raging rage, left Yellow: L2 M3 (7, 0x13)', 'em063_05', [P('2', 'Motion[3]', 80, '7:0x13')], { rage: true, slime063: [0, 2, 2, 2], hold: 200 });
  run('Raging rage, left Yellow: L2 M3 (7, 0xb2)', 'em063_05', [P('2', 'Motion[3]', 80, '7:0xb2')], { rage: true, slime063: [0, 2, 2, 2], hold: 200 });
  run('Raging rage, right Yellow: L2 M3 (7, 0xb2)', 'em063_05', [P('2', 'Motion[3]', 80, '7:0xb2')], { rage: true, slime063: [2, 0, 2, 2], hold: 200 });
}
