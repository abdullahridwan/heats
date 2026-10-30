# Heats postal stamps. One stamp per heat, each with its own scene, palette and soul.
# stamp(key, heat_no, date, uid, postmark=True) returns an inline SVG string (viewBox 200x250).

def _perf_mask(uid, w=200, h=250, r=5.2, step=12.5):
    holes = []
    x = step / 2
    while x < w:
        holes.append(f'<circle cx="{x:.1f}" cy="0" r="{r}"></circle><circle cx="{x:.1f}" cy="{h}" r="{r}"></circle>')
        x += step
    y = step / 2
    while y < h:
        holes.append(f'<circle cx="0" cy="{y:.1f}" r="{r}"></circle><circle cx="{w}" cy="{y:.1f}" r="{r}"></circle>')
        y += step
    return f'<mask id="{uid}pf"><rect width="{w}" height="{h}" fill="#fff"></rect><g fill="#000">{"".join(holes)}</g></mask>'


def _trees(xs, base, col, s=1.0):
    return ''.join(f'<circle cx="{x}" cy="{base - 9*s}" r="{11*s}" fill="{col}"></circle><circle cx="{x+9*s}" cy="{base - 4*s}" r="{9*s}" fill="{col}"></circle>' for x in xs)


# Each scene draws into the art window (x 14..186, y 14..182) and defines its own palette.
SCENES = {
    # Heat 001: Central Park in fall. Bow Bridge over the Lake, leaves coming down.
    'central_fall': dict(
        deno='#7A2E12',
        park='Central Park', name='Bow Bridge', paper='#FFF8EC', ink='#7A2E12', accent='#E2662A',
        art=lambda u: (
            f'<defs><linearGradient id="{u}sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F9D9A8"></stop><stop offset="1" stop-color="#F3A65C"></stop></linearGradient></defs>'
            f'<rect x="14" y="14" width="172" height="168" fill="url(#{u}sk)"></rect>'
            '<g fill="#C9784A" opacity=".55"><rect x="30" y="58" width="10" height="44"></rect><rect x="44" y="40" width="8" height="62"></rect><rect x="56" y="66" width="14" height="36"></rect><rect x="136" y="50" width="9" height="52"></rect><rect x="150" y="62" width="16" height="40"></rect></g>'
            + _trees([22, 70, 104, 160], 112, '#B4471B', 1.3) + _trees([40, 128], 116, '#E2662A', 1.1) +
            '<rect x="14" y="120" width="172" height="62" fill="#3E6E78"></rect>'
            '<path d="M24 128 Q100 92 176 128" fill="none" stroke="#FFF3DC" stroke-width="7"></path>'
            '<path d="M24 128 Q100 100 176 128" fill="none" stroke="#7A2E12" stroke-width="1.6"></path>'
            '<g stroke="#FFF3DC" stroke-width="1.4">' + ''.join(f'<line x1="{x}" y1="{128 - (36 - abs(100-x)*0.45)*0.9:.0f}" x2="{x}" y2="128"></line>' for x in range(36, 170, 10)) + '</g>'
            '<g stroke="#9CC3C6" stroke-width="1.2" opacity=".8"><line x1="40" y1="146" x2="80" y2="146"></line><line x1="110" y1="154" x2="160" y2="154"></line><line x1="60" y1="166" x2="96" y2="166"></line></g>'
            '<g fill="#E2662A"><path d="M150 30 l4 6 l-6 2 z"></path><path d="M60 26 l5 4 l-6 3 z"></path><path d="M120 44 l3 6 l-6 0 z"></path></g>'
        ),
    ),
    # Heat 002: Central Park at dusk. The Reservoir and the south skyline.
    'central_dusk': dict(
        deno='#FFFFFF',
        park='Central Park', name='The Reservoir', paper='#F4F1FF', ink='#241A5C', accent='#FF7A59',
        art=lambda u: (
            f'<defs><linearGradient id="{u}sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B2F8F"></stop><stop offset=".55" stop-color="#C45A9A"></stop><stop offset="1" stop-color="#FF9E6B"></stop></linearGradient></defs>'
            f'<rect x="14" y="14" width="172" height="168" fill="url(#{u}sk)"></rect>'
            '<circle cx="150" cy="52" r="16" fill="#FFD8A8" opacity=".9"></circle>'
            '<g fill="#241A5C"><rect x="24" y="70" width="12" height="44"></rect><rect x="38" y="44" width="7" height="70"></rect><rect x="47" y="60" width="16" height="54"></rect><rect x="66" y="30" width="5" height="84"></rect><rect x="73" y="66" width="14" height="48"></rect><rect x="90" y="52" width="10" height="62"></rect><rect x="103" y="38" width="6" height="76"></rect><rect x="112" y="74" width="18" height="40"></rect><rect x="133" y="62" width="9" height="52"></rect><rect x="146" y="80" width="22" height="34"></rect><rect x="170" y="70" width="10" height="44"></rect></g>'
            '<g fill="#FFD8A8" opacity=".75"><rect x="40" y="52" width="2" height="2"></rect><rect x="50" y="70" width="2" height="2"></rect><rect x="56" y="80" width="2" height="2"></rect><rect x="92" y="62" width="2" height="2"></rect><rect x="105" y="48" width="2" height="2"></rect><rect x="116" y="84" width="2" height="2"></rect><rect x="150" y="90" width="2" height="2"></rect></g>'
            '<rect x="14" y="114" width="172" height="68" fill="#2C2470"></rect>'
            '<g fill="#C45A9A" opacity=".55"><rect x="38" y="118" width="7" height="30"></rect><rect x="66" y="118" width="5" height="40"></rect><rect x="103" y="118" width="6" height="36"></rect></g>'
            '<g stroke="#FFB38A" stroke-width="1.6" opacity=".9"><line x1="120" y1="130" x2="172" y2="130"></line><line x1="128" y1="140" x2="166" y2="140"></line><line x1="136" y1="150" x2="158" y2="150"></line></g>'
            '<path d="M14 176 Q60 166 100 172 T186 168 V182 H14 Z" fill="#1A1446"></path>'
        ),
    ),
    # Heat 003: Prospect Park. The Grand Army Plaza arch through autumn trees.
    'prospect': dict(
        deno='#16443A',
        park='Prospect Park', name='Grand Army Plaza', paper='#EEF7F2', ink='#16443A', accent='#D9A21B',
        art=lambda u: (
            '<rect x="14" y="14" width="172" height="168" fill="#BFE3D4"></rect>'
            '<circle cx="162" cy="40" r="12" fill="#FFF2C4"></circle>'
            '<g fill="#EADFC8" stroke="#16443A" stroke-width="1.6"><path d="M52 150 V70 H148 V150 H122 V110 A22 22 0 0 0 78 110 V150 Z"></path></g>'
            '<rect x="48" y="62" width="104" height="10" fill="#16443A"></rect>'
            '<g fill="#16443A"><path d="M84 62 l8 -16 l8 4 l8 -4 l8 16 z"></path><circle cx="100" cy="42" r="5"></circle></g>'
            '<g stroke="#16443A" stroke-width="1"><line x1="60" y1="80" x2="70" y2="80"></line><line x1="130" y1="80" x2="140" y2="80"></line><line x1="60" y1="92" x2="70" y2="92"></line><line x1="130" y1="92" x2="140" y2="92"></line></g>'
            + _trees([20, 34], 150, '#D9A21B', 1.4) + _trees([160, 174], 150, '#C2571E', 1.4) +
            '<rect x="14" y="150" width="172" height="32" fill="#16443A"></rect>'
            '<path d="M78 150 L66 182 H134 L122 150 Z" fill="#E9E1CC"></path>'
        ),
    ),
    # Heat 004: Hudson River Greenway. The George Washington Bridge and the Little Red Lighthouse.
    'hudson': dict(
        deno='#0D2E5C',
        park='Hudson River Greenway', name='Little Red Lighthouse', paper='#EEF5FF', ink='#0D2E5C', accent='#E23B2E',
        art=lambda u: (
            f'<defs><linearGradient id="{u}sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FD0F5"></stop><stop offset="1" stop-color="#E6F4FF"></stop></linearGradient></defs>'
            f'<rect x="14" y="14" width="172" height="168" fill="url(#{u}sk)"></rect>'
            '<path d="M14 84 L60 70 L120 76 L186 66 V110 H14 Z" fill="#5E8C6A"></path>'
            '<g fill="#7A8794"><rect x="40" y="36" width="9" height="84"></rect><rect x="146" y="36" width="9" height="84"></rect></g>'
            '<g fill="none" stroke="#7A8794" stroke-width="1.6"><path d="M14 98 Q44 34 44 36 Q100 96 150 36 Q186 70 186 70"></path></g>'
            '<rect x="14" y="98" width="172" height="5" fill="#5C6670"></rect>'
            '<g stroke="#7A8794" stroke-width=".8">' + ''.join(f'<line x1="{x}" y1="{98 - 40 + abs(97 - x) * 0.66:.0f}" x2="{x}" y2="98"></line>' for x in range(56, 140, 8)) + '</g>'
            '<rect x="14" y="110" width="172" height="72" fill="#2C6CB0"></rect>'
            '<g stroke="#9FD0F5" stroke-width="1.4" opacity=".8"><line x1="24" y1="130" x2="70" y2="130"></line><line x1="30" y1="150" x2="90" y2="150"></line><line x1="20" y1="168" x2="60" y2="168"></line></g>'
            '<path d="M118 182 L126 128 H146 L154 182 Z" fill="#E23B2E"></path>'
            '<rect x="124" y="118" width="24" height="12" fill="#0D2E5C"></rect><path d="M122 118 L136 106 L150 118 Z" fill="#E23B2E"></path>'
            '<rect x="131" y="121" width="10" height="6" fill="#FFE07A"></rect>'
            '<path d="M104 170 Q136 162 168 170 V182 H104 Z" fill="#3E4A3E"></path>'
        ),
    ),
    # Heat 005: Flushing Meadows. The Unisphere and its fountains.
    'flushing': dict(
        deno='#3A1150',
        park='Flushing Meadows', name='The Unisphere', paper='#FFF4F7', ink='#3A1150', accent='#3BC4C9',
        art=lambda u: (
            '<rect x="14" y="14" width="172" height="168" fill="#F7C9D8"></rect>'
            '<g fill="#FBE3EA"><circle cx="100" cy="86" r="66"></circle></g>'
            '<g fill="none" stroke="#3A1150" stroke-width="2.2"><circle cx="100" cy="86" r="48"></circle><ellipse cx="100" cy="86" rx="22" ry="48"></ellipse><ellipse cx="100" cy="86" rx="40" ry="48"></ellipse><line x1="52" y1="86" x2="148" y2="86"></line><ellipse cx="100" cy="86" rx="48" ry="20"></ellipse></g>'
            '<g fill="#3BC4C9"><path d="M70 66 q10 -8 22 -2 q4 10 -6 14 q-12 2 -16 -12z"></path><path d="M106 92 q14 -6 22 4 q-2 12 -14 12 q-10 -4 -8 -16z"></path><path d="M114 56 q8 -2 12 6 q-6 6 -12 -6z"></path></g>'
            '<g fill="none" stroke="#3A1150" stroke-width="1.4"><path d="M64 46 Q100 26 136 46"></path></g>'
            '<rect x="96" y="134" width="8" height="14" fill="#3A1150"></rect>'
            '<rect x="14" y="148" width="172" height="34" fill="#3BC4C9"></rect>'
            '<g stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" fill="none">' + ''.join(f'<path d="M{x} 160 Q{x+3} 132 {x+6} 146"></path>' for x in (30, 52, 140, 160)) + '</g>'
            '<g stroke="#E6FBFB" stroke-width="1.2"><line x1="24" y1="172" x2="76" y2="172"></line><line x1="120" y1="176" x2="176" y2="176"></line></g>'
        ),
    ),
    # Heat 006: Brooklyn Bridge Park at night. The bridge towers and the lower Manhattan lights.
    'bbp': dict(
        deno='#F2C14E',
        park='Brooklyn Bridge Park', name='Pier 1 at night', paper='#FFFBEA', ink='#101A33', accent='#F2C14E',
        art=lambda u: (
            '<rect x="14" y="14" width="172" height="168" fill="#101A33"></rect>'
            '<g fill="#F2C14E"><circle cx="34" cy="30" r="1.4"></circle><circle cx="70" cy="22" r="1"></circle><circle cx="120" cy="34" r="1.2"></circle><circle cx="170" cy="26" r="1.4"></circle><circle cx="150" cy="46" r="1"></circle></g>'
            '<circle cx="160" cy="36" r="10" fill="#FFF3C4"></circle><circle cx="165" cy="33" r="9" fill="#101A33"></circle>'
            '<g fill="#22305A"><rect x="18" y="86" width="14" height="46"></rect><rect x="34" y="62" width="10" height="70"></rect><rect x="46" y="76" width="16" height="56"></rect><rect x="150" y="80" width="14" height="52"></rect><rect x="166" y="66" width="18" height="66"></rect></g>'
            '<g fill="#F2C14E" opacity=".8"><rect x="37" y="70" width="2" height="2"></rect><rect x="49" y="86" width="2" height="2"></rect><rect x="55" y="96" width="2" height="2"></rect><rect x="170" y="78" width="2" height="2"></rect><rect x="176" y="92" width="2" height="2"></rect><rect x="153" y="94" width="2" height="2"></rect></g>'
            '<g fill="#B79C7A" stroke="#101A33" stroke-width="1"><path d="M74 132 V48 H96 V132 H90 V78 A5 7 0 0 0 80 78 V132 Z"></path><path d="M120 132 V48 H142 V132 H136 V78 A5 7 0 0 0 126 78 V132 Z"></path></g>'
            '<g fill="none" stroke="#B79C7A" stroke-width="1.2"><path d="M14 112 Q50 60 74 50"></path><path d="M96 50 Q108 86 120 50"></path><path d="M142 50 Q166 64 186 104"></path></g>'
            '<g stroke="#B79C7A" stroke-width=".6" opacity=".7">' + ''.join(f'<line x1="85" y1="52" x2="{x}" y2="116"></line>' for x in range(20, 74, 9)) + ''.join(f'<line x1="131" y1="52" x2="{x}" y2="116"></line>' for x in range(146, 186, 9)) + '</g>'
            '<rect x="14" y="114" width="172" height="5" fill="#B79C7A"></rect>'
            '<rect x="14" y="132" width="172" height="50" fill="#16244A"></rect>'
            '<g stroke="#F2C14E" stroke-width="1.4" opacity=".7"><line x1="38" y1="142" x2="44" y2="142"></line><line x1="36" y1="152" x2="46" y2="152"></line><line x1="170" y1="146" x2="178" y2="146"></line><line x1="80" y1="140" x2="90" y2="140"></line><line x1="126" y1="144" x2="136" y2="144"></line></g>'
        ),
    ),
}


