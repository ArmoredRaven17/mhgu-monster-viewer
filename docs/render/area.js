// MAP AREAS: the game's own area geometry, drawn behind the monster.
//
// Raven, 2026-09-24: "I would like to have an map area drawn out to be used as a background for the
// rendering app", and on lighting: "Lighting, we have lighting effects, but having an area's lighting
// would be useful for accuracy".
//
// NOT the Background panel (render/background.js). That one builds a sphere, a ring and a disc --
// shapes this project invented -- and wears the area's textures on them. This draws the area's own
// models with the area's own materials, vertex colours, normals and lights. The two are separate
// features and either can be used without the other.
//
// WHAT IS THE ROM'S AND WHAT IS NOT
//   the ROM's:  the geometry, the material decode (the same parse_mrl / decode_material the
//               monsters' materials.json is built from), the vertex normals (mod-stage-normals.py,
//               which the converter drops), the vertex colours, and the lights, ambient colour and
//               fog numbers out of the area's own "-f" .sdl schedule.
//   the ROM's:  THE FOG MATHS, decoded 2026-09-24 out of the shader package with mfxprog.py and
//               applied verbatim (installFog below).
//   NOT read:   WHICH SURFACES TAKE FOG. The pass program is
//                   PS_MaterialConstantFog: fog = FFog(mc.wposition, mc.svposition);
//                                           color = FBlendFog(color, fog, mc.diffuse);
//               -- it calls the FFog FAMILY, and `FFog` itself is the base variant that returns
//               effect 0. Which variant runs is a feature selection, and NOT ONE STAGE MATERIAL IN
//               THE GAME MAKES IT: 2,714 materials over 289 stage .mrl files select no FFog,
//               FDistanceFog, FHeightFog or FBlendFog variant at all. So the binding is the
//               engine's, at draw time, and it has not been traced.
//               THIS IS WHY FOG IS OFF BY DEFAULT. Raven, 2026-09-24: "The fog seems a bit thick."
//               He is seeing the consequence: fFogDensity 0.45 saturates at 45 m, so EVERY surface
//               past 45 m -- the walls, the scenery rings and the sky shell 700 m out -- takes the
//               identical maximum 45% blend to blue-grey, which flattens the whole backdrop into
//               one haze. The maths is the ROM's; applying it to all 45 primitives is MY choice,
//               and it is the wrong half. `fog(true)` switches it on to look at.
//   NOT read:   the light GROUPS. The ROM keeps hunter lights (PL01-03, group 0), monster lights
//               (EM01-03, group 1) and an ambient in group 4, and which group the stage geometry
//               belongs to is not decoded. This draws one set over everything: EM by default
//               because this is the Monster Viewer, `lights('pl')` for the hunter set.
//   NOT read:   mBalance on every light, and the AmbientLight's mMode 3 / its SH. The numbers ride
//               along in areas.json; nothing here uses them.
//
// mDir IS THE DIRECTION TOWARD THE LIGHT, not the direction it travels. Read off the area's own
// numbers: EM01 is the bright shadow-casting key at (-0.576, +0.6005, -0.5547) and EM02 the dim fill
// at (0.3713, -0.8447, 0.3855). Taken as "toward the light" the key is above and the fill below,
// which is a key-and-fill rig and leaves the arena floor (normal +y) lit at dot 0.6. Taken the other
// way the key shines up from under the floor and the floor renders black, which it is not in game.
import * as THREE from 'three';
import { loadGlb, getTexture } from './assets.js';
import { createMaterial } from './material.js';

// The distance three.js puts a directional light at. A DirectionalLight is parallel light from
// wherever it sits toward its target, so the distance changes nothing but the shadow frustum.
const LIGHT_DIST = 400;

