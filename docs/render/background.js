// MAP BACKGROUNDS: a map's sky, distant scenery and ground behind the monster -- not the map itself.
// Raven, 2026-09-17: "it would be nice to be able to make some backgrounds based on maps. However, I don't think a
// 1:1 would be sensible", "Things like a background and ground textures", then "One area per map, keep the viewer
// lighting to keep it simple for now. We can have a Panel for Background. That way if I don't want to keep the
// feature, it isn't tied to other panels". Everything for it lives in this file, backgrounds.json, backgrounds/ and
// the Background panel's block in index.html, so taking it out is deleting those.
//
// HOW THE GAME BUILDS AN AREA (read 2026-09-17; the full notes are in build-map-backgrounds.py). Each area is one
// arc: a low-poly terrain model whose ground is layered materials, sky and distant-scenery ("enkei") models, grass,
// and .sdl schedules -- the area's "-f" schedule sets its lights, fog and sky gradient and swaps sky models with the
// weather. The sky dome covers only the directions the area can see, so it cannot surround a monster.
//
// WHAT IS TAKEN FROM THE GAME AND WHAT IS NOT. The textures are the area's own. How they wrap is read off the area's
// models by the build: the sky's repeats around the horizon and its v range from the dome, the scenery's repeats
// from its arc of the enkei model, the ground's metres per tile from its triangles near the area origin. The shapes
// are this file's, not the game's -- a sphere and a ring that travel with the camera so they read as infinitely far,
// and a disc under the monster that fades out at its rim -- and so is the lighting: the disc takes the viewer's own
// lights, at Raven's word.
import * as THREE from 'three';

const SKY_SEG_U = 64, SKY_SEG_V = 32, RING_SEG = 128;
// World units (metres). The disc fades out from FADE_START of its radius into the sky's horizon haze: a few hundred
// metres of one tiled texture reads as a grid, so the ground ends before the repeat can show.
const GROUND_RADIUS = 250;
const FADE_START = 0.15;

// v as the area lays it: a lookup by elevation (degrees) that build-map-backgrounds.py reads off the area's own model
// -- [[elevation, v], ...] rising in elevation, interpolated between, held at either end -- so a band round the
// horizon stays at the horizon and holds its top row above it.
function vAt(map, el){
  const lut = map.lut;
  if (el <= lut[0][0]) return lut[0][1];
  for (let i = 1; i < lut.length; i++){
    if (el <= lut[i][0]){
      const f = (el - lut[i - 1][0]) / (lut[i][0] - lut[i - 1][0]);
      return lut[i - 1][1] + (lut[i][1] - lut[i - 1][1]) * f;
    }
  }
  return lut[lut.length - 1][1];
}

