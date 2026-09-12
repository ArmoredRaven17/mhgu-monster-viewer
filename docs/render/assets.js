// Loader singletons and the caches every module shares. One GLTFLoader and one TextureLoader
// for the whole viewer; a texture is decoded once and handed to every material that binds it,
// and a GLB is parsed once per cache key and cloned (skeletonClone) per mount.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const loader = new GLTFLoader(), texLoader = new THREE.TextureLoader();
export const texCache = new Map(), glbCache = new Map();
// The game's own held poses, played once on an off-screen proxy (see render/pose.js). The
// proxy GLB is cached here and reused across poses.
export const poseCache = new Map();
// the weapon's own motion sets (poses/weapons/mot/), see render/weapon.js
export const weaponMotCache = new Map();

// tiled maps viewed at a glancing angle (skirts, capes) alias badly without this
let maxAnisotropy = 1;
export function initAssets(renderer){
  maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
}

// TEXTURES THE ROM SHIPS WITH NO MIPMAP CHAIN, by their pooled md5 name.
//
// An MT .tex header carries its own level count (`buildlib._tex_header` -> `mips`). Across all 514
// monster textures exactly FIVE ship a single level, and all five say so in the ROM's own filename:
//
//     em027_00_eft1_nomip     64x128     em027_00_eft3_nomip    256x256
//     em027_00_eft2_nomip    128x128     em086_00_add_nomip     256x256
//     em043_05_04_bm_nomip   128x128  -> Savage Deviljho's XfBA_IW_1__m00, the neck glow
//
// Every other monster texture carries a full 7..11-level chain, so this is an authored decision
// per texture and not an artefact of the extraction.
//
// It matters because three.js generates a chain anyway and samples it trilinear. These five are
// small effect maps drawn on scrolling, tiled UVs -- Savage's is 128x128 under a clip that runs
// fUVTransform u 0 -> 1 on a mesh whose UVs already span -0.613..1.469 -- and under minification a
// generated mip is exactly the blur the game does not have. Raven, 2026-09-11: "the one that does
// render is blobby, it should be sharper."
//
// The ROM's answer is its own level count, so honour it: no chain, and magnify/minify linearly
// from level 0. Anisotropy is left alone; it needs no mips and only helps at glancing angles.
const ROM_NO_MIPMAP = new Set([
  'tex/2b36024aca3a39b3.webp',   // em027_00 eft1
  'tex/5ad539cbc824f934.webp',   // em027_00 eft2
  'tex/865f4666b4cc1b3f.webp',   // em027_00 eft3
  'tex/35689af189393fd5.webp',   // em043_05 Savage Deviljho, neck glow
  'tex/9f7dea74f29c830b.webp',   // em086_00 add
]);
function romNoMipmap(file){
  const i = String(file).indexOf('tex/');
  return i >= 0 && ROM_NO_MIPMAP.has(String(file).slice(i));
}

// ONE STAMP PER PAGE LOAD, appended to every MODEL and TEXTURE fetch.
//
// loadJson has always cache-busted, so the manifests were fresh while the .glb and .webp they
// name were served from the browser's disk cache -- which is the worst possible split, because
// everything the app REPORTS is current while the geometry on screen is old. It cost Raven two
// separate rounds of looking at a model I had already repaired and pushed (2026-09-12: "Hard
// Refreshed and still see the weld", then "Deployed version, Crimson is back to being shifted"
// against a deploy that was byte-for-byte correct). GitHub Pages serves these with a freshness
// lifetime and the browser does not revalidate inside it, so an ETag does not save us.
//
// PER LOAD, not per request: the stamp is fixed for the life of the page, so switching monsters
// still hits the browser cache and costs nothing, and only a reload refetches. That is the point
// -- a refresh has to be able to show new data, which is the whole contract of "hard refresh and
// look again". The cost is re-downloading what a session actually touches, once per reload.
const ASSET_V = '?v=' + Date.now();
export const bust = url => (String(url).indexOf('?') >= 0 ? url : url + ASSET_V);

// `opt.linear`: a data map (a monster's normal map) that must not be read as sRGB colour;
// cached apart from the colour reading of the same file
export async function getTexture(file, opt){
  const key = (opt && opt.linear) ? file + '#linear' : file;
  if (texCache.has(key)) return texCache.get(key);
  const t = await texLoader.loadAsync(bust(file));
  t.colorSpace = (opt && opt.linear) ? THREE.NoColorSpace : THREE.SRGBColorSpace; t.flipY = false;
  // MT Framework tiles its maps: 14% of primitives have UVs outside 0..1, up to 6x on
  // capes, long hair and skirts. three.js defaults to ClampToEdge, which smears the edge
  // texel across everything past the first tile -- it reads as the texture being
  // magnified rather than repeated.
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = maxAnisotropy;
  if (romNoMipmap(file)){
    t.generateMipmaps = false;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
  }
  texCache.set(key, t); return t;
}

// one parse per cache key; callers skeletonClone() the scene they get back
export async function loadGlb(url, cacheKey){
  let gltf = glbCache.get(cacheKey);
  if (!gltf) { gltf = await loader.loadAsync(bust(url)); glbCache.set(cacheKey, gltf); }
  return gltf;
}

// cache-bust: the dev server sends no no-cache headers and a stale manifest
// silently strips the joint table, which makes posing a no-op
export async function loadJson(url){
  return (await fetch(url + '?v=' + Date.now())).json();
}
