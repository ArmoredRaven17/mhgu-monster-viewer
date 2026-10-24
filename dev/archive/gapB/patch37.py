# patch37.py (gapB, 2026-10-20): applies the em037 shell01 mode 1 build to a COPY of docs/render/shells.js.
#   python patch37.py <src shells.js> <dst>     (default: the repo file -> gapB/shells.patched.js)
# Every edit is an exact-text replacement that must match ONCE (the script stops otherwise), so the same edits can be applied to the
# live file by the shells agent (or with this script pointed at it). The relative imports are rewritten to file URLs only in the copy
# (--copy-imports, the default for the gapB copy).
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = sys.argv[1] if len(sys.argv) > 1 else r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
dst = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'shells.patched.js')
copy_imports = '--live' not in sys.argv
s = open(src, encoding='utf8').read()

EDITS = []
def edit(old, new): EDITS.append((old, new))

# 1. the header's NOT MODELLED entry (lines ~117-119)
edit("""  //   * spikes (em037_00): as the rocks (the owner's turn during M7 / M8 is NOT READ: input.owner.y instead); shell01
//     mode 1 (the ground impact c 30 of L0 M28 f20, L1 M1 f60, L1 M2 f2): not built -- its lifetime rests on the hit
//     slots and L1 M2's condition 0x6fe88 is not read (notes 6, 11); its data is in SHELL_DATA.
""".replace('  //   * spikes', '//   * spikes'),
"""//   * spikes (em037_00): as the rocks (the owner's turn during M7 / M8 is NOT READ: input.owner.y instead). shell01
//     mode 1 (the ground impact c 30 of L0 M28 f20, L1 M1 f60, L1 M2 f2) IS built (perFrame037, 2026-10-20): L1 M2's
//     condition 0x6fe88(e, 3, 5) is the current-action test (rom-map), and its life is hit slot 1, (14, 10), as every
//     timer-0 base01 shell's (input.hitLife; who steps the slots, 0x168d30's caller, is the shared NOT READ above).
""")

# 2. Nargacuga's shell01: the reader, the hit records and the hitdata (the files' own: em037_00_01_hit000 / hit001 int 0 / 1,
#    em037_00_01_hitdata (HDS v0x20160209, 2 records): (0, 30), (14, 10))
edit("""      // Mode 1 is the ground impact the per-frame 0xe47b0c spawns in three landing motions: not built (see the header).
      shell01: {
        id: 0xc9, cls: 'uShellEm037_sp_01', base: 'base01', folder: 'shell\\\\em\\\\em037_00_shell01',""",
"""      // Mode 1 is the ground impact the frame handler 0xe47b0c makes on L0 M28 f20 / L1 M1 f60 / L1 M2 f2 (perFrame037):
      // flags 0x1080 -> base01's owner-ground arm (at (block x, ground, block z), deleted 900 above it); timer 0.0 -> it lives
      // while hit slot 1 is on (em037_00_01_hit001 = record 1, (14, 10)); c 30 (cm200_040) from its init.
      shell01: {
        id: 0xc9, cls: 'uShellEm037_sp_01', base: 'base01', reader: 0xe597e4, folder: 'shell\\\\em\\\\em037_00_shell01',""")
edit("""          0: { scale: 1.0, ef: [[999, -1]], sh: { ints: [-1, -1, -1, -1], floats: [0.0], vecs: [[0.0, 0.0, 0.0]] } },
          1: { scale: 1.0, ef: [[0, 30]], sh: { ints: [0, -1, -1, 0], floats: [0.0], vecs: [[0.0, 0.0, 0.0]] } },
        },""",
"""          0: { scale: 1.0, ef: [[999, -1]], hit: [0], sh: { ints: [-1, -1, -1, -1], floats: [0.0], vecs: [[0.0, 0.0, 0.0]] } },
          1: { scale: 1.0, ef: [[0, 30]], hit: [1], sh: { ints: [0, -1, -1, 0], floats: [0.0], vecs: [[0.0, 0.0, 0.0]] } },
        },
        // em037_00_01_hitdata (HDS v0x20160209, 2 records of 0x38 B from +0x10): (s16 delay, s16 duration) -- Silverwind's file
        // has the same two records
        hitdata: [[0, 30], [14, 10]],""")

# 3. Nargacuga's frame-handler rows, after his actions (the end of SHELL_DATA.em037_00)
edit("""      { action: [7, 0x84], code: 0xe55030, args: [1], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [0, 4], modes: [19, 20, 21, 22, 23], pick: 'ai', variant: '7:0x84' },
    ],
  },
""",
"""      { action: [7, 0x84], code: 0xe55030, args: [1], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [0, 4], modes: [19, 20, 21, 22, 23], pick: 'ai', variant: '7:0x84' },
    ],
    // the frame handler vt+0x208 0xe47b0c's three shell01 sites (perFrame037): the motion id, the frame its 0xb0968(e, 0, 0, F, 0.0)
    // crosses (0x72714 mode 0, channel 0: pass001), the mode; `noAction`: 0x6fe88(e, 3, 5) != 0 skips the site (the action is (3, 5))
    perFrame037: [
      { ids: [0x01c], frames: [20.0], mode: 1, site: 0xe47e58 },                           // L0 M28
      { ids: [0x101], frames: [60.0], mode: 1, site: 0xe482e4 },                           // L1 M1
      { ids: [0x102], frames: [2.0], mode: 1, noAction: [[3, 5]], site: 0xe47c98 },        // L1 M2
    ],
  },
""")

