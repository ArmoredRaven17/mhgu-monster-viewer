// NAMES ARE NOT OURS TO GIVE. Raven, 2026-09-28: "We do not fabricate or invent anything when pulling
// info from the ROM ... We pulled Parts as ID, then I labelled them for the sake of the users. You
// however don't label unless I ask you to do so."
//
// Every descriptive name for these records is the decode note's own INFERENCE, and it says so each time:
// c 1100 "(INFERRED poison)", c 1106 "(INFERRED paint mark)", c 1108 "(INFERRED dung)", c 1500
// "(INFERRED lying in shallow water)". Those guesses rest on things like a record's colour word being
// pink or brown, or a scale being flat and wide. So the states are keyed by their RECORD ID, which is
// read, and each carries only the gate that was actually read. If a name is wanted, Raven gives it.
//
// He has, for two of them (2026-09-28): **c 1100 is "Poisoned"** and **c 1108 is "Dung Bombed"**. Those
// are the user-facing labels in index.html; the keys here stay the record ids, because the id is what
// the ROM gives and the label is what Raven gives -- keeping them apart is what stops an inference
// turning back into a fact. c 1106 and c 1500 are unnamed and undriven: he checked both against the
// game and neither behaves as a repeating record (see their entries).
//
// THE SHARED-STATE EFFECTS: the records the game's SHARED ENEMY CODE requests, not the monster's class.
//
// Every record here lives in the monster's own c.pel and is requested from the shared band
// 0xa3dc0..0xa4a00 (plus 0x7f010, 0xbcae0, 0x97d20, setAction 0x754f8), so ONE reading serves every
// monster: 1410 records across 94 of them come from 28 (code site, id) pairs. What is per monster is
// the record itself -- its file, joint and offsets in that monster's c.pel -- and the dttune tables.
// Decode: E:/offline/decode/notes/shared-state-effects.md, read against Rathian.
//
// WHY THIS IS NOT IN MOTION_STATES. These are CLIP-INDEPENDENT: the note's own words for c 1100 are
// "no reaction action; it plays over whatever clip runs". MOTION_STATES rows are keyed by motion, so a
// row there could only fire them on one clip, which is not what the ROM does. They are driven by a
// STATE that outlives any clip, on a frame countdown of their own.
//
// "period N" in the ROM means: the countdown is held at zero while the state is off, so the record is
// requested AT ONCE when the state comes on and then every N frames while it holds (see the note's
// "Bottom line" -- that is why the first request is not delayed).
//
// KEY = 1120 + the shared request id (0xa44a4 computes `r1 = selector + 0xa` and the ids 10..16 give
// keys 1130..1136), which is why these keys are the same on every monster.

