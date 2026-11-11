"""Top-down blocking diagrams. All sets are drawn in map orientation: north up, east (the ocean) right.
Set coordinates are metres: X = east (= -z in the game), Y = south (= +x in the game). Same base drawing every time a set recurs."""
import math
H = lambda s: s.replace('&', '&amp;').replace('<', '&lt;')

VIEWS = {  # x0, y0, x1, y1 in metres
    'square': (-31, -19, 25, 19),
    'shop': (-28.6, -7.2, -14.6, 7.6),
    'park': (-54, -114, 22, -58),
    'beach': (68, -30, 134, 22),
    'farm': (-6, 84, 42, 124),
}

class D:
    def __init__(self, view, w=720):
        self.x0, self.y0, self.x1, self.y1 = VIEWS[view]
        self.s = w / (self.x1 - self.x0)
        self.w = w; self.h = round((self.y1 - self.y0) * self.s)
        self.o = []
    def p(self, x, y): return ((x - self.x0) * self.s, (y - self.y0) * self.s)
    def rect(self, x, y, w, h, cls, rx=0):
        a, b = self.p(x, y); self.o.append(f'<rect x="{a:.1f}" y="{b:.1f}" width="{w*self.s:.1f}" height="{h*self.s:.1f}" rx="{rx}" class="{cls}"/>')
    def circ(self, x, y, r, cls):
        a, b = self.p(x, y); self.o.append(f'<circle cx="{a:.1f}" cy="{b:.1f}" r="{r*self.s:.1f}" class="{cls}"/>')
    def ell(self, x, y, rx, ry, cls):
        a, b = self.p(x, y); self.o.append(f'<ellipse cx="{a:.1f}" cy="{b:.1f}" rx="{rx*self.s:.1f}" ry="{ry*self.s:.1f}" class="{cls}"/>')
    def line(self, pts, cls):
        d = ' '.join(f'{"M" if i==0 else "L"}{self.p(*q)[0]:.1f} {self.p(*q)[1]:.1f}' for i, q in enumerate(pts))
        self.o.append(f'<path d="{d}" class="{cls}"/>')
    def poly(self, pts, cls):
        d = ' '.join(f'{self.p(*q)[0]:.1f},{self.p(*q)[1]:.1f}' for q in pts)
        self.o.append(f'<polygon points="{d}" class="{cls}"/>')
    def text(self, x, y, t, cls='lbl', anchor='middle'):
        a, b = self.p(x, y); self.o.append(f'<text x="{a:.1f}" y="{b:.1f}" class="{cls}" text-anchor="{anchor}">{H(t)}</text>')
    def palm(self, x, y):
        self.circ(x, y, .9, 'palm')
    # ---- marks ----
    def char(self, x, y, ini, kind, face=None):
        a, b = self.p(x, y); r = 13
        if face is not None:
            ang = math.radians(face); fx, fy = a + math.cos(ang) * (r + 7), b + math.sin(ang) * (r + 7)
            self.o.append(f'<line x1="{a:.1f}" y1="{b:.1f}" x2="{fx:.1f}" y2="{fy:.1f}" class="face {kind}"/>')
        self.o.append(f'<circle cx="{a:.1f}" cy="{b:.1f}" r="{r}" class="ch {kind}"/><text x="{a:.1f}" y="{b+4.5:.1f}" class="chl" text-anchor="middle">{H(ini)}</text>')
    def move(self, pts, kind=''):
        d = ' '.join(f'{"M" if i==0 else "L"}{self.p(*q)[0]:.1f} {self.p(*q)[1]:.1f}' for i, q in enumerate(pts))
        self.o.append(f'<path d="{d}" class="mv {kind}" marker-end="url(#ah)"/>')
    def cam(self, x, y, n, ang, fov=50, ln=None):
        a, b = self.p(x, y); L = ln or 70
        a1, a2 = math.radians(ang - fov / 2), math.radians(ang + fov / 2)
        p1 = (a + math.cos(a1) * L, b + math.sin(a1) * L); p2 = (a + math.cos(a2) * L, b + math.sin(a2) * L)
        self.o.append(f'<path d="M{a:.1f} {b:.1f} L{p1[0]:.1f} {p1[1]:.1f} A{L} {L} 0 0 1 {p2[0]:.1f} {p2[1]:.1f} Z" class="fov"/>')
        self.o.append(f'<g class="cam"><rect x="{a-15:.1f}" y="{b-10:.1f}" width="30" height="20" rx="3"/><text x="{a:.1f}" y="{b+5:.1f}" text-anchor="middle">{H(str(n))}</text></g>')
    def axis(self, p, q, label='180°'):
        (x1, y1), (x2, y2) = p, q
        dx, dy = x2 - x1, y2 - y1
        self.line([(x1 - dx * .25, y1 - dy * .25), (x2 + dx * .25, y2 + dy * .25)], 'axis')
        self.text(x2 + dx * .27, y2 + dy * .27 - .6, label, 'axl')
    def compass(self):
        a, b = self.w - 26, 30
        self.o.append(f'<g class="cmp"><path d="M{a} {b-16} L{a+7} {b+6} L{a} {b} L{a-7} {b+6} Z"/><text x="{a}" y="{b+20}" text-anchor="middle">N</text></g>')
    def scale(self, m=10):
        a, b = 14, self.h - 14; L = m * self.s
        self.o.append(f'<g class="sc"><path d="M{a} {b-5} V{b} H{a+L:.1f} V{b-5}"/><text x="{a+L/2:.1f}" y="{b-8}" text-anchor="middle">{m} m</text></g>')
    def svg(self, title):
        defs = '<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" class="ahd"/></marker></defs>'
        return (f'<svg class="blk" viewBox="0 0 {self.w} {self.h}" role="img" aria-label="{H(title)}">{defs}'
                f'<rect width="{self.w}" height="{self.h}" class="bg"/>' + ''.join(self.o) + '</svg>')

