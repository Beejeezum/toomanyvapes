# -*- coding: utf-8 -*-
import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
from svgsets import blocking, H
from data import S, SPINE, CALLS, RATE, CHAP, PROBLEMS_FIXED

R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
OUT = R + '/docs/storyboard/index.html'
IMGSPENT = 21 * 20
CREDITS_LEFT = 815

def esc(s): return H(s) if s else ''

# ---------- cost + classification ----------
ENGINE_IDS = {'T.1', 'G1.1', 'G2.1', 'G3.1', '2.4', '3.4', '5.3', 'E.3'}
def engine(sh): return sh['id'] in ENGINE_IDS
def cost(sh):
    if engine(sh): return 0
    if sh['st'] == 'NEW': return int(math.ceil(sh['dur'])) * RATE
    return 0
def cond_cost(sh):
    f = sh.get('fix') or ''
    return int(math.ceil(sh['dur'])) * RATE if ('Reshoot only if' in f or 'reshoot with the new look' in f) else 0

ALL = [(sc, sh) for sc in S for sh in sc['shots']]

def stamp(st, opt=False):
    return f'<span class="st st-{st.lower()}">{st}</span>' + ('<span class="st st-opt">optional</span>' if opt else '')

def mouth_tag(m):
    if m.startswith('LIP-SYNC ✓'): return '<span class="mt ok">mouth on screen · clip carries its line</span>'
    if m.startswith('LIP-SYNC:'): return '<span class="mt gen">mouth on screen · generate as lip-sync shot</span>'
    if m.startswith('HIDDEN'): return '<span class="mt hid">mouth hidden · line laid in post</span>'
    if m.startswith('Engine'): return '<span class="mt eng">in-engine mouth</span>'
    return '<span class="mt none">no line / no mouth</span>'

# ---------- overlays for in-engine UI shots ----------
def overlay(kind, ch=1):
    if kind == 'call':
        return ('<div class="ov"><div class="ov-card"><b>1</b><span>The Typo</span></div>'
                '<div class="ov-pol"><i style="background-image:url(img/pol_ch1_in_2.jpg)"></i></div>'
                '<div class="ov-sub"><b>SAL</b> Kid! Start right here, downtown…</div>'
                '<div class="ov-tok"><i></i><i></i><i></i><i></i><i></i></div></div>')
    if kind == 'stamp':
        return ('<div class="ov"><svg class="ov-stamp" viewBox="0 0 100 100" aria-hidden="true"><path d="M6 54 22 38.5 40 56.5 79 11 95 25.5 41 87Z"/></svg>'
                '<div class="ov-pol"><i style="background-image:url(img/k_ch2_out_1.jpg)"></i></div>'
                '<div class="ov-sub"><b>SAL</b> That\'s the district, kid! Look at \'em all!</div></div>')
    return ''

def ui_sketch(kind):
    if kind == 'credits':
        return ('<svg class="uisk" viewBox="0 0 320 180" role="img" aria-label="Credits layout sketch"><rect width="320" height="180" class="uibg"/>'
                '<g class="uiln">' + ''.join(f'<rect x="{110 + (i % 2) * 6}" y="{28 + i * 18}" width="{100 - (i % 3) * 14}" height="7" rx="3"/>' for i in range(7)) +
                '</g><text x="160" y="170" text-anchor="middle" class="uitx">paper crawl over the hazed town</text></svg>')
    return ''

