// hypermotion/attackcheck.mjs: the page mounts; on Khezu L2 M3 with Hyper 1,2 the play's ModifyData attack change (AttackRate / PowerRate,
// the hit fill 0x1689b0) reaches window.__hyperMotion.attack (the Attack Hitboxes tooltip's line), and is null with Hyper off.
async function check(){
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id), monSel = $('monSel'), listSel = $('monList'), clipSel = $('monClip'), sel = $('monHyper');
  monSel.value = 'em003_00'; await monSel.onchange(); await frames(30);
  listSel.value = '2'; await listSel.onchange(); await frames(2);
  const c = [...clipSel.options].map(o => o.value).find(v => v === 'Motion[3]' || v.startsWith('Motion[3]_'));
  const res = {};
  for (const hv of ['', '1,2']){
    await until(() => [...sel.options].some(o => o.value === hv), 300);
    sel.value = hv; sel.dispatchEvent(new Event('change'));
    clipSel.value = c; await clipSel.onchange(); await frames(40);
    res[hv || 'off'] = JSON.stringify(window.__hyperMotion);
  }
  sel.value = ''; sel.dispatchEvent(new Event('change'));
  const on = JSON.parse(res['1,2'] || 'null');
  return [[!!V.renderer, 'MOUNT', ''], [res.off === 'null', 'OFF: no change', res.off],
          [!!(on && on.attack && on.attack.rate === 1.4 && on.attack.power === 10), 'ON: attack x1.4 / +10 on L2 M3', res['1,2']]];
}
export const pageCheck = check;
export const args = [[]];
