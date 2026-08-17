#!/usr/bin/env python3
"""
Generate the schematic placeholder plates used by projects without a photo.

Each plate is a self-contained SVG drawn in the site palette, sized 16:10 to
match .card-figure. They are meant to say something true about the project —
a signal chain, a waveform, a mechanism — not to be decorative filler.

Run from the repo root:  python3 scripts/make-placeholders.py
Writes to assets/img/projects/.
"""

import os

PAPER = "#fbfbf9"
INK = "#14181c"
GRAPHITE = "#565f6b"
GRAPHITE2 = "#7b838d"
HAIR = "#dde0e3"
HAIR2 = "#c3c8ce"
BLUE = "#2563eb"
RED = "#cc2936"
MONO = "'IBM Plex Mono','SF Mono',Menlo,Consolas,monospace"

W, H = 800, 500


def plate(no, caption, art, label):
    """Wrap artwork in the shared sheet frame: paper, border, corner marks."""
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="{label}">
  <rect width="{W}" height="{H}" fill="{PAPER}"/>
  <rect x="16.5" y="16.5" width="767" height="467" fill="none" stroke="{HAIR}" stroke-width="1"/>
  <g stroke="{HAIR2}" stroke-width="1">
    <path d="M16 44h20M44 16v20M784 44h-20M756 16v20M16 456h20M44 484v-20M784 456h-20M756 484v-20"/>
  </g>
{art}
  <g font-family="{MONO}" font-size="14" fill="{GRAPHITE2}" letter-spacing="2">
    <text x="40" y="466">{no}</text>
    <text x="760" y="466" text-anchor="end">{caption}</text>
  </g>