# ---------- shot card ----------
def shot_card(sc, sh):
    imgs = sh.get('imgs') or ([sh['img']] if sh.get('img') else [])
    if sh.get('ui') and not imgs:
        pic = f'<div class="pan">{ui_sketch(sh["ui"])}</div>'
    elif len(imgs) > 1:
        labs = 'ABCD'
        pic = '<div class="pan multi">' + ''.join(
            f'<figure><img src="img/{i}.jpg" alt="Fly-in keyframe {labs[k]}" loading="lazy"><figcaption>{labs[k]}{" · LAND = first gameplay frame" if k == len(imgs) - 1 else ""}</figcaption></figure>'
            for k, i in enumerate(imgs)) + '</div>'
    else:
        ov = overlay(sh.get('overlay')) if sh.get('overlay') else ''
        flop = ' <em class="flop">flopped</em>' if imgs and imgs[0].endswith('_flop') else ''
        pic = f'<div class="pan"><div class="pw"><img src="img/{imgs[0]}.jpg" alt="Panel {esc(sh["id"])}" loading="lazy">{ov}</div>' + \
              (f'<div class="src">source: {esc(sh["src"])}{flop}</div>' if sh.get('src') else '<div class="src">rough sketch, no text in image</div>' if sh['st'] == 'NEW' else '') + '</div>'
    c, cc = cost(sh), cond_cost(sh)
    costs = f'{c} cr' if c else ('0 cr' + (f' (or {cc} cr if the diva is restyled)' if cc else ''))
    line = ''
    if sh.get('who'):
        line = f'<div class="ln"><b>{esc(sh["who"])}</b> {esc(sh.get("line", ""))}</div>'
    rows = [('Camera', f'{esc(sh["cam"])} · {esc(sh["lens"])}'), ('Framing', esc(sh['frame'])), ('Action', esc(sh['action']))]
    rows.append(('Sound', esc(sh['sound'])))
    rows.append(('Out', esc(sh['trans'])))
    rows.append(('Continuity', esc(sh['cont'])))
    if sh.get('fix'): rows.append(('Fix', esc(sh['fix'])))
    dl = ''.join(f'<dt>{k}</dt><dd>{v}</dd>' for k, v in rows)
    return (f'<article class="shot" id="s{esc(sh["id"])}">{pic}<div class="det">'
            f'<header><span class="sid">{esc(sh["id"])}</span>{stamp(sh["st"], sh.get("opt"))}<span class="sty">{esc(sh["type"])}</span>'
            f'<span class="dur">{sh["dur"]:g}s</span><span class="cr">{costs}</span></header>'
            f'{line}<div class="mrow">{mouth_tag(sh["mouth"])}{"" if sh["mouth"] in ("—",) else "<small>" + esc(sh["mouth"]) + "</small>"}</div><dl>{dl}</dl></div></article>')

# ---------- fly-in path ----------
FLY = [  # label, game z, height y, pitch deg, time s
    ('K0', -150, 45, -12, 0.0), ('K1', -118, 38, -14, 1.4), ('K2', -88, 32, -18, 2.7), ('K3', -62, 28, -22, 3.8),
    ('K4', -33, 25, -26, 5.0), ('K5', -15, 22, -40, 5.9), ('K6', -6, 11, -55, 7.0), ('K7', 2, 4.5, -15, 8.6), ('LAND', 8, 1.6, 2, 10.0)]

def fly_map():
    s = 1000 / 1320; W, Hh = 1000, round(1390 * s)
    px = lambda z: (660 - 4 * z) * s; py = lambda x: (660 + 4 * x) * s
    pts = ' '.join(f'{px(z):.1f},{py(0):.1f}' for _, z, *_ in FLY)
    o = [f'<svg class="flymap" viewBox="0 0 {W} {Hh}" role="img" aria-label="Fly-in path drawn on the town map">',
         f'<image href="img/map_town.jpg" x="0" y="0" width="{W}" height="{Hh}"/>',
         f'<polyline points="{pts}" class="fpath"/>']
    for i, (lab, z, y, p, t) in enumerate(FLY):
        x, yy = px(z), py(0)
        o.append(f'<circle cx="{x:.1f}" cy="{yy:.1f}" r="{6 if i < 5 else 4}" class="fk"/>')
        if i < 5:
            dy = -14 if i % 2 == 0 else 26
            o.append(f'<text x="{x:.1f}" y="{yy + dy:.1f}" text-anchor="middle" class="fkl">{lab} {y:g} m</text>')
    o.append(f'<text x="{px(2):.1f}" y="{py(0) + 66:.1f}" text-anchor="middle" class="fkl">K5–LAND: descent 22 → 1.6 m</text>')
    # view wedge at landing, toward the shop
    lx, ly = px(8), py(0)
    o.append(f'<path d="M{lx:.1f} {ly:.1f} L{lx - 70:.1f} {ly - 40:.1f} L{lx - 70:.1f} {ly + 40:.1f} Z" class="fwedge"/>')
    o.append(f'<text x="{px(-150) - 10:.1f}" y="{py(0) + 60:.1f}" text-anchor="end" class="fkl big">START over the Atlantic, heading west →→ actually ← west</text>' if False else '')
    o.append(f'<text x="{px(-112):.1f}" y="{py(0) + 150:.1f}" text-anchor="middle" class="fkl big">← heading west along x = 0</text>')
    o.append('</svg>')
    return ''.join(o)

