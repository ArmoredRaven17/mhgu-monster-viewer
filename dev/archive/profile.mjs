// WHERE LOAD TIME GOES: headless Edge, CPU profile (CDP Profiler) + network over (A) the page load to the first monster on
// screen, then (B) each monster switch with effects on, to its effect runtime up. Writes <out>/<phase>.cpuprofile and prints
// per phase: wall time, self time by script, the top functions, GC / idle / program, and the slowest / largest requests.
//   node profile.mjs <outdir> [mon ...]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const HERE = 'C:/MHGU-Extract/MHGU-Monster-Viewer/dev';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const OUT = process.argv[2];
const MONS = process.argv.slice(3).length ? process.argv.slice(3) : ['em077_00', 'em088_00', 'em001_00'];
fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
async function json(url){ for (let i = 0; i < 150; i++){ try { const r = await fetch(url); if (r.ok) return r.json(); } catch {} await sleep(100); } throw new Error('nothing at ' + url); }
function connect(wsUrl){
  const ws = new WebSocket(wsUrl); let id = 0; const pending = new Map(); const listeners = new Map();
  ws.onmessage = ev => { const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)){ const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); }
    else if (m.method) (listeners.get(m.method) || []).forEach(f => f(m.params)); };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params }));
    setTimeout(() => { if (pending.has(i)){ pending.delete(i); rej(new Error('timeout ' + method)); } }, 300000); });
  const on = (method, f) => listeners.set(method, [...(listeners.get(method) || []), f]);
  return new Promise(r => { ws.onopen = () => r({ send, on, ws }); });
}
const evaluate = (c, expression) => c.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  .then(r => { if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text); return r.result.value; });

const short = u => (u || '').replace(/^https?:\/\/[^/]+\//, '').replace(/\?.*$/, '') || '(native)';
function summarise(name, prof, wall, reqs){
  const byId = new Map(prof.nodes.map(n => [n.id, n]));
  const dt = new Map();
  for (let i = 0; i < prof.samples.length; i++) dt.set(prof.samples[i], (dt.get(prof.samples[i]) || 0) + (prof.timeDeltas[i + 1] || 0) / 1000);
  const fn = new Map(), file = new Map();
  let total = 0;
  for (const [nid, ms] of dt){
    const n = byId.get(nid), cf = n.callFrame, f = short(cf.url);
    const k = (cf.functionName || '(anon)') + '  ' + f + ':' + (cf.lineNumber + 1);
    fn.set(k, (fn.get(k) || 0) + ms); file.set(f, (file.get(f) || 0) + ms); total += ms;
  }
  const top = (m, n) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => '    ' + v.toFixed(0).padStart(7) + ' ms  ' + k);
  console.log(`\n=== ${name}: wall ${wall.toFixed(0)} ms, sampled ${total.toFixed(0)} ms`);
  console.log('  self time by script:'); console.log(top(file, 14).join('\n'));
  console.log('  top functions (self):'); console.log(top(fn, 22).join('\n'));
  if (reqs){
    const done = [...reqs.values()].filter(r => r.end);
    const kb = done.reduce((s, r) => s + (r.bytes || 0), 0) / 1024;
    console.log(`  network: ${done.length} requests, ${(kb / 1024).toFixed(1)} MB`);
    if (process.env.WATERFALL){
      const t0 = Math.min(...done.map(r => r.start));
      console.log('  waterfall (start..end ms after the first request):');
      console.log(done.slice().sort((a, b) => a.start - b.start).map(r => '    ' + ((r.start - t0) * 1000).toFixed(0).padStart(6) + '..' + ((r.end - t0) * 1000).toFixed(0).padStart(6) + '  ' + short(r.url)).join(String.fromCharCode(10)));
    }
    console.log('  slowest requests:'); console.log(done.sort((a, b) => (b.end - b.start) - (a.end - a.start)).slice(0, 10)
      .map(r => '    ' + ((r.end - r.start) * 1000).toFixed(0).padStart(7) + ' ms ' + ((r.bytes || 0) / 1024).toFixed(0).padStart(7) + ' KB  ' + short(r.url)).join('\n'));
    console.log('  largest requests:'); console.log(done.sort((a, b) => (b.bytes || 0) - (a.bytes || 0)).slice(0, 8)
      .map(r => '    ' + ((r.bytes || 0) / 1024).toFixed(0).padStart(7) + ' KB ' + ((r.end - r.start) * 1000).toFixed(0).padStart(7) + ' ms  ' + short(r.url)).join('\n'));
  }
  fs.writeFileSync(path.join(OUT, name + '.cpuprofile'), JSON.stringify(prof));
}

