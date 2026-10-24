  } else if (b === 6){
    // behaviour 6, init 0x42f864..0x42f8d0 (READ, gapJ 2026-10-21; only Ahtal-Neset's 0x10ac10c asks it): +5 = 1; +0x173c = int 0
    // (+0x15e8: the OWNER's joint the object is carried to); int 0 == 255 -> vt+0x148(0), ended in its init; +0x16e0 = 1 / 60
    // (0x3c888889, the turn's rate); +0x1744 = 1 / float 0 (+0x15f4, the lift's rate); no launch. The start +0x16f0.. is the
    // placement's point (0x42f3ec); +0x1740 (the lift's t) and +0x16dc (the turn's) are the ctor's 0 (0x42f018 / 0x42ef24)
    if (k.joint === 255) return { why: 'shell57 behaviour 6: int 0 = 255 (0x42f878: vt+0x148(0) in the init)' };
    S.phase = 1;
    S.liftJoint = k.joint; S.liftT = f(0.0); S.liftRate = f(f(1.0) / k.fl[0]);
    S.from = S.position.slice();
    S.lerpRate = f(0.01666666753590107);
