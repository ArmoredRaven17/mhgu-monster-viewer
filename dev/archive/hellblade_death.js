const V = window.__view;
const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const until = async (f, n = 600) => { for (let i = 0; i < n; i++){ if (f()) return true; await wait(16); } return false; };
if (![...monSel.options].some(o => o.value === 'em080_04')) monSel.add(new Option('em080_04', 'em080_04'));
monSel.value = 'em080_04'; await monSel.onchange(); await wait(2000);
const TAIL = [5, 6, 15, 16, 17, 40, 45, 46, 47, 55, 56, 57, 107];
const drawn = () => { const d = V.mounted.main.userData.partsDrawn; return TAIL.filter(p => d && d.get(p) === true); };
const tailSel = document.querySelector('[data-row="5,6,15,16,17,40,45,46,47,55,56,57,107"] select');
const out = { items: tailSel ? [...tailSel.options].map(o => o.textContent.trim()) : 'no row' };
async function at(itemLabel, list, clip){
  const o = [...tailSel.options].find(x => x.textContent.trim() === itemLabel);
  tailSel.value = o.value; tailSel.dispatchEvent(new Event('change')); await wait(300);
  const alive = drawn();
  if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
  clipSel.value = clip; await clipSel.onchange();
  await until(() => V.pose.action && V.pose.action.getClip().name === clip);
  await wait(500);
  return { alive, dead: drawn() };
}
out.intactHeated_L3M18 = await at('Intact (Heated)', '3', 'Motion[18]');
out.crackedBlasted_L3M18 = await at('Cracked (Blasted)', '3', 'Motion[18]');
out.severedHeated_L3M18 = await at('Severed (Heated)', '3', 'Motion[18]');
return out;
