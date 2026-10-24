// smplan.mjs <mon> [...]: the plays that reach each SHELL record (node replay of stepShells over every clip x variant, as reach.mjs),
// written to smplan.json for shellmeter.mjs: per monster [{ list, clip, n (the clip's pick count: one page play each), frames, recs }]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const ROOT = 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/';
const S = await import(pathToFileURL(ROOT + 'render/shells.js').href);
const M = JSON.parse(readFileSync(ROOT + 'monsters.json', 'utf8'));
const arr = Array.isArray(M) ? M : M.monsters;
const jm = gid => { const m = new Float32Array(16); m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1; m[12] = 40 + (gid % 7) * 10; m[13] = 250 + (gid % 5) * 20; m[14] = 150 + (gid % 3) * 30; return m; };
const GR = { plain: [0, 0], a2: [0, 2], g40: [0x40, 0], g2deep: [2, 0] };
const OUT = 'smfull.json';
const B = await import(pathToFileURL(ROOT + 'render/beam-spawns.js').href);
const plan = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
for (const mon of process.argv.slice(2)){
  const e = arr.find(x => x.id === mon), D = S.SHELL_DATA[mon];
  const grounds = /^em032_/.test(mon) ? Object.keys(GR) : ['plain'];
  const plays = [];
  for (const L of e.lists) for (const c of L.clips){
    if (c.clip.endsWith('_start')) continue;
    const bare = c.clip.replace(/_(loop|start)$/, '');
    let vs = []; try { vs = S.pickVariantsFor(mon, L.id, bare, {}) || []; } catch (err) {}
    const n = Math.max(1, vs.length);
    if (!vs.length) vs = [null];
    const sib = L.clips.find(x => x.clip === bare + '_start');
    const len = Math.max(2, Math.round((c.dur + (sib ? sib.dur : 0)) * 60));
    for (const g of grounds){
      const recs = new Set(), named = new Set(); let last = 0;
      for (const v of vs){
        const st = S.createShellState(mon);
        for (let fr = 0; fr <= len + 600; fr++){
          let out;
          try { out = S.stepShells(st, { monId: mon, list: L.id, clip: bare, frame: Math.min(fr, len), joints: jm,
            rock: { variant: v, target: { x: 900, y: 40, z: 2400 }, floorY: 0 }, owner: { x: 0, y: 0x3000, z: 0 },
            ownerPos: { x: 120.5, y: 15.25, z: -80.75 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, rank: 5, questLevel: 10,
            floorFlags: GR[g][0], floorAttr: GR[g][1] }); } catch (err) { break; }
          for (const s of out.started){ const q = s.start; if (q && q.pel){ recs.add(q.pel + ':' + q.key); last = Math.max(last, fr); } }
          for (const sh of out.spawned){ const q = sh.start; if (q && q.pel){ recs.add(q.pel + ':' + q.key); last = Math.max(last, fr); }
            const def = D.shells[sh.shell], lists = (def && def.lists) || D.lists, md = sh.mode || (def && def.modes[sh.modeIndex]);
            for (const [li, k] of (md && md.ef) || []) if (li <= 7 && k >= 0 && lists[li]) named.add(lists[li].pel + ':' + k); }
        }
      }
      if (recs.size || named.size) plays.push({ list: L.id, clip: bare, n, ground: g, frames: Math.min(900, Math.max(len, last) + 60), recs: [...recs].sort(), named: [...named].sort() });
    }
  }
  for (const r of (B.BEAM_SPAWNS[mon] || [])){
    if (plays.some(p => p.list === r.list && p.clip === r.clip && p.beam)) continue;
    const L = e.lists.find(l => String(l.id) === String(r.list)); if (!L) continue;
    let vs = []; try { vs = S.pickVariantsFor(mon, r.list, r.clip, {}) || []; } catch (err) {}
    const durOf = c => { const x = L.clips.filter(q => q.clip.replace(/_(loop|start)$/, '') === c); return x.reduce((a, q) => a + q.dur, 0); };
    const fr = Math.min(900, Math.round((durOf(r.clip) + (r.partners || []).reduce((a, c) => a + durOf(c), 0)) * 60) + 120);
    plays.push({ list: String(r.list), clip: r.clip, n: Math.max(1, vs.length), ground: 'plain', frames: fr, recs: [], named: [], beam: true, partners: r.partners || [], rage: !!(r.when && r.when.rage) });
  }
  plan[mon] = plays;
  console.log(mon, plays.length, 'plays', plays.reduce((a, p) => a + p.n, 0), 'page plays');
}
writeFileSync(OUT, JSON.stringify(plan));
