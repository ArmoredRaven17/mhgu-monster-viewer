"""The shared render modules, copied from the Armor Viewer and kept honest by a hash manifest.

    python dev/sync-render.py --check     # exit 1 if a copy was edited here, or is behind
    python dev/sync-render.py --pull      # copy from the Armor Viewer and record the hashes
    python dev/sync-render.py --pull --force   # ...even over a local edit (it is discarded)

Both apps load ES modules straight out of `docs/`, with no bundler and no build step, so at
RUNTIME these files have to be plain copies whatever the sharing scheme is. The manifest is what
stops a plain copy from drifting: `docs/render/SOURCE.json` records the Armor Viewer commit each
file came from and its sha256, so

  * a file edited HERE fails --check: the fix belongs upstream, in the Armor Viewer, where it is
    reviewed with the app that has always shipped it; then --pull brings it back;
  * a file changed UPSTREAM is listed by --check as behind, and --pull takes it.

One direction only. `monster.js` and `overlays.js` are this app's own and are never synced.
"""
import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
DEST = os.path.join(REPO, "docs", "render")
SRC = os.path.normpath(os.path.join(REPO, "..", "MHGU-Armor-Viewer", "docs", "render"))
MANIFEST = os.path.join(DEST, "SOURCE.json")

# Everything the monster viewer mounts a model with. Not taken: mount.js, mount-rom.js,
# weapon.js, weapons-index.js (the hunter's weapon rig), piece.js (only if the scale hunter
# lands -- add it here then, do not copy it by hand).
SHARED = ["stage.js", "assets.js", "skeleton.js", "material.js", "materials-db.js", "pose.js"]


def sha(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def upstream_commit():
    try:
        out = subprocess.run(["git", "-C", os.path.dirname(os.path.dirname(SRC)), "rev-parse", "HEAD"],
                             capture_output=True, text=True)
        return out.stdout.strip() or None
    except Exception:
        return None


def load():
    if os.path.isfile(MANIFEST):
        with open(MANIFEST, encoding="utf-8") as f:
            return json.load(f)
    return {"source": None, "commit": None, "files": {}}


def check(quiet=False):
    man = load()
    edited, behind, missing = [], [], []
    for name in SHARED:
        dst, src = os.path.join(DEST, name), os.path.join(SRC, name)
        if not os.path.isfile(dst):
            missing.append(name)
            continue
        rec = man["files"].get(name)
        here = sha(dst)
        if rec is None:
            missing.append(name + " (not in SOURCE.json)")
        elif here != rec:
            edited.append(name)
        if os.path.isfile(src) and sha(src) != here:
            behind.append(name)
    if not quiet:
        print("synced from %s @ %s" % (man.get("source"), (man.get("commit") or "?")[:8]))
        for n in missing:
            print("  MISSING  %s" % n)
        for n in edited:
            print("  EDITED HERE  %s  <- push the change to the Armor Viewer, then --pull" % n)
        for n in behind:
            print("  behind upstream  %s  <- --pull" % n)
        if not (missing or edited or behind):
            print("  %d files, all current" % len(SHARED))
    return 1 if (missing or edited) else 0


def pull(force=False):
    if not os.path.isdir(SRC):
        print("no Armor Viewer render folder at " + SRC)
        return 1
    man = load()
    if not force:
        for name in SHARED:
            dst = os.path.join(DEST, name)
            rec = man["files"].get(name)
            if os.path.isfile(dst) and rec and sha(dst) != rec:
                print("refusing to overwrite a local edit: %s (push it upstream, or --force)" % name)
                return 1
    os.makedirs(DEST, exist_ok=True)
    files = {}
    for name in SHARED:
        src = os.path.join(SRC, name)
        if not os.path.isfile(src):
            print("MISSING upstream: " + name)
            return 1
        shutil.copy2(src, os.path.join(DEST, name))
        files[name] = sha(src)
        print("  %-18s %s" % (name, files[name][:12]))
    out = {"source": "../../MHGU-Armor-Viewer/docs/render", "commit": upstream_commit(), "files": files}
    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=1)
    print("recorded %d files from %s" % (len(files), (out["commit"] or "?")[:8]))
    return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--pull", action="store_true")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    sys.exit(pull(a.force) if a.pull else check())
