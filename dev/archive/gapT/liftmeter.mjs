// liftmeter.mjs (run-check.mjs): Ahtal-Neset's lifts (shells.js act087 (1, 0x15) / (1, 8): Ka's shell57 b6, modes 0x18 / 0x19) on the
// page. (a) Ka's combined list "Combined (with Ahtal-Neset)": each entry played once at 1/60 a frame; every base57 b6 shell on Neset's
// partner runtime with the entry frame it was first seen, Neset's clip @ frame then, its life by state; and the draw meter's rows of both
// runtimes. (b) Neset's own entry: raw L0 M9 played twice (the pick rotates (1, 0x15) / (1, 8)), the same log.
// (After dev/archive/ahtalduo/combined_page.js, the combined lane's probe.)
async function liftMeter(){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js'), EM = await import('/render/rom/effect-mounts.js');
  const raf = () => new Promise(r => requestAnimationFrame(() => r()));
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await raf(); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const pick = async MON => { if (V.state.id !== MON){ if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON)); monSel.value = MON; await monSel.onchange(); } };
  const lifts = (fx, seen, t, clipAt) => {
    const sh = fx && fx.schedule && fx.schedule.shells ? fx.schedule.shells.state.shells : [];
    for (const s of sh) if (s.base === 'base57' && (s.modeIndex === 0x18 || s.modeIndex === 0x19)){
      const r = seen.get(s.id) || { mode: s.modeIndex, k: s.modeIndex - 0x18, first: t, at: clipAt, states: {} };
      r.states[s.state] = (r.states[s.state] || 0) + 1; r.last = t; seen.set(s.id, r);
    }
  };
  const meterRows = () => (V.effectMeterReport().recs || []).filter(r => r.when === 'shell' || /\|shell$/.test(r.key))
    .map(r => ({ k: r.key, st: r.starts, d: r.draws, lit: r.litSamples + '/' + r.samples, v: r.verdict }));
  // (b) his own entry
  await pick('em087_00');
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === 'em087_00', 900);
  V.state.loop = false;
  for (let play = 0; play < 2; play++){
    V.effectMeter(true, { every: 3 });
    listSel.value = '0'; await listSel.onchange();
    clipSel.value = 'Motion[9]'; await clipSel.onchange();
    await until(() => V.pose.action && V.pose.action.getClip().name === 'Motion[9]', 300);
    const fx = M.effectRuntimeInstance(), seen = new Map(), ri = V.rockInput ? V.rockInput() : null;
    for (let i = 0; i < 400; i++){ await raf(); const t = Math.round(V.pose.action.time * 60); lifts(fx, seen, t, 'L0 M9@' + t); }
    out.push([false, 'OWN L0 M9 play ' + play, JSON.stringify({ variant: ri && ri.variant, lifts: [...seen.values()], meter: meterRows() })]);
    V.effectMeter(false);
  }
  // (a) the combined list
  await pick('em088_00');
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === 'em088_00', 900);
  const L = (V.MON.monsters.find(m => m.id === 'em088_00').lists || []).find(l => l.id === 'neset');
  if (!L){ out.push([false, 'COMBINED', 'no combined list']); return out; }
  V.state.loop = false;
  for (const c of L.clips){
    V.effectMeter(true, { every: 3 });
    if (V.state.list !== 'neset'){ listSel.value = 'neset'; await listSel.onchange(); }
    clipSel.value = c.clip; await clipSel.onchange();
    await until(() => V.pose.action && V.pose.action.getClip().name === c.clip, 600);
    await until(() => V.mounted.em087_00, 600);
    const F = Math.round(c.dur * 60), seen = new Map();
    for (let i = 0; i < 6000; i++){
      await raf();
      const t = V.pose.action ? Math.round(V.pose.action.time * 60) : -1;
      const prt = EM.partnerEffectRuntime(), pc = prt && prt.schedule && prt.schedule.clip;
      lifts(prt, seen, t, pc && pc.key ? pc.key.split('|').slice(1).join('|') + '@' + (+pc.frame).toFixed(1) : null);
      if (t >= F - 1 || (V.pose.action && V.pose.action.paused && t > 10)) break;
    }
    await raf(); await raf();
    out.push([false, 'COMBINED ' + c.clip, JSON.stringify({ frames: F, lifts: [...seen.values()], meter: meterRows() })]);
    V.effectMeter(false);
  }
  return out;
}
export const pageCheck = liftMeter;
export const args = [[]];