</svg>
"""


def arrow(x1, y1, x2, y2, color=INK, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    head = ""
    if x2 != x1:
        s = 1 if x2 > x1 else -1
        head = f'<path d="M{x2} {y2}l{-9*s} -5v10z" fill="{color}"/>'
    else:
        s = 1 if y2 > y1 else -1
        head = f'<path d="M{x2} {y2}l-5 {-9*s}h10z" fill="{color}"/>'
    return (f'<line x1="{x1}" y1="{y1}" x2="{x2 - (9 if x2>x1 else -9) if y1==y2 else x2}" y2="{y2}" '
            f'stroke="{color}" stroke-width="1.5"{d}/>{head}')


def box(x, y, w, h, title, sub=None):
    t = f'<text x="{x+w/2}" y="{y+h/2 + (0 if not sub else -6)}" text-anchor="middle" font-family="{MONO}" font-size="19" fill="{INK}" letter-spacing="1">{title}</text>'
    s = ""
    if sub:
        s = f'<text x="{x+w/2}" y="{y+h/2+16}" text-anchor="middle" font-family="{MONO}" font-size="13" fill="{GRAPHITE2}" letter-spacing="1">{sub}</text>'
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="2" fill="none" stroke="{INK}" stroke-width="1.5"/>{t}{s}'


def cap(x, y, text, anchor="middle", color=GRAPHITE2, size=13):
    return (f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="{MONO}" '
            f'font-size="{size}" fill="{color}" letter-spacing="1.6">{text}</text>')


# ---------------------------------------------------------------- P-02
def lithophane():
    a = ['<g fill="none" stroke="%s" stroke-width="1.5">' % INK]
    # PIR sensor with detection cone
    a.append(f'<rect x="60" y="126" width="92" height="88" rx="2"/>')
    a.append(f'<circle cx="106" cy="170" r="24"/><circle cx="106" cy="170" r="13"/>')
    a.append('</g>')
    a.append(f'<g fill="none" stroke="{GRAPHITE2}" stroke-width="1.2" stroke-dasharray="5 5">'
             f'<path d="M60 148L26 108M60 192L26 232"/>'
             f'<path d="M44 170a34 34 0 0 0 0 0"/></g>')
    a.append(cap(106, 236, "PIR", size=13))
    a.append(arrow(152, 170, 250, 170))
    a.append(box(250, 125, 160, 90, "ESP32", "WROOM-32"))
    a.append(arrow(410, 170, 518, 170))
    a.append(cap(464, 158, "PWM"))
    # lithophane panel, hatched
    a.append(f'<defs><pattern id="lp" width="10" height="10" patternUnits="userSpaceOnUse" '
             f'patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="10" stroke="{HAIR2}" stroke-width="1.2"/></pattern></defs>')
    a.append(f'<rect x="520" y="96" width="150" height="148" fill="url(#lp)" stroke="{INK}" stroke-width="1.5"/>')
    a.append(cap(595, 266, "LITHOPHANE"))
    # emitted light
    a.append(f'<g stroke="{RED}" stroke-width="1.5" stroke-linecap="round">'
             f'<path d="M684 128h44M684 156h60M684 184h60M684 212h44"/></g>')
    # PWM sunrise ramp — axis lifted clear of the sheet caption row
    a.append(f'<g stroke="{HAIR2}" stroke-width="1"><path d="M96 340h620M96 380h620"/></g>')
    a.append(f'<path d="M96 306v114M96 420h620" fill="none" stroke="{GRAPHITE}" stroke-width="1.5"/>')
    a.append(f'<path d="M96 420C300 418 430 390 716 314" fill="none" stroke="{BLUE}" stroke-width="2.5"/>')
    a.append(cap(96, 294, "DUTY", anchor="start"))
    a.append(cap(400, 294, "SUNRISE RAMP", color=BLUE))
    return "\n".join("  " + s for s in a)


# ---------------------------------------------------------------- P-03
def fpga():
    a = []
    # ---- seven-segment digit, drawn as proper chamfered bars ----
    X, Y, L, t = 84, 104, 84, 15   # origin, segment length, half-thickness*2

    def hseg(x, y, lit):
        f = INK if lit else HAIR
        h = t / 2
        return (f'<polygon points="{x},{y} {x+h},{y-h} {x+L-h},{y-h} {x+L},{y} '
                f'{x+L-h},{y+h} {x+h},{y+h}" fill="{f}"/>')

    def vseg(x, y, lit):
        f = INK if lit else HAIR
        h = t / 2
        return (f'<polygon points="{x},{y} {x+h},{y+h} {x+h},{y+L-h} {x},{y+L} '
                f'{x-h},{y+L-h} {x-h},{y+h}" fill="{f}"/>')

    # digit "3": a b c d g lit, e f dark
    a.append(hseg(X, Y, True))              # a
    a.append(vseg(X + L, Y, True))          # b
    a.append(vseg(X + L, Y + L, True))      # c
    a.append(hseg(X, Y + 2 * L, True))      # d
    a.append(vseg(X, Y + L, False))         # e
    a.append(vseg(X, Y, False))             # f
    a.append(hseg(X, Y + L, True))          # g
    a.append(cap(X + L / 2, Y + 2 * L + 44, "7-SEG DECODER"))

    # ---- clock in, divided clock out, stacked so they cannot collide ----
    def square(x, y, period, cycles, amp, color):
        d = [f"M{x} {y}"]
        for _ in range(cycles):
            d.append(f"v{-amp}h{period/2}v{amp}h{period/2}")
        return f'<path d="{"".join(d)}" fill="none" stroke="{color}" stroke-width="2"/>'

    a.append(cap(300, 112, "CLK", anchor="start", color=GRAPHITE))
    a.append(square(300, 156, 40, 11, 32, INK))
    a.append(box(390, 196, 172, 60, "÷ N"))
    a.append(arrow(476, 160, 476, 194, GRAPHITE))
    a.append(arrow(476, 258, 476, 292, GRAPHITE))
    a.append(cap(300, 300, "CLK / N", anchor="start", color=GRAPHITE))
    a.append(square(300, 344, 220, 2, 32, BLUE))

    # ---- GPIO header broken out for capture ----
    a.append(f'<path d="M300 400h440" stroke="{INK}" stroke-width="1.5"/>')
    a.append(f'<g fill="{INK}">'
             + "".join(f'<circle cx="{300 + i*63}" cy="400" r="4.5"/>' for i in range(8))
             + '</g>')
    a.append(f'<g stroke="{RED}" stroke-width="1.5" stroke-dasharray="4 4">'
             f'<path d="M300 400v28M426 400v28M552 400v28M678 400v28"/></g>')
    a.append(cap(520, 444, "GPIO → LOGIC ANALYZER", color=RED))
    return "\n".join("  " + s for s in a)


# ---------------------------------------------------------------- P-04
def bench():
    a = []
    # browser frame
    a.append(f'<rect x="52" y="60" width="696" height="330" rx="4" fill="none" stroke="{INK}" stroke-width="1.5"/>')
    a.append(f'<path d="M52 100h696" stroke="{INK}" stroke-width="1.5"/>')
    a.append(f'<g fill="{HAIR2}"><circle cx="76" cy="80" r="6"/><circle cx="98" cy="80" r="6"/><circle cx="120" cy="80" r="6"/></g>')
    # RC schematic
    a.append(f'<g fill="none" stroke="{INK}" stroke-width="1.8" stroke-linejoin="round">')
    a.append('<path d="M112 176h56"/>')                                   # source to R
    a.append('<path d="M168 176l10-14 16 28 16-28 16 28 16-28 10 14"/>')  # resistor
    a.append('<path d="M252 176h72"/>')
    a.append('<path d="M324 152v48M348 152v48"/>')                        # capacitor
    a.append('<path d="M348 176h48v96"/>')
    a.append('<path d="M112 176v96h284"/>')                               # return
    a.append('</g>')
    # source symbol
    a.append(f'<circle cx="112" cy="176" r="0" fill="none"/>')
    a.append(f'<g fill="none" stroke="{INK}" stroke-width="1.8"><path d="M96 152v48M104 160v32M120 168v16M128 164v24"/></g>')
    a.append(cap(200, 138, "R", color=GRAPHITE, size=15))
    a.append(cap(336, 138, "C", color=GRAPHITE, size=15))
    # ground
    a.append(f'<g stroke="{INK}" stroke-width="1.8"><path d="M376 272h40M383 281h26M390 290h12"/></g>')
    # response plot
    a.append(f'<g stroke="{HAIR}" stroke-width="1"><path d="M470 150h214M470 200h214M470 250h214"/></g>')
    a.append(f'<path d="M470 128v172h214" fill="none" stroke="{GRAPHITE}" stroke-width="1.5"/>')
    a.append(f'<path d="M470 300C520 300 540 176 684 158" fill="none" stroke="{BLUE}" stroke-width="2.5"/>')
    a.append(cap(577, 332, "STEP RESPONSE", color=BLUE))
    a.append(cap(400, 366, "ngspice → WebAssembly", size=15, color=GRAPHITE))
    return "\n".join("  " + s for s in a)


# ---------------------------------------------------------------- P-05
def mlb():
    a = []
    # database cylinder
    a.append(f'<g fill="none" stroke="{INK}" stroke-width="1.5">'
             f'<ellipse cx="128" cy="150" rx="66" ry="22"/>'
             f'<path d="M62 150v104a66 22 0 0 0 132 0V150"/>'
             f'<path d="M62 186a66 22 0 0 0 132 0M62 220a66 22 0 0 0 132 0"/></g>')
    a.append(cap(128, 306, "POSTGRESQL"))
    a.append(arrow(206, 202, 288, 202))
    a.append(box(288, 160, 172, 84, "GBM", "LightGBM / XGB"))
    a.append(arrow(460, 202, 542, 202))
    # bar chart of predictions
    bars = [(0, 58), (1, 96), (2, 74), (3, 128), (4, 106)]
    for i, h in bars:
        x = 552 + i * 38
        a.append(f'<rect x="{x}" y="{268 - h}" width="26" height="{h}" fill="{BLUE if i != 3 else RED}" opacity="0.9"/>')
    a.append(f'<path d="M542 268h188" stroke="{GRAPHITE}" stroke-width="1.5"/>')
    a.append(cap(636, 306, "BACK-CHECK"))
    a.append(cap(400, 396, "ingest → train → score → grade", size=15, color=GRAPHITE))
    return "\n".join("  " + s for s in a)


# ---------------------------------------------------------------- P-06
def rppg():
    a = []
    # head outline with tracker landmarks and the sampled region of interest —
    # drawn as a vision pipeline would see it, not as a face
    a.append(f'<g fill="none" stroke="{INK}" stroke-width="1.5">'
             f'<ellipse cx="176" cy="196" rx="86" ry="106"/></g>')
    a.append(f'<g stroke="{GRAPHITE2}" stroke-width="1.3">'
             + "".join(f'<path d="M{x-6} {y}h12M{x} {y-6}v12"/>'
                       for x, y in [(146, 182), (206, 182), (176, 214), (150, 248), (202, 248)])
             + '</g>')
    a.append(f'<rect x="132" y="112" width="88" height="42" fill="none" stroke="{RED}" stroke-width="1.8" stroke-dasharray="6 4"/>')
    a.append(cap(176, 330, "ROI · LANDMARKS"))
    a.append(arrow(280, 196, 356, 196))
    a.append(cap(318, 182, "RGB"))
    # PPG waveform
    a.append(f'<g stroke="{HAIR}" stroke-width="1"><path d="M376 150h348M376 200h348M376 250h348"/></g>')
    wave = "M376 226"
    for k in range(4):
        x = 376 + k * 88
        wave += (f"C{x+8} 226 {x+12} 158 {x+22} 158 C{x+30} 158 {x+32} 210 {x+40} 206 "
                 f"C{x+48} 202 {x+52} 186 {x+60} 190 C{x+70} 194 {x+76} 226 {x+88} 226 ")
    a.append(f'<path d="{wave}" fill="none" stroke="{BLUE}" stroke-width="2.5"/>')
    a.append(f'<path d="M376 128v150h348" fill="none" stroke="{GRAPHITE}" stroke-width="1.5"/>')
    a.append(cap(550, 330, "RECOVERED PULSE", color=BLUE))
    a.append(cap(400, 396, "GREEN · CHROM · POS", size=15, color=GRAPHITE))
    return "\n".join("  " + s for s in a)


# ---------------------------------------------------------------- P-12
def lasermic():
    a = []
    import math
    a.append(cap(400, 66, "OPTICAL ACOUSTIC RECOVERY — PHASE 1", size=15, color=GRAPHITE))
    a.append(box(56, 130, 130, 58, "LASER"))
    # outgoing beam to the surface
    a.append(f'<path d="M186 159h362" stroke="{RED}" stroke-width="2.5"/>')
    a.append(f'<path d="M552 159l-13-6v12z" fill="{RED}"/>')
    # vibrating surface, kept clear of the trace below
    a.append(f'<path d="M560 92v198" stroke="{INK}" stroke-width="2.5"/>')
    a.append(f'<g fill="none" stroke="{GRAPHITE2}" stroke-width="1.2" stroke-dasharray="5 4">'
             f'<path d="M580 106v170M600 120v142"/></g>')
    a.append(cap(608, 318, "SURFACE", anchor="middle"))
    # reflected beam back down to the detector
    a.append(f'<path d="M560 159L206 251" stroke="{RED}" stroke-width="2.5" stroke-dasharray="7 5"/>')
    a.append(box(56, 222, 150, 58, "PHOTO-D"))
    a.append(arrow(131, 280, 131, 352, GRAPHITE))
    # recovered signal — deliberately noisy, that is the finding
    a.append(f'<path d="M228 396h500" stroke="{GRAPHITE}" stroke-width="1.5"/>')
    sig = "M228 396"
    for i in range(1, 126):
        x = 228 + i * 4
        y = 396 - (24 * math.sin(i / 5.4) + 8 * math.sin(i / 1.3) + 5 * math.sin(i / 0.7))
        sig += f"L{x:.0f} {y:.0f}"
    a.append(f'<path d="{sig}" fill="none" stroke="{BLUE}" stroke-width="2"/>')
    a.append(cap(228, 444, "RECOVERED — SNR LIMITED", anchor="start", color=BLUE))
    return "\n".join("  " + s for s in a)


# ---------------------------------------------------------------- P-13
def voltiq():
    a = []
    # stacked cards
    for i, (dx, dy, op) in enumerate([(48, 40, HAIR2), (24, 20, HAIR2)]):
        a.append(f'<rect x="{132+dx}" y="{96+dy}" width="424" height="220" rx="4" fill="{PAPER}" stroke="{op}" stroke-width="1.5"/>')
    a.append(f'<rect x="132" y="96" width="424" height="220" rx="4" fill="{PAPER}" stroke="{INK}" stroke-width="1.8"/>')
    a.append(cap(160, 136, "NEC 210.19(A)", anchor="start", color=RED, size=15))
    a.append(f'<path d="M160 154h368" stroke="{HAIR}" stroke-width="1"/>')
    a.append(f'<g font-family="{MONO}" font-size="17" fill="{INK}" letter-spacing="0.6">'
             f'<text x="160" y="196">Minimum branch-circuit</text>'
             f'<text x="160" y="224">conductor ampacity?</text></g>')
    a.append(f'<g fill="none" stroke="{HAIR2}" stroke-width="1.5">'
             f'<rect x="160" y="248" width="164" height="40" rx="2"/>'
             f'<rect x="340" y="248" width="164" height="40" rx="2"/></g>')
    a.append(cap(242, 274, "AGAIN", color=GRAPHITE2))
    a.append(cap(422, 274, "GOT IT", color=BLUE))
    # streak meter
    a.append(cap(132, 396, "STREAK", anchor="start", color=GRAPHITE))
    for i in range(12):
        f = BLUE if i < 8 else HAIR
        a.append(f'<rect x="{236 + i*36}" y="382" width="26" height="18" fill="{f}"/>')
    return "\n".join("  " + s for s in a)


# ---------------------------------------------------------------- P-14
def vrlab():
    a = []
    # headset
    a.append(f'<g fill="none" stroke="{INK}" stroke-width="1.8">'
             f'<rect x="80" y="150" width="268" height="132" rx="30"/>'
             f'<circle cx="150" cy="216" r="36"/><circle cx="278" cy="216" r="36"/>'
             f'<path d="M80 186H56a14 14 0 0 0-14 14v32a14 14 0 0 0 14 14h24"/>'
             f'<path d="M348 186h24a14 14 0 0 1 14 14v32a14 14 0 0 1-14 14h-24"/></g>')
    a.append(cap(214, 330, "META QUEST"))
    a.append(arrow(410, 216, 484, 216))
    # floating schematic panel
    a.append(f'<rect x="500" y="120" width="234" height="192" rx="4" fill="none" stroke="{BLUE}" stroke-width="1.5" stroke-dasharray="7 5"/>')
    a.append(f'<g fill="none" stroke="{INK}" stroke-width="1.8" stroke-linejoin="round">'
             f'<path d="M530 200h30l8-12 14 24 14-24 14 24 8-12h30"/>'
             f'<path d="M648 200v44M530 200v44M530 244h118"/>'
             f'<path d="M600 244v22M588 266h24M592 274h16M596 282h8"/></g>')
    a.append(cap(617, 336, "REAL SPICE CORE", color=BLUE))
    a.append(cap(400, 400, "circuits built in headset, solved by ngspice", size=15, color=GRAPHITE))
    return "\n".join("  " + s for s in a)


# ---------------------------------------------------------------- P-15
def confidential():
    """Deliberately discloses nothing: no geometry, no architecture, no ports.
       Publishing device detail before the non-provisional is filed is a public
       disclosure. This plate says the work exists and stops there."""
    a = []
    a.append(f'<defs><pattern id="hz" width="12" height="12" patternUnits="userSpaceOnUse" '
             f'patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="12" stroke="{HAIR2}" stroke-width="1.4"/></pattern></defs>')
    a.append(f'<rect x="120" y="96" width="560" height="216" fill="url(#hz)" stroke="{HAIR2}" stroke-width="1.5"/>')
    # redaction bars
    a.append(f'<g fill="{INK}">'
             f'<rect x="168" y="146" width="290" height="26"/>'
             f'<rect x="474" y="146" width="128" height="26"/>'
             f'<rect x="168" y="192" width="164" height="26"/>'
             f'<rect x="348" y="192" width="254" height="26"/>'
             f'<rect x="168" y="238" width="216" height="26"/></g>')
    # stamp
    a.append(f'<g transform="rotate(-9 400 356)">'
             f'<rect x="196" y="326" width="408" height="60" fill="none" stroke="{RED}" stroke-width="3"/>'
             f'<text x="400" y="366" text-anchor="middle" font-family="{MONO}" font-size="26" '
             f'fill="{RED}" letter-spacing="4">PATENT PENDING</text></g>')
    return "\n".join("  " + s for s in a)


PLATES = [
    ("lithophane-backlight", "P-02", "MOTION → PWM RAMP", lithophane,
     "Block diagram: PIR sensor into an ESP32 driving a PWM sunrise ramp behind a lithophane panel."),
    ("fpga-display", "P-03", "MAX 10 · DE10-LITE", fpga,
     "Seven-segment decoder with a clock divider and GPIO broken out for logic-analyzer capture."),
    ("claw-bench", "P-04", "SPICE IN THE BROWSER", bench,
     "An RC circuit and its step response, drawn inside a browser frame."),
    ("mlb-pipeline", "P-05", "INGEST → TRAIN → SCORE", mlb,
     "Data pipeline: PostgreSQL into gradient-boosted models into a scored back-check."),
    ("rppg", "P-06", "VIDEO → PULSE", rppg,
     "A face with a region of interest, and the pulse waveform recovered from it."),
    ("laser-mic", "P-12", "OPTICAL PATH", lasermic,
     "Laser reflected off a vibrating surface into a photodetector, and the recovered audio signal."),
    ("voltiq", "P-13", "NEC DRILL", voltiq,
     "A code flashcard with recall buttons and a streak meter."),
    ("vr-lab", "P-14", "QUEST + ngspice", vrlab,
     "A VR headset beside a schematic panel solved by a real SPICE core."),
    ("confidential-device", "P-15", "DETAIL WITHHELD", confidential,
     "A redacted plate marked patent pending. No technical detail is shown."),
]


def main():
    out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                       "assets", "img", "projects")
    os.makedirs(out, exist_ok=True)
    for slug, no, caption, fn, label in PLATES:
        svg = plate(no, caption, fn(), label)
        path = os.path.join(out, f"{slug}.svg")
        with open(path, "w") as f:
            f.write(svg)
        print(f"wrote {path} ({len(svg)} bytes)")


if __name__ == "__main__":
    main()
