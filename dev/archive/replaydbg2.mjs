import { readFileSync } from 'node:fs';
const V = 'file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells_dbg.mjs';
const { stepShells, createShellState } = await import(V);
const tag = process.argv[2] || 'Ll_2M9_none_f4';
const cap = JSON.parse(readFileSync(`C:/MHGU-Extract/efx/plans/em084_00/cap_em084_00_${tag}.json`, 'utf8')).steps;
const R = JSON.parse(readFileSync('C:/MHGU-Extract/efx/joints/em084_00_shells_rest.json', 'utf8'));
const rest = gid => R.joints[gid] ? R.joints[gid].map(Math.fround) : null;
const state = createShellState('em084_00');
for (let k = 0; k < Math.min(cap.length, 400); k++){
  const s = cap[k], J1 = s.joints || {};
  const extra = { ...(s.extra || {}) };
  if (extra.attachedJoints) extra.attachedJoints = Object.fromEntries(Object.entries(extra.attachedJoints).map(([side, o]) => [side, gid => o[gid] ? o[gid].map(Math.fround) : null]));
  const input = { monId: 'em084_00', list: s.list, clip: s.clip, frame: s.frame, loopStart: s.loopStart, rage: false, rock: s.rock,
                  owner: s.owner || undefined, ownerPos: s.ownerPos || undefined, hitLife: true, effectAlive: () => true, stepCount: k + 1,
                  ...extra, joints: gid => J1[gid] ? J1[gid].map(Math.fround) : rest(gid) };
  const out = stepShells(state, input);
  for (const S of out.spawned) if (S.base !== 'base06') console.log('k', k, 'f', s.frame, 'spawned', S.shell, S.modeIndex, 'start', S.start ? S.start.pel + ':' + S.start.key : null);
  if (out.refused.length) console.log('k', k, 'refused', JSON.stringify(out.refused).slice(0, 300));
}
console.log('done');
