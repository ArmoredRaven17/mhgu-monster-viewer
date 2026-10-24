const V = window.__view;
const monSel = document.getElementById('monSel');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const out = {};
const TAIL = '5,6,15,16,17,40,45,46,47,55,56,57,107';
const id = 'em080_00';
if (![...monSel.options].some(o => o.value === id)) monSel.add(new Option(id, id));
monSel.value = id; await monSel.onchange(); await wait(1500);
const sel = document.querySelector('[data-row="' + TAIL + '"] select');
out.tailOpts = sel ? [...sel.options].map(o => [o.value, o.textContent]) : 'no tail select';
out.tailValue = sel && sel.value;
const zb = document.getElementById('monZoneBreaks');
out.zoneRowHidden = document.getElementById('monZoneBreakRow').hidden;
out.zoneSwitches = [...zb.querySelectorAll('label')].map(l => [l.textContent, l.querySelector('input').checked]);
const inp = zb.querySelector('input');
if (inp){
  inp.checked = true; inp.onchange(); await wait(300);
  out.afterOn = document.querySelector('[data-row="' + TAIL + '"] select').value;
  const i2 = document.getElementById('monZoneBreaks').querySelector('input');
  out.afterOnChecked = i2 && i2.checked;
  i2.checked = false; i2.onchange(); await wait(300);
  out.afterOff = document.querySelector('[data-row="' + TAIL + '"] select').value;
}
return out;
