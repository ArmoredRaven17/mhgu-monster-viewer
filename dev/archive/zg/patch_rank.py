# patch_rank.py: the Quest Rank / Quest Level controls and Chaotic Gore's gauge (effects lane, 2026-10-20; Raven approved)
import io, os, re
R = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
def patch(P, reps, regex=()):
    t = io.open(P, encoding='utf8', newline='').read()
    nl = '\r\n' if t.count('\r\n') > t.count('\n') / 2 else '\n'
    for a, b in reps:
        a2, b2 = a.replace('\n', nl), b.replace('\n', nl)
        assert t.count(a2) == 1, (P, a[:70], t.count(a2))
        t = t.replace(a2, b2)
    for pat, rep, n in regex:
        t, k = re.subn(pat, rep, t)
        assert k == n, (P, pat, k)
    io.open(P, 'w', encoding='utf8', newline='').write(t)

IDX = os.path.join(R, 'index.html')
patch(IDX, [
# 1. the two selects, under the Ground
("""            <label for="monGroundType">Ground</label>
            <select id="monGroundType"></select></div>""",
 """            <label for="monGroundType">Ground</label>
            <select id="monGroundType"></select></div>
          <!-- THE QUEST (Raven, 2026-10-20: approved): the rank 0x3a8430 returns -- [[quest+0xa4]+0xf] as a signed byte: 5 / 3 / 1, anything
               else 0 -- and the quest's number 0x3a8470 (0x3b8eb4 for an ordinary quest; 0 or 0x10 for the special ids). Every rank or
               level test the viewer transcribes reads these (the shells, the beams, the PSL words, the low-rank break rows, Thunderlord's
               puff). Default G / 10, as the viewer has always run. WORKING labels. A change replays the clip. -->
          <div class="field" id="monQuestRankRow" title="The quest rank the monster's code reads (0x3a8430: 5 / 3 / 1, else 0). Working names.">
            <label for="monQuestRank">Quest Rank</label>
            <select id="monQuestRank"></select></div>
          <div class="field" id="monQuestLevelRow" title="The quest's number the monster's code reads (0x3a8470: 0x3b8eb4 for an ordinary quest; 0 / 16 for the special ones). Working names.">
            <label for="monQuestLevel">Quest Level</label>
            <select id="monQuestLevel"></select></div>"""),
# 2. the constants become the controls
("""const SHELL_QUEST_LEVEL = 10;""",
 """const QUEST_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 16];
function shellQuestLevel(){ return QUEST_LEVELS.includes(state.questLevel) ? state.questLevel : 10; }"""),
("""const SHELL_QUEST_RANK = 5;""",
 """// (the Quest Rank control, 2026-10-20: was the constant 5)
const QUEST_RANKS = [[5, 'G Rank (5)'], [3, 'High Rank (3)'], [1, 'Low Rank (1)'], [0, 'Rank 0 (none)']];
function shellQuestRank(){ return QUEST_RANKS.some(([v]) => v === state.questRank) ? state.questRank : 5; }
// Chaotic Gore Magala's counter C+0x84, the steps its readers test (the tier table 0x16a1294: 5000 / 10000 / 20000 at every rank class)
const GAUGE071_STEPS = [0, 5000, 10000, 20000];
{
  const rs = document.getElementById('monQuestRank'), ls = document.getElementById('monQuestLevel');
  if (rs){
    rs.innerHTML = QUEST_RANKS.map(([v, l]) => '<option value="' + v + '">' + l + '</option>').join('');
    rs.value = String(shellQuestRank());
    rs.onchange = () => { state.questRank = +rs.value; play(); };
  }
  if (ls){
    ls.innerHTML = QUEST_LEVELS.map(v => '<option value="' + v + '">Level ' + v + (v === 16 ? ' (special)' : v === 0 ? ' (special / none)' : '') + '</option>').join('');
    ls.value = String(shellQuestLevel());
    ls.onchange = () => { state.questLevel = +ls.value; play(); };
  }
}
window.__quest = { set: (rank, level) => { if (rank != null) state.questRank = rank; if (level != null) state.questLevel = level;
                                          const rs = document.getElementById('monQuestRank'), ls = document.getElementById('monQuestLevel');
                                          if (rs) rs.value = String(shellQuestRank()); if (ls) ls.value = String(shellQuestLevel()); play(); },
                   now: () => ({ rank: shellQuestRank(), level: shellQuestLevel() }) };"""),
# 3. the shells' gauge (Chaotic Gore's C+0x84: CLASS_CONTROLS2 em071_05's step index)
("""           carry: state.id === 'em088_00' ? state.carry : undefined,""",
 """           carry: state.id === 'em088_00' ? state.carry : undefined,
           // Chaotic Gore Magala's control-block counter C+0x84 (the Gauge control, CLASS_CONTROLS2 em071_05: 0 / 5000 / 10000 / 20000)
           gauge071: state.id === 'em071_05' ? GAUGE071_STEPS[state.classCtl2 | 0] || 0 : undefined,"""),
# 4. the puff's user: the rank (Thunderlord's own puff at G, the shared one below)
("""    rt.puffGates(motionStates.puffOff(), motionStates.tired(), { rung: state.level | 0 });""",
 """    rt.puffGates(motionStates.puffOff(), motionStates.tired(), { rung: state.level | 0, rank: shellQuestRank() });"""),
# 5. the state driver's input: the rank and the level
("""  const userIn = { rage: !!state.rage, level: chargeRungOf(), tired: exhausted(), posture: plays.key ? plays.posture : undefined,""",
 """  const userIn = { rage: !!state.rage, level: chargeRungOf(), tired: exhausted(), posture: plays.key ? plays.posture : undefined,
                   rank: shellQuestRank(), questLevel: shellQuestLevel(),"""),
], regex=[(r'SHELL_QUEST_RANK(?! = )(?!, G\))', 'shellQuestRank()', 5), (r'SHELL_QUEST_LEVEL', 'shellQuestLevel()', 3)])
print('index ok')
