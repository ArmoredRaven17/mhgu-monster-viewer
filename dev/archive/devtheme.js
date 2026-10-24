const monSel = document.getElementById('monSel');
const read = () => { const cs = getComputedStyle(document.documentElement);
  return { bg: cs.getPropertyValue('--bg').trim(), accent: cs.getPropertyValue('--accent-hover').trim(), stage: cs.getPropertyValue('--stage').trim(),
           icon: (document.querySelector('.title-icon') || {}).src ? document.querySelector('.title-icon').src.split('/').pop() : null,
           saved: localStorage.getItem('mhgu-monster-viewer-theme') }; };
const pick = async id => { if (![...monSel.options].some(o => o.value === id)) monSel.add(new Option(id, id)); monSel.value = id; await monSel.onchange(); return read(); };
const out = { start: read() };
for (const id of ['em081_04', 'em037_04', 'em083_04', 'em007_04', 'em001_00']) out[id] = await pick(id);
return out;
