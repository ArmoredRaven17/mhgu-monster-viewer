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
// nothing to kill). Any other 'rage' effect comes off at once: how the game ends Savage's is not read.
//
// A request that has run its course (proof.js finished()) is dropped, and units the passes no longer act
// on come off the list (pruneUnits). Every start builds the request anew -- the heap is a bump allocator, so
// each costs its objects for good; a start allocates once, its frames do not.
//
// The same class runs in the viewer (live.js) and headless (dev/effect-export-rom.mjs), so what the pages
// export and the soak exercise is what the viewer does.
const hex = h => Uint8Array.from(h.match(/../g) || [], b => parseInt(b, 16));

// How long a stopped clip effect keeps stepping (undrawn) so its particles die and free their pool slots
// before it is taken off the passes. Its emitters are already off, so this bounds the fade, not the leak.
const STOP_FRAMES = 90;

export class EffectSchedule {
  // host: the EffectHost; parent: its parent unit; entries: [{ owner, def }] (def: one of the json's effects)
  constructor(host, parent, entries, rage = false){
    this.host = host;
    this.parent = parent;
    this.rage = !!rage;
    this.starts = 0;
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

  // one 1/60 s step: the unit passes over every request, then the plain effects' moves
  step(){
    this.frame = (this.frame || 0) + 1;
    this.host.unitFrame();
    for (const e of this.entries) if (!e.def.record) this.host.move(e.owner);
    this.host.pruneUnits();
    for (const e of this.entries){
      if (e.requests.length) e.requests = e.requests.filter(q => !q.finished());
      // A stopped clip effect dies out here: its emitters are off (stopClip) so its live particles age and
      // die over the next frames, freeing their pool slots. Keep stepping it (unitFrame walks state.units)
      // until it finishes, or STOP_FRAMES pass -- then take it off the passes. Not drawn while it dies.
      if (e.dying && e.dying.length) e.dying = e.dying.filter(q => {
        if (q.finished() || this.frame >= q.dieBy){ this.host.releaseRequest(q); return false; }
        return true;
      });
    }
  }

  // CLIP-DRIVEN effects (when: 'clip'): an attack animation's PSL effects, started and stopped by the clip's
  // own frame (render/monster.js CLIP_EFFECTS, driven from index.html's render loop by pose.action.time), not by
  // a monster state. A 'clip' effect is never auto-started (the constructor only starts 'always'/'rage'); these
  // are the only way it runs. Idempotent: startClip does nothing if it is already running.
  // `key` is the PSL's effectNo, which IS the pel record's key. One .efl can have MANY records on different
  // joints with different masks (Bloodbath's em007_04_000 has seven), and the PSL names exactly which one a
  // motion fires -- so match on it when the binding carries it. A binding without a key matches by file
  // alone, as before, so the monsters wired that way are untouched.
  startClip(efl, key){
    for (const e of this.entries)
      if (e.when === 'clip' && e.def.record && (e.def.efl || '').endsWith(efl) && !e.requests.length
          && (key == null || e.def.record.key === key)) this.start(e);
  }
  // Stop a clip effect the ROM's way: stopRequest (0x329c40) turns its emitters off so its live particles
  // age out and DIE, freeing their pool slots -- then it is taken off the passes once dead (step). Releasing
  // it outright (as before) orphaned those particles: their slots (L_4187c's +0x74 mask) stayed set, so after
  // ~15 loops a slot group filled (0xffffffff) and the request builder walked into unrecorded code (0x418d4),
  // which stopped every effect until a page refresh (Raven, 2026-09-15). The dying request is not drawn.
  stopClip(efl, key){
    for (const e of this.entries)
      if (e.when === 'clip' && (e.def.efl || '').endsWith(efl)
          && (key == null || (e.def.record && e.def.record.key === key))){
        for (const q of e.requests){ if (!q.stopped) this.host.stopRequest(q); q.dieBy = (this.frame || 0) + STOP_FRAMES; (e.dying || (e.dying = [])).push(q); }
        e.requests.length = 0;
      }
  }

  // the effects to draw this frame (a dying, stopped request is stepped to free its slots but not drawn)
  effects(){ return this.entries.flatMap(e => e.def.record ? e.requests.flatMap(q => q.effects()) : [e.owner]); }
  // requests and plain effects running (a dying one still holds memory and pool slots, so it counts)
  get running(){ return this.entries.reduce((n, e) => n + (e.def.record ? e.requests.length + (e.dying ? e.dying.length : 0) : 1), 0); }
}
