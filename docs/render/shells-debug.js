// SHELLS DEBUG VIEW (?shells). Markers for the shells render/shells.js reproduces from the playing clip -- a check of
// the decode, not part of the viewer's look. Loaded by index.html only when the URL carries ?shells.
//
// Per live shell: a red dot at the shell's position (shell +0x40), a yellow dot at its effect anchor (+0x1000, where
// the ROM places the shell's effect every frame), a line between them (the direction the ROM aims the effect), and
// for a base04 shell (the breath body) its trail entries (+0x15dc) as blue dots from the joint point. The debug view
// runs its own shell state at 1/60 s steps, as render/rom/effect/live.js steps the effects; the effect itself is the
// effect runtime's to draw.
//
// __view.shells: { state(), last, log } -- `last` is the latest stepShells result, `log` one line per spawn / end.
import * as THREE from 'three';
import { gidBonesOf } from './skeleton.js';
import { createShellState, stepShells, gameJointFrom, SHELL_DATA } from './shells.js';

const STEP = 1 / 60, MAX_STEPS = 4, GAME_TO_VIEW = 0.01;

export function attachShellsDebug(view){
  const group = new THREE.Group();
  group.name = 'shells-debug';
  group.renderOrder = 1e9;
  view.scene.add(group);
  const dot = (color, r) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8),
                             new THREE.MeshBasicMaterial({ color, depthTest: false, depthWrite: false, transparent: true }));
    m.renderOrder = 1e9;
    m.frustumCulled = false;
    return m;
  };
  const markers = new Map();
  let st = null, acc = 0, last = null;
  const api = { last: null, log: [], state: () => st };
  view.shells = api;

  // the playing clip as index.html's driveClipEffects reads it: bare slot name, _loop frames offset by the _start
  function clipNow(){
    const act = view.pose && view.pose.action;
    const name = act && act.getClip ? act.getClip().name : null;
    if (!name) return { clip: null, frame: 0, loopStart: null };
    const base = name.replace(/_(start|loop)$/, '');
    let off = 0;
    if (name.endsWith('_loop')){
      const e = view.MON.monsters.find(m => m.id === view.state.id);
      const l = e && e.lists.find(x => x.id === view.state.list);
      const sib = l && l.clips.find(c => c.clip === base + '_start');
      if (sib) off = Math.round(sib.dur * 60);
    }
    // a _loop clip loops back to where it sits in its motion: the motion's own loop point
    return { clip: base, frame: act.time * 60 + off, loopStart: name.endsWith('_loop') ? off : null };
  }

  function jointsNow(){
    const root = view.mounted && view.mounted.main;
    if (!root) return () => null;
    const bones = gidBonesOf(root);
    const cache = new Map();
    return gid => {
      if (cache.has(gid)) return cache.get(gid);
      const b = bones.find(x => x.gid === gid);
      const m = b && b.node ? gameJointFrom(b.node.matrixWorld.elements) : null;
      cache.set(gid, m);
      return m;
    };
  }

  function draw(){
    const live = new Set();
    for (const S of (st ? st.shells : [])){
      if (S.state !== 1) continue;
      live.add(S.id);
      let mk = markers.get(S.id);
      if (!mk){
        mk = { pos: dot(0xff3030, 0.25), anchor: dot(0xffd020, 0.18), trail: [],
               line: new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
                                    new THREE.LineBasicMaterial({ color: 0xffa040, depthTest: false, transparent: true })) };
        mk.line.renderOrder = 1e9;
        mk.line.frustumCulled = false;
        group.add(mk.pos, mk.anchor, mk.line);
        markers.set(S.id, mk);
      }
      const v = p => new THREE.Vector3(p[0] * GAME_TO_VIEW, p[1] * GAME_TO_VIEW, p[2] * GAME_TO_VIEW);
      mk.pos.position.copy(v(S.position));
      mk.anchor.position.copy(v(S.anchor));
      mk.line.geometry.setFromPoints([v(S.anchor), v(S.position)]);
      const pts = (S.trail || []).map(t => v([S.jointPoint[0] + t[0], S.jointPoint[1] + t[1], S.jointPoint[2] + t[2]]));
      while (mk.trail.length < pts.length){ const d = dot(0x40a0ff, 0.12); group.add(d); mk.trail.push(d); }
      pts.forEach((p, i) => mk.trail[i].position.copy(p));
    }
    for (const [id, mk] of markers) if (!live.has(id)){
      for (const o of [mk.pos, mk.anchor, mk.line, ...mk.trail]){ group.remove(o); o.geometry.dispose(); o.material.dispose(); }
      markers.delete(id);
    }
  }

  let lastT = null;
  function tick(){
    requestAnimationFrame(tick);
    const now = performance.now() / 1000;
    if (lastT === null) lastT = now;
    acc = Math.min(acc + (now - lastT), MAX_STEPS * STEP);
    lastT = now;
    const monId = view.state.id;
    if (!SHELL_DATA[monId]){ st = null; draw(); return; }
    if (!st || st.monId !== monId) st = createShellState(monId);
    if (acc < STEP) return;
    const { clip, frame, loopStart } = clipNow();
    const joints = jointsNow();
    while (acc >= STEP){
      acc -= STEP;
      last = stepShells(st, { monId, list: view.state.list, clip, frame, loopStart, joints, rage: !!view.state.rage });
      for (const S of last.spawned) api.log.push({ t: st.frames, frame, spawn: S.shell, mode: S.modeIndex, action: S.action, key: S.start && S.start.key, at: S.anchor.slice() });
      for (const S of last.ended) api.log.push({ t: st.frames, frame, end: S.shell, mode: S.modeIndex, stop: S.stop && S.stop.key });
    }
    api.last = last;
    draw();
  }
  requestAnimationFrame(tick);
  return api;
}
