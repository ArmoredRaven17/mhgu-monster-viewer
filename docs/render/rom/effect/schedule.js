// WHEN A MONSTER'S EFFECTS RUN: the requests its own code makes, per the viewer's state.
//
// Each effect in docs/effects/<monster>.json carries `when` (C:\MHGU-Extract\efx\export_effects.py), the
// state in which the monster's code starts it (E:\offline\decode\notes\effects-firing.md):
//   'always'     from the moment the monster is shown
//   'calm'       while NOT enraged -- the inverse of 'rage' (Nakarkos's charge aura, em084_00_060 on joint 0:
//                his code steps it through hadouhou charge stages 1..3 driven by charging actions, gated OFF
//                of the enrage/red state; the viewer ties it to Raven's Calm+Charging rungs, i.e. !rage)
//   'rage'       while enraged (Savage Deviljho's aura and eyes, em043_05_000 keys 30 / 31; Teostra's fire
//                aura, em027_00_011 key 0 -- Teostra's own switch for it is a byte its hook sets and clears,
//                0xe107ac, which the viewer ties to Enraged on Raven's word: "does not turn off with Enraged")
//   'rageStart'  once, as rage turns on (Teostra's burst, em027_00_019 key 2)
//   'rageEnd'    once, as rage turns off (em027_00_019 key 3; Teostra's aura end, em027_00_018 key 1)
//   'event'      when the game event its monster's code requests it on happens -- a part break (Savage's u 1000 / 1001 /
//                900, breaks-em043.md), an ailment (c 1100..1109, states-em043.md 3.4); render/motion-states.js says
//                when (fire)
//   'ragePuff'   a one-shot the shared rage puff requests on its countdown while enraged (Rathian's u 1120 / 1121,
//                states-em001.md 2.3): render/motion-states.js RAGE_PUFF names them and picks which, setRagePuff /
//                stepPuff below count
// An entry without `when` is a 'rage' effect, as the viewer showed every effect before it had the field.
//
// LEAVING THE STATE. An entry with `stop: 'request'` is ended the way its monster's code ends it -- Teostra's
// aura goes out through a stop request (0x329c40(core, 0) at 0xe1108c) and fades over its own frames; the
// core it kept is forgotten there, so the next rage starts a new aura beside the fading one (0xe111d8 has
// nothing to kill). Savage's aura and eyes end the same way: its rage controller (0xe80500, variant 5 only)
// stops both handles with 0x329c40(h, 0) at 0xe805e8 / 0xe8060c when rage ends. Any other 'rage' effect comes
// off at once, which is only right where its monster's code is read to kill it.
//
// A request that has run its course (proof.js finished()) is dropped, and units the passes no longer act
// on come off the list (pruneUnits). Every start builds the request anew -- the heap is a bump allocator, so
// each costs its objects for good; a start allocates once, its frames do not.
//
// The same class runs in the viewer (live.js) and headless (dev/effect-export-rom.mjs), so what the pages
// export and the soak exercise is what the viewer does.
//
// AN ATTACK CLIP'S EFFECTS (`when: 'clip'`) are started and told when to end the way the game's PSL walker does it
// (cMhEffectSequence: update 0x31ca58, frames 0x31cd70). render/monster.js CLIP_EFFECTS holds each motion's
// schedule as the PSL defines it: the slot's frame count and, per bit, the record it fires and the frames it is on.
// index.html hands the playing clip over every frame (setClip); the walk runs once per step, before the unit passes,
// as the walker runs in the monster's update ahead of the effects':
//   * every bit's state word loses its notices (& 0xfff0, 0x31ca7c);
//   * a NEW motion ORs 4 (mNoticeMotionChange) into every word, forgets which bits were on and processes no frame --
//     the frame it starts from is where the next update begins (0x31cb40, 0x31cbe0);
//   * a frame that went BACKWARDS (a loop) ORs 8 (mNoticeFrameBackword) into every word, then processes from the old
//     frame to the slot's end and on from the loop start (0x31cbac, 0x31ccdc);
//   * otherwise the frames crossed since the last update, ceil(prev) .. ceil(cur)-1, at most 32 (0x31cd7c).
// Per processed frame and bit: off->on starts the bit's record (0x31c980 -> the enemy's 0x6ff6c: the SEQUENCE record
// with that effectNo, in c.pel for p1 3 and u.pel for p1 4) and points the new effect's core at the bit's state
// word (core +0x194, 0x31ca14); on->on ORs 1 (0x31ca2c); on->off ORs 2 (0x31ca40, mNoticeSequenceBitOff). Every
// rise starts a new effect, whatever is still running from the last one -- the game does, and a slot that names
// the same record on two bits (Khezu's Motion 3: key 201 on bits 6 and 9) starts it twice.
//   What an effect does with those notices is its own code, lifted: the core's update (0x43168 -> 0x328ea8 ->
// the running state 0x3295fc) reads the word, and the record's END MODE (core +0xca, the pel record's byte +0x3a)
// decides -- modes 1 and 2 stop on bit-off or a motion change, mode 0 ignores bit-off and stops on a motion change,
// a loop or its own end. A stopped effect is NOT taken away: the stop (0x329874, whatever the reason) ends its
// emitters (0x327e7c: gracefully for the record's +0x3b 0, at once for 1) and the core waits in state 2 while it
// runs out, drawn, until its last effect is gone (0x426e0; the ROM's own limit there is 1800 frames). Only then
// is the request finished() and dropped.
import { createShellState, stepShells, SHELL_DATA } from '../../shells.js';
import { CLASS_THREADS } from '../../class-threads.js';

const hex = h => Uint8Array.from(h.match(/../g) || [], b => parseInt(b, 16));

const WALK_BITS = 32;                // cMhEffectSequence +0xc4: one state word per bit of a PSL block
const WALK_FRAMES_MAX = 32;          // 0x31cd7c: at most 32 frames are processed per update