def fly_profile():
    W, Hh = 1000, 300; X0, X1 = -32, 156; A1 = 50
    sx = lambda X: (X - X0) / (X1 - X0) * W; sy = lambda a: Hh - 30 - a / A1 * (Hh - 50)
    o = [f'<svg class="flyprof" viewBox="0 0 {W} {Hh}" role="img" aria-label="Fly-in altitude profile against building heights">',
         f'<rect width="{W}" height="{Hh}" class="bg"/>',
         f'<rect x="{sx(125):.1f}" y="{sy(0):.1f}" width="{sx(X1) - sx(125):.1f}" height="30" class="sea"/>',
         f'<rect x="{sx(100):.1f}" y="{sy(0):.1f}" width="{sx(125) - sx(100):.1f}" height="30" class="sand"/>',
         f'<line x1="0" y1="{sy(0):.1f}" x2="{W}" y2="{sy(0):.1f}" class="gl"/>']
    for X0b, X1b, h, lab, cls in [(-27, -17, 6.2, 'Cloud Kingz 6 m', 'shopb'), (4.7, 7.3, 2.7, 'container', 'ctnb'), (15.5, 28.5, 19, 'block ≤19 m', 'bldb'),
                                  (37.5, 50.5, 19, 'block ≤19 m', 'bldb'), (62, 64, 8, 'arch', 'bldb'), (78, 98, 2.5, 'Muscle Beach', 'bldb')]:
        o.append(f'<rect x="{sx(X0b):.1f}" y="{sy(h):.1f}" width="{sx(X1b) - sx(X0b):.1f}" height="{sy(0) - sy(h):.1f}" class="{cls}"/>')
        o.append(f'<text x="{(sx(X0b) + sx(X1b)) / 2:.1f}" y="{sy(h) - 5:.1f}" text-anchor="middle" class="pl">{lab}</text>')
    o.append(f'<line x1="{sx(-32):.1f}" y1="{sy(22):.1f}" x2="{sx(60):.1f}" y2="{sy(22):.1f}" class="clr"/><text x="{sx(52):.1f}" y="{sy(22) - 4:.1f}" class="pl">clearance floor 22 m (blocks ≤19 m)</text>')
    pts = ' '.join(f'{sx(-z):.1f},{sy(y):.1f}' for _, z, y, *_ in FLY)
    o.append(f'<polyline points="{pts}" class="fpath"/>')
    for lab, z, y, p, t in FLY:
        X = -z; a = math.radians(-p)
        o.append(f'<circle cx="{sx(X):.1f}" cy="{sy(y):.1f}" r="5" class="fk"/>')
        dx, dy = -math.cos(a) * 26, math.sin(a) * 26
        o.append(f'<line x1="{sx(X):.1f}" y1="{sy(y):.1f}" x2="{sx(X) + dx:.1f}" y2="{sy(y) + dy:.1f}" class="look" marker-end="url(#fa)"/>')
        o.append(f'<text x="{sx(X):.1f}" y="{sy(y) - 10:.1f}" text-anchor="middle" class="pl b">{lab}</text>')
    o.append('<defs><marker id="fa" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" class="ahd"/></marker></defs>')
    o.append(f'<text x="{W - 8}" y="18" text-anchor="end" class="pl">EAST (ocean) → right · camera flies right to left · arrows = look direction</text>')
    o.append('</svg>')
    return ''.join(o)

# ---------- overview strip ----------
OVER = [('Title', 'ui', 20, 0), ('Ch1 in: the typo', 'cut', 47.5, 1), ('Fly-in', 'cut', 10, 1), ('Ch1 play: downtown ×5', 'play', 120, 1), ('Drop-off + stamp', 'play', 25, 1), ('Ch1 out', 'cut', 15, 1),
        ('Ch2 in: park', 'cut', 15, 2), ('Ch2 play + diva duet', 'play', 120, 2), ('Drop-off + stamp', 'play', 25, 2), ('Ch2 out', 'cut', 11, 2),
        ('Ch3 in: beach', 'cut', 15, 3), ('Ch3 play + lung set', 'play', 125, 3), ('Drop-off + stamp', 'play', 25, 3), ('Ch3 out', 'cut', 15, 3),
        ('Ch4 in: farm', 'cut', 9, 4), ('Ch4 play: cows', 'play', 105, 4), ('Drop-off + stamp', 'play', 25, 4), ('Ch4 out', 'cut', 10, 4),
        ('Ch5 in', 'cut', 10, 5), ('Ch5 play + Detecto', 'play', 120, 5), ('Ending', 'cut', 14, 6), ('Credits + post', 'ui', 45, 6)]

