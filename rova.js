// Rova and Mami, drawn from parts so their arms and legs can really run.
// drawRova(ctx, phase, pose, opts) and drawMami(ctx, phase, pose, opts) paint them facing right
// in a 120 × 160 box with their feet near the bottom. phase is the run cycle in radians; pose is
// 'run' or 'jump'; opts.live lets them blink (leave it off when drawing frames to keep).
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

  function arm(ctx, C, sh, phase, near, pose) {
    let upper, fore;
    if (pose === 'jump') { upper = near ? 105 : -65; fore = near ? 150 : -25; }   // reach forward, the other arm back
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
    const run = pose === 'run';
    const bob = run ? -Math.abs(Math.sin(phase)) * 5 : 0;
    ctx.save();
    ctx.translate(0, bob);
    const lean = run ? 10 : 3;
    const hip = [57, 95], sh = at(hip[0], hip[1], 180 + lean, 32);
    const neck = at(sh[0], sh[1], 180 + lean, 6);
    const hx = sh[0] + 7, hy = sh[1] - 23;
    const headTilt = run ? Math.sin(phase * 2) * 1.5 : -4;

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

    arm(ctx, C, sh, phase + Math.PI, false, pose);
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
    // Mouth: an open smile while running or jumping.
    blob(ctx, () => {
      ctx.moveTo(hx + 8, hy + 9.5); ctx.quadraticCurveTo(hx + 12.5, hy + 10.5, hx + 15.5, hy + 9);
      ctx.quadraticCurveTo(hx + 14, hy + 15, hx + 10, hy + 13.5);
    }, C.mouth, 1.2);
    ctx.fillStyle = '#e8737a'; ctx.beginPath(); ctx.ellipse(hx + 11.5, hy + 12.6, 2.2, 1.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    arm(ctx, C, sh, phase, true, pose);
    ctx.restore();
  }

  global.drawRova = (ctx, phase, pose, opts) => drawKid(ctx, ROVA, phase, pose, opts);
  global.drawMami = (ctx, phase, pose, opts) => drawKid(ctx, MAMI, phase, pose, opts);
})(typeof window !== 'undefined' ? window : globalThis);
