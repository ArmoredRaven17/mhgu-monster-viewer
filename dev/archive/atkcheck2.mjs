// atkcheck2.mjs: the Attack Hitboxes after the five reads -- Basarios's type-3 cylinder (L2 M3, set 10..13: placed, not skipped, ends
// straight up the world's Y), Lao-Shan's per-frame arms (L3 M1), Neset's (L3 M16), the record info (power / element / status) and the
// hover text (describeText), the touch test with the Solid hunter at the type-3 shape
async function all(){
async function atkCheck2(mon, list, clip, dist, expect){
    const out = [];
    const V = window.__view, M = await import('/render/monster.js'), AH = await import('/render/attack-hitboxes.js');
    const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
    const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
    V.pose.clock.getDelta = () => 1 / 60;
    const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
    if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
    monSel.value = mon; await monSel.onchange();
    await V.effects(false); await V.effects(true);
    await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === mon, 900);
    window.__hunter.set(dist, 0, 1);
    const sel = document.getElementById('monAtkBox');
    { const rw = document.getElementById('monAtkBoxRow'), hd = rw.closest('section') && rw.closest('section').querySelector('.panel-head');
    out.push([!rw.hidden && !!hd && /Animation/.test(hd.textContent), mon + ': the Attack Hitboxes row is shown, in the Animation panel', hd ? hd.textContent.trim() : '']); }
    sel.value = 'all'; sel.dispatchEvent(new Event('change'));
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === clip) || [...clipSel.options].find(x => x.value === clip + '_start') || [...clipSel.options].find(x => x.value === clip + '_loop');
    if (!o){ out.push([false, mon + ' ' + list + '|' + clip + ': no such clip', '']); return out; }
    clipSel.value = o.value; await clipSel.onchange();
    V.state.loop = false;
    const seen = []; let lastKey = null, touched = false, maxRows = 0;
    for (let i = 0; i < 300; i += 2){
      await frames(2);
      const st = V.attackBoxes && V.attackBoxes();
      if (!st) continue;
      maxRows = Math.max(maxRows, st.rows.length);
      const on = st.rows.filter(r => r.on).map(r => r.id + (r.touch ? '*' : '') + (r.type3 ? '^' : '') + ':' + r.kind[0]);
      if (st.rows.some(r => r.on && r.touch && r.type3)) touched = true;
      const key = on.join(',');
      if (key !== lastKey){ seen.push(Math.round(st.frame) + ' [' + key + ']'); lastKey = key; }
    }
    const st = V.attackBoxes();
    const rows = st ? st.rows : [];
    out.push([rows.length > 0, mon + ' ' + list + '|' + clip + ': records on the clip', JSON.stringify({ n: rows.length, actions: [...new Set(rows.map(r => r.action))], timeline: seen.slice(0, 14) })]);
    if (expect.pf) out.push([rows.some(r => String(r.action).startsWith('pf')), mon + ': the per-frame arms (pf+...) are drawn', JSON.stringify(rows.filter(r => String(r.action).startsWith('pf')).map(r => [r.id, r.action, r.win]))]);
    if (expect.type3){
      const t3 = rows.filter(r => r.type3);
      out.push([t3.length > 0 && t3.every(r => !r.skipped), mon + ': type-3 records placed (none skipped)', JSON.stringify(t3.map(r => ({ id: r.id, set: r.set, skipped: r.skipped, shapes: r.shapes })))]);
      out.push([true, mon + ': a type-3 shape touched the Solid hunter (dist ' + dist + ') at some frame: ' + touched, '']);
    }
    const info = rows.map(r => r.info).filter(i => i && !i.why);
    out.push([info.length > 0 && info.every(i => typeof i.power === 'number'), mon + ': every record row carries its power / element / status', JSON.stringify(info.slice(0, 4))]);
    // the hover text, made from the same row objects the tooltip uses
    const a = AH.armedFor(mon, list + '|' + (o.value.replace(/_(start|loop)$/, '')), null)[0];
    out.push([!!a && /Power/.test(AH.describeText(a)), mon + ': the hover text', a ? AH.describeText(a) : 'none']);
    sel.value = 'off'; sel.dispatchEvent(new Event('change'));
    window.__hunter.set(-1, 0, 0);
    return out;
  }
  
  const out = [];
  for (const [mon, list, clip, dist, expect] of [
    ['em004_00', '2', 'Motion[3]', 0, { type3: true }],
    ['em012_00', '3', 'Motion[1]', 0, { pf: true }],
    ['em087_00', '3', 'Motion[16]', 0, { pf: true }],
    ['em001_00', '4', 'Motion[6]', 500, {}]]) out.push(...await atkCheck2(mon, list, clip, dist, expect));
  // the type-3 test against the ROM-RUN points, in the page
  const T3 = await import('/render/hit-type3.js');
  const A = { p0: [0, 0, 0], p1: [0, 100, 0], r: 50 }, hb = (x, y) => ({ p0: [x, y, -20], p1: [x, y, 20], r: 10 });
  const ok = [[60, 50, true], [61, 50, false], [0, 110, true], [0, 111, false], [0, 150, false], [58, 105, true], [45, 130, false]]
    .every(([x, y, m]) => !!T3.type3VsHunter(A, hb(x, y)) === m);
  out.push([ok, 'hit-type3.js in the page: the ROM-RUN meets (flat ends: (0, 111) and (0, 150) miss; the rim (58, 105) meets)', '']);
  return out;
}
export const pageCheck = all;
export const args = [];
