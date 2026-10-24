const a = (await import(new URL('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/beam-types.js').href)).BEAM_TYPES;
const b = (await import(new URL('file:///' + process.argv[2]).href)).BEAM_TYPES;
let diff = 0;
for (let i = 0; i < Math.max(a.length, b.length); i++){
  const x = { ...b[i] }; delete x.child;
  if (JSON.stringify(a[i]) !== JSON.stringify(x)){ diff++; console.log('DIFF', i, JSON.stringify(a[i]), JSON.stringify(x)); }
}
console.log('types', a.length, b.length, 'differences apart from child:', diff, 'with child:', b.filter(t => t.child).map(t => t.id).join(' '));
for (const t of b) if (t.child) console.log(t.id, Object.entries(t.child.modes).map(([m, v]) => m + ':' + v.scale).join(' '));