// THE ROM'S FOG, read out of AppShaderPackage with efx/shader/mfxprog.py on 2026-09-24. Not a
// stand-in and not three.js's fog -- these are the package's own functions:
//
//   FOG_OUT FFogDistance(float3 wposition, float4 svposition)
//       float dist = length((wposition - CBViewProjection.fCameraPos));
//       O.effect    = FDistanceFog(dist);
//       O.addfactor = (CBFog.fFogColor * O.effect);
//       O.mulfactor = float3((1.0 - O.effect));
//       FHeightFog(O, wposition, svposition);
//
//   float4 FBlendFog(float4 color, FOG_OUT I, float3 diffuse)
//       return float4(((color.xyz * I.mulfactor) + I.addfactor), color.w);
//
//   float FDistanceFogLinear(float dist)
//       return (saturate(((dist - CBFog.fFogStart) * CBFog.fFogInvRange)) * CBFog.fFogDensity);
//   float FDistanceFogExp(float dist)
//       return ((1.0 - exp((-dist * CBFog.fFogInvRange))) * CBFog.fFogDensity);
//   float FDistanceFogExp2(float dist)
//       float v = (dist * CBFog.fFogInvRange); return ((1.0 - exp((-v * v))) * CBFog.fFogDensity);
//   float FDistanceFogReverseExp(float dist)
//       return (exp((-1.0 / (dist * CBFog.fFogInvRange))) * CBFog.fFogDensity);
//   float FDistanceFogReverseExp2(float dist)
//       float v = (1.0 / (dist * CBFog.fFogInvRange)); return (exp((-v * v)) * CBFog.fFogDensity);
//   float FDistanceFog(float dist)        // the family's base variant: fog OFF
//       return 0;
//
// HEIGHT FOG IS OFF and that is the ROM's own doing, not an omission: the base `FHeightFog` is an
// empty function, and no area's ColorFog unit sets a single one of CBFog's fFogH* fields -- checked
// across all 240 area schedules in the game.
//
// TWO MAPPINGS ARE READINGS, NOT READ CODE, because the .sdl -> CBFog write lives in the executable
// and has not been traced:
//   * `mDistanceType` indexes the FDistanceFog family (0x4f8 base, Linear 0x4f9, Exp 0x4fa,
//     Exp2 0x4fb, ReverseExp 0x4fc, ReverseExp2 0x4fd, Table 0x4fe, TableVTF 0x4ff). Corroborated
//     across all 240 area schedules: the value is only ever 1 (223 areas), 2 (3), 3 (1), 4 (8) or
//     5 (2) -- inside the family's range, never 0 (which is fog off, and every area has fog) and
//     never 6/7 (which sample tFogTable, and no area arc ships one).
//   * `fFogInvRange` = 1 / (mEnd - mStart), the only reading the .sdl's Start and End allow.
const FOG_VARIANTS = { 1: 'linear', 2: 'exp', 3: 'exp2', 4: 'revexp', 5: 'revexp2' };
const FOG_GLSL = `
  float areaFogEffect(float dist){
    #if AREA_FOG_MODE == 1
      return clamp((dist - uAreaFog.x) * uAreaFog.y, 0.0, 1.0) * uAreaFog.z;
    #elif AREA_FOG_MODE == 2
      return (1.0 - exp(-dist * uAreaFog.y)) * uAreaFog.z;
    #elif AREA_FOG_MODE == 3
      float v = dist * uAreaFog.y; return (1.0 - exp(-v * v)) * uAreaFog.z;
    #elif AREA_FOG_MODE == 4
      return exp(-1.0 / (dist * uAreaFog.y)) * uAreaFog.z;
    #elif AREA_FOG_MODE == 5
      float v = 1.0 / (dist * uAreaFog.y); return exp(-v * v) * uAreaFog.z;
    #else
      return 0.0;
    #endif
  }`;

