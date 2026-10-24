const m = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js');
const arcs = {
  em002_04: ['01'], em003_00: ['01'], em004_00: ['00', '02'], em005_00: ['02', '13'], em008_00: ['00'], em020_04: ['02'],
  em021_00: ['04'], em024_00: ['00'], em025_00: ['39'], em032_00: ['00'], em032_04: ['00'], em038_00: ['00', '02'],
  em043_00: ['00', '54'], em043_05: ['00', '54'], em045_00: ['01', '32'], em045_04: ['32'], em050_00: ['41'], em057_04: ['01'],
  em058_00: ['01', '30'], em061_00: ['19'], em061_04: ['19'], em067_00: ['13'], em068_00: ['36'], em077_00: ['28'],
  em079_00: ['40'], em080_00: ['00', '03'], em080_04: ['00'], em082_00: ['12'], em082_04: ['12'], em084_00: ['02'],
  em086_00: ['00'], em087_00: ['58'], em088_00: ['57', '58', '60'], ems007_00: ['00'], ems026_00: ['00'] };
const rows = [];
for (const [mon, shells] of Object.entries(arcs)){
  const D = m.SHELL_DATA[mon];
  for (const n of shells){
    const sh = D && D.shells && D.shells['shell' + n];
    rows.push(mon + ' shell' + n + ': ' + (!D ? 'no SHELL_DATA entry' : !sh ? 'shell not in SHELL_DATA' : sh.cmn ? 'cmn carried' : 'IN SHELL_DATA, NO cmn'));
  }
}
console.log(rows.join('\n'));
