import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const P = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/psl-mask.js').href);
for (const [mon, D] of Object.entries(S.SHELL_DATA)){
  const seen = new Set();
  for (const a of D.actions || []){
    for (const clip of [a.clip, ...(a.partners || [])]){
      const k = a.list + '|' + clip; if (seen.has(k)) continue; seen.add(k);
      if (!P.clipCopyActions(mon, a.list, clip, 'A')) continue;
      const picks = S.pickVariantsFor(mon, a.list, clip, {});
      const row = [];
      for (const v of ['A', 'B', 'C', 'D', 'E']){
        const ca = P.clipCopyActions(mon, a.list, clip, v);
        if (!ca || !ca.length) continue;
        row.push(v + ' ' + JSON.stringify(ca) + ' keeps ' + JSON.stringify(picks.filter(p => !P.actionOf(p) || ca.includes(P.actionName(P.actionOf(p))))));
      }
      console.log(mon, 'L' + a.list, clip, 'picks', JSON.stringify(picks), '\n   ', row.join('\n    '));
    }
  }
}
