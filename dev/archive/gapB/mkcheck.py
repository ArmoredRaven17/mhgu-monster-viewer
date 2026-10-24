s = open('replay37.mjs', encoding='utf8').read()
s = s.replace("// replay37.mjs (gapB, 2026-10-20)", "// shells-nargacuga-impact-check.mjs (was the decode helper's gapB/replay37.mjs, 2026-10-20)")
s = s.replace("run through stepShells of a PATCHED COPY of docs/render/shells.js (gapB/shells.patched.js, made by\n// patch37.py; the repo file is not touched). Shows:",
              "run through docs/render/shells.js's stepShells (perFrame037). Shows:")
old = "const S = await import(pathToFileURL(join(HERE, 'shells.patched.js')).href);\nconst U = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);"
assert s.count(old) == 1
s = s.replace(old, "const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);\n"
              "// the ROM emulator (the decode helper's <scratchpad>/gapB/emu37n.py); FB_EMU37 overrides\n"
              "const EMU37 = process.env.FB_EMU37 || 'C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/gapB/emu37n.py';")
assert s.count("spawnSync('python', [join(HERE, 'emu37n.py'),") == 1
s = s.replace("spawnSync('python', [join(HERE, 'emu37n.py'),", "spawnSync('python', [EMU37,")
a = s.index("// 6. CONTROL: the repo's module"); b = s.index("console.log(`\\n${pass} passed")
s = s[:a] + s[b:]
s = s.replace("//   6. control: the unpatched repo shells.js makes no shell01 on these clips\n", "")
open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-nargacuga-impact-check.mjs', 'w', encoding='utf8', newline='\r\n').write(s)
print('ok')
