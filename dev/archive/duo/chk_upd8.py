p = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\duo\duo-check.mjs'
s = open(p, encoding='utf-8').read()
anchor = "  // ---- HER RECORDS ON THE COMBINED LIST"
assert s.count(anchor) == 1
NEW = r"""  // ---- HIS WINGS ON HER (render/monster.js ROM_WINGS): his flight state by his clip and frame -- folded on the ridden
  // clips (Raven's Away), out on the fly-in (1:0x2, M8: part 4), flapping where his answer flies (part 2 / parts 1, 3, 4)
  {
    const J = x => JSON.stringify(x);
    const wingsAt = async f => { V.pose.action.paused = true; V.pose.action.time = f / 60; await frames(3); const q = await P();
                                 return { w: q.wingParts, drawn: (q.drawnParts || []).filter(p => p >= 1 && p <= 4) }; };
    await play('4', 'Motion[6]');
    const r6 = await wingsAt(30);
    check(r6.w === null && J(r6.drawn) === '[]', 'ridden (her L4 M6, his M6: folded): no wing card -- Away', r6);
    await play('4', 'Motion[8]');
    const r8 = [await wingsAt(0), await wingsAt(40)];
    check(r8.every(x => J(x.drawn) === '[4]'), 'his fly-in / landing on her (her L4 M8, his 1:0x2 M8: out): part 4', r8);
    await pickOn(DUO, 'Seltas Motion[34]');
    const r34 = []; for (let f = 0; f < 4; f++) r34.push((await wingsAt(f)).drawn);
    check(J(r34) === J([[2], [2], [1, 3, 4], [1, 3, 4]]), 'his flying attack on her (Seltas Motion[34], 7:0x3a): flapping, part 2 / parts 1, 3, 4 every 2 frames', r34);
    await pickOn(DUO, 'Queen L4 Motion[68]_loop + Seltas leaves');
    const rl = []; for (let f = 0; f < 4; f++) rl.push((await wingsAt(f)).drawn);
    check(J(rl) === J([[2], [2], [1, 3, 4], [1, 3, 4]]), 'his leaving (1:0x13, M46): flapping from the unlink frame', rl);
    await pickOn(DUO, 'Seltas Motion[31]');
    const r31 = await wingsAt(60);
    check(r31.w === null && J(r31.drawn) === '[]', 'his riding attack M31 (7:0x32: folded): no card', r31);
    V.pose.action.paused = false;
  }

"""
s = s.replace(anchor, NEW + anchor)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
