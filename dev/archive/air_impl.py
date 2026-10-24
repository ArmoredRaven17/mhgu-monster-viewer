import os
V = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
cur = {}
def load(p):
    cur['p'] = os.path.join(V, p); cur['s'] = open(cur['p'], encoding='utf-8', newline='').read()
def rep(a, b):
    s = cur['s']; assert s.count(a) == 1, (s.count(a), a[:80]); cur['s'] = s.replace(a, b)
def save():
    open(cur['p'] + '.tmp', 'w', encoding='utf-8', newline='').write(cur['s']); os.replace(cur['p'] + '.tmp', cur['p'])

load(r'docs\render\motion-states.js')
rep("export const postureOf = (monId, list, clip) => {", """// HOW HIGH A FLYING MONSTER IS (dev/air-height.md; rom-map "Air height", traps 65-67). On an AIR clip the clip's origin IS the
// unit (P+0x44): the air clips carry root Y 0 and joint 0 near 0, so nothing in the clip says where the ground is -- the
// game sets that by state. Entering posture 1 through 0xbc984 adds FlyOfs x size to P+0x44 (FlyOfs: the .dtb's float at
// +0x22 -> dtbase +0x98, read for every monster); the standard takeoff then adds its own vertical-speed curve (0xc1010,
// integrated by 0x7d810 / 0x7c9fc / 0x7b53c) of +485.5, NOT scaled by size, and the floors 0xbf038 / 0xbf284 only stop him
// sinking below ground + FlyOfs x size. Emulated on each class's own takeoff: Seregios (3, 0) / (3, 1), Rathian (3, 0),
// Astalos, Malfestio -- H = FlyOfs x size + 485.5. The curve is byte-identical in uEm001 / uEm077 / uEm079 / uEm081 and
// READ ONLY THERE, so only those classes are listed; every other flyer keeps the Grid Floor's lowest-reach rule (its takeoff
// curve is not read). Which takeoff brought him to a clip is the AI's: the standard takeoff stands for all, by name.
//   clips: a clip whose height the ROM sets otherwise -- `posture: 3` (the unit pinned to the ground, the body drawn
//   FlyOfs x size above it by e+0x1384, entered through the setter), `at(frame, size)` (a height read for that clip's own
//   action, e.g. Seregios's ledge climb (3, 0x50) 0xfe6f38: 472 x s + 6.8 x s x f over flat ground).
export const AIR_STANDARD_CURVE = 485.5;
const RATH_AIR = { flyOfs: 500 };
export const AIR_HEIGHT = {
  em001_00: RATH_AIR, em001_02: RATH_AIR, em001_04: RATH_AIR, em002_00: RATH_AIR, em002_02: RATH_AIR, em002_04: RATH_AIR,
  em077_00: { flyOfs: 500, clips: { '1|Motion[4]': { posture: 3 }, '1|Motion[5]': { at: (f, s) => 472 * s + 6.8 * s * f } } },
  em079_00: { flyOfs: 300 }, em079_04: { flyOfs: 300 },
  em081_00: { flyOfs: 500 }, em081_04: { flyOfs: 500 },
};
// for an AIR clip: { ground, unit } in game units BELOW the drawn clip origin -- where the ground is, and where the unit is
// (0, the origin, except posture 3: the ground) -- or null where the monster's air height is not read
export function airLift(monId, list, clip, frame, size){
  const t = AIR_HEIGHT[monId];
  if (!t) return null;
  const c = t.clips && t.clips[list + '|' + String(clip).replace(/_(start|loop)$/, '')];
  if (c && c.posture === 3) return { ground: t.flyOfs * size, unit: t.flyOfs * size };
  if (c && c.at) return { ground: c.at(frame, size), unit: 0 };
  return { ground: t.flyOfs * size + AIR_STANDARD_CURVE, unit: 0 };
}

export const postureOf = (monId, list, clip) => {""")
save()

load(r'docs\index.html')
rep("         postureOf, turnAt, CEILING_ABOVE_GAME, clipHeat } from './render/motion-states.js';",
    "         postureOf, turnAt, CEILING_ABOVE_GAME, clipHeat, airLift } from './render/motion-states.js';")