export class EffectSchedule {
  // host: the EffectHost; parent: its parent unit; entries: [{ owner, def }] (def: one of the json's effects)
  constructor(host, parent, entries, rage = false){
    this.host = host;
    this.parent = parent;
    this.rage = !!rage;
    this.starts = 0;
    // the walker's per-bit state words, allocated with the schedule so they sit below the heap mark live.js rewinds to
    this.words = host.malloc(4 * WALK_BITS);
    this.walker = { motion: undefined, last: 0, values: 0, data: null };
    this.clip = null;
    this.entries = entries.map(({ owner, def }) => ({ owner, def, when: def.when || 'rage', requests: [] }));
    this.rageOff = new Set();          // 'pel|key' of rage records held off (holdRage)
    for (const e of this.entries){
      if (!e.def.record){                     // a plain effect: started once and moved every step, as before
        if (e.def.joints.length) host.attach(e.owner, parent);
        host.start(e.owner);
      } else if (e.when === 'always' || (e.when === 'rage' && this.rage) || (e.when === 'calm' && !this.rage)) this.start(e);
    }
  }

  start(e, requester){
    const r = e.def.record;
    e.requests.push(this.host.requestEffect(e.owner, this.parent, { index: r.index, key: r.key, path: r.path, payload: hex(r.payload) },
                                            undefined, requester || null));
    this.starts++;
  }

  setRage(on){
    on = !!on;
    if (on === this.rage) return;
    this.rage = on;
    for (const e of this.entries){
      if (!e.def.record) continue;
      if (e.when === 'rage' || e.when === 'calm'){
        const want = e.when === 'rage' ? on : !on;    // 'calm' runs while not enraged: the inverse of 'rage'
        if (want){ if (!this.rageOff.has(e.def.record.pel + '|' + e.def.record.key)) this.start(e); }
        else if (e.def.stop === 'request'){ for (const q of e.requests) if (!q.stopped) this.host.stopRequest(q); }
        else { for (const q of e.requests) this.host.releaseRequest(q); e.requests.length = 0; }
      } else if (e.when === (on ? 'rageStart' : 'rageEnd')) this.start(e);
    }
  }

  // AN EVENT'S EFFECT: every 'event' record with this pel and key, started now -- a new request each time, as the
  // game's request is (render/motion-states.js decides when). Returns the requests it started.
  // `also`: one more `when` whose entries a class request may start the same way -- a record the export keeps under another
  // trigger only (it dedupes on (pel, key, array)): Gammoth's snow-slot u 1120 is the rage puff's record (effects lane A4, 2026-10-26)
  fire(pel, key, also){
    const out = [];
    for (const e of this.entries)
      if ((e.when === 'event' || (also && e.when === also)) && e.def.record && e.def.record.pel === pel && e.def.record.key === key){
        this.start(e);
        out.push(e.requests[e.requests.length - 1]);
      }
    return out;
  }

  // AN EVENT'S EFFECT AT A POINT -- the cut tail's landing: 0x703b8 requests u 905 with a requester carrying the
  // position G alone (tail-option-em043.md 7). position: game units. Returns the requests it started.
  fireAt(pel, key, position){
    const out = [];
    for (const e of this.entries)
      if (e.when === 'event' && e.def.record && e.def.record.pel === pel && e.def.record.key === key){
        const r = e.def.record;
        const q = this.host.requestEffect(e.owner, this.parent, { index: r.index, key: r.key, path: r.path, payload: hex(r.payload) },
                                          undefined, { position, positionOnly: true });
        e.requests.push(q);
        this.starts++;
        out.push(q);
      }
    return out;
  }

  // A CLASS'S PLACED REQUESTS -- Nakarkos's c 800 (dev/em084-class-effects.md 3, READ 0x106eff4..0x106f214): one request per
  // requester, each a control block the class fills itself (0x40a54; +0xc the area byte, +0xd0 its model's handle vt+0x130,
  // +8 = 3, +0x1c |= 3, +0xc0.. the point (w 0), +0x14 |= 0x40000000 with +0x40.. a scale (w 0) -- proof.js's requester form,
  // whose ctor leaves +4 = 0 as 0x40a54 does). The class keeps the handles and stops them with 0x329c40(h, 0): holdEvent off.
  // requesters: [{ position, scale, flags14, flags1c, type8 }] in game units. Returns the requests it started.
  placeEvent(pel, key, requesters){
    const out = [];
    for (const e of this.entries){
      if (e.when !== 'event' || !e.def.record || e.def.record.pel !== pel || e.def.record.key !== key) continue;
      const r = e.def.record;
      for (const req of requesters){
        const q = this.host.requestEffect(e.owner, this.parent, { index: r.index, key: r.key, path: r.path, payload: hex(r.payload) },
                                          undefined, req);
        e.requests.push(q);
        this.starts++;
        out.push(q);
      }
    }
    return out;
  }

  // AN EVENT'S EFFECT HELD while its state lasts -- Savage's stun: 0xa3ef0 requests c 1103 once, into one handle, and
  // 0x6f124 stops it with 0x329c40(h, 0) when the stun ends. On starts it unless one of its requests runs un-stopped;
  // off stops those (they run out, as a stop request does).
  //   A STOPPED REQUEST IS NOT DRAWN UNTIL IT HAS MOVED (2026-10-18, Fanged agent; dev/em082-effects-spec.md 6). The class code
  // that stops a held handle (0x329c40) runs in the enemy update, ahead of the effects' passes, so the game never draws a request
  // stopped since its last move. The viewer stops from the motion-states driver, outside the step -- and a render with no step
  // (a clip change gives `advance` 0; a paused clip) drew the stopped request unmoved: Soulseer's u 310 left early in L9 M5 sent
  // its GPU batch's flush 0xb978cc in with nothing staged ([sb+0xf8] == 0 -> 0xb97b64), a state the game cannot reach. The stop
  // itself stays immediate (a paused viewer must still stop it: Nibelsnarf's stun chain c 1103); the request is stamped with
  // the step it was stopped in, and effects() leaves it out until a step has moved it.
  // A HELD EVENT'S FADE: the class's per-frame write of unit 0's colour block (host.tintRequestUnit0) on its live requests
  alphaEvent(pel, key, a){
    for (const e of this.entries){
      if (e.when !== 'event' || !e.def.record || e.def.record.pel !== pel || e.def.record.key !== key) continue;
      for (const q of e.requests) if (!q.stopped && q.core) this.host.tintRequestUnit0(q, a);
    }
  }
  // (requester: the class's own block for the request, proof.js -- Teostra's aura u 0 / u 10: +0x14 |= 0x20, root joint +0x52 = 3)
  holdEvent(pel, key, on, requester){
    for (const e of this.entries){
      if (e.when !== 'event' || !e.def.record || e.def.record.pel !== pel || e.def.record.key !== key) continue;
      const live = e.requests.filter(q => !q.stopped);
      if (on){ if (!live.length) this.start(e, requester); }
      else for (const q of live){ this.host.stopRequest(q); q.stoppedAtStep = this.frame || 0; }
    }
  }


