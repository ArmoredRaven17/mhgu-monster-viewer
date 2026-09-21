// ANIMATIONS THAT CARRY A PART BREAK OR A STATE CHANGE, shown the way the game shows them, over the user's own choices.
//
// Raven, 2026-09-21: "Animations that involve part breaks or state changes should show that. If the user sets a part to
// be broken, toggle the part to intact to display the part break, same for different states. This way the animation can
// play out, but we keep the user's toggle choices."
//
// A motion listed here changes what the viewer SHOWS while it plays and nothing the user chose -- index.html's `state`,
// the Parts panel, the Enraged checkbox and the saved view all stay as they are. From the frame the ROM makes the change,
// the display takes the motion's state (the part sets, the rage), and that change's own effects are requested there;
// when the motion is over -- another clip or the bind pose -- the display goes back to the user's choices by the game's
// own way out (a part's set; rage's stop request and Gekikou_End). A play-once clip held on its last frame is still that
// motion and keeps its state: Raven, 2026-09-21, of a death played once: "he goes back to being enraged, eyes open in
// the death state".
//
// WHERE THE CHANGE FALLS. Savage's all fall on FRAME 0 of the motion. A break: the damage code raises the break level and
// requests the effect, the reaction's script sets its motion from frame 0 in the same enemy update, and that frame's
// +0x28 pass applies the part sets from the new level -- "the first frame drawn with the reaction motion already has the
// broken model" (E:\offline\decode\notes\breaks-em043.md 2.7). Rage: the forced transition sets it and starts the entry
// action, whose motion begins at frame 0, and the same frame's +0x28 pass requests the aura and switches the materials
// and parts (states-em043.md 1.2). So no frame inside the motion shows the state before the change: the intact head is
// the motion before the reaction. A motion that starts over -- a loop, a replay, the scrubber moved back -- is the change
// again, and its effect is requested again.
//
// A BREAK IS SHOWN INTO THE USER'S LEVEL: with the Jaw broken, the first break (intact -> jaw); with the Face broken, the
// second (jaw -> face); with the head intact, the first, back to intact when the motion is over.
//
// Only what the ROM changes at that frame is shown changed. Savage's part driver (0xe809e8, every frame) picks the body
// set from rage alone (13 enraged / 9 calm, 0xe80bc8..0xe80bfc), the tail set from the sever bit alone (12 / 10,
// 0xe80c00..0xe80c24) and the head sets from the break level alone (0xe80c28..0xe80cf4) -- so a rage entry shows the body
// set and leaves the head and tail as the user has them, and a break shows its own part's sets and nothing else. Death
// keeps every break the user set: the break level and the sever bit outlive it (nothing on the death path clears them).
//
// A spec is one of:
//   { levels, fire }           a break: the part sets per level (the level shown is the user's, at least the 1st) and
//                              the [pel, key] each level's break requests
//   { rage: true, sets }       rage entry: sets [calm, enraged]
//   { dead: true, sets, clips, settled? }   death: the sets shown dead, the material clips death plays from its frame 0
//                              ({ mats, clip }), and `settled` when the motion begins after death's transitions are over
//   an ailment / tiredness, any of: rage (false: rage shown off), sets, every: [[pel, key], period] (a record requested
//                              on a countdown: at the motion's frame 0, then every `period` frames), hold: [pel, key] (a
//                              record requested once and kept while the state lasts, stopped after), eyesOff: [pel, key]
//                              (a rage record the monster's code holds off in this state)
export const MOTION_STATES = {
  em043_05: {
    // THE HEAD BREAK (breaks-em043.md 2). Every depletion of part 0 plays L2 Motion[9] from frame 0 (reaction code 3 ->
    // action (10, 0x14), 0x9e82c; script 0x17c08a0: motion 0x209, blend 4, start 0). The 1st raises the break level to 1:
    // u 1000 (0xa442c: id part*5 + level + 6 = 7, 0x159c7fc[7] = 1000; cm202_060 on joint 3); the 2nd to 2: u 1001 (id 8).
    // The level becomes sets every frame: below 1 -> sets 2 and 3; 1 -> 7 and 3; 2 and up -> 7 and 11 (0xe80c28..0xe80cf4;
    // the levels are the dtp rows' own, 1 and 2, section 1.1). Set 7 is the Jaw row's Broken (parts 1 off, 2 on); set 11
    // the Face row's (parts 4 off, 5 and 6 on). Depletions after the 2nd play the motion and change nothing.
    '2|Motion[9]': { part: 'head', levels: [[2, 3], [7, 3], [7, 11]],
                     fire: [null, ['em043_05u', 1000], ['em043_05u', 1001]] },
    // THE TAIL SEVER (breaks-em043.md 4). Part 6's second counter runs out once -> action (10, 0x72): its start hook severs
    // (0xc2274: P+0x3b4 |= 1, then u 900 through 0xa4354 -- cm202_062 on joint 144), and its script (0x17c0c00) plays
    // L3 Motion[15] from frame 0; the part driver shows set 12 with the sever bit, set 10 without (0xe80c00..0xe80c24).
    // The cut tail drops on the same frame (render/tail-option.js, tail-option-em043.md; Raven: "Follow how the ROM
    // handles tail cut animations").
    '3|Motion[15]': { part: 'tail', levels: [[10], [12]], fire: [null, ['em043_05u', 900]], drops: true },
    // RAGE ENTRY (states-em043.md 1.2). The gauge's request makes the forced transition set rage (0xbcdb0) and start
    // action (1, 2) (command group 6 stream 0), whose phase 0 sets L0 Motion[5] from frame 0 (0xe74d10); the same frame's
    // +0x28 pass requests the aura (u 30, joint 103) and the eyes (u 31, joint 3) (0xe80500), plays Gekikou_Start on the
    // body materials from time 0 (0xe80b10..0xe80bc4) and shows body set 13 in place of 9 (0xe80bc8..0xe80bfc).
    // L0 Motion[5] also plays with no rage change -- the roar after paralysis and after the shock trap (scripts
    // 0x17c08f0 and 0x17c0bd0), action (1, 0x12) -- and is shown here as the entry.
    '0|Motion[5]': { rage: true, sets: [[9], [13]] },
    // DEATH (status 11; Raven, 2026-09-21: "we do have Death States to take to consideration if the parts are broken
    // during the animations"). Every status-11 action start, in setAction 0x754f8's status-11 path (0x75b40..): rage is
    // cleared (0xba7b8(e, 0) at 0x75b90) and, uEm043_00's vtable +0x21c (0x6be7c) returning 0, 0xbd594(e, -1) sets the
    // eye flag P+0x5d02 with timer 0xffff (0x75c1c) -- which the +0x28 pass never counts down (a timer at or below -1 is
    // skipped, 0xae3b4 / 0xaf04c), so from then on 0x6f4e8 applies eye set A every frame: Savage's A / B / C are 5 / 1 /
    // -1 (0x71398 from 0xe72b14), set 5 = part 7 drawn -- the Eyes row's Closed. The same frame, the part driver's
    // death branch (0xe80a08..0xe80ae4, status byte == 0xb) plays Angry_End on the body-glow material at [+0xcac0]+0x90
    // -- XfB__m02_body_k, which the spawn left lit with Angry_Start -- from time 0, Gekikou_End on the two rage
    // materials if the stage was enraged (2), and locks the stage at 3; the body set follows the cleared rage: 9.
    // Rage ends as it always does: the aura and eyes stopped, left to run out.
    // Savage's death actions (0xe7dffc, number -> script): (11, 0) L3 Motion[18] (0x17c0a50); (11, 1) L3 Motion[32] ->
    // [33] -> [34] (0x17c0c70, a fall); (11, 7) L3 Motion[21] (pit); (11, 0x10) L3 Motion[14] -> [25] and (11, 0x12)
    // L3 Motion[21] (both read as capture: the same status, NOT READ as such). Only Motion[18] and Motion[34] play in
    // nothing but death (every other one is also a reaction: [32] / [33] a fall, [21] the pit, [14] / [25] sleep), so
    // only those two are listed. [34] begins at least 169 frames into the fall's death ([32]_start 70 + [33] 99; the
    // script's ops between them, 0xb / 1 / 4, are NOT READ), past Gekikou_End's 60 frames and most of Angry_End's 200:
    // shown settled, the glow already out.
    '3|Motion[18]': { dead: true, sets: [9, 5], clips: [{ mats: ['XfB__m02_body_k'], clip: 'Angry_End' }] },
    '3|Motion[34]': { dead: true, sets: [9, 5], clips: [{ mats: ['XfB__m02_body_k'], clip: 'Angry_End' }], settled: true },
    // AILMENTS AND TIREDNESS (states-em043.md 2-3; Raven, 2026-09-21: "yes I would like the 'aliment effects'"). Their
    // effects come from the +0x28 pass while the state holds (0xa4518, 0xa41b8, 0xa3ef0), each on a countdown the shared
    // timer 0x7206c keeps: at or below 0 it fires, and the code sets the period again -- so a state starts with one at
    // once and then one every period frames. These motions also play outside their state (the breaks' and states'
    // notes list them: [2] a flinch, [3] / [6] a leg's trip, [13] the shock trap's hold, L0 Motion[15] actions (1, 0)
    // and (1, 0x11)); each is shown here in the state named.
    // TIRED (2.5): the idle while tired, L0 Motion[15] ((0, 2), 0xe74410). Drool c 1104 (cm200_006, joint 3) while tired,
    // not enraged, not asleep: timer +0x5c70, 48.0 (0xa42d0..0xa4334; rage zeroes it, 0xa42a4). A tired monster is never
    // enraged (the gauge will not ask for rage while tired, 0xbcd20; tiredness does not start while enraged, 0x76200):
    // rage shown off, body set 9.
    '0|Motion[15]': { rage: false, sets: [9], every: [['em043_00c', 1104], 48] },
    // ASLEEP (3.2): (10, 0x1d) L3 Motion[14] falls asleep (ailment bit 1 set at its start, 0xa2800), (10, 0x1e) L3
    // Motion[25] holds -- and the rest sleep holds L3 Motion[25] too (+0x522, 0xe74738). While asleep (0x81bb0(e, 0))
    // the +0x28 pass sets the eye flag every frame (0xae3c0..0xae3f0): eye set 5, closed, as in death; and Savage's rage
    // controller stops the eyes (u 31) with 0x329c40(h, 0) while either sleep test holds, the aura left running, and
    // requests them again after (0xe8058c..0xe8061c). In the hold (0x81bb0(e, 1): (10, 0x1e) or the rest flag): zzz,
    // c 1102 (cm200_002, joint 3), timer +0x5c60, 90.0 (0xa3e60..0xa3ee8). Falling asleep has no zzz.
    '3|Motion[14]': { sets: [5], eyesOff: ['em043_05u', 31] },
    '3|Motion[25]': { sets: [5], eyesOff: ['em043_05u', 31], every: [['em043_00c', 1102], 90] },
    // PARALYSIS (3.2): (10, 0x1f) holds L3 Motion[13] (script 0x17c08e0). c 1101 (cm200_001, joint 1) while ailment bit
    // 4 is set: timer +0x5c60, 60.0 (0xa4554..0xa45c8).
    '3|Motion[13]': { every: [['em043_00c', 1101], 60] },
    // SHOCK TRAP (3.2): (10, 0x6e) plays L3 Motion[2] then holds L3 Motion[13] (0x17c0b50). c 1105 (cm200_001, joint 1)
    // while the action is (10, 0x6e) (0x80254): timer e+0xb7c8, 42.0 (0xa4854..0xa48bc). L3 Motion[13] is shown as
    // paralysis (above).
    '3|Motion[2]': { every: [['em043_00c', 1105], 42] },
    // STUN (3.2): (10, 0x20) plays L3 Motion[3] then holds L3 Motion[6] (0x17c0a00). c 1103 (cm200_003, joint 3) is
    // requested once into one handle while ailment bit 0x10 is set (0xa3f58..0xa4054) and stopped with 0x329c40(h, 0)
    // when it clears (0x6f124), at the recovery L3 Motion[7] (bit 0x10 cleared by changeAction, 0x80964).
    '3|Motion[3]': { hold: ['em043_00c', 1103] },
    '3|Motion[6]': { hold: ['em043_00c', 1103] },
  },
};

