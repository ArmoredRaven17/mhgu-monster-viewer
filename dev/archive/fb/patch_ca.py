p = 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/motion-states.js'
s = open(p, encoding='utf8').read()

def rep(old, new, n=1):
    global s
    assert s.count(old) == n, (old[:80], s.count(old))
    s = s.replace(old, new)

# 1. the same motion moving on: clipsFrom crossings (next to fireFrom)
rep("""        for (const [f, recs] of prev.spec.fireFrom) if (prev.frame < f && frame >= f) for (const rec of recs) out.fire.push(rec);
      prev.frame = frame;""",
"""        for (const [f, recs] of prev.spec.fireFrom) if (prev.frame < f && frame >= f) for (const rec of recs) out.fire.push(rec);
      // `clipsFrom: [[frame, [{ mats, clip }]], ...]` -- material clips the motion sets as it passes that frame (a class's frame
      // test, 0xb0974; Gore Magala's C+0xca at the death motions, 0xfbf890), held for the rest of it, each from its crossing
      if (prev.spec && prev.spec.clipsFrom && frame >= prev.frame)
        for (const [f] of prev.spec.clipsFrom) if (prev.frame < f && frame >= f && prev.clipsAt[f] === undefined) prev.clipsAt[f] = now;
      prev.frame = frame;""")

# 2. a new motion: its own clipsAt (a play started past the frame has crossed it)
rep("""      const c = { key, spec, frame, sets: null, rage: null, t0: now, timers: [] };""",
"""      const c = { key, spec, frame, sets: null, rage: null, t0: now, timers: [], clipsAt: {} };
      if (spec && spec.clipsFrom) for (const [f] of spec.clipsFrom) if (frame >= f) c.clipsAt[f] = now;""")

# 3. clipsKey / clips
rep("""  clipsKey(){ return this.cur && this.cur.spec.clips ? this.cur.key + '@' + this.cur.t0 : ''; }""",
"""  clipsKey(){ const c = this.cur;
              return c && (c.spec.clips || c.spec.clipsFrom) ? c.key + '@' + c.t0 + '|' + Object.keys(c.clipsAt || {}).join(',') : ''; }""")
rep("""    const c = this.cur;
    if (!c || !c.spec.clips) return null;
    return c.spec.clips.map(x => ({ mats: x.mats, clip: x.clip, rest: null, t0: c.spec.settled ? -1e9 : c.t0 }));""",
"""    const c = this.cur;
    if (!c || !(c.spec.clips || c.spec.clipsFrom)) return null;
    const out = (c.spec.clips || []).map(x => ({ mats: x.mats, clip: x.clip, rest: null, t0: c.spec.settled ? -1e9 : c.t0 }));
    for (const [f, list] of c.spec.clipsFrom || [])
      if (c.clipsAt && c.clipsAt[f] !== undefined) for (const x of list) out.push({ mats: x.mats, clip: x.clip, rest: null, t0: c.clipsAt[f] });
    return out.length ? out : null;""")

# 4. the Gore line's death rows
rep("""      '3|Motion[22]':   Object.assign({ dead: true }, shut),
      '3|Motion[21]':   Object.assign({ dead: true, settled: true }, shut),
      '3|Motion[34]':   Object.assign({ dead: true }, shut),""",
"""      '3|Motion[22]':   Object.assign({ dead: true }, shut),
      '3|Motion[21]':   Object.assign({ dead: true, settled: true }, shut, lightOut(238)),
      '3|Motion[34]':   Object.assign({ dead: true }, shut, lightOut(504)),""")
rep("""    const shut = v === 'shagaru' ? { sets: [7] } : {};
    const all = v !== 'shagaru';                         // Shagaru's c.pel has no 1104 / 1105 / 1109""",
"""    const shut = v === 'shagaru' ? { sets: [7] } : {};
    const all = v !== 'shagaru';                         // Shagaru's c.pel has no 1104 / 1105 / 1109
    // THE BODYLIGHT GOES OUT IN DEATH (0xfbf890..0xfbf96c, READ 2026-10-21): at action 0xb, motion 0x315 (L3 M21) crossing f238 with
    // sub < 2, or 0x322 (L3 M34) crossing f504 with sub 7 (0xb0974), C+0xca = 1 -- and the part pass's head (0xfbf9ac) then takes tier 0,
    // setMatClip(C+0x94, 0, C+0xa4[0]) = BodyLight_Normal on the MRL id 0x3d material (XfB_W__m01_kasan), the slot's time zeroed. Only
    // em 0x47 runs that clip (Gore Magala and Chaotic; Shagaru has no such material). L3 M34 is 311 frames: the channel-0 frame stops
    // at the motion's length (0x72714), so f504 is never crossed -- transcribed as the ROM has it.
    const lightOut = f => v === 'shagaru' ? {} : { clipsFrom: [[f, [{ mats: ['XfB_W__m01_kasan'], clip: 'BodyLight_Normal' }]]] };""")
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
