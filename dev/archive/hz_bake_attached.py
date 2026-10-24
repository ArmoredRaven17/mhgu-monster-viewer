
# ---- ATTACHED BODIES: Nakarkos's tentacles, baked against their OWN table -----------------------------------------
# Raven, 2026-10-08: "add the capsule data to the viewer", then "once we know what zones they belong to, then we can
# show them in detail". READ (dev/em084-arm-hitzones.md): each arm (uEmOstgaloaArm) loads its OWN rBodyData
# (em084_00_arm_left / _right_bodydata, 16 capsules) and its OWN damage table -- res 0x8390 / 0x8391 =
# enemy\dt_tune\ems099_00_dttune (+ dtbase), loaded at 0x107bfb4 -- a file shipped in em084_00.arc under ANOTHER
# monster's id. The hit test 0x16bc54 runs on the arm as a unit of its own and every damage handler takes the struck
# unit's own row (0xbaaa4); the arm then takes no HP itself (arm+0x7648 = 1) and the body copies the hit into body
# part 1 (left arm, body+0xcc00) or part 0 (right arm, body+0x19750) and his HP (0x1066048 -> 0x106cdd4).
# Table 0 sits at 0x8c + header byte 8 (0x57684: a 0x38-byte header, a u32, 0x50 bytes of part records, then byte 8
# bytes of preamble); a second table only when byte 0x12 is 0. ems099_00: byte 8 = 2, byte 0x12 = 1 -> one table at 0x8e.
ATTACHED = {
    # body em -> {model: (bdd file stem, damage-table stem, the body part the hit is copied into)}
    "em084_00": {"em084_00_left": ("em084_00_arm_left", "ems099_00", 1),
                 "em084_00_right": ("em084_00_arm_right", "ems099_00", 0)},
}
ATTACHED_NAMES = {0: "Tentacle Tip", 1: "Tentacle Middle", 2: "Tentacle Base"}


def read_dtt_tables(stem):
    """[table][slot] -> {type: value} at the loader's own offset (0x57684), or None."""
    p = os.path.join(RAW, stem + "_dttune.dtt")
    if not os.path.isfile(p): return None
    d = open(p, "rb").read()
    if d[:4] != b"DTT" + bytes([0]): return None
    base, nblocks = 0x8c + d[8], (2 if d[0x12] == 0 else 1)
    return [[dict(zip(TYPES, struct.unpack_from("<10B", d, base + b * 80 + sl * 10))) for sl in range(8)]
            for b in range(nblocks)]


def bake_attached(em, write=True):
    """{model: entry} for em's attached bodies: their capsules, their own table, and the per-vertex bake as
    <model>.bin (the body's .bin format). Skips a model whose glb, bdd or table is missing."""
    out = {}
    for model, (bdd_stem, dtt_stem, body_part) in ATTACHED.get(em, {}).items():
        glb = os.path.join(MODELS, model + ".glb")
        caps_raw = read_bdd(bdd_stem)
        tables = read_dtt_tables(dtt_stem)
        if not (caps_raw and tables and os.path.isfile(glb)): continue
        js, bin_ = glb_split(glb)
        world = node_world_all(js)
        M, spread = bind_matrix(js, bin_, world)
        bw = bone_world(js, world)
        caps = []
        for rec in caps_raw:
            if rec["flags"] & (0x152 | 0x8000): continue          # the body's rules: never counted / conditional
            c = capsule_world(rec, bw)
            if c is None: continue
            caps.append((c[0], c[1], c[2], rec["slot"], rec["part"], rec["a"], rec["b"] if rec["shape"] == 2 else rec["a"]))
        joint_gid = []
        for nd in js["skins"][0]["joints"]:
            mg = re.match(r"^(\d+):(\d+)", js["nodes"][nd].get("name", "") or "")
            joint_gid.append(int(mg.group(2)) if mg else -1)
        joint_gid = np.array(joint_gid)
        prim_counts, blobs, pblobs, n = [], [], [], 0
        for me in js.get("meshes", []):
            for pr in me["primitives"]:
                a = js["accessors"][pr["attributes"]["POSITION"]]
                raw = acc_raw(js, bin_, pr["attributes"]["POSITION"]).astype(np.float64)
                if a.get("normalized"): raw = raw / 32767.0
                P = (M @ np.hstack([raw, np.ones((len(raw), 1))]).T).T[:, :3]
                dom = None
                if "JOINTS_0" in pr["attributes"] and "WEIGHTS_0" in pr["attributes"]:
                    J = acc_raw(js, bin_, pr["attributes"]["JOINTS_0"]).astype(np.int64)
                    Wt = acc_raw(js, bin_, pr["attributes"]["WEIGHTS_0"]).astype(np.float64)
                    dom = joint_gid[J[np.arange(len(J)), np.argmax(Wt, axis=1)]]
                sl, pt, dist = nearest_slot(P, caps, dom)
                prim_counts.append((n, len(P)))
                blobs.append(sl.tobytes()); pblobs.append(pt.tobytes())
                n += 1
        blob = struct.pack("<I", len(prim_counts))
        for _, c in prim_counts: blob += struct.pack("<I", c)
        blob += b"".join(blobs) + b"".join(pblobs)
        used = sorted({int(b) for s in blobs for b in s})
        defined = sorted({rec["slot"] for rec in caps_raw if rec["slot"] < len(tables[0])})
        out[model] = {
            "source": "enemy/body_data/" + bdd_stem + "_bodydata",
            "dtt": "enemy/dt_tune/" + dtt_stem + "_dttune",
            "bodyPart": body_part,
            "bin": "hitzones/%s.bin" % model,
            "prims": [p for p, _ in prim_counts],
            "tables": tables,
            "names": {str(k): v for k, v in ATTACHED_NAMES.items() if k in defined},
            "slotsUsed": used,
            "slotsDefined": defined,
            "capsules": [[rec["slot"], rec["part"], rec["shape"], rec["a"], rec["b"], game_units(rec["r"])]
                         + [game_units(x) for x in rec["pa"]] + [game_units(x) for x in rec["pb"]] for rec in caps_raw],
            "capsuleFlags": [rec["flags"] for rec in caps_raw],
        }
        if write:
            open(os.path.join(OUTDIR, model + ".bin"), "wb").write(blob)
    return out
