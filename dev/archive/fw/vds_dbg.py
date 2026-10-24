"""Call vectors for the effect DRAW with SEVERAL EFFECTS in one frame (the viewer's host.drawFrame: one
primitive layer, every live effect drawn into it). What a single effect's draw never reaches -- a texture
set already registered this frame by an earlier effect, so the later draw REUSES it (0x889004 -> 0x889054) --
overlapping effects do. Built on a schedule (vecschedule): the requests start on their frames, and every
frame after the unit passes, all their live effects are drawn together.

    python vecdrawsched.py <name> <frames> <scale> <frame>:<file.efl>:<pel:key>[:<array>] [<frame>:stop:<n>] ...
                           [<from>[-<to>]:psl:<n>:<bits>] ...

A `psl` item gives request n the PSL walker's per-bit STATE WORD the game's rise hands every effect it starts
(core +0x194, 0x31ca14) and ORs `bits` into it on frames from..to: 1 bit held, 2 bit off (mNoticeSequenceBitOff),
4 motion change, 8 frame backwards. Each frame the word first loses its notices (& 0xfff0, 0x31ca7c), as the
walker's update does ahead of the effects'.
"""
import sys, os, io, json, struct, contextlib
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import vectors as V
import efx_draw
from parent import Parent
import proofunit

name, frames, scale = sys.argv[1], int(sys.argv[2]), float(sys.argv[3])
STARTS, STOPS, PSL = [], [], []
GONE = set()            # <frame>:gone -- the shell parent deleted this move (its handles answer 0: proofunit HANDLE_VALID)
for a in sys.argv[4:]:
    f, rest = a.split(':', 1)
    if rest.startswith('stop:'):
        # <frame>:stop:<n>[:<flag>] -- 0x329c40(h, flag): 0 the graceful stop (every end), 1 the one base01's 0x20 switch
        # makes of its other handles (0x3fb3a4; dev/em084-phase2-bases.md, 2026-10-06)
        sp = rest[5:].split(':')
        STOPS.append((int(f), int(sp[0]), int(sp[1]) if len(sp) > 1 else 0)); continue
    if rest == 'gone':
        GONE.add(int(f)); continue
    if rest.startswith('psl:'):
        n, bits = rest[4:].split(':')
        lo, hi = (f.split('-') + [f])[:2]
        PSL.append((int(lo), int(hi), int(n), int(bits, 0))); continue
    parts = rest.rsplit(':', 3)                       # <file.efl>:<pel>:<key>[:<array>] (proof.record's spec)
    if parts[-1].upper() in ('UNIQUE', 'SEQUENCE', 'RULED'):
        efl, spec = parts[0], ':'.join(parts[1:])
    else:
        efl, spec = rest.rsplit(':', 2)[0], ':'.join(rest.rsplit(':', 2)[1:])
    STARTS.append((int(f), efl, spec))
path = STARTS[0][1]
# SHELL_PLAN=<file.json>: requests started the way a SHELL starts its effect (proofunit.Request requester=) and
# placed every frame by the shell's move (0x329c9c / 0x329d04, between the update and the move pass):
#   {"parentJoints": [], "parentScale": 1.0, "parentPosition": [x, y, z],
#    "requests": {"<n>": {"position": [..], "rotation": [..], "scale": [..]}},
#    "place": {"<n>": [[frame, [x, y, z], [rx, ry, rz]], ...]},
#    "parentPoses": {"<frame>": {"position": [x, y, z], "angles": [u32, u32, u32]}}}   (a rock: the shell parent's pose,
#    set between the passes each frame -- parent.set_angles; a request's "rotation": null sets no override)
# Request n is then started between the passes of its frame (the shell's init runs in the enemy's move), hung from a
# stand-in shell parent with the plan's joints (none: a shell's model interface).
SHELL_PLAN = json.load(open(os.environ['SHELL_PLAN'])) if os.environ.get('SHELL_PLAN') else None
# REQUESTER_JSON='{"rootJoint": 0, "colour": 4278724183}': overrides written into EVERY spec request's block
# (proofunit.Request requester=), a player weapon's requester shape -- the Switch Axe's sword aura, 0x11a40f4,
# which names no position (the Armor Viewer, 2026-09-28).
REQUESTER = json.loads(os.environ['REQUESTER_JSON']) if os.environ.get('REQUESTER_JSON') else None

