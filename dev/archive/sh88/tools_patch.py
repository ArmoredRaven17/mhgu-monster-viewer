p = r'C:\MHGU-Extract\efx\record_shells.py'
s = open(p, encoding='utf-8').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, a[:60]
    s = s.replace(a, b)
rep("""PART = None
_argv = []
for a in sys.argv[1:]:""", """PART = None
# --carry=<0|1|2|4> / --loop / --then=<list>:<clip>[:<steps>] (dev/shell-capture.mjs): Ahtal-Ka's Carrying control, the clip kept
# looping (his webs are made on L2 M30's first wrap), a second clip played after in the same session (the pull reads the spot a
# shell57 end left; an L3 start releases the webs). IN THE TAG, as the wall, the form, the level and the part are.
CARRY = None
LOOP = False
THEN = None
_argv = []
for a in sys.argv[1:]:
    if a.startswith('--carry='):
        CARRY = a.split('=', 1)[1]
        continue
    if a == '--loop':
        LOOP = True
        continue
    if a.startswith('--then='):
        THEN = a.split('=', 1)[1]
        continue""")
rep("""('_p' + re.sub(r'\\W', '', PART) if PART else ''))""",
    """('_p' + re.sub(r'\\W', '', PART) if PART else '') + ('_c' + CARRY if CARRY else '') + ('_loop' if LOOP else '') + ('_t' + re.sub(r'\\W', '', THEN) if THEN else ''))""")
rep("""(['--part', PART] if PART else []),""", """(['--part', PART] if PART else []) + (['--carry', CARRY] if CARRY else []) + (['--loop'] if LOOP else []) + (['--then', THEN] if THEN else []),""")
rep("""    print('lift-effects.sh: %d sets added; lifting...' % len(add), flush=True)
    r = subprocess.run(['sh', 'lift-effects.sh'], cwd=EFX, capture_output=True, text=True)
    print('lift: %s' % ('ok' if r.returncode == 0 else 'FAILED\\n' + (r.stderr or r.stdout)[-800:]))""",
"""    # ADD_NO_LIFT=1: the sets go into V= but the lift is left to one run after a batch of invocations
    if os.environ.get('ADD_NO_LIFT'):
        print('lift-effects.sh: %d sets added; lift left to the caller (ADD_NO_LIFT)' % len(add), flush=True)
    else:
        print('lift-effects.sh: %d sets added; lifting...' % len(add), flush=True)
        r = subprocess.run(['sh', 'lift-effects.sh'], cwd=EFX, capture_output=True, text=True)
        print('lift: %s' % ('ok' if r.returncode == 0 else 'FAILED\\n' + (r.stderr or r.stdout)[-800:]))""")
open(p, 'w', encoding='utf-8', newline='\n').write(s)

p = r'C:\MHGU-Extract\efx\shellplan.mjs'
s = open(p, encoding='utf-8').read()
rep("""    if (start.kind === 'switch' && sh.effect3 && sh.effect3.__req == null) sh.effect3.__req = starts.length;   // base01's 0x20 switch""",
"""    if (start.slot) (sh.__slotReq = sh.__slotReq || {})[start.slot] = starts.length;   // a named handle (Ahtal-Ka's anchors)
    else if (start.kind === 'switch' && sh.effect3 && sh.effect3.__req == null) sh.effect3.__req = starts.length;   // base01's 0x20 switch""")
rep("""  if (out.ended.includes(shell) && !(shell.base === 'base14' && !shell.stop)){ stops.push([f, 0]); last = Math.max(last, f); }""",
"""  // A SHELL'S NAMED HANDLES STOPPED BY ITS MOVE (render/shells.js `stops`: { slot, mode }, 'start' = request 0; Ahtal-Ka's anchors,
  // whose end stops its handles through these too -- so no generic end stop for them)
  for (const st of shell.stops || []){
    if (!st || st.slot == null || st.__planned) continue;
    st.__planned = true;
    const n = st.slot === 'start' ? 0 : (shell.__slotReq || {})[st.slot];
    if (n == null) continue;
    stops.push(st.mode ? [f, n, 1] : [f, n]); last = Math.max(last, f);
  }
  if (out.ended.includes(shell) && !shell.handles && !(shell.base === 'base14' && !shell.stop)){ stops.push([f, 0]); last = Math.max(last, f); }""")
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('ok')
