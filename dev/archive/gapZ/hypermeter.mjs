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
      const want = pass === 'off' ? '' : hyper;
      if (pass === 'on' && !opts.includes(hyper)){ out.push([false, 'NOHYPER ' + mon, JSON.stringify(opts)]); continue; }
      hySel.value = want; hySel.onchange({ target: hySel });
      await V.effects(false); await V.effects(true);
      await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === mon, 900);
      const rt = M.effectRuntimeInstance();
      V.state.loop = false;
      V.effectMeter(true, { every: 2 });
      if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
      const made = new Map(); let shot = null;
      for (let k = 0; k < n; k++){
        const o = [...clipSel.options].find(x => x.value === clip) || [...clipSel.options].find(x => x.value.replace(/_(start|loop)$/, '') === clip);
        clipSel.value = o.value; await clipSel.onchange();
        await until(() => V.pose.action && V.pose.action.getClip(), 300);
        const act = V.pose.action;
        for (let i = 0; i < 6000; i++){
          await raf();
          for (const S of (rt.schedule.shells ? rt.schedule.shells.state.shells : [])) if (!made.has(S.id))
            made.set(S.id, { play: k, shell: S.shell, mode: S.modeIndex, unit: S.unitScale == null ? null : +(+S.unitScale).toFixed(3), hyper: S.hyper ? [S.hyper.id, S.hyper.scale, S.hyper.attack] : null });
          if (k === 0 && shotAt != null && !shot && Math.round(act.time * 60) >= shotAt){
            V.renderer.render(V.scene, V.camera);
            try { shot = V.renderer.domElement.toDataURL('image/png'); } catch (e){ shot = 'ERR ' + e; }
          }
          if (act.paused && act.time >= act.getClip().duration - 2e-3) break;
        }
      }
      const s0 = rt.stats.steps; await until(() => rt.stats.steps - s0 >= 120, 3000);
      const rep = V.effectMeterReport().recs.filter(r => r.monster === mon && r.when === 'shell' && r.starts > 0)
        .map(r => ({ k: r.key.split('|').slice(1).join('|'), st: r.starts, lit: r.litSamples + '/' + r.samples, px: r.pixMax, v: r.verdict }));
      V.effectMeter(false);
      out.push([false, pass.toUpperCase() + ' ' + mon + ' ' + list + '|' + clip, JSON.stringify({ hyper: want, shells: [...made.values()], meter: rep })]);
      if (shot) out.push([false, 'SHOT ' + pass + ' ' + mon, shot]);
    }
  }
  const hs = document.getElementById('monHyper'); if (hs){ hs.value = ''; hs.onchange({ target: hs }); }
  return out;
}
export const pageCheck = hyperMeter;
export const args = [[[
  { mon: 'em046_00', list: '4', clip: 'Motion[2]', n: 2, hyper: '1,5', shotAt: 285 },
  { mon: 'em070_00', list: '2', clip: 'Motion[57]', n: 2, hyper: '4,2' },
  { mon: 'em081_00', list: '2', clip: 'Motion[27]', n: 3, hyper: '1,4' },
]]];
