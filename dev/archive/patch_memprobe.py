p = 'memprobe.mjs'
s = open(p, 'rb').read().decode('utf-8').replace('\r\n', '\n')
old = "  await sleep(4000);\n"
assert s.count(old) == 1, s.count(old)
s = s.replace(old, old + "  if (process.env.STOP) await evaluate(c, `(() => { const el = document.getElementById('setTexCache'); el.value = '${process.env.STOP}'; el.dispatchEvent(new Event('input')); return el.value; })()`);\n")
s = s.replace("return { id: V.state.id,", "return { id: V.state.id, cache: window.__texCache || null,")
open(p, 'wb').write(s.encode('utf-8'))
print('patched')
