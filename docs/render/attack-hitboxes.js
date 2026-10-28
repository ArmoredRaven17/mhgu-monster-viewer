// attack-hitboxes.js -- THE MONSTER'S ATTACK SHAPES, as the ROM arms and sizes them (effects lane, 2026-10-22; Raven: "can you look into
// Monster Attack Hit Capsules? ... I want to see what hits a hunter or not", "we will want these to be toggled on/off as well like Hit
// Capsules"). Drawn exactly as the hit-zone capsules are -- render/monster.js zoneCapsules, the same shapes (0 sphere, 1 a capsule on
// one joint, 2 a capsule between two), the same two-pass material -- one group per armed record, coloured by what it can hit.
// dev/attack-hitshapes.md.
//
// THE DATA (docs/attack-hitshapes.json, exporter <archive>/zg/attexport.py):
//   records[id] = [start, duration, kind, set, flagsWord, power, u16 +8, byte +0xa, byte +0xb, status +0x10, status +0x14, value +0x18]
//     -- enemy\hit_data\<id>_attackdata.hde, 0x20-byte records (0x7db70 copies one): s16 +0 the start frame, s16 +2 the duration,
//     byte +6 the kind, u32 +0xc the flags word, byte +0x19 the hit-size set; the rest as describeRecord below
//   sets[n] = [[j0, j1, code, flags, r, o0x, o0y, o0z, o1x, o1y, o1z], ...] -- <id>_hitsize.hts, the enemy's joint shapes (0x16ddd0):
//     code 0 a sphere at joint j0 + off0 (0x16e80c), 1 a capsule j0 + off0 -> j0 + off1, 2 a capsule j0 + off0 -> j1 + off1
//     (0x16ded0..0x16dffc); codes 4 / 6 the third type, a flat-ended cylinder (render/hit-type3.js); j0 255 the unit itself (the
//     model root)
//   ids >= 1000 index the SECOND table (0x70f40 / 0x70fa0: [unit+0x75d8] / [+0x75e0]) -- records2 / sets2, a deviant's own file
//   arms['<list>|Motion[N]'] = [[slot, id, flags, gate, action, shift?, lead?, lap?], ...] -- the action census (<archive>/zg/attrace.py) and the
//     per-frame census (<archive>/fb/pfarm.py: action 'pf+<vtable slot>'); shift (optional): a CARRIED arm, made in an earlier motion
//     of the action and still counting down here, with the frames already run; lead: the blend frames the delay adds; lap (windowOf)
// THE WINDOW (0x7db70 0x7dc70..0x7dd18): start < 1 -> from the arm for `duration`; else max(start, the arm) .. start + duration, in the
// motion's frames. THE TARGET MASK (0x7dd44..0x7ddb0): 0x17; flag 0x40 -> 0x10, 0x100 -> 2, 0x200 -> 5, 0x4000 -> 8; | flag 0x80 -> 0x20,
// record +0xc bit 0x100000 -> 0x20, flag 0x1000 or record bit 0x80000 -> 8. Bit 0 = the hunters (the pair pass 0x16acf0), bit 1 = monsters.
import * as THREE from 'three';
import { zoneCapsules } from './monster.js';
import { type3VsHunter } from './hit-type3.js';

let DATA = null, loading = null;
export function loadAttackData(base = ''){
  if (DATA) return Promise.resolve(DATA);
  if (!loading) loading = fetch(base + 'attack-hitshapes.json').then(r => r.json()).then(d => (DATA = d)).catch(() => (DATA = {}));
  return loading;
}
export function attackDataFor(monId){ return DATA && DATA[monId] || null; }
export function hasAttackData(monId){ const D = attackDataFor(monId); return !!(D && D.arms && Object.keys(D.arms).length); }

