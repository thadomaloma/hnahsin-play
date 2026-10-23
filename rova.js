// Rova, drawn from parts so his arms and legs can really run.
// drawRova(ctx, phase, pose) paints him facing right in a 120 × 160 box with his feet
// near the bottom. phase is the run cycle in radians; pose is 'run' or 'jump'.
// Used by the home page and Rova's Journey, so he looks the same everywhere.
(function (global) {
  const C = {
    skin: '#e9b48a', skinFar: '#cf9a72', hair: '#1d1b22', shirt: '#1565c0', shirtFar: '#0f4f9e',
    stripe: '#ffc94a', shorts: '#0d2a4a', shortsFar: '#0a2038', shoe: '#ffffff', sole: '#c2185b', eye: '#1d1b22',
  };
  const rad = d => d * Math.PI / 180;

  // A limb: two segments from a joint, angles in degrees from straight down (forward is positive).
  function limb(ctx, x, y, a1, len1, a2, len2, w1, w2, c1, c2) {
    const kx = x + Math.sin(rad(a1)) * len1, ky = y + Math.cos(rad(a1)) * len1;
    const ex = kx + Math.sin(rad(a2)) * len2, ey = ky + Math.cos(rad(a2)) * len2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = c2; ctx.lineWidth = w2;
    ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.strokeStyle = c1; ctx.lineWidth = w1;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(kx, ky); ctx.stroke();
    return [ex, ey, a2];
  }

  function shoe(ctx, x, y, a, near) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(-rad(a) * .35);
    ctx.fillStyle = near ? C.shoe : '#dfe6ee';
    ctx.beginPath(); ctx.ellipse(5, 2, 10, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.sole; ctx.fillRect(-5, 5, 21, 3);
    ctx.restore();
  }

  function leg(ctx, hip, phase, near, pose) {
    let thigh, knee;
    if (pose === 'jump') { thigh = near ? 55 : 20; knee = near ? -70 : -85; }
    else {
      thigh = 34 * Math.sin(phase);
      // The knee folds while the leg swings forward, and straightens as it pushes back.
      knee = -(14 + 62 * Math.max(0, Math.cos(phase)));
    }
    const skin = near ? C.skin : C.skinFar;
    const [fx, fy, a] = limb(ctx, hip[0], hip[1], thigh, 25, thigh + knee, 26, 11, 10, skin, skin);
    // Shorts cover the top half of the thigh.
    ctx.strokeStyle = near ? C.shorts : C.shortsFar; ctx.lineWidth = 15; ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(hip[0], hip[1]); ctx.lineTo(hip[0] + Math.sin(rad(thigh)) * 13, hip[1] + Math.cos(rad(thigh)) * 13); ctx.stroke();
    shoe(ctx, fx, fy, a, near);
  }

  function arm(ctx, sh, phase, near, pose) {
    let upper, fore;
    if (pose === 'jump') { upper = near ? 120 : -55; fore = near ? 150 : -15; }
    else { upper = -40 * Math.sin(phase); fore = upper + 78; }
    const [hx, hy] = limb(ctx, sh[0], sh[1], upper, 20, fore, 18, 10, 8,
      near ? C.shirt : C.shirtFar, near ? C.skin : C.skinFar);
    ctx.fillStyle = near ? C.skin : C.skinFar;
    ctx.beginPath(); ctx.arc(hx, hy, 4.5, 0, Math.PI * 2); ctx.fill();
  }

  function drawRova(ctx, phase = 0, pose = 'run') {
    const bob = pose === 'run' ? -Math.abs(Math.sin(phase)) * 5 : 0;
    ctx.save();
    ctx.translate(0, bob);
    const lean = pose === 'run' ? 9 : 2;
    const hip = [58, 96], sh = [hip[0] + Math.sin(rad(lean)) * 34, hip[1] - Math.cos(rad(lean)) * 34];

    arm(ctx, sh, phase + Math.PI, false, pose);
    leg(ctx, hip, phase + Math.PI, false, pose);

    // Body: shirt with a gold stripe, shorts at the hips.
    ctx.lineCap = 'round';
    ctx.strokeStyle = C.shirt; ctx.lineWidth = 26;
    ctx.beginPath(); ctx.moveTo(hip[0], hip[1] - 6); ctx.lineTo(sh[0], sh[1] + 4); ctx.stroke();
    ctx.strokeStyle = C.stripe; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(hip[0] - 13, hip[1] - 14); ctx.lineTo(hip[0] + 14, hip[1] - 12); ctx.stroke();
    ctx.fillStyle = C.shorts;
    ctx.beginPath(); ctx.ellipse(hip[0], hip[1] + 1, 15, 10, 0, 0, Math.PI * 2); ctx.fill();

    leg(ctx, hip, phase, true, pose);

    // Head: face, ear, hair, eye and a smile.
    const hx = sh[0] + 6, hy = sh[1] - 22;
    ctx.fillStyle = C.skin;
    ctx.beginPath(); ctx.arc(hx, hy, 17, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.skinFar;
    ctx.beginPath(); ctx.arc(hx - 4, hy + 2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.hair;
    ctx.beginPath(); ctx.arc(hx - 1, hy - 3, 17.5, Math.PI * .92, Math.PI * 2.08); ctx.lineTo(hx + 12, hy - 6);
    ctx.quadraticCurveTo(hx + 2, hy - 2, hx - 6, hy - 8); ctx.quadraticCurveTo(hx - 12, hy - 2, hx - 17, hy + 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.eye;
    ctx.beginPath(); ctx.ellipse(hx + 9, hy + 1, 2.2, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#9a4a3a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(hx + 9, hy + 6, 4.5, rad(20), rad(110)); ctx.stroke();

    arm(ctx, sh, phase, true, pose);
    ctx.restore();
  }

  global.drawRova = drawRova;
})(typeof window !== 'undefined' ? window : globalThis);
