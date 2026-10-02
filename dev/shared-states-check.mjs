// Do the SHARED-STATE records actually FIRE in the viewer?
//
// Raven, 2026-09-28: a record that is exported but that nothing drives is WIRED IN, not IMPLEMENTED --
// it never appears, so it cannot be verified. The shared-state records sat exactly there, because
// SharedStates was constructed by no module at all, and a soak would never have said so: nothing
// refuses, the records simply never start. So this check asserts the REQUESTS, not the absence of
// errors -- turn a state on, step the runtime, count what the schedule started for that key.
//
// The browser plumbing is effect-live-soak.mjs's, headless Edge over CDP against dev/serve.py, so this
// runs the same viewer the soaks do rather than inventing a second harness.
//
//     node dev/shared-states-check.mjs [monster]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const ARGS = process.argv.slice(2);
const ALL = ARGS.includes('--all');
const LIST = ARGS.includes('--list') ? ARGS[ARGS.indexOf('--list') + 1].split(',') : null;
const MON = (!ALL && !LIST && ARGS[0]) || 'em001_00';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
async function json(url){
  for (let i = 0; i < 150; i++){ try { const r = await fetch(url); if (r.ok) return r.json(); } catch {} await sleep(100); }
  throw new Error('nothing at ' + url);
}
function connect(wsUrl){
  const ws = new WebSocket(wsUrl); let id = 0; const pending = new Map();
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)){ const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); }
  };
  ws.onclose = () => { for (const { rej } of pending.values()) rej(new Error('socket closed')); pending.clear(); };
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params }));
    setTimeout(() => { if (pending.has(i)){ pending.delete(i); rej(new Error('timeout ' + method)); } }, 60000);
  });
  return new Promise(r => { ws.onopen = () => r({ send }); });
}
const evaluate = (c, expression) => c.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  .then(r => { if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text); return r.result.value; });

// Runs IN THE PAGE. The counts come from the ROM's countdown (0x7206c: an expired timer FIRES, which is
// why the first request is immediate), so `want` is 1 + floor((frames - 1) / period).
function pageCheck(MONID){
  return (async () => {
    const V = window.__view;
    const M = await import('./render/monster.js');
    // Load the monster the way the viewer does. Navigating with a query parameter does NOT: the page
    // reads no monster id from the URL, so the old `?m=` silently left the default monster loaded and
    // every per-monster result here was really the default's.
    const monSel = document.getElementById('monSel');
    if (V.state.id !== MONID){
      if (![...monSel.options].some(o => o.value === MONID)) monSel.add(new Option(MONID, MONID));
      monSel.value = MONID; await monSel.onchange();
    }
    if (V.state.id !== MONID) return { error: 'asked for ' + MONID + ' but the viewer holds ' + V.state.id };
    await V.effects(false); await V.effects(true);
    const fx = M.effectRuntimeInstance();
    if (!fx) return { error: 'no effect runtime' };
    if (!fx.sharedStates) return { error: 'SharedStates NOT CONSTRUCTED -- the records would never fire' };
    // c 1106 and c 1500 are no longer driven (Raven checked them against the game), so they are not asserted.
    const PLAN = [['c1100', 1100, 181, 3], ['c1108', 1108, 109, 4]];
    const res = [];
    for (const [name, key, frames, want] of PLAN){
      const before = (fx.sharedStateStats().fired || {})[name] || 0;
      if (!fx.setSharedState(name, true)){ res.push({ name, error: 'state not known to the driver' }); continue; }
      for (let f = 0; f < frames; f++) fx.sharedStates.step();
      fx.setSharedState(name, false);
      const fired = ((fx.sharedStateStats().fired || {})[name] || 0) - before;
      res.push({ name, key, frames, want, fired, ok: fired === want });
    }
    // Which blast parts SHOULD fire is the monster's own data: key 1130 + p must exist. Monsters carry
    // between 0 and 8 of these and two of them have gaps, so a fixed 0..7 would fail correct monsters.
    const haveKeys = new Set(fx.effects.filter(e => e.def && e.def.record).map(e => e.def.record.key));
    const blast = [], blastWant = [];
    for (let p = 0; p < 9; p++){ blast.push(fx.blastPart(p).length); blastWant.push(haveKeys.has(1130 + p) ? 1 : 0); }
    const edges = { a: fx.setCombat(0, 2).length, b: fx.setCombat(2, 1).length, c: fx.setCombat(2, 0).length };
    return { res, blast, blastWant, edges, pel: fx.sharedStates.pel, starts: fx.schedule.starts, loaded: V.state.id };
  })();
}