# ---------------- set bases ----------------
def base_square(d):
    x0, y0, x1, y1 = VIEWS['square']
    d.rect(x0, y0, x1 - x0, y1 - y0, 'lot')
    for a in (-14.5, 7.5): d.rect(a, y0, 7, y1 - y0, 'road')
    for a in (-14.5, 7.5): d.rect(x0, a, x1 - x0, 7, 'road')
    d.rect(-7.5, -7.5, 15, 15, 'plaza'); d.text(2.6, 6.9, 'TOWN SQUARE', 'lbl sm')
    for (bx, by, s) in [(22, 0, 11), (0, -22, 11), (0, 22, 11), (22, -22, 10), (22, 22, 10), (-22, -22, 11), (-22, 22, 11)]:
        d.rect(bx - s / 2, by - s / 2, s, s, 'bld')
    d.text(22, 4.2, 'block (≤19 m)', 'lbl sm')
    # Cloud Kingz
    d.rect(-17.6, -8, 3.1, 16, 'walk')
    d.rect(-27, -6, 10, 12, 'shop'); d.text(-22, 3.4, 'CLOUD KINGZ', 'lbl b'); d.text(-22, 5.0, '(Sal’s vape shop)', 'lbl sm')
    d.line([(-17, 1.1), (-17, 2.4)], 'door'); d.text(-16.2, 3.5, 'door', 'lbl xs', 'start')
    d.line([(-17, -3.0), (-17, 0.1)], 'win'); d.text(-16.2, -1.4, 'window', 'lbl xs', 'start')
    d.palm(-15.9, -6.9); d.palm(-15.7, 6.8)
    # container: 20 ft side-opening box, long axis N–S, doors on the WEST face toward the shop, spill fans west
    d.poly([(4.7, -2.6), (0.4, -4.4), (-1.2, 0), (0.4, 4.4), (4.7, 2.6)], 'spill')
    d.rect(4.7, -3.25, 2.6, 6.5, 'ctn'); d.text(6.0, 4.9, 'CONTAINER', 'lbl sm')
    d.line([(4.7, -3.2), (3.3, -4.3)], 'door'); d.line([(4.7, 3.2), (3.3, 4.3)], 'door')
    d.rect(-4.9, 6.1, 1.8, 1.8, 'prop'); d.text(-4, 10.0, 'monument', 'lbl xs')
    d.text(x1 - 1, -10.4, 'to beach + ocean →', 'lbl sm', 'end'); d.text(-10.9, y1 - 1, 'road', 'lbl xs')
    d.compass(); d.scale(10)

def base_shop(d):
    x0, y0, x1, y1 = VIEWS['shop']
    d.rect(x0, y0, x1 - x0, y1 - y0, 'lot')
    d.rect(-17, y0, 2.4, y1 - y0, 'walk'); d.text(-15.8, -6.2, 'sidewalk', 'lbl xs')
    d.rect(-27, -6, 10, 12, 'floor')
    d.line([(-27, -6), (-17, -6), (-17, -3.0)], 'wall'); d.line([(-17, 0.1), (-17, 1.1)], 'wall'); d.line([(-17, 2.4), (-17, 6), (-27, 6), (-27, -6)], 'wall')
    d.line([(-17, -3.0), (-17, 0.1)], 'win'); d.line([(-17, 1.1), (-16.1, 1.9)], 'door')
    d.text(-16.1, -1.4, 'window', 'lbl xs', 'start'); d.text(-15.7, 3.3, 'glass door', 'lbl xs', 'start')
    d.rect(-26.6, -5.6, 9.2, .7, 'shelf'); d.rect(-26.6, 4.9, 6.8, .7, 'shelf'); d.rect(-26.9, -4.8, .7, 9.6, 'shelf')
    d.text(-22, -5.0, 'shelves (boxes)', 'lbl xs'); d.text(-23, 5.6, 'shelves', 'lbl xs')
    d.rect(-23.4, -4.6, .9, 4.6, 'ctr'); d.text(-24.6, -2.6, 'glass counter', 'lbl xs', 'end')
    d.text(-15.0, 7.0, 'square + container →', 'lbl xs', 'end')
    d.compass(); d.scale(2)

