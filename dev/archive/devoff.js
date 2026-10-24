const monSel = document.getElementById('monSel');
const bg = () => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
if (![...monSel.options].some(o => o.value === 'em081_04')) monSel.add(new Option('em081_04', 'em081_04'));
monSel.value = 'em081_04'; await monSel.onchange();
const box = document.getElementById('setDeviantTheme'); const out = { boxDefault: box.checked, on: bg() };
box.checked = false; box.dispatchEvent(new Event('change')); out.off = bg(); out.stored = localStorage.getItem('mhgu-monster-viewer-deviant-theme');
monSel.value = 'em007_04'; await monSel.onchange(); out.bloodbathOff = bg();
box.checked = true; box.dispatchEvent(new Event('change')); out.bloodbathOn = bg();
return out;
