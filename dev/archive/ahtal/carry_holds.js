// PROBE: u 120 (always) / u 130 (rage) held and stopped by the viewer's own flow -- Enraged toggle, L2 M28, death.
// u 130's effect refuses (0x9bbb4c node transform mode 3: not recorded yet), and a refusal stops the runtime, so its
// requests are STAND-INS here (the schedule's own start / stop calls, counted; the effect itself not run). u 120 runs real.
const V = window.__view;
const M = await import('/render/monster.js');
const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const until = async (f, n = 600) => { for (let i = 0; i < n; i++){ if (f()) return true; await wait(16); } return false; };
const out = { t: [] };
const id = 'em088_00';
if (![...monSel.options].some(o => o.value === id)) monSel.add(new Option(id, id));
monSel.value = id; await monSel.onchange(); await wait(500);
await V.effects(false); await V.effects(true);
await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === id && M.effectRuntimeInstance().schedule);
const fx = M.effectRuntimeInstance(), S = fx.schedule;
const s0 = S.start.bind(S), stop0 = S.host.stopRequest.bind(S.host), rel0 = S.host.releaseRequest.bind(S.host);
S.start = e => { if (e.def.record && e.def.record.key === 130 && e.when === 'rage'){ e.requests.push({ stand: true, stopped: false, finished: () => false, effects: () => [] }); S.starts++; return; } return s0(e); };
S.host.stopRequest = q => { if (q && q.stand){ q.stopped = true; return; } return stop0(q); };
S.host.releaseRequest = q => { if (q && q.stand) return; return rel0(q); };
const live = key => S.entries.filter(e => e.def.record && e.def.record.key === key && (e.when === 'always' || e.when === 'rage'))
  .map(e => e.when + ':' + e.requests.filter(q => !q.stopped).length + ' live/' + e.requests.length).join(',');
const play = async (list, clip) => {
  if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
  const opts = [...clipSel.options];
  const o = opts.find(x => x.value === clip) || opts.find(x => x.value === clip + '_loop') || opts.find(x => x.value === clip + '_start');
  clipSel.value = o.value; await clipSel.onchange();
  await until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
  await wait(400);
};
const snap = tag => out.t.push({ tag, failed: fx.failed || null, rage: S.rage, u120: live(120), u130: live(130),
                                 clip: V.state.list + '|' + (V.pose.action && V.pose.action.getClip().name) });
const rageBox = document.getElementById('monRage');
const rage = async on => { rageBox.checked = on; rageBox.dispatchEvent(new Event('change')); await wait(400); };
await play('0', 'Motion[1]'); snap('calm, L0 M1');
await rage(true); snap('Enraged, L0 M1');
await play('2', 'Motion[28]'); snap('Enraged, L2 M28');
await play('2', 'Motion[4]'); snap('Enraged, L2 M4');
await play('3', 'Motion[19]'); snap('death L3 M19');
await play('0', 'Motion[1]'); snap('after death, L0 M1');
await rage(false); snap('calm again, L0 M1');
await play('2', 'Motion[28]'); snap('calm, L2 M28');
await play('0', 'Motion[1]'); snap('calm, back on L0 M1');
return out;