  // A RAGE RECORD HELD OFF by its monster's code -- Savage's eyes while asleep: 0xe80500 stops the eyes handle with
  // 0x329c40(h, 0) while 0x81bb0(e, 0) or (e, 1) holds, the aura left running, and requests them again when neither
  // does. Off stops its running requests and keeps setRage from starting it; on lets it run again -- started now if
  // rage is on.
  // AN 'always' RECORD HELD OFF the same way -- Ahtal-Ka's u 120: his vt+0x208 0x10b7644 requests it whenever its handle
  // e+0xd4ac is empty and stops it with 0x329c40(h, 0), clearing the handle, every frame he is on L2 M28 or dying
  // (render/motion-states.js CLASS_HOLD_OFF); on again starts it at once, as the next frame's request does.
  holdRage(pel, key, off){
    const id = pel + '|' + key;
    if (off) this.rageOff.add(id); else this.rageOff.delete(id);
    for (const e of this.entries){
      if (!e.def.record || (e.when !== 'rage' && e.when !== 'always') || e.def.record.pel !== pel || e.def.record.key !== key) continue;
      const live = e.requests.filter(q => !q.stopped);
      if (off){ for (const q of live) this.host.stopRequest(q); }
      else if ((e.when === 'always' || this.rage) && !live.length) this.start(e);
    }
  }

  // THE SHARED RAGE PUFF (0xa41b8; render/motion-states.js RAGE_PUFF): spec { period, records: [id 0, id 1], pick() -> 1
  // for id 0, 0 for id 1 }. The countdown (P+0x5c6c) starts at 0 -- the enemy's reset zeroes it (0xb8b98) -- and is
  // counted in the step, once a 1/60 s, as the +0x28 pass counts it once a frame.
  setRagePuff(spec){ this.puff = spec ? { period: spec.period, records: spec.records, pick: spec.pick, left: 0, paused: false, tired: false } : null; }
  // the gates the motion shows: paused -- the sleep hold or the rest (0x81bb0(e, 1)), where 0xa41b8 returns before its
  // countdowns; tired -- calm and tired, where it zeroes this one (0xa4338..0xa434c). The drool reads the same two.
  puffGates(paused, tired){
    this.gates = { paused: !!paused, tired: !!tired };
    if (this.puff){ this.puff.paused = !!paused; this.puff.tired = !!tired; }
  }

  // THE TIRED DROOL (0xa41b8's calm branch; render/motion-states.js TIRED_DROOL): spec { period, record: [pel, key] }.
  // Over whatever clip runs, as the ROM counts it: enraged, the countdown P+0x5c70 is zeroed (0xa42a4 -> 0xa4348);
  // calm and tired, 0x7206c counts it down and each time it fires it is set to the period again and c id 4 is requested
  // (0xa42d0..0xa4334); calm and not tired, nothing. Zeroed by the reset and while enraged, so tiredness drools at once.
  setTiredDrool(spec){ this.drool = spec ? { period: spec.period, record: spec.record, left: 0 } : null; }
  // THE GORE LINE'S SLOT RING (effects lane, 2026-10-20; READ: 0xfc05ec, 0xfaf318, the ctor 0xfad6cc..0xfad7b4, vt+0x1dc 0xfae96c..
  // 0xfae9cc; dev/rom-map.md "Class requests driven"). Two slots in the control block (C + 0x40k: byte +0 = 0xff free, else the
  // counter it was filled at; +0x10.. the point; +0x2c / +0x30 s0 / s1; +0x38 the u 30 handle), the counter C+0x80 (0..3) and the
  // live count C+0x81 (bytes). ringFill is one call of a fill site: the caller steps the counter (+1, 4 -> 0) and k = counter & 1;
  // 0xfc05ec: a busy slot k is burst first (0xfaf318: stop its handle 0x329c40(h, 0), id 1002 = u 31 at its point with +0x1c |= 3,
  // +8 = 1; byte 0xff; count - 1); flag 0 -> the ground query 0x183664 from the point + 500 down: a hit within 500 below takes its
  // height, none -> no fill (the counter stays stepped); then the slot is filled, and while count <= 1 id 1001 = u 30 is requested at
  // the point (+0x1c |= 3, +8 = 2) and count + 1. Every frame each busy slot's +0x30 counts down 1.0 (0x7206c); at <= 0 it is burst.
  // The ground is the stand-in floor plane (host.stageFloorY, the same answer as 0x18154c's).
  ringFill(pel, { position, s0 = 400, s1 = 240, flag = 1 }){
    const R = this.ring || (this.ring = { pel, counter: 0, count: 0, slots: [{ byte: 0xff }, { byte: 0xff }] });
    R.pel = pel;
    R.counter = (R.counter + 1) & 0xff; if (R.counter >= 4) R.counter = 0;
    const k = R.counter & 1;
    const out = { k, burst: null, filled: false, requested: false };
    const p = position.map(Math.fround);
    if (flag === 0){
      const floor = Math.fround(this.host.stageFloorY || 0), from = Math.fround(p[1] + 500);
      if (!(floor <= from)) return out;                                   // no hit below the ray's start
      if (!(Math.fround(p[1] - floor) <= 500)) return out;                // farther than 500 below: no fill
      p[1] = floor;
    }
    if (R.slots[k].byte !== 0xff) out.burst = this.ringBurst(k);
    R.slots[k] = { byte: R.counter, point: p, s0: Math.fround(s0), life: Math.fround(s1), handle: null };
    out.filled = true;
    if (R.count <= 1){
      const q = this.placeEvent(pel, 30, [{ position: p, flags1c: 3, positionOnly: true, type8: 2 }]);
      R.slots[k].handle = q[0] || null;
      R.count = (R.count + 1) & 0xff;
      out.requested = true;
    }
    return out;
  }
  ringBurst(k){
    const R = this.ring, s = R.slots[k];
    if (s.handle && !s.handle.stopped){ this.host.stopRequest(s.handle, 0); s.handle.stoppedAtStep = this.frame || 0; }
    this.placeEvent(R.pel, 31, [{ position: s.point, flags1c: 3, positionOnly: true, type8: 1 }]);
    R.slots[k] = { byte: 0xff };
    R.count = (R.count - 1) & 0xff;
    return s.point;
  }
  stepRing(){
    const R = this.ring;
    if (!R) return;
    for (const k of [0, 1]){
      const s = R.slots[k];
      if (s.byte === 0xff) continue;
      s.life = Math.fround(s.life - 1);
      if (s.life <= 0) this.ringBurst(k);
    }
  }
  stepDrool(){
    const D = this.drool, G = this.gates || { paused: false, tired: false };
    if (!D || G.paused) return;
    if (this.rage){ D.left = 0; return; }
    if (!G.tired) return;
    let fire;                                                       // 0x7206c, as the puff's
    if (D.left <= 0){ D.left = 0; fire = true; } else { D.left -= 1; fire = D.left <= 0; }
    if (!fire) return;
    D.left = D.period;                                              // 48.0 (0xa42fc..0xa4308)
    this.fire(D.record[0], D.record[1]);                            // vtable +0x1cc, c id 4 (0xa431c..0xa4330)
  }
  stepPuff(){
    const P = this.puff;
    if (!P || P.paused) return;
    if (!this.rage){ if (P.tired) P.left = 0; return; }
    // 0x7206c: spent (at or below 0) -> 0 and fire; else 1 less (0x539d5c), firing when that is at or below 0
    let fire;
    if (P.left <= 0){ P.left = 0; fire = true; } else { P.left -= 1; fire = P.left <= 0; }
    if (!fire) return;
    P.left = P.period;                                              // 30.0 (0xa423c..0xa4248)
    const [pel, key] = P.records[P.pick() === 1 ? 0 : 1];          // vtable +0x2a4: 1 -> u id 0, else u id 1
    for (const e of this.entries)
      if (e.when === 'ragePuff' && e.def.record && e.def.record.pel === pel && e.def.record.key === key) this.start(e);
  }

