const V = window.__view;
const M = await import('/render/monster.js');
const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const until = async (f, n = 600) => { for (let i = 0; i < n; i++){ if (f()) return true; await wait(16); } return false; };
const warns = []; const w0 = console.warn; console.warn = (...a) => { warns.push(a.join(' ')); w0(...a); };
if (![...monSel.options].some(o => o.value === 'em063_00')) monSel.add(new Option('em063_00', 'em063_00'));
monSel.value = 'em063_00'; await monSel.onchange(); await wait(2000);
await V.effects(false); await V.effects(true);
await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === 'em063_00' && M.effectRuntimeInstance().schedule);
const out = { warnings: warns };
const rowSel = rk => { const f = document.querySelector('[data-row="' + rk + '"]'); return f && f.querySelector('select'); };
const R = rowSel('6,7,17,18'), L = rowSel('4,5,15,16');
out.rightOptions = R ? [...R.options].map(o => o.value + '=' + o.textContent.trim()) : 'no row';
out.leftOptions = L ? [...L.options].map(o => o.value + '=' + o.textContent.trim()) : 'no row';
out.defaults = { right: R && R.selectedOptions[0].textContent.trim(), left: L && L.selectedOptions[0].textContent.trim(), levels: M.armSlimeLevels(V.mounted.main) };
const pick = async (sel, label) => { const o = [...sel.options].find(x => x.textContent.trim() === label); sel.value = o.value; sel.dispatchEvent(new Event('change')); await wait(300); };
out.levelsBy = {};
for (const lab of ['Depleted', 'Primed', 'Enraged']){ await pick(R, lab); out.levelsBy[lab] = M.armSlimeLevels(V.mounted.main); }
// the jab with the right arm Depleted fires the impact cloud c 130; Primed does not
async function jab(label){
  await pick(R, label);
  const S = M.effectRuntimeInstance().schedule, got = [];
  const s0 = S.start.bind(S); S.start = e => { got.push((e.def && e.def.record) ? e.def.record.key : '?'); return s0(e); };
  if (V.state.list !== '2'){ listSel.value = '2'; await listSel.onchange(); }
  clipSel.value = 'Motion[5]'; await clipSel.onchange(); await wait(300);
  got.length = 0;
  clipSel.value = 'Motion[8]'; await clipSel.onchange();
  await until(() => V.pose.action && V.pose.action.getClip().name === 'Motion[8]');
  await until(() => V.pose.action.time * 60 >= 16, 300);
  S.start = s0;
  return got;
}
out.jabDepleted = await jab('Depleted');
out.jabPrimed = await jab('Primed');
out.jabEnraged = await jab('Enraged');
console.warn = w0;
return out;
