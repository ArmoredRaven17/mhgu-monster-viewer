const m = await import(new URL('file:///' + process.argv[2]).href);
for (const [i, t] of m.BEAM_TYPES.entries()) if (t.child) console.log(i, t.id, JSON.stringify(t.child).slice(0, 900));
console.log(m.BEAM_TYPES.length);
