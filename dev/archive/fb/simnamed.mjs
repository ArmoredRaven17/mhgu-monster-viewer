// simnamed.mjs <mon:pel:key> ...: for a record a reached shell mode NAMES but never starts, replay the plays that make that mode and
// report, for those shells, which ef params DID start (events / starts), how they ended (state, moves, the last event), and the hit
// types the module saw -- so the table can say which trigger the slot waits for
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const ROOT = 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/';
const S = await import(pathToFileURL(ROOT + 'render/shells.js').href);
const M = JSON.parse(readFileSync(ROOT + 'monsters.json', 'utf8')); const arr = Array.isArray(M) ? M : M.monsters;
const plan = JSON.parse(readFileSync('smfull.json', 'utf8')), efmap = JSON.parse(readFileSync('efmap.json', 'utf8'));
const jm = gid => { const m = new Float32Array(16); m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1; m[12] = 40 + (gid % 7) * 10; m[13] = 250 + (gid % 5) * 20; m[14] = 150 + (gid % 3) * 30; return m; };
for (const arg of process.argv.slice(2)){
  const [mon, pel, key] = arg.split(':'), pk = pel + ':' + key;
  const slots = efmap[mon][pk] || [], D = S.SHELL_DATA[mon];
  const wantModes = new Set(slots.map(([n, b, m]) => n + ' ' + m));
  const e = arr.find(x => x.id === mon);
  const seen = new Map();
  for (const p of plan[mon].filter(q => (q.named || []).includes(pk))){
    const L = e.lists.find(l => String(l.id) === p.list);
    let vs = []; try { vs = S.pickVariantsFor(mon, p.list, p.clip, {}) || []; } catch (err) {}
    if (!vs.length) vs = [null];
    const c = L.clips.find(x => x.clip.replace(/_(loop|start)$/, '') === p.clip && !x.clip.endsWith('_start')) || L.clips[0];
    const len = Math.max(2, Math.round(c.dur * 60) + (c.clip.endsWith('_loop') ? 120 : 0));
    for (const v of vs){
      const st = S.createShellState(mon);
      for (let fr = 0; fr <= len + 600; fr++){
        let out; try { out = S.stepShells(st, { monId: mon, list: p.list, clip: p.clip, frame: Math.min(fr, len), joints: jm,
          rock: { variant: v, target: { x: 900, y: 40, z: 2400 }, floorY: 0 }, owner: { x: 0, y: 0x3000, z: 0 },
          ownerPos: { x: 120.5, y: 15.25, z: -80.75 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, rank: 5, questLevel: 10,
          floorFlags: p.ground === 'g2deep' ? 2 : p.ground === 'a2' ? 0 : p.ground === 'g40' ? 0x40 : 0, floorAttr: p.ground === 'a2' ? 2 : 0 }); } catch (err) { break; }
        for (const sh of out.spawned) if (wantModes.has(sh.shell + ' ' + sh.modeIndex) && !seen.has(sh)) seen.set(sh, { play: 'L' + p.list + ' ' + p.clip + ' ' + v, starts: [] });
        for (const s of out.started) if (seen.has(s.shell)) seen.get(s.shell).starts.push((s.start.kind || '') + ':' + s.start.key);
        for (const sh of out.ended.concat(out.removed)) if (seen.has(sh)){ const r = seen.get(sh); r.end = { state: sh.state, moves: sh.moves, ev: (sh.events || []).slice(-3).map(x => x.ev + ':' + (x.kind || '') + ':' + (x.param != null ? x.param : '')) }; }
      }
    }
  }
  const sum = new Map();
  for (const [sh, r] of seen){
    const k = sh.shell + ' m' + sh.modeIndex + ' starts[' + (sh.start ? 'init:' + sh.start.key + ' ' : '') + r.starts.join(' ') + '] end ' + (r.end ? r.end.state + ' after ' + r.end.moves + ' ' + r.end.ev.join(',') : 'alive');
    sum.set(k, (sum.get(k) || 0) + 1);
  }
  console.log('==', mon, pk, slots.map(s => s.join(' ')).slice(0, 4).join('; '));
  for (const [k, n] of [...sum].slice(0, 5)) console.log('   x' + n, k);
}
