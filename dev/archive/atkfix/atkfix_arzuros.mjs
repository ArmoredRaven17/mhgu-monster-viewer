// atkfix_arzuros.mjs: Arzuros / Redhelm's 13 arms whose ids (24..34) are past their 24-record table -- the page names them
// 'id past the table' and builds no shape for them (0x70f40 returns 0 for id >= count, 0x70f8c: the game arms nothing)
async function arz(){
  const out = [];
  const AH = await import('/render/attack-hitboxes.js');
  await AH.loadAttackData('');
  for (const mon of ['em060_00', 'em060_04']){
    const D = AH.attackDataFor(mon), n = D.records.length;
    let past = 0, named = 0, built = 0;
    for (const key of Object.keys(D.arms)){
      for (const a of AH.armedFor(mon, key, null)){
        if (a.id < 1000 && a.id >= n){ past++; if (/id past the table/.test(a.why || '')) named++; if (a.shapes) built++; }
      }
    }
    out.push([past === 13 && named === 13 && built === 0, mon + ': ids past the ' + n + '-record table named, no shape built', JSON.stringify({ past, named, built })]);
  }
  return out;
}
export const pageCheck = arz;
export const args = [];