  // RAGE ENTERED AGAIN while it is shown (a rage-entry motion started over, render/motion-states.js): rage off and on
  // at this step -- the running rage effects end as rage's end ends them, and the entry requests them anew.
  restartRage(){
    if (!this.rage) return this.setRage(true);
    this.setRage(false);
    this.setRage(true);
  }

  // one 1/60 s step: the clip's walker, the unit passes over every request (the shells between the update and the
  // move pass), then the plain effects' moves
  step(){
    this.frame = (this.frame || 0) + 1;
    this.walk();
    this.stepPuff();                  // the +0x28 pass's request, ahead of the effects' own passes
    this.stepDrool();                 // the same handler's other branch (0xa41b8): rage and tiredness exclude each other
    this.stepRing();                  // the Gore line's slot timers (vt+0x1dc 0xfae96c..0xfae9cc), in the enemy update
    // between the passes: the class's own thread pass (its vt+0x208, the enemy's line) ahead of the shells' moves
    this.host.unitFrame(this.shells || this.threads ? () => { if (this.threads) this.stepThreads(); if (this.shells) this.stepShells(); }
                                                    : undefined);
    for (const e of this.entries) if (!e.def.record) this.host.move(e.owner);
    this.host.pruneUnits();
    for (const e of this.entries) if (e.requests.length) e.requests = e.requests.filter(q => !q.finished());
  }

  // The clip playing now, handed over by the viewer every frame: `key` names the motion (a change of it is a new
  // motion), `frame` is its frame at 60 per second, `motion` its CLIP_EFFECTS schedule ({ frames, bits }) or null,
  // `start` the frame the clip starts and loops from (0, or where a _loop clip sits in its motion). The walk reads
  // it once per step. No clip (key null) is a motion too: the one before it is over.
  // `mask`: the enemy's enable word for this motion start (render/psl-mask.js; enemy +0x13f4, which the walker's copy of
  // the block takes as its mask -- 0x31cc88 -> 0x40780 -> 0xca52c), or null for a monster whose word is not read yet:
  // then every listed bit is acted on, as before.
  // `play`: a token that changes when the viewer starts the motion over as ANOTHER action (index.html playNow) -- a new
  // motion start to the walk, as a new setMotion is; null keeps a replay a loop, as before.
  // `loop`: the frame is in the motion's LOOP (a _loop clip, or a Special entry's folded cycle) -- so a loop starting at 0
  // (a motion shipped as a _loop piece alone) still reads as a loop to the shells, not as the action issued again
  setClip(key, frame, motion, start = 0, mask = null, play = null, loop = false){ this.clip = { key, frame, motion: motion || null, start, mask, play, loop: !!loop }; }

  // 0x31ca58, once per step -- see the header
  walk(){
    const m = this.host.m, W = this.walker, c = this.clip;
    for (let i = 0; i < WALK_BITS; i++){ const a = this.words + 4 * i; m.w32(a, m.u32(a) & 0xfff0); }
    if (!c) return;
    const notify = bits => { for (let i = 0; i < WALK_BITS; i++){ const a = this.words + 4 * i; m.w32(a, (m.u32(a) | bits) >>> 0); } };
    const id = c.key == null ? null : (c.play != null ? c.key + '#' + c.play : c.key);
    if (id !== W.motion){
      notify(4);
      W.motion = id; W.data = c.motion; W.values = 0; W.last = c.start;
      return;
    }
    const prev = W.last, cur = c.frame;
    W.last = cur;
    if (cur === prev) return;
    if (cur < prev){
      notify(8);
      if (!W.data) return;
      this.walkFrames(Math.ceil(prev), (W.data.frames - 1) - Math.ceil(prev));
      this.walkFrames(c.start, Math.ceil(cur) - c.start);
    } else if (W.data) this.walkFrames(Math.ceil(prev), Math.ceil(cur) - Math.ceil(prev));
  }
  // 0x31cd70: `count` frames from `f` (wrapping to 0 at the slot's last frame), each bit's edge acted on -- only the bits
  // the enable word has (0x31ce64: `tst [copy+0], 1 << bit`); the values are kept whole, as +0xbc keeps the run's word
  walkFrames(f, count){
    if (count < 1) return;
    const m = this.host.m, W = this.walker, { frames, bits } = W.data;
    const mask = this.clip ? this.clip.mask : null;
    const n = Math.min(count, WALK_FRAMES_MAX);
    for (let k = 0; k < n; k++){
      if (k > 0 && ++f >= frames - 1) f = 0;
      let now = 0;
      for (const b of bits) if (b.on.some(([from, to]) => f >= from && f < to)) now |= 1 << b.bit;
      for (const b of bits){
        if (mask != null && !((mask >>> b.bit) & 1)) continue;
        const was = (W.values >>> b.bit) & 1, is = (now >>> b.bit) & 1, word = this.words + 4 * b.bit;
        if (was && is) m.w32(word, (m.u32(word) | 1) >>> 0);
        else if (was) m.w32(word, (m.u32(word) | 2) >>> 0);
        // `pslRefuse`: the class's PSL start gate refuses every start (Chameleos fully cloaked: vt+0x12c 0xdff12c; index.html)
        else if (is && !this.pslRefuse) for (const q of this.startClip(b.efl, b.key)) m.w32(q.core + 0x194, word);
      }
      W.values = now;
    }
  }

