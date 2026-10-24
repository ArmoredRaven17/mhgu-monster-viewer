import fs from 'node:fs'; import { pathToFileURL } from 'node:url';
const mod = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/dev/checks/em082_00.mjs').href + '?' + Date.now());
const body = `const f = ${mod.pageCheck.toString()};
const res = [];
for (const a of ${JSON.stringify(mod.args)}) res.push(...await f(...a));
return { n: res.length, fail: res.filter(r => !r[0]) };`;
fs.writeFileSync(process.argv[2], body);
