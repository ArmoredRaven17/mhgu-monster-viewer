const baseMask = ({ rage = false, tired = false } = {}) => 0x3f | (rage ? 0xe00 : tired ? 0x7000 : 0x1c0);
const EM001_TAIL = new Set([0x406, 0x432, 0x434, 0x437, 0x441, 0x902, 0x906]);
const em001 = (variant, id, thr) => (motion, action, state) => {
  const n = action && action[0] === 1 ? action[1] : -1;
  const tail = () => {
    if (state.severed) return 0xe00000;
    if (variant !== 4) return 0x38000;
    if ((state.breakLevel7 | 0) >= ((state.rank | 0) <= 4 ? thr[0] : thr[1])) return 0x1c0000;
    return ((state.questLevel | 0) >>> 0) <= 5 ? 0x1c0000 : 0x38000;
  };
  if (motion === 0x010 || motion === 0x011) return n === 7 || n === 8 ? 0xc0000 : 0;
  if (motion === 0x203 || motion === 0x204) return tail();
  if (motion === 0x201) return (id === 0x201 || id === 0x202 || id === 0x401) && !state.tired ? 0x7000000 : 0;
  if (EM001_TAIL.has(motion)) return motion === 0x441 && state.severed ? { set: 0xe00000, clear: 0x2 } : tail();
  if (motion === 0x426) return action && action[0] === 7 && action[1] === 0xf5 ? { set: 0xc0000000, clear: 0x1fc0 } : 0;
  return 0;
};
const F = { 0: em001(0, 0x001, [2, 2]), 2: em001(2, 0x201, [2, 2]), 4: em001(4, 0x401, [2, 2]) };
const cases = JSON.parse(require('fs').readFileSync(0, 'utf8'));
console.log(JSON.stringify(cases.map(([v, m, s, n, sev, rage, tired, lvl7, ql, rank]) => {
  const st = { rage: !!rage, tired: !!tired, severed: !!sev, breakLevel7: lvl7, questLevel: ql, rank };
  const r = F[v](m, [s, n], st);
  return (typeof r === 'object' ? ((baseMask(st) | r.set) & ~r.clear) : (baseMask(st) | r)) >>> 0;
})));
