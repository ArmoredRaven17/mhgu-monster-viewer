// SELTAS (em076_00) on his own: HIS WINGS FROM THE ROM (render/monster.js ROM_WINGS / wingPartsAt; dev/em069-duo-spec.md §16;
// Raven, 2026-10-17: "Seltas wing parts are not being toggled during flying sections"). His flight state [+0xcac0]+0x49
// per clip: 1 (out) draws part 4; 2 (flapping) draws part 2 for 2 frames, then parts 1, 3, 4 for 2 (period 4, the +0x40
// count, 0xfc66f8); 0 (folded) and clips with no value leave the Wings row (Away / Out / Flapping) in charge.
async function pageCheckSeltasWings(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Seltas wings: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (await test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em076_00';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  check(V.state.id === MON && V.mounted.main, 'mounted', V.state.id);
  const play = async (list, clip) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === clip);
    if (!o){ check(false, 'the list ' + list + ' has ' + clip); return false; }
    clipSel.value = o.value; await clipSel.onchange();
    return until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
  };
  const wings = () => { const d = V.mounted.main.userData.partsDrawn; return d ? [1, 2, 3, 4].filter(p => d.get(p)) : null; };
  const at = async f => { V.pose.action.paused = true; V.pose.action.time = f / 60; await frames(3); return wings(); };
  const row = () => document.querySelector('#monGroups .field[data-row="1,2,3,4"] select');
  const setRow = async name => { const s = row(); const o = [...s.options].find(x => x.textContent === name); s.value = o.value; s.onchange(); await frames(3); };
  const J = x => JSON.stringify(x);
  check(!!row(), 'his Wings row is on the panel (Away / Out / Flapping)');
  await setRow('Away');

  // FLAPPING (2): his solo flight L2 M24 (7:0x3 / 0xe / 0xf / 0x10 ...), and the 2-frame alternation from the first frame
  await play('2', 'Motion[24]_start');
  const fl = []; for (let f = 0; f < 6; f++) fl.push(await at(f));
  check(J(fl) === J([[2], [2], [1, 3, 4], [1, 3, 4], [2], [2]]),
        'L2 M24 start (solo flight, flapping): part 2 for 2 frames, then parts 1, 3, 4 for 2 -- period 4', fl);
  // its loop counts on over the whole slot (the start is 6 frames): loop frame 0 is slot frame 6
  await play('2', 'Motion[24]_loop');
  const fp = [await at(0), await at(1), await at(2), await at(3)];
  check(J(fp) === J([[1, 3, 4], [1, 3, 4], [2], [2]]), 'L2 M24 loop: the alternation continues over the slot (frame 6 on)', fp);
  // ...and the row does not override a flight state
  await setRow('Out');
  const fo = [await at(0), await at(2)];
  check(J(fo) === J([[1, 3, 4], [2]]), 'with the row on Out, the flight state still draws the flap', fo);
  await setRow('Away');
  // OUT (1): L1 M24 (3:0x17's phase 2)
  await play('1', 'Motion[24]');
  const o1 = [await at(0), await at(20), await at(41)];
  check(o1.every(x => J(x) === J([4])), 'L1 M24 (wings out): part 4 alone, every frame', o1);
  // the flying attack L2 M37 / M38 and the take-off L1 M1: flapping
  await play('2', 'Motion[37]');
  const a37 = [await at(10), await at(12)];
  check(J(a37) === J([[1, 3, 4], [2]]), 'L2 M37 (flying attack): flapping (frame 10 parts 1, 3, 4; frame 12 part 2)', a37);
  // FOLDED (0) and grounded: the row decides
  await play('0', 'Motion[1]_loop');
  const g = [];
  for (const n of ['Away', 'Out', 'Flapping']){ await setRow(n); g.push(await at(30)); }
  check(J(g) === J([[], [1], [2, 3, 4]]), 'L0 M1 (grounded, folded in the ROM): the Wings row decides -- Away none, Out part 1, Flapping 2, 3, 4', g);
  await setRow('Away');
  V.pose.action.paused = false;
  return out;
}
export const pageCheck = pageCheckSeltasWings;
