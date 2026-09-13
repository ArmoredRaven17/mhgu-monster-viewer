// The effect runtime's entry points and the generator types it has translated.
//
// Generator types are dispatched by vtable address, exactly as the ROM dispatches them; a generator
// whose type is not registered here refuses to run (Unverified) rather than drawing something wrong.
import { registerType, preUpdate, generatorUpdate } from './emit.js';
import { spawnModel } from './spawn.js';
import { modelFrame } from './model.js';
import { preUpdateLB, spawnLB, billboardFrame } from './billboard.js';
import { spawnLPL, polylineFrame } from './polyline.js';

export const VTABLE = { Model: 0x1789734, LiteBillboard: 0x17890b4, LitePolyline: 0x1789bb4 };

// cParticleGeneratorModel: slot 16 0xa570fc, slot 23 0xa965c4, slot 24 0xa9718c
registerType(VTABLE.Model, { preUpdate, spawn: spawnModel, particles: modelFrame });
// cParticleGeneratorLiteBillboard: slot 16 0xa78464, slot 23 0xa7a8a8, slot 24 0xa7adac
registerType(VTABLE.LiteBillboard, { preUpdate: preUpdateLB, spawn: spawnLB, particles: billboardFrame });
// cParticleGeneratorLitePolyline: slot 16 0xa570fc, slot 23 0xab4710, slot 24 0xab4f64
registerType(VTABLE.LitePolyline, { preUpdate, spawn: spawnLPL, particles: polylineFrame });

export { generatorUpdate };