const children = [];
let browserWs = null;
async function main(){
  const port = await freePort();
  children.push(spawn('python', [path.join(HERE, 'serve.py'), String(port)], { stdio: 'ignore' }));
  const site = 'http://localhost:' + port;
  for (let i = 0; i < 100; i++){ try { if ((await fetch(site + '/monsters.json')).ok) break; } catch {} await sleep(100); }
  const dport = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'motion-states-check-'));
  children.push(spawn(EDGE, ['--headless=new', '--remote-debugging-port=' + dport, '--user-data-dir=' + profile, '--inprivate',
    '--no-first-run', '--no-default-browser-check', '--disable-sync', '--disable-extensions', '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--window-size=1280,800', ...(process.env.GPU ? ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu'] : []), 'about:blank'], { stdio: 'ignore' }));
  browserWs = await connect((await json(`http://127.0.0.1:${dport}/json/version`)).webSocketDebuggerUrl);
  const page = (await json(`http://127.0.0.1:${dport}/json/list`)).find(t => t.type === 'page' && t.url === 'about:blank');
  const c = await connect(page.webSocketDebuggerUrl);
  await c.send('Runtime.enable'); await c.send('Network.enable'); await c.send('Profiler.enable');
  await c.send('Profiler.setSamplingInterval', { interval: 250 });
  let reqs = new Map();
  c.on('Network.requestWillBeSent', p => reqs.set(p.requestId, { url: p.request.url, start: p.timestamp }));
  c.on('Network.loadingFinished', p => { const r = reqs.get(p.requestId); if (r){ r.end = p.timestamp; r.bytes = p.encodedDataLength; } });
  console.log('renderer: ' + JSON.stringify(await evaluate(c, `(() => { const g = document.createElement('canvas').getContext('webgl2'); const e = g && g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'n/a'; })()`).catch(e => String(e))));
  // (A) the page load: navigate with the profiler running, to the viewer up and its first monster mounted
  await c.send('Profiler.start');
  const t0 = Date.now();
  await c.send('Page.navigate', { url: site + '/?scene=none' });
  let tUp = null;
  for (let i = 0; ; i++){
    const st = await evaluate(c, '({ up: !!(window.__view && window.__view.renderer && window.__view.motionStates), mon: !!(window.__view && window.__view.mounted && window.__view.mounted.main) })').catch(() => ({}));
    if (st.up && tUp == null) tUp = Date.now() - t0;
    if (st.up && st.mon) break;
    if (i > 1200) throw new Error('the viewer never came up');
    await sleep(50);
  }
  const tMon = Date.now() - t0;
  const navT = await evaluate(c, '(() => { const n = performance.getEntriesByType("navigation")[0]; return { dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd }; })()');
  summarise('A_page_load', (await c.send('Profiler.stop')).profile, tMon, reqs);
  console.log(`  milestones: viewer up ${tUp} ms, first monster mounted ${tMon} ms, DOMContentLoaded ${navT.dcl.toFixed(0)}, load ${navT.load.toFixed(0)}`);
  // (B) each monster: the switch, the model, the effects
  for (const MON of MONS){
    reqs = new Map();
    await c.send('Profiler.start');
    const t = await evaluate(c, `(async () => {
      const V = window.__view, M = await import('/render/monster.js');
      const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
      const until = async (test, n = 6000) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
      const monSel = document.getElementById('monSel');
      if (![...monSel.options].some(o => o.value === '${MON}')) monSel.add(new Option('${MON}', '${MON}'));
      const t0 = performance.now();
      monSel.value = '${MON}'; await monSel.onchange();
      const t1 = performance.now();
      await until(() => V.state.id === '${MON}' && V.mounted.main);
      const t2 = performance.now();
      await V.effects(false); await V.effects(true);
      await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === '${MON}' && M.effectRuntimeInstance().schedule);
      const t3 = performance.now();
      await frames(10);
      return { onchange: t1 - t0, model: t2 - t0, effects: t3 - t2, total: performance.now() - t0 };
    })()`);
    summarise('B_' + MON, (await c.send('Profiler.stop')).profile, t.total, reqs);
    console.log('  milestones: ' + JSON.stringify(Object.fromEntries(Object.entries(t).map(([k, v]) => [k, Math.round(v)]))));
  }
}
try { await main(); } catch (e){ console.log('FAILED: ' + e.message); }
finally {
  if (browserWs) await browserWs.send('Browser.close').catch(() => {});
  await sleep(500);
  for (const ch of children) try { ch.kill(); } catch {}
}
process.exit(0);
