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
  const ASH = { l: '#d6cab2', m: '#b3a487', d: '#6d6350' }, STONE = { l: '#b9b6b0', m: '#8f8b85', d: '#4a4743' };
  const IRON = { l: '#7d7a76', m: '#5a5754', d: '#2d2b29' }, LINEN = { l: '#fbf7ee', m: '#e6e0d2', d: '#8f887a' };
  const PUAN = { l: '#d9474f', m: '#b8343d', d: '#5c1a1f' }, THATCH = { l: '#e2c27a', m: '#c4a25a', d: '#6b5626' };
  const PIG = { l: '#f7c1cb', m: '#e99aab', d: '#7a3f4c' };
  const INSIDE = '#3a2c22', GLOW = '#ffcf6e', FIRE = '#ff9a3c';

  const toward = (v, t, step) => v < t ? Math.min(t, v + step) : Math.max(t, v - step);
  const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

  function init() {
    return { t: 0, door: 0, doorT: 0, win: 0, winT: 0, night: 0, nightT: 0, rain: 0, rainT: 0,
      fire: false, puffs: [], puffClock: 0, hen: 0.6, peck: 0, catWake: 0, roof: 'red',
      inside: 0, insideT: 0, eggs: [{ x: 40, y: 64 }], eggClock: 6, got: 0, pig: 0, pigHop: 0 };
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
    // Now and then she lays an egg behind her (up to three in the yard).
    if (s.night < 0.5 && (s.eggClock -= dt) <= 0) {
      s.eggClock = 10;
      if (s.eggs.length < 3) { const p = henPos(s), a = s.hen + Math.PI / 2; s.eggs.push({ x: p[0] - Math.cos(a) * 5, y: p[1] - Math.sin(a) * 5 }); }
    }
    // The pig trots up and down beside the house, and sleeps at night.
    if (s.night < 0.5) s.pig += dt * 0.3;
    s.pigHop = Math.max(0, s.pigHop - dt);
    s.inside = toward(s.inside, s.insideT, dt * 1.2);
    // Smoke rises from the hearth while the fire burns: out through the roof, or straight up when
    // the roof is off. It drifts with the wind.
    if (s.fire && (s.puffClock -= dt) <= 0) {
      s.puffClock = 0.45;
      const open = s.inside > 0.5;
      s.puffs.push({ x: (open ? -43 : -25) + (Math.random() - 0.5) * 4, y: (open ? -23 : 4 + Math.random() * 14) + (Math.random() - 0.5) * 4, z: open ? 32 : 80, age: 0 });
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

  // dz lifts the roof off when you look inside.
  function roof(s, dz = 0) {
    const R = ROOFS[s.roof], up = p => [p[0], p[1], p[2] + dz];
    // The gable ends: a wall-coloured prism under the roof, drawn before the roof sheets.
    const A = up([5, -35, 58]), B = up([-55, -35, 58]), C = up([-25, -35, 78]), A2 = up([5, 45, 58]), B2 = up([-55, 45, 58]), C2 = up([-25, 45, 78]);
    const gl = (y, e) => [62, 66, 70, 74].map(z => { const h = 30 * (78 - z) / 20; return { pts: [up([-25 - h, y + e, z]), up([-25 + h, y + e, z])], stroke: WALL_LINE, open: true }; });
    const gable = solid([
      { pts: [A, B, C], decals: gl(-35, -0.05) }, { pts: [A2, C2, B2], decals: gl(45, 0.05) },
      { pts: [A, A2, B2, B] }, { pts: [A, C, C2, A2] }, { pts: [B, B2, C2, C] },
    ], { pal: WALL, part: 'bang', bias: -1000 });
    const sheet = ex => {
      const z0 = 52.7 + dz, z1 = 78 + dz, y0 = -43, y1 = 53, th = 3;
      const ribs = [];
      for (let y = y0 + 4; y < y1; y += 4) ribs.push({ pts: [[ex, y, z0 + th + 0.05], [-25, y, z1 + th + 0.05]], stroke: R.d, opacity: 0.45, open: true });
      return Ink3D.hexa([[ex, y0, z0], [-25, y0, z1], [-25, y1, z1], [ex, y1, z0],
        [ex, y0, z0 + th], [-25, y0, z1 + th], [-25, y1, z1 + th], [ex, y1, z0 + th]], { pal: R, part: 'chungkhuh', decals: { zp: ribs } });
    };
    return group([gable, sheet(13), sheet(-63)], { part: 'chungkhuh' });
  }

  // The house is one group drawn as a whole, so the rooms inside sort among themselves:
  // the far walls first, then the things in the room, then the near walls.
  const WALLS = [
    { key: 'xp', n: [1, 0, 0], at: [3.5, 5, -35, 45] }, { key: 'xn', n: [-1, 0, 0], at: [-55, -53.5, -35, 45] },
    { key: 'yp', n: [0, 1, 0], at: [-53.5, 3.5, 43.5, 45] }, { key: 'yn', n: [0, -1, 0], at: [-53.5, 3.5, -35, -33.5] },
  ];
  // Walls facing you are cut down when you look inside, like a doll's house.
  const nearWall = (s, cam, key) => s.inside > 0.01 && dot(WALLS.find(w => w.key === key).n, cam.view) > 0.12;

  function house(s, cam) {
    const kids = [], k = s.inside, deco = walls(s), bias = {};
    for (const x of [-55, -12, 27]) for (const y of [-35, 5, 45]) kids.push(box(x - 1.7, x + 1.7, y - 1.7, y + 1.7, 0, 18, { pal: POST, skip: ['zp'], bias: -3000 }));
    const deck = [];
    for (let x = 9; x < 30; x += 5) deck.push({ pts: [[x, -38, 22.05], [x, 48, 22.05]], stroke: PLANK, open: true });
    kids.push(box(-58, 30, -38, 48, 18, 22, { pal: WOOD, part: 'chhuat', decals: { zp: deck }, bias: -2000 }));
    for (const w of WALLS) {
      const near = nearWall(s, cam, w.key), top = near ? 58 - 32 * k : 58;
      bias[w.key] = near ? 1000 : -1000;
      const dec = near ? deco[w.key].filter(d => d.open && d.pts[0][2] < top - 0.5) : deco[w.key];
      // The inner face shows the same bamboo strips.
      const inner = { xp: 'xn', xn: 'xp', yp: 'yn', yn: 'yp' }[w.key], ix = w.key[0] === 'x';
      const at = w.key[1] === 'p' ? (ix ? w.at[0] : w.at[2]) - 0.05 : (ix ? w.at[1] : w.at[3]) + 0.05;
      const strips = [];
      for (let z = 26; z < top - 0.5; z += 4) strips.push({ pts: ix ? [[at, w.at[2], z], [at, w.at[3], z]] : [[w.at[0], at, z], [w.at[1], at, z]], stroke: WALL_LINE, open: true });
      kids.push(box(...w.at, 22, top, { pal: WALL, part: 'bang', decals: { [w.key]: dec, [inner]: strips }, bias: bias[w.key] }));
    }
    const shown = key => !(nearWall(s, cam, key) && k > 0.2);
    if (shown('xp')) kids.push(panel([5, 0, 22], [0, 1, 0], [1, 0, 0], 16, 26, 1.4, 100 * s.door, { pal: WOOD, part: 'kawngkhar', decal: planks(3, 16, 26), bias: bias.xp + 1 }));
    if (shown('xp')) kids.push(panel([5, 38, 32], [0, -1, 0], [1, 0, 0], 14, 12, 1.2, 105 * s.win, { pal: WOOD, part: 'tukverh', decal: planks(3, 14, 12), bias: bias.xp + 1 }));
    if (shown('yp')) kids.push(panel([-26, 45, 32], [-1, 0, 0], [0, 1, 0], 16, 12, 1.2, 105 * s.win, { pal: WOOD, part: 'tukverh', decal: planks(3, 16, 12), bias: bias.yp + 1 }));
    if (k > 0.01) kids.push(...room(s));
    if (k < 0.98) kids.push({ ...roof(s, 90 * k * k), bias: 2000 });
    // The lamp under the eaves glows at night.
    if (k < 0.2) {
      const lampOn = mix('#efe6cf', '#ffd04d', s.night);
      kids.push(group([
        line([[10, -6, 54.5], [10, -6, 48.6]], { col: '#4b4038', w: 0.6, ink: false }),
        ball([10, -6, 46.5], 2.4, { fill: lampOn, glow: true }),
        ball([10, -6, 46.5], 9, { fill: '#ffd36b', glow: true, ink: false, opacity: 0.32 * s.night, bias: 0.1 }),
      ], { part: 'khawnvâr', shadow: false, bias: 2100 }));
    }
    const items = [group(kids, { at: [-25, 5, 22] })];
    // A ladder down from the porch.
    const lad = [];
    for (const y of [1, 13]) lad.push(line([[31, y, 22], [47, y, 0]], { col: WOOD.m, w: 1.6 }));
    for (let i = 1; i < 5; i++) { const t = i / 5; lad.push(line([[31 + 16 * t, 1, 22 - 22 * t], [31 + 16 * t, 13, 22 - 22 * t]], { col: WOOD.l, w: 1.2 })); }
    items.push(group(lad));
    return items;
  }

  // ---------- inside: the kitchen hearth, a bed, a table, a chair and a mat ----------
  function room(s) {
    const kids = [];
    // The mat lies on the floor, so it is drawn before anything that stands.
    const mat = [poly([[-10, -30, 22.06], [2, -30, 22.06], [2, -16, 22.06], [-10, -16, 22.06]], { fill: '#d8b56a', w: 0.7 })];
    for (let x = -7; x < 2; x += 3) mat.push(line([[x, -30, 22.1], [x, -16, 22.1]], { col: '#b08a4f', w: 0.5, ink: false }));
    kids.push(group(mat, { part: 'chhuatphah', bias: -500 }));
    // The hearth (choka): an earth box with three stones and the pot on them.
    const hearth = [box(-50, -36, -30, -16, 22, 24.5, { pal: ASH, part: 'choka' })];
    for (let i = 0; i < 3; i++) { const a = i / 3 * 2 * Math.PI + 0.4; hearth.push(ball([-43 + Math.cos(a) * 3.6, -23 + Math.sin(a) * 3.6, 25.6], 1.7, { pal: STONE, part: 'choka' })); }
    if (s.fire) {
      const f = Math.sin(s.t * 11) * 0.8;
      hearth.push(ball([-43, -23, 26.5], 7, { fill: '#ffb347', glow: true, ink: false, opacity: 0.35, part: 'mei', shadow: false }));
      hearth.push(poly([[-45, -23, 24.6], [-41, -23, 24.6], [-43 + f * 0.4, -23, 29.5 + f]], { fill: FIRE, glow: true, part: 'mei', w: 0.6 }));
      hearth.push(poly([[-43, -25, 24.6], [-43, -21, 24.6], [-43, -23 - f * 0.4, 28.5 - f]], { fill: '#ffd04d', glow: true, part: 'mei', w: 0.6 }));
    }
    hearth.push(cyl([-43, -23], 26.6, 32.5, 4, 4.8, { pal: IRON, capFill: '#3a3633', part: 'bel' }));
    kids.push(group(hearth, { part: 'choka' }));
    // The bed (khum) with a striped Mizo puan over it.
    const stripes = [];
    for (const [y, c] of [[26, '#231e16'], [29, '#2f8a4a'], [33, '#231e16'], [37, '#ffffff'], [40, '#2f8a4a']]) {
      stripes.push({ pts: [[-51.5, y, 28.55], [-36.5, y, 28.55], [-36.5, y + 1.4, 28.55], [-51.5, y + 1.4, 28.55]], fill: c, w: 0.3 });
    }
    kids.push(group([
      box(-52, -36, 22, 42, 22, 26.5, { pal: WOOD, part: 'khum' }),
      box(-51.5, -36.5, 22.5, 41.5, 26.5, 28.5, { pal: PUAN, part: 'puan', decals: { zp: stripes } }),
      box(-51.5, -47, 24, 40, 28.5, 30.5, { pal: LINEN, part: 'khum' }),
    ], { part: 'khum' }));
    // A low table (dawhkân) and a chair (ṭhutthlêng).
    const legs = (x0, x1, y0, y1, z1, part) => [[x0, y0], [x1 - 1.2, y0], [x0, y1 - 1.2], [x1 - 1.2, y1 - 1.2]].map(([x, y]) => box(x, x + 1.2, y, y + 1.2, 22, z1, { pal: POST, part }));
    kids.push(group([...legs(-28, -14, -4, 10, 29, 'dawhkân'), box(-28.5, -13.5, -4.5, 10.5, 29, 30.5, { pal: WOOD, part: 'dawhkân' })], { part: 'dawhkân' }));
    // The lamp stands on the table and lights the room at night.
    kids.push(group([
      cyl([-21, 3], 30.5, 32, 1.6, 1.2, { pal: IRON }),
      ball([-21, 3, 33.6], 1.8, { fill: mix('#efe6cf', '#ffd04d', s.night), glow: true }),
      ball([-21, 3, 33.6], 16, { fill: '#ffd36b', glow: true, ink: false, opacity: 0.3 * s.night, bias: 5, shadow: false }),
    ], { part: 'khawnvâr', shadow: false }));
    kids.push(group([...legs(-12, -6, 0, 6, 26, 'ṭhutthlêng'), box(-12.3, -5.7, -0.3, 6.3, 26, 27.2, { pal: WOOD, part: 'ṭhutthlêng' }),
      box(-7, -5.7, -0.3, 6.3, 27.2, 34, { pal: WOOD, part: 'ṭhutthlêng' })], { part: 'ṭhutthlêng' }));
    return kids;
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
    items.push(cyl([40, -9], 0, 11, 3.2, 5.4, { pal: CANE, bands: [3.6, 7.2], capFill: '#6b5126', part: 'êm', bias: -1 }));
    items.push(hen(s), cat(s), coop(s), pig(s));
    s.eggs.forEach((e, i) => items.push(ball([e.x, e.y, 2.2], 2.2, { fill: '#fbf3e4', w: 0.7, part: 'artui#' + i })));
    // Eggs you picked up sit in the basket.
    for (let i = 0; i < Math.min(s.got, 4); i++) { const a = i * 1.7; items.push(ball([40 + Math.cos(a) * 2, -9 + Math.sin(a) * 2, 11.6], 1.6, { fill: '#fbf3e4', w: 0.6, part: 'êm', bias: 1, shadow: false })); }
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

  // The hens' coop (arbawm): a small house on legs with a thatch roof and a ramp.
  function coop(s) {
    const kids = [];
    for (const [x, y] of [[62.5, 60.5], [75.5, 60.5], [62.5, 75.5], [75.5, 75.5]]) kids.push(box(x - 0.9, x + 0.9, y - 0.9, y + 0.9, 0, 4, { pal: POST, bias: -1 }));
    const door = mix(INSIDE, GLOW, s.night * 0.4);
    kids.push(box(62, 76, 60, 76, 4, 14, { pal: WALL, decals: { xp: [
      ...[7, 10].map(z => ({ pts: [[76.05, 60, z], [76.05, 64.5, z]], stroke: WALL_LINE, open: true })),
      ...[7, 10].map(z => ({ pts: [[76.05, 71.5, z], [76.05, 76, z]], stroke: WALL_LINE, open: true })),
      { pts: [[76.06, 65, 5], [76.06, 71, 5], [76.06, 71, 11], [76.06, 65, 11]], fill: door, glow: true }] } }));
    const E0 = [60.5, 58.5, 13.5], E1 = [77.5, 58.5, 13.5], R0 = [69, 58.5, 20], E2 = [60.5, 77.5, 13.5], E3 = [77.5, 77.5, 13.5], R1 = [69, 77.5, 20];
    kids.push(solid([{ pts: [E0, E1, R0] }, { pts: [E2, R1, E3] }, { pts: [E0, E2, E3, E1] }, { pts: [E1, E3, R1, R0] }, { pts: [E0, R0, R1, E2] }], { pal: THATCH, bias: 1 }));
    kids.push(line([[76.5, 68, 4.5], [83, 68, 0]], { col: WOOD.l, w: 2.2, bias: 2 }));
    return group(kids, { part: 'arbawm' });
  }

  // The pig (vawk) trots between the house and the bamboo.
  function pig(s) {
    const asleep = s.night > 0.5, dir = Math.cos(s.pig) >= 0 ? 1 : -1;
    const p = [-5 + 28 * Math.sin(s.pig), 68, 0], d = [dir, 0, 0], sd = [0, dir, 0];
    const hop = Math.sin(Math.min(1, s.pigHop / 0.4) * Math.PI) * 4, trot = asleep ? 0 : Math.sin(s.t * 9) * 0.5;
    const at = (f, sv, z) => add(add(add(p, mul(d, f)), mul(sd, sv)), [0, 0, z + hop]);
    const lo = asleep ? -1.6 : 0;
    const head = at(6, 0, 6.8 + lo);
    const kids = [
      ball(at(1, 0, 5.6 + lo), 5.3, { pal: PIG }), ball(at(-3.6, 0, 5.3 + lo), 4.9, { pal: PIG }),
      ball(head, 3.7, { pal: PIG }),
      ball(add(head, add(mul(d, 3.4), [0, 0, -0.6])), 1.7, { fill: '#f08ca0', w: 0.7 }),
      ...[-1, 1].map(e => poly([add(head, add(mul(sd, 1 * e), [0, 0, 2.6])), add(head, add(mul(sd, 3 * e), [0, 0, 2])), add(head, add(add(mul(sd, 2.4 * e), mul(d, 1.6)), [0, 0, 4.6]))], { pal: PIG })),
      line([at(-8, 0, 7 + lo), at(-9.4, 0.8, 8.4 + lo), at(-8.6, 1.6, 9.2 + lo)], { col: PIG.m, w: 0.8 }),
    ];
    kids.push(...(asleep
      ? [-1, 1].map(e => line([add(head, add(add(mul(d, 2.8), mul(sd, 1.4 * e - 0.5)), [0, 0, 1])), add(head, add(add(mul(d, 2.8), mul(sd, 1.4 * e + 0.5)), [0, 0, 1]))], { col: '#231e16', w: 0.4, ink: false }))
      : [-1, 1].map(e => ball(add(head, add(add(mul(d, 2.7), mul(sd, 1.4 * e)), [0, 0, 1])), 0.55, { fill: '#231e16', ink: false }))));
    if (!asleep) for (const [f, sv, ph] of [[3, 2.2, 0], [3, -2.2, Math.PI], [-4, 2.2, Math.PI], [-4, -2.2, 0]]) {
      const sw = Math.sin(s.t * 9 + ph) * 1.2;
      kids.push(line([at(f, sv, 3), at(f + sw, sv, 0 - hop)], { col: PIG.m, w: 1.5 }));
    }
    return group(kids, { part: 'vawk' });
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

  function scene(s, cam) {
    const slab = box(-90, 90, -90, 90, -12, 0, { pal: EARTH, pals: { zp: GRASS }, shadow: false });
    const path = poly([[46, 0, 0.05], [84, 2, 0.05], [84, 24, 0.05], [44, 15, 0.05]], { fill: '#dcc596', part: 'kawng', w: 0.7 });
    return { ground: [slab], groundDecals: [path], clip: [[-90, -90, 0], [90, -90, 0], [90, 90, 0], [-90, 90, 0]], items: [...house(s, cam), ...yard(s)] };
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
  function anchors(s, cam) {
    const inside = s.inside > 0.5, a = [];
    if (!(inside && nearWall(s, cam, 'xp'))) a.push({ part: 'kawngkhar', p: [6, 8, 36], n: [1, 0, 0] }, { part: 'tukverh', p: [6, 31, 40], n: [1, 0, 0] });
    if (!(inside && nearWall(s, cam, 'yp'))) a.push({ part: 'tukverh', p: [-34, 46, 40], n: [0, 1, 0] }, { part: 'bang', p: [-14, 45, 52], n: [0, 1, 0] });
    if (inside) {
      a.push({ part: 'bang', p: [-53.5, 25, 50], n: [1, 0, 0] }, { part: 'bang', p: [-20, -33.5, 50], n: [0, 1, 0] },
        { part: 'choka', p: [-48, -18, 24.5] }, { part: 'bel', p: [-43, -23, 32.5] }, { part: 'khum', p: [-38, 40, 26] },
        { part: 'puan', p: [-44, 32, 28.6] }, { part: 'dawhkân', p: [-26, 8, 30.5] }, { part: 'khawnvâr', p: [-21, 3, 35.4] }, { part: 'ṭhutthlêng', p: [-6.5, 3, 34] },
        { part: 'chhuatphah', p: [-4, -23, 22.1] }, { part: 'chhuat', p: [24, -22, 22], n: [0, 0, 1] });
      // Looking inside, only the room is named, so the labels stay readable.
      if (s.fire) a.push({ part: 'mei', p: [-43, -23, 28] });
      return a;
    } else a.push({ part: 'chungkhuh', p: [-4, 20, 68], n: [0.55, 0, 0.83] }, { part: 'khawnvâr', p: [10, -6, 45] });
    if (s.eggs.length) a.push({ part: 'artui', p: [s.eggs[0].x, s.eggs[0].y, 3.4] });
    const pg = -5 + 28 * Math.sin(s.pig);
    a.push(
      { part: 'chhuat', p: [24, -22, 22], n: [0, 0, 1] },
      { part: 'arbawm', p: [69, 68, 20] },
      { part: 'vawk', p: [pg, 68, 11] },
      { part: 'zawhte', p: [21, -24, 33] },
      { part: 'arpui', p: add(henPos(s), [0, 0, 14]) },
      { part: 'êm', p: [40, -9, 12] },
      { part: 'kawng', p: [70, 12, 0] },
      { part: 'pal', p: [84, -50, 13] },
      { part: 'thing', p: [55, -65, 64] },
      { part: 'mau', p: [-64, 70, 80] },
      { part: 'pangpâr', p: [60, -36, 9] },
      { part: 'tlang', s: [-104, -50] },
    );
    if (s.night < 0.5 && s.rain < 0.5) a.push({ part: 'ni', s: [SUN[0], SUN[1] + 13] });
    if (s.night > 0.5 && s.rain < 0.5) a.push({ part: 'thla', s: [MOON[0], MOON[1] + 11] }, { part: 'arsi', s: STARS[1] });
    if (s.rain > 0.5) a.push({ part: 'chhum', s: [15, -120] }, { part: 'ruah', s: [-40, -70] });
    else a.push({ part: 'vân', s: [20, -124] });
    if (s.puffs.length > 3) a.push({ part: 'meikhu', p: [-30, 14, 104] });
    return a;
  }

  function tap(s, part, id) {
    // Tap an egg to pick it up: it goes into the basket.
    if (part === 'artui') { const i = +id.split('#')[1]; if (s.eggs[i]) { s.eggs.splice(i, 1); s.got++; } return null; }
    if (part === 'vawk' && s.night < 0.5) { s.pigHop = 0.4; return null; }
    // At night a tap wakes the cat for a moment; the hen sleeps on.
    if (part === 'zawhte' && s.night > 0.5) { s.catWake = 3; return 'harh'; }
    if (part === 'arpui' && s.night > 0.5) return 'muhil';
    return null;
  }

  return {
    id: 'house', name: 'In', sub: 'a Mizo house',
    view: { yaw: 55, pitch: 30, box: '-130 -140 260 222', centre: [0, -30] },
    words: ['in', 'kawngkhar', 'tukverh', 'bang', 'chhuat', 'chungkhuh', 'khawnvâr', 'zawhte', 'arpui', 'êm', 'kawng', 'pal', 'thing', 'mau', 'pangpâr', 'tlang', 'ni', 'thla', 'arsi', 'chhum', 'ruah', 'vân', 'meikhu', 'mei', 'hawng', 'khar', 'zân', 'zîng', 'harh', 'muhil',
      'chhûngah', 'choka', 'bel', 'khum', 'puan', 'dawhkân', 'ṭhutthlêng', 'chhuatphah', 'arbawm', 'artui', 'vawk'],
    init, step, tint, scene, sky, over, anchors, tap,
    swatches: { label: 'Roof', key: 'roof', list: Object.fromEntries(Object.entries(ROOFS).map(([k, v]) => [k, v.m])) },
    actions: [
      { label: s => s.insideT ? 'Roof back on' : 'Look inside', word: s => s.insideT ? null : 'chhûngah', run: s => { s.insideT = s.insideT ? 0 : 1; } },
      { label: s => s.doorT ? 'Close door' : 'Open door', word: s => s.doorT ? 'khar' : 'hawng', run: s => { s.doorT = s.doorT ? 0 : 1; } },
      { label: s => s.winT ? 'Close windows' : 'Open windows', word: s => s.winT ? 'khar' : 'hawng', run: s => { s.winT = s.winT ? 0 : 1; } },
      { label: s => s.nightT ? 'Morning' : 'Night', word: s => s.nightT ? 'zîng' : 'zân', run: s => { s.nightT = s.nightT ? 0 : 1; } },
      { label: s => s.rainT ? 'Stop rain' : 'Rain', word: s => s.rainT ? null : 'ruah', run: s => { s.rainT = s.rainT ? 0 : 1; } },
      { label: s => s.fire ? 'Fire out' : 'Light fire', word: s => s.fire ? null : 'mei', run: s => { s.fire = !s.fire; } },
    ],
  };
})();
