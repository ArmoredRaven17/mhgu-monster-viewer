p = 'mk068spec.py'; s = open(p, encoding='utf8').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, a[:70]
    s = s.replace(a, b)
BS = chr(92)
# the cases: a ring outside its radius (the owner 6000 off when L2 M61 rings) and the flight's 600 limit (no floor in reach)
rep("  \"    // THE RETIRE:",
    "  \"    // OUTSIDE THE RADIUS: L2 M61's ring (r 3500) with the owner moved 6000 away -- heard, the stored ring reset, still stuck\",\n"
    "  \"    C('ring_out', 0x17, 0, null, 0, [{ list: '2', clip: 'Motion[60]', variant: '7:0x17', len: 100 }, { list: '2', clip: 'Motion[61]', variant: '7:0x18', len: 200, ownerPos: [6120.5, 15.25, -80.75] }], { \" + START('0x17') + \", frames: 420, ring: 1 }),\",\n"
    "  \"    // THE FLIGHT'S LIMIT: no floor in reach (y -1e6): at +0x1634 >= 600 the end (1) -- both flight handles at once, deleted -- and ef 6 (u 2)\",\n"
    "  \"    C('limit', 0x22, 0, null, 0, \" + SEQ(('2', 60, '7:0x22', 120)) + \", { \" + START('0x22') + \", frames: 700, floorY: -1000000.0, ground: -1000000.0 }),\",\n"
    "  \"    // THE RETIRE:")
# the module side: a play's own owner position (q.ownerPos), the ROM's ring centre the ringing play's
rep("    \"        const B = c.ring === 1 ? c.ownerPos : [0, 0, 0],",
    "    \"        const B = c.ring === 1 ? (c.seq[1].ownerPos || c.ownerPos) : [0, 0, 0],")
rep("rep(\"    if (c.precall) o.precall = c.precall;\",",
    "rep(\"ownerPos: { x: x.ownerPos[0], y: x.ownerPos[1], z: x.ownerPos[2] },\",\n"
    "    \"ownerPos: (P => ({ x: P[0], y: P[1], z: P[2] }))(q.ownerPos || x.ownerPos),\")\n"
    "rep(\"    if (c.precall) o.precall = c.precall;\",")
# the ROM run's owner point for the ring play: the block +0x40 moved at that play's first move (pokes), so the scale's distance
# test meets the same centre the module's broadcast carries -- the centre itself is poked; the owner's position matters to nothing else
# after the throw
# positive asserts
rep("    \"    ok(st('retire', 0).includes(4)",
    "    \"    ok(st('ring_out', 0).every(x => x !== 3) && st('ring_out', 1).every(x => x !== 3) && JS.get('ring_out').info.size === 2 && [...JS.get('ring_out').info.values()].every(I => I.S.log.some(e => e.ev === 'heard')), 'ring_out: heard, outside r 3500 -- the ROM scales never ring', JSON.stringify([...new Set(st('ring_out', 0))]));\n\"\n"
    "    \"    { const F = ROM['limit'].shells[0].run.frames, last = F[F.length - 1], lg = F.flatMap(x => x.log.filter(e => e[0] === 'stop' || e[0] === 'start').map(e => e[0] + e[1] + (e[0] === 'start' ? ':' + e[2] : '')));\n\"\n"
    "    \"      ok(!F.some(x => x.state === 2) && last.state === 0xff && last.k === 600 && lg.join() === 'stop1,stop1,start0:2', 'limit: the ROM scale flies 600 moves, then the end (1) -- both flight handles stopped at once -- and u 2', last.k + ' ' + lg.join()); }\n\"\n"
    "    \"    ok(st('retire', 0).includes(4)")
# the contract: the phase-2 clips
rep("    \"  ok(pv('%s', '0', 'Motion[50]') === '[\\\"1:0x00\\\"]', 'L0 M50 picks its ring', pv('%s', '0', 'Motion[50]'));\" % (mon, mon)]),",
    "    \"  ok(pv('%s', '0', 'Motion[50]') === '[\\\"1:0x00\\\"]', 'L0 M50 picks its ring', pv('%s', '0', 'Motion[50]'));\" % (mon, mon),\n"
    "    \"  ok(pv('%s', '0', 'Motion[138]') === '[\\\"2:0x44\\\"]' && pv('%s', '0', 'Motion[139]') === '[\\\"2:0x45\\\"]' && pv('%s', '0', 'Motion[105]') === '[]', 'L0 M138 / M139 carry (2, 0x44..0x47)\\'s phase-2 ring; L0 M105 (phase 3) none');\" % (mon, mon, mon)]),")
open(p, 'w', encoding='utf8').write(s); print('ok')
