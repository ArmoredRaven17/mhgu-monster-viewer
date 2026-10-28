// hypermeter.mjs (run-check.mjs): GU Hyper's ShellElements on the page -- each case's clip played (loop off) `n` times with Hyper Off and
// with the pair held (the Hyper control, #monHyper), a fresh runtime each pass: every shell made (its shell / mode / unit scale / hyper id
// as shells.js holds them), the meter's shell rows (starts / lit / pixMax), and one canvas grab at the frame `shotAt` of the first play.
async function hyperMeter(cases){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const raf = () => new Promise(r => requestAnimationFrame(() => r()));
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await raf(); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const hySel = document.getElementById('monHyper');
  for (const c of cases){
    const { mon, list, clip, n, hyper, shotAt } = c;
    if (V.state.id !== mon){ if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon)); monSel.value = mon; await monSel.onchange(); }
    for (const pass of ['off', 'on']){
      await raf();
      const opts = [...hySel.options].map(o => o.value);
      const want = pass === 'off' ? '' : /^has:/.test(hyper) ? (opts.find(o => o && o.split(',').map(Number).includes(+hyper.slice(4))) || hyper) : hyper;
      if (pass === 'on' && !opts.includes(want)){ out.push([false, 'NOHYPER ' + mon, JSON.stringify(opts)]); continue; }
      hySel.value = want; hySel.onchange({ target: hySel });
      await V.effects(false); await V.effects(true);
      await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === mon, 900);
      const rt = M.effectRuntimeInstance();
      V.state.loop = false;
      V.effectMeter(true, { every: 2 });
      if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
      if (c.pull){ const C = V.controls, cam = V.camera;
        if (!c.home) c.home = { p: cam.position.clone(), t: C.target.clone() };   // the same view for both passes
        C.target.copy(c.home.t); cam.position.copy(c.home.t.clone().add(c.home.p.clone().sub(c.home.t).multiplyScalar(c.pull))); C.update(); }
      // the page's pick rotation (index.html rockInput: rockPlays.n advances a play, resets when the clip's pick list changes):
      // a frame of another pick clip first, so each pass's first play is the first pick (7, 0x0e)
      if (c.resetClip){ const o = [...clipSel.options].find(x => x.value === c.resetClip); clipSel.value = o.value; await clipSel.onchange(); for (let i = 0; i < 4; i++) await raf(); }
      const made = new Map(); let shot = null; const shots = [];
      for (let k = 0; k < n; k++){
        const o = [...clipSel.options].find(x => x.value === clip) || [...clipSel.options].find(x => x.value.replace(/_(start|loop)$/, '') === clip);
        clipSel.value = o.value; await clipSel.onchange();
        await until(() => V.pose.action && V.pose.action.getClip(), 300);
        const act = V.pose.action;
        for (let i = 0; i < 6000; i++){
          await raf();
          for (const S of (rt.schedule.shells ? rt.schedule.shells.state.shells : [])) if (!made.has(S.id))
            made.set(S.id, { play: k, shell: S.shell, type: S.type ? S.type.id : undefined, mode: S.modeIndex, unit: S.unitScale == null ? null : +(+S.unitScale).toFixed(3), hyper: S.hyper ? [S.hyper.id, S.hyper.scale, S.hyper.attack] : null });
          if (shotAt != null && !(shots[k]) && Math.round(act.time * 60) >= shotAt){
            if (c.home){ const C = V.controls, cam = V.camera; C.target.copy(c.home.t); cam.position.copy(c.home.t.clone().add(c.home.p.clone().sub(c.home.t).multiplyScalar(c.pull))); C.update(); }
            if (!c.cams) c.cams = []; c.cams.push([pass, V.camera.position.toArray().map(x => +x.toFixed(1)), V.controls.target.toArray().map(x => +x.toFixed(1))]);
            V.renderer.render(V.scene, V.camera);
            try { shots[k] = V.renderer.domElement.toDataURL('image/png'); } catch (e){ shots[k] = 'ERR ' + e; }
          }
          if (act.paused && act.time >= act.getClip().duration - 2e-3) break;
        }
      }
      const s0 = rt.stats.steps; await until(() => rt.stats.steps - s0 >= 120, 3000);
      const rep = V.effectMeterReport().recs.filter(r => r.monster === mon && r.when === 'shell' && r.starts > 0)
        .map(r => ({ k: r.key.split('|').slice(1).join('|'), st: r.starts, lit: r.litSamples + '/' + r.samples, px: r.pixMax, v: r.verdict }));
      V.effectMeter(false);
      out.push([false, pass.toUpperCase() + ' ' + mon + ' ' + list + '|' + clip, JSON.stringify({ hyper: want, shells: [...made.values()], meter: rep })]);
      shots.forEach((x, k) => out.push([false, 'SHOT ' + pass + k + ' ' + mon, x]));
      out.push([false, 'CAM ' + pass, JSON.stringify(c.cams || [])]);
    }
  }
  const hs = document.getElementById('monHyper'); if (hs){ hs.value = ''; hs.onchange({ target: hs }); }
  return out;
}
export const pageCheck = hyperMeter;
export const args = [[[
  { mon: 'em043_00', list: '2', clip: 'Motion[25]', n: 1, hyper: 'has:1', shotAt: 150, pull: 2.0 },
]]];
