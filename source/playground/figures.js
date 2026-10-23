// Rova facing us, and his family, drawn with the canvas so they stay sharp at
// any size (big emoji go soft on phones).
//   drawFront(ctx, { wear: ['shirt', 'cap', …], glow: 'eye' })  — 300 × 520 box
//   FRONT_PARTS: where each body part is, for taps (in the same box)
//   drawPortrait(ctx, who)  — 160 × 160 box; who: pi, pu, nu, pa, farnu, nau, rova
(function (global) {
  const SKIN = '#e9b48a', SKIN_D = '#d39d74', HAIR = '#1d1b22', INK = '#1d1b22', LIP = '#b4544a';
  const ell = (ctx, x, y, rx, ry, fill, rot = 0) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); ctx.fill(); };
  const line = (ctx, pts, w, colour, cap = 'round') => {
    ctx.strokeStyle = colour; ctx.lineWidth = w; ctx.lineCap = cap; ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
  };
  const poly = (ctx, pts, fill, stroke) => {
    ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  };

  // ------------------------------------------------ Rova, front view
  const SHOULDER = [[96, 228], [204, 228]], ELBOW = [[78, 292], [222, 292]], WRIST = [[66, 348], [234, 348]];
  const HIP = [[128, 352], [172, 352]], KNEE = [[124, 418], [176, 418]], ANKLE = [[122, 478], [178, 478]];

  function hand(ctx, [x, y], side) { // side -1: our left, +1: our right
    ell(ctx, x, y + 8, 15, 17, SKIN);
    for (let i = 0; i < 4; i++) line(ctx, [[x - 9 + i * 6, y + 18], [x - 10 + i * 6.5, y + 34 - Math.abs(i - 1.5) * 2]], 6, SKIN);
    line(ctx, [[x - side * 12, y + 8], [x - side * 22, y + 20]], 7, SKIN); // thumb, pointing in
  }
  function foot(ctx, [x, y], side, bare) {
    ell(ctx, x + side * 6, y + 12, 25, 13, SKIN);
    if (bare) for (let i = 0; i < 5; i++) ell(ctx, x + side * 6 + (i - 2) * 8.5, y + 3 + Math.abs(i - 2) * 1.2, 4, 4, SKIN_D);
  }

  function drawFront(ctx, opts = {}) {
    const wear = new Set(opts.wear || []);
    const limbs = (w, c) => {
      for (const s of [0, 1]) line(ctx, [SHOULDER[s], ELBOW[s], WRIST[s]], w, c);
    };
    const legs = (w, c) => { for (const s of [0, 1]) line(ctx, [HIP[s], KNEE[s], ANKLE[s]], w, c); };

    // Skin first: arms, legs, neck, chest, hands and feet.
    limbs(24, SKIN); legs(30, SKIN);
    poly(ctx, [[138, 200], [162, 200], [164, 226], [136, 226]], SKIN_D);
    poly(ctx, [[94, 226], [206, 226], [196, 352], [104, 352]], SKIN);
    ell(ctx, 150, 300, 3, 3, SKIN_D); // belly button
    hand(ctx, WRIST[0], -1); hand(ctx, WRIST[1], 1);
    foot(ctx, ANKLE[0], -1, true); foot(ctx, ANKLE[1], 1, true);

    // Small shorts: what he wears before he's dressed.
    poly(ctx, [[102, 326], [198, 326], [204, 372], [154, 376], [150, 360], [146, 376], [96, 372]], '#0d2a4a');
    line(ctx, [[103, 330], [197, 330]], 4, '#ffc94a');

    if (wear.has('socks')) for (const s of [0, 1]) {
      line(ctx, [[ANKLE[s][0], ANKLE[s][1] - 34], ANKLE[s]], 30, '#e53935', 'butt');
      for (let k = 0; k < 3; k++) line(ctx, [[ANKLE[s][0] - 15, ANKLE[s][1] - 28 + k * 10], [ANKLE[s][0] + 15, ANKLE[s][1] - 28 + k * 10]], 3.5, '#fff', 'butt');
      ell(ctx, ANKLE[s][0] + (s ? 6 : -6), ANKLE[s][1] + 12, 26, 14, '#e53935');
    }
    const trousers = () => {
      poly(ctx, [[100, 318], [200, 318], [206, 470], [160, 474], [150, 372], [140, 474], [94, 470]], '#2f5fa8');
      line(ctx, [[150, 322], [150, 370]], 2.5, '#1e4482');
      line(ctx, [[100, 324], [200, 324]], 8, '#264f8f', 'butt');
      ell(ctx, 150, 324, 6, 5, '#c9a227');
      for (const x of [118, 182]) line(ctx, [[x, 336], [x + (x < 150 ? 6 : -6), 350]], 2, '#1e4482');
    };
    if (wear.has('shoes')) for (const s of [0, 1]) {
      const [x, y] = ANKLE[s], d = s ? 1 : -1;
      ell(ctx, x + d * 6, y + 14, 28, 15, '#6d4128');
      ell(ctx, x + d * 6, y + 9, 18, 8, '#8a5536');
      line(ctx, [[x + d * 6 - 26, y + 26], [x + d * 6 + 26, y + 26]], 5, '#3b2215');
      line(ctx, [[x - 6, y + 6], [x + 6, y + 10]], 2.5, '#f2e6d8');
    }
    if (wear.has('sandals')) for (const s of [0, 1]) {
      const [x, y] = ANKLE[s], d = s ? 1 : -1;
      ell(ctx, x + d * 6, y + 25, 28, 6, '#1e88e5');
      line(ctx, [[x + d * 6 - 16, y + 18], [x + d * 6, y + 2], [x + d * 6 + 16, y + 18]], 5, '#ffb300');
    }
    if (wear.has('shirt')) {
      for (const s of [0, 1]) line(ctx, [SHOULDER[s], [(SHOULDER[s][0] + ELBOW[s][0]) / 2, (SHOULDER[s][1] + ELBOW[s][1]) / 2 + 4]], 30, '#29a3d6', 'butt');
      poly(ctx, [[94, 224], [206, 224], [198, 340], [102, 340]], '#29a3d6');
      poly(ctx, [[134, 224], [150, 246], [166, 224]], SKIN_D);
      poly(ctx, [[130, 222], [150, 242], [140, 252], [124, 228]], '#1c86b3');
      poly(ctx, [[170, 222], [150, 242], [160, 252], [176, 228]], '#1c86b3');
      for (const y of [262, 288, 314]) ell(ctx, 150, y, 3.5, 3.5, '#fff');
    }
    if (wear.has('trousers')) trousers();
    if (wear.has('coat')) {
      for (const s of [0, 1]) line(ctx, [SHOULDER[s], ELBOW[s], [WRIST[s][0], WRIST[s][1] - 8]], 32, '#b9874f');
      for (const s of [0, 1]) line(ctx, [[WRIST[s][0], WRIST[s][1] - 14], [WRIST[s][0], WRIST[s][1] - 6]], 34, '#8f6236', 'butt');
      poly(ctx, [[92, 222], [140, 222], [146, 382], [96, 382]], '#b9874f', '#8f6236');
      poly(ctx, [[160, 222], [208, 222], [204, 382], [154, 382]], '#b9874f', '#8f6236');
      poly(ctx, [[120, 220], [140, 222], [148, 290], [126, 250]], '#a5763f');
      poly(ctx, [[180, 220], [160, 222], [152, 290], [174, 250]], '#a5763f');
      for (const y of [300, 330, 360]) ell(ctx, 158, y, 4, 4, '#5a3a20');
      line(ctx, [[104, 336], [128, 336]], 3, '#8f6236'); line(ctx, [[172, 336], [196, 336]], 3, '#8f6236');
    }
    // Hands back on top of sleeves.
    if (wear.has('coat')) { hand(ctx, WRIST[0], -1); hand(ctx, WRIST[1], 1); }

    // Head: ears, face, hair, eyes, nose and an open smile with teeth and tongue.
    ell(ctx, 76, 142, 14, 18, SKIN); ell(ctx, 224, 142, 14, 18, SKIN);
    ell(ctx, 78, 142, 6, 9, SKIN_D); ell(ctx, 222, 142, 6, 9, SKIN_D);
    ell(ctx, 150, 136, 76, 80, SKIN);
    ctx.fillStyle = HAIR; ctx.beginPath();
    ctx.ellipse(150, 118, 80, 66, 0, Math.PI * 1.02, Math.PI * 1.98); ctx.lineTo(228, 132);
    ctx.quadraticCurveTo(210, 92, 176, 96); ctx.quadraticCurveTo(160, 112, 140, 92); ctx.quadraticCurveTo(110, 104, 90, 104);
    ctx.quadraticCurveTo(78, 116, 72, 134); ctx.closePath(); ctx.fill();
    for (const x of [122, 178]) {
      ell(ctx, x, 140, 13, 15, '#fff');
      ell(ctx, x + 1, 143, 8, 10, '#5a3a22'); ell(ctx, x + 1, 143, 4.5, 5.5, INK); ell(ctx, x + 4, 139, 2.5, 2.5, '#fff');
      line(ctx, [[x - 14, 116], [x, 112], [x + 14, 116]], 4.5, HAIR);
    }
    ell(ctx, 104, 170, 11, 7, 'rgba(240,98,146,.25)'); ell(ctx, 196, 170, 11, 7, 'rgba(240,98,146,.25)');
    line(ctx, [[150, 150], [144, 168], [154, 170]], 3.5, SKIN_D);
    ctx.fillStyle = '#5b1d23'; ctx.beginPath(); ctx.moveTo(124, 182); ctx.quadraticCurveTo(150, 186, 176, 182); ctx.quadraticCurveTo(170, 212, 150, 213); ctx.quadraticCurveTo(130, 212, 124, 182); ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#fff'; ctx.fillRect(122, 180, 56, 10);
    for (let i = 1; i < 5; i++) line(ctx, [[124 + i * 10.4, 181], [124 + i * 10.4, 189]], 1, '#e3d9d0', 'butt');
    ell(ctx, 150, 210, 17, 11, '#e8707a');
    ctx.restore();
    line(ctx, [[122, 182], [150, 187], [178, 182]], 2.5, LIP);

    if (wear.has('cap')) {
      ctx.fillStyle = '#1565c0'; ctx.beginPath(); ctx.ellipse(150, 98, 80, 52, 0, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill();
      ell(ctx, 150, 100, 92, 14, '#0d47a1');
      ell(ctx, 150, 50, 7, 5, '#0d47a1');
      line(ctx, [[150, 50], [150, 98]], 2, '#0d47a1');
      ell(ctx, 150, 78, 14, 10, '#ffc94a');
    }

    if (opts.glow && FRONT_PARTS[opts.glow]) {
      const p = FRONT_PARTS[opts.glow];
      ctx.strokeStyle = opts.glowColour || '#ffc94a'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.ry || p.r, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }

  // Tap targets, biggest first in priority for overlaps (smaller parts win).
  const FRONT_PARTS = {
    eye: { x: 150, y: 140, r: 46, ry: 20 },
    ear: { x: 76, y: 142, r: 20, also: [[224, 142]] },
    nose: { x: 149, y: 162, r: 13 },
    tooth: { x: 150, y: 186, r: 13, ry: 7 },
    tongue: { x: 150, y: 205, r: 13, ry: 8 },
    arm: { x: 82, y: 262, r: 22, also: [[218, 262]] },
    hand: { x: 66, y: 362, r: 20, also: [[234, 362]] },
    finger: { x: 63, y: 382, r: 12, also: [[237, 382]] },
    thumb: { x: 50, y: 368, r: 10, also: [[250, 368]] },
    foot: { x: 116, y: 490, r: 26, ry: 16, also: [[184, 490]] },
  };
  // The part at (x, y) in the 300 × 520 box, or null.
  function partAt(x, y) {
    let best = null, bestD = Infinity;
    for (const [name, p] of Object.entries(FRONT_PARTS)) {
      for (const [px, py] of [[p.x, p.y], ...(p.also || [])]) {
        const d = Math.hypot((x - px) / p.r, (y - py) / (p.ry || p.r));
        if (d <= 1.35 && d * p.r < bestD) { best = name; bestD = d * p.r; }
      }
    }
    return best;
  }

  // ------------------------------------------------ the family, as portraits
  const PEOPLE = {
    pi: { skin: '#e2ab83', hair: '#c9c9cf', top: '#7b4fb8', style: 'bun', glasses: true, old: true },
    pu: { skin: '#dba27a', hair: '#d6d6dc', top: '#5d7d5a', style: 'short-old', glasses: true, old: true, moustache: '#d6d6dc' },
    nu: { skin: '#eab892', hair: '#24161a', top: '#d84a6b', style: 'long', earrings: true },
    pa: { skin: '#dfa67c', hair: '#1d1b22', top: '#2f6db5', style: 'short', moustache: '#1d1b22', collar: true },
    farnu: { skin: '#eab892', hair: '#24161a', top: '#e0457b', style: 'pigtails', cheeks: true },
    nau: { skin: '#f0c39e', hair: '#3a2a22', top: '#ffe08a', style: 'curl', baby: true, cheeks: true },
    rova: { skin: '#e9b48a', hair: '#1d1b22', top: '#1565c0', style: 'rova', stripe: '#ffc94a' },
  };
  function drawPortrait(ctx, who) {
    const P = PEOPLE[who]; if (!P) return;
    const cx = 80, cy = P.baby ? 80 : 74, r = P.baby ? 40 : 36;
    // Shoulders and top.
    ctx.fillStyle = P.top; ctx.beginPath();
    ctx.moveTo(22, 160); ctx.quadraticCurveTo(26, 118, 80, 116); ctx.quadraticCurveTo(134, 118, 138, 160); ctx.closePath(); ctx.fill();
    if (P.stripe) line(ctx, [[34, 140], [126, 140]], 5, P.stripe, 'butt');
    if (P.collar) { poly(ctx, [[66, 118], [80, 134], [72, 140], [60, 122]], '#fff'); poly(ctx, [[94, 118], [80, 134], [88, 140], [100, 122]], '#fff'); }
    // Hair behind the head.
    if (P.style === 'long') { ctx.fillStyle = P.hair; ctx.beginPath(); ctx.ellipse(cx, cy + 16, r + 5, r + 20, 0, 0, Math.PI * 2); ctx.fill(); }
    if (P.style === 'pigtails') { ell(ctx, cx - r - 6, cy + 6, 11, 18, P.hair, -.4); ell(ctx, cx + r + 6, cy + 6, 11, 18, P.hair, .4); ell(ctx, cx - r + 2, cy - 8, 5, 5, '#ffc94a'); ell(ctx, cx + r - 2, cy - 8, 5, 5, '#ffc94a'); }
    if (P.style === 'bun') ell(ctx, cx, cy - r - 4, 18, 14, P.hair);
    // Neck, ears, face.
    poly(ctx, [[72, cy + r - 6], [88, cy + r - 6], [90, 122], [70, 122]], P.skin);
    ell(ctx, cx - r, cy + 4, 7, 9, P.skin); ell(ctx, cx + r, cy + 4, 7, 9, P.skin);
    ell(ctx, cx, cy, r, r + 3, P.skin);
    // Hair on top.
    ctx.fillStyle = P.hair; ctx.beginPath();
    if (P.style === 'short-old') { ctx.ellipse(cx, cy - 6, r + 2, r - 2, 0, Math.PI * 1.05, Math.PI * 1.25); ctx.lineTo(cx - r + 4, cy - 2); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx, cy - 6, r + 2, r - 2, 0, Math.PI * 1.75, Math.PI * 1.95); ctx.lineTo(cx + r - 4, cy - 2); ctx.closePath(); ctx.fill(); }
    else if (P.style === 'curl') { ctx.lineWidth = 4; ctx.strokeStyle = P.hair; ctx.beginPath(); ctx.arc(cx + 2, cy - r - 2, 7, Math.PI * .2, Math.PI * 1.7); ctx.stroke(); }
    else {
      ctx.ellipse(cx, cy - 6, r + 3, r - 2, 0, Math.PI * 1.02, Math.PI * 1.98);
      const fringe = P.style === 'long' || P.style === 'bun' || P.style === 'pigtails' ? 0 : 6;
      ctx.lineTo(cx + r + 2, cy - 2); ctx.quadraticCurveTo(cx + 8, cy - 18 + fringe, cx - 6, cy - 22); ctx.quadraticCurveTo(cx - 20, cy - 14 + fringe, cx - r - 2, cy - 2);
      ctx.closePath(); ctx.fill();
    }
    // Eyes, brows, lines for the old, glasses.
    for (const x of [cx - 13, cx + 13]) {
      ell(ctx, x, cy + 2, P.baby ? 5 : 4, P.baby ? 6 : 5, INK); ell(ctx, x + 1.5, cy, 1.4, 1.4, '#fff');
      if (!P.baby) line(ctx, [[x - 7, cy - 9], [x + 7, cy - 10]], 2.5, P.old ? '#9a9aa2' : P.hair);
      if (P.old) line(ctx, [[x - 9, cy + 9], [x - 4, cy + 11]], 1.5, 'rgba(120,70,40,.5)');
    }
    if (P.glasses) for (const x of [cx - 13, cx + 13]) { ctx.strokeStyle = '#5a4630'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, cy + 2, 9, 0, Math.PI * 2); ctx.stroke(); }
    if (P.glasses) line(ctx, [[cx - 4, cy + 2], [cx + 4, cy + 2]], 2, '#5a4630');
    if (P.cheeks) { ell(ctx, cx - 22, cy + 14, 6, 4, 'rgba(240,98,146,.35)'); ell(ctx, cx + 22, cy + 14, 6, 4, 'rgba(240,98,146,.35)'); }
    // Nose and mouth.
    line(ctx, [[cx, cy + 6], [cx - 3, cy + 13], [cx + 2, cy + 14]], 2, 'rgba(120,70,40,.55)');
    if (P.moustache) { ctx.fillStyle = P.moustache; ctx.beginPath(); ctx.moveTo(cx - 13, cy + 21); ctx.quadraticCurveTo(cx, cy + 14, cx + 13, cy + 21); ctx.quadraticCurveTo(cx, cy + 19, cx - 13, cy + 21); ctx.fill(); }
    ctx.strokeStyle = LIP; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy + (P.baby ? 18 : 17), P.baby ? 6 : 8, Math.PI * .15, Math.PI * .85); ctx.stroke();
    if (P.earrings) { ell(ctx, cx - r, cy + 16, 3.5, 3.5, '#ffc94a'); ell(ctx, cx + r, cy + 16, 3.5, 3.5, '#ffc94a'); }
  }

  // A canvas sized to its box on screen at the screen's sharpness; draw(ctx) in box units.
  function paintCanvas(canvas, boxW, boxH, draw) {
    const dpr = Math.min(devicePixelRatio || 1, 3), w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w) return;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d'), s = Math.min(canvas.width / boxW, canvas.height / boxH);
    ctx.setTransform(s, 0, 0, s, (canvas.width - boxW * s) / 2, (canvas.height - boxH * s) / 2);
    ctx.clearRect(-1e4, -1e4, 2e4, 2e4);
    draw(ctx);
    return { s, ox: (canvas.width - boxW * s) / 2 / dpr, oy: (canvas.height - boxH * s) / 2 / dpr, scale: s / dpr };
  }

  // ------------------------------------------------ things for Big and small, in a 200 × 200 box
  // k (0–1) is how far along the quality goes: 1 long, tall or thick; 0 short, low or thin.
  function drawPencil(ctx, k) {
    const len = 60 + 120 * k, x0 = 100 - len / 2, y = 100;
    ctx.fillStyle = '#ffb300'; ctx.fillRect(x0 + 22, y - 12, len - 40, 24);
    ctx.fillStyle = '#ffa000'; ctx.fillRect(x0 + 22, y + 2, len - 40, 10);
    ctx.fillStyle = '#c0c0c8'; ctx.fillRect(x0 + len - 18, y - 12, 8, 24);
    ctx.fillStyle = '#ef5b72'; ctx.beginPath(); ctx.roundRect(x0 + len - 10, y - 12, 12, 24, [0, 6, 6, 0]); ctx.fill();
    poly(ctx, [[x0 + 22, y - 12], [x0, y], [x0 + 22, y + 12]], '#f2d0a0');
    poly(ctx, [[x0 + 7, y - 4], [x0, y], [x0 + 7, y + 4]], '#333');
  }
  function drawTree(ctx, k) {
    const h = 70 + 110 * k, base = 186;
    ctx.fillStyle = '#8a5a33'; ctx.fillRect(92, base - h * .45, 16, h * .45);
    for (const [dy, r] of [[.55, .3], [.72, .26], [.88, .2]]) ell(ctx, 100, base - h * dy, 40 + 20 * k, h * r, '#4caf50');
    ell(ctx, 88, base - h * .7, 14, h * .1, 'rgba(255,255,255,.18)');
    ell(ctx, 100, base + 4, 46, 6, 'rgba(0,0,0,.08)');
  }
  function drawBook(ctx, k) {
    const t = 10 + 70 * k, w = 130, x = 100 - w / 2, y = 100 + t / 2;
    ctx.fillStyle = '#f7f2e6'; ctx.fillRect(x + 4, y - t, w - 8, t);
    ctx.strokeStyle = '#ddd2bb'; ctx.lineWidth = 1;
    for (let yy = y - t + 4; yy < y - 2; yy += 4) { ctx.beginPath(); ctx.moveTo(x + 8, yy); ctx.lineTo(x + w - 8, yy); ctx.stroke(); }
    ctx.fillStyle = '#1565c0'; ctx.beginPath(); ctx.roundRect(x, y - t - 8, w, 10, 3); ctx.fill();
    ctx.fillStyle = '#0d47a1'; ctx.beginPath(); ctx.roundRect(x, y - 2, w, 10, 3); ctx.fill();
    ctx.fillStyle = '#ffc94a'; ctx.fillRect(x + w - 30, y - t - 8, 8, t + 20);
  }
  global.drawSizeThing = (ctx, what, k) => ({ pencil: drawPencil, tree: drawTree, book: drawBook })[what](ctx, k);

  global.drawFront = drawFront; global.FRONT_PARTS = FRONT_PARTS; global.frontPartAt = partAt;
  global.drawPortrait = drawPortrait; global.paintCanvas = paintCanvas;
})(typeof window !== 'undefined' ? window : globalThis);
