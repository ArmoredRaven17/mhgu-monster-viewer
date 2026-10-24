# Build the BEFORE overlay: the current working-tree files with this session's colour-space edits reversed.
import os, sys
D = r'C:/MHGU-Extract/MHGU-Monster-Viewer/docs'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'before')

def rev(rel, pairs):
    s = open(os.path.join(D, rel), encoding='utf-8').read()
    for new, old in pairs:
        n = s.count(new)
        if n != 1:
            sys.exit('%s: %d hits for %r' % (rel, n, new[:80]))
        s = s.replace(new, old)
    p = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf-8', newline='').write(s)
    print('wrote', p)

SRGB = ', THREE.SRGBColorSpace);'
rev('render/rom/material.js', [
    ("                     gl.albedo[2] * df[2] * k[2]" + SRGB, "                     gl.albedo[2] * df[2] * k[2]);"),
    ("mat.specular.setRGB(gl.specular[0], gl.specular[1], gl.specular[2]" + SRGB, "mat.specular.setRGB(gl.specular[0], gl.specular[1], gl.specular[2]);"),
    ("u.uSpecRGB.value.fromArray(romLinear3(gl.specular));", "u.uSpecRGB.value.fromArray(gl.specular.slice(0, 3));"),
    ("if (feat && feat.reflect === 'GlobalCubeMap' && cb && cb.reflective && !u.uReflRGB) u.uReflRGB = { value: new THREE.Vector3().fromArray(romLinear3(cb.reflective)) };", ""),
])
rev('render/material.js', [
    ("m.color.setRGB(b.albedo[0] * v[0], b.albedo[1] * v[1], b.albedo[2] * v[2]" + SRGB + "\n      if (cols > 3)",
     "m.color.setRGB(b.albedo[0] * v[0], b.albedo[1] * v[1], b.albedo[2] * v[2]);\n      if (cols > 3)"),
    ("case 'fDiffuseColor':\n      if (m.color) m.color.setRGB(b.albedo[0] * v[0], b.albedo[1] * v[1], b.albedo[2] * v[2]" + SRGB,
     "case 'fDiffuseColor':\n      if (m.color) m.color.setRGB(b.albedo[0] * v[0], b.albedo[1] * v[1], b.albedo[2] * v[2]);"),
    ("b.albedo[2] + bl" + SRGB, "b.albedo[2] + bl);"),
    ("""      if (u && u.uExtTint){
        _romLin.setRGB(v[0], v[1] === undefined ? v[0] : v[1], v[2] === undefined ? v[0] : v[2], THREE.SRGBColorSpace);
        u.uExtTint.value.set(_romLin.r, _romLin.g, _romLin.b, cols > 3 ? v[3] : 1);
      }""", "      if (u && u.uExtTint) u.uExtTint.value.set(v[0], v[1], v[2], cols > 3 ? v[3] : 1);"),
    ("""      if (u && u.uSpecTint){
        _romLin.setRGB(v[0], v[1] === undefined ? v[0] : v[1], v[2] === undefined ? v[0] : v[2], THREE.SRGBColorSpace);
        u.uSpecTint.value = 0.299 * _romLin.r + 0.587 * _romLin.g + 0.114 * _romLin.b;
      }""", """      if (u && u.uSpecTint)
        u.uSpecTint.value = 0.299 * v[0] + 0.587 * (v[1] === undefined ? v[0] : v[1])
                          + 0.114 * (v[2] === undefined ? v[0] : v[2]);"""),
])
rev('render/monster.js', [
    ("base = (gl && gl.specular) ? romLinear3(gl.specular) : u.uSpecRGB.value.toArray();", "base = (gl && gl.specular) ? gl.specular.slice(0, 3) : u.uSpecRGB.value.toArray();"),
    ("const rgb = raw ? romLinear3(raw) : null;", "const rgb = raw;"),
    ("base = cr ? romLinear3(cr) : u.uReflRGB.value.toArray();", "base = cr ? cr.slice(0, 3) : u.uReflRGB.value.toArray();"),
    ("const rgb = rawR ? romLinear3(rawR) : null;", "const rgb = rawR;"),
    ("m.color.setRGB(a[0] * d[0], a[1] * d[1], a[2] * d[2]" + SRGB + "\n    const la = romLinear3(a);\n    m.emissive.setRGB(m.emissive.r * la[0], m.emissive.g * la[1], m.emissive.b * la[2]);",
     "m.color.setRGB(a[0] * d[0], a[1] * d[1], a[2] * d[2]);\n    m.emissive.setRGB(m.emissive.r * a[0], m.emissive.g * a[1], m.emissive.b * a[2]);"),
])
