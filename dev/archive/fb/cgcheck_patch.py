p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-congalala-check.mjs'
s = open(p, encoding='utf8').read()
a = s.index("  // ---- 2. the contract"); b = s.index("  console.log(`\\n${pass} passed")
mid = '''  // ---- 2. the contract ----------------------------------------------------------------------------------------------------------
  const pv = (m, l, c) => JSON.stringify(S.pickVariantsFor(m, l, c, {}));
  const byName = n => cases.find(c => c.name === n);
  const shells = (c, over) => [...runJS(c, over).info.values()].map(I => I.S.shell + ':' + I.S.modeIndex);
  ok(pv('em021_00', '2', 'Motion[12]') === '["7:0x0a","7:0x0b","7:0x49"]', 'L2 M12 picks the three dung throws', pv('em021_00', '2', 'Motion[12]'));
  ok(pv('em021_00', '2', 'Motion[16]') === '[]', 'L2 M16: no pick (the gas decides)');
  ok(shells(byName('cg_gas_1'), { gas: 0 }).length === 0 && runJS(byName('cg_gas_1'), { gas: 0 }).refused.length === 1, 'L2 M16 with no gas: no breath, refused by name');
  ok(shells(byName('cg_gas_2')).join() === 'shell04:3' && shells(byName('cg_gas_3')).join() === 'shell04:2', 'gas 2 -> mode 3, gas 3 -> mode 2 (the remap 0xdcee10)');
  {
    // the pit's shell: L3 M14's end, enraged, once until an L3 M13 play
    const st = S.createShellState('em021_00'), J = g => J0;
    const run = (clip, frames, rage) => { const made = []; for (let k = 0; k < frames; k++){ const out = S.stepShells(st, { monId: 'em021_00', list: '3', clip, frame: k % 40, joints: J,
      rage, rock: { variant: null, target: { x: 0, y: 0, z: 1500 }, floorY: 0 }, owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 }, ground: 0 }); made.push(...out.spawned.map(x => x.shell + ':' + x.modeIndex)); } return made; };
    const a1 = run('Motion[14]', 130, true), a2 = run('Motion[14]', 130, true), a3 = run('Motion[13]', 10, true), a4 = run('Motion[14]', 50, true), a5 = run('Motion[14]', 50, false);
    ok(a1.join() === 'shell00:11' && a2.length === 0 && a4.join() === 'shell00:11' && a5.length === 0, 'the pit shell: once a pit (L3 M14 ends, enraged), again after L3 M13', [a1, a2, a3, a4, a5]);
  }

  // ---- 3. CONTROLS ----------------------------------------------------------------------------------------------------------------
  for (const [n, over, what] of [
    ['cg_dung_3_lob', { target: [900.0, 80.0, 2400.0] }, 'the target 40 higher (the lob)'],
    ['cg_dung_0', { owner: [0, 0x3001, 0] }, 'the facing one word off'],
    ['cg_cloud_l0m20', { joints: { 0: J0, 4: J0b, 40: J40, 50: J50, 145: J145, 140: J50 } }, 'another joint 140'],
    ['cg_gas_2', { joints: { 0: J0, 4: J50, 40: J40, 50: J50, 140: J140, 145: J145 } }, 'another joint 4'],
    ['cg_dung_1', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the landing, the splat)'],
  ]){
    const { why } = compare(byName(n), over);
    ok(!!why, 'CONTROL ' + n + ' with ' + what + ' fails', why || 'it matched');
  }

'''
s = s[:a] + mid + s[b:]
open(p, 'w', encoding='utf8').write(s)
print('ok')
