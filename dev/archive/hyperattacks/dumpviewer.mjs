// hyperattacks/dumpviewer.mjs (hyper-attacks lane, 2026-10-27): the viewer's own transcriptions the attack table joins --
// render/shells.js SHELL_DATA (action -> shell / modes), render/beam-spawns.js BEAM_SPAWNS (action -> beam type), and
// render/monster.js CLIP_EFFECTS (clip -> PSL bits -> effect records; sliced out of monster.js, which imports three).
//   node dev/archive/hyperattacks/dumpviewer.mjs > dev/archive/hyperattacks/viewer.json
import { pathToFileURL, fileURLToPath } from 'url';
import fs from 'fs'; import path from 'path';
const HERE = path.dirname(fileURLToPath(import.meta.url)), R = path.join(HERE, '..', '..', '..', 'docs', 'render');
const S = await import(pathToFileURL(path.join(R, 'shells.js')).href);
const B = await import(pathToFileURL(path.join(R, 'beam-spawns.js')).href);
const P = await import(pathToFileURL(path.join(R, 'psl-mask.js')).href);
const BT = await import(pathToFileURL(path.join(R, 'beam-types.js')).href);
const src = fs.readFileSync(path.join(R, 'monster.js'), 'utf8');
const a = src.indexOf('export const CLIP_EFFECTS = {'), b = src.indexOf('\n};', a);
const CE = Function('return ' + src.slice(a + 'export const CLIP_EFFECTS = '.length, b + 2))();
const a2 = src.indexOf('export const ROM_ANIMATIONS = {'), b2 = src.indexOf('\n};', a2);
const RA = Function('return ' + src.slice(a2 + 'export const ROM_ANIMATIONS = '.length, b2 + 2))();
const out = { shells: {}, beams: B.BEAM_SPAWNS, clipEffects: {}, clipActions: {}, specials: {}, picks: {} };
for (const [m, t] of Object.entries(P.CLIP_ACTIONS)) { out.clipActions[m] = {};
  for (const [k, es] of Object.entries(t)) out.clipActions[m][k] = (es || []).map(e => [P.actionName(e.action), e.rage ? P.actionName(e.rage) : null, e.tired ? P.actionName(e.tired) : null]); }
for (const [m, es] of Object.entries(RA)) out.specials[m] = (es || []).map(e => ({ name: e.name, pieces: (e.pieces || []).map(p => [p[0], p[1]]), action: e.action ? P.actionName(e.action) : null, tired: e.tired ? P.actionName(e.tired) : null, motions: !!e.motions }));
// the shells' pick per clip (index.html rockInput -> shells.js pickVariantsFor; beam state the default {})
for (const [m, v] of Object.entries(S.SHELL_DATA)) { const seen = new Set(); out.picks[m] = {};
  for (const x of v.actions || []) for (const c of [x.clip, ...(x.partners || [])]) { if (!c) continue; const k = x.list + '|' + c.replace(/_(start|loop)$/, ''); if (seen.has(k)) continue; seen.add(k);
    try { out.picks[m][k] = S.pickVariantsFor(m, x.list, c.replace(/_(start|loop)$/, ''), {}); } catch (e) { out.picks[m][k] = ['ERR ' + e.message]; } } }
for (const [m, v] of Object.entries(S.SHELL_DATA)) out.shells[m] = (v.actions || []).map(x => ({
  action: x.action, also: x.also || [], list: x.list, clip: x.clip, partners: x.partners || [], frame: x.frame, frames: x.frames,
  shell: x.shell, mode: x.mode, modes: x.modes, modesG: x.modesG, spawns: x.spawns, pick: x.pick, code: x.code, wave2: x.wave2 }));
