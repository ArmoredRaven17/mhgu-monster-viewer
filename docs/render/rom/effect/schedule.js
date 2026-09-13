// WHEN A MONSTER'S EFFECTS RUN: the requests its own code makes, per the viewer's state.
//
// Each effect in docs/effects/<monster>.json carries `when` (C:\MHGU-Extract\efx\export_effects.py), the
// state in which the monster's code starts it (E:\offline\decode\notes\effects-firing.md):
//   'always'     from the moment the monster is shown. Teostra's fire aura (em027_00_011 key 0) runs while
//                a byte its own code sets and clears is on (0xe10f7c); the cases that set and clear it
//                (its hook, 0xe107ac) are not read as states the viewer has, so it is shown throughout.
//   'rage'       while enraged (Savage Deviljho's aura and eyes, em043_05_000 keys 30 / 31)
//   'rageStart'  once, as rage turns on (Teostra's burst, em027_00_019 key 2)
//   'rageEnd'    once, as rage turns off (em027_00_019 key 3)
// An entry without `when` is a 'rage' effect, as the viewer showed every effect before it had the field.
//
// A request that has run its course (proof.js finished()) is dropped, and units the passes no longer act
// on come off the list (pruneUnits). Leaving rage takes a 'rage' effect off at once: how the game ends a
// running effect is not read. Every start builds the request anew -- the heap is a bump allocator, so each
// costs its objects for good; a start allocates once, its frames do not.
//
// The same class runs in the viewer (live.js) and headless (dev/effect-export-rom.mjs), so what the pages
// export and the soak exercise is what the viewer does.
const hex = h => Uint8Array.from(h.match(/../g) || [], b => parseInt(b, 16));

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
      } else if (e.when === 'always' || (e.when === 'rage' && this.rage)) this.start(e);
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
      if (e.when === 'rage'){
        if (on) this.start(e);
        else { for (const q of e.requests) this.host.releaseRequest(q); e.requests.length = 0; }
      } else if (e.when === (on ? 'rageStart' : 'rageEnd')) this.start(e);
    }
  }

  // one 1/60 s step: the unit passes over every request, then the plain effects' moves
  step(){
    this.host.unitFrame();
    for (const e of this.entries) if (!e.def.record) this.host.move(e.owner);
    this.host.pruneUnits();
    for (const e of this.entries) if (e.requests.length) e.requests = e.requests.filter(q => !q.finished());
  }

  // the effects to draw this frame
  effects(){ return this.entries.flatMap(e => e.def.record ? e.requests.flatMap(q => q.effects()) : [e.owner]); }
  // requests and plain effects running
  get running(){ return this.entries.reduce((n, e) => n + (e.def.record ? e.requests.length : 1), 0); }
}
