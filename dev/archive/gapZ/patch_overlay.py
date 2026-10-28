P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\index.html'
s = open(P, 'rb').read().decode('utf8'); nl = '\r\n' if '\r\n' in s else '\n'
def rep(old, new):
    global s
    o = old.replace('\n', nl); n = new.replace('\n', nl)
    assert s.count(o) == 1, (old[:80], s.count(o)); s = s.replace(o, n)
rep("""import { hunterCapsuleOf, pickVariantsFor, BEAM_TYPES, AURA084_STANCE, AURA084_CASE_A, heldUntil088, pullClip088, SHELL_DATA, SNOW_VARIANTS } from './render/shells.js';""",
"""import { hunterCapsuleOf, pickVariantsFor, BEAM_TYPES, AURA084_STANCE, AURA084_CASE_A, heldUntil088, pullClip088, SHELL_DATA, SNOW_VARIANTS, shellHitShapesLive } from './render/shells.js';""")
rep("""function stepAttackBoxes(){
  if (window.__view && !window.__view.attackBoxes) window.__view.attackBoxes = () => atkBoxes ? atkBoxes.userData.last : null;""",
"""// THE SHELLS' HIT SHAPES ON THE SAME OVERLAY (shells lane, 2026-10-27; render/shells.js shellHitShapesLive): every live shell's armed slot,
// in world units x 0.01 (the shells' world is the effects' -- live.js MT_TO_VIEW), red as a record that can hit a hunter (a kind the
// hunter pass skips -- 8 / 9 / 0x34 / 0x45 -- blue). Khezu's bolts: one capsule each over its last step, along its own line
let shellHits = null;
function stepShellHits(){
  if (window.__view && !window.__view.shellHits) window.__view.shellHits = () => shellHits ? shellHits.userData.last : null;
  const rt = effectRuntimeInstance(), st = rt && rt.schedule && rt.schedule.shells && rt.schedule.shells.state;
  if (atkMode === 'off' || !st){ if (shellHits){ shellHits.visible = false; shellHits.userData.last = []; } return; }
  if (!shellHits){
    shellHits = new THREE.Group(); shellHits.name = 'shell-hit-shapes'; scene.add(shellHits);
    shellHits.userData.pool = [];
    shellHits.userData.mats = { hunter: new THREE.MeshBasicMaterial({ color: 0xff4033, transparent: true, opacity: 0.35, depthWrite: false }),
                                other: new THREE.MeshBasicMaterial({ color: 0x40b3ff, transparent: true, opacity: 0.35, depthWrite: false }) };
  }
  shellHits.visible = true;
  const list = shellHitShapesLive(st), pool = shellHits.userData.pool, M = shellHits.userData.mats;
  const A = new THREE.Vector3(), B = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  let n = 0;
  for (const e of list) for (const sh of e.shapes){
    const p0 = sh.type === 1 ? sh.c : sh.p0, p1 = sh.type === 1 ? sh.c : sh.p1;
    if (!p0 || !p1 || !(sh.r > 0)) continue;
    A.fromArray(p0).multiplyScalar(0.01); B.fromArray(p1).multiplyScalar(0.01);
    const r = sh.r * 0.01, L = A.distanceTo(B);
    let m = pool[n];
    if (!m){ m = new THREE.Mesh(new THREE.CapsuleGeometry(1, 1, 4, 16), M.hunter); m.renderOrder = 10; pool.push(m); shellHits.add(m); }
    if (m.userData.r !== r || m.userData.L !== L){ m.geometry.dispose(); m.geometry = new THREE.CapsuleGeometry(r, Math.max(L, 1e-4), 4, 16); m.userData.r = r; m.userData.L = L; }
    m.material = [8, 9, 0x34, 0x45].includes(e.kind) ? M.other : M.hunter;
    m.position.copy(A).add(B).multiplyScalar(0.5);
    if (L > 1e-6) m.quaternion.setFromUnitVectors(up, B.clone().sub(A).normalize()); else m.quaternion.identity();
    m.visible = true; n++;
  }
  for (let i = n; i < pool.length; i++) pool[i].visible = false;
  shellHits.userData.last = list.map(e => ({ id: e.id, shell: e.shell, mode: e.mode, slot: e.slot, kind: e.kind, hyper: e.hyper,
                                             shapes: e.shapes.map(sh => ({ type: sh.type, r: sh.r, p0: sh.p0 || sh.c, p1: sh.p1 || sh.c })) }));
}
function stepAttackBoxes(){
  stepShellHits();
  if (window.__view && !window.__view.attackBoxes) window.__view.attackBoxes = () => atkBoxes ? atkBoxes.userData.last : null;""")
open(P, 'wb').write(s.encode('utf8')); print('ok')