export function targetMask(flags, recFlags){
  let m = 0x17;
  if (flags & 0x40) m = 0x10;
  if (flags & 0x100) m = 2;
  if (flags & 0x200) m = 5;
  if (flags & 0x4000) m = 8;
  m |= (flags >>> 2) & 0x20;
  m |= (recFlags >>> 15) & 0x20;
  m |= (recFlags & 0x80000) ? 8 : ((flags >>> 9) & 8);
  return m;
}
// THE WINDOW, in the motion's frames (READ, 0x7db70 0x7dc70..0x7dd18 with the hit countdown 0x168d44..):
//   arm flag 0x800, or record start < 1: the delay is -start (0 with 0x800) from the arm, for the duration;
//   else the delay is start + g - the motion's frame, g the blend gate e+0x4f4 (0x951678 sets it to the setMotion blend, 0x94ed14..
//   counts it down by the tick; 0 when the setMotion flags have bit 0) -- and the frame ADVANCES through the blend (0x94eee8..0x94ef08),
//   so a record armed t frames into a motion set with blend b goes live at frame start + max(0, b - t): `lead` (exporter row field 7,
//   <archive>/atkfix/leadcases.py); a delay below 0 starts it at the arm with the duration shortened, none left arms nothing.
// shift: a CARRIED arm (row field 6). Flags bit 0 set: not locked to its motion (0x7ddb8 skips 0x169258; the countdown kills only a
//   locked hit on a motion change), so its window runs on into the motions its action plays next -- the exporter
//   (<archive>/atkfix/carrysim.py: the action main stepped tick by tick) credits it there with the frames run before as the shift, and
//   `lap` (row field 8) the pass of that clip it falls on (a motion the action plays again); update() shows a carried row on that lap only
export function windowOf(rec, gate, shift = 0, lead = 0, flags = 0){
  const arm = gate >= 0 ? gate : 0, start = rec[0], dur = rec[1];
  let w = null;
  if (start < 1 || (flags & 0x800)){ const d = (flags & 0x800) ? 0 : -start; w = dur >= 1 ? [arm + d, arm + d + dur] : null; }
  else { const S = start + lead, from = Math.max(S, arm), to = S + dur; w = to > from ? [from, to] : null; }
  if (!w || !shift) return w;
  return w[1] - shift > 0 ? [Math.max(0, w[0] - shift), w[1] - shift] : null;
}
// the clip's armed records: [{ id, slot, rec, mask, win, set, shapes, action }] (or { why } where the record is not exported)
// (action: the play's own '<status>:0x<number>' where the viewer names one -- only that action's arms; else every action's, the union)
export function armedFor(monId, clipKey, action){
  const D = attackDataFor(monId);
  if (!D || !D.arms) return [];
  const out = [];
  let arms = D.arms[clipKey] || [];
  // (the per-frame arms, action 'pf+<slot>', run in every action of their motion: kept)
  if (action && arms.some(a => a[4] === action)) arms = arms.filter(a => a[4] === action || String(a[4]).startsWith('pf'));
  for (const [slot, id, flags, gate, action, shift, lead, lap] of arms){
    const second = id >= 1000, recs = second ? D.records2 : D.records, sets = second ? D.sets2 : D.sets;
    const rec = recs && recs[second ? id - 1000 : id];
    // an id past the table: 0x70f40 returns 0 (0x70f8c: count <= id -> r0 0), so 0x7db70 arms nothing -- e.g. Arzuros / Redhelm
    // under the shared uEm060_00 class: 13 arms with ids 24..34 (Arzuros's file has 24 records, Volvidon's 35)
    if (!rec){ out.push({ id, slot, flags, action, why: second ? 'id >= 1000: no second table for this monster' : 'id past the table: the game arms nothing' }); continue; }
    out.push({ id, slot, flags, action, rec, mask: targetMask(flags, rec[4] >>> 0), win: windowOf(rec, gate, shift || 0, lead || 0, flags), carried: shift || 0, lap: lap || 0, lead: lead || 0, set: rec[3],
               shapes: (sets && sets[rec[3]]) || [] });
  }
  return out;
}
// WHAT A RECORD IS (the hunter's landing `0x175b88`, fed the hit object `0x16877c` fills from the record -- dev/attack-hitshapes.md 9):
//   POWER s16 +4 (H+0x38): the hit's damage, x `0x1690dc(H)`, less the hunter's defence (player `+0x13c4` -> `+0x34a`:
//     d - d x def / (def + k), `0x1760f8..0x176130`), x (100 - the element's resistance) / 100 (`0x1761cc..0x176200`, capped at 50)
//   ELEMENT: the flags word +0xc tested in order 4 / 0x10 / 0x40 / 0x20 / 0x80 -> element 0 / 1 / 2 / 4 / 3, the hunter's resistance
//     0x16 + index (`0x176134..0x1761c8`); none -> 5. The NAMES are INFERRED from which monsters carry each bit (0: Rathalos, Agnaktor,
//     Lavasioth; 1: Royal Ludroth, Mizutsune; 2: Khezu, Kirin, Zinogre; 3: Barioth, Zamtrios, Ukanlos; 4: Fatalis, Deviljho, Gore Magala)
//   STATUS: u32 +0x10 / +0x14 bit sets (H+0x48 / +0x4c), each bit adding byte +0x18 (H+0x50) to its own hunter counter (player
//     +0x321e.., `0x176368..0x176440`). Which status each counter is: NOT READ -- shown as bits
//   KIND byte +6 (H+0x3a -> player +0x3216; 0x41 takes `0x2a6640`, 0x19..0x46 switch at `0x175dac`): its names are not read
export const ELEMENT_NAMES = ['fire', 'water', 'thunder', 'dragon', 'ice'];   // by the flag bit's order 4, 0x10, 0x40, 0x20, 0x80 (INFERRED)
export function elementOf(recFlags){
  const bits = [4, 0x10, 0x40, 0x20, 0x80], idx = [0, 1, 2, 4, 3];
  for (let k = 0; k < 5; k++) if (recFlags & bits[k]) return { index: idx[k], bit: bits[k], name: ELEMENT_NAMES[k] };
  return null;
}
export function describeRecord(a){
  const r = a.rec;
  if (!r) return { id: a.id, why: a.why || 'no record' };
  const el = elementOf(r[4] >>> 0);
  return { id: a.id, slot: a.slot, set: r[3], win: a.win, kind: r[2], power: r.length > 5 ? r[5] : null, element: el,
           status: r.length > 9 && (r[9] || r[10]) ? { a: r[9] >>> 0, b: r[10] >>> 0, value: r[11] } : null,
           hits: [(a.mask & 1) && 'hunters', (a.mask & 2) && 'monsters', (a.mask & 0x14) && 'other targets'].filter(Boolean),
           raw: r.length > 5 ? { u8: r[6], b0a: r[7], b0b: r[8], flags: r[4] >>> 0 } : null, type3: !!a.type3 };
}
export function describeText(a){
  const d = describeRecord(a);
  if (d.why) return 'record ' + d.id + ': ' + d.why;
  const hx = v => '0x' + (v >>> 0).toString(16);
  const lines = ['Attack record ' + d.id + (d.id >= 1000 ? ' (second table)' : '') + ', slot ' + d.slot + ', shape set ' + d.set
                 + (d.win ? ', frames ' + d.win[0] + '-' + d.win[1] : '')];
  lines.push('Power ' + (d.power == null ? '?' : d.power) + ', ' + (d.element ? d.element.name + ' (element ' + d.element.index + ', name inferred)' : 'no element'));
  if (d.status) lines.push('Status bits ' + hx(d.status.a) + (d.status.b ? ' / ' + hx(d.status.b) : '') + ', value ' + d.status.value + ' (status names not read)');
  lines.push('Kind ' + hx(d.kind) + ', hits ' + (d.hits.join(', ') || 'nothing listed'));
  if (d.type3) lines.push('Third shape type: a flat-ended cylinder');
  return lines.join(String.fromCharCode(10));
}
export const ATTACK_COLOURS = { hunter: [1.0, 0.25, 0.2], monster: [1.0, 0.62, 0.15], other: [0.25, 0.7, 1.0], off: [0.6, 0.6, 0.6],
                                touch: [1.0, 1.0, 0.25] };

