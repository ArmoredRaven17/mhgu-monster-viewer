# MHGU Monster Viewer

A fan-made 3D viewer for the monsters of Monster Hunter Generations Ultimate. Pick a monster
and watch its own animations, with the game's own models, textures and part-visibility groups.

**Not published yet.** It is built and reviewed locally until it is good enough to deploy.

## What it does

- Every large and small monster in the game, from the game's own enemy archives
- The monster's own motion lists, clip by clip, with looping and frame-by-frame stepping
- The game's part-visibility groups, so an intact part can be swapped for its broken form
- Normal-mapped shading driven by the game's own material files
- True relative sizes, from the game's own size multiplier (a Deviant really is larger)

## Running it

No build step. Serve `docs/` with any static file server:

    python dev/serve.py 5586

## Contents

    docs/index.html        the app: markup, styles and logic
    docs/monsters.json     per monster: model, parts, visibility groups, motion lists, size
    docs/materials.json    what the game's own material files say about every material
    docs/models/monsters/  one glb per model (the monster, and its severed parts)
    docs/poses/monsters/   one glb per motion list, animations only
    docs/tex/              textures, deduplicated by content hash
    docs/render/           the render core; six modules are shared with the Armor Viewer
    dev/sync-render.py     pulls those six from the Armor Viewer and checks they are in step

The shared modules are plain copies, because both apps load ES modules with no build step.
`docs/render/SOURCE.json` records where each came from and its hash; `dev/sync-render.py
--check` fails if one was edited here (that fix belongs upstream) or is behind the Armor
Viewer. `render/monster.js` is this app's own and is never synced.

## Where the data comes from

`C:\MHGU-Extract\harvest-monsters.py` reads the game's `arc\enemy\*.arc` archives and writes
everything under `docs/`; `build-materials.py --monsters-only --repo MHGU-Monster-Viewer --fmt webp` builds the material database.
Neither the extract nor the game's files are part of this repository.

## Credits

See NOTICE.md, and the About dialog in the app.

Monster Hunter Generations Ultimate is © CAPCOM CO., LTD. This is an unofficial fan
project and is not affiliated with or endorsed by Capcom.