# 4. Silverwind: his shell01 comment, and the same rows (one class, one handler; [e+0xcc98] = 0xcb for variant 4)
edit("""is (999, -1); timer 0.0, so it lives while hit slot 0 is on (record 0: (0, 30)). Mode 1 (c 30, em037_00c, the ground impact
    // of the per-frame 0xe47b0c) is not built, as Nargacuga's (its life rests on the hit slots and L1 M2's condition 0x6fe88).""",
"""is (999, -1); timer 0.0, so it lives while hit slot 0 is on (record 0: (0, 30)). Mode 1 (c 30, em037_00c, the ground impact
    // of the frame handler 0xe47b0c, perFrame037: his [e+0xcc98] is 0xcb) lives while hit slot 1 is on (record 1: (14, 10)).""")
edit("""  spawner: SHELL_DATA.em037_00.spawner,
  actions: [
    // the spike throws: Nargacuga's rows,""",
"""  spawner: SHELL_DATA.em037_00.spawner,
  // the frame handler 0xe47b0c is the class's: Nargacuga's three sites, shell01 = his 0xcb (no variant test on those arms)
  perFrame037: SHELL_DATA.em037_00.perFrame037,
  actions: [
    // the spike throws: Nargacuga's rows,""")

# 5. the handler, after Malfestio's perFrame079
edit("""    if (S){ S.perFrame = mid; state.shells.push(S); out.spawned.push(S); }
  }
}

// ---- SELTAS QUEEN (em069_00) / SELTAS (em076_00): readers, landings, base37, the spawners -----------------------------------""",
"""    if (S){ S.perFrame = mid; state.shells.push(S); out.spawned.push(S); }
  }
}
// NARGACUGA's / SILVERWIND's frame handler vt+0x208 0xe47b0c (READ whole, 0xe47b0c..0xe48578, literals ..0xe485cc; the next function
// 0xe485d0 is the one it calls first; gapB 2026-10-20). By the motion id 0xb0944: table 0xe47b4c (id - 2 <= 0x20), table 0xe47c20
// (id - 0x201 <= 0x14), else 0x101 / 0x102 by compare. Three arms make shell01 [e+0xcc98] (0xc9 / Silverwind's 0xcb) MODE 1, each on
// 0xb0968(e, 0, 0, F, 0.0) (0x72714 mode 0, channel 0: pass001): L0 M28 (0x1c) F 20.0 (0xe47e58), L1 M1 (0x101) F 60.0 (0xe482e4),
// L1 M2 (0x102) F 2.0 only while 0x6fe88(e, 3, 5) == 0 -- the action is not (3, 5) (0xe47c98). The 0x40 request (0x3fa2bc): +0
// 0x174e638 + 8, +4 [e+0xcc98], +8 1, +0xc e, +0x10.. (e+0x40, e+0x10f0, e+0x48), +0x1c 0, +0x20.. [[0x1831a78]], +0x2c 0, +0x30..
// [[0x18321b0]] = 0x1620e60, THE ZERO VECTOR (not his words, as Malfestio's / Tigrex's), +0x3c 0xffff -> 0x48b884 (tail 0xe48394).
// No height gate in the handler (Tigrex's has one): base01's flag-0x80 arm (init011) puts it at (block x, ground, block z), the
// setup's +0x10 unread there, and deletes it 900 above the ground. The arms test no variant, rage or tired. Every other arm of the
// handler is a hit record (0x7db70) or 0xc241c -- no create (the census fb/pfgen.py over every overridden slot +0x190..+0x240 and
// every shipped motion finds these three only, both variants). The facing is not required: the 0x80 arm turns the zero vec by it.
function perFrame037(state, D, ctx, input, out, fresh, a){
  const mid = motionIdOf(input.list, input.clip);
  if (mid == null || fresh || !state.hist) return;
  const row = D.perFrame037.find(r => r.ids.includes(mid));
  if (!row) return;
  const acts = a ? [a.action].concat(a.also || []) : [];
  if (row.noAction && acts.some(x => row.noAction.some(n => n[0] === x[0] && n[1] === x[1]))) return;
  for (const F of row.frames){
    if (!pass001(state, f(F))) continue;
    const own = ctx.own001, why = missing001(own, { pos: true, ground: true });
    if (why){ out.refused.push({ perFrame: mid, shell: 'shell01', mode: row.mode, why }); continue; }
    const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode: row.mode, position: own.ownerPos.slice(), angles: [0, 0, 0], frame: F },
                      own, state.prevJoints, ctx, null);
    if (S){ S.perFrame = mid; state.shells.push(S); out.spawned.push(S); }
  }
}

// ---- SELTAS QUEEN (em069_00) / SELTAS (em076_00): readers, landings, base37, the spawners -----------------------------------""")

# 6. the dispatch, beside Malfestio's
edit("""  if (D.perFrame079) perFrame079(state, D, ctx, input, out, fresh, a);
""",
"""  if (D.perFrame079) perFrame079(state, D, ctx, input, out, fresh, a);
  if (D.perFrame037) perFrame037(state, D, ctx, input, out, fresh, a);   // Nargacuga's / Silverwind's frame handler 0xe47b0c (shell01 mode 1), line 4
""")

for old, new in EDITS:
    n = s.count(old)
    if n != 1: sys.exit('anchor matched %d times:\n%s' % (n, old[:200]))
    s = s.replace(old, new)
if copy_imports:
    base = 'file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/'
    for m in ('beam-types.js', 'beam-groups.js', 'beam-spawns.js'):
        assert s.count("from './%s'" % m) == 1, m
        s = s.replace("from './%s'" % m, "from '%s%s'" % (base, m))
crlf = b'\r\n' in open(src, 'rb').read(4096)   # keep the source's line ends (shells.js is CRLF)
open(dst, 'w', encoding='utf8', newline='\r\n' if crlf else '\n').write(s)
print('patched', len(EDITS), 'edits ->', dst)
