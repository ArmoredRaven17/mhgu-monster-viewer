// THE MAP AREA IN THE VIEWER, checked headless. The Browser pane runs no animation frames while it is
// hidden, so the viewer never finishes coming up and nothing can be looked at; this drives the real page
// in headless Edge instead, with backgrounding disabled so rAF runs.
//
//   node dev/area-check.mjs [areaId] [--url http://localhost:3000] [--swiftshader]
//
// It reports what render/area.js drew, whether the area's floor meets the plane the monster stands on, and
// whether the monster is held in place while the area is up and released when it goes. Exit code 1 on any
// failed check or page exception.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const argv = process.argv.slice(2);
const opt = n => { const i = argv.indexOf(n); return i >= 0 ? argv.splice(i, 2)[1] : null; };
const flag = n => { const i = argv.indexOf(n); return i >= 0 ? (argv.splice(i, 1), true) : false; };
let site = opt('--url');
const swiftshader = flag('--swiftshader');
const areaId = argv[0] || 'm17a01';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
const children = [];

async function json(url){
  for (let i = 0; i < 150; i++){ try { const r = await fetch(url); if (r.ok) return r.json(); } catch {} await sleep(100); }
  throw new Error('nothing at ' + url);
}
function connect(wsUrl){
  const ws = new WebSocket(wsUrl); let id = 0; const pending = new Map(); const listeners = new Map();
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)){ const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); }
    else if (m.method) (listeners.get(m.method) || []).forEach(f => f(m.params));
  };
  ws.onclose = () => { for (const { rej } of pending.values()) rej(new Error('socket closed')); pending.clear(); };
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params }));
    setTimeout(() => { if (pending.has(i)){ pending.delete(i); rej(new Error('timeout ' + method)); } }, 60000);
  });
  return new Promise(r => { ws.onopen = () => r({ send, on: (m, f) => listeners.set(m, [...(listeners.get(m) || []), f]) }); });
}
const evaluate = (c, expression) => c.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  .then(r => { if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text); return r.result.value; });

// IN THE PAGE: where the area's floor is against the plane the monster stands on, and the monster's own
// lowest posed point, both read the way the viewer itself computes them.
function pageProbe(){
  return (async () => {
    const V = window.__view, THREE = await import('three');
    V.scene.updateMatrixWorld(true);
    const root = V.scene.getObjectByName('map-area');
    let surface = null;
    if (root){
      const rc = new THREE.Raycaster(); rc.far = 3000;
      rc.set(new THREE.Vector3(0, 500, 0), new THREE.Vector3(0, -1, 0));
      const h = rc.intersectObject(root, true).filter(i => i.object.visible && i.face &&
        i.face.normal.clone().transformDirection(i.object.matrixWorld).y > 0.5);
      surface = h.length ? +h[0].point.y.toFixed(4) : null;
    }
    const p = V.pose;
    return {
      areaSurfaceAtOrigin: surface,
      gridY: +V.grid.info().y.toFixed(4),
      monsterLowestY: (p.bounds && !p.bounds.isEmpty()) ? +p.bounds.min.y.toFixed(4) : null,
      worldXZ: [+V.world.position.x.toFixed(3), +V.world.position.z.toFixed(3)],
      anchor: V.state.anchor, poseAnchorXZ: p.anchorXZ === true,
    };
  })();
}

const results = [];
const check = (name, ok, detail) => { results.push({ name, ok: !!ok, detail }); console.log((ok ? '  ok   ' : '  FAIL ') + name + (detail !== undefined ? '  ' + detail : '')); };

