// Nerscylla part 13 measurement (research agent, 2026-10-17). Serialised into the page by run-check70.mjs.
// args[0] = 'today' (the tables as shipped) or 'rows' (the proposed MOTION_STATES.em070_00 rows injected in memory).
export const args = [['today'], ['rows']];
export async function pageCheck(mode){
  const out = [];
  const note = (label, detail) => out.push([true, '[' + mode + '] ' + label, '']) && out.push([true, '    ' + JSON.stringify(detail), '']);
  const V = window.__view;
  const MS = await import('/render/motion-states.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em070_00';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  const BITES = ['2|Motion[6]', '2|Motion[7]', '2|Motion[10]', '2|Motion[26]', '2|Motion[84]', '2|Motion[85]', '4|Motion[34]'];
  const had = MS.MOTION_STATES[MON];
  if (mode === 'rows'){
    MS.MOTION_STATES[MON] = Object.assign({}, had || {});
    for (const k of BITES) MS.MOTION_STATES[MON][k] = { sets: [16] };
  } else if (had) delete MS.MOTION_STATES[MON];
  const MONSTER = V.MON.monsters.find(e => e.id === MON);
  const drawn = () => { const d = V.mounted.main.userData.partsDrawn; return d ? d.get(13) : null; };
  const play = async (list, clip) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const opts = [...clipSel.options];
    const o = opts.find(x => x.value === clip) || opts.find(x => x.value === clip + '_start') || opts.find(x => x.value === clip + '_loop');
    if (!o) return 'no clip ' + list + '|' + clip;
    clipSel.value = o.value; await clipSel.onchange();
    await until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
    await frames(8);
    return o.value;
  };
  note('partIds / part 50 in the model', { partIds: MONSTER.partIds, has50: MONSTER.partIds.includes(50), g16: MONSTER.groups[16], g17: MONSTER.groups[17] });
  const res = {};
  for (const [l, c] of [['0', 'Motion[2]'], ['0', 'Motion[16]'], ['0', 'Motion[17]'], ['2', 'Motion[5]'], ['2', 'Motion[6]'], ['2', 'Motion[7]'], ['2', 'Motion[10]'],
                        ['2', 'Motion[25]'], ['2', 'Motion[26]'], ['2', 'Motion[84]'], ['2', 'Motion[85]'], ['3', 'Motion[25]'], ['4', 'Motion[33]'], ['4', 'Motion[34]'],
                        ['Special', 'S. L2 Motion 7'], ['Special', 'S. L2 Motion 10'], ['Special', 'S. L2 Motion 1'], ['0', 'Motion[2]']]){
    const v = await play(l, c);
    res[l + '|' + c] = { clip: v, part13: drawn(), cur: (V.motionStates() || {}).cur };
  }
  note('part 13 drawn per clip', res);
  if (had) MS.MOTION_STATES[MON] = had; else delete MS.MOTION_STATES[MON];
  return out;
}