rep("""const FLOOR_AT_ORIGIN = new Set(['em084_00']);
function monsterFloorY(){
  const root = mounted.main;
  if (!root) return 0;
  if (FLOOR_AT_ORIGIN.has(state.id)) return world.position.y;
  const clipRoot = pose.mixer ? pose.mixer.getRoot() : null;
  let y;
  if (clipRoot){
    const reach = (pose.bounds && !pose.bounds.isEmpty()) ? pose.bounds.min.y : Infinity;
    y = Math.min(clipRoot.position.y, reach);
  } else y = bindOf(root).minY;
  return y * (world.scale.y || 1) + world.position.y;
}""", """const FLOOR_AT_ORIGIN = new Set(['em084_00']);
// AN AIR CLIP, as the floor rule has always told it: the body hangs below the clip's own origin by more than AIR_REACH (in
// the clip's units, before the size) over the loop. Its height above the ground is then the ROM's (render/motion-states.js
// AIR_HEIGHT / airLift: FlyOfs x size + the standard takeoff's 485.5, or the clip's own), where that monster's is read.
const AIR_REACH = 1.0;
function airNow(){
  const clipRoot = pose.mixer ? pose.mixer.getRoot() : null, act = pose.action;
  if (!clipRoot || !act || !act.getClip || state.list === FULL_ANIM_LIST.id) return null;
  const reach = (pose.bounds && !pose.bounds.isEmpty()) ? pose.bounds.min.y : Infinity;
  if (!(reach < clipRoot.position.y - AIR_REACH)) return null;
  return airLift(state.id, state.list, act.getClip().name, act.time * 60, world.scale.y || 1);
}
function monsterFloorY(){
  const root = mounted.main;
  if (!root) return 0;
  if (FLOOR_AT_ORIGIN.has(state.id)) return world.position.y;
  const clipRoot = pose.mixer ? pose.mixer.getRoot() : null;
  let y;
  if (clipRoot){
    // the ROM's air height where read: the ground lies H below the unit, the clip's origin (dev/air-height.md)
    const air = airNow();
    if (air) return clipRoot.position.y * (world.scale.y || 1) + world.position.y - air.ground * 0.01;
    const reach = (pose.bounds && !pose.bounds.isEmpty()) ? pose.bounds.min.y : Infinity;
    y = Math.min(clipRoot.position.y, reach);
  } else y = bindOf(root).minY;
  return y * (world.scale.y || 1) + world.position.y;
}
// THE UNIT, P+0x40, in game units: the clip's own origin (the pose driver's root, through the world group, which carries the
// travel and the size), less the posture-3 drop on an air clip that pins the unit to the ground (airLift `unit`). The shells
// take THIS as their owner's position (base01's 900 rule reads P+0x44, the spawns P+0x40..): the hips the effect parent
// stands on (live.js unitMatrix, gid 0) swing with the body -- +231 on Seregios's L1 M1 f100, +318 standing (rom-map trap 67).
function unitGamePos(){
  const clipRoot = pose.mixer ? pose.mixer.getRoot() : null, s = world.scale, w = world.position;
  const p = clipRoot ? [clipRoot.position.x * s.x + w.x, clipRoot.position.y * s.y + w.y, clipRoot.position.z * s.z + w.z]
                     : [w.x, w.y, w.z];
  const air = clipRoot ? airNow() : null;
  return [p[0] / 0.01, p[1] / 0.01 - (air ? air.unit : 0), p[2] / 0.01];
}""")
rep("""           carry: state.id === 'em088_00' ? state.carry : undefined,
           ...shellTailInput(state.id, mounted.main && mounted.main.userData.partsDrawn) };""",
    """           carry: state.id === 'em088_00' ? state.carry : undefined,
           // the owner's position is the UNIT (unitGamePos), not the effect parent's hips -- overrides schedule.js's ownerPos
           ownerPos: (([x, y, z]) => ({ x, y, z }))(unitGamePos()),
           ...shellTailInput(state.id, mounted.main && mounted.main.userData.partsDrawn) };""")
save()
print('ok')
