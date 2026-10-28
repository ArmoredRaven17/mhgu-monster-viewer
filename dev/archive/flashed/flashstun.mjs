// flashstun.mjs (Flashed state, 2026-10-25): the switch against the rows that share its record and its gates, on Rathian.
//   A  Flashed on through L0 -> the stun hold L3 M5 -> L0: ONE c 1103 request all along (0xa3ef0's one handle, e+0xb62c).
//   B  Flashed off during L3 M5: the stun row keeps it; the next L0 clip stops it.
//   C  Flashed on through a death row (L3 M17, dead): stopped there (0x75be4 zeroes the timer); back on the next L0 play.
//   D  The notice: with Flashed on, a hunter in view fires no c 1200 (0xc362c / 0x7ea24); switched off, c 1200 fires.
//   node dev/archive/run-check-detail.mjs dev/archive/flashed/flashstun.mjs --url http://localhost:<port>
async function flashStun(MON){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'), listSel = $('monList'), clipSel = $('monClip'), box = $('monFlashed');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
  const rt = M.effectRuntimeInstance();
  await frames(5); window.__refreshSharedRow();
  const pel = MON.slice(0, 5) + '_00c';
  const entry = rt.schedule.entries.find(e => e.when === 'event' && e.def.record && e.def.record.pel === pel && e.def.record.key === 1103);
  const live = () => entry ? entry.requests.filter(q => !q.stopped).length : -1;
  const total = () => entry ? entry.requests.length : -1;
  const play = async (list, clip) => {
    if (listSel.value !== String(list)){ listSel.value = String(list); await listSel.onchange(); }
    const opts = [...clipSel.options];
    const o = opts.find(x => x.value === clip) || opts.find(x => x.value.startsWith(clip + '_loop')) || opts.find(x => x.value.startsWith(clip + '_'));
    if (!o) throw new Error('no clip ' + list + ' ' + clip + ' in ' + [...clipSel.options].map(x => x.value).slice(0, 8).join(','));
    clipSel.value = o.value; await clipSel.onchange();
  };
  const set = on => { box.checked = on; box.dispatchEvent(new Event('change')); };
  const l0 = () => clipSel.options[1].value;
  window.__hunter.set(25000, 180, null); await frames(10);
  V.state.loop = true;
  // A
  await play(0, 'Motion[1]'); set(true); await frames(60);
  const a1 = [live(), total()];
  await play(3, 'Motion[5]'); await frames(60);
  const a2 = [live(), total()];
  await play(0, 'Motion[1]'); await frames(60);
  const a3 = [live(), total()];
  out.push([a1[0] === 1 && a2[0] === 1 && a3[0] === 1 && a3[1] === a1[1], 'FLASHSTUN A one request through L0 -> L3 M5 (stun) -> L0', JSON.stringify({ a1, a2, a3 })]);
  // B
  await play(3, 'Motion[5]'); await frames(30); set(false); await frames(30);
  const b1 = live();
  await play(0, 'Motion[1]'); await frames(30);
  const b2 = live();
  out.push([b1 === 1 && b2 === 0, 'FLASHSTUN B off during the stun: the stun keeps it, the next clip stops it', JSON.stringify({ b1, b2 })]);
  // C
  set(true); await frames(30);
  const c0 = live();
  await play(3, 'Motion[17]'); await frames(30);
  const c1 = live(), dead = window.__flashed.now().on;
  await play(0, 'Motion[1]'); await frames(30);
  const c2 = live();
  out.push([c0 === 1 && c1 === 0 && c2 === 1, 'FLASHSTUN C a death row stops it; the next play holds it again', JSON.stringify({ c0, c1, dead, c2 })]);
  // D -- a fresh combat byte (0): the runtime is rebuilt with the hunter out of sight (the Effects switch clears the shared row,
  // Flashed with it, as Poisoned), Flashed goes on, and only then does the hunter come into view
  window.__hunter.set(25000, 180, null); await frames(10);
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance() !== rt && M.effectRuntimeInstance().schedule, 900);
  await frames(30); window.__refreshSharedRow(); set(true); await frames(10);
  const n0 = window.__notice.now();
  window.__hunter.set(1200, 0, null); await frames(120);
  const n1 = window.__notice.now();
  set(false); await frames(60);
  const n2 = window.__notice.now();
  out.push([n0 && n1 && n2 && n1.fired.c1200 === n0.fired.c1200 && n2.fired.c1200 === n1.fired.c1200 + 1,
            'FLASHSTUN D no c 1200 while flashed with the hunter in view; c 1200 once switched off',
            JSON.stringify({ before: n0 && n0.fired, flashed: n1 && n1.fired, after: n2 && n2.fired, last: n1 && n1.last && { dist: n1.last.dist } })]);
  V.state.loop = false;
  window.__hunter.set(0, 0, null);
  return out;
}
export const pageCheck = flashStun;
export const args = [['em001_00']];
