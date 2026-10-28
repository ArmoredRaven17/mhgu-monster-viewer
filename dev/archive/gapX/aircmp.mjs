// aircmp.mjs: every AIR_HEIGHT monster but Alatreon -- airLift with the copy-key lookup (live) against the same file with the old lookup
// (gapX/cmp/motion-states.js): each row's clip, its _loop and '#B' forms (the old lookup given the bare clip), frames 0 / 10 / 40 / 90,
// the air test both ways, size 1.1; plus two clips with no row on each. Any difference is printed.
const N = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/motion-states.js');
const O = await import('file:///C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/gapX/cmp/motion-states.js');
let n = 0, diff = 0;
for (const [mon, t] of Object.entries(N.AIR_HEIGHT)){
  if (mon === 'em050_00') continue;
  const keys = Object.keys(t.clips || {}).concat(['0|Motion[1]', '2|Motion[3]']);
  for (const k of keys){
    const [l, c] = k.split('|');
    for (const suf of ['', '_loop', '#B', '_loop#B']) for (const fr of [0, 10, 40, 90]) for (const air of [true, false]){
      n++;
      const a = JSON.stringify(N.airLift(mon, l, c + suf, fr, 1.1, 1, air)), b = JSON.stringify(O.airLift(mon, l, c + suf.replace('#B', ''), fr, 1.1, 1, air));
      if (a !== b){ diff++; if (diff < 10) console.log('DIFF', mon, k, suf, fr, air, a, b); }
    }
  }
}
console.log('compared', n, 'diffs', diff);
