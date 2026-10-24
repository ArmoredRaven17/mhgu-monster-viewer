const M = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/motion-states.js');
const run = (mon, list, clip, frames, user) => {
  const s = new M.MotionStates(); const ev = [];
  for (const f of frames){ const o = s.step(mon, list, clip, f, {}, Object.assign({ rage: false, level: 0, tired: false }, user));
    if (o.fire.length || o.holdOn.length || o.holdOff.length) ev.push(f + ':' + JSON.stringify({ fire: o.fire, on: o.holdOn, off: o.holdOff })); }
  return ev.join(' ');
};
const F = n => Array.from({ length: n }, (_, i) => i);
console.log('T L4M7 k1  ', run('em066_00', '4', 'Motion[7]', F(200), { boulder: 1, action: [7, 0x52] }));
console.log('T L4M7 none', run('em066_00', '4', 'Motion[7]', F(200), { boulder: 0, action: [7, 0x52] }));
console.log('T L4M7 k3  ', run('em066_00', '4', 'Motion[7]', F(200), { boulder: 3 }));
console.log('D L4M7 k3  ', run('em066_04', '4', 'Motion[7]', F(200), { boulder: 3 }));
console.log('D L4M7 k2  ', run('em066_04', '4', 'Motion[7]#B', F(200), { boulder: 2 }));
console.log('T L4M11 none (1,0x53)', run('em066_00', '4', 'Motion[11]', F(100), { boulder: 0, action: [1, 0x53] }));
console.log('T L4M18 none (1,0x52)', run('em066_00', '4', 'Motion[18]', F(100), { boulder: 0, action: [1, 0x52] }));
console.log('D L4M18 none (1,0x52)', run('em066_04', '4', 'Motion[18]', F(100), { boulder: 0, action: [1, 0x52] }));
console.log('D L4M18 k1 (1,0xff)', run('em066_04', '4', 'Motion[18]', F(100), { boulder: 1, action: [1, 0xff] }));
console.log('T L4M18 (1,0xff)', run('em066_00', '4', 'Motion[18]', F(100), { boulder: 0, action: [1, 0xff] }));
console.log('T L4M17 k1', run('em066_00', '4', 'Motion[17]', F(150), { boulder: 1 }));
console.log('D L9M13 k3', run('em066_04', '9', 'Motion[13]', F(250), { boulder: 3 }));
console.log('D L9M1 k0', run('em066_04', '9', 'Motion[1]', F(130), { boulder: 0 }));
console.log('D L9M1 k2', run('em066_04', '9', 'Motion[1]', F(130), { boulder: 2 }));
console.log('T L0M1 k1', run('em066_00', '0', 'Motion[1]', F(10), { boulder: 1 }));
console.log('T L4M12 k1', run('em066_00', '4', 'Motion[12]', F(10), { boulder: 1 }));
console.log('other mon', run('em067_00', '4', 'Motion[7]', F(10), { boulder: 1 }));
