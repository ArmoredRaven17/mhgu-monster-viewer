// The effect runtime's entry points and the generator types it has translated.
//
// Generator types are dispatched by vtable address, exactly as the ROM dispatches them; a generator
// whose type is not registered here refuses to run (Unverified) rather than drawing something wrong.
import { registerType, preUpdate, generatorUpdate } from './emit.js';
import { spawnModel } from './spawn.js';
import { modelFrame } from './model.js';

export const VTABLE = { Model: 0x1789734, LiteBillboard: 0x17890b4, LitePolyline: 0x1789bb4 };

// cParticleGeneratorModel: slot 16 0xa570fc, slot 23 0xa965c4, slot 24 0xa9718c
registerType(VTABLE.Model, { preUpdate, spawn: spawnModel, particles: modelFrame });

export { generatorUpdate };
