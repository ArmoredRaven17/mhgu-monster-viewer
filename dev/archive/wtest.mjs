const P = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/psl-mask.js');
for (const m of ['em066_00', 'em066_04']) for (const [n, a] of [[14, [7, 0xf7]], [14, [2, 0x54]], [15, [7, 0xf8]], [15, [2, 0x54]], [18, [1, 0x52]], [11, [1, 0x53]]])
  console.log(m, 'L4 M' + n, a.map(x => x.toString(16)).join(','), P.pslMask(m, '4', n, a, {}).toString(16));
