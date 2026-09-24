// WHICH OF A MONSTER'S CLIPS LEAVE THE GROUND, measured from the animation itself -- not from the posture table.
//
//   node dev/posture-coverage.mjs <monster> [more monsters ...] [--all] [--url http://localhost:3000]
//
// THE POINT. dev/motion-states-check.mjs walks the entries CLIP_POSTURE already has and asks whether each shows
// what the table says. That can only ever confirm what has already been written down: a clip the table never
// mentions is invisible to it, so a wall or ceiling motion nobody decoded passes silently and plays in mid-air.
// Raven, 2026-09-24: "If we cannot tell which motions are wall or ceiling, then the soaks are not doing their
// job and future soaks will not be able to find the wall or ceilings for monsters that have interactions with
// them." So this walks EVERY clip the monster carries and derives the candidate set from the data.
//
// WHAT IS MEASURED. Each clip's ROOT track -- node `00`, the one the game's unit position follows -- gives the
// root height over the clip (start / min / max / end) and the root's own orientation at frame 0. The glb is in
// metres and the ROM's numbers are game units, so everything here is printed x100, which is what the decode
// notes use. Checked against E:\offline\decode\notes\posture-em003_00.md, which measured the same clips offline
// from the .lmt: 0|Motion[51] reads 472.1 / 472.1 / 957.2 / 926.8 here and 472.1 / 472.1 / 957.2 / 926.8 there,
// 5|Motion[6] 178.9 flat in both. The measurement is the note's, taken from inside the viewer.
//
// WHAT CANNOT BE DONE, because it was tried first. A clip cannot be called a wall or ceiling clip from its height
// or its orientation. Khezu's ROOT SITS AT BODY HEIGHT, so his ground clips measure 300 game units and his cling
// clips 178.9 -- the surface ones are LOWER -- and every cling clip is authored SURFACE-LOCAL, which means upright
// in its own frame, indistinguishable from standing. That is the whole reason the engine supplies the mount. A
// height threshold flagged 66 of his clips, nearly all of them ordinary ground reactions.
//
// WHAT IS FLAGGED, and why it works. A monster's cling clips share one SIGNATURE -- the same root stand-off from
// the surface and the same root orientation -- because they are all authored against the same surface. So the
// clips CLIP_POSTURE already places for a posture define that posture's signature, and any clip the table does
// NOT place whose signature matches one is a clip that belongs to the same family and has been missed. That is
// exactly how posture-em003_00.md 11.2 settled four of Khezu's twenty by hand ("numerically the same root pose as
// 5|Motion[1]_loop, which is [5, 6]"); this does it for every clip, every time the check runs.
//   Such a clip must be either IN the table or named in POSTURE_UNREAD with a reason, or this exits 1. A monster
// with no table has no signatures to match, so it gets the CLUSTERS instead: the distinct root signatures its
// clips fall into and how many clips are in each, which is where a decode starts looking.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const argv = process.argv.slice(2);
const opt = name => { const i = argv.indexOf(name); return i >= 0 ? argv.splice(i, 2)[1] : null; };
let site = opt('--url');
const all = argv.includes('--all');
const monsters = argv.filter(a => !a.startsWith('--'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
async function json(url){ for (let i = 0; i < 150; i++){ try { const r = await fetch(url); if (r.ok) return r.json(); } catch {} await sleep(100); } throw new Error('nothing at ' + url); }
function connect(wsUrl){
  const ws = new WebSocket(wsUrl); let id = 0; const pending = new Map();
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)){ const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); } };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); setTimeout(() => { if (pending.has(i)){ pending.delete(i); rej(new Error('timeout ' + method)); } }, 300000); });
  return new Promise(r => { ws.onopen = () => r({ send }); });
}
const evaluate = (c, expression) => c.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  .then(r => { if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text); return r.result.value; });

// Runs IN THE PAGE. Loads the monster, then for every clip of every list reads its ROOT track without playing it:
// the clip is only selected so the viewer loads its list, and the numbers come from the AnimationClip itself, so
// the mount, the anchor and the ground lock cannot colour the reading.
async function pageMeasure(MON){
  const V = window.__view;
  const MS = await import('/render/motion-states.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 400) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange(); await frames(15);
  const entry = V.MON.monsters.find(e => e.id === MON);
  if (!entry) return { error: 'no monsters.json entry for ' + MON };
  const posture = (MS.CLIP_POSTURE || {})[MON] || null;
  const unread = ((MS.POSTURE_UNREAD || {})[MON]) || {};
  const rows = [];
  for (const list of entry.lists){
    listSel.value = list.id; await listSel.onchange(); await frames(6);
    const seen = new Set();
    for (const c of list.clips){
      const base = c.clip.replace(/_(start|loop)$/, '');
      if (seen.has(base)) continue;
      seen.add(base);
      const o = [...clipSel.options].find(x => x.value === c.clip);
      if (!o) continue;
      clipSel.value = o.value; await clipSel.onchange();
      await until(() => V.pose.action && V.pose.action.getClip().name === o.value, 200);
      const clip = V.pose.action && V.pose.action.getClip();
      if (!clip) continue;
      const t = clip.tracks.find(x => x.name === '00.position');
      const q = clip.tracks.find(x => x.name === '00.quaternion');
      if (!t || !t.values.length) continue;
      const ys = []; for (let i = 1; i < t.values.length; i += 3) ys.push(t.values[i] * 100);
      const g = n => +n.toFixed(1);
      const up = q ? (() => { const x = q.values[0], y = q.values[1], z = q.values[2], w = q.values[3];
        return [2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x)].map(v => +v.toFixed(2)); })() : null;
      const key = list.id + '|' + base;
      // THE SIGNATURE: the root's resting stand-off and its frame-0 orientation, each rounded so authoring noise
      // does not split a family. A clip that travels (its root moves through the clip) is described by where it
      // STARTS, which is the pose the engine mounted it in.
      const sig = g(ys[0]) + '@' + (up ? up.map(v => v.toFixed(1)).join(',') : '?');
      rows.push({ key, clip: o.value, start: g(ys[0]), min: g(Math.min(...ys)), max: g(Math.max(...ys)),
                  end: g(ys[ys.length - 1]), up, sig,
                  listed: posture ? (key in posture ? posture[key] : null) : 'no table',
                  unread: unread[key] || null });
    }
  }
  return { rows, hasTable: !!posture, nListed: posture ? Object.keys(posture).length : 0 };
}

