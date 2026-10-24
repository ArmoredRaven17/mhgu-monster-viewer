import sys, os
SP = os.path.dirname(os.path.abspath(__file__))
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(p, encoding='utf8', newline='').read()
NL = '\r\n' if '\r\n' in s else '\n'
def fix(t): return t.replace('\r\n', '\n').replace('\n', NL)
def rep(a, b):
    global s
    a, b = fix(a), fix(b)
    assert s.count(a) == 1, (s.count(a), a[:80])
    s = s.replace(a, b)
anchor = '// dev/rom-map.md "Ahtal-Ka -- shell57 / base57" (READ whole'
assert s.count(anchor) == 1
if 'function params061s24(' not in s:
    ins = open(os.path.join(SP, 'rustrum.js'), encoding='utf8').read().lstrip('\n') + '\n' + open(os.path.join(SP, 'data061v4.js'), encoding='utf8').read() + open(os.path.join(SP, 'act061v4.js'), encoding='utf8').read() + '\n'
    i = s.index(anchor)
    s = s[:i] + fix(ins) + s[i:]
rep("""    const S = sp.shell === 'shell19'
      ? make061s19(state, D, sp.mode, J, own, ctx, a.action, sp.frame)""", """    const S = sp.shell === 'shell19'
      ? (def.id === 0x10b ? make061s19v4(state, D, sp.mode, J, own, ctx, a.action, sp.frame, null) : make061s19(state, D, sp.mode, J, own, ctx, a.action, sp.frame))""")
rep("""  } else if (a && a.code === 'em061'){
    spawn061(state, D, a, ctx, input, out, fresh);           // Duramboros's actions""", """  } else if (a && a.code === 'em061'){
    spawn061(state, D, a, ctx, input, out, fresh);           // Duramboros's actions
  } else if (a && a.code === 'em061r'){
    spawn061v4(state, D, a, ctx, input, out, fresh);         // Rustrum's L9 lump actions""")
rep("""    else if (S.base === 'base22') step22(S, ctx, input, D, out);   // Rajang's rock""", """    else if (S.base === 'base22') step22(S, ctx, input, D, out);   // Rajang's rock
    else if (S.base === 'base24') step24(S, ctx, input, D, out);   // Rustrum's lump""")
rep("""  if (S.state === 2){                                    // base13 flies in state 2 (its init 0x404d9c), not 1
    S.moves++;
    let r = move13(S, ctx, D);""", """  if (S.state === 1 && S.cls === 'uShellEm061_sp_13'){
    // Rustrum's lifted lump: state 1 runs the class's +0x15c (hold13r), not base13's bare `bx lr`
    S.moves++;
    const r = hold13r(S, ctx, D, out, ctx.own001, ctx.shellState);
    if (r === 'end'){
      S.stop = (S.effect && !S.effect.gone) ? { param: 0, request: 0, key: S.effect.key } : null;
      S.state = 0xfe;
      S.lifetime = ENDING_FRAMES;
      if (S.stop) S.events.push({ ev: 'stop', param: 0, key: S.stop.key, flag: 0 });
      out.ended.push(S);
    }
  } else if (S.state === 2){                             // base13 flies in state 2 (its init 0x404d9c), not 1
    S.moves++;
    let r = move13(S, ctx, D);""")
rep("""  const [vx, vy, vz] = S.velocity;
  const h = sqrtf(mla(f(vz * vz), vx, vx));
  S.angles = [wordOf(f(-vy), h), wordOf(vx, vz), S.angles[2]];""", """  const [vx, vy, vz] = S.velocity;
  const h = sqrtf(mla(f(vz * vz), vx, vx));
  // byte +0x15e1 bit 0 (flag 0x100: Rustrum's sp_13) skips the turn (0x4051cc..0x4051d8)
  if (!(S.k.flags & 0x100)) S.angles = [wordOf(f(-vy), h), wordOf(vx, vz), S.angles[2]];""")
rep("""const LANDING13 = { uShellEm084_sp_13: landing13n, uShellEm022_sp_13: (S, D, ctx, out) => landing022s13(S, D, ctx, out) };""",
    """const LANDING13 = { uShellEm084_sp_13: landing13n, uShellEm022_sp_13: (S, D, ctx, out) => landing022s13(S, D, ctx, out),
                    uShellEm061_sp_13: (S, D, ctx, out) => landing061s13(S, D, ctx, out) };""")
rep("""function move19(S, ctx){
  const k = S.k;
  S.elapsed19 = f(S.elapsed19 + ctx.dt);""", """function move19(S, ctx){
  const k = S.k;
  if (k.turn) turn19(S, ctx);                            // +0x1664 bit 3 (Rustrum's modes 7 / 8): the turn, first (0x409008)
  S.elapsed19 = f(S.elapsed19 + ctx.dt);""")
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok', NL == '\r\n')
