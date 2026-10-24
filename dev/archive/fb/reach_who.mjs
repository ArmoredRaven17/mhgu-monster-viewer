// reach_who.mjs <mon> <pel:key>: which clip / variant / shell mode starts the record, and the shell's track (first / last position)
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const ROOT = 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/';
const S = await import(pathToFileURL(ROOT + 'render/shells.js').href);
const M = JSON.parse(readFileSync(ROOT + 'monsters.json', 'utf8'));
const arr = Array.isArray(M) ? M : M.monsters;
const [mon, want] = process.argv.slice(2);
const jm = gid => { const m = new Float32Array(16); m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1; m[12] = 40 + (gid % 7) * 10; m[13] = 250 + (gid % 5) * 20; m[14] = 150 + (gid % 3) * 30; return m; };
const e = arr.find(x => x.id === mon), D = S.SHELL_DATA[mon];
for (const L of e.lists) for (const c of L.clips){
  if (c.clip.endsWith('_start')) continue;
  const bare = c.clip.replace(/_(loop|start)$/, '');
  let vs = []; try { vs = S.pickVariantsFor(mon, L.id, bare, {}) || []; } catch (err) {}
  if (!vs.length) vs = [null];
  const len = Math.max(2, Math.round(c.dur * 60) + (c.clip.endsWith('_loop') ? 120 : 0));
  for (const v of vs){
    const st = S.createShellState(mon); const mine = new Map();
    for (let fr = 0; fr <= len + 600; fr++){
      const out = S.stepShells(st, { monId: mon, list: L.id, clip: bare, frame: Math.min(fr, len), joints: jm,
        rock: { variant: v, target: { x: 900, y: 40, z: 2400 }, floorY: 0 }, owner: { x: 0, y: 0x3000, z: 0 },
        ownerPos: { x: 120.5, y: 15.25, z: -80.75 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, rank: 5, questLevel: 10 });
      for (const sh of out.spawned){
        const def = D.shells[sh.shell], lists = (def && def.lists) || D.lists, md = sh.mode || (def && def.modes[sh.modeIndex]);
        if (md && md.ef && md.ef.some(([li, k]) => lists[li] && (lists[li].pel + ':' + k) === want)) mine.set(sh, { fr, first: sh.position ? [...sh.position] : null });
      }
      for (const [sh, r] of mine) if (sh.position) r.last = [...sh.position], r.lastFr = fr, r.alive = st.shells.includes(sh);
    }
    for (const [sh, r] of mine) console.log('L' + L.id, bare, v, sh.shell, 'mode', sh.modeIndex, 'f', r.fr, 'first', r.first && r.first.map(x => x.toFixed(0)).join(','), 'last', r.last && r.last.map(x => x.toFixed(0)).join(','));
  }
}
