// hypereye/pagepass.mjs (hyper-eye lane, 2026-10-27): the records passaudit.mjs found CHANGED, each on the page: the monster mounted, its
// effects on, the record started alone by its entry (schedule.start, whatever its `when`) at pass 0x11 (the new default) under the draw
// meter (every 2nd frame; starts / lit samples / pixels), 40 frames; then the SAME frame rendered twice through __view.shot with the
// runtime's pass at 0x15 and at 0x11 (the shot's POST captured, not sent) and compared in the page: pixels that differ (any channel > 12)
// and their mean luma at 0x11 minus at 0x15 (> 0: lit / brighter under 0x11, < 0: darker). The first PP_SHOTS records whose change
// covers >= 400 px are saved as dev/shots/hypereye_pass4/<mon>_<pel>_<key>_15.png / _11.png.
//   PP_LIST=<jsonl> PP_SHOTS=16 sh dev/archive/hypereye/run.sh dev/archive/hypereye/pagepass.mjs out.txt
import { readFileSync } from 'node:fs';
async function check(list, shots){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id), monSel = $('monSel');
  const realFetch = window.fetch.bind(window);
  let captured = null;
  window.fetch = (url, init) => {
    if (typeof url === 'string' && url.startsWith('/shot') && captured !== null){ captured.push(init.body); return Promise.resolve(new Response('{}')); }
    return realFetch(url, init);
  };
  const pixels = url => new Promise((res, rej) => { const im = new Image(); im.onload = () => {
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
    res(g.getImageData(0, 0, c.width, c.height).data); }; im.onerror = rej; im.src = url; });
  let cur = null, saved = 0;
  V.state.fxPass = 'node';
  try {
    for (const item of list){
      try {
        if (cur !== item.mon){
          if (![...monSel.options].some(o => o.value === item.mon)) monSel.add(new Option(item.mon, item.mon));
          monSel.value = item.mon; await monSel.onchange(); await frames(60);
          await V.effects(false); await V.effects(true);
          await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === item.mon, 900);
          cur = item.mon;
        }
        const rt = M.effectRuntimeInstance();
        const [pel, key] = item.key.split('|');
        const e = rt.schedule.entries.find(x => x.def.record && x.def.record.pel === pel && x.def.record.key === +key && x.when === item.when);
        if (!e){ out.push([false, 'PASS-PAIR ' + item.mon + ' ' + item.key, 'no entry']); continue; }
        if (V.pose.action) V.pose.action.timeScale = 1;
        V.effectMeter(true, { every: 2 });
        rt.schedule.start(e);
        await frames(40);
        const rep = V.effectMeterReport();
        V.effectMeter(false);
        const row = rep.recs.find(r => r.key === item.mon + '|' + item.key + '|' + item.when);
        // the same frame at both passes
        captured = [];
        // THE NOISE CONTROL: two renders at 0x15 one step apart (an effect that moves or flickers between renders), then 0x11 one
        // step after the second: the change is diff(15b, 11) against the floor diff(15a, 15b)
        // the MODEL HIDDEN for the three renders (v2: a loop tick between renders moved the body's pixels), so the diff is the
        // effects': 0x15, 0x11, 0x15 -- the change is diff(15a, 11), the floor diff(15a, 15b) (two steps apart: conservative)
        // (the MESHES, not the root: the effect runtime's frame driver hangs from the root, and a hidden root stops it -- v3 hid the
        // root and measured nothing)
        const body = V.mounted && V.mounted.main, hidden = [];
        const under = (o, g) => { for (let p = o; p; p = p.parent) if (p === g) return true; return false; };
        if (body) body.traverse(o => { if (o.isMesh && o.visible && !under(o, rt.group)){ o.visible = false; hidden.push(o); } });
        // a first render takes the step the running clip still owed (the shot sets the clip's rate to 0, so the loop's advance is 0
        // after it): the three that follow are the same effect state, 0x15 / 0x11 / 0x15
        rt.host.framePass = 0x15; await V.shot('hypereye_pass', 'tmp'); await frames(2);
        rt.host.framePass = 0x15; await V.shot('hypereye_pass', 'tmp');
        rt.host.framePass = 0x11; await V.shot('hypereye_pass', 'tmp');
        rt.host.framePass = 0x15; await V.shot('hypereye_pass', 'tmp');
        for (const o of hidden) o.visible = true;
        const [, u15, u11, u15b] = captured; captured = null;
        const [a, b, a0] = await Promise.all([pixels(u15), pixels(u11), pixels(u15b)]);
        const diff = (a, b) => { let n = 0, dl = 0;
          for (let i = 0; i < a.length; i += 4){
            if (Math.abs(a[i] - b[i]) > 12 || Math.abs(a[i + 1] - b[i + 1]) > 12 || Math.abs(a[i + 2] - b[i + 2]) > 12){
              n++; dl += (0.3 * b[i] + 0.59 * b[i + 1] + 0.11 * b[i + 2]) - (0.3 * a[i] + 0.59 * a[i + 1] + 0.11 * a[i + 2]);
            } }
          return [n, dl]; };
        const [n, dl] = diff(a, b), [noise] = diff(a0, a);
        let shot = null;
        if (n >= 400 && n > 2 * noise && saved < shots){
          const nm = item.mon + '_' + pel + '_' + key + '_' + item.when;
          await realFetch('/shot?run=hypereye_pass4&name=' + encodeURIComponent(nm + '_15'), { method: 'POST', body: u15 });
          await realFetch('/shot?run=hypereye_pass4&name=' + encodeURIComponent(nm + '_11'), { method: 'POST', body: u11 });
          saved++; shot = nm;
        }
        for (const q of e.requests) try { rt.host.releaseRequest(q); } catch (_){}
        e.requests.length = 0;
        if (V.pose.action) V.pose.action.timeScale = 1;
        await frames(2);
        out.push([!!row, 'PASS-PAIR ' + item.mon + ' ' + item.key + ' ' + item.when + ' ' + item.cls,
                  JSON.stringify({ meter11: row ? { st: row.starts, lit: row.litSamples, s: row.samples, pxMax: row.pixMax, verdict: row.verdict } : null,
                                   diffPx: n, noisePx: noise, dLuma: n ? +(dl / n).toFixed(1) : 0, shot })]);
      } catch (err){ captured = null; out.push([false, 'PASS-PAIR ' + item.mon + ' ' + item.key, String(err && err.message || err)]); }
    }
  } finally { window.fetch = realFetch; V.state.fxPass = 'none'; }
  return out;
}
export const pageCheck = check;
const LIST = (typeof process !== 'undefined' && process.env.PP_LIST) ? readFileSync(process.env.PP_LIST, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
export const args = [[LIST, +((typeof process !== 'undefined' && process.env.PP_SHOTS) || 0)]];
