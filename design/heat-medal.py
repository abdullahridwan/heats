# Race medal in the style of the site's original enamel medals (art.ts medalSVG, "founding"):
# gold sunburst rim, enamel star in the race colour, black centre disc, gloss.
import math
def _star(cx,cy,R,r,n,rot=-90):
    a0=math.radians(rot); pts=[]
    for i in range(n*2):
        rr=r if i%2 else R; a=a0+i*math.pi/n
        pts.append(f"{cx+rr*math.cos(a):.1f},{cy+rr*math.sin(a):.1f}")
    return ' '.join(pts)
ENAMEL=['#CCFF00','#3BD481','#2ED3C6','#FF8A3D','#B98CFF','#FF5A7A']
def medal(n, park, enamel, uid, size="100%"):
    G=f"url(#{uid}au)"; star=_star(80,80,74,60,20)
    defs=(f'<defs><linearGradient id="{uid}au" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF4C2"></stop><stop offset=".3" stop-color="#E3C065"></stop><stop offset=".55" stop-color="#A07A1C"></stop><stop offset=".78" stop-color="#F3DB8C"></stop><stop offset="1" stop-color="#B8902F"></stop></linearGradient>'
          f'<linearGradient id="{uid}gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".6"></stop><stop offset=".45" stop-color="#fff" stop-opacity="0"></stop></linearGradient>'
          f'<clipPath id="{uid}c"><polygon points="{star}"></polygon></clipPath><path id="{uid}arc" d="M 48 80 A 32 32 0 0 1 112 80" fill="none"></path></defs>')
    rim=f'<g fill="{G}" stroke="{G}" stroke-width="11" stroke-linejoin="round"><polygon points="{star}"></polygon></g>'
    en=f'<g fill="{enamel}" stroke="#9C7A22" stroke-width="1.6" stroke-linejoin="round"><polygon points="{star}"></polygon></g>'
    det=(f'<circle cx="80" cy="80" r="44" fill="#0B0C0A" stroke="{G}" stroke-width="3"></circle>'
         f'<text font-family="DM Mono, monospace" font-weight="600" font-size="7" letter-spacing="2" fill="#E3C065" text-anchor="middle"><textPath href="#{uid}arc" startOffset="50%">{park.upper()}</textPath></text>'
         f'<text x="80" y="99" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="900" font-stretch="125%" font-size="30" fill="{enamel}">{n}</text>'
         f'<text x="80" y="112" text-anchor="middle" font-family="DM Mono, monospace" font-weight="600" font-size="8" letter-spacing="2.5" fill="#E3C065">HEAT</text>')
    gloss=f'<g clip-path="url(#{uid}c)" pointer-events="none"><rect width="160" height="90" fill="url(#{uid}gl)"></rect><ellipse cx="52" cy="40" rx="36" ry="11" fill="#fff" opacity=".3" transform="rotate(-30 52 40)"></ellipse></g>'
    return f'<svg width="{size}" viewBox="0 0 160 160" role="img" aria-label="Heat {n} medal, {park}">{defs}{rim}{en}{det}{gloss}</svg>'