// THE OVERLAY: one zoneCapsules group per armed record of the playing clip; update() shows / colours them for the frame
export function buildAttackHitboxes(root, monId){
  const group = new THREE.Group(); group.name = 'attack-hitboxes';
  const items = [];
  let clipKey = null, clipAct = null;
  const clear = () => { for (const it of items){ group.remove(it.g); it.g.userData.dispose(); } items.length = 0; };
  const setClip = (key, act) => {
    if (key === clipKey && act === clipAct) return;
    clipKey = key; clipAct = act; clear();
    for (const a of armedFor(monId, key, act)){
      if (!a.shapes || !a.shapes.length) continue;
      // zoneCapsules' record: [slot, part, shape, joint a, joint b, r, a.xyz, b.xyz] -- the hit-size record is the same shape kinds
      // THE THIRD TYPE (hit-size codes 4 / 6): render/hit-type3.js holds the read (build 0x16e89c / 0x16ec78, test 0x167f70 -- a
      // flat-ended cylinder); here as zoneCapsules shape 3: [3, j0, axis (0 the world's Y, code 4 / 1 the joint's Y, code 6), R, o0, o1.x, o1.y]
      const conv = sh => sh[2] === 4 ? [3, sh[0], 0, sh[4], sh[5], sh[6], sh[7], sh[8], sh[9], 0]
                       : sh[2] === 6 ? [3, sh[0], 1, sh[4], sh[5], sh[6], sh[7], sh[8], sh[9], 0]
                       : [sh[2], sh[0], sh[2] === 2 ? sh[1] : sh[0], sh[4], sh[5], sh[6], sh[7], sh[8], sh[9], sh[10]];
      const rows = a.shapes.filter(sh => [0, 1, 2, 4, 6].includes(sh[2]))
                           .map(sh => { const c = conv(sh); return [a.slot, a.id, c[0], c[1], c[2], c[3], c[4], c[5], c[6], c[7], c[8], c[9]]; });
      a.type3 = a.shapes.some(sh => sh[2] === 4 || sh[2] === 6);
      if (!rows.length) continue;
      // j0 / j1 255 is the UNIT (0x16da04's unit arm: its position +0x40 and its angle words, the offsets x its scale): the model root here
      const g = zoneCapsules(root, rows, { color: ATTACK_COLOURS.off, bones: [[255, root]] });
      group.add(g);
      items.push({ a, g, skipped: a.shapes.length - rows.length + (g.userData.skipped | 0) });
    }
  };
  const segDist = (p1, q1, p2, q2) => {                // closest points of two segments (Ericson 5.1.9)
    const d1 = q1.clone().sub(p1), d2 = q2.clone().sub(p2), r = p1.clone().sub(p2);
    const a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r);
    let s, t;
    if (a <= 1e-12 && e <= 1e-12) return p1.distanceTo(p2);
    if (a <= 1e-12){ s = 0; t = Math.min(1, Math.max(0, f / e)); }
    else { const c = d1.dot(r);
      if (e <= 1e-12){ t = 0; s = Math.min(1, Math.max(0, -c / a)); }
      else { const b = d1.dot(d2), den = a * e - b * b;
        s = den !== 0 ? Math.min(1, Math.max(0, (b * f - c * e) / den)) : 0;
        t = (b * s + f) / e;
        if (t < 0){ t = 0; s = Math.min(1, Math.max(0, -c / a)); } else if (t > 1){ t = 1; s = Math.min(1, Math.max(0, (b - c) / a)); } } }
    return p1.clone().add(d1.multiplyScalar(s)).distanceTo(p2.clone().add(d2.multiplyScalar(t)));
  };
  // opts: { mode: 'armed' | 'all', hunter: { p0, p1, r } in view units or null, lap: the playing clip's lap (0 the first) }
  const update = (key, frame, opts = {}) => {
    setClip(key, opts.action || null);
    let armed = 0, touching = 0;
    const rows = [];
    for (const it of items){
      // a CARRIED window (a.carried: armed in an earlier motion, one countdown in the game, 0x168d44..) shows on its own lap only
      const a = it.a, on = !!a.win && frame >= a.win[0] && frame < a.win[1] && !(a.carried && (opts.lap | 0) !== (a.lap | 0));
      const kind = (a.mask & 1) ? 'hunter' : (a.mask & 2) ? 'monster' : 'other';
      let touch = false, shapes = null;
      if (on && opts.hunter && (a.mask & 1)){
        shapes = it.g.userData.readback();
        const A = new THREE.Vector3(), B = new THREE.Vector3();
        for (const sh of shapes){
          A.fromArray(sh.A); B.fromArray(sh.B);
          if (sh.shape === 3){                                   // the third type: its own test (render/hit-type3.js)
            if (type3VsHunter({ p0: sh.A, p1: sh.B, r: sh.r }, { p0: opts.hunter.p0.toArray(), p1: opts.hunter.p1.toArray(), r: opts.hunter.r })){ touch = true; break; }
            continue;
          }
          if (segDist(A, B, opts.hunter.p0, opts.hunter.p1) - (sh.r + opts.hunter.r) <= 0){ touch = true; break; }
        }
      }
      if (on) armed++; if (touch) touching++;
      it.g.userData.setColor(ATTACK_COLOURS[touch ? 'touch' : on ? kind : 'off']);
      it.g.visible = on || opts.mode === 'all';
      rows.push({ id: a.id, slot: a.slot, set: a.set, carried: a.carried || 0, lap: a.lap || 0, lead: a.lead || 0, shapes: a.shapes.map(s => [s[2], s[0], s[1], s[4]]), mask: a.mask, kind, on, touch,
                  win: a.win, action: a.action, skipped: it.skipped, type3: !!a.type3, info: describeRecord(a) });
    }
    group.userData.last = { key, action: opts.action || null, frame, armed, touching, rows };
    return group.userData.last;
  };
  // the shape under a screen point (px in the canvas, its size w x h): the nearest drawn item whose projected axis passes within its
  // projected radius -- { a, text } or null (the hover tooltip in index.html)
  const pick = (px, py, cam, w, h) => {
    let best = null;
    const P = new THREE.Vector3(), Q = new THREE.Vector3(), E = new THREE.Vector3(), right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const scr = v => { const t = v.clone().project(cam); return t.z > 1 ? null : [(t.x + 1) / 2 * w, (1 - t.y) / 2 * h]; };
    for (const it of items){
      if (!it.g.visible) continue;
      for (const sh of it.g.userData.readback()){
        P.fromArray(sh.A); Q.fromArray(sh.B);
        const a = scr(P), b = scr(Q), e = scr(E.copy(P).addScaledVector(right, sh.r));
        if (!a || !b || !e) continue;
        const rpx = Math.hypot(e[0] - a[0], e[1] - a[1]);
        const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
        const t = L > 0 ? Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / L)) : 0;
        const d = Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy);
        if (d <= rpx && (!best || d - rpx < best.score)) best = { a: it.a, score: d - rpx };
      }
    }
    return best ? { a: best.a, text: describeText(best.a) } : null;
  };
  group.userData.pick = pick;
  group.userData.update = update;
  group.userData.dispose = () => clear();
  return group;
}
