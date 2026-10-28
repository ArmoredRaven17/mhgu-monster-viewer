// solidaudit.mjs <allclips.json> <out.json>: every shell / beam clip of the viewer (SHELL_DATA actions + BEAM_SPAWNS rows), each of its
// picks, played through stepShells alone on a stand-in pose with the Solid hunter (input.hunterBody, the target 1500 ahead) and without:
// the clip's frames, then 600 steps of another motion (L0 Motion[0]). Per run: the shells that met the hunter (a 'hunter' event), the
// effects started at a contact (out.started while that shell's hunterHit / hit type 2 was set), and for each such start whether the shell
// let it go (stop / stop2 / ended) -- and the shells still alive at the end of the tail (state not 0xff), with their age.
import { pathToFileURL } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const clips = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const MON = JSON.parse(readFileSync('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/monsters.json', 'utf8'));
const mons = MON.monsters || MON;
const f = Math.fround, mat = t => [1,0,0,0,0,1,0,0,0,0,1,0,t[0],t[1],t[2],1].map(f);
const J = () => mat([0, 300, 300]);
const lenOf = (mon, list, clip) => {
  const m = mons.find(x => x.id === mon), l = m && m.lists.find(x => String(x.id) === String(list));
  if (!l) return null;
  const one = l.clips.find(c => c.clip === clip), st = l.clips.find(c => c.clip === clip + '_start'), lp = l.clips.find(c => c.clip === clip + '_loop');
  if (one) return { n: Math.round(one.dur * 60), loopStart: null };
  if (st && lp) return { n: Math.round((st.dur + lp.dur) * 60), loopStart: Math.round(st.dur * 60) };
  return null;
};
const res = [];
for (const key of clips){
  const [mon, list, clip] = key.split('|');
  const L = lenOf(mon, list, clip);
  if (!L) { res.push({ key, why: 'no clip length' }); continue; }
  let picks = [];
  try { picks = S.pickVariantsFor(mon, list, clip, {}) || []; } catch (e) {}
  if (!picks.length) picks = [null];
  for (const v of picks){
    const row = { key, variant: v };
    for (const body of [false, true]){
      const st = S.createShellState(mon);
      const met = new Map(), starts = [];
      let F = 0, err = null;
      const step = (lst, cl, fr, ls) => {
        const out = S.stepShells(st, { monId: mon, list: lst, clip: cl, frame: fr, loopStart: ls, joints: J, rage: false,
          rock: { variant: v, floorY: 0.0, target: { x: 0, y: 0, z: 1500 } }, owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 },
          ownerMatrix: mat([0, 0, 0]), ground: 0.0, size: [1, 1], baseScale: 1.0, hitLife: true, rank: 5, questLevel: 1, hunterBody: body || undefined,
          hunterYaw: 0, effectAlive: () => true });
        for (const s of st.shells) if ((s.events || []).some(e => e.ev === 'hunter') && !met.has(s.id)) met.set(s.id, { s, at: F });
        for (const x of out.started || []){
          const s = x.shell; if (!s) continue;
          const contact = !!(s.hunterHit || (s.hit && s.hit.type === 2) || met.has(s.id));
          if (contact) starts.push({ id: s.id, shell: s.shell, base: s.base, at: F, kind: x.start && x.start.kind, key: x.start && x.start.key, s });
        }
        F++;
      };
      try {
        for (let fr = 0; fr < L.n; fr++) step(list, clip, fr, L.loopStart != null && fr >= L.loopStart ? L.loopStart : null);
        for (let i = 0; i < 600; i++) step('0', 'Motion[0]', i % 60, null);
      } catch (e) { err = String(e).slice(0, 160); }
      const liveEnd = st.shells.filter(s => s.state !== 0xff).map(s => ({ shell: s.shell, base: s.base, mode: s.modeIndex, state: s.state, met: met.has(s.id) }));
      row[body ? 'solid' : 'none'] = { err, met: [...met.values()].map(x => ({ shell: x.s.shell, base: x.s.base, mode: x.s.modeIndex, at: x.at, endState: x.s.state, inList: st.shells.includes(x.s) })),
                                       starts: starts.map(x => ({ shell: x.shell, base: x.base, at: x.at, kind: x.kind, key: x.key, endState: x.s.state, inList: st.shells.includes(x.s) })),
                                       liveEnd };
    }
    res.push(row);
  }
}
writeFileSync(process.argv[3], JSON.stringify(res));
const sus = res.filter(r => r.solid && (r.solid.liveEnd.length > (r.none ? r.none.liveEnd.length : 0) || r.solid.starts.some(x => x.inList && x.endState !== 0xff)));
console.log(res.length, 'runs;', res.filter(r => r.solid && r.solid.met.length).length, 'with contact;', sus.length, 'suspect');
for (const r of sus) console.log(r.key, r.variant, JSON.stringify({ liveNone: r.none.liveEnd.length, liveSolid: r.solid.liveEnd, starts: r.solid.starts.slice(0, 4) }).slice(0, 600));