const children = [];
let bad = 0;
try {
  if (!site){
    const port = await freePort();
    children.push(spawn('python', [path.join(HERE, 'serve.py'), String(port)], { stdio: 'ignore' }));
    site = 'http://localhost:' + port;
    for (let i = 0; i < 100; i++){ try { if ((await fetch(site + '/monsters.json')).ok) break; } catch {} await sleep(100); }
  }
  const dport = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'posture-coverage-'));
  children.push(spawn(EDGE, ['--headless=new', '--remote-debugging-port=' + dport, '--user-data-dir=' + profile,
    '--inprivate', '--no-first-run', '--no-default-browser-check', '--disable-sync', '--disable-extensions',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    '--window-size=1280,800', 'about:blank'], { stdio: 'ignore' }));
  const version = await json(`http://127.0.0.1:${dport}/json/version`);
  await connect(version.webSocketDebuggerUrl);
  const targets = await json(`http://127.0.0.1:${dport}/json/list`);
  const page = targets.find(t => t.type === 'page' && t.url === 'about:blank');
  const c = await connect(page.webSocketDebuggerUrl);
  await c.send('Runtime.enable');
  await c.send('Page.navigate', { url: site + '/?scene=none' });
  for (let i = 0; ; i++){
    if (await evaluate(c, '!!(window.__view && window.__view.renderer && window.__view.motionStates)').catch(() => false)) break;
    if (i > 600) throw new Error('the viewer never came up');
    await sleep(200);
  }
  let list = monsters;
  if (all || !list.length){
    const withTable = await evaluate(c, `(async () => Object.keys((await import('/render/motion-states.js')).CLIP_POSTURE || {}))()`);
    list = list.length ? list : withTable;
  }
  const pad = (v, n) => String(v).padEnd(n);
  const num = (v, n) => String(v).padStart(n);
  for (const MON of list){
    const r = await evaluate(c, `(${pageMeasure.toString()})(${JSON.stringify(MON)})`);
    if (r.error){ console.log('%s: %s', MON, r.error); bad++; continue; }
    // the signature of every posture the table places, and which clips gave it
    const sigOf = new Map();                      // signature -> { postures: Set, from: [keys] }
    for (const x of r.rows){
      if (x.listed === null || x.listed === 'no table') continue;
      const ps = Array.isArray(x.listed) ? x.listed : [x.listed];
      if (ps.every(p => p === 0)) continue;       // ground is not a family worth matching
      const e = sigOf.get(x.sig) || { postures: new Set(), from: [] };
      for (const p of ps) e.postures.add(p);
      e.from.push(x.key);
      sigOf.set(x.sig, e);
    }
    console.log('');
    console.log('%s: %d clips, %d placed by CLIP_POSTURE, %d off-ground signatures%s',
      MON, r.rows.length, r.nListed, sigOf.size, r.hasTable ? '' : ' (NO TABLE -- clusters only)');
    if (!r.hasTable){
      const cl = new Map();
      for (const x of r.rows) cl.set(x.sig, (cl.get(x.sig) || []).concat(x.key));
      for (const [sig, keys] of [...cl].sort((a, b) => b[1].length - a[1].length).slice(0, 12))
        console.log('  %s  x%s %s', pad(sig, 26), pad(keys.length, 4), keys.slice(0, 6).join(' ') + (keys.length > 6 ? ' ...' : ''));
      continue;
    }
    for (const [sig, e] of sigOf){
      const posture = [...e.postures].join('/');
      const matches = r.rows.filter(x => x.sig === sig && x.listed === null);
      console.log('  posture %s signature %s  from %s', pad(posture, 5), pad(sig, 26), e.from.slice(0, 3).join(' '));
      for (const x of matches){
        const tag = x.unread ? 'named unread: ' + x.unread : '*** MATCHES AND IS NOT PLACED ***';
        if (!x.unread) bad++;
        console.log('      %s root %s %s %s %s  %s', pad(x.key, 16), num(x.start, 7), num(x.min, 7), num(x.max, 7), num(x.end, 7), tag);
      }
    }
  }
} finally { for (const ch of children) try { ch.kill(); } catch {} }
console.log('\n%s', bad ? bad + ' uncovered clip(s)' : 'every off-ground clip is either placed or named unread');
process.exit(bad ? 1 : 0);
