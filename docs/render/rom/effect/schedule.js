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
    for (const e of this.entries){
      if (!e.def.record){                     // a plain effect: started once and moved every step, as before
        if (e.def.joints.length) host.attach(e.owner, parent);
        host.start(e.owner);
      } else if (e.when === 'always' || (e.when === 'rage' && this.rage) || (e.when === 'calm' && !this.rage)) this.start(e);
    }
  }

  start(e){
    const r = e.def.record;
    e.requests.push(this.host.requestEffect(e.owner, this.parent, { index: r.index, key: r.key, path: r.path, payload: hex(r.payload) }));
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
        if (want) this.start(e);
        else if (e.def.stop === 'request'){ for (const q of e.requests) if (!q.stopped) this.host.stopRequest(q); }
        else { for (const q of e.requests) this.host.releaseRequest(q); e.requests.length = 0; }
      } else if (e.when === (on ? 'rageStart' : 'rageEnd')) this.start(e);
    }
  }

  // one 1/60 s step: the clip's walker, the unit passes over every request, then the plain effects' moves
  step(){
    this.frame = (this.frame || 0) + 1;
    this.walk();
    this.host.unitFrame();
    for (const e of this.entries) if (!e.def.record) this.host.move(e.owner);
    this.host.pruneUnits();
    for (const e of this.entries) if (e.requests.length) e.requests = e.requests.filter(q => !q.finished());
  }

  // The clip playing now, handed over by the viewer every frame: `key` names the motion (a change of it is a new
  // motion), `frame` is its frame at 60 per second, `motion` its CLIP_EFFECTS schedule ({ frames, bits }) or null,
  // `start` the frame the clip starts and loops from (0, or where a _loop clip sits in its motion). The walk reads
  // it once per step. No clip (key null) is a motion too: the one before it is over.
  setClip(key, frame, motion, start = 0){ this.clip = { key, frame, motion: motion || null, start }; }

  // 0x31ca58, once per step -- see the header
  walk(){
    const m = this.host.m, W = this.walker, c = this.clip;
    for (let i = 0; i < WALK_BITS; i++){ const a = this.words + 4 * i; m.w32(a, m.u32(a) & 0xfff0); }
    if (!c) return;
    const notify = bits => { for (let i = 0; i < WALK_BITS; i++){ const a = this.words + 4 * i; m.w32(a, (m.u32(a) | bits) >>> 0); } };
    if (c.key !== W.motion){
      notify(4);
      W.motion = c.key; W.data = c.motion; W.values = 0; W.last = c.start;
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
  // 0x31cd70: `count` frames from `f` (wrapping to 0 at the slot's last frame), each bit's edge acted on
  walkFrames(f, count){
    if (count < 1) return;
    const m = this.host.m, W = this.walker, { frames, bits } = W.data;
    const n = Math.min(count, WALK_FRAMES_MAX);
    for (let k = 0; k < n; k++){
      if (k > 0 && ++f >= frames - 1) f = 0;
      let now = 0;
      for (const b of bits) if (b.on.some(([from, to]) => f >= from && f < to)) now |= 1 << b.bit;
      for (const b of bits){
        const was = (W.values >>> b.bit) & 1, is = (now >>> b.bit) & 1, word = this.words + 4 * b.bit;
        if (was && is) m.w32(word, (m.u32(word) | 1) >>> 0);
        else if (was) m.w32(word, (m.u32(word) | 2) >>> 0);
        else if (is) for (const q of this.startClip(b.efl, b.key)) m.w32(q.core + 0x194, word);
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

  // the effects to draw this frame: every request not yet finished, a stopped one included -- it runs out on screen
  effects(){ return this.entries.flatMap(e => e.def.record ? e.requests.flatMap(q => q.effects()) : [e.owner]); }
  // requests and plain effects running
  get running(){ return this.entries.reduce((n, e) => n + (e.def.record ? e.requests.length : 1), 0); }
}