// Each entry: the c.pel key, the period in frames, how long the state runs in the ROM, and the ROM
// site the number came from. `frames: null` = it runs as long as the state does, with no timer of its
// own. `once: true` = one request at the moment the state flips, no period.
export const SHARED_STATES = {
  // ailment bit 2 of P+0x5e08; gauge P+0x4ca over the tune+0x34 threshold -> 0xa239c. The 90 is the
  // period pass 0xa4604..0xa4658 (0x7206c(P+0x5c5c) -> 90.0); the life ends when P+0x5ca8 exceeds
  // tune+0x34's s16 + 6 = 3600 f (0xa2650..0xa2684).
  c1100:  { key: 1100, period: 90,  frames: 3600, field: '5c5c', rom: '0xa4604..0xa4658, life 0xa2650' },
  // c 1106 -- NOT DRIVEN. Raven, 2026-09-28, from the game: "Removed Marked (In Game, you simply throw a
  // paintball once not repeatedly)". The ROM block at 0xa46e8 does hold a period of 40 over 7200 frames,
  // so what is read is not in doubt; what IS in doubt is that this record is the thing that repeats. A
  // free-running toggle showed it over and over, which is not what the game does, so it comes out until
  // the repeat is accounted for. The gate and the numbers stay recorded above and in the note.
  // timer P+0x5d24 (+ bits P+0x5d28), set to 3600 only when it was 0 (0x9d984..0x9da6c).
  // INFERRED dung (the colour word is brown).
  c1108:     { key: 1108, period: 36,  frames: 3600, field: '5c64', rom: '0xa465c..0xa46e4' },
  // c 1500 -- NOT DRIVEN, and the decode and the game DISAGREE. Raven, 2026-09-28: "remove In Shallow
  // Water. It was stepping in Shallow Water, however it simply loops even if there is no walking being
  // done." So in game this record goes with STEPPING -- a footfall in shallow water -- while the note's
  // gate (0xa409c) is the monster LYING: sleep hold / rest / dead / captured, posture 0, on ground whose
  // stage attributes +0x1068 & 0x1002 are set, every 100 frames.
  //   Those cannot both be right, and the game is the authority: either 0xa409c is not the site that
  // drives what he sees, or cm200_041 is requested from a second place on a step. UNRESOLVED -- do not
  // re-add a toggle for it until the stepping request is found. A 100-frame loop with no walking is the
  // wrong behaviour whatever the record turns out to be.
  // the combat byte P+0x2c0 flipping 0 -> 2 (a large monster newly noticing a hunter): 0xbcae0 ->
  // 0xa4388(e, 2) while the old value is 0. One request at the flip.
  // the flip is the trigger, but the ROM shows it on the NOTICE SEQUENCE the state change starts
  // (Rathian: group 4, a turn then (2,9) L0 M5), so a caller should fire it as that begins.
  c1200:     { key: 1200, once: true, clipTied: 'the notice sequence', rom: '0xbcae0 -> 0xa4388(e, 2)' },
  // 2 -> 0. 2 -> 1 (into combat) fires NOTHING -- the note is explicit, so do not fire on that edge.
  c1201:     { key: 1201, once: true, rom: '0xa4388(e, 0) while the old value is 2' },
  // NOT HERE, AND THAT IS THE POINT (Raven, 2026-09-28): "some states are not tied to an animation like
  // Poisoned ... unlike Para or Sleep which have animations". Only a record the note's own "motions that
  // carry it" column calls NONE belongs on a free-running countdown:
  //
  //   c 1100 poison   "none (no reaction action; it plays over whatever clip runs)"   <- free-running
  //   c 1106 marked   "none"                                                          <- free-running
  //   c 1108 dung     "none of its own"                                               <- free-running
  //   c 1130..1137    "none (no reaction of its own; any clip)"                        <- an edge, per proc
  //
  // These are ANIMATION-TIED and are driven from render/motion-states.js rows, on the clip the ROM plays,
  // NOT from here -- a toggle would fire them while the monster walks about normally:
  //
  //   c 1101 / c 1102  the sleep and tired states -- already `every` rows on 60 / 61 monsters
  //   c 1103           stun, a `hold` row across the stun clips
  //   c 1104           tired, an `every` row on the tired clip
  //   c 1109           the exhaust REACTION, Rathian's L3 M2 as (10,0x1b) -- one request at frame 0
  //   c 1200           the notice sequence ((2,1) turn, then (2,9) L0 M5)
  //
  // c 1105 is not here either: its gate 0x80254 is unread, so there is nothing to say when it should run.
};

// c 1130..1137: EIGHT records, because the selector byte [[e+0x1428]+0x5db0] is a PART INDEX 0..7
// (bounded at 0x9d810), not a 0..6 enum -- the triage's "a byte, 0..6" undercounts it. Each is
// cm104_000 on that part's own joint, mode 0 sub 2, end 0, requested ONCE per proc in the frame of the
// hit (0x97ea0 -> 0xaab98), through vtable +0x3b8 = 0xa44a4, and only when 0xb6fc4 passes
// (enemy[+0x1054] == the global byte at 0x49660, INFERRED in the note as "in the local player's area").
// INFERRED blast in the note (the tune+0x54 status proc).
export const BLAST_PART_BASE = 1130;
export const BLAST_PARTS = 8;

// NOT IMPLEMENTED HERE, deliberately. c 1101 (ailment bit 4), c 1102, c 1105 and u 1400 are named in
// the note's mechanism prose -- the pass addresses and, for 1101, the bit -- but it gives no PERIOD and
// no DURATION for them, so there is nothing to drive them with that would not be invented. They are
// wired on the monsters that have a MOTION_STATES table already (1101 on 60 of 90, 1102 on 61 of 91),
// through that table's own `every`, which is where they stay until their cadence is read.


