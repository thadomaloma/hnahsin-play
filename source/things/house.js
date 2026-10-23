// In: a Mizo house on stilts with its yard, drawn with Ink3D. Every part you can tap is
// named by a Mizo word from the Hnahsin content (build.py checks each one is there).
const HOUSE = (() => {
  const { box, panel, ball, cyl, line, poly, group, solid, add, mul, mix, dot } = Ink3D;

  const WALL = { l: '#f1d9a0', m: '#d9b978', d: '#86683a' }, WALL_LINE = '#b08a4f';
  const WOOD = { l: '#c98d55', m: '#a46c3c', d: '#55361d' }, PLANK = '#6e4626';
  const POST = { l: '#9a6a40', m: '#7a5230', d: '#3e2918' };
  const GRASS = { l: '#a9d67c', m: '#8cc063', d: '#4b6b33' };
  const EARTH = { l: '#c99a6b', m: '#a8774b', d: '#5a3d26' };
  const LEAF = { l: '#86c86e', m: '#5fa451', d: '#2f5a28' };
  const BAMBOO_LEAF = { l: '#a5d483', m: '#79b360', d: '#36602c' };
  const BAMBOO = { l: '#cbd97c', m: '#a3b55a', d: '#4f5a26' };
  const BARK = { l: '#9b7350', m: '#7a5636', d: '#3b2817' };
  const HEN = { l: '#e39a57', m: '#c0733a', d: '#5c3417' };
  const CAT = { l: '#d8d2c9', m: '#aaa197', d: '#4d4640' };
  const CANE = { l: '#e8c584', m: '#c9a05a', d: '#6b5126' };
  const ROOFS = {
    red:   { l: '#e46a4e', m: '#c4503a', d: '#5a2419' },
    green: { l: '#7cc48f', m: '#57a26f', d: '#24452f' },
    blue:  { l: '#79a8de', m: '#5786c4', d: '#1f3456' },
    grey:  { l: '#cdd2d6', m: '#a3abb1', d: '#4c5358' },
  };
  const INSIDE = '#3a2c22', GLOW = '#ffcf6e', FIRE = '#ff9a3c';

  const toward = (v, t, step) => v < t ? Math.min(t, v + step) : Math.max(t, v - step);
  const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

  function init() {
    return { t: 0, door: 0, doorT: 0, win: 0, winT: 0, night: 0, nightT: 0, rain: 0, rainT: 0,
      fire: false, puffs: [], puffClock: 0, hen: 0.6, peck: 0, catWake: 0, roof: 'red' };
  }

  function step(s, dt) {
    s.t += dt;
    s.door = toward(s.door, s.doorT, dt * 1.4);
    s.win = toward(s.win, s.winT, dt * 1.4);
    s.night = toward(s.night, s.nightT, dt * 0.8);
    s.rain = toward(s.rain, s.rainT, dt * 0.8);
    s.catWake = Math.max(0, s.catWake - dt);
    // The hen walks her round in the yard and stops now and then to peck; at night she sleeps.
    const cycle = s.t % 3.2, pecking = cycle > 2.4;
    s.peck = pecking ? Math.sin((cycle - 2.4) / 0.8 * Math.PI * 2) ** 2 : 0;
    if (s.night < 0.5 && !pecking) s.hen += dt * 0.45;
    // Smoke rises through the roof while the fire burns, and drifts with the wind.
    if (s.fire && (s.puffClock -= dt) <= 0) {
      s.puffClock = 0.45;
      s.puffs.push({ x: -25 + (Math.random() - 0.5) * 6, y: 4 + Math.random() * 14, z: 80, age: 0 });
    }
    for (const p of s.puffs) { p.age += dt; p.z += dt * 9; p.x -= dt * 3; p.y += dt * 4; }
    s.puffs = s.puffs.filter(p => p.age < 4.2);
    return true;
  }

  // Night and rain darken every colour except the lights.
  const tint = s => c => mix(mix(c, '#7d8794', s.rain * 0.2), '#1e2850', s.night * 0.52);

  // ---------- the house ----------
  function walls(s) {
    const hz = [];
    for (let z = 26; z < 58; z += 4) hz.push(z);
    const inside = mix(mix(INSIDE, GLOW, s.night * 0.85), FIRE, s.fire ? 0.25 + 0.08 * Math.sin(s.t * 9) : 0);
    const hole = (pts, part) => ({ pts, fill: inside, glow: true, part });
    const shut = (pts, part) => ({ pts, fill: s.win > 0.5 ? inside : WOOD.d, glow: s.win > 0.5, part });
    return {
      xp: [...hz.map(z => ({ pts: [[5.05, -35, z], [5.05, 45, z]], stroke: WALL_LINE, open: true })),
        hole([[5.06, 0, 22], [5.06, 16, 22], [5.06, 16, 48], [5.06, 0, 48]], 'kawngkhar'),
        hole([[5.06, 24, 32], [5.06, 38, 32], [5.06, 38, 44], [5.06, 24, 44]], 'tukverh')],
      yp: [...hz.map(z => ({ pts: [[-55, 45.05, z], [5, 45.05, z]], stroke: WALL_LINE, open: true })),
        hole([[-42, 45.06, 32], [-26, 45.06, 32], [-26, 45.06, 44], [-42, 45.06, 44]], 'tukverh')],
      xn: [...hz.map(z => ({ pts: [[-55.05, -35, z], [-55.05, 45, z]], stroke: WALL_LINE, open: true })),
        shut([[-55.06, 2, 32], [-55.06, 16, 32], [-55.06, 16, 44], [-55.06, 2, 44]], 'tukverh')],
      yn: [...hz.map(z => ({ pts: [[-55, -35.05, z], [5, -35.05, z]], stroke: WALL_LINE, open: true })),
        shut([[-40, -35.06, 32], [-26, -35.06, 32], [-26, -35.06, 44], [-40, -35.06, 44]], 'tukverh')],
    };
  }

  const planks = (n, w, h) => map => Array.from({ length: n - 1 }, (_, i) => ({ pts: [map(w * (i + 1) / n, 1), map(w * (i + 1) / n, h - 1)], stroke: PLANK, open: true }));

  function roof(s) {
    const R = ROOFS[s.roof];
    // The gable ends: a wall-coloured prism under the roof, drawn before the roof sheets.
    const A = [5, -35, 58], B = [-55, -35, 58], C = [-25, -35, 78], A2 = [5, 45, 58], B2 = [-55, 45, 58], C2 = [-25, 45, 78];
    const gl = (y, e) => [62, 66, 70, 74].map(z => { const h = 30 * (78 - z) / 20; return { pts: [[-25 - h, y + e, z], [-25 + h, y + e, z]], stroke: WALL_LINE, open: true }; });
    const gable = solid([
      { pts: [A, B, C], decals: gl(-35, -0.05) }, { pts: [A2, C2, B2], decals: gl(45, 0.05) },
      { pts: [A, A2, B2, B] }, { pts: [A, C, C2, A2] }, { pts: [B, B2, C2, C] },
    ], { pal: WALL, part: 'bang', bias: -1000 });
    const sheet = ex => {
      const z0 = 52.7, z1 = 78, y0 = -43, y1 = 53, th = 3;
      const ribs = [];
      for (let y = y0 + 4; y < y1; y += 4) ribs.push({ pts: [[ex, y, z0 + th + 0.05], [-25, y, z1 + th + 0.05]], stroke: R.d, opacity: 0.45, open: true });
      return Ink3D.hexa([[ex, y0, z0], [-25, y0, z1], [-25, y1, z1], [ex, y1, z0],
        [ex, y0, z0 + th], [-25, y0, z1 + th], [-25, y1, z1 + th], [ex, y1, z0 + th]], { pal: R, part: 'chungkhuh', decals: { zp: ribs } });
    };
    return group([gable, sheet(13), sheet(-63)], { part: 'chungkhuh' });
  }

  function house(s) {
    const items = [];
    for (const x of [-55, -12, 27]) for (const y of [-35, 5, 45]) items.push(box(x - 1.7, x + 1.7, y - 1.7, y + 1.7, 0, 18, { pal: POST, skip: ['zp'] }));
    const deck = [];
    for (let x = 9; x < 30; x += 5) deck.push({ pts: [[x, -38, 22.05], [x, 48, 22.05]], stroke: PLANK, open: true });
    items.push(box(-58, 30, -38, 48, 18, 22, { pal: WOOD, part: 'chhuat', decals: { zp: deck } }));
    items.push(box(-55, 5, -35, 45, 22, 58, { pal: WALL, part: 'bang', decals: walls(s) }));
    items.push(panel([5, 0, 22], [0, 1, 0], [1, 0, 0], 16, 26, 1.4, 100 * s.door, { pal: WOOD, part: 'kawngkhar', decal: planks(3, 16, 26) }));
    items.push(panel([5, 38, 32], [0, -1, 0], [1, 0, 0], 14, 12, 1.2, 105 * s.win, { pal: WOOD, part: 'tukverh', decal: planks(3, 14, 12) }));
    items.push(panel([-26, 45, 32], [-1, 0, 0], [0, 1, 0], 16, 12, 1.2, 105 * s.win, { pal: WOOD, part: 'tukverh', decal: planks(3, 16, 12) }));
    items.push(roof(s));
    // A ladder down from the porch.
    const lad = [];
    for (const y of [1, 13]) lad.push(line([[31, y, 22], [47, y, 0]], { col: WOOD.m, w: 1.6 }));
    for (let i = 1; i < 5; i++) { const t = i / 5; lad.push(line([[31 + 16 * t, 1, 22 - 22 * t], [31 + 16 * t, 13, 22 - 22 * t]], { col: WOOD.l, w: 1.2 })); }
    items.push(group(lad));
    // The lamp under the eaves glows at night.
    const lampOn = mix('#efe6cf', '#ffd04d', s.night);
    items.push(group([
      line([[10, -6, 54.5], [10, -6, 48.6]], { col: '#4b4038', w: 0.6, ink: false }),
      ball([10, -6, 46.5], 2.4, { fill: lampOn, glow: true }),
      ball([10, -6, 46.5], 9, { fill: '#ffd36b', glow: true, ink: false, opacity: 0.32 * s.night, bias: 0.1 }),
    ], { part: 'khawnvâr', shadow: false }));
    return items;
  }

  // ---------- the yard ----------
  function yard(s) {
    const items = [];
    items.push(group([
      cyl([55, -65], 0, 36, 4, 2.8, { pal: BARK }),
      ball([55, -65, 50], 16, { pal: LEAF }), ball([63, -58, 40], 11, { pal: LEAF }),
      ball([46, -70, 41], 11, { pal: LEAF }), ball([57, -72, 62], 10, { pal: LEAF }),
    ], { part: 'thing' }));
    const culms = [[-62, 66, 70], [-57, 71, 62], [-67, 72, 76], [-60, 76, 58], [-69, 63, 66]];
    const sway = Math.sin(s.t * 1.3) * 1.2;
    items.push(group([
      ...culms.map(([x, y, h]) => cyl([x, y], 0, h, 1.6, 1.4, { pal: BAMBOO, bands: [10, 20, 30, 40, 50, 60].filter(z => z < h) })),
      ...culms.map(([x, y, h], i) => ball([x + 3 + sway, y + (i % 2 ? 3 : -3), h + 2], 6, { pal: BAMBOO_LEAF })),
    ], { part: 'mau' }));
    const blooms = [['#f06292', 58, -30], ['#ffc94a', 63, -24], ['#e2483d', 54, -38], ['#f06292', 66, -36], ['#ffc94a', 61, -45]];
    items.push(group(blooms.flatMap(([c, x, y]) => [
      line([[x, y, 0], [x, y, 6]], { col: '#4f8d3a', w: 0.7, ink: false }),
      ball([x, y, 1.8], 2.4, { pal: LEAF }),
      ball([x, y, 7], 2.2, { fill: c }),
    ]), { part: 'pangpâr' }));
    // Fence along the front, with a gap for the path, and along the right-hand side.
    const fence = (a, b, n) => {
      const kids = [];
      for (let i = 0; i <= n; i++) { const p = Ink3D.lerp3(a, b, i / n); kids.push(box(p[0] - 1.1, p[0] + 1.1, p[1] - 1.1, p[1] + 1.1, 0, 13, { pal: POST })); }
      for (let i = 0; i < n; i++) for (const z of [5, 10]) {
        const p = Ink3D.lerp3(a, b, i / n), q = Ink3D.lerp3(a, b, (i + 1) / n);
        kids.push(line([[p[0], p[1], z], [q[0], q[1], z]], { col: WOOD.l, w: 1.1 }));
      }
      return group(kids, { part: 'pal' });
    };
    items.push(fence([84, -84, 0], [84, -6, 0], 6), fence([84, 28, 0], [84, 84, 0], 5), fence([-84, -84, 0], [78, -84, 0], 12));
    items.push(cyl([40, -9], 0, 11, 3.2, 5.4, { pal: CANE, bands: [3.6, 7.2], capFill: '#6b5126', part: 'êm' }));
    items.push(hen(s), cat(s));
    for (const p of s.puffs) {
      const k = p.age / 4.2;
      items.push(ball([p.x, p.y, p.z], 2.5 + k * 7, { fill: '#dcd8d0', opacity: 0.7 * (1 - k), w: 0.5, part: 'meikhu', shadow: false }));
    }
    return items;
  }

  function henPos(s) { const a = s.hen; return [46 + 12 * Math.cos(a), 56 + 12 * Math.sin(a), 0]; }
  function hen(s) {
    const a = s.hen + Math.PI / 2, d = [Math.cos(a), Math.sin(a), 0], sd = [-d[1], d[0], 0], p = henPos(s);
    const sleep = s.night > 0.5, k = sleep ? 0 : s.peck;
    const at = (f, sv, z) => add(add(add(p, mul(d, f)), mul(sd, sv)), [0, 0, z]);
    const head = at(4 + 1.5 * k, 0, (sleep ? 9 : 11.5) - 6 * k);
    return group([
      line([at(0, 1.3, 4), at(0.4, 1.3, 0)], { col: '#f2b431', w: 0.8 }),
      line([at(0, -1.3, 4), at(0.4, -1.3, 0)], { col: '#f2b431', w: 0.8 }),
      poly([at(-3, 0, 8), at(-7.5, 0, 13.5), at(-2.5, 0, 11.5)], { fill: HEN.d }),
      ball(at(0, 0, 7), 4.6, { pal: HEN }),
      ball(head, 2.6, { pal: HEN }),
      ball(add(head, [0, 0, 2.3]), 1.1, { fill: '#d8342c', w: 0.5 }),
      poly([add(head, add(mul(d, 2.2), mul(sd, 0.8))), add(head, add(mul(d, 2.2), mul(sd, -0.8))), add(head, add(mul(d, 4.3), [0, 0, -0.4]))], { fill: '#f2b431', w: 0.6 }),
    ], { part: 'arpui' });
  }

  function cat(s) {
    const C = [19, -26, 22], d = Ink3D.norm([1, 0.7, 0]), sd = [-d[1], d[0], 0];
    const asleep = s.night > 0.5 && s.catWake <= 0;
    const at = (f, sv, z) => add(add(add(C, mul(d, f)), mul(sd, sv)), [0, 0, z]);
    const head = at(asleep ? 3.6 : 3.2, 0, asleep ? 5.2 : 9.6);
    const sw = Math.sin(s.t * (asleep ? 0.8 : 2.2)) * (asleep ? 0.6 : 2);
    const ear = side => poly([add(head, add(mul(sd, 0.6 * side), [0, 0, 2.2])), add(head, add(mul(sd, 2.7 * side), [0, 0, 1.4])), add(head, add(mul(sd, 2 * side), [0, 0, 4.8]))], { pal: CAT });
    const eyes = asleep
      ? [-1, 1].map(e => line([add(head, add(add(mul(d, 2.9), mul(sd, 1.2 * e - 0.5)), [0, 0, 0.5])), add(head, add(add(mul(d, 2.9), mul(sd, 1.2 * e + 0.5)), [0, 0, 0.5]))], { col: '#231e16', w: 0.4, ink: false }))
      : [-1, 1].map(e => ball(add(head, add(add(mul(d, 2.7), mul(sd, 1.2 * e)), [0, 0, 0.6])), 0.6, { fill: '#2f6b3a', ink: false }));
    return group([
      line([at(-3.5, 0, 1.5), at(-6, 2 + sw * 0.3, 2.5), at(-5.5, 4.5 + sw, asleep ? 2 : 7)], { col: CAT.m, w: 1.6 }),
      ball(at(0, 0, 4.4), 4.6, { pal: CAT }),
      ball(head, 3.2, { pal: CAT }),
      ear(1), ear(-1), ...eyes,
    ], { part: 'zawhte' });
  }

  function scene(s) {
    const slab = box(-90, 90, -90, 90, -12, 0, { pal: EARTH, pals: { zp: GRASS }, shadow: false });
    const path = poly([[46, 0, 0.05], [84, 2, 0.05], [84, 24, 0.05], [44, 15, 0.05]], { fill: '#dcc596', part: 'kawng', w: 0.7 });
    return { ground: [slab], groundDecals: [path], clip: [[-90, -90, 0], [90, -90, 0], [90, 90, 0], [-90, 90, 0]], items: [...house(s), ...yard(s)] };
  }

  // ---------- the sky (behind) and the weather (in front) ----------
  const STARS = [[-60, -130], [-20, -118], [30, -132], [62, -108], [-112, -96], [116, -92], [2, -104], [-86, -126], [88, -132], [44, -96], [-40, -100], [122, -118]];
  const SUN = [-102, -114], MOON = [102, -114];
  function cloud(x, y, k, fill) {
    const c = [[0, 0, 11], [12, 3, 9], [-12, 4, 8], [5, -7, 9]].map(([dx, dy, r]) => [x + dx * k, y + dy * k, r * k]);
    return `<g data-p="chhum">${c.map(([a, b, r]) => `<circle cx="${a}" cy="${b}" r="${r}" fill="none" stroke="#231e16" stroke-width="1.8"/>`).join('')}${c.map(([a, b, r]) => `<circle cx="${a}" cy="${b}" r="${r}" fill="${fill}"/>`).join('')}</g>`;
  }
  function sky(s) {
    const top = mix(mix('#a9d8f5', '#9aa6b2', s.rain), '#0e1631', s.night), low = mix(mix('#e3f3fb', '#c9d0d6', s.rain), '#2b3866', s.night);
    let o = `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${low}"/></linearGradient></defs>`;
    o += `<rect x="-140" y="-150" width="280" height="240" fill="url(#sky)" data-p="vân"/>`;
    const sunA = (1 - s.night) * (1 - s.rain * 0.8);
    if (sunA > 0.02) o += `<g data-p="ni" opacity="${sunA.toFixed(2)}"><circle cx="${SUN[0]}" cy="${SUN[1]}" r="20" fill="#ffe28a" opacity=".45"/><circle cx="${SUN[0]}" cy="${SUN[1]}" r="13" fill="#ffc94a" stroke="#231e16" stroke-width="1"/></g>`;
    const nightA = s.night * (1 - s.rain * 0.85);
    if (nightA > 0.02) {
      o += `<g data-p="arsi" opacity="${nightA.toFixed(2)}">${STARS.map(([x, y], i) => { const r = 1.6 + (i % 3) * 0.6, tw = 0.6 + 0.4 * Math.sin(s.t * 2 + i); return `<path d="M${x} ${y - r * 2}L${x + r * 0.6} ${y - r * 0.6}L${x + r * 2} ${y}L${x + r * 0.6} ${y + r * 0.6}L${x} ${y + r * 2}L${x - r * 0.6} ${y + r * 0.6}L${x - r * 2} ${y}L${x - r * 0.6} ${y - r * 0.6}Z" fill="#fff4c2" opacity="${tw.toFixed(2)}"/>`; }).join('')}<rect x="-130" y="-140" width="260" height="50" fill="transparent"/></g>`;
      o += `<g data-p="thla" opacity="${nightA.toFixed(2)}"><circle cx="${MOON[0]}" cy="${MOON[1]}" r="11" fill="#f6efcf" stroke="#231e16" stroke-width="1"/><circle cx="${MOON[0] + 5}" cy="${MOON[1] - 3}" r="9.5" fill="${top}"/></g>`;
    }
    // Hills far behind.
    const hill = (pts, fill) => `<path data-p="tlang" d="M-140 90${pts}L140 90Z" fill="${mix(mix(fill, '#8d9aa6', s.rain * 0.5), '#1c2a52', s.night * 0.7)}" stroke="#231e16" stroke-width=".8" stroke-opacity=".35"/>`;
    o += hill('L-140 -52Q-110 -84 -76 -66Q-44 -98 -6 -74Q30 -100 64 -72Q96 -92 140 -58', '#a8cfb4');
    o += hill('L-140 -30Q-104 -62 -64 -42Q-20 -66 22 -44Q66 -70 140 -34', '#86b996');
    // A small white cloud drifts by; rain brings grey ones.
    const cx = ((s.t * 5 + 250) % 340) - 170;
    if (s.rain < 0.95) o += `<g opacity="${(1 - s.rain).toFixed(2)}">${cloud(cx, -104, 0.8, mix('#ffffff', '#55608a', s.night))}</g>`;
    return o;
  }
  function over(s) {
    if (s.rain < 0.02) return '';
    let o = `<g opacity="${s.rain.toFixed(2)}">`;
    o += cloud(-70, -118, 1.2, mix('#c6ccd3', '#3d4766', s.night)) + cloud(15, -128, 1.05, mix('#b4bcc5', '#3d4766', s.night)) + cloud(88, -112, 1.15, mix('#c6ccd3', '#3d4766', s.night));
    o += '<g data-p="ruah" stroke="#5f7fb5" stroke-width="1.1" stroke-linecap="round">';
    for (let i = 0; i < 70; i++) {
      const x = -135 + rnd(i, 1) * 280, y = -120 + ((rnd(i, 2) * 200 + s.t * 210) % 200);
      o += `<path d="M${x.toFixed(1)} ${y.toFixed(1)}l-2.5 9"/>`;
    }
    return o + '</g></g>';
  }

  // ---------- labels ----------
  function anchors(s) {
    const a = [
      { part: 'kawngkhar', p: [6, 8, 36], n: [1, 0, 0] },
      { part: 'tukverh', p: [6, 31, 40], n: [1, 0, 0] },
      { part: 'bang', p: [-14, 45, 52], n: [0, 1, 0] },
      { part: 'chhuat', p: [24, -22, 22], n: [0, 0, 1] },
      { part: 'chungkhuh', p: [-4, 20, 68], n: [0.55, 0, 0.83] },
      { part: 'khawnvâr', p: [10, -6, 45] },
      { part: 'zawhte', p: [21, -24, 33] },
      { part: 'arpui', p: add(henPos(s), [0, 0, 14]) },
      { part: 'êm', p: [40, -9, 12] },
      { part: 'kawng', p: [70, 12, 0] },
      { part: 'pal', p: [84, -50, 13] },
      { part: 'thing', p: [55, -65, 64] },
      { part: 'mau', p: [-64, 70, 80] },
      { part: 'pangpâr', p: [60, -36, 9] },
      { part: 'tlang', s: [-104, -50] },
    ];
    if (s.night < 0.5 && s.rain < 0.5) a.push({ part: 'ni', s: [SUN[0], SUN[1] + 13] });
    if (s.night > 0.5 && s.rain < 0.5) a.push({ part: 'thla', s: [MOON[0], MOON[1] + 11] }, { part: 'arsi', s: STARS[1] });
    if (s.rain > 0.5) a.push({ part: 'chhum', s: [15, -120] }, { part: 'ruah', s: [-40, -70] });
    else a.push({ part: 'vân', s: [20, -124] });
    if (s.puffs.length > 3) a.push({ part: 'meikhu', p: [-30, 14, 104] });
    return a;
  }

  function tap(s, part) {
    // At night a tap wakes the cat for a moment; the hen sleeps on.
    if (part === 'zawhte' && s.night > 0.5) { s.catWake = 3; return 'harh'; }
    if (part === 'arpui' && s.night > 0.5) return 'muhil';
    return null;
  }

  return {
    id: 'house', name: 'In', sub: 'a Mizo house',
    view: { yaw: 55, pitch: 30, box: '-130 -140 260 222', centre: [0, -30] },
    words: ['in', 'kawngkhar', 'tukverh', 'bang', 'chhuat', 'chungkhuh', 'khawnvâr', 'zawhte', 'arpui', 'êm', 'kawng', 'pal', 'thing', 'mau', 'pangpâr', 'tlang', 'ni', 'thla', 'arsi', 'chhum', 'ruah', 'vân', 'meikhu', 'mei', 'hawng', 'khar', 'zân', 'zîng', 'harh', 'muhil'],
    init, step, tint, scene, sky, over, anchors, tap,
    swatches: { label: 'Roof', key: 'roof', list: Object.fromEntries(Object.entries(ROOFS).map(([k, v]) => [k, v.m])) },
    actions: [
      { label: s => s.doorT ? 'Close door' : 'Open door', word: s => s.doorT ? 'khar' : 'hawng', run: s => { s.doorT = s.doorT ? 0 : 1; } },
      { label: s => s.winT ? 'Close windows' : 'Open windows', word: s => s.winT ? 'khar' : 'hawng', run: s => { s.winT = s.winT ? 0 : 1; } },
      { label: s => s.nightT ? 'Morning' : 'Night', word: s => s.nightT ? 'zîng' : 'zân', run: s => { s.nightT = s.nightT ? 0 : 1; } },
      { label: s => s.rainT ? 'Stop rain' : 'Rain', word: s => s.rainT ? null : 'ruah', run: s => { s.rainT = s.rainT ? 0 : 1; } },
      { label: s => s.fire ? 'Fire out' : 'Light fire', word: s => s.fire ? null : 'mei', run: s => { s.fire = !s.fire; } },
    ],
  };
})();