// THE LEVEL THE USER'S PARTS STAND AT, read from what they see: the highest level one of whose own parts -- drawn at
// that level, not at the one below -- is drawn. Read from the parts rather than the sets because the Parts panel may
// reach a level through a set the ROM does not use there: calm, its Face row's Broken is set 6 (part 5 alone,
// Deviljho's calm set), where Savage's driver always applies set 11 (parts 5 and 6, 0xe80cf4). table: the monster's
// .mpm sets; drawn: part -> drawn, the user's.
function userLevel(levels, table, drawn){
  if (!table || !drawn) return 0;
  const at = levels.map(sets => { const m = new Map(); for (const s of sets) for (const [p, v] of table[s] || []) m.set(p, v); return m; });
  let lv = 0;
  for (let k = 1; k < at.length; k++){
    const own = [...at[k]].filter(([p, v]) => v && at[k - 1].get(p) === false).map(([p]) => p);
    if (own.some(p => drawn.get(p) === true)) lv = k;
  }
  return lv;
}

export class MotionStates {
  constructor(){ this.cur = null; this.userDrawn = null; this.table = null; }
  // the records the motion holds on (hold) and the rage records it holds off (eyesOff), as 'pel|key' ids
  holds(){ return this.cur && this.cur.spec.hold ? [this.cur.spec.hold.join('|')] : []; }
  eyesOff(){ return this.cur && this.cur.spec.eyesOff ? [this.cur.spec.eyesOff.join('|')] : []; }

