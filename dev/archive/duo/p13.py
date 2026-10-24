p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\monster.js'
s = open(p, encoding='utf-8').read()
old = """    'Motion[33] with her 7:0x4e': { his: 'Motion[33]',
      body: [['0', 'Motion[65]', { frames: 105 }], ['4', 'Motion[42]', { start: 90, blend: 8 }]],
      hisSeq: [{ clip: 'Motion[33]', frames: 105 }, { clip: 'Motion[33]', start: 105 }] },"""
new = """    // HIS 7:0x3f, PHASE BY PHASE (0xfd58ac, table 0xfd59cc; the shells agent's read, dev/em069-em076-shells-spec.md 2b): M33 from
    // the turn record; the turn to f40 (0xfd5a90), then 20 frames more to f60 (phase 2, P+0x1bc = 20.0); at f60 M33 AGAIN FROM
    // 40 b4 (0xfd5dc0) and the spits (phase 3: 0xfd4b00 at the crossings 68 / 88 / 96, two a crossing); at f100 +0x6c += 1 and,
    // while <= 2, M33 from 100 b4 (0xfd5d48) and phase 2 to f120 (0xfd5c58: 120.0), then from 40 again -- THREE sets, the third
    // one spit a crossing (+0x6c == 2); after the third the flag +0x6b at f105 (0xfd5a40: 105.0), 285 frames in. Her 7:0x4e L0
    // M65 loops under him until she sees the flag, then her 7:0x4f: L4 M42 from 90 b8. His turns (+-11 / +-22 degrees,
    // 0x76dd0) are not shown (his facing on her is her joint's).
    'Motion[33] with her 7:0x4e': { his: 'Motion[33]',
      body: [['0', 'Motion[65]', { frames: 285, loop: true }], ['4', 'Motion[42]', { start: 90, blend: 8 }]],
      hisSeq: [{ clip: 'Motion[33]', frames: 60 },
               { clip: 'Motion[33]', start: 40, frames: 60, blend: 4 }, { clip: 'Motion[33]', start: 100, frames: 20, blend: 4 },
               { clip: 'Motion[33]', start: 40, frames: 60, blend: 4 }, { clip: 'Motion[33]', start: 100, frames: 20, blend: 4 },
               { clip: 'Motion[33]', start: 40, frames: 65, blend: 4, spitSet: 3 }, { clip: 'Motion[33]', start: 105 }] },"""
assert s.count(old) == 1
s = s.replace(old, new)
open(p, 'w', encoding='utf-8').write(s)

p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\index.html'
s = open(p, encoding='utf-8').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, a[:70]
    s = s.replace(a, b)
rep("""    pieces.push({ clip: bc, frames: fr, mode: /_loop$/.test(cn) ? 'wrap' : 'play', start: st / 60, blend: o.blend || 0, name: lid + '|' + cn + (st ? '@' + st : '') });""",
    """    pieces.push({ clip: bc, frames: fr, mode: /_loop$/.test(cn) || o.loop ? 'wrap' : 'play', start: st / 60, blend: o.blend || 0, name: lid + '|' + cn + (st ? '@' + st : '') });""")
rep("""                       layout: c.body.map(([lid, cn, o = {}], i) => ({ list: String(lid), clip: cn, start: o.start || 0, frames: pieces[i].frames })) };""",
    """                       layout: c.body.map(([lid, cn, o = {}], i) => ({ list: String(lid), clip: cn, start: o.start || 0, frames: pieces[i].frames, loop: !!o.loop })) };""")
rep("""      if (len > 0) f = /_loop$/.test(r.clip) ? f % len : Math.min(f, len);     // a _loop piece wraps, a play holds its end""",
    """      if (len > 0) f = /_loop$/.test(r.clip) || r.loop ? f % len : Math.min(f, len);     // a _loop piece (or a looped one) wraps, a play holds its end""")
# the third spit set: one spit a crossing (the row '7:0x3f/3', shells.js)
rep("""  if (k && her && her.list === '0' && /^Motion\[65\]/.test(her.clip) && k[2] === 'Motion[33]') variant = '7:0x3f';""",
    """  if (k && her && her.list === '0' && /^Motion\[65\]/.test(her.clip) && k[2] === 'Motion[33]'){
    variant = '7:0x3f';
    // (his third set, +0x6c == 2: 0xfd4b00(e, 1), one spit a crossing -- the layout piece marked `spitSet: 3`)
    const pk = p.a.pick, hf = pose.action ? Math.round(pose.action.time * 60) : 0;
    const seg = pk && pk.layout ? pk.layout.find(x => hf >= x.from && hf < x.from + x.frames) : null;
    if (seg && seg.spitSet === 3) variant = '7:0x3f/3';
  }""")
rep("""    layout.push({ from: at, frames: fr, clip: x.clip, list: x.list || null, mode: /_loop$/.test(x.clip) ? 'wrap' : 'play', start: st, dur: seqFrames(pc) });""",
    """    layout.push({ from: at, frames: fr, clip: x.clip, list: x.list || null, mode: /_loop$/.test(x.clip) ? 'wrap' : 'play', start: st, dur: seqFrames(pc),
                  spitSet: x.spitSet || null });""")
open(p, 'w', encoding='utf-8').write(s)

p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(p, encoding='utf-8').read()
old = """  act0697('em076', 7, 0x3f, '4', 'Motion[33]', [68, 88, 96].map(F => ({ frame: F, spit: 2 })), { pick: 'duo' }),
];"""
assert s.count(old) == 1
new = """  act0697('em076', 7, 0x3f, '4', 'Motion[33]', [68, 88, 96].map(F => ({ frame: F, spit: 2 })), { pick: 'duo' }),
  // its THIRD set (+0x6c == 2 -> 0xfd4b00(e, 1)): one spit a crossing -- named '7:0x3f/3' by the viewer's 7:0x3f layout (duo agent)
  Object.assign(act0697('em076', 7, 0x3f, '4', 'Motion[33]', [68, 88, 96].map(F => ({ frame: F, spit: 1 })), { pick: 'duo' }), { variant: '7:0x3f/3' }),
];"""
s = s.replace(old, new)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
