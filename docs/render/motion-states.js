// ANIMATIONS THAT CARRY A PART BREAK OR A STATE CHANGE, shown the way the game shows them, over the user's own choices.
//
// Raven, 2026-09-21: "Animations that involve part breaks or state changes should show that. If the user sets a part to
// be broken, toggle the part to intact to display the part break, same for different states. This way the animation can
// play out, but we keep the user's toggle choices."
//
// A motion listed here changes what the viewer SHOWS while it plays and nothing the user chose -- index.html's `state`,
// the Parts panel, the Enraged checkbox and the saved view all stay as they are. From the frame the ROM makes the change,
// the display takes the motion's state (the part sets, the rage), and that change's own effects are requested there;
// when the motion is over -- another clip, the bind pose, or a play-once clip at its end -- the display goes back to the
// user's choices by the game's own way out (a part's set; rage's stop request and Gekikou_End).
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
// set and leaves the head and tail as the user has them, and a break shows its own part's sets and nothing else.
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
    // The cut tail -- uEnemyOption slot 0, put at the monster's position + 20 up (0xc2390..0xc2408) -- is not shown here:
    // its update, model and motion are NOT READ.
    '3|Motion[15]': { part: 'tail', levels: [[10], [12]], fire: [null, ['em043_05u', 900]] },
    // RAGE ENTRY (states-em043.md 1.2). The gauge's request makes the forced transition set rage (0xbcdb0) and start
    // action (1, 2) (command group 6 stream 0), whose phase 0 sets L0 Motion[5] from frame 0 (0xe74d10); the same frame's
    // +0x28 pass requests the aura (u 30, joint 103) and the eyes (u 31, joint 3) (0xe80500), plays Gekikou_Start on the
    // body materials from time 0 (0xe80b10..0xe80bc4) and shows body set 13 in place of 9 (0xe80bc8..0xe80bfc).
    // L0 Motion[5] also plays with no rage change -- the roar after paralysis and after the shock trap (scripts
    // 0x17c08f0 and 0x17c0bd0), action (1, 0x12) -- and is shown here as the entry.
    '0|Motion[5]': { rage: true, sets: [[9], [13]] },
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

  // Once a frame, after the clip has been advanced. monId; list; clip: the motion's bare slot name (a _start/_loop pair
  // is one motion) or null; frame: its frame at 60 a second, counted over the whole slot; loopStart: where a _loop clip
  // sits in its slot (0 for a whole clip) -- its wrap goes back there and is the motion going on, not starting over;
  // ended: a play-once clip held at its end; user: { rage } -- the user's own (their parts are what showParts last
  // kept). Returns what the display has to follow:
  //   parts    the part sets shown changed (index.html re-applies the parts)
  //   rage     the rage shown changed (the materials' clock and the effects follow)
  //   entry    rage started over while it was already shown (a rage entry replayed): the effects and the materials'
  //            start clip run from this frame again
  //   fire     [[pel, key], ...] the effect records the game requests at this frame
  step(monId, list, clip, frame, loopStart, ended, user){
    const spec = (clip != null && !ended && MOTION_STATES[monId]) ? MOTION_STATES[monId][list + '|' + clip] || null : null;
    const key = spec ? monId + '|' + list + '|' + clip : null;
    const prev = this.cur;
    const rageBefore = this.rage(user.rage), setsBefore = this.setsKey();
    const out = { parts: false, rage: false, entry: false, fire: [] };
    if (!spec) this.cur = null;
    else if (prev && prev.key === key && (frame >= prev.frame || (loopStart > 0 && frame >= loopStart)))
      prev.frame = frame;                                                                // the same motion, moving on
    else {
      // frame 0 of the motion: a new one, or the same one started over (a loop, a replay, the scrubber moved back)
      const c = { key, spec, frame, sets: null, rage: false };
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
      this.cur = c;
    }
    out.rage = this.rage(user.rage) !== rageBefore;
    out.parts = this.setsKey() !== setsBefore;
    return out;
  }

  // the rage the display shows: the motion's while it plays, else the user's
  rage(userRage){ return this.cur && this.cur.rage ? true : !!userRage; }
  setsKey(){ return this.cur && this.cur.sets ? this.cur.sets.join(',') : ''; }

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