def base_park(d):
    x0, y0, x1, y1 = VIEWS['park']
    d.rect(x0, y0, x1 - x0, y1 - y0, 'grass')
    d.rect(x0, -62, x1 - x0, 4, 'road'); d.text(0, -59.2, 'park gate (arch) → downtown', 'lbl sm')
    d.line([(0, -62), (-6, -72), (-22, -84), (-26, -88)], 'path'); d.line([(-6, -72), (4, -86)], 'path')
    d.ell(8, -98, 7, 11, 'pond'); d.text(8, -97, 'pond', 'lbl sm')
    d.circ(-30, -90, 5.8, 'gazebo'); d.text(-30, -89.2, 'GAZEBO', 'lbl sm b')
    d.rect(-41, -88.6, 4.2, 1.2, 'prop'); d.text(-39, -90.2, 'bench', 'lbl xs')
    d.rect(-43, -96.6, 4.2, 1.2, 'prop')
    for (tx, ty) in [(-48, -70), (-44, -104), (-14, -106), (14, -72), (18, -110), (-20, -66), (-50, -96), (-8, -100), (-36, -108)]:
        d.circ(tx, ty, 2.4, 'tree')
    d.compass(); d.scale(10)

def base_beach(d):
    x0, y0, x1, y1 = VIEWS['beach']
    d.rect(x0, y0, x1 - x0, y1 - y0, 'lot')
    d.rect(x0, y0, 4, y1 - y0, 'road'); d.text(60, 36, 'downtown edge', 'lbl xs', 'start')
    d.rect(100, y0, 25, y1 - y0, 'sand'); d.rect(125, y0, x1 - 125, y1 - y0, 'sea'); d.text(129.5, 0, 'ATLANTIC', 'lbl sm b')
    d.rect(78, -12, 20, 24, 'mat'); d.text(88, -13.2, 'MUSCLE BEACH (outdoor gym)', 'lbl sm b')
    for (bx, by) in [(84, 0), (90, -5), (90, 5), (82, 7)]: d.rect(bx - 1, by - .4, 2, .8, 'prop')
    d.rect(112.6, -25.4, 2.8, 2.8, 'prop'); d.text(114, -27.4, 'lifeguard tower', 'lbl xs')
    d.rect(117, 28, 23, 4, 'pier'); d.text(128, 26.4, 'pier', 'lbl xs')
    d.text(101, 18, 'sand', 'lbl xs', 'start')
    d.compass(); d.scale(10)

def base_farm(d):
    x0, y0, x1, y1 = VIEWS['farm']
    d.rect(x0, y0, x1 - x0, y1 - y0, 'lot')
    d.rect(x0, 72, x1 - x0, 4, 'road'); d.text(0, 75, 'farm gate (arch) → downtown', 'lbl sm')
    d.rect(-28, 78, 76, 56, 'field')
    for i in range(6): d.rect(-26 + i * 3.2, 86, 1.4, 16, 'crop')
    d.rect(26, 112.5, 8, 10, 'barn'); d.text(30, 118, 'BARN', 'lbl sm b'); d.circ(37, 126, 2, 'silo')
    d.line([(-2, 92), (20, 92), (20, 114), (-2, 114), (-2, 92)], 'fence'); d.text(9, 90.6, 'cow pen (fence)', 'lbl xs')
    d.rect(15.4, 104.9, 1.2, 1.2, 'prop'); d.text(16, 108, 'bucket', 'lbl xs')
    for (hx, hy) in [(22, 109), (24.6, 110.5)]: d.circ(hx, hy, 1.2, 'hay')
    d.compass(); d.scale(10)

BASE = {'square': base_square, 'shop': base_shop, 'park': base_park, 'beach': base_beach, 'farm': base_farm}

def blocking(setname, title, chars=(), moves=(), cams=(), axis=None, notes=()):
    d = D(setname)
    BASE[setname](d)
    for m in moves: d.move(m[0], m[1] if len(m) > 1 else '')
    if axis: d.axis(*axis)
    for c in cams: d.cam(*c)
    for c in chars: d.char(*c)
    for n in notes: d.text(*n)
    return d.svg(title)