try {
  if (!site){
    const port = await freePort();
    children.push(spawn('python', [path.join(HERE, 'serve.py'), String(port)], { stdio: 'ignore' }));
    site = 'http://localhost:' + port;
    for (let i = 0; i < 100; i++){ try { if ((await fetch(site + '/areas.json')).ok) break; } catch {} await sleep(100); }
  }
  const dport = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'area-check-'));
  children.push(spawn(EDGE, ['--headless=new', '--remote-debugging-port=' + dport, '--user-data-dir=' + profile,
    '--inprivate', '--no-first-run', '--no-default-browser-check', '--disable-sync', '--disable-extensions',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    ...(swiftshader ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : []),
    '--window-size=1280,800', 'about:blank'], { stdio: 'ignore' }));
  const version = await json(`http://127.0.0.1:${dport}/json/version`);
  await connect(version.webSocketDebuggerUrl);
  const targets = await json(`http://127.0.0.1:${dport}/json/list`);
  const page = targets.find(t => t.type === 'page' && t.url === 'about:blank');
  if (!page) throw new Error('no about:blank page target');
  const c = await connect(page.webSocketDebuggerUrl);
  await c.send('Runtime.enable');
  const errors = [];
  c.on('Runtime.exceptionThrown', p => errors.push(p.exceptionDetails.exception ? p.exceptionDetails.exception.description : p.exceptionDetails.text));
  c.on('Runtime.consoleAPICalled', p => {
    if (p.type !== 'error') return;
    errors.push('console: ' + p.args.map(a => a.value !== undefined ? String(a.value) : (a.description || '')).join(' ').slice(0, 300));
  });

  await c.send('Page.navigate', { url: site + '/?area=' + areaId });
  for (let i = 0; ; i++){
    if (await evaluate(c, '!!(window.__view && window.__view.area)').catch(() => false)) break;
    if (i > 600) throw new Error('the viewer never came up' + (errors.length ? ': ' + errors[0] : ''));
    await sleep(200);
  }
  await sleep(1500);

  const info = JSON.parse(await evaluate(c, 'JSON.stringify(__view.area.info())'));
  console.log(`\n${info.name} ${info.area} (${info.id})`);
  console.log(`  meshes ${info.meshes}, verts ${info.verts}, classes ${JSON.stringify(info.cls)}`);
  console.log(`  lights ${info.lights} ${JSON.stringify(info.lightNames)}, viewer rig parked: ${info.rigParked}`);
  console.log(`  groundY ${info.groundY}, lift ${info.lift}\n`);

  check('the area drew', info.visible && info.meshes > 0, `${info.meshes} meshes`);
  check('every material resolved', info.undefinedMaterials === 0, `${info.undefinedMaterials} undefined`);
  check('the area lights are the monster set', info.lights === 'em' && info.rigParked, info.lightNames.join(','));
  check('fog is off by default', info.fog && info.fog.on === false, `variant ${info.fog && info.fog.variant}`);

  const p1 = await evaluate(c, `(${pageProbe.toString()})()`);   // awaitPromise: the probe is async
  check('the area floor sits on the monster plane', Math.abs(p1.areaSurfaceAtOrigin) < 0.01,
        `surface ${p1.areaSurfaceAtOrigin} m, grid ${p1.gridY} m`);
  check('the monster stands on it', p1.monsterLowestY !== null && Math.abs(p1.monsterLowestY) < 0.2,
        `lowest posed point ${p1.monsterLowestY} m`);
  check('the monster is held in place', p1.anchor === true && p1.poseAnchorXZ,
        `state.anchor ${p1.anchor}, pose.anchorXZ ${p1.poseAnchorXZ}`);
  check('it starts at the area centre', Math.hypot(p1.worldXZ[0], p1.worldXZ[1]) < 0.01, `world ${JSON.stringify(p1.worldXZ)}`);

  const fogOn = JSON.parse(await evaluate(c, 'JSON.stringify(__view.area.fog(true))'));
  check('fog switches on with the ROM numbers', fogOn.on && fogOn.variant === 'linear' && fogOn.density > 0,
        `${fogOn.variant} start ${fogOn.startM} m, invRange ${fogOn.invRange}, density ${fogOn.density}`);
  await evaluate(c, '__view.area.fog(false)');

  await evaluate(c, '__view.area.set("")');
  await sleep(2500);
  const p2 = await evaluate(c, `(${pageProbe.toString()})()`);
  const off = JSON.parse(await evaluate(c, 'JSON.stringify(__view.area.info())'));
  check('clearing the area removes it', off.meshes === 0 && !off.visible, `${off.meshes} meshes`);
  check('clearing gives the viewer rig back', !off.rigParked && off.lightNames.length === 0);
  check('clearing releases the hold', p2.anchor === false, `state.anchor ${p2.anchor}`);

  if (errors.length){ console.log('\npage errors:'); for (const e of errors.slice(0, 8)) console.log('  ' + e); }
  const bad = results.filter(r => !r.ok).length + (errors.length ? 1 : 0);
  console.log(`\n${results.length - results.filter(r => !r.ok).length}/${results.length} checks passed` + (errors.length ? `, ${errors.length} page errors` : ''));
  process.exitCode = bad ? 1 : 0;
} catch (e){
  console.log('area-check failed: ' + (e && e.message || e));
  process.exitCode = 1;
} finally {
  for (const ch of children) { try { ch.kill(); } catch {} }
  setTimeout(() => process.exit(process.exitCode || 0), 500);
}