# the draw FNS vecdraw records (copied, not imported: vecdraw parses argv on import)
# The STOP chain as well as the draw: this script is the only recorder that stops a request (0x329c40 at
# the scheduled frame), and without these in FNS the stop runs but nothing records its blocks -- so the
# viewer's stopClip walks into unrecorded code (0x327ea8 -> 0x327ed8, Bloodbath 2026-09-20).
STOP_FNS = [0x329c40, 0x329874, 0x44ab0, 0x327e7c, 0x3295fc, 0x329b00, 0x329d88]
# The genType-2 generator's own vtable slots (vtable 0x183c984 + 8). Reached only by blx, no push
# prologue, never a bl target -- so nothing names them automatically and their draw/init never records.
# Same hand-naming as vecproofunit.py. Bloodbath's em007_04_006/_008 are genType 2 (Raven 2026-09-20).
# Lifted but NOT named by the draw FNS above, so their blocks never record and the viewer falls into
# unrecorded code inside them (0xab53a4 / 0xa693f8, Bloodbath 2026-09-20).
MORE_DRAW_FNS = [0xab5090, 0xab4f64, 0xa692a0, 0xa654a0]
# genType 2's own vtable slots, CORRECTED 2026-09-20: the class the ROM's factory builds for a type-2
# row is vtable 0x1789834 (GOT 0x183c960), not 0x17899e4 -- the 0xaa7xxx entries the old list named
# belong to a sibling class no run ever calls. +0x54 0xa996c8 is the generator's DRAW slot, which is
# why it shows up here and not in the request recorder.
GT2_FNS = [0xa99524, 0xa99528, 0xaa8978, 0xa99558, 0xa99590, 0xa56d14,
           0xa99690, 0xa996b0, 0xa996c8, 0xa9cfc4, 0xa9d630]
# and what the type-2 DRAW slot 0xa996c8 reaches (liftclosure.py over its own recorded blocks): the draw
# body 0xa9dd14, the shared 0x889100, and the two entries its blocks enter through pointers.
GT2_FNS += [0x889100, 0xa9dd14, 0x9b3b48, 0xa996e4]
FNS = [0x9b75e8, 0x9b4744, 0xa58590, 0xae9b80, 0xae9bc4, 0xa54f4c, 0xbab558, 0xbac690, 0xc8cdb0,
       0xa92710, 0xa9272c, 0xa718b8, 0xb8f014, 0xa97f78, 0x87f6ac, 0xa54e84, 0xcac004, 0xafa464,
       0xafaf04, 0xaf9d20, 0xa6a3ec, 0x29d00, 0x1ebe8, 0x320ed4,
       0xa785b8, 0xa785f8, 0xaec21c, 0xa71954, 0xa7b250, 0xa7b7a0, 0x8a2e58, 0x889004, 0xafd310,
       0xaaec24, 0xaaed5c, 0xab5d0c, 0xab5530, 0xab65a4, 0xa71bd4, 0xa71cb4, 0xa72004, 0xa7276c]
# EVERY function the viewer LIFTS, so the two lists cannot drift apart. A function that is lifted but
# not recorded here produces 'falls into unrecorded code' INSIDE a translated function the moment the
# viewer's draw reaches a block no recording covered -- which is how 0xab53a4, 0xa693f8 and 0xa97ac4
# were each found separately (Bloodbath 2026-09-20). Reading lift-effects.sh keeps them in sync by
# construction rather than by anyone remembering.
import re as _re
_lift = open(r'C:\MHGU-Extract\efx\lift-effects.sh').read()
# THE LIFT LINES ONLY, NEVER THE COMMENTS. An address a comment mentions is not a routine the viewer lifts, and when it
# is a block INSIDE one it is poison: the recorder opens a call frame at any watched address it enters (vectors.record
# on_block), a mid-function block's frame can never close -- its lr and sp are the enclosing function's after that
# function's push, so no return matches them -- and it sits on top of every frame beneath it, which then never close
# either and are dropped at the frame's end (stack.clear()). The note on unit00500k241pass2 names 0x327eac, the block
# after 0x327ea8's bne inside the unit end 0x327e7c, so from that note on EVERY stop of a running unit went unrecorded
# -- 0x329c40, 0x329874, 0x44ab0 and 0x327e7c all at 0 calls -- silently: the sets recorded, lifted and played, and it
# showed only when the viewer reached an arm no older set had (0x327f1c, Plesioth's beam u 30 in Basarios's Beam
# Test, 2026-09-30). The same note's 0x7c36d8 (0x7c3638's gimbal arm) did the same to the calls around it.
_lift_code = '\n'.join(_re.sub(r'(^|\s)#.*$', '', _l) for _l in _lift.splitlines())
LIFTED_FNS = [int(x, 16) for x in _re.findall(r'0x[0-9a-f]{4,7}', _lift_code)]
# and the Armor Viewer's own roots (lift-w08.sh `EXTRA_<layer>="0x..."`, 2026-09-29): functions its player recordings enter
# that lift-effects.sh does not name -- 0x7c3704, the order-1 joint-to-angles routine the Sword & Shield's Arts record
# 809 turns itself through. Without them here the lift finds no recorded blocks for them.
_w08 = r'C:\MHGU-Extract\efx\lift-w08.sh'
if os.path.isfile(_w08):
    for _m in _re.finditer(r'^EXTRA_\w+="([^"]*)"', open(_w08).read(), _re.M):
        LIFTED_FNS += [int(x, 16) for x in _re.findall(r'0x[0-9a-f]{4,7}', _m.group(1))]
