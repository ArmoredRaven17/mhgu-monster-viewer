// THE BEAM TEST'S GROUPS (Raven, 2026-09-30: "Make an animation for each group of beams, this way I can skip the ones I
// know are good and go to the ones that seem to have issues"): one Special entry per monster whose beams the ROM holds, in
// render/beam-types.js order, each cycling only that monster's types -- beside the 'Beam Test' that cycles all of them.
// A group's name carries its types' numbers as the label counts them (1-based, of all), so "Test 9" is found by name.
// render/monster.js makes the entries; render/shells.js gives each its picks.
import { BEAM_TYPES } from './beam-types.js';

export const BEAM_TEST = 'Beam Test';
export const BEAM_GROUPS = [];
for (const [i, t] of BEAM_TYPES.entries()){
  let g = BEAM_GROUPS.find(x => x.monName === t.name);
  if (!g) BEAM_GROUPS.push(g = { monName: t.name, ids: [] });
  g.ids.push(i);
}
for (const g of BEAM_GROUPS){
  const a = g.ids[0] + 1, b = g.ids[g.ids.length - 1] + 1;
  g.clip = BEAM_TEST + ' - ' + g.monName + ' (' + (a === b ? a : a + '-' + b) + ')';
}
// the beam type indices a Beam Test entry cycles: all of them for 'Beam Test', a group's own for its entry, else null
export function beamIdsOf(clip){
  if (clip === BEAM_TEST) return BEAM_TYPES.map((t, i) => i);
  const g = BEAM_GROUPS.find(x => x.clip === clip);
  return g ? g.ids.slice() : null;
}