def mmss(s): s = int(round(s)); return f'{s // 60}:{s % 60:02d}'

def overview():
    tot = sum(d for _, _, d, _ in OVER); cut = sum(d for _, k, d, _ in OVER if k == 'cut'); play = sum(d for _, k, d, _ in OVER if k == 'play')
    bar = ''.join(f'<div class="ob {k}" style="flex:{d} 1 0;--cc:var({CHAP[c]["col"]})" title="{esc(n)} · {mmss(d)}"><span>{esc(n)}</span><i>{mmss(d)}</i></div>' for n, k, d, c in OVER)
    return tot, cut, play, bar

# ---------- page ----------
NEWVO = '<span class="st st-new">new VO</span>'
EXISTS = '<span class="st st-keep">exists</span>'

def scene_html(sc):
    col = CHAP[sc['ch']]['col']
    head = (f'<section class="scene" id="sc{sc["id"]}" style="--cc:var({col})"><div class="sch"><span class="tab">{esc(CHAP[sc["ch"]]["name"])}</span>'
            f'<h3><span class="scid">{esc(sc["id"])}</span> {esc(sc["title"])}</h3>'
            f'<p class="when"><b>Time / haze:</b> {esc(sc["when"])}</p><p class="beat"><b>Story job:</b> {esc(sc["beat"])}</p></div>')
    body = ''
    if sc.get('set') and sc.get('blk'):
        b = sc['blk']
        svg = blocking(sc['set'], f'Top-down blocking for {sc["title"]}', b.get('chars', ()), b.get('moves', ()), b.get('cams', ()), b.get('axis'), b.get('notes', ()))
        extra = ''
        if sc.get('blk2'):
            b2 = sc['blk2']
            extra = '<div class="blk2"><p class="cap2">' + esc(b2['cap']) + '</p>' + blocking(b2['set'], b2['cap'], b2.get('chars', ()), b2.get('moves', ()), b2.get('cams', ()), b2.get('axis'), b2.get('notes', ())) + '</div>'
        body += f'<div class="blkwrap"><div class="tape"></div><div class="blkg">{svg}{extra}</div><p class="rule"><b>Screen-direction rule:</b> {esc(sc.get("rule", ""))}</p></div>'
    elif sc.get('kind') == 'fly':
        body += ('<div class="blkwrap"><div class="tape"></div><p class="rule"><b>Path:</b> drawn on the town map in the fly-in section above. '
                 'One continuous shot, east to west along x = 0, never below 22 m (blocks are ≤19 m) until it is over the open square.</p>'
                 '<div class="oldfly"><b>Current ch1_fly (rejected):</b> starts INSIDE the shop, clips through a building, lands facing the shop again.'
                 '<div class="ofr"><img src="img/old_fly_0.jpg" alt="Old fly-in start: inside the shop" loading="lazy"><img src="img/old_fly_1.jpg" alt="Old fly-in middle" loading="lazy"><img src="img/old_fly_2.jpg" alt="Old fly-in clipping rooftops" loading="lazy"></div></div></div>')
    elif sc.get('kind') == 'ui':
        body += '<div class="blkwrap"><div class="tape"></div><p class="rule"><b>No set blocking:</b> a paper UI layer over the live town. Paper and card materials, stepped 10 fps motion.</p></div>'
    if sc['id'] == 'G1':
        body += ('<div class="calls"><h4>Goal calls, one per chapter (polaroid + subtitles, no mouth needed)</h4><ol>' +
                 ''.join(f'<li><b>Ch {n}</b> {esc(t)} {NEWVO if nv else EXISTS}</li>' for n, t, nv in CALLS) + '</ol></div>')
    shots = ''.join(shot_card(sc, sh) for sh in sc['shots'])
    return head + body + f'<div class="shots">{shots}</div></section>'

