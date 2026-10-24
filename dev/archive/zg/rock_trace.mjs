// Tetsucabra's u 0 as the shells check runs it (after L2 M12's shell), with 0xaf7930 / 0xae9050 wrapped to log who calls them.
export async function pageCheck(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'rock: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const cpu = await import('/render/rom/effect/cpu.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em066_00';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  const rt = () => M.effectRuntimeInstance();
  check(await until(() => rt() && rt().monsterId === MON && rt().schedule), 'runtime up');
  const log = [];
  for (const a of [0xae9050, 0xaf7930]){
    const f0 = cpu.lifted(a);
    cpu.registerNative(a, (m, c) => {
      const interp = a === 0xaf7930 ? m.u32((c.r[13] >>> 0)) : 0;
      if (a === 0xaf7930 && interp !== 0 && log.length < 12){
        const sp = c.r[13] >>> 0;
        log.push({ fn: a.toString(16), lr: (c.r[14] >>> 0).toString(16), r: [0, 1, 2, 3].map(k => (c.r[k] >>> 0).toString(16)),
                   stack: a === 0xaf7930 ? [0, 4, 8, 12, 16].map(o => m.u32(sp + o).toString(16)) : null });
      }
      return f0(m, c);
    });
  }
  const pick = async (list, name) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === name) || [...clipSel.options].find(x => x.value === name + '_start');
    clipSel.value = o.value; await clipSel.onchange();
  };
  for (const [l, c] of [['4', 'Motion[1]'], ['2', 'Motion[12]'], ['4', 'Motion[30]']]){ await pick(l, c); await frames(200); }
  check(true, 'after the clips', log.slice(0, 6));
  const fx = rt(), S = fx.schedule;
  const e = S.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === 'em066_00u' && x.def.record.key === 0);
  log.length = 0;
  for (let rep = 0; rep < 2; rep++){
    try { S.start(e); } catch (err){ check(false, 'start', String(err)); }
    for (let i = 0; i < 240; i++){ await frames(1); if (fx.failed) break; }
  }
  check(!fx.failed, 'u 0 alone', { failed: fx.failed ? String(fx.failed) : null, log });
  return out;
}
