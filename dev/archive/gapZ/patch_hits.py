P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(P, 'rb').read().decode('utf8'); nl = '\r\n' if '\r\n' in s else '\n'
def rep(old, new):
    global s
    o = old.replace('\n', nl); n = new.replace('\n', nl)
    assert s.count(o) == 1, (old[:80], s.count(o)); s = s.replace(o, n)
rep("""// the bolts one lightning action makes, all in the same step: 0xd16e08's index table 0xd16f30 names the modes
function spawnBolts(state, D, a, J, ctx, got, out){""",
"""// THE BOLTS' HIT (shells lane, 2026-10-27; READ): sp_03's reader 0xd21b10 reads HitParam int 0 (0x4a23f4, r1 0) into +0x15d8 (0xd21b38),
// the record base00's registration (vt+0x164 0x3f9aec -> vt+0x140 at 0x3f9b4c, +0x15d8 at 0x3f9b04) arms slot 0 with: the files'
// em003_00_03_hit000..011 int 0, hit012..019 int 1, hit020 int 2 (em003_00.arc). Records 0 / 1 / 2 are alike (em003_00_03_hitdata: delay 0,
// duration 99, kind 1, group 0 -> hitsize group 0: one capsule j0 1001, +0x40 to +0x1000 -- this move's point and the last, 0x3fdd0c --
// radius 150). So each bolt hits along its OWN LINE as it runs out (a 150-radius capsule over its last step, x ScaleRate under Hyper: 195),
// the wedges between the lines are not touched; no angle test anywhere in its contact (0x16da04 / 0x16dc10 kind 2, the plain capsule).
for (const [m, md] of Object.entries(SHELL_DATA.em003_00.shells.shell03.modes)) if (!md.hit) md.hit = [+m < 12 ? 0 : +m < 20 ? 1 : 2];

// the bolts one lightning action makes, all in the same step: 0xd16e08's index table 0xd16f30 names the modes
function spawnBolts(state, D, a, J, ctx, got, out){""")
rep("""function segPointT(C, P){""",
"""// THE SHELLS' LIVE HIT SHAPES for the Attack Hitboxes overlay (index.html stepShellHits): every live shell's slots that are on, through
// shellHitShapes -- world shapes in game units ({ type 1 sphere c / type 2 capsule p0 p1 / type 3, r }). The slots are the hunter pass's
// (S.slots / S.hslots, counted per step while the Solid hunter is out); a shell that pass has not counted (no Solid hunter) is shown by its
// moves since its making against its records' delay / duration (a stand-in for slotStep's count, named)
export function shellHitShapesLive(state){
  const D = state && state.data, out = [];
  if (!D) return out;
  for (const S of state.shells){
    if (S.state === 0xff || (S.state & 0xfe) === 0xfe || !S.position) continue;
    const def = S.base === 'base02g' ? (S.type && S.type.folder ? { folder: S.type.folder } : null) : (S.D57 || D).shells[S.shell];
    if (!def) continue;
    const HS = HITSHAPES[def.folder] || {}, hitrec = def.hitrec || HS.hitrec, hitsize = def.hitsize || HS.hitsize;
    if (!hitrec || !hitsize) continue;
    let slots = S.slots || S.hslots;
    if (!slots){
      const mh = (S.mode && S.mode.hit) || (S.base === 'base02g' && S.type && S.type.hit ? [S.type.hit[0]] : []), age = S.moves | 0;
      slots = [0, 1].map(slot => { const idx = mh[slot]; if (idx == null || idx < 0 || !hitrec[idx]) return null;
        return { slot, record: idx, on: age < f(hitrec[idx][0]) + f(hitrec[idx][1]), delay: f(f(hitrec[idx][0]) - age) }; }).filter(Boolean);
    }
    for (const sl of slots){
      if (!(sl.on && !(sl.delay > 0))) continue;
      const rec = hitrec[sl.record];
      if (!rec) continue;
      const sh = shellHitShapes(S, def, rec, hitsize);
      if (sh.shapes) out.push({ id: S.id, shell: S.shell, mode: S.modeIndex, slot: sl.slot, kind: rec[2], hyper: S.hyper ? S.hyper.scale : null, shapes: sh.shapes });
    }
  }
  return out;
}

function segPointT(C, P){""")
open(P, 'wb').write(s.encode('utf8')); print('ok')
