const M = require('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/monsters.json');
const m = M.monsters.find(x => x.id === 'em084_00');
const arm = [1, 2, 5, 6, 9, 10, 13, 14, 21, 27, 28, 50, 51, 62, 65, 74, 81, 82, 86, 92, 93, 101, 102, 104];
const want = { '0': [1, 2, 3, 50, 8, 4, 63], '2': [86, 101, 102, 103, 82, 81], l_0: [1, 2, 3, 50], r_0: [1, 2, 3, 50], l_2: arm, r_2: arm };
for (const [lid, sl] of Object.entries(want)){
  const l = m.lists.find(x => String(x.id) === lid);
  if (!l){ console.log(lid, 'MISSING'); continue; }
  console.log(lid, sl.map(s => {
    const pre = 'Motion[' + s + ']';
    const c = l.clips.filter(c => c.clip === pre || c.clip.startsWith(pre + '_')).map(c => (c.clip.slice(pre.length) || 'w') + Math.round(c.dur * 60));
    return s + ':' + (c.join('/') || '-');
  }).join(' '));
}
