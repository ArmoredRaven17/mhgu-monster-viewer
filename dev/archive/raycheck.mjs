// shells.js ray02real against the ROM's 0x3fc750 (raycheck.py's output), bit for bit
import fs from 'node:fs';
const S = await import(new URL('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const T = (await import(new URL('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/beam-types.js').href)).BEAM_TYPES;
const cases = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const bits = x => { const b = new DataView(new ArrayBuffer(4)); b.setFloat32(0, x, true); return b.getUint32(0, true); };
const fl = u => { const b = new DataView(new ArrayBuffer(4)); b.setUint32(0, u, true); return b.getFloat32(0, true); };
let bad = 0;
for (const c of cases){
  const t = T.find(x => x.id === c.id), r = c.rom;
  const joint = t.ray.joint, joints = { [joint]: r.JM };
  const own = { ownerPos: c.owner.p.map(Math.fround), target: c.target.map(Math.fround), ownerX: c.owner.xw, ownerY: c.owner.yw, ownerMatrix: r.OM.map(Math.fround) };
  const js = S.rayForCheck(t, c.lifeLeft, joints, own, c.setup || [0, 0, 0]);
  if (js.why){ console.log(c.id, 'REFUSED', js.why); bad++; continue; }
  const cmp = (k) => [0, 1, 2].map(i => bits(js[k][i]) === r[k][i] ? 'ok' : `${fl(r[k][i])} vs ${js[k][i]}`);
  const res = { origin: cmp('origin'), end: cmp('end'), anchor: cmp('anchor') };
  const ok = Object.values(res).every(a => a.every(x => x === 'ok'));
  if (!ok) bad++;
  console.log(c.id.padEnd(12), 'life', String(c.lifeLeft).padEnd(5), ok ? 'BIT-EXACT' : JSON.stringify(res));
}
console.log(bad ? bad + ' case(s) differ' : 'all cases bit-exact');