  // Start a clip effect: a new request for the record the PSL names. `key` is the PSL's effectNo, which IS the
  // pel record's key -- one .efl can have many records on different joints and masks (Bloodbath's em007_04_000
  // has seven) and the PSL names exactly which one fires. A 'clip' effect is never auto-started (the constructor
  // only starts 'always'/'rage'/'calm'); the walk is the only way it runs. Returns the requests it started.
  startClip(efl, key){
    const out = [];
    for (const e of this.entries)
      if (e.when === 'clip' && e.def.record && (e.def.efl || '').endsWith(efl) && (key == null || e.def.record.key === key)){
        this.start(e);
        out.push(e.requests[e.requests.length - 1]);
      }
    return out;
  }

  // A STEP BACK TAKES THE CLIP'S EFFECTS OFF. The game never plays a motion backwards, so there is nothing
  // to translate for it: running an effect in reverse would have to be invented, and Raven (2026-09-22) would
  // rather not carry invented work. What a seek can do honestly is clear what the clip started -- the same
  // end a clip change gives them -- and let the walk start them again as the motion plays forward past their
  // frames. Only the CLIP's requests go: a rage aura or an 'always' record is not tied to a frame and keeps
  // running. The walker is re-armed at the frame seeked to, so nothing fires for frames that were skipped.
  clearClipEffects(frame = 0){
    for (const e of this.entries){
      if (e.when !== 'clip' || !e.requests.length) continue;
      for (const q of e.requests){
        if (!q.stopped) this.host.stopRequest(q);     // the core's own stop (0x329c40), as the rage path uses
        this.host.releaseRequest(q);                  // and off the unit passes now: no frames pass while paused
      }
      e.requests.length = 0;
    }
    const W = this.walker;
    W.values = 0;                                     // nothing is on: the walk re-arms every bit from here
    W.last = frame;
  }

