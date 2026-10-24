const G = await import(new URL('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/beam-groups.js').href);
const T = (await import(new URL('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/beam-types.js').href)).BEAM_TYPES;
console.log(T.length, 'types;', T.filter(t => t.child).map(t => t.id).join(' '), '; notRead on', T.filter(t => t.notRead).length);
for (const g of G.BEAM_GROUPS) console.log(g.clip, g.ids.join(','));
