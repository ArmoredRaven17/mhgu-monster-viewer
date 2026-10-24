const V = window.__view;
const M = await import('/render/monster.js');
const monSel = document.getElementById('monSel');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const until = async (f, n = 600) => { for (let i = 0; i < n; i++){ if (f()) return true; await wait(16); } return false; };
const ID = 'em088_00';
if (![...monSel.options].some(o => o.value === ID)) monSel.add(new Option(ID, ID));
monSel.value = ID; await monSel.onchange(); await wait(2000);
await V.effects(false); await V.effects(true);
await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === ID && M.effectRuntimeInstance().schedule);
const rage = document.getElementById('monRage');
await wait(1000);
const out = { calm: [], rage: [] };
for (let i = 0; i < 4; i++){ out.calm.push((await V.shot("ak-mode3", "calm_" + i, 0)).saved); V.pose.action.timeScale = 1; await wait(500); }
rage.checked = true; rage.dispatchEvent(new Event('change', { bubbles: true }));
for (let i = 0; i < 10; i++){ await wait(500); out.rage.push((await V.shot("ak-mode3", "rage_" + i, 0)).saved); V.pose.action.timeScale = 1; }
const fx = M.effectRuntimeInstance();
out.failed = fx.failed ? String(fx.failed) : null;
out.stats = { running: fx.stats.running, prims: fx.stats.prims, models: fx.stats.models };
return out;
