# Notices and attribution

## Game content

Monster Hunter Generations Ultimate, and all of its models, textures, animations and data
tables, are © CAPCOM CO., LTD. All rights reserved.

This is an unofficial, non-commercial fan project. It is not affiliated with, endorsed by,
or supported by Capcom. All game assets were extracted from a personally owned copy of the
game and are shown for reference only.

## Tools used to build this

- **RevilLib / RevilToolset** — PredatorCZ (Lukas Cone).
  Unpacked the `.arc` archives and converted MT Framework `.mod` meshes to glTF, `.tex`
  textures to DDS, `.lmt` motion lists to animation, and the part-visibility tables to XML.
  https://github.com/PredatorCZ/RevilLib
- **hactool** — unpacked the game's romfs and executable from the cartridge image.
- **three.js** — rendering, `GLTFLoader`, `OrbitControls`, `SkeletonUtils`.
  https://threejs.org
- **Pillow** — texture conversion during the build. https://python-pillow.org
- **MHGU-Modding wiki** — RTHKKona and contributors, for documenting the model and texture
  extraction route this project followed. Ported there from GReinoso96 and Aradi147's
  XXModding. https://github.com/RTHKKona/MHGU-Modding/wiki

## Data

- Monster **names** come from the game's own carve tables (`enemy\hagi\*.hgi` joined to
  `itemData_eng.gmd`), cross-checked against the **MHGU Monster Info** project's verified
  name table, which is also where the names of the monsters whose carves name nothing come
  from. Part names do not exist anywhere in the game's files.
- Monster **icons** are the sibling MHGU fan apps' shared set.
- Everything else — models, textures, materials, animations, part-visibility groups, size
  multipliers — is read out of the game's own files.

## Assets

Monster icons, UI textures and the MHFU font are shared with the sibling MHGU fan apps
listed under *Other MHGU Apps*.

## Code

The six modules under `docs/render/` marked in `docs/render/SOURCE.json` are shared with the
**MHGU Armor Viewer** and are copies of that project's files.
