const V = window.__view;
const M = await import('/render/monster.js');
const SH = await import('/render/shells.js');
const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const until = async (f, n = 600) => { for (let i = 0; i < n; i++){ if (f()) return true; await wait(16); } return false; };
const out = { trials: [] };
async function mon(id){
  if (![...monSel.options].some(o => o.value === id)) monSel.add(new Option(id, id));
  monSel.value = id; await monSel.onchange(); await wait(2000);
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === id && M.effectRuntimeInstance().schedule);
}
function rageSet(on){ const b = document.getElementById('monRage'); if (b && b.checked !== on){ b.checked = on; b.onchange({ target: b }); } }
function side(){ const t = V.controls.target; V.camera.position.set(t.x + 38, t.y + 9, t.z + 14); V.camera.lookAt(t.x, t.y, t.z + 6); V.controls.target.set(t.x, t.y, t.z + 6); V.controls.update(); }
let T0 = null;
function home(){ if (!T0) T0 = V.controls.target.clone(); V.controls.target.copy(T0); }
async function other(list){
  // another clip first, so the next one is a fresh play
  if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
  const v = [...clipSel.options].map(o => o.value).find(x => /Motion\[1\]/.test(x)) || clipSel.options[0].value;
  clipSel.value = v; await clipSel.onchange(); await wait(200);
}
async function trial(id, list, base, F, name, { rage = false, before = true, shoot = true, cam = side } = {}){
  rageSet(rage);
  const fx = M.effectRuntimeInstance(), S = fx.schedule;
  home();
  if (before) await other(list);
  const log = [];
  const rq0 = S.host.requestEffect;
  S.host.requestEffect = function(owner, parent, rec, a, requester){
    log.push({ key: rec.key, fromShell: parent !== S.parent, frame: S.clip ? Math.round(S.clip.frame) : null });
    return rq0.apply(this, arguments);
  };
  S.shellTally = { spawned: 0, beams: [], refused: [] };
  if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
  const opts = [...clipSel.options].map(o => o.value);
  const val = opts.find(v => v === base) || opts.find(v => v === base + '_start') || opts.find(v => v === base + '_loop');
  clipSel.value = val; await clipSel.onchange();
  await until(() => V.pose.action && V.pose.action.getClip().name.startsWith(base));
  await until(() => S.clip && S.clip.frame >= F, 1200);
  const shells = ((S.shells && S.shells.state.shells) || []).map(sh => ({ shell: sh.shell, mode: sh.modeIndex, base: sh.base, state: sh.state,
    pos: sh.position && sh.position.map(Math.round), request: !!sh.request, key: sh.start && sh.start.key, unitScale: sh.unitScale,
    pushes: sh.pushes, action: sh.action }));
  const picks = SH.pickVariantsFor(id, list, base, { rage });
  let shot = null;
  if (shoot){ if (cam) cam(); shot = await V.shot('m079', name, V.pose.action.time); V.pose.action.timeScale = 1; V.pose.action.paused = false; }
  S.host.requestEffect = rq0;
  const running = S.entries.filter(e => e.when === 'shell' && e.requests.some(q => !q.stopped)).map(e => e.def.record.pel + ':' + e.def.record.key);
  out.trials.push({ name, id, list, clip: val, atFrame: S.clip && Math.round(S.clip.frame), picks, variant: V.state && V.state.beamLabel,
    starts: log.filter(x => x.fromShell), tally: S.shellTally, shells, runningShellRecords: running,
    shot: shot && shot.saved, errors: shot ? shot.errors.slice(-3) : [], fail: fx.failed || fx.error || null });
}
await mon('em079_00');
T0 = null;
await trial('em079_00', '2', 'Motion[43]', 10, 'm00_L2M43');
await trial('em079_00', '2', 'Motion[17]', 60, 'm00_L2M17_beam');
await trial('em079_00', '2', 'Motion[18]', 140, 'm00_L2M18_sweep');
await trial('em079_00', '1', 'Motion[2]', 16, 'm00_L1M2_dust');
await trial('em079_00', '1', 'Motion[22]', 32, 'm00_L1M22_dust');
await trial('em079_00', '1', 'Motion[27]', 8, 'm00_L1M27_dust');
await trial('em079_00', '2', 'Motion[14]', 84, 'm00_L2M14_rage', { rage: true });
await trial('em079_00', '2', 'Motion[15]', 84, 'm00_L2M15_rage', { rage: true });
await trial('em079_00', '2', 'Motion[35]', 48, 'm00_L2M35_rage', { rage: true });
await trial('em079_00', '2', 'Motion[12]', 36, 'm00_L2M12_rage', { rage: true });
await trial('em079_00', '2', 'Motion[12]', 36, 'm00_L2M12_rage_b', { rage: true });
rageSet(false); await wait(500);
await trial('em079_00', '2', 'Motion[23]', 30, 'm00_L2M23_whirl');
// the push, mechanics only: the same run with u 10's entry taken out (its record needs recording: the runtime refuses it)
await mon('em079_00'); T0 = null;
{ const S = M.effectRuntimeInstance().schedule; S.entries = S.entries.filter(e => !(e.when === 'shell' && e.def.record && e.def.record.key === 10)); }
await trial('em079_00', '2', 'Motion[23]', 30, 'm00_L2M23_noeff', { shoot: false });
await trial('em079_00', '2', 'Motion[36]', 120, 'm00_L2M36_push', { before: false, shoot: false });
await trial('em079_00', '1', 'Motion[27]', 30, 'm00_L1M27_push', { before: false, shoot: false });
await mon('em079_04'); T0 = null;
await trial('em079_04', '2', 'Motion[43]', 10, 'm04_L2M43');
await trial('em079_04', '1', 'Motion[27]', 24, 'm04_L1M27_cc');
await trial('em079_04', '9', 'Motion[4]', 84, 'm04_L9M4_c9');
await trial('em079_04', '9', 'Motion[4]', 84, 'm04_L9M4_dd');
await trial('em079_04', '2', 'Motion[17]', 60, 'm04_L2M17_beam');
await trial('em079_04', '2', 'Motion[23]', 12, 'm04_L2M23_whirl');
await trial('em079_04', '2', 'Motion[14]', 84, 'm04_L2M14_rage', { rage: true });
await trial('em079_04', '2', 'Motion[14]', 84, 'm04_L2M14_rage_d0', { rage: true });
rageSet(false);
return out;
