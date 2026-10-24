"""Build an instrumented COPY of docs/index.html (the shared file is not touched): window.__TM gets [label, ms] at each
await of remount / mount / play. serve_inst.py serves docs/ with this copy as index.html."""
import os, re
SRC = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\index.html'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'inst', 'index.html')
os.makedirs(os.path.dirname(OUT), exist_ok=True)
s = open(SRC, encoding='utf-8').read()
def rep(a, b, count=1):
    global s
    assert s.count(a) >= 1, a[:60]
    s = s.replace(a, b, count)
T = "window.__TM && window.__TM.push(['%s', performance.now()]);"
rep("async function remount({ play: withPlay = true, frame = true } = {}){\n  setLoading(true);",
    "async function remount({ play: withPlay = true, frame = true } = {}){\n  window.__TM = window.__TM || []; " + T % 'remount' + "\n  setLoading(true);")
rep("    await mount();\n    trimTextures();", "    await mount();\n    " + T % 'mount done' + "\n    trimTextures();")
rep("    if (withPlay) { await play(); placeParts(); }", "    if (withPlay) { await play(); " + T % 'play done' + " placeParts(); }")
rep("    const main = await loadMonster(e, {}, { wire: wireOn });", "    " + T % 'loadMonster main start' + "\n    const main = await loadMonster(e, {}, { wire: wireOn });\n    " + T % 'loadMonster main done')
rep("    if (mine !== seq){\n      // Superseded while loading.", "    " + T % 'parts + partner done' + "\n    if (mine !== seq){\n      // Superseded while loading.")
rep("    zoneCache = null; await applyHeat(); applyGap();", "    " + T % 'sync setup done' + "\n    zoneCache = null; await applyHeat(); applyGap();\n    " + T % 'applyHeat done')
rep("    await attachEffectMounts(main, state.id, effectOnly);", "    await attachEffectMounts(main, state.id, effectOnly);\n    " + T % 'effect mounts done')
rep("    await syncHeldProp();\n    // the Poison", "    await syncHeldProp();\n    " + T % 'held prop done' + "\n    // the Poison")
open(OUT, 'w', encoding='utf-8').write(s)
print('ok', OUT)