// createArea({ scene, renderer, rig }) -- rig is createStage's `lights`, whose intensities are
// parked while an area's own lights are on and restored when they are off.
export function createArea({ scene, renderer, rig }){
  const root = new THREE.Group();
  root.name = 'map-area';
  root.visible = false;
  scene.add(root);
  const lightGroup = new THREE.Group();
  lightGroup.name = 'map-area-lights';
  scene.add(lightGroup);

  let shown = null, seq = 0, which = 'em', parked = null, fogOn = false;
  // one shared block, so a frame's camera position is written once and every area material reads it
  const fogU = {
    uAreaFog: { value: new THREE.Vector3(0, 0, 0) },      // start, invRange, density
    uAreaFogColor: { value: new THREE.Color(0, 0, 0) },
    uAreaFogCam: { value: new THREE.Vector3() },
    uAreaFogOn: { value: 1 },
  };
  let fogMode = 0;

  // FBlendFog over the shaded colour, in the ROM's own place: straight after <opaque_fragment>,
  // which is where three.js has just written gl_FragColor = vec4(outgoingLight, diffuseColor.a) --
  // linear, before tone mapping and before the output colour space, which is where the ROM blends.
  // Alpha is untouched, exactly as FBlendFog leaves color.w alone.
  function installFog(mat){
    mat.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, fogU);
      shader.vertexShader = 'varying vec3 vAreaWP;\n' + shader.vertexShader.replace(
        '#include <project_vertex>',
        '#include <project_vertex>\n  vAreaWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      shader.fragmentShader = shader.fragmentShader
        .replace('void main()',
          '#define AREA_FOG_MODE ' + fogMode + '\nvarying vec3 vAreaWP;\nuniform vec3 uAreaFog;\n'
          + 'uniform vec3 uAreaFogColor;\nuniform vec3 uAreaFogCam;\nuniform float uAreaFogOn;\n'
          + FOG_GLSL + '\nvoid main()')
        .replace('#include <opaque_fragment>',
          '#include <opaque_fragment>\n'
          + '  float areaFogE = areaFogEffect(length(vAreaWP - uAreaFogCam)) * uAreaFogOn;\n'
          + '  gl_FragColor.rgb = gl_FragColor.rgb * (1.0 - areaFogE) + uAreaFogColor * areaFogE;');
    };
    mat.needsUpdate = true;
  }

  // The .sdl's ColorFog at the weather frame asked for (0 is weather state 1, the clear one).
  function applyFog(env, frame){
    const f = env && env.fog;
    fogMode = f ? (Object.keys(FOG_VARIANTS).indexOf(String(f.distanceType)) >= 0 ? f.distanceType : 0) : 0;
    if (!f){ fogU.uAreaFog.value.set(0, 0, 0); return; }
    const at = (track, dflt) => {
      if (!Array.isArray(track) || !track.length) return dflt;
      let v = track[0][1];
      for (const [fr, x] of track) if (fr <= frame) v = x;
      return v;
    };
    const density = at(f.density, 0);
    const col = at(f.color, [0, 0, 0]);
    const range = Math.max((f.endM || 0) - (f.startM || 0), 1e-6);
    fogU.uAreaFog.value.set(f.startM || 0, 1 / range, density);
    fogU.uAreaFogColor.value.setRGB(col[0], col[1], col[2], THREE.LinearSRGBColorSpace);
  }

  // The area's vertex COLOUR is a MULTIPLIER with 127 = 1.0 (no RGB channel in an area exceeds
  // 127), so RGB is scaled by areas.json's vcolScale. The terrain sits at 0.17x-0.72x: baked
  // darkening, which is what the Std materials' VertexColorPLS feature means. Done on the attribute
  // rather than in a shader so the value the ROM authored is what the material multiplies.
  //
  // ALPHA IS NOT SCALED. It is an ordinary 0..255 opacity and it does reach 255 -- the mist banks
  // and the cloud shells carry their fade in it. Scaled with the RGB it went to 2.0 and every
  // half-faded vertex clamped to fully opaque, which is the whole mist gone.
  function scaleVertexColour(geom, scale){
    const c = geom.getAttribute('color');
    if (!c || (c.userData && c.userData.areaScaled)) return;
    const n = c.count, it = c.itemSize, out = new Float32Array(n * it);
    for (let i = 0; i < n; i++) for (let k = 0; k < it; k++){
      const j = i * it + k;
      const v = c.normalized ? c.array[j] / 255 : c.array[j];
      out[j] = k < 3 ? v * scale : v;
    }
    const a = new THREE.Float32BufferAttribute(out, it);
    a.userData = { areaScaled: true };
    geom.setAttribute('color', a);
  }

  // The shape specFor() hands createMaterial, built from areas.json instead of materials.json: the
  // same keys, so the material goes through the viewer's own path and not a reduced copy of it.
  function romSpec(name, m, tex){
    const pick = i => (i && tex[i - 1]) || null;
    const t = m.t || {};
    const fb = parseInt(m.fb || '0', 16) >>> 0;
    return { name, m, anim: null,
             albedo: pick(t.albedo), spec: pick(t.spec), sphere: pick(t.sphere), normal: pick(t.normal),
             cls: m.cls || 'Std', specIsAlbedo: !!(t.spec && t.spec === t.albedo),
             state: m.state || null, feat: m.feat || null, cbm: m.cbm || null, glob: m.glob || null,
             flags: m.flags || 0, fb,
             alphaTest: !!(fb & 0x00100000), pigment: false, override: false };
  }

  function clear(){
    for (const o of [...root.children]){
      root.remove(o);
      o.traverse(n => {
        if (!n.isMesh) return;
        if (n.geometry) n.geometry.dispose();
        if (n.material) n.material.dispose();
      });
    }
    unpark();
    for (const l of [...lightGroup.children]){
      lightGroup.remove(l);
      if (l.dispose) l.dispose();
    }
    root.visible = false;
    shown = null;
  }

  function park(){
    if (parked || !rig) return;
    parked = {};
    for (const k of Object.keys(rig)) if (rig[k] && 'intensity' in rig[k]){
      parked[k] = rig[k].intensity;
      rig[k].intensity = 0;
    }
  }
  function unpark(){
    if (!parked || !rig) return;
    for (const k of Object.keys(parked)) if (rig[k]) rig[k].intensity = parked[k];
    parked = null;
  }

  // The area's own lights. An InfiniteLight is parallel light, so a DirectionalLight; a
  // HemiSphereLight has a colour and a mRevColor from the opposite direction, which is what a
  // HemisphereLight's sky and ground colours are. Colour is used as authored -- EM01 is 1.8, above
  // 1, and clamping it would be a change the ROM does not make. mBalance is NOT applied (unread).
  function buildLights(env){
    for (const l of [...lightGroup.children]) lightGroup.remove(l);
    const set = (env && env.lights && env.lights[which]) || [];
    for (const l of set){
      const c = l.color || [1, 1, 1];
      if (l.kind === 'hemi'){
        const g = l.revColor || [0, 0, 0];
        const h = new THREE.HemisphereLight(new THREE.Color(c[0], c[1], c[2]),
                                            new THREE.Color(g[0], g[1], g[2]), 1);
        h.name = l.unit;
        lightGroup.add(h);
      } else {
        const d = new THREE.DirectionalLight(new THREE.Color(c[0], c[1], c[2]), 1);
        d.name = l.unit;
        const v = l.dir || [0, 1, 0];
        d.position.set(v[0], v[1], v[2]).normalize().multiplyScalar(LIGHT_DIST);
        lightGroup.add(d);
      }
    }
    // the SH ambient's colour, flat. Its mMode and its env cube are not read.
    const amb = env && env.ambient && env.ambient.color;
    if (amb){
      const a = new THREE.AmbientLight(new THREE.Color(amb[0], amb[1], amb[2]), 1);
      a.name = 'AmbientLight';
      lightGroup.add(a);
    }
    if (lightGroup.children.length) park(); else unpark();
  }

  async function build(entry, mine){
    const scale = entry.vcolScale || 1;
    applyFog(entry.env, 0);
    // the camera the frame is drawn with, written once for every area material (FFogDistance's
    // CBViewProjection.fCameraPos)
    root.onBeforeRender = (r, s2, cam) => { cam.getWorldPosition(fogU.uAreaFogCam.value); };
    // WHERE THE AREA SITS. The area is drawn at the ROM's own origin, where the Forlorn Arena's
    // floor is 3.14 m BELOW y = 0 -- so the monster, which the viewer stands at y = 0, floated over
    // the stone (Raven, 2026-09-24: "The Monster however was not on the ground"). areas.json's
    // groundY is that floor, measured off the area's own upward-facing geometry, and the area is
    // lifted by it so the floor under the monster lands on the plane its feet are on.
    //
    // A FIXED lift, deliberately, and this is the flying case (Raven: "Another tricky thing will be
    // flying monsters"). The Background panel's ground disc follows monsterFloorY() every frame,
    // which is the monster's own lowest point -- over a solid area that would drag the whole arena
    // up to a flying monster's lowest wing and it would never leave the floor. Lifted once, the
    // floor stays where the ROM put it and a flying clip is genuinely in the air above it.
    //
    // groundY is a MEASUREMENT off ROM geometry, not a ROM-stated ground height: the game ships no
    // collision for this area (92 collision entries in all 10,595 arcs, none of them m17).
    root.position.y = Number.isFinite(entry.groundY) ? -entry.groundY : 0;
    for (const mdl of entry.models || []){
      const gltf = await loadGlb(mdl.glb, 'area:' + mdl.glb);
      if (mine !== seq) return false;
      const node = gltf.scene.clone(true);
      node.name = 'area:' + mdl.name;
      const jobs = [];
      node.traverse(o => {
        if (!o.isMesh) return;
        const srcName = (o.material && o.material.name) || '';
        const m = mdl.mats && mdl.mats[srcName];
        if (!m){ o.visible = false; o.userData.areaUndefined = srcName; return; }
        const rom = romSpec(srcName, m, mdl.tex || []);
        const mat = createMaterial({ srcName, rom, alphaCut: 0, noTint: true,
                                     unlit: rom.cls !== 'Std' });
        // the area's baked lighting and its per-vertex fade, both of which the model carries
        mat.vertexColors = true;
        scaleVertexColour(o.geometry, scale);
        installFog(mat);
        o.material = mat;
        o.userData.area = entry.id;
        o.userData.areaCls = rom.cls;
        if (rom.albedo) jobs.push(getTexture(rom.albedo).then(t => { mat.map = t; mat.needsUpdate = true; }));
      });
      await Promise.all(jobs);
      if (mine !== seq) return false;
      root.add(node);
    }
    buildLights(entry.env);
    root.visible = true;
    return true;
  }

  return {
    // entry: one areas.json area, or null for none. Resolves once it is drawn.
    async set(entry){
      const mine = ++seq;
      clear();
      if (!entry) return null;
      const ok = await build(entry, mine);
      if (ok) shown = entry;
      return ok ? entry.id : null;
    },
    // The ROM's own fog maths. OFF by default -- not because the maths is in doubt but because
    // which surfaces take it is unread (see the header). fog(true) switches it on; fog(true, 350)
    // re-reads the keyed tracks at the storm weather state.
    fog(on, frame){
      if (on !== undefined){
        fogOn = !!on;
        fogU.uAreaFogOn.value = fogOn ? 1 : 0;
        if (shown) applyFog(shown.env, Number.isFinite(frame) ? frame : 0);
      }
      return { on: fogOn, mode: fogMode, variant: FOG_VARIANTS[fogMode] || 'off',
               startM: fogU.uAreaFog.value.x, invRange: +fogU.uAreaFog.value.y.toFixed(6),
               density: fogU.uAreaFog.value.z,
               color: fogU.uAreaFogColor.value.toArray().map(x => +x.toFixed(4)) };
    },
    // 'em' (monster lights, the default), 'pl' (hunter lights) or 'off' (the viewer's own rig)
    lights(pick){
      if (pick !== undefined){
        which = pick === 'off' ? 'off' : (pick === 'pl' ? 'pl' : 'em');
        if (which === 'off'){
          for (const l of [...lightGroup.children]) lightGroup.remove(l);
          unpark();
        } else if (shown){
          buildLights(shown.env);
        }
      }
      return which;
    },
    info(){
      let meshes = 0, verts = 0, undef = 0;
      const cls = {};
      root.traverse(o => {
        if (!o.isMesh) return;
        if (o.userData.areaUndefined){ undef++; return; }
        meshes++;
        verts += o.geometry.getAttribute('position').count;
        cls[o.userData.areaCls] = (cls[o.userData.areaCls] || 0) + 1;
      });
      return { id: shown ? shown.id : null, name: shown ? shown.name : null,
               area: shown ? shown.area : null, visible: root.visible,
               groundY: shown ? shown.groundY : null, lift: +root.position.y.toFixed(4),
               meshes, verts, cls, undefinedMaterials: undef,
               lights: which, rigParked: !!parked,
               lightNames: lightGroup.children.map(l => l.name),
               fog: { on: fogOn, mode: fogMode, variant: FOG_VARIANTS[fogMode] || 'off',
                      startM: fogU.uAreaFog.value.x, invRange: +fogU.uAreaFog.value.y.toFixed(6),
                      density: fogU.uAreaFog.value.z,
                      color: fogU.uAreaFogColor.value.toArray().map(x => +x.toFixed(4)) },
               fogSchedule: shown && shown.env ? shown.env.fog : null };
    },
  };
}
