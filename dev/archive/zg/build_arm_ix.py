# build_arm_ix.py: index.html -- Nakarkos's tentacles on their own effect runtimes (board PHASE 3, 2026-10-19)
import io
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\index.html'
t = io.open(P, encoding='utf8', newline='').read()
nl = '\r\n' if '\r\n' in t else '\n'
def rep(a, b, n=1):
    global t
    a2, b2 = a.replace('\n', nl), b.replace('\n', nl)
    assert t.count(a2) == n, (t.count(a2), a[:80])
    t = t.replace(a2, b2)
rep("import { partnerEffectRuntime, attachPartnerEffects, detachPartnerEffects, partnerEffectsPending, effectRuntimeOn } from './render/rom/effect-mounts.js';",
    "import { partnerEffectRuntime, attachPartnerEffects, detachPartnerEffects, partnerEffectsPending, effectRuntimeOn,\n"
    "         sideEffectRuntime, attachSideEffects, detachSideEffects, sideEffectsPending } from './render/rom/effect-mounts.js';")
rep("em088CarryAt, em021Item, em021Gas } from './render/psl-mask.js';",
    "em088CarryAt, em021Item, em021Gas, armPlay084, armMask084 } from './render/psl-mask.js';")
# the arm's clip, as playAttached hands it to its driver: its list, its clip, its play count (a new play is a new motion start)
rep("""    a.driver.loopMode = a.idleWrap ? () => 'repeat' : pose.loopMode;
    await a.driver.play({ file: twin.file, clip: clipName, model: a.part.glb, clip3 },
                        { figure: 'monster', joints: a.part.joints || [], anchorXZ: false, groundLock: false });""",
"""    a.driver.loopMode = a.idleWrap ? () => 'repeat' : pose.loopMode;
    await a.driver.play({ file: twin.file, clip: clipName, model: a.part.glb, clip3 },
                        { figure: 'monster', joints: a.part.joints || [], anchorXZ: false, groundLock: false });
    // what its own effect runtime walks (driveArmEffects): the arm's list and clip, and a play count per (list, clip)
    { const k = twin.id + '|' + clipName.replace(/_(start|loop)$/, '');
      a.fxN = a.fxKey === k ? (a.fxN | 0) + 1 : 0; a.fxKey = k; a.fxList = twin.id; a.fxClip = clipName; a.fxPlay = (a.fxPlay | 0) + 1; }""")
# the driver
rep("function drivePartnerEffects(){\n", """// NAKARKOS'S TENTACLES, EACH ON ITS OWN EFFECT RUNTIME (board PHASE 3, 2026-10-19; render/rom/effect-mounts.js attachSideEffects).
// In the game an arm is a unit of its own class (uEmOstgaloaArm): its PSL walker reads ITS motion and frame on its own lists
// (em084_00_l_N / r_N), its enable word is its class's (0x107f0e4: psl-mask.js armMask084, READ and emulated), its records
// come from its own pels (em084_00u_l / em084_00c_l, _r) and hang from its joints -- docs/effects/em084_00_left.json /
// _right.json and CLIP_EFFECTS['em084_00_left' / '_right'] (efx: <scratchpad>/zg/arm_export.py). Each runtime is made on the
// arm's mounted model while the body's is up, its unit the frame the arm hangs on (attachFrame: body joint 200 / 203), and fed
// the arm's clip as its driver plays it (playAttached: a.fxList / a.fxClip), at the arm's own time.
const ARM_FX = { em084_00: { em084_00_left: 'l', em084_00_right: 'r' } };
const armFxRefused = new Set();
function driveArmEffects(){
  const e = entry(), sides = e && ARM_FX[e.id];
  const on = !!(sides && effectRuntimeOn() && effectRuntimeInstance());
  for (const name of ['em084_00_left', 'em084_00_right']){
    const a = attached.get(name), g = mounted[name];
    const want = on && sides && sides[name] && a && !a.partner && g;
    const rt = sideEffectRuntime(name);
    if (!want){ if (rt || sideEffectsPending(name)) detachSideEffects(name); continue; }
    if (!rt || rt.root !== g){
      if (!sideEffectsPending(name) && !armFxRefused.has(g)){
        attachSideEffects(name, g, name, () => { const x = attached.get(name); return x && x.frame ? x.frame.matrixWorld : null; })
          .then(v => { if (v === false) armFxRefused.add(g); })
          .catch(err => { armFxRefused.add(g); noteError('arm effects ' + name + ': ' + (err && err.message || err)); });
      }
      continue;
    }
    rt.advance = fxAdvance;
    if (!rt.schedule) continue;
    const act = a.driver && a.driver.action;
    if (!act || !a.fxList || !a.fxClip){ rt.schedule.setClip(null, 0, null); continue; }
    const lst = (e.lists || []).find(x => x.id === a.fxList);
    const raw = a.fxClip, base = raw.replace(/_(start|loop)$/, ''), loopSeg = /_loop$/.test(raw);
    let start = 0;
    if (loopSeg && lst){ const sib = (lst.clips || []).find(x => x.clip === base + '_start'); if (sib) start = Math.round(sib.dur * 60); }
    const frame = act.time * 60 + start;
    const slot = +((/^Motion\\[(\\d+)\\]$/.exec(base) || [])[1]);
    // the arm's word: its own method over the base, the body's action and the arm's own (the orders ROM_ARM_PAIRS reads), its
    // form byte +0xcb30 (the tentacle's form dropdown); rage / tired as the body shows them (P+0x518 / P+0x505 are the arm's own:
    // I, the base word's inputs)
    const side = sides[name], arms = armsInput(), form = arms && arms[side === 'l' ? 'left' : 'right'] ? arms[side === 'l' ? 'left' : 'right'].form : undefined;
    const play = Number.isFinite(slot) ? armPlay084(a.fxList, slot, a.fxN | 0) : null;
    const mask = Number.isFinite(slot) ? armMask084(a.fxList, slot, side, play, { rage: !!state.rage, tired: exhausted(), armForm: typeof form === 'number' && form <= 3 ? form : undefined }) : null;
    rt.schedule.setClip(name + '|' + a.fxList + '|' + base, frame, clipEffectsFor(name, base, a.fxList), start, mask, 'arm:' + (a.fxPlay | 0), loopSeg);
  }
}
function drivePartnerEffects(){
""")
rep("  drivePartnerEffects();                   // his own effects, on his clip as stepAttached just posed it\n",
    "  drivePartnerEffects();                   // his own effects, on his clip as stepAttached just posed it\n"
    "  driveArmEffects();                       // Nakarkos's tentacles' own effects, on each arm's clip\n")
io.open(P, 'w', encoding='utf8', newline='').write(t)
print('ok')
