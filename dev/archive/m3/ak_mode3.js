const V = window.__view;
const M = await import('/render/monster.js');
const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const until = async (f, n = 600) => { for (let i = 0; i < n; i++){ if (f()) return true; await wait(16); } return false; };
const ID = 'em088_00';
if (![...monSel.options].some(o => o.value === ID)) monSel.add(new Option(ID, ID));
monSel.value = ID; await monSel.onchange(); await wait(2000);
await V.effects(false); await V.effects(true);
await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === ID && M.effectRuntimeInstance().schedule);
const out = {};
const alive = fx => fx.schedule.entries.filter(e => e.def && e.def.record && e.requests.some(q => !q.stopped)).map(e => (e.when || '') + ' ' + e.def.record.pel + ':' + e.def.record.key);
const fxOf = () => M.effectRuntimeInstance();
// 1. Enraged on, as the toggle does
const rage = document.getElementById('monRage'), rageRow = document.getElementById('monRageRow');
out.rageRowShown = rageRow && !rageRow.hidden;
rage.checked = true; rage.dispatchEvent(new Event('change', { bubbles: true }));
await wait(3000);
let fx = fxOf();
out.enraged = { failed: fx.failed ? String(fx.failed) : null, alive: alive(fx), stats: { running: fx.stats.running, prims: fx.stats.prims, models: fx.stats.models, gpu: fx.stats.gpu } };
const s1 = await V.shot('ak-mode3', 'enraged_u130', V.pose.action ? V.pose.action.time : 0);
out.enraged.shot = s1 && s1.saved;
// 2. the death clip L3 M19, played to its end
rage.checked = false; rage.dispatchEvent(new Event('change', { bubbles: true }));
await wait(300);
const entry = V.MON.monsters.find(e => e.id === ID);
const l3 = entry.lists.find(l => l.id === '3');
out.l3clips = l3 ? l3.clips.filter(c => /Motion\[19\]/.test(c.clip)).map(c => c.clip + ' ' + Math.round(c.dur * 60)) : 'no L3';
if (V.state.list !== '3'){ listSel.value = '3'; await listSel.onchange(); }
const opt = [...clipSel.options].find(o => /^Motion\[19\]/.test(o.value));
out.clipValue = opt && opt.value;
const seen = new Set();
clipSel.value = opt.value; await clipSel.onchange();
fx = fxOf();
const dur = l3.clips.find(c => c.clip.startsWith('Motion[19]')).dur * 1000;
const t0 = performance.now(); let shotDone = null;
while (performance.now() - t0 < dur + 1500){
  await wait(50);
  fx = fxOf();
  for (const a of alive(fx)) seen.add(a);
  if (fx.failed) break;
  if (!shotDone && [...seen].some(s => /480/.test(s)) && performance.now() - t0 > 400){ shotDone = await V.shot('ak-mode3', 'death_L3M19', V.pose.action ? V.pose.action.time : 0); }
}
out.death = { failed: fx.failed ? String(fx.failed) : null, seen: [...seen], shot: shotDone && shotDone.saved, frame: V.pose.action && Math.round(V.pose.action.time * 60) };
return out;
