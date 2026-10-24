const V = window.__view;
const monSel = document.getElementById('monSel');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const TAIL = '5,6,15,16,17,40,45,46,47,55,56,57,107';
const id = 'em080_00';
if (![...monSel.options].some(o => o.value === id)) monSel.add(new Option(id, id));
monSel.value = id; await monSel.onchange(); await wait(1500);
await V.effects(false);
const tailSel = () => document.querySelector('[data-row="' + TAIL + '"] select');
const pick = async text => { const s = tailSel(); const o = [...s.options].find(x => x.textContent.trim() === text); s.value = o.value; s.dispatchEvent(new Event('change')); await wait(400); };
const out = {};
// frame the whole monster, then swing round to look at the tail from behind and above, a little out
V.frameAll();
const T = V.camera.position.constructor;
const t = V.controls.target.clone(), p = V.camera.position.clone().sub(t);
p.applyAxisAngle(new T(0, 1, 0), Math.PI * 0.8);
p.multiplyScalar(0.75); p.y += p.length() * 0.35;
V.camera.position.copy(t).add(p); V.camera.lookAt(t); V.controls.update();
for (const [item, name] of [['Intact', 'tail_intact'], ['Intact, Heated', 'tail_heated'], ['Intact, Dulled', 'tail_dulled'], ['Cracked', 'tail_cracked'], ['Cracked, Dulled', 'tail_cracked_dulled']]){
  await pick(item); await wait(300);
  const r = await V.shot('glav_dulled', name, 0);
  out[name] = r && r.saved;
}
return out;
