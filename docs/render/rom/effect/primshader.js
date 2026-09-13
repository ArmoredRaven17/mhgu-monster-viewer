// THE PRIMITIVE SHADER PROGRAM, LINKED FOR ONE DRAW.
//
// docs/effects/prim-shaders.json holds the shader package's functions for the primitive technique
// (TPrimitive: VS_Primitive / PS_Primitive and everything they call, over every variant the draws have
// selected) translated to GLSL ES 3.00 by C:\MHGU-Extract\efx\shader\glsl.py -- a mechanical translation
// of the package's expression trees with its declared types (see that file's header for the
// conventions: row-major matrices uploaded in stored order, HLSL conversions spelt out).
//
// A draw selects a variant per interface (the context slots the lifted primitive draw left, host.js's
// `features`) and an input layout (ctx+0x1c8). Linking is what the engine's shader resolve does for
// that selection: each interface call goes to the selected variant, or to the interface's own body
// when nothing selected one. The two entry points are wrapped for WebGL:
//
//   vertex    the layout's elements become attributes, bound to PRIMITIVE_VS_INPUT by semantic name;
//             gl_Position.z = 2z - w, because the device runs NVN's NEAR_IS_ZERO depth mode
//             (nvnDeviceSetDepthMode(dev, 1) at 0x866a48, see ../state.js): clip z spans 0..w there and
//             -w..w in GL, and the window depth comes out the same
//   fragment  PS_Primitive's parameters are bound to PRIMITIVE_VS_OUTPUT's members by semantic;
//             SV_POSITION is gl_FragCoord (window coordinates; only used to sample screen textures,
//             which the viewer renders in GL's orientation)
//
// A variant the JSON does not carry throws: export it (glsl.py over a dump that selects it) rather than
// fall back to anything.

// The layout's element formats (chunk5-shaders Part 18; NVN attribute formats from 0xbd93d4):
// 1 F32, 3 S16, 4 U16, 7 S8 -- integer values reaching the shader as floats, unnormalised --
// 14 VertexColor, 4 bytes read as normalised RGBA8 (its conversion before that switch is not read).
export const FORMATS = {
  1: { array: Float32Array, size: 4, normalized: false },
  3: { array: Int16Array, size: 2, normalized: false },
  4: { array: Uint16Array, size: 2, normalized: false },
  7: { array: Int8Array, size: 1, normalized: false },
  8: { array: Uint8Array, size: 1, normalized: false },
  14: { array: Uint8Array, size: 1, normalized: true, components: 4 },
};

const GLSL_TYPE = n => ['float', 'float', 'vec2', 'vec3', 'vec4'][n];

function orderStructs(structs){
  const out = [], seen = new Set();
  const visit = name => {
    if (seen.has(name)) return;
    seen.add(name);
    for (const u of structs[name].uses) visit(u);
    out.push(name);
  };
  for (const name of Object.keys(structs)) visit(name);
  return out;
}

