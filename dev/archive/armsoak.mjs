// Nakarkos with the arm runtimes up: every clip of the given lists played whole on the page's own loop; after each, the body's
// and both arms' runtimes are read for a refusal (live.js fail). A refused runtime is remounted (effects off / on).
//   node run-check.mjs armsoak.mjs   (args below)
async function soak(lists){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === 'em084_00')) monSel.add(new Option('em084_00', 'em084_00'));
  monSel.value = 'em084_00'; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  const side = k => V.sideEffectRuntimeObj(k);
  const rts = () => ({ body: M.effectRuntimeInstance(), left: side('em084_00_left'), right: side('em084_00_right') });
  const upAll = () => { const r = rts(); return r.body && r.body.schedule && r.left && r.left.schedule && r.right && r.right.schedule; };
  await until(upAll, 900);
  V.state.loop = true;
  const e = V.MON.monsters.find(x => x.id === 'em084_00');
  let played = 0, refused = [], starts = { left: 0, right: 0 };
  for (const list of lists){
    const L = e.lists.find(x => x.id === list);
    for (const c of L.clips){
      if (/_start$/.test(c.clip)) continue;     // its _loop follows
      if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
      const o = [...clipSel.options].find(x => x.value === c.clip);
      if (!o) continue;
      await until(upAll, 900);
      for (const k of ['left', 'right']){ const S = rts()[k] && rts()[k].schedule; if (S && !S.__n){ S.__n = 1; const f0 = S.startClip.bind(S); S.startClip = (a, b) => { const q = f0(a, b); starts[k] += q.length; return q; }; } }
      clipSel.value = o.value; await clipSel.onchange();
      const n = Math.min(900, Math.round(c.dur * 60 * (/_loop$/.test(c.clip) ? 2 : 1)) + 10);
      await frames(n);
      played++;
      const r = rts(), bad = Object.entries(r).filter(([, x]) => x && x.failed).map(([k, x]) => k + ': ' + x.failed.slice(0, 100));
      if (bad.length){ refused.push(list + ' ' + c.clip + ' -- ' + bad.join(' | ')); await V.effects(false); await V.effects(true); await until(upAll, 900); }
    }
  }
  out.push([refused.length === 0, 'Nakarkos arm soak ' + lists.join(',') + ': ' + played + ' clips, ' + refused.length + ' refused, arm starts ' + JSON.stringify(starts), JSON.stringify(refused)]);
  return out;
}
export const pageCheck = soak;
export const args = [[['0', '2', '3']], [['l_0', 'l_2', 'l_3']], [['r_0', 'r_2', 'r_3']]];
