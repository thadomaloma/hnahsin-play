// People for the Ink3D figures: one builder for the family, Rova and Mami, and the weaver.
// person(at, dir, o) returns the shapes of someone standing (or sitting) at `at`, facing angle
// `dir` (radians, 0 = toward +x).
// o: h (height), shirt, lower ('skirt' or 'shorts'), lowerPal, bands (skirt stripes, as parts of h),
//    hair, bun, ponytail, tie, stripe, shoes, pose ('stand', 'walk', 'run', 'sweep', 'wash', 'sit'),
//    phase (walk cycle), t (clock, for moving hands), hands ([left, right] points to reach for).
const Ink3DPeople = (() => {
  const { ball, cyl, line, add, mul } = Ink3D;
  const SKIN = { l: '#efc29b', m: '#d9a47c', d: '#7a4f33' };

  function person(at, dir, o) {
    const d = [Math.cos(dir), Math.sin(dir), 0], sd = [-d[1], d[0], 0], h = o.h, ph = o.phase || 0, t = o.t || 0;
    const P = (f, sv, z) => add(add(add(at, mul(d, f)), mul(sd, sv)), [0, 0, z]);
    const sit = o.pose === 'sit';
    // How far the upper body is lowered (kneeling to wash, sitting on the floor), and leaned forward.
    const crouch = o.pose === 'wash' ? 0.32 * h : sit ? 0.27 * h : 0;
    const lean = o.pose === 'sweep' ? 0.06 * h : o.pose === 'wash' ? 0.1 * h : sit ? (o.lean || 0) * h : 0;
    const hip = 0.46 * h - crouch, run = o.pose === 'run' ? 1.6 : 1;
    const kids = [];
    // Legs
    for (const side of [-1, 1]) {
      if (o.pose === 'wash') kids.push(line([P(0, side * 0.08 * h, hip), P(0.2 * h, side * 0.09 * h, 0.12 * h), P(-0.05 * h, side * 0.09 * h, 0.4)], { col: SKIN.m, w: 1.5 }));
      else if (sit) {   // straight out in front, knees a little up
        kids.push(line([P(0, side * 0.08 * h, hip), P(0.22 * h, side * 0.09 * h, 0.1 * h), P(0.44 * h, side * 0.09 * h, 0.5)], { col: SKIN.m, w: 1.7 }));
        kids.push(ball(P(0.46 * h, side * 0.09 * h, 0.9), 0.055 * h, { fill: SKIN.m, w: 0.5 }));
      } else {
        const sw = (o.pose === 'walk' || o.pose === 'run') ? Math.sin(ph + (side > 0 ? 0 : Math.PI)) * 0.16 * h * run : 0;
        kids.push(line([P(0, side * 0.07 * h, hip), P(sw, side * 0.08 * h, 0.4)], { col: SKIN.m, w: 1.6 }));
        if (o.shoes) kids.push(ball(P(sw + 0.03 * h, side * 0.08 * h, 0.6), 0.06 * h, { fill: o.shoes, w: 0.6 }));
      }
    }
    // Lower body: a puan skirt with stripes, or shorts
    const Z = at[2];   // the floor they stand on
    if (o.lower === 'skirt') {
      const bot = sit ? 0.02 * h : Math.max(0.3, 0.16 * h - crouch);
      kids.push(cyl(P(lean * 0.3 + (sit ? 0.06 * h : 0), 0, 0).slice(0, 2), Z + bot, Z + 0.52 * h - crouch, sit ? 0.24 * h : 0.2 * h, 0.14 * h,
        { pal: o.lowerPal, bands: o.bands ? o.bands.map(f => Z + f * h - crouch).filter(z => z > Z + bot + 0.2) : [], cap: false }));
    } else kids.push(cyl(P(0, 0, 0).slice(0, 2), Z + 0.36 * h - crouch, Z + 0.52 * h - crouch, 0.15 * h, 0.14 * h, { pal: o.lowerPal, cap: false }));
    // Body and head
    const body = P(lean, 0, 0);
    kids.push(cyl(body.slice(0, 2), Z + 0.5 * h - crouch, Z + 0.79 * h - crouch, 0.14 * h, 0.115 * h, { pal: o.shirt }));
    if (o.stripe) kids.push(cyl(body.slice(0, 2), Z + 0.6 * h - crouch, Z + 0.645 * h - crouch, 0.137 * h, 0.134 * h, { pal: o.stripe, cap: false }));
    const head = P(lean * 1.4, 0, 0.9 * h - crouch), r = 0.13 * h;
    kids.push(ball(add(head, add(mul(d, -0.22 * r), [0, 0, 0.18 * r])), r * 1.04, { fill: o.hair }));
    kids.push(ball(add(head, mul(d, 0.12 * r)), r, { pal: SKIN }));
    if (o.bun) kids.push(ball(add(head, add(mul(d, -0.95 * r), [0, 0, 0.35 * r])), 0.45 * r, { fill: o.hair }));
    if (o.ponytail) {   // swings as she runs
      const sw = Math.sin(ph * 2) * 0.25 * r;
      kids.push(ball(add(head, add(add(mul(d, -1.15 * r), mul(sd, sw)), [0, 0, 0.1 * r])), 0.42 * r, { fill: o.hair }));
      kids.push(ball(add(head, add(add(mul(d, -1.5 * r), mul(sd, sw * 1.6)), [0, 0, -0.35 * r])), 0.32 * r, { fill: o.hair }));
      kids.push(ball(add(head, add(mul(d, -0.95 * r), [0, 0, 0.3 * r])), 0.2 * r, { fill: o.tie || '#c2185b' }));
    }
    for (const e of [-1, 1]) kids.push(ball(add(head, add(add(mul(d, 0.95 * r), mul(sd, 0.38 * r * e)), [0, 0, 0.12 * r])), 0.09 * r + 0.15, { fill: '#231e16', ink: false }));
    // Arms: to the given hand points, or as the pose says
    for (const side of [-1, 1]) {
      const sh = P(lean, side * 0.15 * h, 0.75 * h - crouch);
      let hand;
      if (o.hands) hand = o.hands[side < 0 ? 0 : 1];
      else if (o.pose === 'sweep') hand = P(lean + 0.2 * h, side * 0.04 * h, 0.5 * h + side * 0.06 * h);
      else if (o.pose === 'wash') hand = P(0.36 * h, side * 0.07 * h, 0.3 * h - crouch * 0.4 + 0.05 * h * Math.sin(t * 7 + side));
      else { const sw = (o.pose === 'walk' || o.pose === 'run') ? -Math.sin(ph + (side > 0 ? 0 : Math.PI)) * 0.14 * h * run : 0; hand = P(lean + sw, side * 0.19 * h, 0.45 * h - crouch); }
      // An elbow, so a reaching arm bends rather than stretching
      const mid = add(mul(add(sh, hand), 0.5), [0, 0, -0.05 * h]);
      kids.push(line([sh, mid, hand], { col: o.shirt.m, w: 1.5 }));
      kids.push(ball(hand, 0.06 * h, { fill: SKIN.m, w: 0.5 }));
    }
    return kids;
  }

  return { person, SKIN };
})();
