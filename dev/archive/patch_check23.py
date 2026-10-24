import os
os.chdir(r'C:\MHGU-Extract\MHGU-Monster-Viewer')


def patch(p, pairs):
    b = open(p, 'rb').read(); s = b.decode('utf-8'); crlf = '\r\n' in s; s = s.replace('\r\n', '\n')
    for a, r in pairs:
        assert s.count(a) == 1, (a[:60], s.count(a)); s = s.replace(a, r)
    if crlf: s = s.replace('\n', '\r\n')
    open(p, 'wb').write(s.encode('utf-8'))


patch('dev/checks/em023_00.mjs', [
("""    clipSel.value = o.value; await clipSel.onchange();
    return until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
  };""", """    clipSel.value = o.value; await clipSel.onchange();
    return until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
  };
  // a COPY of a clip (render/motion-states.js CLIP_VARIANTS): its menu value carries '#B', the clip played does not
  const playCopy = async (list, clip, copy) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === clip + '_loop#' + copy || x.value === clip + '#' + copy);
    if (!o){ check(false, 'the list has copy ' + copy + ' of ' + list + '|' + clip); return false; }
    clipSel.value = o.value; await clipSel.onchange();
    const name = o.value.replace(/#.*$/, '');
    return until(() => V.pose.action && V.pose.action.getClip().name === name, 300);
  };"""),
("""  // L3 M13: paralysis, then the shock trap, in turn""",
 """  // L3 M13 IS COPIED (CLIP_VARIANTS, Raven 2026-10-15): copy A paralysis, copy B the shock trap's hold"""),
("""'L3 Motion[13] play 1 (paralysed): c 1101 at once'""", """'L3 Motion[13] copy A (paralysed): c 1101 at once'"""),
("""  await play('3', 'Motion[13]'); await frames(3); await steps(2);
  check(count(fired, 1105) === 1""", """  await playCopy('3', 'Motion[13]', 'B'); await frames(3); await steps(2);
  check(count(fired, 1105) === 1"""),
("""'L3 Motion[13] play 2 (the shock trap\\'s hold, its only clip): c 1105 at once'""",
 """'L3 Motion[13] copy B (the shock trap\\'s hold, its only clip): c 1105 at once'"""),
])
print('ok')