def build():
    tot, cut, play, bar = overview()
    n = len(ALL); cnt = {k: sum(1 for _, s in ALL if s['st'] == k) for k in ('KEEP', 'REVISE', 'NEW')}
    opt = sum(1 for _, s in ALL if s.get('opt'))
    vid_cost = sum(cost(s) for _, s in ALL); vid_req = sum(cost(s) for _, s in ALL if not s.get('opt'))
    rows = ''.join(
        f'<tr class="r-{s["st"].lower()}"><td><a href="#s{esc(s["id"])}">{esc(s["id"])}</a></td><td>{esc(sc["title"])}</td><td>{esc(s["type"])}</td>'
        f'<td>{stamp(s["st"], s.get("opt"))}</td><td>{"engine" if engine(s) else "video"}</td><td class="n">{s["dur"]:g}</td><td class="n">{cost(s) or ("(" + str(cond_cost(s)) + ")" if cond_cost(s) else "0")}</td></tr>'
        for sc, s in ALL)
    PRI = [
        ('1', '1.10 Fly-in (10 s)', 300, 'Fixes the broken hand-off. Could be 0 if rendered from the engine and stylised.'),
        ('2', '1.6 Sal: "Kid! Oh, thank God…" (7 s lip-sync)', 210, 'The opening\'s worst mouth mismatch, and the Friday deadline line.'),
        ('3', '1.7 Sal: "Get this town HOOKED!" (5 s lip-sync)', 150, 'Splits the two-speaker clip; the mission line.'),
        ('4', '3.5 Prime hands over the chain (5 s)', 150, 'The chapter 3 payoff that makes "two chains" land.'),
        ('—', 'Subtotal, tier 1', 810, 'Fits the ~815 credits left after this storyboard\'s images.'),
        ('5', '4.4 Phone buzzing in the sand (5 s)', 150, 'Tier 2: chapter 4 turn.'),
        ('6', '3.7 Bro flat reaction (5 s)', 150, 'Tier 2: starts his arc.'),
        ('7', '2.2 + 2.5 Diva reshoots (11 s)', 330, 'Tier 2: only if a new diva look is picked.'),
        ('8', 'Optional: 1.8, 1.4A, 1.2, 2.3, E.4', 780, 'Tier 3: nice-to-have.'),
    ]
    pri = ''.join(f'<tr{" class=sub" if a == "—" else ""}><td>{a}</td><td>{esc(b)}</td><td class="n">{c}</td><td>{esc(d)}</td></tr>' for a, b, c, d in PRI)

    spine = ''.join(f'<div class="spc" style="--cc:var({CHAP[x["ch"]]["col"]})"><div class="tape"></div><h4><span>Ch {x["ch"]}</span> {esc(x["t"])}</h4><p class="dd">{esc(x["d"])}</p>'
                    f'<dl><dt>Want</dt><dd>{esc(x["want"])}</dd><dt>Obstacle</dt><dd>{esc(x["obst"])}</dd><dt>Why here</dt><dd>{esc(x["why"])}</dd><dt>Payoff</dt><dd>{esc(x["pay"])}</dd></dl></div>' for x in SPINE)

    fixes = ''.join(f'<li><b>{esc(a)}.</b> {esc(b)}</li>' for a, b in PROBLEMS_FIXED)
    flytab = ''.join(f'<tr><td>{l}</td><td class="n">{t:g}</td><td class="n">x 0, z {z:g}</td><td class="n">{y:g}</td><td class="n">{p:+g}°</td></tr>' for l, z, y, p, t in FLY)

    nav = ''.join(f'<a href="#sc{sc["id"]}">{esc(sc["id"])}</a>' for sc in S)
    scenes = ''.join(scene_html(sc) for sc in S)

    html = TEMPLATE
    for k, v in dict(NAV=nav, SPINE=spine, BAR=bar, TOT=mmss(tot), CUT=mmss(cut), PLAY=mmss(play), FIXES=fixes, FLYMAP=fly_map(), FLYPROF=fly_profile(), FLYTAB=flytab,
                     SCENES=scenes, ROWS=rows, PRI=pri, N=str(n), NK=str(cnt['KEEP']), NR=str(cnt['REVISE']), NN=str(cnt['NEW']), NOPT=str(opt),
                     VID=str(vid_cost), VIDREQ=str(vid_req), IMG=str(IMGSPENT), LEFT=str(CREDITS_LEFT)).items():
        html = html.replace('{{' + k + '}}', v)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    open(OUT, 'w').write(html)
    print('shots', n, cnt, 'optional', opt, 'video credits all', vid_cost, 'required', vid_req, 'runtime', mmss(tot))

TEMPLATE = open(os.path.join(os.path.dirname(__file__), 'template.html')).read()
if __name__ == '__main__': build()
