p = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\duo\duo-check.mjs'
s = open(p, encoding='utf-8').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, a[:70]
    s = s.replace(a, b)
rep("""    const ok = await until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);""",
"""    // (a combined entry led by a clip of hers plays that raw clip under its own name)
    const ent = ((V.MON.monsters.find(m => m.id === MON).lists.find(l => l.id === list) || {}).clips || []).find(c => c.clip === clip);
    const want = ent && ent.her ? ent.her.clip : o.value;
    const ok = await until(() => V.pose.action && V.pose.action.getClip().name === want, 300);""")
a = s.index("      let saved = null;")
b = s.index("      const hz = document.getElementById('hitZonesPanel');")
s = s[:a] + """      check(V.state.list === DUO && V.state.clip === name, 'the view state a save writes (currentSet copies state) holds the combined list and entry', { list: V.state.list, clip: V.state.clip });
      // OPEN: a view file naming a combined entry goes through loadSet / applySet like any other
      await playRaw('4', 'Motion[36]');
      { const inp = document.getElementById('importFile'), dt = new DataTransfer();
        dt.items.add(new File([JSON.stringify({ id: MON, list: DUO, clip: name })], 'duo-view.json', { type: 'application/json' }));
        inp.files = dt.files; inp.dispatchEvent(new Event('change')); }
      await until(async () => V.state.list === DUO && V.state.clip === name && (await P()).mounted, 600); await frames(4);
      r = await P();
      check(V.state.list === DUO && V.state.clip === name && r.mounted && r.local && r.local.clip === 'Motion[6]',
            'a view file opened on the combined entry plays it, him mounted on his pair', { list: V.state.list, clip: V.state.clip, local: r.local });
""" + s[b:]
open(p, 'w', encoding='utf-8').write(s)
print('ok')
