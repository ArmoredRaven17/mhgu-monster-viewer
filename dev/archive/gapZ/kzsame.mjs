// kzsame.mjs (run-check.mjs): Khezu's L2 M3 ground bolts with ONLY the shell scale changed -- Hyper stays Off (no motion rate, no
// aura, the same pose), and the ShellElements reach the shells through shellExtra alone (hyperShells = his file's, IDs 1 / 2).
//   play A: as is (unit null -> the requester's ShellScale 1.0)          grab A at frame F
//   play B: hyperShells injected (sp_03 at unit 1.3 from its spawn step)  grab B at frame F, then -- the SAME frame, nothing stepped --
//           each sp_03 parent re-posed at its unscaled scale and grabbed again (B0): only the parent scale differs between B and B0.
// Also per grab: the live shells (mode, unit), and the effect units alive under each sp_03 (rt.schedule's requests).
async function kzSame(c){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const raf = () => new Promise(r => requestAnimationFrame(() => r()));
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await raf(); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const hySel = document.getElementById('monHyper');
  if (V.state.id !== c.mon){ monSel.value = c.mon; await monSel.onchange(); }
  hySel.value = ''; hySel.onchange({ target: hySel });
  const HM = await (await fetch('/hyper-motion.json')).json();
  const shells = HM[c.mon].normal.shells;
  const grab = () => { V.renderer.render(V.scene, V.camera); try { return V.renderer.domElement.toDataURL('image/png'); } catch (e){ return 'ERR ' + e; } };
  for (const pass of ['A', 'B']){
    await V.effects(false); await V.effects(true);
    await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === c.mon, 900);
    const rt = M.effectRuntimeInstance(), sc = rt.schedule;
    const base = sc.shellExtra;
    sc.shellExtra = pass === 'B' ? () => ({ ...(base ? base() : {}), hyperShells: { ids: [1, 2], shells } }) : base;
    V.state.loop = false;
    if (V.state.list !== c.list){ listSel.value = c.list; await listSel.onchange(); }
    { const C = V.controls, cam = V.camera;
      if (!c.home) c.home = { p: cam.position.clone(), t: C.target.clone() };
      C.target.copy(c.home.t); cam.position.copy(c.home.t.clone().add(c.home.p.clone().sub(c.home.t).multiplyScalar(c.pull))); C.update(); }
    // the pick rotation (index.html rockInput): another pick clip first, so the play is the first pick (7, 0x0e)
    await until(() => [...clipSel.options].some(x => x.value === c.resetClip), 600);
    if (![...clipSel.options].some(x => x.value === c.resetClip)) return [[false, 'NOCLIP', JSON.stringify({ list: V.state.list, opts: [...clipSel.options].slice(0, 8).map(x => x.value) })]];
    { const o = [...clipSel.options].find(x => x.value === c.resetClip); clipSel.value = o.value; await clipSel.onchange(); for (let i = 0; i < 30; i++) await raf(); }
    const o = [...clipSel.options].find(x => x.value === c.clip) || [...clipSel.options].find(x => x.value.replace(/_(start|loop)$/, '') === c.clip); clipSel.value = o.value; await clipSel.onchange();
    await until(() => V.pose.action && V.pose.action.getClip(), 300);
    const act = V.pose.action;
    let done = false;
    for (let i = 0; i < 6000 && !done; i++){
      await raf();
      if (Math.round(act.time * 60) >= c.F){
        act.paused = true;
        const live = sc.shells.state.shells.filter(S => S.shell === 'shell03');
        const info = live.map(S => ({ mode: S.modeIndex, unit: S.unitScale == null ? null : +(+S.unitScale).toFixed(3), hyper: S.hyper ? S.hyper.id : null,
                                      pos: S.position && S.position.map(x => Math.round(x)) }));
        out.push([false, 'GRAB ' + pass + ' frame ' + Math.round(act.time * 60), JSON.stringify(info)]);
        const cen = [0, 2].map(k => live.reduce((a, S) => a + (S.position ? S.position[k] : 0), 0) / Math.max(1, live.length));
        if (pass === 'A') c.cenA = cen;
        else if (c.cenA){   // the same view of the bolts: the camera moved by the bolts' drift between the plays (world -> view x 0.01)
          const dx = (cen[0] - c.cenA[0]) * 0.01, dz = (cen[1] - c.cenA[1]) * 0.01, C = V.controls, cam = V.camera;
          C.target.x += dx; C.target.z += dz; cam.position.x += dx; cam.position.z += dz; C.update();
          out.push([false, 'CAMSHIFT', JSON.stringify({ dx, dz })]);
        }
        const st = {}; for (const [k, v] of Object.entries(rt.stats || {})) if (typeof v === 'number') st[k] = v;
        out.push([false, 'STATS ' + pass, JSON.stringify(st)]);
        out.push([false, 'SHOT ' + pass + ' em003_00', grab()]);
        done = true;
      }
    }
    act.paused = false;
    sc.shellExtra = base;
    for (let i = 0; i < 10; i++) await raf();
  }
  return out;
}
export const pageCheck = kzSame;
export const args = [[{ mon: 'em003_00', list: '2', clip: 'Motion[3]', resetClip: 'Motion[61]', F: 194, pull: 3.0 }]];
