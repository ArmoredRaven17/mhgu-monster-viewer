// hypereye/passaudit.mjs (hyper-eye lane, 2026-10-27): EVERY effect record of every monster (docs/effects/<mon>.json with a rest-joint
// file), started alone headless through the viewer's runtime (schedule.start, whatever its `when`), 40 frames; at frames 3 / 12 / 25 / 40
// the frame is drawn TWICE, the context's pass at 0x15 (the scene setup's) and at 0x11 (after a node unit: host.framePass), and the
// model draws compared: per record, the opaque-colour rows that take the UNSORTED emit at 0x15 (depth write, slot 0x1b9) and so change
// at 0x11 (sorted: their own flags' depth, depth / bias order), with their blends and depth states. A record whose start or step throws
// is listed as refused (it is not this audit's to judge). Output: one JSON line per record with any model draw, then a summary.
//   node dev/archive/hypereye/passaudit.mjs [mon,mon..] > passaudit.out
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const docs = join(ROOT, 'docs');
const { EffectHost } = await import('file://' + join(docs, 'render', 'rom', 'effect', 'host.js').replace(/\\/g, '/'));
const { EffectSchedule } = await import('file://' + join(docs, 'render', 'rom', 'effect', 'schedule.js').replace(/\\/g, '/'));
function pages(file){
  const b = readFileSync(file), out = [];
  for (let o = 0; o < b.length; ){ const a = b.readUInt32LE(o), n = b.readUInt32LE(o + 4); out.push([a, new Uint8Array(b.subarray(o + 8, o + 8 + n))]); o += 8 + n; }
  return out;
}
const hex = h => Uint8Array.from(h.match(/../g) || [], b => parseInt(b, 16));
const PAGES = pages(join(docs, 'effects', 'rom-pages.bin'));
const HEAP = JSON.parse(readFileSync(join(docs, 'effects', 'rom.json'), 'utf8')).heap;
const RECORDS = JSON.parse(readFileSync(join(docs, 'effects', 'mfx-records.json'), 'utf8')).records;
const DRAWSYS = hex(JSON.parse(readFileSync(join(docs, 'effects', 'draw-system.json'), 'utf8')).bytes);
const only = (process.argv[2] || '').split(',').filter(Boolean);
const mons = only.length ? only : JSON.parse(readFileSync(join(docs, 'monsters.json'), 'utf8')).monsters.map(m => m.id)
  .filter(id => existsSync(join(docs, 'effects', id + '.json')));
const T = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
const SAMPLE = new Set([3, 12, 25, 40]);
const sum = { records: 0, withModels: 0, changed: 0, refused: 0, monsters: 0, noJoints: [] };
for (const mon of mons){
  const jfile = join(ROOT, '..', 'efx', 'joints', mon + '_viewer_rest.json');
  if (!existsSync(jfile)){ sum.noJoints.push(mon); continue; }
  sum.monsters++;
  const def = JSON.parse(readFileSync(join(docs, 'effects', mon + '.json'), 'utf8'));
  const res = def.resources;
  for (let i = 0; i < def.effects.length; i++){
    const d0 = def.effects[i];
    if (!d0.record) continue;
    sum.records++;
    // a fresh host per record: a refused record leaves nothing behind for the next
    let host, schedule, entry;
    try {
      host = new EffectHost({ pages: PAGES, heap: HEAP, strict: true, records: RECORDS, drawSystem: DRAWSYS,
        resources: {
          meshTable: name => ({ count: res[name].meshCount, table: new Uint8Array(readFileSync(join(docs, 'effects', res[name].mesh))) }),
          textureSize: name => res[name].size,
          anim: name => new Uint8Array(readFileSync(join(docs, 'effects', res[name].ean))),
          list: name => new Uint8Array(readFileSync(join(docs, 'effects', res[name].list))),
          material: (name, index) => res[name].materials[index],
        } });
      host.initDraw({ position: [0, 0, 1000], view: [...T, 0, 0, -1000, 1], world: [...T, 0, 0, 1000, 1] });
      const owner = host.createEffect(new Uint8Array(readFileSync(join(docs, 'effects', d0.efl))));
      const jf = JSON.parse(readFileSync(jfile, 'utf8'));
      const parent = host.createParent(jf.jointList);
      host.setParentScale(parent, jf.unit.scale);
      for (const j of jf.jointList) host.setJointMatrix(parent, j, jf.joints[j]);
      schedule = new EffectSchedule(host, parent, [{ owner, def: d0 }], false);
      entry = schedule.entries[0];
      schedule.start(entry);
    } catch (e){ sum.refused++; console.log(JSON.stringify({ mon, key: d0.record.pel + '|' + d0.record.key, when: d0.when, refused: 'start: ' + String(e.message).slice(0, 120) })); continue; }
    const rows = new Map();        // model|mesh|blend -> { at15, at11, n }
    let models = 0, err = null;
    try {
      for (let f = 1; f <= 40; f++){
        schedule.step();
        if (!SAMPLE.has(f)){ host.drawFrame(schedule.effects()); continue; }
        host.framePass = 0x15; const a = host.drawFrame(schedule.effects()).models.map(d => ({ ...d }));
        host.framePass = 0x11; const b = host.drawFrame(schedule.effects()).models.map(d => ({ ...d }));
        host.framePass = 0x15;
        models = Math.max(models, a.length);
        a.forEach((d, k) => {
          const id = d.model.split('\\').pop() + '#' + d.meshIndex + ' ' + d.blend;
          const r = rows.get(id) || { n: 0, unsorted15: 0, depth15: new Set(), depth11: new Set(), gT: 0 };
          r.n++; if (d.unsorted) r.unsorted15++;
          r.depth15.add(d.depth); if (b[k]) r.depth11.add(b[k].depth + (b[k].unsorted ? '/u' : '/s'));
          r.gT = Math.max(r.gT, +d.globalTransparency);
          rows.set(id, r);
        });
      }
    } catch (e){ err = String(e.message).slice(0, 120); }
    if (err && !rows.size){ sum.refused++; console.log(JSON.stringify({ mon, key: d0.record.pel + '|' + d0.record.key, when: d0.when, refused: 'step: ' + err })); continue; }
    if (!rows.size) continue;
    sum.withModels++;
    const changed = [...rows].filter(([, r]) => r.unsorted15 > 0);
    if (changed.length) sum.changed++;
    console.log(JSON.stringify({ mon, key: d0.record.pel + '|' + d0.record.key, when: d0.when, efl: d0.efl.split('/').pop(), models,
      changed: changed.length > 0, err,
      rows: [...rows].map(([id, r]) => ({ id, n: r.n, unsorted15: r.unsorted15, d15: [...r.depth15].join(','), d11: [...r.depth11].join(','), gT: +r.gT.toFixed(2) })) }));
  }
}
console.log('SUMMARY ' + JSON.stringify(sum));
