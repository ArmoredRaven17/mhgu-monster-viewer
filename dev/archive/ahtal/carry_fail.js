// PROBE: when does em088_00's effect runtime stop, with u 120 (always) / u 130 (rage) exported?
const V = window.__view;
const M = await import('/render/monster.js');
const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const until = async (f, n = 600) => { for (let i = 0; i < n; i++){ if (f()) return true; await wait(16); } return false; };
const out = { t: [] };
const id = 'em088_00';
if (![...monSel.options].some(o => o.value === id)) monSel.add(new Option(id, id));
monSel.value = id; await monSel.onchange(); await wait(500);
listSel.value = '0'; await listSel.onchange(); clipSel.value = 'Motion[1]'; await clipSel.onchange();
await V.effects(false); await V.effects(true);
await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === id && M.effectRuntimeInstance().schedule);
const fx = M.effectRuntimeInstance(), S = fx.schedule;
const live = key => S.entries.filter(e => e.def.record && e.def.record.key === key && (e.when === 'always' || e.when === 'rage'))
  .map(e => e.when + ':' + e.requests.filter(q => !q.stopped).length + '/' + e.requests.length).join(',');
const snap = tag => out.t.push({ tag, failed: fx.failed || null, frame: S.frame, rage: S.rage, u120: live(120), u130: live(130),
                                 clip: V.pose.action && V.pose.action.getClip().name });
snap('mounted L0M1');
for (let i = 0; i < 6; i++){ await wait(500); snap('L0M1 +' + (i + 1) * 0.5 + 's'); }
const rageBox = document.getElementById('monRage');
rageBox.checked = true; rageBox.dispatchEvent(new Event('change'));
for (let i = 0; i < 6; i++){ await wait(500); snap('enraged +' + (i + 1) * 0.5 + 's'); }
return out;