export function linkPrimitive(shaders, layoutName, features){
  const layout = shaders.layouts[layoutName];
  if (!layout) throw new Error('primshader: no input layout ' + layoutName);
  const resolve = name => {
    const v = features[name];
    if (v && !shaders.functions[v]) throw new Error('primshader: variant ' + v + ' of ' + name + ' is not exported');
    return v || name;
  };
  // functions reachable from an entry, callees first, with interface calls sent to the selection
  const emitted = new Set();
  const order = [];
  const visit = name => {
    if (emitted.has(name)) return;
    emitted.add(name);
    const fn = shaders.functions[name];
    if (!fn) throw new Error('primshader: function ' + name + ' is not exported');
    let text = fn.glsl;
    for (const callee of fn.calls){
      const target = resolve(callee);
      visit(target);
      if (target !== callee) text = text.replace(new RegExp('\\b' + callee + '\\(', 'g'), target + '(');
    }
    order.push(text);
  };
  const body = entry => { emitted.clear(); order.length = 0; visit(entry); return order.join('\n'); };
  const vsFunctions = body('VS_Primitive');
  const fsFunctions = body('PS_Primitive');

  const structs = orderStructs(shaders.structs).map(n => shaders.structs[n].glsl).join('\n');
  const uniforms = text => {
    const lines = [];
    for (const [cb, members] of Object.entries(shaders.cbs)){
      for (const [name, type] of members){
        if (new RegExp('\\b' + cb + '_' + name + '\\b').test(text)) lines.push('uniform ' + type + ' ' + cb + '_' + name + ';');
      }
    }
    for (const t of shaders.textures) if (new RegExp('\\b' + t + '\\b').test(text)) lines.push('uniform sampler2D ' + t + ';');
    return lines.join('\n');
  };

  // vertex: attributes by semantic
  const input = shaders.structs.PRIMITIVE_VS_INPUT.members;
  const output = shaders.structs.PRIMITIVE_VS_OUTPUT.members;
  const attributes = [];
  const assign = [];
  for (const [semantic, offset, count, format] of layout.elements){
    const member = input.find(m => m[2] === semantic);
    if (!member) continue;
    const f = FORMATS[format];
    if (!f) throw new Error('primshader: element format ' + format + ' (' + semantic + ')');
    const components = f.components || count;
    const name = 'a_' + semantic;
    attributes.push({ name, semantic, offset, count: components, format });
    const want = member[1], have = GLSL_TYPE(components);
    assign.push('  I.' + member[0] + ' = ' + (want === have ? name : want + '(' + name + (want === 'float' ? '' : '') + ')') + ';');
  }
  const varying = [];         // [glsl type, varying name, output member path]
  for (const [name, type] of output){
    if (name === 'position') continue;
    const st = shaders.structs[type];
    if (st) for (const [mn, mt] of st.members) varying.push([mt, 'v_' + name + '_' + mn, name + '.' + mn]);
    else varying.push([type, 'v_' + name, name]);
  }
  const vertexShader = [
    'precision highp float;', 'precision highp int;',
    structs, uniforms(vsFunctions),
    attributes.map(a => 'in ' + GLSL_TYPE(a.count) + ' ' + a.name + ';').join('\n'),
    varying.map(([t, v]) => 'out ' + t + ' ' + v + ';').join('\n'),
    vsFunctions,
    'void main() {',
    '  PRIMITIVE_VS_INPUT I = zero_PRIMITIVE_VS_INPUT();',
    assign.join('\n'),
    '  PRIMITIVE_VS_OUTPUT O = VS_Primitive(I);',
    '  gl_Position = vec4(O.position.xy, 2.0 * O.position.z - O.position.w, O.position.w);',
    varying.map(([, v, path]) => '  ' + v + ' = O.' + path + ';').join('\n'),
    '}',
  ].join('\n');

  // fragment: PS_Primitive's parameters by semantic
  const params = shaders.functions.PS_Primitive.params;
  const args = [];
  const prelude = [];
  for (const [type, name, semantic] of params){
    if (semantic === 'SV_POSITION'){ args.push('gl_FragCoord'); continue; }
    const member = output.find(m => m[2] === semantic);
    if (!member) throw new Error('primshader: no vertex output for ' + semantic);
    const st = shaders.structs[type];
    if (st){
      prelude.push('  ' + type + ' ' + name + ' = ' + type + '(' + st.members.map(([mn]) => 'v_' + member[0] + '_' + mn).join(', ') + ');');
      args.push(name);
    } else args.push('v_' + member[0]);
  }
  const fragmentShader = [
    'precision highp float;', 'precision highp int;',
    structs, uniforms(fsFunctions),
    varying.map(([t, v]) => 'in ' + t + ' ' + v + ';').join('\n'),
    'out highp vec4 fragColor;',
    fsFunctions,
    // the viewer's canvas is sRGB-encoded at output (renderer.outputColorSpace, render/stage.js) and a
    // raw shader is not given three.js's encode, so it is applied here: the same transfer every other
    // material in the viewer gets, not a step of the ROM's program
    'vec3 viewerOutputEncode(vec3 c) { return mix(pow(c, vec3(0.41666)) * 1.055 - vec3(0.055), c * 12.92, vec3(lessThanEqual(c, vec3(0.0031308)))); }',
    'void main() {',
    prelude.join('\n'),
    '  vec4 c = PS_Primitive(' + args.join(', ') + ');',
    '  fragColor = vec4(viewerOutputEncode(max(c.rgb, vec3(0.0))), c.a);',
    '}',
  ].join('\n');
  return { vertexShader, fragmentShader, attributes, stride: layout.stride };
}

// The draw's constant buffers as uniform values: a member's words in stored order (a matrix's 16 as a
// GLSL mat4 filled column by column, which makes GLSL's column i the stored row i).
export function cbUniforms(shaders, cb){
  const out = {};
  const f32 = new Float32Array(1), u32 = new Uint32Array(f32.buffer);
  const floatOf = w => { u32[0] = w >>> 0; return f32[0]; };
  for (const [name, words] of Object.entries(cb)){
    const members = shaders.cbs[name];
    if (!members) continue;
    for (const [member, type, offset, count] of members){
      const v = [];
      for (let i = 0; i < count; i++) v.push(floatOf(words[offset + i]));
      out[name + '_' + member] = { type, value: v };
    }
  }
  return out;
}