FNS = sorted(set(FNS) | set(STOP_FNS) | set(GT2_FNS) | set(MORE_DRAW_FNS) | set(LIFTED_FNS))
def _mat(u, a):
    return bytes(u.mem_read(a, 0x40)).hex()
SERVICES = {
    0xc8cf1c: ('begin_model', 4, lambda u, a, st: {'pos': bytes(u.mem_read(a[3], 12)).hex(),
                                                   'lod': bytes(u.mem_read(st[3], 12)).hex() if st[3] else ''}),
    0xc8d208: ('draw_mesh', 8, lambda u, a, st: {'matrix': _mat(u, a[3]),
                                                 'st0': bytes(u.mem_read(st[0], 16)).hex() if st[0] else '',
                                                 'st2': bytes(u.mem_read(st[2], 16)).hex() if st[2] else ''}),
}

# GPU_DRAW_ROM=1: sGpuParticle record A's draw (0xb918c4, the cParticleNode submission) runs as ROM code on the draw
# context the viewer's host stands up (host.initDraw / engdraw.py: the package table of one object per shader record,
# the constant-buffer descriptors, the state-object slots), each frame with the pass and view the viewer's drawFrame
# sets (0x87cf70(ctx, 0x15, 0), view byte 0, +0x164 above the pass cleared); the context calls outside the effect code are
# SERVICES as vecprim.py takes them -- 0x87f734 begin, 0x87f798 end, 0xbd0ab0 the render singleton's setup -- plus the
# indexed GPU draw 0x890ce0, whose context is snapshot into x.gpu_draws (not part of the vectors).
GPU_DRAW_ROM = bool(os.environ.get('GPU_DRAW_ROM'))
state = {}
if GPU_DRAW_ROM:
    import mfx
    from engdraw import NREC, is_kind
    def gpu_context(x, o):
        e = x.e
        VIEW = o['VIEW'][0]
        FAKE = state['FAKE'] = x.malloc(0x40 * NREC)
        PKG = x.malloc(8 * NREC + 64)
        for i in range(NREC):
            e.poke32(PKG + 8 * i, FAKE + 0x40 * i)
        CBTAB = state['CBTAB'] = x.malloc(4 * NREC + 64)
        CBDEF = x.malloc(0x1000)
        data = open(mfx.DEFAULT_PATH, 'rb').read()
        for i in range(NREC):
            if is_kind(i, 0):
                d = x.malloc(0x40)
                e.poke32(d + 0x18, struct.unpack_from('<I', data, mfx.records[i]['off'] + 0x18)[0])
                e.poke32(d + 0x24, CBDEF)
                e.poke32(CBTAB + 4 * i, d)
        e.poke32(VIEW + 0x10, PKG)
        e.poke32(VIEW + 8, CBTAB)
        for i in range(NREC):
            if is_kind(i, 4) or is_kind(i, 5) or is_kind(i, 6):
                e.poke32(VIEW + 0x204 + 8 * i, FAKE + 0x40 * i)
    # TEXTURES as the viewer's host stands them up (host.js loadResource): each rTexture handle gets a texture object at
    # +0xd0 with the size at +0x1e / +0x20, and what rTexture's own loader (0xb4e49c) leaves on the handle -- 1/width,
    # 1/height at +0xd4 / +0xd8 and the sizes at +0xdc / +0xe0 / +0xe4 (the header's, shifted by word 1 bits 24..27).
    # Record A's draw binds [handle +0xd0] (0xb92408) and fills CBGPUParticleTex from them (0xb92148..).
    def gpu_textures(x):
        from efx_load import EXTRACT
        done = state.setdefault('textures', set())
        for dti, name, h in x.loaded:
            h = int(h, 16)
            if int(dti, 16) != 0x211e5d0 or h in done:
                continue
            done.add(h)
            w1, w2, w3 = struct.unpack_from('<3I', open(os.path.join(EXTRACT, name.replace(chr(92), os.sep) + '.tex'), 'rb').read(16), 4)
            shift = (w1 >> 24) & 0xf
            w, hh, d = ((w2 >> 6) & 0x1fff) << shift, (w2 >> 19) << shift, ((w3 >> 16) & 0x1fff) << shift
            T = x.malloc(0x100)
            x.e.uc.mem_write(T + 0x1e, struct.pack('<HH', w & 0xffff, hh & 0xffff))
            x.e.poke32(h + 0xd0, T)
            x.e.uc.mem_write(h + 0xd4, struct.pack('<ffIII', 1.0 / w, 1.0 / hh, w, hh, d))
    def gpu_snapshot(u, a, st):
        x = holder['x']; e = x.e
        ctx = a[0]
        FAKE = state['FAKE']
        name = lambda v: mfx.records[(v - FAKE) // 0x40]['name'] if FAKE <= v < FAKE + 0x40 * NREC and (v - FAKE) % 0x40 == 0 else '%#x' % v
        slots, cbs = {}, {}
        for i in range(NREC):
            v = e.u32(ctx + 0x204 + 8 * i)
            if not v:
                continue
            if is_kind(i, 2):
                slots[mfx.records[i]['name']] = name(v)
            elif is_kind(i, 0):
                n = e.u32(e.u32(state['CBTAB'] + 4 * i) + 0x18) & 0xffff
                cbs[mfx.records[i]['name']] = bytes(u.mem_read(v, 4 * n)).hex()
        x.gpu_draws = getattr(x, 'gpu_draws', [])
        x.gpu_draws.append({'frame': state.get('frame'), 'args': a[1:4], 'technique': '%#x' % e.u32(ctx + 0x1d8), 'ia': '%#x' % e.u32(ctx + 0x1c8),
                            'ctx154': e.u32(ctx + 0x154), 'ctx164': e.u32(ctx + 0x164), 'bs': name(e.u32(ctx + 0x118)),
                            'ds': name(e.u32(ctx + 0x11c)), 'rs': name(e.u32(ctx + 0x120)), 'slots': slots, 'cb': cbs,
                            'vb': [e.u32(ctx + 0x124), e.u32(ctx + 0x138), bytes(u.mem_read(ctx + 0x134, 1))[0]], 'ib': e.u32(ctx + 0x14c)})
        if os.environ.get('GPU_DRAW_BYTES'):              # the bytes the draw reads, for an end-to-end comparison
            ib, vb = e.u32(e.u32(ctx + 0x14c) + 0x18), e.u32(e.u32(ctx + 0x124) + 0x18) + e.u32(ctx + 0x138)
            idx = struct.unpack('<%dH' % a[1], bytes(u.mem_read(ib + 2 * a[2], 2 * a[1])))
            nv = max([i for i in idx if i != 0xffff], default=-1) + 1
            x.gpu_draws[-1]['indices'] = bytes(u.mem_read(ib + 2 * a[2], 2 * a[1])).hex()
            x.gpu_draws[-1]['vertices'] = bytes(u.mem_read(vb, 32 * nv)).hex()
        return {}
    SERVICES.update({0x890ce0: ('gpu_mesh_draw', 0, gpu_snapshot),
                     0x87f734: ('draw_begin', 0, None), 0x87f798: ('draw_end', 0, None), 0xbd0ab0: ('render_setup', 0, None)})

def draw_all(x):
    if 'objs' not in state:
        state['objs'] = efx_draw.build(x, 0x1)
        if GPU_DRAW_ROM:
            gpu_context(x, state['objs'])
    o = state['objs']; e = x.e
    if GPU_DRAW_ROM:
        gpu_textures(x)
    if GPU_DRAW_ROM:                                  # the pass and view the viewer's drawFrame sets (host.js)
        proofunit._call(x, 0x87cf70, (o['VIEW'][0], 0x15, 0), 'pass 0x15')      # the scene's (host.js drawFrame)
        e.poke32(o['VIEW'][0] + 0x168, e.u32(o['VIEW'][0] + 0x168) & ~0xff)
        e.poke32(o['VIEW'][0] + 0x164, e.u32(o['VIEW'][0] + 0x164) & 0x1f)
    buf = o['BUF'][0]
    e.poke32(o['VIEW'][0] + 0x14, buf); e.poke32(o['VIEW'][0] + 0x18, buf + 0x100000)
    e.poke32(o['LIST'][0] + 0x74, o['RECS'][0]); e.poke32(o['LIST'][0] + 0x78, o['ENTS'][0]); e.poke32(o['LIST'][0] + 0x80, 0)
    e.poke32(o['VB'][0] + 0xc, 0); e.poke32(o['VB'][0] + 0x14, o['VBDATA'][0]); e.poke32(o['VB'][0] + 4, 0)
    e.poke32(o['PRIM'][0] + 0x248 + 8, 0)                 # the texture-set registry count back to 0, once per frame
    for _, _, q in state['run'].requests:
        print('DBG frame', state.get('frame'), 'core', hex(q.core), 'state', e.u32(q.core+0xc)&7, 'n15c', e.u32(q.core+0x15c), 'units', [(hex(u), hex(e.u32(u+0xf4)), hex(e.u32(u+0x1f0)), hex(e.u32(u+0xf0)), e.u32(u+0xc)&7) for u in [e.u32(q.core+0x150+4*i) for i in range(min(4,e.u32(q.core+0x15c)))]], file=sys.stderr)
    for owner in state['effects']():
        x.call(0x9b75e8, (owner, o['VIEW'][0]), 'uEffect draw')
    # sGpuParticle's frame end (vtable +0x2c 0xb8fdb8, after the render job): the buffer rotation and each record's
    # frame end (slot 7)
    if getattr(x, 'gpu_particle', None):
        proofunit._call(x, 0xb8fdb8, (x.gpu_particle,), 'sGpuParticle frame end')

class Run:
    def __init__(self, x, hooked):
        self.x, self.hooked = x, hooked
        self.par = Parent(x); self.par.set_scale(scale)
        self.lists = {path: x.RL}
        for _, efl, _ in STARTS:
            if efl not in self.lists:
                self.lists[efl] = x.load_list(efl)
        self.requests = []
        self.words = {}
        self.shellPar = None
        if SHELL_PLAN:
            self.shellPar = Parent(x, joints=SHELL_PLAN.get('parentJoints', []))
            self.shellPar.set_scale(SHELL_PLAN.get('parentScale', 1.0))
            if SHELL_PLAN.get('parentPosition'):
                self.shellPar.set_pose(SHELL_PLAN['parentPosition'])
    def frame(self, f):
        e = self.x.e
        for w in self.words.values():                     # 0x31ca7c: the walker's update clears the notices first
            e.poke32(w, e.u32(w) & 0xfff0)
        for at, n, flag in STOPS:
            if at == f and not SHELL_PLAN:
                proofunit._call(self.x, 0x329c40, (self.requests[n][2].core, flag), 'stop %d' % n)
        shell_starts = []
        proofunit.install(self.x, self.hooked)           # idempotent: the boot objects before the frame's first passes
        # sGpuParticle's frame begin (vtable +0x28 0xb8fcbc, right after the draw system's in the app frame 0x3d9d3c):
        # the mapped buffers' write pointers and the staging cursors back to their starts
        proofunit._call(self.x, 0xb8fcbc, (self.x.gpu_particle,), 'sGpuParticle frame begin')
        for at, efl, spec in STARTS:
            if at == f:
                n = len(self.requests) + len(shell_starts)
                if SHELL_PLAN and str(n) in SHELL_PLAN.get('requests', {}):
                    shell_starts.append((efl, spec, SHELL_PLAN['requests'][str(n)]))
                    continue
                self.requests.append((f, spec, proofunit.Request(self.x, self.par, spec, hooked=self.hooked, lst=self.lists[efl], requester=REQUESTER)))
                n = len(self.requests) - 1
                if any(p[2] == n for p in PSL):           # 0x31ca14: the new effect points at its bit's word
                    w = self.x.malloc(0x10); e.poke32(w, 0)
                    e.poke32(self.requests[n][2].core + 0x194, w)
                    self.words[n] = w
        for lo, hi, n, bits in PSL:
            if lo <= f <= hi and n in self.words:
                e.poke32(self.words[n], e.u32(self.words[n]) | bits)
        self.par.frame(f)
        def between():
            # a ROCK'S shell moves (and turns) every frame: the stand-in shell parent takes its pose here, where the
            # shell's move and its model rotation (0x539cd4) run -- before the effects' move pass
            pose = (SHELL_PLAN or {}).get('parentPoses', {}).get(str(f))
            if pose and self.shellPar is not None:
                self.shellPar.set_angles(pose['position'], pose['angles'])
            for efl, spec, req in shell_starts:
                self.requests.append((f, spec, proofunit.Request(self.x, self.shellPar, spec, hooked=self.hooked,
                                                                 lst=self.lists[efl], requester=req)))
            for n, entries in (SHELL_PLAN or {}).get('place', {}).items():
                n = int(n)
                for fr, pos, rot in entries:
                    if fr == f and n < len(self.requests):
                        core = self.requests[n][2].core
                        buf = self.x.malloc(0x20)
                        e.uc.mem_write(buf, struct.pack('<8f', pos[0], pos[1], pos[2], 0.0, rot[0], rot[1], rot[2], 0.0))
                        proofunit._call(self.x, 0x329c9c, (core, buf, 0), 'shell place position')
                        proofunit._call(self.x, 0x329d04, (core, buf + 0x10, 0), 'shell place rotation')
            # A SHELL THAT WRITES ITS EFFECT'S UNITS ITSELF (Boltreaver's base14, 0x406b20..0x406d34; the viewer's host.js
            # placeUnits): plan "units": {"<n>": [[frame, [x, y, z], [rx, ry, rz] radians, scaleZ | null], ...]} -- every unit
            # [core+0x150+4i], i < [core+0x15c]: +0x40.. the position (w 0), 0x8a4dfc(unit, rot), +0x68 = scaleZ (+0x6c 0)
            for n, entries in (SHELL_PLAN or {}).get('units', {}).items():
                n = int(n)
                for fr, pos, rot, sz in entries:
                    if fr == f and n < len(self.requests):
                        core = self.requests[n][2].core
                        buf = self.x.malloc(0x10)
                        e.uc.mem_write(buf, struct.pack('<3fI', rot[0], rot[1], rot[2], 0))
                        for i in range(e.u32(core + 0x15c)):
                            u = e.u32(core + 0x150 + 4 * i)
                            if not u:
                                continue
                            e.uc.mem_write(u + 0x40, struct.pack('<3fI', pos[0], pos[1], pos[2], 0))
                            proofunit._call(self.x, 0x8a4dfc, (u, buf), 'shell unit rotation')
                            if sz is not None:
                                e.uc.mem_write(u + 0x68, struct.pack('<fI', sz, 0))
            # A SHELL'S STOP runs in its move, BETWEEN the passes (its end +0x148 -> 0x43b058 -> 0x329c40), which is where
            # the viewer's schedule stops it too (render/rom/effect/schedule.js stepShells, out.ended) -- after the
            # placements. Clip-effect stops keep the frame's start.
            #   WITHDRAWN (2026-09-30, same day): this note first said the frame-start stop was why no set had reached
            # 0x327e7c's 0x327f1c arm (Plesioth's beam u 30 in Basarios's Beam Test). It was not: the recorder REACHED
            # that arm with the viewer's exact unit (+0xc 0x14cb2, +0x118 nibble 3, +0x29b 2) and dropped the whole
            # stop, because a comment's 0x327eac was on FNS -- see LIFTED_FNS above. The order here stands on its own
            # (it is the viewer's); it fixed nothing.
            if SHELL_PLAN:
                for at, n, flag in STOPS:
                    if at == f and n < len(self.requests):
                        proofunit._call(self.x, 0x329c40, (self.requests[n][2].core, flag), 'stop %d' % n)
            # THE SHELL DELETED (base14: the move after its end, dev/em081-shells-spec.md 5b): its parent's handles go invalid,
            # and every request on it ends in the effects' move through 0x31d028 (the viewer: schedule.js goneNext)
            if f in GONE and self.shellPar is not None:
                self.x.gone_parents = getattr(self.x, 'gone_parents', set()) | {self.shellPar.P}
        proofunit.unit_frame(self.x, between)
    def effects(self):
        out = []
        for _, _, q in self.requests:
            out += q.effects()
        return out

holder = {}
def before_start(x):
    holder['x'] = x
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
    if os.environ.get('WATCH_WRITE'):                  # debugging: every guest write to one address, with pc and lr
        from unicorn import UC_HOOK_MEM_WRITE
        from unicorn.arm_const import UC_ARM_REG_PC, UC_ARM_REG_LR, UC_ARM_REG_SP
        wa = int(os.environ['WATCH_WRITE'], 0)
        def _w(u, acc, addr, size, val, ud):
            print('WATCH frame %s write %#x+%d = %#x pc %#x lr %#x sp %#x' % (state.get('frame'), addr, size, val & 0xffffffff,
                  u.reg_read(UC_ARM_REG_PC), u.reg_read(UC_ARM_REG_LR), u.reg_read(UC_ARM_REG_SP)), file=sys.stderr)
        x.e.uc.hook_add(UC_HOOK_MEM_WRITE, _w, begin=wa, end=wa + 3)
    if os.environ.get('WATCH_EXEC'):                   # debugging: every execution of one address (0x0: a null call), with lr
        from unicorn import UC_HOOK_CODE
        from unicorn.arm_const import UC_ARM_REG_LR, UC_ARM_REG_SP, UC_ARM_REG_R0
        ea = int(os.environ['WATCH_EXEC'], 0)
        def _x(u, addr, size, ud):
            r0 = u.reg_read(UC_ARM_REG_R0)
            try: vt = int.from_bytes(bytes(u.mem_read(r0, 4)), 'little')
            except Exception: vt = None
            print('WATCH-EXEC frame %s at %#x lr %#x r0 %#x [r0] %s sp %#x' % (state.get('frame'), addr, u.reg_read(UC_ARM_REG_LR),
                  r0, hex(vt) if vt is not None else '?', u.reg_read(UC_ARM_REG_SP)), file=sys.stderr)
        x.e.uc.hook_add(UC_HOOK_CODE, _x, begin=ea, end=ea)
    if os.environ.get('ED4_BACKOUT'):                   # the viewer's current ed&4 back-out (proofunit.backout_ed4)
        proofunit.backout_ed4(x)
    state['run'] = Run(x, True)
    state['effects'] = lambda: state['run'].effects()
def before_move(x, f):
    state['frame'] = f
    state['run'].frame(f)
# vectors.record moves x.OW itself (a plain uEffect); skip it, the requests drive the units
import efx_emu
orig_call = efx_emu.EfxEmu.call
def call(self, addr, args, label):
    if label == 'move' and addr == 0x9b6130:
        return 0
    return orig_call(self, addr, args, label)
efx_emu.EfxEmu.call = call
_svc = dict(proofunit.services(holder)); _svc.update(SERVICES)
kept, total = V.record(path, frames, FNS, max_per_fn=40, construction=True, services=_svc,
                       before_start=before_start, before_move=before_move, after_move=draw_all, start=False)
efx_emu.EfxEmu.call = orig_call
os.makedirs(os.path.join('vectors', name), exist_ok=True)
dest = os.path.join('vectors', name, 'draw.json')
# WRITTEN ATOMICALLY, because a lift may be reading the set while this writes it. lift.py walks every directory in
# vectors/ and with three sessions recording at once one of them is usually mid-write -- which surfaced as a
# JSONDecodeError in the middle of somebody else's lift, looking like a corrupt set rather than a race. Writing
# beside it and renaming means a reader sees either the old file or the new one, never half of one. os.replace is
# atomic on Windows for a rename within the same directory.
tmp = dest + '.part'
with open(tmp, 'w') as fh:
    json.dump({'file': os.path.basename(path), 'frames': frames,
               'functions': {'%#x' % f: {'calls': total[f], 'vectors': kept[f]} for f in FNS}},
              fh, separators=(',', ':'))
os.replace(tmp, dest)
print(' '.join('%x:%d/%d' % (f, len(kept[f]), total[f]) for f in FNS if total[f]))
print(os.path.getsize(dest) // 1024, 'KB ->', dest)
if GPU_DRAW_ROM:
    gd = getattr(holder['x'], 'gpu_draws', [])
    json.dump(gd, open(os.path.join('logs', name + '.gpudraws.json'), 'w'))
    print(len(gd), 'GPU draws ->', os.path.join('logs', name + '.gpudraws.json'))
