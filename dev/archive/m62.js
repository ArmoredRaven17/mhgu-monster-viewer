const V = window.__view;
const M = await import('/render/monster.js');
const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
monSel.value = 'em081_04'; await monSel.onchange();
await V.effects(true);
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const lev = document.getElementById('monLevel');
const out = { levels: [...lev.options].map(o => o.value + ':' + o.text) };
for (const L of ['4', '0']){
  lev.value = L; lev.dispatchEvent(new Event('change'));
  listSel.value = '4'; await listSel.onchange();
  const clips = [...clipSel.options].map(o => o.value).filter(v => /^Motion\[62\]/.test(v));
  out.clips = clips;
  clipSel.value = clips[0]; await clipSel.onchange();
  const fx = M.effectRuntimeInstance();
  fx.schedule.shellTally = { spawned: 0, beams: [], refused: [] };
  const s0 = fx.schedule.starts;
  const samples = [];
  for (let i = 0; i < 16; i++){ await wait(500);
    const S = fx.schedule.shells && fx.schedule.shells.state;
    samples.push({ t: (i + 1) / 2, clip: V.state.clip, frame: V.pose.action ? Math.round(V.pose.action.time * 60) : null,
                   shells: S ? S.shells.map(s => (s.cls || s.base) + ':' + s.modeIndex).join(',') : '', running: fx.stats.running, failed: fx.failed || null });
  }
  out['level' + L] = { level: V.state.level, started: fx.schedule.starts - s0, tally: fx.schedule.shellTally.spawned, refused: fx.schedule.shellTally.refused.slice(0, 5), samples };
}
return out;
