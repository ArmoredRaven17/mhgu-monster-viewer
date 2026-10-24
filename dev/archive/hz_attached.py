        # AN ATTACHED BODY'S OWN CAPSULES (Nakarkos's tentacles: <em>_arm_left / _arm_right_bodydata.bdd, 16 each).
        # Raven, 2026-10-08: "add the capsule data to the viewer". Carried UNBAKED and joined to no damage row: the arc
        # has no arm damage table, and which table their slots index is not read (dev/rom-map.md "Nakarkos -- the
        # tentacles' hit zones"). The viewer draws them by slot on the attached model (index.html attachedZoneCapsules).
        arm_att = {}
        for ap in sorted(glob.glob(os.path.join(RAW, em + "_arm_*_bodydata.bdd"))):
            side = os.path.basename(ap)[len(em) + len("_arm_"):-len("_bodydata.bdd")]
            d = open(ap, "rb").read()
            body = d[16:]
            if len(body) % 44: continue
            a_caps, a_flags = [], []
            for i in range(len(body) // 44):
                h = struct.unpack_from("<8H", body, i * 44)
                if h[0] == 0xFFFF: continue
                f = struct.unpack_from("<7f", body, i * 44 + 16)
                a_caps.append([h[3], h[4], h[2], h[0], h[1], game_units(f[0])]
                              + [game_units(x) for x in f[1:4]] + [game_units(x) for x in f[4:7]])
                a_flags.append(h[5])
            arm_att[em + "_" + side] = {"source": "enemy/body_data/" + em + "_arm_" + side + "_bodydata",
                                        "capsules": a_caps, "capsuleFlags": a_flags}
        if arm_att:
            out["monsters"][em]["attached"] = arm_att