const children = [];
try {
  const port = await freePort();
  children.push(spawn('python', [path.join(HERE, 'serve.py'), String(port)], { stdio: 'ignore' }));
  const site = 'http://localhost:' + port;
  for (let i = 0; i < 100; i++){ try { if ((await fetch(site + '/monsters.json')).ok) break; } catch {} await sleep(100); }
  const dport = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'shared-states-check-'));
  children.push(spawn(EDGE, ['--headless=new', '--remote-debugging-port=' + dport, '--user-data-dir=' + profile,
    '--inprivate', '--no-first-run', '--no-default-browser-check', '--disable-sync', '--disable-extensions',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
    '--window-size=1280,800', 'about:blank'], { stdio: 'ignore' }));
  const version = await json(`http://127.0.0.1:${dport}/json/version`);
  const targets = await json(`http://127.0.0.1:${dport}/json/list`);
  const target = targets.find(t => t.type === 'page');
  const c = await connect(target.webSocketDebuggerUrl);
  await c.send('Page.enable'); await c.send('Runtime.enable');
  await c.send('Page.navigate', { url: site + '/index.html' });   // the monster is chosen in the page, not by a query parameter
  for (let i = 0; i < 300; i++){
    if (await evaluate(c, '!!(window.__view && window.__view.renderer)').catch(() => false)) break;
    await sleep(200);
  }
  let monsters = [MON];
  if (ALL){
    // The ids that HAVE effect data. monsters.json also lists the small monsters (ems*), which export
    // no effects at all -- sweeping them only produces "no effect runtime" lines that read as failures.
    const m = await (await fetch(site + '/monsters.json')).json();
    const rows = Array.isArray(m) ? m : (m.monsters || []);
    const ids = Array.isArray(rows) ? rows.map(r => r.id || r).filter(Boolean) : Object.keys(rows);
    // In CHUNKS, and a failed probe KEEPS the monster. Firing one HEAD per id all at once (130 of them)
    // made dev/serve.py drop enough of them that 21 monsters with effect data were swept away as having
    // none, and the summary still read "0 FAILED".
    const has = [];
    for (let i = 0; i < ids.length; i += 8){
      const part = await Promise.all(ids.slice(i, i + 8).map(id =>
        fetch(site + '/effects/' + id + '.json', { method: 'HEAD' }).then(r => r.ok).catch(() => true)));
      has.push(...part);
    }
    monsters = ids.filter((_, i) => has[i]);
    console.log(ids.length + ' ids in monsters.json, sweeping ' + monsters.length + ' with effect data');
  } else if (LIST) monsters = LIST;

  let failed = 0, passed = 0, skipped = 0;
  for (const MONX of monsters){
  const out = await evaluate(c, '(' + pageCheck.toString() + ')(' + JSON.stringify(MONX) + ')')
                    .catch(e => ({ error: String(e.message || e) }));
  if (out.error){
    // Neither "no shared record" nor "no effect data at all" is a failure of the driver: the first has
    // nothing to drive, the second is a small monster that exports no effects. Only a monster that HAS
    // the records and does not fire them is a failure.
    const none = /SharedStates NOT CONSTRUCTED|no effect runtime/.test(out.error);
    console.log((none ? 'skip ' : 'FAIL ') + MONX + ': ' + out.error);
    if (none) skipped++; else { failed++; process.exitCode = 1; }
  }
  else {
    let bad = 0;
    console.log(out.loaded + '  c.pel ' + out.pel + '  (schedule starts so far: ' + out.starts + ')');
    for (const r of out.res){
      if (r.error){ console.log('  ' + r.name + ': ' + r.error); bad++; continue; }
      console.log(`  ${r.name} key ${r.key}, ${r.frames} frames: fired ${r.fired}, want ${r.want}  ${r.ok ? 'ok' : 'MISMATCH'}`);
      if (!r.ok) bad++;
    }
    const blastOk = out.blast.every((n, i) => (n > 0 ? 1 : 0) === out.blastWant[i]);
    const nb = out.blastWant.reduce((a, b) => a + b, 0);
    console.log('  blast parts: fired [' + out.blast.join(',') + '] want [' + out.blastWant.join(',') +
                '] (' + nb + ' record' + (nb === 1 ? '' : 's') + ')  ' + (blastOk ? 'ok' : 'MISMATCH'));
    if (!blastOk) bad++;
    const edgeOk = out.edges.a === 1 && out.edges.b === 0 && out.edges.c === 1;
    console.log('  alert 0->2 / 2->1 / 2->0: ' + [out.edges.a, out.edges.b, out.edges.c].join(' / ') +
                '  ' + (edgeOk ? 'ok (2->1 fires nothing, as the ROM does)' : 'MISMATCH'));
    if (!edgeOk) bad++;
    if (bad){ failed++; process.exitCode = 1; } else passed++;
  }
  }
  if (monsters.length > 1)
    console.log('\n' + passed + ' fire, ' + failed + ' FAILED, ' + skipped +
                ' skipped (no effect data or no shared record), of ' + monsters.length + ' swept');
} finally {
  for (const ch of children) { try { ch.kill(); } catch {} }
}
