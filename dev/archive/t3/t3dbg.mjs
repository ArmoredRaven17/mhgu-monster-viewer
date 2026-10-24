import fs from 'fs';
const cases = JSON.parse(fs.readFileSync(new URL('./t3rand.json', import.meta.url)));
const sub=(a,b)=>a.map((v,i)=>v-b[i]), add=(a,b)=>a.map((v,i)=>v+b[i]), mul=(a,k)=>a.map(v=>v*k), dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2], len=a=>Math.sqrt(dot(a,a));
for (const c of cases){ if (!c.meets) continue;
  const [p0,p1,R]=c.A, [h0,h1,r]=c.B, ax=sub(p1,p0), L=len(ax), u=mul(ax,1/L), d=sub(h1,h0);
  // hunter axis point nearest the ROM point
  const t=Math.max(0,Math.min(1,dot(sub(c.point,h0),d)/dot(d,d))), X=add(h0,mul(d,t));
  const off=sub(c.point,X), v=sub(X,p0), hh=dot(v,u), rho=len(sub(v,mul(u,hh)));
  console.log('t',t.toFixed(3),'|point-X|',len(off).toFixed(2),'r',r.toFixed(2),'h/L',(hh/L).toFixed(3),'rho/R',(rho/R).toFixed(3),'n.u',(dot(off,u)/len(off)).toFixed(3));
}
