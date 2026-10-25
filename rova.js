// Rova and Mami, drawn from parts so their arms and legs can really run.
// drawRova(ctx, phase, pose, opts) and drawMami(ctx, phase, pose, opts) paint them facing right
// in a 120 × 160 box with their feet near the bottom. phase is the run cycle in radians; pose is
// 'run', 'jump', 'stand' or 'bow' (opts.bow, 0–1, is how deep: a Japanese-style bow from the
// hips, hands at the sides), or 'front': facing the viewer, bowing toward them by opts.bow;
// opts.live lets them blink (leave it off when drawing frames to keep).
// Used by the home page, Rova's Journey and the Playground, so they look the same everywhere.
// Every part has a dark ink edge and a lighter side toward the light, like a cartoon.
(function (global) {
  const ROVA = {
    skin: '#eab68c', skinShade: '#d39a70', skinFar: '#cf9a72', hair: '#1f1b24', hairShine: '#4a4560',
    shirt: '#1565c0', shirtLight: '#3d86dc', shirtFar: '#0f4f9e', stripe: '#ffc94a', collar: '#0d47a1',
    shorts: '#183a63', shortsLight: '#26507f', shortsFar: '#0e2a4a', sock: '#ffffff',
    shoe: '#ffffff', shoeFar: '#dfe6ee', sole: '#c2185b', lace: '#c2185b', eye: '#1d1b22', mouth: '#8a3a2e', cheek: 'rgba(240,120,110,.28)',
    skirt: false, ponytail: false,
  };
  const MAMI = {
    skin: '#ecbb95', skinShade: '#d6a07a', skinFar: '#d09d77', hair: '#2a181d', hairShine: '#5a3a44',
    shirt: '#e0457b', shirtLight: '#f06d9a', shirtFar: '#b8325f', stripe: '#ffffff', collar: '#ffffff',
    shorts: '#7a2a8c', shortsLight: '#9442a8', shortsFar: '#5e1f6c', sock: '#ffffff',
    shoe: '#ffffff', shoeFar: '#e6dcef', sole: '#7569e8', lace: '#7569e8', eye: '#1d1b22', mouth: '#8a3a2e', cheek: 'rgba(240,98,146,.38)',
    skirt: true, ponytail: true, tie: '#ffc94a',
  };
  const INK = '#2a1f1c';
  const rad = d => d * Math.PI / 180;
  const at = (x, y, a, len) => [x + Math.sin(rad(a)) * len, y + Math.cos(rad(a)) * len];

  // A thick rounded stroke with an ink edge: the edge first, a little wider, then the colour.
  function seg(ctx, pts, w, col, edge = 2.2) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const path = () => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]); };
    path(); ctx.strokeStyle = INK; ctx.lineWidth = w + edge * 2; ctx.stroke();
    path(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
  }
  function blob(ctx, draw, fill, edge = 2) {
    ctx.beginPath(); draw(); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = edge; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
  }

  function shoe(ctx, C, x, y, a, near) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(-rad(a) * .35);
    // A sneaker: rounded toe forward, a coloured sole, two laces.
    blob(ctx, () => {
      ctx.moveTo(-6, -4); ctx.quadraticCurveTo(-6, -8, 0, -8); ctx.lineTo(6, -6);
      ctx.quadraticCurveTo(16, -4, 16, 2); ctx.lineTo(16, 4); ctx.lineTo(-7, 4); ctx.quadraticCurveTo(-8, 0, -6, -4);
    }, near ? C.shoe : C.shoeFar, 1.8);
    ctx.fillStyle = C.sole; ctx.fillRect(-7, 3, 23, 3.2);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.strokeRect(-7, 3, 23, 3.2);
    ctx.strokeStyle = C.lace; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(2, -6); ctx.lineTo(5, -3); ctx.moveTo(5, -6.5); ctx.lineTo(8, -3.5); ctx.stroke();
    ctx.restore();
  }

  function leg(ctx, C, hip, phase, near, pose) {
    let thigh, knee;
    if (pose === 'jump') { thigh = near ? 62 : 22; knee = near ? -78 : -92; }
    else if (pose === 'stand' || pose === 'bow') { thigh = near ? 3 : -3; knee = 0; }
    else {
      thigh = 36 * Math.sin(phase);
      // The knee folds while the leg swings forward, and straightens as it pushes back.
      knee = -(12 + 70 * Math.max(0, Math.cos(phase)));
    }
    const kneeP = at(hip[0], hip[1], thigh, 24), foot = at(kneeP[0], kneeP[1], thigh + knee, 25);
    const skin = near ? C.skin : C.skinFar;
    seg(ctx, [hip, kneeP, foot], 10, skin, 1.8);
    // A sock band above the shoe.
    const sk = at(foot[0], foot[1], thigh + knee + 180, 3.5);
    seg(ctx, [sk, foot], 10.5, near ? C.sock : '#e3e7ee', 1.6);
    if (!C.skirt) {
      // Shorts over the top of the thigh, a little flared.
      const mid = at(hip[0], hip[1], thigh, 11);
      seg(ctx, [hip, mid], 13, near ? C.shorts : C.shortsFar, 1.6);
    }
    shoe(ctx, C, foot[0], foot[1] + 1, thigh + knee, near);
  }

  function arm(ctx, C, sh, phase, near, pose, lean = 0) {
    let upper, fore;
    // Standing, the arms hang down; bowing, they lie along the body (hands on the thighs).
    if (pose === 'stand') { upper = near ? 6 : -4; fore = upper + 6; }
    else if (pose === 'bow') { upper = lean * .55 + (near ? 4 : -2); fore = upper + 4; }
    else if (pose === 'jump') { upper = near ? 105 : -65; fore = near ? 150 : -25; }   // reach forward, the other arm back
    else { upper = -44 * Math.sin(phase); fore = upper + 82 + 12 * Math.sin(phase); }
    const elbow = at(sh[0], sh[1], upper, 19), hand = at(elbow[0], elbow[1], fore, 16);
    const skin = near ? C.skin : C.skinFar;
    seg(ctx, [elbow, hand], 8, skin, 1.8);                                   // forearm
    seg(ctx, [at(sh[0], sh[1], upper, 8), elbow], 8, skin, 1.8);            // upper arm
    seg(ctx, [sh, at(sh[0], sh[1], upper, 11)], 11.5, near ? C.shirt : C.shirtFar, 1.8);   // short sleeve over the top
    // Then the hand.
    ctx.beginPath(); ctx.arc(hand[0], hand[1], 4.8, 0, Math.PI * 2);
    ctx.fillStyle = skin; ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = INK; ctx.stroke();
  }

  function drawKid(ctx, C, phase = 0, pose = 'run', opts = {}) {
    const run = pose === 'run', bowing = pose === 'bow';
    const bob = run ? -Math.abs(Math.sin(phase)) * 5 : 0;
    ctx.save();
    ctx.translate(0, bob);
    // How far the body leans forward from the hips: a little to run, up to 60° in a deep bow.
    const lean = run ? 10 : bowing ? 3 + 57 * Math.max(0, Math.min(1, opts.bow ?? 1)) : pose === 'stand' ? 1 : 3;
    const hip = [57, 95], sh = at(hip[0], hip[1], 180 + lean, 32);
    const neck = at(sh[0], sh[1], 180 + lean, 6);
    // The head sits on the neck and turns down with the body in a bow.
    const hc = at(neck[0], neck[1], 180 + lean * 1.1, 17);
    const hx = bowing ? hc[0] + 4 : sh[0] + 7, hy = bowing ? hc[1] : sh[1] - 23;
    const headTilt = run ? Math.sin(phase * 2) * 1.5 : bowing ? lean * .9 : pose === 'stand' ? 0 : -4;

    // Ponytail first: it streams out behind and swings with each step.
    if (C.ponytail) {
      const swing = run ? Math.sin(phase * 2 - .6) * 6 : -12, lift = run ? Math.abs(Math.sin(phase)) * 3 : 6;
      blob(ctx, () => {
        ctx.moveTo(hx - 12, hy - 9);
        ctx.bezierCurveTo(hx - 30, hy - 14 - lift, hx - 44, hy + swing - lift, hx - 40, hy + 16 + swing);
        ctx.bezierCurveTo(hx - 36, hy + 8 + swing * .6, hx - 26, hy + 2, hx - 13, hy + 1);
      }, C.hair, 2);
      ctx.strokeStyle = C.hairShine; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(hx - 20, hy - 7 - lift * .5); ctx.quadraticCurveTo(hx - 32, hy - 6 - lift + swing * .3, hx - 37, hy + 6 + swing * .7); ctx.stroke();
      ctx.beginPath(); ctx.arc(hx - 13, hy - 4, 4.2, 0, Math.PI * 2); ctx.fillStyle = C.tie; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = INK; ctx.stroke();
    }

    arm(ctx, C, sh, phase + Math.PI, false, pose, lean);
    leg(ctx, C, hip, phase + Math.PI, false, pose);

    // Body: a T-shirt that narrows to the waist, with the stripe and a collar.
    const L = [hip[0] - 12, hip[1] - 2], R = [hip[0] + 12, hip[1] - 2];
    const SL = [sh[0] - 12, sh[1] + 2], SR = [sh[0] + 13, sh[1] + 2];
    blob(ctx, () => {
      ctx.moveTo(L[0], L[1]); ctx.lineTo(R[0], R[1]);
      ctx.quadraticCurveTo(R[0] + 3, (R[1] + SR[1]) / 2, SR[0], SR[1]);
      ctx.quadraticCurveTo(sh[0], sh[1] - 4, SL[0], SL[1]);
      ctx.quadraticCurveTo(L[0] - 4, (L[1] + SL[1]) / 2, L[0], L[1]);
    }, C.shirt, 2.2);
    ctx.save(); ctx.clip();
    // Light from the front: a lighter band down the front of the shirt.
    ctx.fillStyle = C.shirtLight; ctx.globalAlpha = .55;
    ctx.beginPath(); ctx.moveTo(SR[0] - 6, SR[1]); ctx.lineTo(R[0] - 3, R[1]); ctx.lineTo(R[0] + 4, R[1]); ctx.lineTo(SR[0] + 2, SR[1]); ctx.fill();
    ctx.globalAlpha = 1;
    const sy = hip[1] - 15;
    ctx.fillStyle = C.stripe; ctx.fillRect(hip[0] - 20, sy - 2.5, 44, 5);
    ctx.restore();
    // Collar
    ctx.strokeStyle = C.collar; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(neck[0] - 5, neck[1] + 4); ctx.quadraticCurveTo(neck[0] + 1, neck[1] + 10, neck[0] + 7, neck[1] + 4); ctx.stroke();

    if (!C.skirt) {
      blob(ctx, () => {
        ctx.moveTo(hip[0] - 13, hip[1] - 4); ctx.lineTo(hip[0] + 13, hip[1] - 4);
        ctx.quadraticCurveTo(hip[0] + 16, hip[1] + 4, hip[0] + 12, hip[1] + 9);
        ctx.lineTo(hip[0] - 12, hip[1] + 9); ctx.quadraticCurveTo(hip[0] - 16, hip[1] + 4, hip[0] - 13, hip[1] - 4);
      }, C.shorts, 2);
    }

    leg(ctx, C, hip, phase, true, pose);

    if (C.skirt) {
      // A skirt that flares as she runs, with two pleats.
      const flare = run ? 4 + Math.abs(Math.sin(phase)) * 5 : 10;
      blob(ctx, () => {
        ctx.moveTo(hip[0] - 13, hip[1] - 6); ctx.lineTo(hip[0] + 13, hip[1] - 6);
        ctx.lineTo(hip[0] + 16 + flare, hip[1] + 19);
        ctx.quadraticCurveTo(hip[0], hip[1] + 25, hip[0] - 16 - flare, hip[1] + 19);
      }, C.shorts, 2);
      ctx.strokeStyle = C.shortsFar; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(hip[0] - 3, hip[1] - 4); ctx.lineTo(hip[0] - 6 - flare * .3, hip[1] + 20);
      ctx.moveTo(hip[0] + 6, hip[1] - 4); ctx.lineTo(hip[0] + 9 + flare * .4, hip[1] + 19); ctx.stroke();
      ctx.fillStyle = C.shortsLight; ctx.globalAlpha = .6;
      ctx.beginPath(); ctx.moveTo(hip[0] + 7, hip[1] - 5); ctx.lineTo(hip[0] + 12, hip[1] - 5); ctx.lineTo(hip[0] + 15 + flare, hip[1] + 18); ctx.lineTo(hip[0] + 10 + flare * .5, hip[1] + 19); ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Neck and head, tilted a little with the run.
    seg(ctx, [neck, [hx - 3, hy + 12]], 8, C.skinShade, 1.6);
    ctx.save();
    ctx.translate(hx, hy); ctx.rotate(rad(headTilt)); ctx.translate(-hx, -hy);
    // Face
    blob(ctx, () => { ctx.ellipse(hx, hy, 17.5, 17, 0, 0, Math.PI * 2); }, C.skin, 2.2);
    // Ear, at the side of the head
    ctx.fillStyle = C.skinShade; ctx.beginPath(); ctx.ellipse(hx - 6, hy + 3, 3.4, 4.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(hx - 6, hy + 3, 3.4, rad(100), rad(300)); ctx.stroke();
    // Hair
    if (C.ponytail) {
      blob(ctx, () => {
        ctx.moveTo(hx - 17, hy + 6);
        ctx.bezierCurveTo(hx - 20, hy - 14, hx - 4, hy - 23, hx + 8, hy - 18);
        ctx.bezierCurveTo(hx + 17, hy - 14, hx + 19, hy - 6, hx + 16, hy - 2);
        ctx.quadraticCurveTo(hx + 10, hy - 9, hx + 3, hy - 9);     // fringe over the forehead
        ctx.quadraticCurveTo(hx - 4, hy - 8, hx - 8, hy - 3);
        ctx.quadraticCurveTo(hx - 11, hy + 1, hx - 12, hy + 7);
      }, C.hair, 2);
    } else {
      blob(ctx, () => {
        ctx.moveTo(hx - 17, hy + 5);
        ctx.bezierCurveTo(hx - 21, hy - 15, hx - 2, hy - 24, hx + 10, hy - 18);
        ctx.lineTo(hx + 7, hy - 21); ctx.lineTo(hx + 14, hy - 15); ctx.lineTo(hx + 13, hy - 19); ctx.lineTo(hx + 18, hy - 9);  // tufts
        ctx.quadraticCurveTo(hx + 11, hy - 9, hx + 6, hy - 6);
        ctx.lineTo(hx + 4, hy - 10); ctx.quadraticCurveTo(hx - 3, hy - 6, hx - 7, hy - 4);
        ctx.quadraticCurveTo(hx - 11, hy, hx - 12, hy + 6);
      }, C.hair, 2);
    }
    // A shine on the hair
    ctx.strokeStyle = C.hairShine; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(hx - 2, hy - 4, 13, rad(205), rad(250)); ctx.stroke();
    // Eye: blinks now and then when live.
    const blink = opts.live && (Date.now() % 3800) < 130;
    if (blink) { ctx.strokeStyle = C.eye; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hx + 7, hy + 1); ctx.lineTo(hx + 12, hy + 1); ctx.stroke(); }
    else {
      ctx.fillStyle = C.eye; ctx.beginPath(); ctx.ellipse(hx + 9.5, hy + 0.5, 2.6, 3.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx + 10.4, hy - 0.8, 1, 0, Math.PI * 2); ctx.fill();
    }
    // Brow
    ctx.strokeStyle = C.hair; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(hx + 6, hy - 5); ctx.quadraticCurveTo(hx + 9.5, hy - 7, hx + 13, hy - 5.5); ctx.stroke();
    // Nose
    ctx.strokeStyle = C.skinShade; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(hx + 16.5, hy + 2); ctx.quadraticCurveTo(hx + 18.5, hy + 5, hx + 15.5, hy + 6); ctx.stroke();
    // Cheek
    ctx.fillStyle = C.cheek; ctx.beginPath(); ctx.ellipse(hx + 7, hy + 8, 4, 2.8, 0, 0, Math.PI * 2); ctx.fill();
    // Mouth: an open smile while running or jumping, a gentle one standing or bowing.
    if (pose === 'stand' || bowing) {
      ctx.strokeStyle = C.mouth; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(hx + 8.5, hy + 10); ctx.quadraticCurveTo(hx + 12, hy + 12.5, hx + 15, hy + 9.5); ctx.stroke();
      ctx.restore();
      arm(ctx, C, sh, phase, true, pose, lean);
      ctx.restore();
      return;
    }
    blob(ctx, () => {
      ctx.moveTo(hx + 8, hy + 9.5); ctx.quadraticCurveTo(hx + 12.5, hy + 10.5, hx + 15.5, hy + 9);
      ctx.quadraticCurveTo(hx + 14, hy + 15, hx + 10, hy + 13.5);
    }, C.mouth, 1.2);
    ctx.fillStyle = '#e8737a'; ctx.beginPath(); ctx.ellipse(hx + 11.5, hy + 12.6, 2.2, 1.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    arm(ctx, C, sh, phase, true, pose, lean);
    ctx.restore();
  }

  // ---------- facing the viewer, and bowing toward them ----------
  // A bow toward the viewer: the body folds forward, so the chest looks shorter, the head
  // comes down and forward, and the top of the head shows. The eyes close in the bow.
  function drawFront(ctx, C, opts = {}) {
    const k = Math.max(0, Math.min(1, opts.bow ?? 0)), cx = 60;
    const hipY = 101, shY = 70 + 20 * k, headY = 44 + 32 * k, headR = 17 + 1.5 * k;
    const skin = C.skin;
    // Legs and shoes
    for (const e of [-1, 1]) {
      seg(ctx, [[cx + e * 6, hipY], [cx + e * 7, 146]], 10, skin, 1.8);
      seg(ctx, [[cx + e * 7, 139], [cx + e * 7, 145]], 10.5, C.sock, 1.6);
      blob(ctx, () => { ctx.ellipse(cx + e * 8, 149, 8, 5, 0, Math.PI, 0); ctx.lineTo(cx + e * 8 + 8, 152); ctx.lineTo(cx + e * 8 - 8, 152); }, C.shoe, 1.8);
      ctx.fillStyle = C.sole; ctx.fillRect(cx + e * 8 - 8, 150.5, 16, 3);
      ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.strokeRect(cx + e * 8 - 8, 150.5, 16, 3);
    }
    // Shorts or skirt
    if (C.skirt) {
      blob(ctx, () => { ctx.moveTo(cx - 13, hipY - 12); ctx.lineTo(cx + 13, hipY - 12); ctx.lineTo(cx + 21, hipY + 15); ctx.quadraticCurveTo(cx, hipY + 19, cx - 21, hipY + 15); }, C.shorts, 2);
      ctx.strokeStyle = C.shortsFar; ctx.lineWidth = 1.4;
      ctx.beginPath(); for (const e of [-7, 0, 7]) { ctx.moveTo(cx + e * .7, hipY - 10); ctx.lineTo(cx + e * 1.3, hipY + 15); } ctx.stroke();
    } else {
      blob(ctx, () => { ctx.moveTo(cx - 14, hipY - 12); ctx.lineTo(cx + 14, hipY - 12); ctx.lineTo(cx + 15, hipY + 9); ctx.lineTo(cx + 2, hipY + 9); ctx.lineTo(cx, hipY + 2); ctx.lineTo(cx - 2, hipY + 9); ctx.lineTo(cx - 15, hipY + 9); }, C.shorts, 2);
    }
    // Arms: down by the sides; in a bow they hang forward, hands meeting in front.
    // Mami holds her hands together in front all the while.
    const handX = C.skirt ? 5 : 19 - 12 * k, handY = C.skirt ? hipY - 2 + 4 * k : hipY + 4;
    for (const e of [-1, 1]) {
      const s0 = [cx + e * 13, shY + 4], el = [cx + e * (17 - 3 * k), (shY + handY) / 2 + 2];
      seg(ctx, [s0, el, [cx + e * handX, handY]], 8, skin, 1.8);
      seg(ctx, [s0, [cx + e * 15, shY + 13]], 11, C.shirt, 1.8);
    }
    // Body: the shirt, shorter the deeper the bow.
    blob(ctx, () => {
      ctx.moveTo(cx - 13, hipY - 10); ctx.lineTo(cx + 13, hipY - 10);
      ctx.quadraticCurveTo(cx + 15, (hipY + shY) / 2, cx + 14, shY + 2);
      ctx.quadraticCurveTo(cx, shY - 4, cx - 14, shY + 2);
      ctx.quadraticCurveTo(cx - 15, (hipY + shY) / 2, cx - 13, hipY - 10);
    }, C.shirt, 2.2);
    ctx.fillStyle = C.stripe; ctx.fillRect(cx - 13.5, hipY - 21 + 4 * k, 27, 4.5);
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(cx - 13.5, hipY - 21 + 4 * k, 27, 4.5);
    // Hands in front, over the shirt
    for (const e of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + e * handX, handY, 4.6, 0, Math.PI * 2); ctx.fillStyle = skin; ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = INK; ctx.stroke(); }
    // Collar and neck (the neck hides as the head comes down)
    if (k < .6) seg(ctx, [[cx, shY - 1], [cx, headY + headR - 3]], 8, C.skinShade, 1.6);
    ctx.strokeStyle = C.collar; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - 6, shY + 1); ctx.quadraticCurveTo(cx, shY + 6, cx + 6, shY + 1); ctx.stroke();
    // Mami's ponytail peeks out behind her head.
    if (C.ponytail) {
      blob(ctx, () => { ctx.ellipse(cx + headR - 1, headY + 6, 6, 10, -.3, 0, Math.PI * 2); }, C.hair, 2);
    }
    // Head
    blob(ctx, () => { ctx.ellipse(cx, headY, headR, headR - .5, 0, 0, Math.PI * 2); }, skin, 2.2);
    for (const e of [-1, 1]) blob(ctx, () => { ctx.ellipse(cx + e * (headR + 1), headY + 3 + 3 * k, 3.4, 4.6, 0, 0, Math.PI * 2); }, C.skinShade, 1.4);
    // The face slides down as the head bows, so more of the hair shows.
    const fy = headY + 9 * k;
    ctx.save();
    ctx.beginPath(); ctx.ellipse(cx, headY, headR, headR - .5, 0, 0, Math.PI * 2); ctx.clip();
    const closed = k > .25 || (opts.live && (Date.now() % 3800) < 130);
    for (const e of [-1, 1]) {
      if (closed) { ctx.strokeStyle = C.eye; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx + e * 6.5, fy + 2, 3, rad(200), rad(340)); ctx.stroke(); }
      else {
        ctx.fillStyle = C.eye; ctx.beginPath(); ctx.ellipse(cx + e * 6.5, fy + 1, 2.4, 3.2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + e * 6.5 + .8, fy, .9, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = C.cheek; ctx.beginPath(); ctx.ellipse(cx + e * 10, fy + 7, 3.6, 2.4, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = C.mouth; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - 4, fy + 9); ctx.quadraticCurveTo(cx, fy + 12.5, cx + 4, fy + 9); ctx.stroke();
    ctx.restore();
    // Hair: a cap with a fringe; it covers more of the head the deeper the bow.
    const edge = headY - 7 + 12 * k;
    blob(ctx, () => {
      ctx.moveTo(cx - headR - 1, headY + 4 + 6 * k);
      ctx.bezierCurveTo(cx - headR - 2, headY - headR - 6, cx + headR + 2, headY - headR - 6, cx + headR + 1, headY + 4 + 6 * k);
      if (C.ponytail) {   // a soft fringe
        ctx.quadraticCurveTo(cx + 9, edge - 3, cx + 2, edge + 1); ctx.quadraticCurveTo(cx - 6, edge - 4, cx - headR - 1, headY + 4 + 6 * k);
      } else {            // Rova's spiky fringe
        ctx.lineTo(cx + 11, edge - 1); ctx.lineTo(cx + 7, edge + 3); ctx.lineTo(cx + 3, edge - 1); ctx.lineTo(cx - 2, edge + 3);
        ctx.lineTo(cx - 6, edge - 1); ctx.lineTo(cx - 10, edge + 2); ctx.lineTo(cx - headR - 1, headY + 4 + 6 * k);
      }
    }, C.hair, 2);
    if (C.ponytail) { ctx.beginPath(); ctx.arc(cx + headR - 2, headY - 6, 3.8, 0, Math.PI * 2); ctx.fillStyle = C.tie; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = INK; ctx.stroke(); }
    ctx.strokeStyle = C.hairShine; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx - 3, headY - 2, headR - 4, rad(200), rad(250)); ctx.stroke();
  }

  const draw = C => (ctx, phase, pose, opts = {}) => pose === 'front' ? drawFront(ctx, C, opts) : drawKid(ctx, C, phase, pose, opts);
  global.drawRova = draw(ROVA);
  global.drawMami = draw(MAMI);
})(typeof window !== 'undefined' ? window : globalThis);
