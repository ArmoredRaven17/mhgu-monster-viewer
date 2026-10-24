window.__MON = 'em081_04';
const MON = window.__MON || 'em081_00';
const V = window.__view;
const M = await import('/render/monster.js');
const MS = await import('/render/motion-states.js');
const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
monSel.value = MON; await monSel.onchange();
await V.effects(true);
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const entry = V.MON.monsters.find(e => e.id === MON);
const pickClip = async (lid, clip) => {
  const list = entry.lists.find(l => l.id === lid); if (!list) return false;
  const name = list.clips.some(c => c.clip === clip) ? clip : list.clips.some(c => c.clip === clip + '_start') ? clip + '_start' : list.clips.some(c => c.clip === clip + '_loop') ? clip + '_loop' : null;
  if (!name) return false;
  if (V.state.list !== lid){ listSel.value = lid; await listSel.onchange(); }
  clipSel.value = name; await clipSel.onchange(); return true;
};
const live = () => {
  const fx = M.effectRuntimeInstance(); if (!fx) return ['no runtime'];
  const out = [];
  for (const e of fx.schedule.entries){
    if (!e.def.record) continue;
    const q = e.requests.filter(q => !q.stopped);
    if (q.length) out.push(e.def.record.pel + ':' + e.def.record.key + '(' + e.when + ')x' + q.length);
  }
  return out;
};
const table = (MS.MOTION_STATES || MS.default || {})[MON] || {};
const keys = window.__KEYS || Object.keys(table).filter(k => /^\d+\|Motion\[\d+\]$/.test(k));
const res = { keysTried: keys.length, neutral: null, lingering: {} };
// a neutral clip: L0's first clip not in the table
const L0 = entry.lists[0];
const neutral = L0.clips.map(c => c.clip).find(c => !table[L0.id + '|' + c.replace(/_(start|loop)$/, '')]);
res.neutral = L0.id + ' ' + neutral;
await pickClip(L0.id, neutral); await wait(2000);
const base = live(); res.baseline = base;
for (const k of keys){
  const [lid, clip] = k.split('|');
  if (!(await pickClip(lid, clip))) continue;
  await wait(3000);
  const during = live();
  await pickClip(L0.id, neutral); await wait(5000);
  const after = live().filter(x => !base.includes(x));
  if (after.length) res.lingering[k] = { during, after };
}
return res;