  // Once a frame, after the clip has been advanced. monId; list; clip: the motion's bare slot name (a _start/_loop pair
  // is one motion) or null; frame: its frame at 60 a second, counted over the whole slot; at: { loopStart, loopEnd,
  // loopSeg } -- where a _loop clip sits in its slot and ends (a _loop clip's wrap goes back to loopStart and is the
  // motion going on, not starting over; loopSeg: the clip is a _loop);
  // user: { rage } -- the user's own (their parts are what showParts last kept). Returns what the display has to follow:
  //   parts    the part sets shown changed (index.html re-applies the parts)
  //   rage     the rage shown changed (the materials' clock and the effects follow)
  //   entry    rage started over while it was already shown (a rage entry replayed): the effects and the materials'
  //            start clip run from this frame again
  //   fire     [[pel, key], ...] the effect records the game requests at this frame
  //   drop     the motion's frame 0 drops a cut tail (a sever: index.html stepCutTail flies it from here)
  //   holdOn / holdOff    [[pel, key], ...] event records to keep running from now / to stop now
  //   eyesOff / eyesOn    [[pel, key], ...] rage records to hold off from now / to let run again
  //   clips    the material clips shown changed (clips())
  //   settled  the motion began after its change's transitions were over: the materials' clock is to start settled
  // now: the wall clock the materials run on (seconds).
  step(monId, list, clip, frame, at, user, now = 0){
    const { loopStart = 0, loopEnd = 0, loopSeg = false } = at || {};
    const spec = (clip != null && MOTION_STATES[monId]) ? MOTION_STATES[monId][list + '|' + clip] || null : null;
    const key = spec ? monId + '|' + list + '|' + clip : null;
    const prev = this.cur;
    const rageBefore = this.rage(user.rage), setsBefore = this.setsKey(), clipsBefore = this.clipsKey();
    const holdsBefore = this.holds(), eyesBefore = this.eyesOff();
    const out = { parts: false, rage: false, entry: false, fire: [], clips: false, settled: false, drop: false,
                  holdOn: [], holdOff: [], eyesOff: [], eyesOn: [] };
    if (!spec) this.cur = null;
    else if (prev && prev.key === key && (frame >= prev.frame || loopSeg)){
      // the same motion, moving on -- across a _loop clip's wrap too: the countdowns run on the frames it advanced
      const d = frame >= prev.frame ? frame - prev.frame : Math.max(0, loopEnd - prev.frame) + Math.max(0, frame - loopStart);
      prev.frame = frame;
      for (const t of prev.timers){
        t.left -= d;
        if (t.left <= 0){ out.fire.push(t.rec); t.left = t.period; }     // 0x7206c at or below 0, then the period again
      }
    }
    else {
      // frame 0 of the motion: a new one, or the same one started over (a loop, a replay, the scrubber moved back)
      const c = { key, spec, frame, sets: null, rage: null, t0: now, timers: [] };
      if (spec.levels){
        const lv = Math.max(1, userLevel(spec.levels, this.table, this.userDrawn));
        c.sets = spec.levels[lv];
        if (spec.fire[lv]) out.fire.push(spec.fire[lv]);
      }
      if (spec.rage){
        c.rage = true;
        c.sets = spec.sets[1];
        out.entry = rageBefore;             // already shown: it starts over here all the same
      }
      if (spec.dead){
        c.rage = false;
        c.sets = spec.sets;
        out.settled = !!spec.settled;
        out.clips = true;                   // death's clips run from this frame (again, on a loop)
      }
      if (spec.rage === false) c.rage = false;
      c.frame0 = frame;
      if (spec.drops) out.drop = true;
      if (!spec.levels && !spec.dead && spec.sets && spec.rage !== true) c.sets = spec.sets;
      // a countdown starts at 0, so its record comes at once (0x7206c), and the period follows
      if (spec.every){ out.fire.push(spec.every[0]); c.timers.push({ rec: spec.every[0], period: spec.every[1], left: spec.every[1] }); }
      this.cur = c;
    }
    const holdsAfter = this.holds(), eyesAfter = this.eyesOff();
    const ids = s => s.split('|').map((x, i) => i ? +x : x);
    for (const h of holdsAfter) if (!holdsBefore.includes(h)) out.holdOn.push(ids(h));
    for (const h of holdsBefore) if (!holdsAfter.includes(h)) out.holdOff.push(ids(h));
    for (const h of eyesAfter) if (!eyesBefore.includes(h)) out.eyesOff.push(ids(h));
    for (const h of eyesBefore) if (!eyesAfter.includes(h)) out.eyesOn.push(ids(h));
    out.rage = this.rage(user.rage) !== rageBefore;
    out.parts = this.setsKey() !== setsBefore;
    out.clips = out.clips || this.clipsKey() !== clipsBefore;
    return out;
  }