def stamp(key, heat_no, date, uid, postmark=True, size='100%'):
    s = SCENES[key]
    ink, paper, accent = s['ink'], s['paper'], s['accent']
    pm = ''
    if postmark:
        pm = (f'<g opacity=".72" transform="rotate(-14 150 196)" fill="none" stroke="#1B1B2A" stroke-width="1.6">'
              f'<circle cx="150" cy="196" r="30"></circle><circle cx="150" cy="196" r="25"></circle>'
              f'<path d="M70 186 q8 -5 16 0 t16 0 t16 0 t16 0 M70 196 q8 -5 16 0 t16 0 t16 0 t16 0 M70 206 q8 -5 16 0 t16 0 t16 0 t16 0"></path></g>'
              f'<g opacity=".72" transform="rotate(-14 150 196)" fill="#1B1B2A" font-family="DM Mono, monospace" font-weight="600" text-anchor="middle">'
              f'<text x="150" y="190" font-size="6.5" letter-spacing="1">HEATS NYC</text><text x="150" y="200" font-size="7.5">{date}</text><text x="150" y="209" font-size="6">FINISHED</text></g>')
    return (
        f'<svg width="{size}" viewBox="-4 -4 208 258" role="img" aria-label="Heat {heat_no} stamp, {s["park"]}, {s["name"]}">'
        f'<defs>{_perf_mask(uid)}<clipPath id="{uid}art"><rect x="14" y="14" width="172" height="168"></rect></clipPath></defs>'
        f'<g mask="url(#{uid}pf)"><rect width="200" height="250" fill="{paper}"></rect>'
        f'<g clip-path="url(#{uid}art)">{s["art"](uid)}</g>'
        f'<rect x="14" y="14" width="172" height="168" fill="none" stroke="{ink}" stroke-width="1.2"></rect>'
        # Denomination the way real stamps do it: bare numerals in the corner, stacked with the issuer.
        f'<g fill="{s.get("deno", "#FFFFFF")}"><text x="22" y="30" font-family="DM Mono, monospace" font-weight="600" font-size="6.5" letter-spacing="2">HEATS NYC</text>'
        f'<text x="20" y="58" font-family="Instrument Serif, serif" font-size="32" letter-spacing="-1">5K</text></g>'
        f'<text x="100" y="208" text-anchor="middle" font-family="Instrument Serif, serif" font-size="21" fill="{ink}">{s["park"] if len(s["park"]) < 18 else s["park"].replace(" Greenway", "")}</text>'
        f'<text x="100" y="224" text-anchor="middle" font-family="DM Mono, monospace" font-weight="600" font-size="7.5" letter-spacing="2" fill="{ink}" opacity=".75">{s["name"].upper()}</text>'
        f'<text x="100" y="238" text-anchor="middle" font-family="DM Mono, monospace" font-size="6.5" letter-spacing="2.5" fill="{ink}" opacity=".55">HEAT {heat_no} / NEW YORK 2026</text>'
        f'{pm}</g></svg>'
    )
