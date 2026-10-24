    if os.environ.get('INJECT_ANTIPARALLEL'):
        # INJECT_ANTIPARALLEL=<n> (Raven, 2026-10-08: "Replay with set inputs"): the rotate-onto-axis in 0xa692a0 takes its
        # ANTI-PARALLEL arm (0xa6980c..0xa698d8) only when a particle's world direction lies within ~2.6 degrees of minus
        # the axis -- a chance a recording rarely meets (Bloodbath's L9 M27 refusal). The ROM's own code is run on a chosen
        # INPUT: at 0xa697f0 the axis U = (s24, s22, s20) each emitter (r5) uses is learnt; on that emitter's later calls,
        # at 0xa69400 (r1 = [fp+8], the particle's direction, just loaded and not yet read) v = -U . M^-1 is written there,
        # M the effect's rows [r8+0x18] +0x00 / +0x10 / +0x20 (A = v . M at 0xa69410..0xa69458), so A = -U and the dot is -1.
        # The write is the input the call then READS, so the recorded vector's inputs and its path agree. n calls are
        # injected; every other call runs untouched.
        import numpy as _np
        from unicorn import UC_HOOK_CODE as _HC
        from unicorn.arm_const import UC_ARM_REG_R1 as _R1, UC_ARM_REG_R5 as _R5, UC_ARM_REG_R8 as _R8
        from unicorn.arm_const import UC_ARM_REG_S20 as _S20, UC_ARM_REG_S22 as _S22, UC_ARM_REG_S24 as _S24
        _left = [int(os.environ['INJECT_ANTIPARALLEL'])]
        _axis = {}
        _f32 = lambda bits: struct.unpack('<f', struct.pack('<I', bits & 0xFFFFFFFF))[0]
        def _learn(u, a, sz, ud):
            _axis[u.reg_read(_R5)] = _np.array([_f32(u.reg_read(r)) for r in (_S24, _S22, _S20)], dtype=_np.float64)
        def _inject(u, a, sz, ud):
            U = _axis.get(u.reg_read(_R5))
            if U is None or _left[0] <= 0:
                return
            mp = struct.unpack('<I', bytes(u.mem_read(u.reg_read(_R8) + 0x18, 4)))[0]
            M = _np.array([struct.unpack('<3f', bytes(u.mem_read(mp + 0x10 * k, 12))) for k in range(3)], dtype=_np.float64)
            try:
                v = -U @ _np.linalg.inv(M)
            except _np.linalg.LinAlgError:
                return
            u.mem_write(u.reg_read(_R1), struct.pack('<3f', *v))
            _left[0] -= 1
            print('INJECT antiparallel at frame %s: emitter %#x, axis %s, v %s' % (state.get('frame'), u.reg_read(_R5), U, v), file=sys.stderr)
        x.e.uc.hook_add(_HC, _learn, begin=0xa697f0, end=0xa697f0)
        x.e.uc.hook_add(_HC, _inject, begin=0xa69400, end=0xa69400)