// A sphere with the sky texture laid on it as the game's model lays it: u goes round the horizon `repeat` times, and v
// follows vmap by elevation, down past the horizon into the haze the ground fades into. v = 0 is the image's top (the
// textures load with flipY off).
function skyGeometry(repeat, vmap, tint){
  const pos = [], uv = [], idx = [], col = [];
  // tint: the dome's vertex-colour gradient where the game colours its sky that way -- stops from the zenith to the
  // horizon, then the colour below it (build-map-backgrounds.py sky_tint)
  const tintAt = pol => {
    if (pol > Math.PI / 2) return tint[tint.length - 1];
    const x = pol / (Math.PI / 2) * (tint.length - 2), i = Math.min(tint.length - 3, Math.floor(x)), f = x - i;
    return [0, 1, 2].map(k => tint[i][k] + (tint[i + 1][k] - tint[i][k]) * f);
  };
  for (let j = 0; j <= SKY_SEG_V; j++){
    const pol = j / SKY_SEG_V * Math.PI;
    const v = vAt(vmap, 90 - pol * 180 / Math.PI);
    for (let i = 0; i <= SKY_SEG_U; i++){
      const az = i / SKY_SEG_U * Math.PI * 2;
      pos.push(Math.sin(pol) * Math.cos(az), Math.cos(pol), Math.sin(pol) * Math.sin(az));
      uv.push(i / SKY_SEG_U * repeat, v);
      if (tint) col.push(...tintAt(pol));
    }
  }
  for (let j = 0; j < SKY_SEG_V; j++) for (let i = 0; i < SKY_SEG_U; i++){
    const a = j * (SKY_SEG_U + 1) + i, b = a + SKY_SEG_U + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  if (tint) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}

// A unit ring from y = 0 to y = 1: u round it `repeat` times, v from vTop at the top edge to vBottom at the base.
function ringGeometry(repeat, vTop, vBottom){
  // (the caller reads both off the lookup at the ring's own top and base elevations)
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= 1; j++) for (let i = 0; i <= RING_SEG; i++){
    const az = i / RING_SEG * Math.PI * 2;
    pos.push(Math.cos(az), 1 - j, Math.sin(az));
    uv.push(i / RING_SEG * repeat, j ? vBottom : vTop);
  }
  for (let i = 0; i < RING_SEG; i++){
    const a = i, b = i + RING_SEG + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

function fadeTexture(){
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, '#fff');
  g.addColorStop(FADE_START, '#fff');
  g.addColorStop(1, '#000');
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

// scene, renderer: the stage's. floor(): the world y the ground sits at, read every frame.
export function createBackground({ scene, renderer, floor }){
  const root = new THREE.Group();
  root.name = 'map-background';
  scene.add(root);
  const loader = new THREE.TextureLoader();
  const aniso = renderer && renderer.capabilities ? renderer.capabilities.getMaxAnisotropy() : 1;
  let shown = null, seq = 0;

  // Both axes repeat: a sky can be a tiling cloud layer as well as a panorama (Jurassic Frontier's runs v -5.6 to
  // -2.1 on its dome), and a panorama's v range stays inside one tile anyway.
  const load = url => new Promise((res, rej) => loader.load(url, t => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.flipY = false;
    t.anisotropy = aniso;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.needsUpdate = true;
    res(t);
  }, undefined, rej));

  function clear(){
    for (const o of [...root.children]){
      root.remove(o);
      o.geometry.dispose();
      for (const k of ['map', 'alphaMap']) if (o.material[k]) o.material[k].dispose();
      o.material.dispose();
    }
    shown = null;
  }

  async function build(entry, mine){
    const tex = await Promise.all([
      load(entry.sky.tex),
      load(entry.ground.tex),
      entry.scenery ? load(entry.scenery.tex) : null,
    ]);
    if (mine !== seq){ for (const t of tex) if (t) t.dispose(); return false; }
    const [skyTex, groundTex, scenTex] = tex;
    // the sky, drawn first and behind everything, centred on whichever camera renders it (both sides: the camera
    // is always inside it, and which way its faces wind is not worth depending on)
    const tint = Array.isArray(entry.sky.tint) && entry.sky.tint.length >= 3 ? entry.sky.tint : null;
    const sky = new THREE.Mesh(skyGeometry(entry.sky.repeat || 1, entry.sky.v, tint),
      new THREE.MeshBasicMaterial({ map: skyTex, vertexColors: !!tint, side: THREE.DoubleSide, depthWrite: false, depthTest: false, fog: false }));
    sky.name = 'bg-sky';
    sky.renderOrder = -1000;
    sky.frustumCulled = false;
    sky.onBeforeRender = (r, s, cam) => {
      sky.position.copy(cam.getWorldPosition(sky.position));
      sky.scale.setScalar(cam.far * 0.45);
      sky.updateMatrixWorld();
    };
    root.add(sky);
    if (scenTex){
      const sc = entry.scenery;
      const h = sc.height || 0.1, base = sc.base || 0;
      const deg = x => Math.atan(x) * 180 / Math.PI;       // the ring's edges as the camera, at its centre, sees them
      const ring = new THREE.Mesh(ringGeometry(sc.repeat || 1, vAt(sc.v, deg(base + h)), vAt(sc.v, deg(base))),
        // transparent, so it draws after the monster: it keeps the depth test, and at 0.4 of the far plane it is
        // behind everything the monster writes
        new THREE.MeshBasicMaterial({ map: scenTex, side: THREE.DoubleSide, transparent: true, depthWrite: false, fog: false }));
      ring.name = 'bg-scenery';
      ring.renderOrder = -999;
      ring.frustumCulled = false;
      const p = new THREE.Vector3();
      ring.onBeforeRender = (r, s, cam) => {
        const rad = cam.far * 0.4;
        cam.getWorldPosition(p);
        ring.position.set(p.x, p.y + base * rad, p.z);
        ring.scale.set(rad, h * rad, rad);
        ring.updateMatrixWorld();
      };
      root.add(ring);
    }
    // the ground: the area's own texture at its own metres per tile, lit by the viewer's lights
    const tile = entry.ground.tile || 4;
    groundTex.repeat.set(2 * GROUND_RADIUS / tile, 2 * GROUND_RADIUS / tile);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(1, 96),
      new THREE.MeshLambertMaterial({ map: groundTex, alphaMap: fadeTexture(), transparent: true, depthWrite: true }));
    ground.name = 'bg-ground';
    ground.rotation.x = -Math.PI / 2;
    ground.scale.setScalar(GROUND_RADIUS);
    ground.renderOrder = -998;
    ground.onBeforeRender = () => {
      const y = floor ? floor() : 0;
      if (Number.isFinite(y) && ground.position.y !== y){ ground.position.y = y; ground.updateMatrixWorld(); }
    };
    root.add(ground);
    return true;
  }

  return {
    // entry: one backgrounds.json map, or null for none. Resolves once it is drawn (or replaced by a later call).
    async set(entry){
      const mine = ++seq;
      clear();
      if (!entry) return null;
      const ok = await build(entry, mine);
      if (ok) shown = entry;
      return ok ? entry.id : null;
    },
    info(){
      const o = n => root.getObjectByName(n);
      return { id: shown ? shown.id : null, name: shown ? shown.name : null, area: shown ? shown.area : null,
               parts: root.children.map(c => c.name),
               groundY: o('bg-ground') ? +o('bg-ground').position.y.toFixed(3) : null,
               tile: shown ? shown.ground.tile : null };
    },
  };
}
