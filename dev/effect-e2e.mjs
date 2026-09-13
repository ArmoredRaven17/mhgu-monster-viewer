// End to end: the JS effect runtime alone, from an .efl file's bytes to N frames, against the
// emulator's memory after the same run (C:\MHGU-Extract\efx\e2e_dump.py).
//
//   node dev/effect-e2e.mjs <dump dir>
//
// The dump's before.bin is the emulator's memory just before uEffect::newInstance: the image's data
// sections after the game's static initialisers, and the effect manager built by its own constructor.
// From there this script does what the harness does, in the harness's allocation order so addresses
// line up -- newInstance, rEffectList::load (resources: .mod mesh tables and .ean animations from the
// extracted files), the effect list onto the owner, the start routine, then move once per frame --
// and every non-zero page of after.bin must come out identical, except the harness's own stub objects.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Mem } from '../docs/render/rom/effect/mem.js';
import { newEffect, startEffect } from '../docs/render/rom/effect/construct.js';
import { loadEffectList, loadEffectAnim, DTI } from '../docs/render/rom/effect/load.js';
import { move } from '../docs/render/rom/effect/owner.js';

const dir = process.argv[2];
const info = JSON.parse(readFileSync(join(dir, 'e2e.json'), 'utf8'));

function pages(file){
  const b = readFileSync(file), out = new Map();
  for (let o = 0; o < b.length; ){
    const a = b.readUInt32LE(o), n = b.readUInt32LE(o + 4);
    out.set(a, b.subarray(o + 8, o + 8 + n));
    o += 8 + n;
  }
  return out;
}

const m = new Mem();
for (const [a, bytes] of pages(join(dir, 'before.bin'))) m.load(a, bytes);

// the harness heap: a bump allocator, 32-byte granularity, zero-filled
let heap = info.heapAtSnapshot;
function malloc(n){
  const a = heap;
  heap = (heap + ((Math.max(n, 4) + 31) & ~31)) >>> 0;
  m.load(a, new Uint8Array(Math.max(n, 4)));
  return a;
}
const cstr = a => { let s = ''; for (let c; (c = m.rawByte(a)) !== 0; a++) s += String.fromCharCode(c); return s; };
const streams = new Map();
const pendingAnims = [];
let ids = 0;
m.svc = {
  alloc: (size, align) => malloc(size),
  free(){},
  nextId: () => ++ids,
  streamSize: s => streams.get(s).length,
  streamRead(s, buf, n){ const d = streams.get(s); m.load(buf, d.subarray(0, n)); return Math.min(n, d.length); },
  loadResource(dti, path, flags){
    const name = cstr(path);
    const handle = malloc(0x200);
    if (dti === DTI.rEffectAnim) pendingAnims.push([handle, join(info.extract, name + '.ean')]);
    if (dti === DTI.rModel){
      const mod = readFileSync(join(info.extract, name + '.mod'));
      const n = mod.readUInt16LE(8), off = mod.readUInt32LE(0x30);
      const table = malloc(48 * n);
      m.load(table, mod.subarray(off, off + 48 * n));
      m.load(handle + 0x74, new Uint8Array(new Uint32Array([table, n]).buffer));
    }
    return handle;
  },
};
function stream(bytes){ const s = malloc(0x40); streams.set(s, bytes); return s; }

const owner = newEffect(m);
m.load(0x189f168, new Uint8Array(new Uint32Array([0x600f0000]).buffer));  // heap table +0x20 -> the allocator object
const resmgr = malloc(0x100); malloc(0x400);                             // resource manager and its vtable
m.load(0x211fa64, new Uint8Array(new Uint32Array([resmgr]).buffer));
malloc(0x400);                                                           // the streams' vtable
const efl = readFileSync(join(info.extract, 'effect', 'em', info.file.slice(0, 5), info.file));
const s0 = stream(efl);
const list = malloc(0x98 + 0x100);
if (owner !== info.owner || list !== info.list) throw new Error('allocation order diverged: owner 0x' + owner.toString(16) + ' list 0x' + list.toString(16));
if (loadEffectList(m, list, s0) !== 1) throw new Error('load failed');
for (const [h, p] of pendingAnims) if (loadEffectAnim(m, h, stream(readFileSync(p))) !== 1) throw new Error('anim load failed: ' + p);
m.load(owner + 0xf4, new Uint8Array(new Uint32Array([list]).buffer));
if (startEffect(m, owner) !== 1) throw new Error('start failed');
for (let f = 0; f < info.frames; f++) move(m, owner);
if (heap !== info.heapAtEnd) console.log('heap end 0x' + heap.toString(16) + ', emulator 0x' + info.heapAtEnd.toString(16));

const skip = a => info.skip.some(([s, n]) => a >= s && a < s + n);
const after = pages(join(dir, 'after.bin'));
let diff = 0, shown = 0, compared = 0;
const check = (a, want) => {
  const got = m.rawByte(a);
  compared++;
  if (got !== want && !skip(a)){ diff++; if (shown++ < 20) console.log('0x' + a.toString(16) + ': emulator ' + want.toString(16) + ', js ' + got.toString(16)); }
};
for (const [a, bytes] of after) for (let i = 0; i < bytes.length; i++) check(a + i, bytes[i]);
// and pages the JS touched that the emulator left zero
for (const [k, p] of m.pages){
  const a = k * 4096;
  if (after.has(a) || a >= 0x7e000000) continue;
  if ((a >= 0x13ef000 && a < 0x2140000) || (a >= 0x50400000 && a < info.heapAtEnd)) for (let i = 0; i < 4096; i++) if (p[i]) check(a + i, 0);
}
console.log(info.file + ', ' + info.frames + ' frames: ' + compared + ' bytes compared, ' + diff + ' differ');
process.exit(diff ? 1 : 0);