  // THE SHELLS (render/shells.js, the Shell Agent's translation of the monster's shell code): a monster whose shells are
  // decoded (SHELL_DATA) gets them stepped here once per step, BETWEEN the unit passes -- the enemy's action spawns a
  // shell in its move (line 4) and the shell's own move (line 18) places its effect, both before the effects' move
  // (line 22) and after every update pass. joints: gid => the game's 16-float joint matrix this step (live.js).
  useShells(monId, joints){
    this.shells = SHELL_DATA[monId] ? { monId, state: createShellState(monId), joints } : null;
  }
  stepShells(){
    const S = this.shells, c = this.clip, m = this.host.m;
    // A SHELL DELETED THE MOVE AFTER ITS END: its parent unit is gone, so every request still hung from it ends through
    // its own handle test (0x328ea8 -> 0x31d028 -> vt+0x9c(core, 1); proof.js handleValid). Applied to base14 alone, the
    // one base whose deletion is read with an effect still running on it (dev/em081-shells-spec.md 5b: the end
    // 0x3f9ef4 stops only +0x1624 and the shell is deleted on the next move -- u 40 is never stopped by the shell).
    for (const p of this.goneNext || []) this.host.parentGone(p);
    this.goneNext = [];
    let list = null, clip = null;
    if (c && c.key){ const k = c.key.split('|'); list = k[1]; clip = k.slice(2).join('|'); }
    // the handle's unit in state 1 or 2 (0x3ff958). A shell spawned this step has not had its request started yet --
    // the ROM starts it in the shell's init, before the shell's first move -- so a pending start counts as alive
    const reqAlive = q => !!(q && (((m.u32(q.core + 0xc) & 7) - 1) >>> 0) < 2);
    const alive = sh => sh.request === undefined ? !!sh.start : reqAlive(sh.request);
    // THE ROCKS (shells-em043.md 9) take three inputs the game gives and the ROM does not read here -- which rock the AI
    // picks, the target its aim reads, the stage it lands on -- so they come from the viewer (rockInput(): { variant,
    // target, floorY } in game units, or null: no rock), with the monster's facing as the u16 the unit keeps.
    const rock = this.rockInput ? this.rockInput() : null;
    // Rathian's shells (shells-em001.md) also read, every step: the owner's position (block +0x40.., game units -- the
    // aimed fireballs' origin and the landing dust's height test) and, a labelled viewer input, the hit-slot life of a
    // timer-0 shell01 (its hit data's delay + duration; shells.js slotStep) -- without it the fire and explosions would
    // end at their first move, as the ROM-run harness shows them
    const P = this.parent && this.parent.position;
    const out = stepShells(S.state, { monId: S.monId, list, clip, frame: c && clip ? c.frame : 0,
                                      loopStart: c && (c.start || c.loop) ? c.start : null, joints: S.joints, rage: this.rage,
                                      rock, owner: rock ? { x: 0, y: this.ownerYaw16(), z: 0 } : undefined,
                                      ownerPos: P ? { x: P[0], y: P[1], z: P[2] } : undefined, hitLife: true,
                                      // the unit's world matrix +0xb0 (0xc156c with -1): a beam's owner matrix
                                      ownerMatrix: this.parent ? this.host.parentWorld(this.parent) : undefined,
                                      // the free-running timer Rathian's hover dust pulses on (vtable +0x1dc 0xcee250: every
                                      // 100 moves since her setup; shared-state-effects.md) -- counted here from the mount,
                                      // a viewer stand-in for its phase
                                      stepCount: this.frame,
                                      // what else the viewer hands a monster's shells (index.html shellExtra: Dreadqueen's
                                      // quest level stand-in and her tail as the parts show it)
                                      ...(this.shellExtra ? this.shellExtra() : {}),
                                      // param 0 is the shell's own effect; a rock's bounce / landing effect is the handle's
                                      effectAlive: (sh, param, h) => param === 0 ? alive(sh) : reqAlive(h && h.request) });
    // a breath shell's effect is placed (0x329c9c / 0x329d04, below); a rock's is bound to the shell, which keeps its own
    // position and angles -- the parent carries both (host.setParentAngles: 0x539cd4 -> 0x8a4dfc)
    // the parent's scale is the shell unit's own +0x60 (host.composeParent) -- the ShellScale its requester carries, unless
    // the shell's class sets its unit's size itself (shells.js unitScale: Ukanlos's beam children, 0x43ab74)
    // (a shell whose init started nothing -- the Gore line's sp_01 2 / 5, ef 0 (999, -1), whose first effect is the 0x20 switch's --
    // has no sh.start: the ShellScale is the starting request's, `st`; shells agent 2026-10-19)
    const scaleOf = (sh, st) => sh.unitScale != null ? sh.unitScale : sh.start ? sh.start.requester.scale[0] : st ? st.requester.scale[0] : sh.scale0;
    const pose = (sh, st) => sh.angles && !sh.place
      ? this.host.setParentAngles(sh.parent, { position: sh.position, angles: sh.angles, scale: scaleOf(sh, st) })
      : this.host.setParentPose(sh.parent, { position: sh.position, quaternion: [0, 0, 0, 1], scale: scaleOf(sh, st) });
    // a tally of what the shells did, for the dev soaks (dev/effect-live-soak.mjs): every shell spawned, and every spawn
    // the module refused with its reason (out.refused -- nothing else reads it; the last 50 kept)
    // a shell's call into its owner's slot ring (the Gore line's sp_00 landing 0xfc2034 / sp_03 end 0xfc3164 -> 0xfc083c: flag 0)
    for (const f of out.ownerFills || []) this.ringFill(f.pel, f);
    const T = this.shellTally || (this.shellTally = { spawned: 0, beams: [], refused: [] });
    T.spawned += out.spawned.length;
    for (const sh of out.spawned) if (sh.base === 'base02g' || sh.base === 'base02')
      T.beams.push(((sh.type && sh.type.id) || (sh.cls + ':' + sh.modeIndex)) + (sh.setupAngles ? '@0x' + (sh.setupAngles[0] & 0xffff).toString(16) : '') +
                   (c ? '#f' + Math.round(c.frame) : ''));
    for (const r of out.refused) T.refused.push(r.why || JSON.stringify(r));
    if (T.beams.length > 50) T.beams.splice(0, T.beams.length - 50);
    if (T.refused.length > 50) T.refused.splice(0, T.refused.length - 50);
    // a spawned shell's init starts its _ef param 0 on itself (0x4a10c8 / 0x4a11e4): the 'shell' record with that key,
    // hung from the shell (a parent with no joints: its model interface) with the requester the ROM fills
    for (const sh of out.spawned){
      if (!sh.start){ sh.request = null; continue; }
      const e = this.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === sh.start.pel && x.def.record.key === sh.start.key);
      if (!e){ sh.request = null; continue; }                   // no such record exported: the effect is not there
      // model: false -- a shell owns NO rModel (its arc folders hold .shl/.sep and no 58a15856), so the
      // placement's +0xf0 test at 0x31f6b4 fails for it and the ROM's own path is the fallback at
      // 0x31f788: the shell's position plus the raw offset. Giving a shell parent a model would move
      // every shell-spawned record, which are correct as they stand.
      sh.parent = this.host.createParent([], { model: false });
      if (sh.position) pose(sh);
      const r = e.def.record;
      sh.request = this.host.requestEffect(e.owner, sh.parent, { index: r.index, key: r.key, path: r.path, payload: hex(r.payload) },
                                           undefined, sh.start.requester);
      e.requests.push(sh.request);
      this.starts++;
    }
    // each moving shell places its effect (0x329c9c / 0x329d04); an ended one stops it gracefully (0x329c40(h, 0))
    for (const sh of out.alive){
      if (sh.parent && sh.position) pose(sh);
      // a shell that writes its handle's draw byte core+0x1c1 itself (Lao-Shan Lung's rubble: 0 while its delay runs, 1 after --
      // shells.js make012s13 / delay012s13; 0x43370 copies it to +0x18c, which 0x327214 turns into its units' +0xc bit 11): written
      // as the shell changes it
      if (sh.shown1c1 != null && sh.request && alive(sh) && sh.wrote1c1 !== sh.shown1c1){ m.w8(sh.request.core + 0x1c1, sh.shown1c1); sh.wrote1c1 = sh.shown1c1; }
      if (sh.place && sh.request && alive(sh)) this.host.placeRequest(sh.request, sh.place.position, sh.place.rotationDeg);
      // a beam's drawn length (base02 flag bit 2, 0x3fc540..0x3fc5e8): its effect's units scaled to (1, 1, length / 100)
      if (sh.scaleZ != null && sh.request && alive(sh)) this.host.scaleRequestUnits(sh.request, [1, 1, sh.scaleZ]);
      // a beam's impact (its step's ef param 1, 0x3fd3c8..0x3fd41c): re-placed at the hit every frame
      if (sh.place2 && sh.effect2 && sh.effect2.request && reqAlive(sh.effect2.request))
        this.host.placeRequest(sh.effect2.request, sh.place2.position, sh.place2.rotationDeg);
    }
    // a beam's impact handle dropped (no hit this frame, 0x3fc198..0x3fc1b8; or the beam's end, 0x3fc698)
    for (const sh of out.alive.concat(out.ended)){
      // (stop2.atOnce: the handle KILLED, its vt+0x40 0x43384 -- base58's miss, shells.js step58 -- stopped at once)
      if (sh.stop2 && sh.stop2.request && reqAlive(sh.stop2.request) && !sh.stop2.request.stopped) this.host.stopRequest(sh.stop2.request, sh.stop2.atOnce ? 1 : 0);
      if (sh.stop2) sh.stop2 = null;
    }
    // a rock's bounce / landing effect: started by its move at the contact point (placed: placement mode 3), hung from
    // the shell's parent; the handle keeps the request, so the rock's ending waits for it (shells.js effect2)
    for (const { shell: sh, start } of out.started){
      const e = this.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === start.pel && x.def.record.key === start.key);
      if (!e) continue;                                           // no such record exported: the effect is not there
      // a shell whose init started nothing of its own (its first effect comes from a later move: Ahtal-Ka's base57 starts
      // ef 0 at its landing, ef 4 on the pull) has no parent yet: the same model-less parent the spawn would have made
      if (!sh.parent){ sh.parent = this.host.createParent([], { model: false }); sh.scale0 = start.requester.scale[0]; if (sh.position) pose(sh, start); }
      const r = e.def.record;
      const q = this.host.requestEffect(e.owner, sh.parent, { index: r.index, key: r.key, path: r.path, payload: hex(r.payload) },
                                        undefined, start.requester);
      e.requests.push(q);
      this.starts++;
      if (start.slot && sh.handles) sh.handles[start.slot] = q;          // a named handle (Ahtal-Ka's anchors, shells.js start60)
      else if (start.kind === 'reflight'){
        // a new flight into the shell's own handle (Gammoth's split, shells.js post083s13: 0x329c40(h, 1) on +0x1674, then ef 3
        // into it): the old request stopped at once, the new one the shell's request from here on (its end stops it); the move's
        // flag-1 stop event is this one, applied here
        if (sh.request && reqAlive(sh.request) && !sh.request.stopped) this.host.stopRequest(sh.request, 1);
        sh.request = q;
        for (const ev of sh.events || []) if (ev.ev === 'stop' && ev.reflight) ev.__applied = true;
      }
      else if (start.kind === 'switch' && sh.effect3) sh.effect3.request = q;   // base01's 0x20 switch: its +0x162c handle
      else if (start.kind === 'end' && sh.effect4) sh.effect4.request = q;  // base01's end start of +0x15d4 (Boltreaver's 04_01): +0x1630
      else if (sh.effect2) sh.effect2.request = q;
    }
    // A SHELL'S NAMED HANDLES STOPPED BY ITS MOVE (shells.js `stops`: { slot, mode } -- 'start' its own first effect; 0x43b058(h,
    // mode): 0 graceful, 1 at once)
    for (const sh of out.alive.concat(out.ended)){
      if (!sh.stops || !sh.stops.length) continue;
      for (const st of sh.stops){
        const q = st.slot === 'start' ? sh.request : (sh.handles && sh.handles[st.slot]);
        if (q && reqAlive(q) && !q.stopped) this.host.stopRequest(q, st.mode ? 1 : 0);
      }
      sh.stops = [];
    }
    // A SHELL'S OWN EFFECT STOPPED GRACEFULLY MID-LIFE (Boltreaver's base14 stops u 41 at its delay, 0x406a34: 0x329c40(h, 0))
    for (const sh of out.alive) if (sh.stopNow && sh.request && alive(sh) && !sh.request.stopped) this.host.stopRequest(sh.request);
    // ...and its units written by the shell itself, after the move's start (base14: u 40's every unit placed at the bolt's
    // anchor, turned by its words, stretched in z to the head; shells.js move14 / host.placeUnits)
    for (const sh of out.alive)
      if (sh.units14 && sh.effect2 && sh.effect2.request && reqAlive(sh.effect2.request))
        this.host.placeUnits(sh.effect2.request, sh.units14.position, sh.units14.rotationRad, sh.units14.scaleZ);
    // base01's 0x20 SWITCH stops the shell's own effect at once (0x43b058(h, 1) -> 0x329c40(h, 1); shells.js switch01): its
    // flag-1 stop events, applied once each, to the request they name
    for (const sh of out.alive){
      if (!sh.events) continue;
      for (const ev of sh.events){
        if (ev.ev !== 'stop' || ev.flag !== 1 || ev.__applied) continue;
        ev.__applied = true;
        const q = ev.param === 0 ? sh.request : null;
        if (q && alive(sh) && !q.stopped) this.host.stopRequest(q, 1);
      }
    }
    for (const sh of out.ended) if (sh.stop && sh.request && alive(sh) && !sh.request.stopped) this.host.stopRequest(sh.request);
    for (const sh of out.ended) if (sh.base === 'base14' && sh.parent) this.goneNext.push(sh.parent);
    // ...and the switch's own handle at the shell's end (base01's end stops +0x162c too, gracefully)
    for (const sh of out.ended) if (sh.effect3 && sh.effect3.request && reqAlive(sh.effect3.request) && !sh.effect3.request.stopped)
      this.host.stopRequest(sh.effect3.request);
  }
  // A CLASS'S THREADS (render/class-threads.js; Ahtal-Ka's vt+0x208 head 0x10b7798): numbered slots, each a handle held while
  // the pass marks the slot active, stretched between its two points every frame. joints: gid => the game's 16-float joint
  // matrix this step (live.js); threadInput() (index.html) => { carry, action, motion: { list, slot } }, what the viewer
  // holds of what the pass reads. The records are exported `when: 'thread'` -- nothing else starts them.
  useThreads(monId, joints){
    const T = CLASS_THREADS[monId];
    this.threads = T ? { T, joints, slots: new Array(T.slots).fill(null), on: [], off: T.off.slice(), missing: [] } : null;
  }
  stepThreads(){
    const R = this.threads, T = R.T, c = this.clip;
    const inp = this.threadInput ? this.threadInput() : null;
    const motion = inp && inp.motion && c && c.key ? { list: String(inp.motion.list), slot: inp.motion.slot } : null;
    // the tick that reaches frame t + 1 (the sweep's frame model, class-threads.js)
    const tick = c ? Math.max(0, Math.ceil(c.frame - 1e-6) - 1) : 0;
    const carry = inp ? inp.carry : 4;
    // a class's points written once at an action's start (Ahtal-Ka's web points, class-threads.js latch): taken when the
    // viewer starts a play (the clip's play token), from the owner unit as it stands then (+0x40, its size, its yaw word)
    R.mem = R.mem || {};
    if (T.latch && c && c.play != null && c.play !== R.play){
      R.play = c.play;
      const P = this.parent;
      T.latch(inp ? inp.action : null, P ? { position: P.position, scale: P.scale, yaw16: this.ownerYaw16() } : null, R.mem);
    }
    const anchors = T.anchors ? T.anchors(this.shells ? this.shells.state : null) : null;
    const neset = inp && inp.neset ? inp.neset : null;          // Ahtal-Neset's joints where he is on screen (class-threads.js em088Neset)
    const now = T.at({ motion, tick, carry, pending: inp ? inp.pending : 4, action: inp ? inp.action : null, anchors, neset,
                       timer: inp && inp.timer != null ? inp.timer : null });
    const bySlot = new Map(now.on.map(s => [s.slot, s]));
    // 0xc164c: a joint's position, the translation row of its world matrix; a number the model does not map reads joint 0's
    const pos = g => { const M = R.joints(g) || R.joints(0); return M ? [M[12], M[13], M[14]] : null; };
    // an end that is an OBJECT: its point by its slot state (class-threads.js objectPoint), the shells' own state as the viewer's G
    // a POINT the class keeps (start kind 3 / end kind 4: R.mem, zero until written, as the ctor's fill leaves it)
    const kept = k => (R.mem[k] || [0, 0, 0]).slice();
    // start kind 2 (Ahtal-Neset's 0x10a88f4..0x10a898c): the joint's position (0xc164c) + the offset turned by its matrix rows (0xc15a4)
    const jointOff = a => { const M = R.joints(a.joint) || R.joints(0); if (!M) return null; const [x, y, z] = a.offset;
      return [M[12] + x * M[0] + y * M[4] + z * M[8], M[13] + x * M[1] + y * M[5] + z * M[9], M[14] + x * M[2] + y * M[6] + z * M[10]]; };
    const start = a => typeof a === 'number' ? pos(a) : a.joint != null ? jointOff(a) : kept(a.point);
    const end = b => {
      if (typeof b === 'number') return { point: pos(b), why: 'joint ' + b + ' not in the model' };
      if (b.point) return { point: kept(b.point) };
      // END KINDS 7 / 8 (0x10ba25c / 0x10ba280): the partner's joint -- its position (0xc164c), plus `off` through its rows (0xc15a4)
      if (b.neset != null){
        const M = neset && neset(b.neset);
        if (!M) return { point: null, why: 'Ahtal-Neset joint ' + b.neset + (neset ? ' not in his model' : ': no Neset on screen') };
        const o = b.off || [0, 0, 0];
        return { point: [M[12] + o[0] * M[0] + o[1] * M[4] + o[2] * M[8], M[13] + o[0] * M[1] + o[1] * M[5] + o[2] * M[9],
                         M[14] + o[0] * M[2] + o[1] * M[6] + o[2] * M[10]] };
      }
      if (b.anchor){ const A = anchors && anchors[b.anchor][b.p]; return { point: A ? A.point.slice(0, 3) : null, why: 'anchor ' + b.anchor + '+' + b.p + ' gone' }; }
      return T.objectPoint(b.object, { carry, joint: pos, shells: this.shells ? this.shells.state : null });
    };
    R.on = []; R.missing = [];
    for (let k = 0; k < R.slots.length; k++){
      const s = bySlot.get(k), S = R.slots[k];
      const A = s ? start(s.a) : null, Bend = s ? end(s.b) : null, B = Bend ? Bend.point : null;
      if (!s || !A || !B){
        if (s) R.missing.push('u ' + s.key + ' (slot ' + k + '): ' + (A ? Bend.why : 'joint ' + s.a + ' not in the model'));
        // an inactive slot's handle: 0x329c40(h, 1) when its +0x60 byte is 1, else (h, 0); the handle cleared
        if (S && S.q && !S.q.stopped && !S.dead) this.host.stopRequest(S.q, S.hard ? 1 : 0);
        R.slots[k] = null;
        continue;
      }
      let cur = S;
      if (!cur){
        const e = this.entries.find(x => x.when === 'thread' && x.def.record && x.def.record.pel === T.pel && x.def.record.key === s.key);
        if (!e){ R.missing.push('u ' + s.key + ': its record is not exported'); continue; }
        const r = e.def.record;
        const q = this.host.requestEffect(e.owner, this.parent, { index: r.index, key: r.key, path: r.path, payload: hex(r.payload) },
                                          undefined, this.host.threadRequester(A, B));
        e.requests.push(q);
        this.starts++;
        cur = R.slots[k] = { q, key: s.key, dead: false };
      }
      cur.hard = s.hard;                       // the slot's +0x60 byte, as this frame's arm wrote it
      // a held handle whose effect ran out on its own (none of these is read to) is kept -- the slot is not requested again
      // while it stays active (0x10ba3e8 tests the handle) -- and no longer written
      if (!cur.dead && cur.q.finished()) cur.dead = true;
      if (!cur.dead) this.host.stretchRequest(cur.q, A, B);
      R.on.push({ slot: k, key: s.key, held: cur.key, a: s.a, b: s.b, A, B });
    }
    R.off = T.off.concat(now.off);
  }
  // what the thread pass drew this step and what it could not (the checks, the soaks)
  threadState(){ const R = this.threads; return R ? { on: R.on.slice(), off: R.off.slice(), missing: R.missing.slice() } : null; }

  // the monster's facing as the u16 angle a unit keeps (+0x54; forward = (sin Y, 0, cos Y)), from its parent's
  // quaternion; the float-to-u16 rounding is the viewer's (the unit's own word is not kept here)
  ownerYaw16(){
    const q = this.parent ? this.parent.quaternion : [0, 0, 0, 1];
    const [x, y, z, w] = q;
    const fx = 2 * (x * z + w * y), fz = 1 - 2 * (x * x + y * y);        // the unit's +Z, turned
    return Math.round(Math.atan2(fx, fz) * 65536 / (2 * Math.PI)) & 0xffff;
  }

  // the effects to draw this frame: every request not yet finished, a stopped one included -- it runs out on screen
  effects(){ return this.entries.flatMap(e => e.def.record ? e.requests.flatMap(q => (q.stoppedAtStep !== undefined && q.stoppedAtStep === (this.frame || 0)) ? [] : q.effects()) : [e.owner]); }
  // requests and plain effects running
  get running(){ return this.entries.reduce((n, e) => n + (e.def.record ? e.requests.length : 1), 0); }
}