for (const [m, v] of Object.entries(CE)) {
  out.clipEffects[m] = {};
  for (const [clip, c] of Object.entries(v)) out.clipEffects[m][clip] = (c.bits || []).map(x => [x.bit, x.efl, x.key]);
}
// a beam takes BEAM02_HYPER (cls 2, aura -1) only with a hit (shells.js hyperShellElement: type.hit[0] >= 0)
out.beamHit = {}; for (const t of BT.BEAM_TYPES || []) out.beamHit[t.id] = t.hit || [];
// the records an action's own code requests (psl-mask.js ACTION_EFFECTS: clip -> { frame, by: { action: [pel, key, kind] } })
out.actionEffects = P.ACTION_EFFECTS;
// the per-frame shell makers keyed by MOTION id (e+0x4b4 = list << 8 | motion), not by action: the Rath line's dust, Khezu's perFrame,
// Basarios / Gravios perFrame004, Tigrex perFrame032, Astalos perFrame081 -- every one makes shell01 (make001); Zinogre's G escorts
// perFrame057 make shell18 modes 0x2a + 2k (+1 charged) (shells.js PERFRAME057 note)
out.perFrame = {};
for (const [m, v] of Object.entries(S.SHELL_DATA)) {
  const rows = [];
  for (const k of ['dust', 'perFrame', 'perFrame004', 'perFrame032', 'perFrame081'])
    for (const r of (Array.isArray(v[k]) ? v[k] : [])) rows.push({ src: k, shell: 'shell01', mode: r.mode, ids: r.ids, frames: r.frames || (r.frame != null ? [r.frame] : []) });
  for (const r of (Array.isArray(v.perFrame057) ? v.perFrame057 : [])) rows.push({ src: 'perFrame057', shell: 'shell18', modes: [0x2a + 2 * r.k, 0x2b + 2 * r.k], ids: [0x200 + +/\d+/.exec(r.clip)[0]], frames: [r.frame], rankG: true });
  if (rows.length) out.perFrame[m] = rows;
}
// THE NEVER-TIRED MECHANISM (Khezu AoE lane, 2026-10-27; rom-map `0xba1a0..0xba1c0`: hyper sets P+0x1a8 bit 19, read only by the
// stamina routines 0xbd0c8 / 0xbd1a4 / 0xbd23c / 0xbd2c4 -- P+0x505 stays 0, 0x81614 never answers tired):
//   tiredBits[mon][clip][action|'-'] = the PSL bits the enable word sets ONLY while tired (pslMask tired:true minus calm and enraged;
//     the base 0xca170's 12-14 and any class arm on 0x81614), or the base's 12-14 where the class is unread;
//   tiredPicks[mon][clip] = the shells' op-0x24 'if' actions (pickVariantsFor tired) the not-tired streams never issue;
//   tiredClips[mon] = MOTION_STATES rows marked tired: true (clips that show the monster exhausted).
const MS = await import(pathToFileURL(path.join(R, 'motion-states.js')).href);
const AMJ = JSON.parse(fs.readFileSync(path.join(R, '..', 'action-motions.json'), 'utf8'));
out.tiredBits = {}; out.tiredPicks = {}; out.tiredClips = {};
for (const [m, v] of Object.entries(CE)) {
  const T = out.tiredBits[m] = {};
  for (const clip of Object.keys(v)) {
    const mm = /^L(\d+) Motion\[(\d+)\]$/.exec(clip); if (!mm) continue;
    const acts = [null, ...(((AMJ[m] || {}).motions || {})[mm[1] + '|Motion[' + mm[2] + ']'] || []).map(P.actionOf)];
    for (const a of acts) {
      const w = st => { const r = P.pslMask(m, mm[1], +mm[2], a, st); return r == null ? P.baseMask(st) : r; };
      const only = (w({ tired: true }) & ~w({}) & ~w({ rage: true })) >>> 0;
      const bits = (v[clip].bits || []).filter(b => (only >>> b.bit) & 1).map(b => [b.bit, b.efl, b.key]);
      if (bits.length) (T[clip] = T[clip] || {})[a ? P.actionName(a) : '-'] = bits;
    }
  }
}
for (const [m, v] of Object.entries(S.SHELL_DATA)) {
  const seen = new Set(); out.tiredPicks[m] = {};
  for (const x of v.actions || []) { if (!x.clip) continue; const c = x.clip.replace(/_(start|loop)$/, ''), k = x.list + '|' + c; if (seen.has(k)) continue; seen.add(k);
    try { const t = S.pickVariantsFor(m, x.list, c, { tired: true }), n = S.pickVariantsFor(m, x.list, c, {});
      const only = t.filter(a => !n.includes(a)); if (only.length) out.tiredPicks[m][k] = only; } catch (e) {} }
}
out.tiredDrool = MS.TIRED_DROOL || {};                // the tired drool c 1104 per monster (0xa42d0..0xa4334)
for (const [m, rows] of Object.entries(MS.MOTION_STATES || {})) {
  const t = Object.entries(rows || {}).filter(([k, r]) => r && r.tired === true).map(([k]) => k);
  if (t.length) out.tiredClips[m] = t;
}
// Zinogre's leap modes (shells.js LEAP057 / LEAP057V4: [leap][which][charged]), sliced out of shells.js (not exported)
const ssrc = fs.readFileSync(path.join(R, 'shells.js'), 'utf8');
for (const nm of ['LEAP057', 'LEAP057V4']) { const i = ssrc.indexOf('const ' + nm + ' = {'), j = ssrc.indexOf('};', i);
  out[nm] = Function('return ' + ssrc.slice(i + ('const ' + nm + ' = ').length, j + 1))(); }
process.stdout.write(JSON.stringify(out));
