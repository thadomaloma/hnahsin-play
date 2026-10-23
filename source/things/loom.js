// Puan tah: a Mizo backstrap loom in a room, drawn with Ink3D. Pi sits on a mat with the loom's
// belt round her back and weaves a puan row by row: the shed opens, the shuttle carries the yarn
// across and the beating stick packs it in. Pick the colour of each row, add a pattern, and finish
// the puan to fold it onto the wooden chest. Every word comes from the Hnahsin content.
const LOOM = (() => {
  const { box, ball, cyl, line, poly, group, solid, add, mul, mix, dot } = Ink3D;
  const person = (at, dir, o) => Ink3DPeople.person(at, dir, o);

  const FLOOR = { l: '#dcb07c', m: '#bf9160', d: '#5e4127' }, PLANK = '#9a6e43';
  const WALL = { l: '#f1d9a0', m: '#d9b978', d: '#86683a' }, WALL_LINE = '#b08a4f';
  const WOOD = { l: '#c98d55', m: '#a46c3c', d: '#55361d' }, DARK = { l: '#8a5a36', m: '#6b4429', d: '#33200f' };
  const CANE = { l: '#e8c584', m: '#c9a05a', d: '#6b5126' }, CAT = { l: '#d8d2c9', m: '#aaa197', d: '#4d4640' };
  const WARP = '#efe3c8', ROPE = '#b98a4e', STRAP = '#7a4a2a';
  // The yarns, named by their Mizo colour words.
  const YARNS = { sen: '#c8323d', dum: '#2a2522', 'vâr': '#f4efe4', hring: '#2f8a4a', 'dumpâwl': '#2f5fae', sendang: '#ec7fa6' };
  const shade = c => ({ l: mix(c, '#ffffff', 0.25), m: c, d: mix(c, '#000000', 0.55) });
  const yarnAt = (i, up = 0) => [-26.6 + i * 3.8, 23.5, 6.6 + up];
  const contrast = c => ['dum', 'dumpâwl', 'sen', 'hring'].includes(c) ? 'vâr' : 'dum';

  // ---------- the loom's layout (x runs from the weaver to the far post) ----------
  const BEAM_X = -29, FAR_X = 44, HEDDLE_X = 6, STICK_X = 24, ROW = 1.3, SHOW = 10;   // SHOW rows stay in view; older ones roll onto the beam
  const WY = 7;                                            // the warp is 15 threads wide, from -7 to 7
  const plane = x => 10 + (x - BEAM_X) * 0.06;             // the height of the warp along its length
  const PASS = 1.4;                                        // seconds for one row

  function init() {
    return {
      t: 0, rows: [], yarn: 'sen', pattern: false, auto: false, pass: -1, side: -1, shed: 1, shedV: 1,
      done: [{ bands: ['dum', 'sen', 'vâr', 'sen', 'dum'], motif: true }], finish: -1, piece: null,
    };
  }
  // Start some rows so the loom does not look empty.
  const START = ['sen', 'sen', 'dum', 'dum', 'sen', 'sen', 'vâr', 'sen', 'sen', 'dum', 'dum', 'sen'];

  function startPass(s) {
    if (s.pass >= 0 || s.finish >= 0) return;
    s.pass = 0; s.side = -s.side; s.shed = -s.shed; s.placed = false;
  }

  function step(s, dt) {
    if (!s.rows.length && !s.started) { s.started = true; s.rows = START.map(c => ({ c, m: false })); }
    s.t += dt;
    s.shedV += (s.shed - s.shedV) * Math.min(1, dt * 10);
    if (s.pass >= 0) {
      s.pass += dt / PASS;
      if (!s.placed && s.pass > 0.7) { s.placed = true; s.rows.push({ c: s.yarn, m: s.pattern }); }
      if (s.pass >= 1) { s.pass = -1; if (s.auto) startPass(s); }
    } else if (s.auto) startPass(s);
    if (s.finish >= 0) {
      s.finish += dt / 2.2;
      if (s.finish >= 1) {
        s.done.push(s.piece); if (s.done.length > 6) s.done.shift();
        s.finish = -1; s.piece = null; s.rows = [];
      }
    }
    return true;
  }

  // The bands of a finished piece: its rows, run together and thinned to a few stripes.
  function bandsOf(rows) {
    const out = [];
    for (const r of rows) if (!out.length || out[out.length - 1] !== r.c) out.push(r.c);
    return out.slice(-8);
  }
  function finish(s) {
    if (s.rows.length < 8 || s.finish >= 0) return;
    s.auto = false; s.pass = -1;
    s.piece = { bands: bandsOf(s.rows), motif: s.rows.some(r => r.m) };
    s.finish = 0;
  }

  // ---------- where things are this moment ----------
  function moment(s) {
    const vis = s.finish >= 0 ? [] : s.rows.slice(-SHOW);
    const fell = BEAM_X + 0.6 + vis.length * ROW;           // the edge of the weaving
    const k = s.pass;
    // The beating stick comes forward to pack the new row in.
    const beat = k > 0.55 && k < 0.85 ? Math.sin((k - 0.55) / 0.3 * Math.PI) : 0;
    const bx = fell + 0.6 + 3.4 * (1 - beat);
    // The shuttle crosses from one side to the other.
    const u = k < 0 ? 1 : Math.max(0, Math.min(1, (k - 0.18) / 0.37));
    const ease = u * u * (3 - 2 * u);
    const sy = -s.side * 13 + s.side * 26 * ease;
    return { vis, fell, beat, bx, sy, crossing: k > 0.18 && k < 0.55 };
  }

  // ---------- the room ----------
  const WALLS = [
    { key: 'xn', inner: 'xp', n: [1, 0, 0], at: [-52, -49, -34, 34] }, { key: 'xp', inner: 'xn', n: [-1, 0, 0], at: [61, 64, -34, 34] },
    { key: 'yn', inner: 'yp', n: [0, 1, 0], at: [-49, 61, -34, -31] }, { key: 'yp', inner: 'yn', n: [0, -1, 0], at: [-49, 61, 31, 34] },
  ];
  // A wall you look at from inside the room stands tall; one between you and the room is cut down low.
  const backWall = (cam, w) => dot(w.n, cam.view) > 0;

  function puanStripes(bands, rect, motif, along) {
    // rect: (u0, u1) across the stripes, (v0, v1) along them; along(u, v) → a 3D point
    const [u0, u1, v0, v1] = rect, n = bands.length, out = [];
    bands.forEach((c, i) => {
      const a = u0 + (u1 - u0) * i / n, b = u0 + (u1 - u0) * (i + 1) / n;
      out.push({ pts: [along(a, v0), along(b, v0), along(b, v1), along(a, v1)], fill: YARNS[c], w: 0.3 });
      if (motif && i % 2 === 1) for (let j = 0; j < 5; j++) {
        const m = (a + b) / 2, h = (b - a) * 0.32, vv = v0 + (v1 - v0) * (j + 0.5) / 5, w = (v1 - v0) / 14;
        out.push({ pts: [along(m - h, vv), along(m, vv + w), along(m + h, vv), along(m, vv - w)], fill: YARNS[contrast(c)], w: 0.25 });
      }
    });
    return out;
  }

  function room(s, cam) {
    const items = [];
    for (const w of WALLS) {
      const tall = backWall(cam, w), top = tall ? 48 : 4;
      const ix = w.key[0] === 'x', at = w.key[1] === 'n' ? (ix ? w.at[1] : w.at[3]) + 0.05 : (ix ? w.at[0] : w.at[2]) - 0.05;
      const dec = [];
      for (let z = 4; z < top - 0.5; z += 4) dec.push({ pts: ix ? [[at, w.at[2], z], [at, w.at[3], z]] : [[w.at[0], at, z], [w.at[1], at, z]], stroke: WALL_LINE, open: true });
      if (tall && w.key === 'yn') {
        // A window with the morning outside
        const y = at + 0.01;
        dec.push({ pts: [[8, y, 18], [36, y, 18], [36, y, 37], [8, y, 37]], fill: '#bfe3f7', glow: true, part: 'tukverh', w: 1.2 });
        dec.push({ pts: [[8, y, 18], [36, y, 18], [36, y, 23], [8, y, 23]], fill: '#a9d67c', glow: true, part: 'tukverh', w: 0.6 });
        dec.push({ pts: [[22, y, 18], [22, y, 37]], stroke: WOOD.d, w: 1, open: true, part: 'tukverh' });
        for (const x0 of [-1, 37]) dec.push({ pts: [[x0, y, 18], [x0 + 8, y, 18], [x0 + 8, y, 37], [x0, y, 37]], fill: WOOD.m, part: 'tukverh' });
      }
      if (tall && w.key === 'xn') {
        // A finished puan chei hangs on the wall
        const x = at + 0.01;
        dec.push({ pts: [[x, -24, 41], [x, 12, 41]], stroke: WOOD.d, w: 1.6, open: true });
        dec.push(...puanStripes(['dum', 'sen', 'vâr', 'hring', 'vâr', 'sen', 'dum'], [40, 16, -22, 10], true, (z, y) => [x, y, z]).map(d => ({ ...d, part: 'puan chei' })));
      }
      items.push(box(w.at[0], w.at[1], w.at[2], w.at[3], 0, top, { pal: WALL, part: 'bang', decals: { [w.inner]: dec }, bias: tall ? -1000 : 900 }));
    }
    // The wooden chest with the finished puans folded on top
    const chest = [box(-48, -28, -30, -18, 0, 11, { pal: DARK, part: 'thingrem', decals: {
      yp: [{ pts: [[-48, -17.95, 8.5], [-28, -17.95, 8.5]], stroke: DARK.d, open: true }, { pts: [[-39.5, -17.94, 6], [-36.5, -17.94, 6], [-36.5, -17.94, 9], [-39.5, -17.94, 9]], fill: '#d9b24a', w: 0.5 }],
      xp: [{ pts: [[-27.95, -30, 8.5], [-27.95, -18, 8.5]], stroke: DARK.d, open: true }],
    } })];
    s.done.forEach((p, i) => {
      const z0 = 11 + i * 1.7;
      chest.push(box(-46.5, -29.5, -28.5, -19.5, z0, z0 + 1.5, { pal: shade(YARNS[p.bands[0]]), part: 'puan chei', bias: i + 1,
        decals: { zp: puanStripes(p.bands, [-46.5, -29.5, -28.5, -19.5], p.motif, (x, y) => [x, y, z0 + 1.55]) } }));
    });
    items.push(group(chest, { part: 'thingrem' }));
    // The basket of yarn: tap a ball to weave with that colour
    // The yarn balls sit in a row along a long basket, so each one is easy to tap.
    const yarn = [box(-30, -6, 20, 27, 0, 5, { pal: CANE, part: 'fawng', decals: { zp: [{ pts: [[-29, 21, 5.02], [-7, 21, 5.02], [-7, 26, 5.02], [-29, 26, 5.02]], fill: '#6b5126', w: 0.4 }] } })];
    Object.keys(YARNS).forEach((c, i) => {
      const up = c === s.yarn ? 1.8 + 0.5 * Math.sin(s.t * 4) : 0;
      yarn.push(ball(yarnAt(i, up), 1.9, { pal: shade(YARNS[c]), part: c, bias: 1 }));
    });
    items.push(group(yarn));
    // The cat sleeps by the basket
    const C = [2, 24, 0];
    items.push(group([
      ball(add(C, [0, 0, 3.6]), 4.2, { pal: CAT }),
      ball(add(C, [3.4, 2.2, 2.6]), 2.8, { pal: CAT }),
      poly([add(C, [3.4, 1.0, 5]), add(C, [3.0, 0.4, 7.4]), add(C, [4.6, 0.6, 5.2])], { pal: CAT }),
      poly([add(C, [3.4, 3.4, 5]), add(C, [3.0, 4.2, 7.4]), add(C, [4.6, 3.8, 5.2])], { pal: CAT }),
      line([add(C, [-3.5, -1, 1]), add(C, [-1, -4.4, 0.8]), add(C, [2.4, -3.6, 0.8])], { col: CAT.m, w: 1.4 }),
    ], { part: 'zawhte' }));
    return items;
  }

  // ---------- the loom ----------
  function loom(s) {
    const M = moment(s), kids = [], pz = plane;
    // The far beam, tied with rope to the post
    kids.push(box(FAR_X - 1.2, FAR_X + 1.2, -10, 10, pz(FAR_X) - 1.2, pz(FAR_X) + 1, { pal: WOOD, bias: 50 }));
    kids.push(group([
      line([[FAR_X + 0.6, -10, pz(FAR_X)], [50, -2.2, 17]], { col: ROPE, w: 0.8 }),
      line([[FAR_X + 0.6, 10, pz(FAR_X)], [50, 2.2, 17]], { col: ROPE, w: 0.8 }),
      line([[49.8, -2.2, 16.4], [54.2, -2.2, 16.4], [54.2, 2.2, 16.4], [49.8, 2.2, 16.4]], { col: ROPE, w: 0.9 }),
    ], { part: 'hrui', bias: 60 }));
    // The warp: every other thread goes up through the heddle, so the shed opens for the shuttle
    const rodZ = pz(HEDDLE_X) + 4.6;
    for (let i = 0; i <= WY * 2; i++) {
      const y = -WY + i, up = (i % 2 === 0 ? Math.max(0, s.shedV) : Math.max(0, -s.shedV)) * 2.6 - 0.4;
      kids.push(line([[M.fell, y, pz(M.fell) + 0.05], [HEDDLE_X, y, pz(HEDDLE_X) + up], [STICK_X, y, pz(STICK_X) + (i % 2 ? 0.7 : -0.3)], [FAR_X, y, pz(FAR_X)]],
        { col: WARP, w: 0.55, ink: i === 0 || i === WY * 2, bias: 100, part: 'puan' }));
      if (up > 0.6) kids.push(line([[HEDDLE_X, y, rodZ], [HEDDLE_X, y, pz(HEDDLE_X) + up]], { col: '#7a6a55', w: 0.3, ink: false, bias: 250 }));
    }
    kids.push(box(HEDDLE_X - 0.6, HEDDLE_X + 0.6, -10, 10, rodZ, rodZ + 1.1, { pal: WOOD, bias: 300 }));
    kids.push(box(STICK_X - 1.2, STICK_X + 1.2, -10, 10, pz(STICK_X) + 0.1, pz(STICK_X) + 0.9, { pal: WOOD, bias: 200 }));
    // The breast beam, with the woven cloth rolled round it
    kids.push(box(BEAM_X - 1.2, BEAM_X + 1.2, -10, 10, pz(BEAM_X) - 2, pz(BEAM_X), { pal: WOOD, bias: 350 }));
    const rolled = s.finish >= 0 ? 0 : Math.max(0, s.rows.length - SHOW);
    if (rolled) {
      const R = 0.8 + Math.min(2.6, rolled * 0.06), c = s.rows[rolled - 1].c, z = pz(BEAM_X) - 1;
      const recent = s.rows.slice(Math.max(0, rolled - 5), rolled).map(r => r.c);
      kids.push(box(BEAM_X - 1.2 - R * 0.6, BEAM_X + 1.2 + R * 0.4, -WY - 0.4, WY + 0.4, z - R * 0.7, z + 1 + R, { pal: shade(YARNS[c]), part: 'puan', bias: 380,
        decals: { zp: recent.map((rc, i) => ({ pts: [[BEAM_X - 1.2 - R * 0.6 + i * 0.5, -WY - 0.4, z + 1.05 + R], [BEAM_X - 0.9 - R * 0.6 + i * 0.5, -WY - 0.4, z + 1.05 + R], [BEAM_X - 0.9 - R * 0.6 + i * 0.5, WY + 0.4, z + 1.05 + R], [BEAM_X - 1.2 - R * 0.6 + i * 0.5, WY + 0.4, z + 1.05 + R]], fill: YARNS[rc], w: 0.2 })) } }));
    }
    // The woven rows in view, run together into bands, with the pattern on top
    let x = BEAM_X + 0.6, i0 = 0;
    const vis = M.vis;
    while (i0 < vis.length) {
      let i1 = i0;
      while (i1 + 1 < vis.length && vis[i1 + 1].c === vis[i0].c) i1++;
      const xa = x + i0 * ROW, xb = x + (i1 + 1) * ROW;
      kids.push(poly([[xa, -WY - 0.4, pz(xa) + 0.06], [xb, -WY - 0.4, pz(xb) + 0.06], [xb, WY + 0.4, pz(xb) + 0.06], [xa, WY + 0.4, pz(xa) + 0.06]], { fill: YARNS[vis[i0].c], w: 0.5, part: 'puan', bias: 400 }));
      i0 = i1 + 1;
    }
    vis.forEach((r, i) => {
      if (!r.m) return;
      const xa = x + i * ROW, xm = xa + ROW / 2, n = s.rows.length - vis.length + i, z = pz(xm) + 0.12;
      for (let j = 0; j < 5; j++) {
        const y = -6 + j * 3 + (n % 2) * 1.5, hw = 0.9, hx = ROW * 0.5;
        kids.push(poly([[xm - hx, y, z], [xm, y + hw, z], [xm + hx, y, z], [xm, y - hw, z]], { fill: YARNS[contrast(r.c)], w: 0.25, part: 'ziarâng', bias: 450 }));
      }
    });
    // The beating stick (vuakfung) sits in the shed and packs each row in
    kids.push(box(M.bx, M.bx + 2.2, -10.5, 10.5, pz(M.bx) + 0.2, pz(M.bx) + 1.2, { pal: WOOD, part: 'vuakfung', bias: 500 }));
    // The shuttle (khawhthei) with the yarn wound on it, and the yarn it lays as it crosses
    const sx = M.fell + 2.4, sz = pz(sx) + 1.4;
    kids.push(group([
      box(sx - 0.6, sx + 0.6, M.sy - 5, M.sy + 5, sz, sz + 0.9, { pal: WOOD }),
      box(sx - 0.85, sx + 0.85, M.sy - 2.4, M.sy + 2.4, sz - 0.25, sz + 1.15, { pal: shade(YARNS[s.yarn]) }),
    ], { part: 'khawhthei', bias: 600 }));
    if (M.crossing) kids.push(line([[M.fell + 0.3, -s.side * (WY + 0.4), pz(M.fell) + 0.1], [sx, M.sy, sz + 0.4]], { col: YARNS[s.yarn], w: 0.45, ink: false, bias: 550 }));
    // The finished puan, folded, flies to the chest
    if (s.finish >= 0 && s.piece) {
      const k = s.finish, e = k * k * (3 - 2 * k), from = [-24, 0, 12], to = [-38, -24, 11 + s.done.length * 1.7 + 0.8];
      const c = Ink3D.lerp3(from, to, e); c[2] += Math.sin(k * Math.PI) * 22;
      const hw = 8 - 0.5 * e, hd = 5;
      kids.push(box(c[0] - hw, c[0] + hw, c[1] - hd, c[1] + hd, c[2] - 0.75, c[2] + 0.75, { pal: shade(YARNS[s.piece.bands[0]]), part: 'puan chei', bias: 2000,
        decals: { zp: puanStripes(s.piece.bands, [c[0] - hw, c[0] + hw, c[1] - hd, c[1] + hd], s.piece.motif, (x, y) => [x, y, c[2] + 0.8]) } }));
    }
    return { kids, M };
  }

  // ---------- the weaver ----------
  const PI = { h: 26, shirt: { l: '#6f9be0', m: '#3f6fb5', d: '#1c3560' }, lower: 'skirt', lowerPal: shade('#2a2522'), bands: [0.12, 0.18, 0.24], hair: '#cfcac2', bun: true };
  function weaver(s, M) {
    const pz = plane, hipAt = [-34, 0, 0];
    const lean = 0.05 + 0.05 * M.beat;
    let hands;
    if (M.crossing) {
      const lead = [M.fell + 1.2, Math.max(-WY, Math.min(WY, M.sy)), pz(M.fell) + 1.4];
      const rest = [M.fell - 1.2, -s.side * 4, pz(M.fell) + 0.8];
      hands = s.side > 0 ? [rest, lead] : [lead, rest];
    } else if (s.pass >= 0.5 && s.pass < 0.9) hands = [[M.bx + 1, -WY, pz(M.bx) + 1.5], [M.bx + 1, WY, pz(M.bx) + 1.5]];
    else hands = [[M.fell - 1, -5, pz(M.fell) + 0.9], [M.fell - 1, 5, pz(M.fell) + 0.9]];
    if (s.finish >= 0) hands = [[-26, -6, 14], [-26, 6, 14]];
    const kids = person(hipAt, 0, { ...PI, pose: 'sit', lean, hands, t: s.t });
    const arms = kids.splice(-4);   // drawn after the loom, so her hands are on the cloth
    // The belt (kâwnghrên) round her back holds the warp tight
    const strapBack = line([[-33, -8.6, 7.6], [-37.5, -6, 7], [-40.2, 0, 7], [-37.5, 6, 7], [-33, 8.6, 7.6]], { col: STRAP, w: 2.2, bias: -50 });
    const strapSides = [-1, 1].map(e => line([[BEAM_X, e * 10, pz(BEAM_X) - 1], [-33, e * 8.6, 7.6]], { col: STRAP, w: 2, bias: 50 }));
    return [group([strapBack, ...kids, ...strapSides], { part: 'pi', at: [-34, 0, 8] }), group(arms, { part: 'pi', bias: 1000, shadow: false })];
  }

  function scene(s, cam) {
    const floorDec = [];
    for (let y = -30; y < 34; y += 8) floorDec.push({ pts: [[-49, y, 0.02], [61, y, 0.02]], stroke: PLANK, open: true });
    const slab = box(-52, 64, -34, 34, -8, 0, { pal: FLOOR, part: 'chhuat', decals: { zp: floorDec }, shadow: false });
    // Sunlight from the window on the floor
    const sun = backWall(cam, WALLS[2]) ? [poly([[10, -31, 0.06], [36, -31, 0.06], [46, -6, 0.06], [22, -6, 0.06]], { fill: '#fff3c4', glow: true, ink: false, opacity: 0.45, part: 'êng' })] : [];
    const mat = poly([[-46, -13, 0.05], [-20, -13, 0.05], [-20, 13, 0.05], [-46, 13, 0.05]], { fill: '#d8b56a', w: 0.7, part: 'chhuatphah' });
    const matLines = [];
    for (let x = -43; x < -20; x += 3) matLines.push(line([[x, -13, 0.08], [x, 13, 0.08]], { col: '#b08a4f', w: 0.45, ink: false, part: 'chhuatphah' }));
    const { kids, M } = loom(s);
    const post = box(50, 54, -2, 2, 0, 48, { pal: DARK });
    return {
      ground: [slab], groundDecals: [mat, ...matLines, ...sun], clip: [[-52, -34, 0], [64, -34, 0], [64, 34, 0], [-52, 34, 0]],
      items: [...room(s, cam), post, group(kids, { at: [8, 0, 12] }), ...weaver(s, M)],
    };
  }

  const tint = () => c => c;
  const sky = () => `<rect x="-140" y="-140" width="280" height="260" fill="#f3efe6"/>`;
  const over = () => '';

  // ---------- labels ----------
  const LABEL_GROUPS = ['Loom', 'Room', 'Colours'];
  function anchors(s, cam) {
    const M = moment(s), a = [], pz = plane;
    const L = (part, p, n) => a.push({ part, p, n, g: 'Loom' }), R = (part, p, n) => a.push({ part, p, n, g: 'Room' });
    if (M.vis.length) L('puan', [M.fell - 3, 0, pz(M.fell) + 0.3], [0, 0, 1]);
    if (M.vis.some(r => r.m)) L('ziarâng', [M.fell - 1.5, 4.5, pz(M.fell) + 0.3], [0, 0, 1]);
    L('khawhthei', [M.fell + 2.4, M.sy, pz(M.fell) + 2.6]);
    L('vuakfung', [M.bx + 1, -10, pz(M.bx) + 1.4]);
    L('hrui', [48, 6.5, 16.5]);
    L('kâwnghrên', [-40, 0, 7.5]);
    L('pi', [-33, 0, 24]);
    for (const w of WALLS) if (backWall(cam, w)) R('bang', w.key === 'xn' ? [-49, 24, 34] : w.key === 'yn' ? [50, -31, 34] : w.key === 'xp' ? [61, 0, 34] : [0, 31, 34], w.n);
    if (backWall(cam, WALLS[2])) { R('tukverh', [22, -31, 30], [0, 1, 0]); R('êng', [30, -16, 0]); }
    if (backWall(cam, WALLS[0])) R('puan chei', [-49, -6, 30], [1, 0, 0]);
    R('thingrem', [-38, -18, 5]);
    R('chhuatphah', [-24, 10, 0.1]); R('chhuat', [40, 20, 0], [0, 0, 1]); R('fawng', [-8, 27, 3]); R('zawhte', [4, 24, 7]);
    Object.keys(YARNS).forEach((c, i) => a.push({ part: c, p: yarnAt(i, 2), g: 'Colours' }));
    return a;
  }

  function tap(s, part) {
    if (YARNS[part]) { s.yarn = part; return 'rawng'; }   // pick this yarn
    if (part === 'pi') return s.pass >= 0 || s.auto ? 'tah' : 'ṭhu';
    if (part === 'zawhte') return 'muhil';
    if (part === 'puan chei') return 'mawi';
    return null;
  }

  return {
    id: 'loom', name: 'Puan tah', sub: 'weaving a Mizo puan',
    view: { yaw: 55, pitch: 30, box: '-70 -82 142 128', centre: [0, -12], ink: 0.62 },   // a closer view, so finer lines
    words: ['puan', 'tah', 'puan chei', 'rawng', 'sen', 'dum', 'vâr', 'hring', 'dumpâwl', 'sendang', 'ziarâng', 'hrui', 'kâwnghrên',
      'khawhthei', 'vuakfung', 'pi', 'ṭhu', 'chhuatphah', 'tukverh', 'bang', 'chhuat', 'fawng', 'thingrem', 'zawhte', 'muhil', 'êng', 'zo', 'mawi'],
    init, step, tint, scene, sky, over, anchors, tap, labelGroups: LABEL_GROUPS,
    swatches: { label: 'Yarn colour', key: 'yarn', list: YARNS },
    actions: [
      { label: s => s.pass >= 0 && !s.auto ? 'Weaving…' : 'Weave a row', word: () => 'tah', run: s => startPass(s) },
      { label: s => s.auto ? 'Stop' : 'Keep weaving', word: () => null, run: s => { s.auto = !s.auto; if (s.auto) startPass(s); } },
      { label: s => s.pattern ? 'Plain rows' : 'Add a pattern', word: s => s.pattern ? null : 'ziarâng', run: s => { s.pattern = !s.pattern; } },
      { label: () => 'Finish the puan', word: () => 'zo', ready: s => s.rows.length >= 8 && s.finish < 0, run: s => finish(s) },
    ],
  };
})();