// THE ORDER THE ROM'S PASS RUNS ITS BLOCKS, by address. It matters because two records can share a timer
// field: 0xa3df8 (c 1102) is called at 0xa4520, BEFORE 0xa4518's own blocks, so on the shared +0x5c60 it
// ticks first and c 1101 -- ticking second -- is the one that catches each crossing. Listing them in any
// other order silently swaps which record the viewer shows.
export const PASS_ORDER = [
  'c1100',       // 0xa45e4
  'c1108',       // 0xa465c
];

// The driver. It owns nothing but a frame counter per state, so a host can create one per monster and
// step it once per scheduled frame, whatever clip is playing.
export class SharedStates {
  // schedule: an EffectSchedule (its fire() starts every 'event' record with a pel+key); pel: the
  // monster's c.pel name, which is the FAMILY's, not the monster's -- Gold Rathian's records are in
  // em001_00c. Read it from the exported record, never build it from the monster id.
  constructor(schedule, pel){
    this.schedule = schedule;
    this.pel = pel;
    this.on = {};            // state name -> true while the user holds it on
    this.age = {};           // state name -> frames since it came on
    this.fired = {};         // state name -> requests made, for the checks
    this.timer = {};         // ROM timer FIELD -> its countdown, shared where the ROM shares it
  }

  // Turn a state on or off. Coming on resets the age so the first step requests at once, which is what
  // "the countdown is zeroed while the state is off" means; going off forgets it.
  set(name, on){
    if (!SHARED_STATES[name]) return false;
    on = !!on;
    if (on === !!this.on[name]) return true;
    this.on[name] = on;
    // the countdown is zeroed while the state is off, so the first tick fires at once (0x720a4)
    if (on){ this.age[name] = 0; const f = SHARED_STATES[name].field; if (f) this.timer[f] = 0; }
    else delete this.age[name];
    return true;
  }

  // One request of the blast record for a part, at that part's own joint. Once per proc: the ROM makes
  // no repeat, so this is not on a countdown.
  blast(part){
    if (!(part >= 0 && part < BLAST_PARTS)) return [];
    this.fired['blast' + part] = (this.fired['blast' + part] || 0) + 1;
    return this.schedule.fire(this.pel, BLAST_PART_BASE + part);
  }

  // The alert edges. The ROM fires c 1200 on 0 -> 2 and c 1201 on 2 -> 0, and NOTHING on 2 -> 1, so
  // this takes the old and new combat byte rather than a boolean and stays silent on every other edge.
  combat(from, to){
    if (from === 0 && to === 2) return this.edge('c1200');
    if (from === 2 && to === 0) return this.edge('c1201');
    return [];
  }

  edge(name){
    const s = SHARED_STATES[name];
    if (!s) return [];
    this.fired[name] = (this.fired[name] || 0) + 1;
    return this.schedule.fire(this.pel, s.key);
  }

  // 0x7206c(enemy, &timer, amount), read at 0x7206c..0x720b0. NOT a modulo: it is a COUNTDOWN, and the
  // already-expired case is what makes the first request immediate.
  //   if ([timer] <= 0) { [timer] = 0; return 1; }        // 0x720a4 -- fires
  //   [timer] -= amount;                                  // 0x539d5c
  //   return [timer] <= 0;                                // fires on the crossing frame
  // The caller writes its own period back on a fire. The timer lives in a FIELD, and two records can
  // share one: c 1101 and c 1102 are both +0x5c60, so with both states on the field is decremented
  // ONCE PER BLOCK PER FRAME -- a 90 drains in ~45 frames and whichever block sees the crossing writes
  // its own period. A timer each would be a different monster.
  tick(field, period, amount = 1){
    const t = this.timer[field] || 0;
    if (t <= 0){ this.timer[field] = 0; this.timer[field] = period; return true; }
    const n = t - amount;
    this.timer[field] = n;
    if (n <= 0){ this.timer[field] = period; return true; }
    return false;
  }

  // Once per scheduled frame, in definition order -- the order the ROM's pass runs its blocks, which is
  // what decides who wins a shared field.
  step(){
    const out = [];
    for (const name of PASS_ORDER){
      if (!this.on[name]) continue;
      const s = SHARED_STATES[name];
      if (s.once) continue;                                  // edge records are not stepped
      const age = (this.age[name] | 0) + 1;
      this.age[name] = age;
      if (s.frames != null && age > s.frames){                // the state's own ROM lifetime
        this.on[name] = false;
        delete this.age[name];
        continue;
      }
      if (this.tick(s.field || name, s.period)){
        this.fired[name] = (this.fired[name] || 0) + 1;
        for (const q of this.schedule.fire(this.pel, s.key)) out.push(q);
      }
    }
    return out;
  }

