import os, shutil, json
S = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad'
A = r'C:\MHGU-RE\offline\decode\monster-viewer-scratch'
LIMIT = 20 * 1024 * 1024
SKIPDIRS = {'headtree', 'staged_tree'}  # repo snapshots: every blob verified present in the repo's git objects
copied, skipped, same = [], [], 0
for root, dirs, files in os.walk(S):
    rel_root = os.path.relpath(root, S)
    if rel_root == '.':
        dirs[:] = [d for d in dirs if d not in SKIPDIRS]
    for fn in files:
        src = os.path.join(root, fn)
        rel = os.path.relpath(src, S)
        sz = os.path.getsize(src)
        if sz > LIMIT:
            skipped.append((rel, sz)); continue
        dst = os.path.join(A, rel)
        if os.path.exists(dst) and os.path.getsize(dst) == sz and os.path.getmtime(dst) >= os.path.getmtime(src):
            same += 1; continue
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
        copied.append((rel, sz))
# empty dirs too (they record that a cited folder existed)
for root, dirs, files in os.walk(S):
    rel_root = os.path.relpath(root, S)
    if rel_root.split(os.sep)[0] in SKIPDIRS: continue
    os.makedirs(os.path.join(A, rel_root), exist_ok=True)
json.dump({'copied': copied, 'skipped': skipped, 'unchanged': same}, open(os.path.join(S, 'docaudit', 'copy_log.json'), 'w'), indent=0)
print('copied', len(copied), sum(s for _, s in copied) / 1048576, 'MB; unchanged', same)
for r, s in skipped: print('SKIP %.1fMB %s' % (s / 1048576, r))
