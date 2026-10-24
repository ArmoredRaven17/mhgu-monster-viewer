const V = window.__view;
const M = await import('/render/monster.js');
const monSel = document.getElementById('monSel');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
if (![...monSel.options].some(o => o.value === 'em063_00')) monSel.add(new Option('em063_00', 'em063_00'));
monSel.value = 'em063_00'; await monSel.onchange(); await wait(2500);
const out = {};
for (const lv of [0, 1, 2]){
  M.setArmSlimeLevel(V.mounted.main, null, lv);
  await wait(500);
  out['level' + lv] = { levels: M.armSlimeLevels(V.mounted.main), shot: await V.shot('brachy-arms', 'level' + lv) };
}
M.setArmSlimeLevel(V.mounted.main, null, 2);
return out;
