// Heats postal stamps. One stamp per heat, each with its own scene, palette and landmark.
// Port of design/heat-stamp.py. Each scene draws into the art window (x 14..186, y 14..182).
// Output is plain SVG markup meant for dangerouslySetInnerHTML, so every id is prefixed with uid.

export type SceneKey = 'central_fall' | 'central_dusk' | 'prospect' | 'hudson' | 'flushing' | 'bbp' | 'astoria' | 'central_snow' | 'coney' | 'nye'

type Scene = {
  deno: string
  park: string
  name: string
  paper: string
  ink: string
  accent: string
  art: (u: string) => string
}

// Python-compatible rounding: round half to even (Python's format() and round()).
function roundHalfEven(n: number): number {
  const f = Math.floor(n)
  const d = n - f
  if (d > 0.5) return f + 1
  if (d < 0.5) return f
  return f % 2 === 0 ? f : f + 1
}

// Python f'{x:.1f}' equivalent.
function f1(n: number): string {
  return (roundHalfEven(n * 10) / 10).toFixed(1)
}

// Python f'{x:.0f}' equivalent.
function f0(n: number): string {
  return String(roundHalfEven(n))
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Perforated edge: a white stamp with black holes punched along all four sides.
function perfMask(uid: string, w = 200, h = 250, r = 5.2, step = 12.5): string {
  const holes: string[] = []
  for (let x = step / 2; x < w; x += step) {
    holes.push(`<circle cx="${f1(x)}" cy="0" r="${r}"></circle><circle cx="${f1(x)}" cy="${h}" r="${r}"></circle>`)
  }
  for (let y = step / 2; y < h; y += step) {
    holes.push(`<circle cx="0" cy="${f1(y)}" r="${r}"></circle><circle cx="${w}" cy="${f1(y)}" r="${r}"></circle>`)
  }
  return `<mask id="${uid}pf"><rect width="${w}" height="${h}" fill="#fff"></rect><g fill="#000">${holes.join('')}</g></mask>`
}

// Round tree clumps: two overlapping circles per tree.
function trees(xs: number[], base: number, col: string, s = 1.0): string {
  return xs
    .map((x) => `<circle cx="${x}" cy="${base - 9 * s}" r="${11 * s}" fill="${col}"></circle><circle cx="${x + 9 * s}" cy="${base - 4 * s}" r="${9 * s}" fill="${col}"></circle>`)
    .join('')
}

// Point on a quadratic bezier with control values a, b, c at parameter t.
function bez(t: number, a: number, b: number, c: number): number {
  return (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c
}

// Lattice between two arch chords: verticals and diagonals.
function archLattice(p0: number, p1: number, p2: number, lo0: number, lo1: number, lo2: number, xs: [number, number, number], stroke: string, n = 10): string {
  const pts: { x: number; yu: number; yl: number }[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    pts.push({
      x: bez(t, xs[0], xs[1], xs[2]),
      yu: bez(t, p0, p1, p2),
      yl: bez(t, lo0, lo1, lo2),
    })
  }
  let out = ''
  for (let i = 1; i < n; i++) {
    const q = pts[i]
    out += `<line x1="${f1(q.x)}" y1="${f1(q.yu)}" x2="${f1(q.x)}" y2="${f1(q.yl)}"></line>`
  }
  for (let i = 0; i < n; i++) {
    const a = pts[i]
    const b = pts[i + 1]
    out += `<line x1="${f1(a.x)}" y1="${f1(a.yu)}" x2="${f1(b.x)}" y2="${f1(b.yl)}"></line>`
    out += `<line x1="${f1(a.x)}" y1="${f1(a.yl)}" x2="${f1(b.x)}" y2="${f1(b.yu)}"></line>`
  }
  return `<g stroke="${stroke}" stroke-width="1">${out}</g>`
}

// Snow-capped conifers: dark clumps with white caps on top.
function snowTrees(xs: number[], base: number, col: string, cap: string, s = 1.0): string {
  const body = trees(xs, base, col, s)
  const caps = xs
    .map((x) => `<circle cx="${f1(x + 2 * s)}" cy="${f1(base - 19 * s)}" r="${f1(4 * s)}" fill="${cap}"></circle><circle cx="${f1(x + 10 * s)}" cy="${f1(base - 11 * s)}" r="${f1(3 * s)}" fill="${cap}"></circle>`)
    .join('')
  return body + caps
}

const SCENE_DEFS: Record<SceneKey, Scene> = {
  // Heat 001: Central Park in fall. Bow Bridge over the Lake, leaves coming down.
  central_fall: {
    deno: '#7A2E12',
    park: 'Central Park',
    name: 'Bow Bridge',
    paper: '#FFF8EC',
    ink: '#7A2E12',
    accent: '#E2662A',
    art: (u) =>
      `<defs><linearGradient id="${u}sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F9D9A8"></stop><stop offset="1" stop-color="#F3A65C"></stop></linearGradient></defs>` +
      `<rect x="14" y="14" width="172" height="168" fill="url(#${u}sk)"></rect>` +
      '<g fill="#C9784A" opacity=".55"><rect x="30" y="58" width="10" height="44"></rect><rect x="44" y="40" width="8" height="62"></rect><rect x="56" y="66" width="14" height="36"></rect><rect x="136" y="50" width="9" height="52"></rect><rect x="150" y="62" width="16" height="40"></rect></g>' +
      trees([22, 70, 104, 160], 112, '#B4471B', 1.3) +
      trees([40, 128], 116, '#E2662A', 1.1) +
      '<rect x="14" y="120" width="172" height="62" fill="#3E6E78"></rect>' +
      '<path d="M24 128 Q100 92 176 128" fill="none" stroke="#FFF3DC" stroke-width="7"></path>' +
      '<path d="M24 128 Q100 100 176 128" fill="none" stroke="#7A2E12" stroke-width="1.6"></path>' +
      '<g stroke="#FFF3DC" stroke-width="1.4">' +
      Array.from({ length: 14 }, (_, i) => 36 + i * 10)
        .map((x) => `<line x1="${x}" y1="${f0(128 - (36 - Math.abs(100 - x) * 0.45) * 0.9)}" x2="${x}" y2="128"></line>`)
        .join('') +
      '</g>' +
      '<g stroke="#9CC3C6" stroke-width="1.2" opacity=".8"><line x1="40" y1="146" x2="80" y2="146"></line><line x1="110" y1="154" x2="160" y2="154"></line><line x1="60" y1="166" x2="96" y2="166"></line></g>' +
      '<g fill="#E2662A"><path d="M150 30 l4 6 l-6 2 z"></path><path d="M60 26 l5 4 l-6 3 z"></path><path d="M120 44 l3 6 l-6 0 z"></path></g>',
  },

  // Heat 002: Central Park at dusk. The Reservoir and the south skyline.
  central_dusk: {
    deno: '#FFFFFF',
    park: 'Central Park',
    name: 'The Reservoir',
    paper: '#F4F1FF',
    ink: '#241A5C',
    accent: '#FF7A59',
    art: (u) =>
      `<defs><linearGradient id="${u}sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B2F8F"></stop><stop offset=".55" stop-color="#C45A9A"></stop><stop offset="1" stop-color="#FF9E6B"></stop></linearGradient></defs>` +
      `<rect x="14" y="14" width="172" height="168" fill="url(#${u}sk)"></rect>` +
      '<circle cx="150" cy="52" r="16" fill="#FFD8A8" opacity=".9"></circle>' +
      '<g fill="#241A5C"><rect x="24" y="70" width="12" height="44"></rect><rect x="38" y="44" width="7" height="70"></rect><rect x="47" y="60" width="16" height="54"></rect><rect x="66" y="30" width="5" height="84"></rect><rect x="73" y="66" width="14" height="48"></rect><rect x="90" y="52" width="10" height="62"></rect><rect x="103" y="38" width="6" height="76"></rect><rect x="112" y="74" width="18" height="40"></rect><rect x="133" y="62" width="9" height="52"></rect><rect x="146" y="80" width="22" height="34"></rect><rect x="170" y="70" width="10" height="44"></rect></g>' +
      '<g fill="#FFD8A8" opacity=".75"><rect x="40" y="52" width="2" height="2"></rect><rect x="50" y="70" width="2" height="2"></rect><rect x="56" y="80" width="2" height="2"></rect><rect x="92" y="62" width="2" height="2"></rect><rect x="105" y="48" width="2" height="2"></rect><rect x="116" y="84" width="2" height="2"></rect><rect x="150" y="90" width="2" height="2"></rect></g>' +
      '<rect x="14" y="114" width="172" height="68" fill="#2C2470"></rect>' +
      '<g fill="#C45A9A" opacity=".55"><rect x="38" y="118" width="7" height="30"></rect><rect x="66" y="118" width="5" height="40"></rect><rect x="103" y="118" width="6" height="36"></rect></g>' +
      '<g stroke="#FFB38A" stroke-width="1.6" opacity=".9"><line x1="120" y1="130" x2="172" y2="130"></line><line x1="128" y1="140" x2="166" y2="140"></line><line x1="136" y1="150" x2="158" y2="150"></line></g>' +
      '<path d="M14 176 Q60 166 100 172 T186 168 V182 H14 Z" fill="#1A1446"></path>',
  },

  // Heat 003: Prospect Park. The Grand Army Plaza arch through autumn trees.
  prospect: {
    deno: '#16443A',
    park: 'Prospect Park',
    name: 'Grand Army Plaza',
    paper: '#EEF7F2',
    ink: '#16443A',
    accent: '#D9A21B',
    art: () =>
      '<rect x="14" y="14" width="172" height="168" fill="#BFE3D4"></rect>' +
      '<circle cx="162" cy="40" r="12" fill="#FFF2C4"></circle>' +
      '<g fill="#EADFC8" stroke="#16443A" stroke-width="1.6"><path d="M52 150 V70 H148 V150 H122 V110 A22 22 0 0 0 78 110 V150 Z"></path></g>' +
      '<rect x="48" y="62" width="104" height="10" fill="#16443A"></rect>' +
      '<g fill="#16443A"><path d="M84 62 l8 -16 l8 4 l8 -4 l8 16 z"></path><circle cx="100" cy="42" r="5"></circle></g>' +
      '<g stroke="#16443A" stroke-width="1"><line x1="60" y1="80" x2="70" y2="80"></line><line x1="130" y1="80" x2="140" y2="80"></line><line x1="60" y1="92" x2="70" y2="92"></line><line x1="130" y1="92" x2="140" y2="92"></line></g>' +
      trees([20, 34], 150, '#D9A21B', 1.4) +
      trees([160, 174], 150, '#C2571E', 1.4) +
      '<rect x="14" y="150" width="172" height="32" fill="#16443A"></rect>' +
      '<path d="M78 150 L66 182 H134 L122 150 Z" fill="#E9E1CC"></path>',
  },

  // Heat 004: Hudson River Greenway. The George Washington Bridge and the Little Red Lighthouse.
  hudson: {
    deno: '#0D2E5C',
    park: 'Hudson River Greenway',
    name: 'Little Red Lighthouse',
    paper: '#EEF5FF',
    ink: '#0D2E5C',
    accent: '#E23B2E',
    art: (u) =>
      `<defs><linearGradient id="${u}sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FD0F5"></stop><stop offset="1" stop-color="#E6F4FF"></stop></linearGradient></defs>` +
      `<rect x="14" y="14" width="172" height="168" fill="url(#${u}sk)"></rect>` +
      '<path d="M14 84 L60 70 L120 76 L186 66 V110 H14 Z" fill="#5E8C6A"></path>' +
      '<g fill="#7A8794"><rect x="40" y="36" width="9" height="84"></rect><rect x="146" y="36" width="9" height="84"></rect></g>' +
      '<g fill="none" stroke="#7A8794" stroke-width="1.6"><path d="M14 98 Q44 34 44 36 Q100 96 150 36 Q186 70 186 70"></path></g>' +
      '<rect x="14" y="98" width="172" height="5" fill="#5C6670"></rect>' +
      '<g stroke="#7A8794" stroke-width=".8">' +
      Array.from({ length: 11 }, (_, i) => 56 + i * 8)
        .map((x) => `<line x1="${x}" y1="${f0(98 - 40 + Math.abs(97 - x) * 0.66)}" x2="${x}" y2="98"></line>`)
        .join('') +
      '</g>' +
      '<rect x="14" y="110" width="172" height="72" fill="#2C6CB0"></rect>' +
      '<g stroke="#9FD0F5" stroke-width="1.4" opacity=".8"><line x1="24" y1="130" x2="70" y2="130"></line><line x1="30" y1="150" x2="90" y2="150"></line><line x1="20" y1="168" x2="60" y2="168"></line></g>' +
      '<path d="M118 182 L126 128 H146 L154 182 Z" fill="#E23B2E"></path>' +
      '<rect x="124" y="118" width="24" height="12" fill="#0D2E5C"></rect><path d="M122 118 L136 106 L150 118 Z" fill="#E23B2E"></path>' +
      '<rect x="131" y="121" width="10" height="6" fill="#FFE07A"></rect>' +
      '<path d="M104 170 Q136 162 168 170 V182 H104 Z" fill="#3E4A3E"></path>',
  },

  // Heat 005: Flushing Meadows. The Unisphere and its fountains.
  flushing: {
    deno: '#3A1150',
    park: 'Flushing Meadows',
    name: 'The Unisphere',
    paper: '#FFF4F7',
    ink: '#3A1150',
    accent: '#3BC4C9',
    art: () =>
      '<rect x="14" y="14" width="172" height="168" fill="#F7C9D8"></rect>' +
      '<g fill="#FBE3EA"><circle cx="100" cy="86" r="66"></circle></g>' +
      '<g fill="none" stroke="#3A1150" stroke-width="2.2"><circle cx="100" cy="86" r="48"></circle><ellipse cx="100" cy="86" rx="22" ry="48"></ellipse><ellipse cx="100" cy="86" rx="40" ry="48"></ellipse><line x1="52" y1="86" x2="148" y2="86"></line><ellipse cx="100" cy="86" rx="48" ry="20"></ellipse></g>' +
      '<g fill="#3BC4C9"><path d="M70 66 q10 -8 22 -2 q4 10 -6 14 q-12 2 -16 -12z"></path><path d="M106 92 q14 -6 22 4 q-2 12 -14 12 q-10 -4 -8 -16z"></path><path d="M114 56 q8 -2 12 6 q-6 6 -12 -6z"></path></g>' +
      '<g fill="none" stroke="#3A1150" stroke-width="1.4"><path d="M64 46 Q100 26 136 46"></path></g>' +
      '<rect x="96" y="134" width="8" height="14" fill="#3A1150"></rect>' +
      '<rect x="14" y="148" width="172" height="34" fill="#3BC4C9"></rect>' +
      '<g stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" fill="none">' +
      [30, 52, 140, 160].map((x) => `<path d="M${x} 160 Q${x + 3} 132 ${x + 6} 146"></path>`).join('') +
      '</g>' +
      '<g stroke="#E6FBFB" stroke-width="1.2"><line x1="24" y1="172" x2="76" y2="172"></line><line x1="120" y1="176" x2="176" y2="176"></line></g>',
  },

  // Heat 006: Brooklyn Bridge Park at night. The bridge towers and the lower Manhattan lights.
  bbp: {
    deno: '#F2C14E',
    park: 'Brooklyn Bridge Park',
    name: 'Pier 1 at night',
    paper: '#FFFBEA',
    ink: '#101A33',
    accent: '#F2C14E',
    art: () =>
      '<rect x="14" y="14" width="172" height="168" fill="#101A33"></rect>' +
      '<g fill="#F2C14E"><circle cx="34" cy="30" r="1.4"></circle><circle cx="70" cy="22" r="1"></circle><circle cx="120" cy="34" r="1.2"></circle><circle cx="170" cy="26" r="1.4"></circle><circle cx="150" cy="46" r="1"></circle></g>' +
      '<circle cx="160" cy="36" r="10" fill="#FFF3C4"></circle><circle cx="165" cy="33" r="9" fill="#101A33"></circle>' +
      '<g fill="#22305A"><rect x="18" y="86" width="14" height="46"></rect><rect x="34" y="62" width="10" height="70"></rect><rect x="46" y="76" width="16" height="56"></rect><rect x="150" y="80" width="14" height="52"></rect><rect x="166" y="66" width="18" height="66"></rect></g>' +
      '<g fill="#F2C14E" opacity=".8"><rect x="37" y="70" width="2" height="2"></rect><rect x="49" y="86" width="2" height="2"></rect><rect x="55" y="96" width="2" height="2"></rect><rect x="170" y="78" width="2" height="2"></rect><rect x="176" y="92" width="2" height="2"></rect><rect x="153" y="94" width="2" height="2"></rect></g>' +
      '<g fill="#B79C7A" stroke="#101A33" stroke-width="1"><path d="M74 132 V48 H96 V132 H90 V78 A5 7 0 0 0 80 78 V132 Z"></path><path d="M120 132 V48 H142 V132 H136 V78 A5 7 0 0 0 126 78 V132 Z"></path></g>' +
      '<g fill="none" stroke="#B79C7A" stroke-width="1.2"><path d="M14 112 Q50 60 74 50"></path><path d="M96 50 Q108 86 120 50"></path><path d="M142 50 Q166 64 186 104"></path></g>' +
      '<g stroke="#B79C7A" stroke-width=".6" opacity=".7">' +
      [20, 29, 38, 47, 56, 65].map((x) => `<line x1="85" y1="52" x2="${x}" y2="116"></line>`).join('') +
      [146, 155, 164, 173, 182].map((x) => `<line x1="131" y1="52" x2="${x}" y2="116"></line>`).join('') +
      '</g>' +
      '<rect x="14" y="114" width="172" height="5" fill="#B79C7A"></rect>' +
      '<rect x="14" y="132" width="172" height="50" fill="#16244A"></rect>' +
      '<g stroke="#F2C14E" stroke-width="1.4" opacity=".7"><line x1="38" y1="142" x2="44" y2="142"></line><line x1="36" y1="152" x2="46" y2="152"></line><line x1="170" y1="146" x2="178" y2="146"></line><line x1="80" y1="140" x2="90" y2="140"></line><line x1="126" y1="144" x2="136" y2="144"></line></g>',
  },

  // Heat 007: Astoria Park. The Hell Gate Bridge over the East River at golden hour.
  astoria: {
    deno: '#5A2306',
    park: 'Astoria Park',
    name: 'Hell Gate Bridge',
    paper: '#FFF7E6',
    ink: '#5A2306',
    accent: '#B5482A',
    art: (u) =>
      `<defs><linearGradient id="${u}sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBE3A1"></stop><stop offset="1" stop-color="#F0A04B"></stop></linearGradient></defs>` +
      `<rect x="14" y="14" width="172" height="168" fill="url(#${u}sk)"></rect>` +
      '<circle cx="128" cy="104" r="24" fill="#FFF1C2" opacity=".9"></circle>' +
      '<rect x="14" y="120" width="172" height="62" fill="#2F7F7A"></rect>' +
      '<g stroke="#BFEAE2" stroke-width="1.2" opacity=".7"><line x1="22" y1="132" x2="66" y2="132"></line><line x1="100" y1="140" x2="158" y2="140"></line><line x1="30" y1="152" x2="84" y2="152"></line><line x1="118" y1="162" x2="180" y2="162"></line></g>' +
      '<path d="M14 122 Q100 22 186 122" fill="none" stroke="#B5482A" stroke-width="4.5"></path>' +
      '<path d="M14 136 Q100 52 186 136" fill="none" stroke="#B5482A" stroke-width="2.6"></path>' +
      archLattice(122, 22, 122, 136, 52, 136, [14, 100, 186], '#B5482A') +
      '<rect x="14" y="134" width="172" height="3" fill="#7A2E18"></rect>' +
      '<rect x="14" y="160" width="172" height="22" fill="#E4BE84"></rect>' +
      '<line x1="14" y1="160" x2="186" y2="160" stroke="#B5482A" stroke-width="1.4" opacity=".6"></line>' +
      '<g stroke="#3B2A1E" stroke-width="2"><line x1="34" y1="148" x2="34" y2="176"></line><line x1="166" y1="148" x2="166" y2="176"></line></g>' +
      '<g fill="#FFF1C2"><circle cx="34" cy="146" r="3.5"></circle><circle cx="166" cy="146" r="3.5"></circle></g>',
  },

  // Heat 008: Central Park in winter. Gapstow Bridge over the Pond, snow on the trees.
  central_snow: {
    deno: '#24364A',
    park: 'Central Park',
    name: 'Gapstow Bridge',
    paper: '#F4F8FB',
    ink: '#24364A',
    accent: '#8FB3C9',
    art: (u) =>
      `<defs><linearGradient id="${u}sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFE3F0"></stop><stop offset="1" stop-color="#EEF4F8"></stop></linearGradient></defs>` +
      `<rect x="14" y="14" width="172" height="168" fill="url(#${u}sk)"></rect>` +
      '<g fill="#B9C7D4" opacity=".6"><rect x="104" y="72" width="14" height="50"></rect><rect x="120" y="60" width="10" height="62"></rect><rect x="132" y="80" width="18" height="42"></rect><rect x="152" y="66" width="12" height="56"></rect><rect x="166" y="84" width="20" height="38"></rect></g>' +
      snowTrees([24, 62, 146], 118, '#34495E', '#FFFFFF', 1.3) +
      '<rect x="14" y="122" width="172" height="10" fill="#E8F0F6"></rect>' +
      '<rect x="14" y="128" width="172" height="36" fill="#8FB3C9"></rect>' +
      '<g stroke="#FFFFFF" stroke-width="1.2" opacity=".8"><line x1="26" y1="138" x2="60" y2="138"></line><line x1="120" y1="146" x2="170" y2="146"></line><line x1="34" y1="156" x2="78" y2="156"></line></g>' +
      '<path d="M60 152 Q100 96 140 152 L128 152 Q100 110 72 152 Z" fill="#D8D2C6" stroke="#5B6470" stroke-width="1.2"></path>' +
      '<rect x="52" y="148" width="96" height="5" fill="#C9C3B8" stroke="#5B6470" stroke-width="1"></rect>' +
      '<g stroke="#5B6470" stroke-width="1"><line x1="56" y1="140" x2="56" y2="148"></line><line x1="68" y1="132" x2="68" y2="148"></line><line x1="132" y1="132" x2="132" y2="148"></line><line x1="144" y1="140" x2="144" y2="148"></line></g>' +
      '<rect x="14" y="164" width="172" height="18" fill="#F5F9FC"></rect>' +
      '<g fill="#FFFFFF" opacity=".95"><circle cx="30" cy="30" r="1.6"></circle><circle cx="52" cy="48" r="1.3"></circle><circle cx="78" cy="26" r="1.8"></circle><circle cx="104" cy="44" r="1.4"></circle><circle cx="130" cy="30" r="1.7"></circle><circle cx="158" cy="50" r="1.3"></circle><circle cx="174" cy="30" r="1.6"></circle><circle cx="40" cy="78" r="1.4"></circle><circle cx="92" cy="92" r="1.5"></circle><circle cx="180" cy="100" r="1.2"></circle><circle cx="24" cy="106" r="1.3"></circle><circle cx="68" cy="66" r="1.2"></circle><circle cx="140" cy="16" r="1.2"></circle><circle cx="116" cy="70" r="1.4"></circle></g>',
  },

  // Heat 009: Coney Island in winter. The Wonder Wheel and the Parachute Jump at sunset.
  coney: {
    deno: '#14213D',
    park: 'Coney Island',
    name: 'Wonder Wheel',
    paper: '#FFF4EC',
    ink: '#14213D',
    accent: '#9E1B26',
    art: (u) => {
      const cx = 56
      const cy = 92
      const r = 38
      const spokes: string[] = []
      const gondolas: string[] = []
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4
        const x = cx + r * Math.cos(a)
        const y = cy + r * Math.sin(a)
        spokes.push(`<line x1="${f1(cx)}" y1="${f1(cy)}" x2="${f1(x)}" y2="${f1(y)}"></line>`)
        gondolas.push(`<rect x="${f1(x - 3.5)}" y="${f1(y - 3)}" width="7" height="6" fill="${k % 2 === 0 ? '#14213D' : '#B8232E'}"></rect>`)
      }
      return (
        `<defs><linearGradient id="${u}sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC9A8"></stop><stop offset=".7" stop-color="#FF8E7A"></stop><stop offset="1" stop-color="#FFB08A"></stop></linearGradient></defs>` +
        `<rect x="14" y="14" width="172" height="168" fill="url(#${u}sk)"></rect>` +
        '<circle cx="100" cy="128" r="26" fill="#FFE3B8" opacity=".9"></circle>' +
        '<rect x="14" y="128" width="172" height="30" fill="#1D3A6B"></rect>' +
        '<g stroke="#6E95CC" stroke-width="1.2" opacity=".8"><line x1="24" y1="136" x2="80" y2="136"></line><line x1="120" y1="144" x2="176" y2="144"></line><line x1="30" y1="150" x2="70" y2="150"></line></g>' +
        `<path d="M${f1(cx)} ${f1(cy + r)} L40 160 M${f1(cx)} ${f1(cy + r)} L74 160" stroke="#9E1B26" stroke-width="2.4" fill="none"></path>` +
        `<g fill="none" stroke="#9E1B26" stroke-width="3"><circle cx="${cx}" cy="${cy}" r="${r}"></circle></g>` +
        `<g stroke="#9E1B26" stroke-width="1.2">${spokes.join('')}</g>` +
        gondolas.join('') +
        `<circle cx="${cx}" cy="${cy}" r="4" fill="#9E1B26"></circle>` +
        '<path d="M40 160 L40 182 M74 160 L74 182" stroke="#14213D" stroke-width="2"></path>' +
        '<g fill="#14213D"><rect x="146" y="50" width="8" height="132"></rect><path d="M142 50 L150 34 L158 50 Z"></path></g>' +
        '<g stroke="#14213D" stroke-width="1.2" fill="none"><line x1="146" y1="78" x2="154" y2="62"></line><line x1="154" y1="78" x2="146" y2="62"></line><line x1="146" y1="104" x2="154" y2="88"></line><line x1="154" y1="104" x2="146" y2="88"></line><line x1="146" y1="130" x2="154" y2="114"></line><line x1="154" y1="130" x2="146" y2="114"></line></g>' +
        '<g stroke="#14213D" stroke-width="1" opacity=".7"><line x1="136" y1="70" x2="164" y2="70"></line><line x1="138" y1="110" x2="162" y2="110"></line></g>' +
        '<rect x="14" y="158" width="172" height="24" fill="#C98B5B"></rect>' +
        '<g stroke="#8E5A34" stroke-width="1" opacity=".7">' +
        Array.from({ length: 22 }, (_, i) => 14 + (i + 1) * 8)
          .map((x) => `<line x1="${x}" y1="158" x2="${x}" y2="182"></line>`)
          .join('') +
        '</g>' +
        '<rect x="14" y="156" width="172" height="3" fill="#8E5A34"></rect>'
      )
    },
  },

  // Heat 010: Central Park on New Year's Eve. Fireworks over the skyline and the fountain.
  nye: {
    deno: '#FFCC4D',
    park: 'Central Park',
    name: "New Year's Eve",
    paper: '#F7F1DE',
    ink: '#0B0F2E',
    accent: '#FF3EA5',
    art: (u) => {
      const bursts: { x: number; y: number; r: number; col: string }[] = [
        { x: 56, y: 56, r: 15, col: '#FFCC4D' },
        { x: 132, y: 42, r: 17, col: '#FF3EA5' },
        { x: 100, y: 84, r: 13, col: '#CCFF00' },
      ]
      const fireworks = bursts
        .map((b) => {
          let lines = ''
          for (let k = 0; k < 12; k++) {
            const a = (k * Math.PI) / 6
            lines += `<line x1="${f1(b.x + 4 * Math.cos(a))}" y1="${f1(b.y + 4 * Math.sin(a))}" x2="${f1(b.x + b.r * Math.cos(a))}" y2="${f1(b.y + b.r * Math.sin(a))}"></line>`
          }
          return `<g stroke="${b.col}" stroke-width="1.6" stroke-linecap="round">${lines}</g><circle cx="${b.x}" cy="${b.y}" r="1.8" fill="${b.col}"></circle>`
        })
        .join('')
      const windows = [44, 58, 80, 96, 120, 140, 158, 176]
        .map((x, i) => `<rect x="${x}" y="${128 + (i % 3) * 8}" width="2" height="2"></rect>`)
        .join('')
      return (
        `<defs><linearGradient id="${u}sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070B1F"></stop><stop offset="1" stop-color="#1A1140"></stop></linearGradient></defs>` +
        `<rect x="14" y="14" width="172" height="168" fill="url(#${u}sk)"></rect>` +
        '<g fill="#F5E6B3" opacity=".6"><circle cx="30" cy="24" r="1"></circle><circle cx="170" cy="30" r="1"></circle><circle cx="22" cy="76" r="1"></circle><circle cx="178" cy="80" r="1"></circle><circle cx="104" cy="22" r="1"></circle><circle cx="84" cy="30" r="0.8"></circle></g>' +
        fireworks +
        '<g fill="#14163A"><rect x="30" y="112" width="12" height="40"></rect><rect x="46" y="98" width="10" height="54"></rect><rect x="60" y="120" width="16" height="32"></rect><rect x="112" y="108" width="12" height="44"></rect><rect x="128" y="94" width="8" height="58"></rect><rect x="140" y="116" width="18" height="36"></rect><rect x="162" y="104" width="14" height="48"></rect></g>' +
        `<g fill="#FFCC4D" opacity=".7">${windows}</g>` +
        '<rect x="14" y="152" width="172" height="18" fill="#1B1E4A"></rect>' +
        '<g stroke="#FFCC4D" stroke-width="1" opacity=".5"><line x1="48" y1="158" x2="64" y2="158"></line><line x1="104" y1="162" x2="124" y2="162"></line></g>' +
        '<g stroke="#FF3EA5" stroke-width="1" opacity=".5"><line x1="84" y1="166" x2="100" y2="166"></line><line x1="136" y1="156" x2="150" y2="156"></line></g>' +
        '<ellipse cx="100" cy="170" rx="26" ry="6" fill="#0E1238" stroke="#FFCC4D" stroke-width=".8"></ellipse>' +
        '<rect x="97" y="142" width="6" height="26" fill="#0E1238"></rect>' +
        '<ellipse cx="100" cy="142" rx="10" ry="3" fill="#0E1238"></ellipse>' +
        '<path d="M100 140 Q94 128 88 130 M100 140 Q106 128 112 130 M100 140 V126" stroke="#FFCC4D" stroke-width=".9" fill="none" opacity=".7"></path>' +
        '<rect x="14" y="172" width="172" height="10" fill="#05071A"></rect>'
      )
    },
  },
}

// Public scene table: park and landmark names for labels and aria text.
export const SCENES: Record<SceneKey, { park: string; name: string }> = Object.fromEntries(
  (Object.keys(SCENE_DEFS) as SceneKey[]).map((k) => [k, { park: SCENE_DEFS[k].park, name: SCENE_DEFS[k].name }]),
) as Record<SceneKey, { park: string; name: string }>

function sceneOf(key: string): Scene {
  return (SCENE_DEFS as Record<string, Scene | undefined>)[key] ?? SCENE_DEFS.central_fall
}

export function stampSVG(o: { scene: string; heatNo: string; uid: string; postmark?: string | null }): string {
  const s = sceneOf(o.scene)
  const u = o.uid
  const heatNo = esc(o.heatNo)
  const park = s.park.length < 18 ? s.park : s.park.replace(' Greenway', '')
  const pm = o.postmark
    ? `<g opacity=".72" transform="rotate(-14 150 196)" fill="none" stroke="#1B1B2A" stroke-width="1.6">` +
      `<circle cx="150" cy="196" r="30"></circle><circle cx="150" cy="196" r="25"></circle>` +
      `<path d="M70 186 q8 -5 16 0 t16 0 t16 0 t16 0 M70 196 q8 -5 16 0 t16 0 t16 0 t16 0 M70 206 q8 -5 16 0 t16 0 t16 0 t16 0"></path></g>` +
      `<g opacity=".72" transform="rotate(-14 150 196)" fill="#1B1B2A" font-family="DM Mono, monospace" font-weight="600" text-anchor="middle">` +
      `<text x="150" y="190" font-size="6.5" letter-spacing="1">HEATS NYC</text><text x="150" y="200" font-size="7.5">${esc(o.postmark)}</text><text x="150" y="209" font-size="6">FINISHED</text></g>`
    : ''
  return (
    `<svg width="100%" viewBox="-4 -4 208 258" role="img" aria-label="Heat ${heatNo} stamp, ${esc(s.park)}, ${esc(s.name)}">` +
    `<defs>${perfMask(u)}<clipPath id="${u}art"><rect x="14" y="14" width="172" height="168"></rect></clipPath></defs>` +
    `<g mask="url(#${u}pf)"><rect width="200" height="250" fill="${s.paper}"></rect>` +
    `<g clip-path="url(#${u}art)">${s.art(u)}</g>` +
    `<rect x="14" y="14" width="172" height="168" fill="none" stroke="${s.ink}" stroke-width="1.2"></rect>` +
    // Denomination the way real stamps do it: bare numerals in the corner, stacked with the issuer.
    `<g fill="${s.deno}"><text x="22" y="30" font-family="DM Mono, monospace" font-weight="600" font-size="6.5" letter-spacing="2">HEATS NYC</text>` +
    `<text x="20" y="58" font-family="Instrument Serif, serif" font-size="32" letter-spacing="-1">5K</text></g>` +
    `<text x="100" y="208" text-anchor="middle" font-family="Instrument Serif, serif" font-size="21" fill="${s.ink}">${esc(park)}</text>` +
    `<text x="100" y="224" text-anchor="middle" font-family="DM Mono, monospace" font-weight="600" font-size="7.5" letter-spacing="2" fill="${s.ink}" opacity=".75">${esc(s.name.toUpperCase())}</text>` +
    `<text x="100" y="238" text-anchor="middle" font-family="DM Mono, monospace" font-size="6.5" letter-spacing="2.5" fill="${s.ink}" opacity=".55">HEAT ${heatNo} / NEW YORK 2026</text>` +
    `${pm}</g></svg>`
  )
}

export function emptySlotSVG(heatNo: string): string {
  return (
    `<svg width="100%" viewBox="-4 -4 208 258" role="img" aria-label="Heat ${esc(heatNo)}, not stamped yet">` +
    `<rect x="6" y="6" width="188" height="238" rx="8" fill="none" stroke="#d5d8de" stroke-width="2" stroke-dasharray="6 7"></rect>` +
    `<text x="100" y="125" text-anchor="middle" dominant-baseline="middle" font-family="DM Mono, monospace" font-size="28" letter-spacing="1" fill="#b8bcc6">${esc(heatNo)}</text>` +
    `</svg>`
  )
}