  // what the page checks read
  stats(){ return { on: Object.keys(this.on).filter(n => this.on[n]), age: { ...this.age }, timer: { ...this.timer }, fired: { ...this.fired } }; }
}

// ---- HYPER -- WIRED IN, DELIBERATELY NOT FIRING ---------------------------------------------------
//
// Raven, 2026-09-28: the hyper effects carry BEHAVIOUR code with them, which needs a validation layer of
// its own before any of it is trusted on screen -- "I just don't want it firing right now" -- and "that
// way we are not undoing work to be redone later, since we will want Hyper states".
//
// So the 318 records (keys 1301..1320, 44 monsters) ARE exported and stay exported. What makes them not
// fire is that NOTHING CONSTRUCTS `Hyper`: no module outside this file references it, so no request is
// ever made. That is the whole mechanism -- there is no flag to forget and no branch to mis-set, and
// wiring it later is one construction site, not a re-export.
//
// In the board's terms these records are WIRED IN, not IMPLEMENTED: decoded and present, not firing.
// ---------------------------------------------------------------------------------------------------
export const HYPER_GROUP0 = 1301;
export const HYPER_GROUP1 = [1302, 1303, 1304];
export const HYPER_BURSTS = [1311, 1312, 1313, 1314];
// Rathian's, from the note. 1312/1313 fire for NO monster read so far: her hooks have no id 2/3 case.
export const HYPER_BURST_FRAMES_EM001_00 = {
  1311: ['L2 Motion[3] f2', 'L2 Motion[4] f2', 'L4 Motion[6] f2', 'L4 Motion[55] f50', 'L4 Motion[65] f76 (G)'],
  1314: ['L2 Motion[1] f12', 'L2 Motion[2] f14', 'L2 Motion[13] f16',
         'L2 Motion[5] f12 (G)', 'L4 Motion[8] f24 (G)', 'L4 Motion[16] f64 (G)'],
};

export class Hyper {
  constructor(schedule, pel){
    this.schedule = schedule;
    this.pel = pel;
    this.on = false;
    this.group1 = null;        // which of 1302/1303/1304 is held now
    this.advances = 0;
  }

  // `first` picks the group-1 record the ROM would have chosen at random. A caller that wants the
  // viewer to be repeatable passes one; passing nothing picks 1302 rather than calling Math.random,
  // because a random default would make two runs of the same check disagree.
  set(on, first = HYPER_GROUP1[0]){
    on = !!on;
    if (on === this.on) return;
    this.on = on;
    if (on){
      this.schedule.holdEvent(this.pel, HYPER_GROUP0, true);
      this.group1 = HYPER_GROUP1.includes(first) ? first : HYPER_GROUP1[0];
      this.schedule.holdEvent(this.pel, this.group1, true);
    } else {
      this.schedule.holdEvent(this.pel, HYPER_GROUP0, false);
      if (this.group1) this.schedule.holdEvent(this.pel, this.group1, false);
      this.group1 = null;
    }
  }

  // The HP crossing, at the rage roar: stop the held one and hold the next IN FILE ORDER. The ROM only
  // advances when both happen -- an HP threshold AND the new action being (1,9) -- so the caller passes
  // the roar, and a crossing without one does nothing.
  advanceOnRoar(){
    if (!this.on || !this.group1) return null;
    const i = HYPER_GROUP1.indexOf(this.group1);
    const next = HYPER_GROUP1[(i + 1) % HYPER_GROUP1.length];
    this.schedule.holdEvent(this.pel, this.group1, false);
    this.schedule.holdEvent(this.pel, next, true);
    this.group1 = next;
    this.advances++;
    return next;
  }

  // A burst, by key. NOT on a timer and NOT bound to a clip here: the frames come from each monster's
  // own class hooks and only Rathian's are read, so a caller (a motion binding, or a check) names the
  // moment. Firing these on a guess would put a burst on the wrong frame of every other monster.
  burst(key){
    if (!this.on || !HYPER_BURSTS.includes(key)) return [];
    return this.schedule.fire(this.pel, key);
  }

  stats(){ return { on: this.on, group1: this.group1, advances: this.advances }; }
}