  // the rage the display shows: the motion's while it plays (on at a rage entry, off in death), else the user's
  rage(userRage){ const o = this.rageOverride(); return o === null ? !!userRage : o; }
  rageOverride(){ return this.cur && this.cur.rage !== null && this.cur.rage !== undefined ? this.cur.rage : null; }
  setsKey(){ return this.cur && this.cur.sets ? this.cur.sets.join(',') : ''; }
  clipsKey(){ return this.cur && this.cur.spec.clips ? this.cur.key + '@' + this.cur.t0 : ''; }
  // the material clips the motion shows, for render/monster.js stepMatAnim: [{ mats, clip, rest, t0 }], each played
  // from t0 on the materials' clock and held at its end; a settled one is at its end already
  clips(){
    const c = this.cur;
    if (!c || !c.spec.clips) return null;
    return c.spec.clips.map(x => ({ mats: x.mats, clip: x.clip, rest: null, t0: c.spec.settled ? -1e9 : c.t0 }));
  }

  // THE PARTS SHOWN: `drawn` is the user's (part -> drawn, as the Parts panel makes it), kept for the level a break
  // starts from; the motion's sets are laid over it -- every part they name takes the set's value, in the order the
  // part driver applies them (0x72c78, later wins). table: the monster's .mpm sets (monsters.json `groups`).
  showParts(drawn, table){
    this.userDrawn = new Map(drawn);
    this.table = table;
    if (!this.cur || !this.cur.sets) return;
    for (const s of this.cur.sets) for (const [p, v] of (table && table[s]) || []) drawn.set(p, v);
  }
}
