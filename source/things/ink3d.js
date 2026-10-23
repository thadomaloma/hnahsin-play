// Ink3D: Hnahsin's small engine for hand-inked 3D things you can play with.
// A thing is built from solids (boxes, prisms), cylinders, balls, lines and flat
// pieces in world units: x toward the viewer's right, y toward the viewer's left,
// z up. A camera turns it, and render() writes it as SVG with ink outlines,
// three-tone shading, cast shadows on the ground and the parts' Mizo names
// (data-p) so a tap can tell which part was touched.
(function (global) {
  const INK = '#231e16';
  const D2R = Math.PI / 180;

  // ---------- vectors ----------
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const centroid = pts => { const s = [0, 0, 0]; for (const p of pts) { s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; } return mul(s, 1 / pts.length); };
  const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  function newell(pts) {
    const n = [0, 0, 0];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      n[0] += (a[1] - b[1]) * (a[2] + b[2]); n[1] += (a[2] - b[2]) * (a[0] + b[0]); n[2] += (a[0] - b[0]) * (a[1] + b[1]);
    }
    return norm(n);
  }

  // The light comes from above, in front and to the right; it stays put while the thing turns.
  const LIGHT = norm([0.6, -0.25, 1]);

  // ---------- colours ----------
  const hexRgb = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  const mixMemo = new Map();
  function mix(a, b, t) {
    if (t <= 0.005) return a;
    if (t >= 0.995) return b;
    const key = a + b + Math.round(t * 50);
    let c = mixMemo.get(key);
    if (!c) {
      const A = hexRgb(a), B = hexRgb(b), k = Math.round(t * 50) / 50;
      c = '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
      if (mixMemo.size > 4000) mixMemo.clear();
      mixMemo.set(key, c);
    }
    return c;
  }
  // A palette is three inks: l (lit), m (middle), d (in shade).
  const tone = (pal, b) => b > 0.62 ? pal.l : b > 0.2 ? pal.m : pal.d;

  // ---------- camera (orthographic: yaw turns around the up axis, pitch looks down) ----------
  function camera(yaw, pitch) {
    const t = yaw * D2R, p = pitch * D2R, ct = Math.cos(t), st = Math.sin(t), cp = Math.cos(p), sp = Math.sin(p);
    return {
      yaw, pitch,
      view: [st * cp, ct * cp, sp],                                  // toward the viewer
      P: q => [q[0] * ct - q[1] * st, -q[2] * cp + (q[0] * st + q[1] * ct) * sp],
      depth: q => (q[0] * st + q[1] * ct) * cp + q[2] * sp,          // larger is nearer
    };
  }

  // ---------- shapes ----------
  // A closed solid: faces with outward normals (found from the solid's centre).
  function solid(faces, o = {}) {
    const c = o.center || centroid(faces.flatMap(f => f.pts));
    for (const f of faces) {
      let n = newell(f.pts);
      if (dot(n, sub(centroid(f.pts), c)) < 0) n = mul(n, -1);
      f.n = n;
      if (f.part === undefined) f.part = o.part;
      if (!f.pal && !f.fill) f.pal = o.pal;
    }
    return { ...o, t: 'solid', faces };
  }
  // Eight corners: 0–3 round the bottom, 4–7 the same round the top.
  const HEX = { zn: [0, 3, 2, 1], zp: [4, 5, 6, 7], yn: [0, 1, 5, 4], xp: [1, 2, 6, 5], yp: [2, 3, 7, 6], xn: [3, 0, 4, 7] };
  function hexa(c8, o = {}) {
    const faces = [];
    for (const k in HEX) {
      if (o.skip && o.skip.includes(k)) continue;
      faces.push({ key: k, pts: HEX[k].map(i => c8[i]), pal: o.pals && o.pals[k], decals: o.decals && o.decals[k] });
    }
    return solid(faces, { ...o, center: centroid(c8) });
  }
  const box = (x0, x1, y0, y1, z0, z1, o) => hexa([
    [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
    [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], o);
  // A board hinged on one edge: h = hinge foot, w = width direction (unit), out = the side it swings to,
  // angle = how far it is open (degrees). o.decal(map) gives marks for its outer face, where
  // map(u, v) is the point u along the board and v up from its foot.
  function panel(h, w, out, width, height, thick, angle, o = {}) {
    const a = angle * D2R, dw = add(mul(w, Math.cos(a)), mul(out, Math.sin(a))), dn = add(mul(out, Math.cos(a)), mul(w, -Math.sin(a)));
    const up = [0, 0, height];
    const b0 = h, b1 = add(h, mul(dw, width)), b2 = add(b1, mul(dn, thick)), b3 = add(h, mul(dn, thick));
    const map = (u, v) => add(add(add(h, mul(dw, u)), [0, 0, v]), mul(dn, thick + 0.05));
    const decals = o.decal ? { yp: o.decal(map) } : undefined;
    return hexa([b0, b1, b2, b3, add(b0, up), add(b1, up), add(b2, up), add(b3, up)], { ...o, decals });
  }
  const ball = (c, r, o = {}) => ({ ...o, t: 'ball', c, r });
  const cyl = (c, z0, z1, r0, r1, o = {}) => ({ ...o, t: 'cyl', c, z0, z1, r0, r1: r1 ?? r0 });
  const line = (pts, o = {}) => ({ shadow: false, ...o, t: 'line', pts });
  const poly = (pts, o = {}) => ({ ...o, t: 'poly', pts });
  const group = (kids, o = {}) => ({ ...o, t: 'group', kids });

  function vertsOf(p) {
    if (p._v) return p._v;
    let v;
    switch (p.t) {
      case 'solid': v = p.faces.flatMap(f => f.pts); break;
      case 'ball': { v = []; const r = p.r; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, c = Math.cos(a) * r, s = Math.sin(a) * r; v.push(add(p.c, [c, s, 0]), add(p.c, [c, 0, s]), add(p.c, [0, c, s])); } break; }
      case 'cyl': { v = []; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; v.push([p.c[0] + Math.cos(a) * p.r0, p.c[1] + Math.sin(a) * p.r0, p.z0], [p.c[0] + Math.cos(a) * p.r1, p.c[1] + Math.sin(a) * p.r1, p.z1]); } break; }
      case 'group': v = p.kids.flatMap(vertsOf); break;
      default: v = p.pts;
    }
    return (p._v = v);
  }

  // Convex hull of 2D points (monotone chain).
  function hull(pts) {
    const s = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    if (s.length < 3) return s;
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const p of s) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = s.length - 1; i >= 0; i--) { const p = s[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }

  const f1 = n => (Math.round(n * 10) / 10).toString();
  // The pen look: lines are cut into short steps and nudged by a smooth noise of their place on
  // the page, so edges wobble like hand inking. Shared edges get the same nudge, so faces still meet.
  // (Done here rather than with an SVG filter, which is slow on phones.)
  let WOB = 0;
  const nz = (x, y) => [Math.sin(x * 0.23 + y * 0.11) + 0.8 * Math.sin(x * 0.071 - y * 0.17 + 1.3), Math.sin(y * 0.21 - x * 0.09 + 2.1) + 0.8 * Math.sin(y * 0.083 + x * 0.15 + 0.7)];
  function wobble(pts, open) {
    const out = [], n = pts.length, segs = open ? n - 1 : n;
    for (let i = 0; i < segs; i++) {
      const a = pts[i], b = pts[(i + 1) % n], k = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 7));
      for (let j = 0; j < k; j++) out.push([a[0] + (b[0] - a[0]) * j / k, a[1] + (b[1] - a[1]) * j / k]);
    }
    if (open) out.push(pts[n - 1]);
    return out.map(p => { const v = nz(p[0], p[1]); return [p[0] + v[0] * WOB, p[1] + v[1] * WOB]; });
  }
  const d2 = (pts, open) => 'M' + (WOB ? wobble(pts, open) : pts).map(s => f1(s[0]) + ' ' + f1(s[1])).join('L') + (open ? '' : 'Z');
  // A circle, or with the pen look a wobbly ring.
  function circ(x, y, r, attrs) {
    if (!WOB) return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}"${attrs}/>`;
    const n = Math.max(14, Math.min(32, Math.round(r * 2.6)));
    return `<path d="${d2(Array.from({ length: n }, (_, i) => [x + r * Math.cos(i / n * 2 * Math.PI), y + r * Math.sin(i / n * 2 * Math.PI)]))}"${attrs}/>`;
  }

  // ---------- render ----------
  // scene: { ground: [shapes drawn first, in order], groundDecals: [...], clip: [3D points of the ground top],
  //          items: [shapes sorted far to near] }
  // o: { tint(colour) → colour, hl: part to highlight, ink: line weight, wobble: pen look strength,
  //      light: direction toward the sun (unit vector) }
  function render(sc, cam, o = {}) {
    WOB = o.wobble || 0;
    const Lt = o.light || LIGHT;   // where the sun is: shading and shadows follow it
    const T = o.tint || (c => c), W = o.ink || 1, out = [];
    const P = cam.P, d3 = (pts, open) => d2(pts.map(P), open);
    const tag = part => part ? ` data-p="${part}"${part === o.hl ? ' class="hl"' : ''}` : '';
    const col = (c, glow) => glow ? c : T(c);
    // A shape sorts by its centre, or by `at` when given (a group that should sort as one point).
    const depthOf = p => p._d ?? (p._d = cam.depth(p.at || (p.c && p.t === 'ball' ? p.c : centroid(vertsOf(p)))) + (p.bias || 0));
    const light2 = (() => { const s = P(Lt), l = Math.hypot(s[0], s[1]) || 1; return [s[0] / l, s[1] / l]; })();

    function decal(d, part) {
      const fill = d.fill ? col(d.fill, d.glow) : 'none';
      const stroke = d.stroke ? col(d.stroke, d.glow) : d.fill ? INK : 'none';
      const sw = d.w ?? (d.fill ? W : 0.6 * W);
      out.push(`<path d="${d3(d.pts, d.open)}" fill="${fill}" stroke="${stroke}" stroke-width="${f1(sw)}"${d.opacity != null ? ` opacity="${d.opacity.toFixed(2)}"` : ''}${tag(d.part ?? part)}/>`);
    }

    function draw(p) {
      switch (p.t) {
        case 'solid': {
          const vis = [];
          for (const f of p.faces) if (f.both || dot(f.n, cam.view) > 1e-4) vis.push([cam.depth(centroid(f.pts)), f]);
          vis.sort((a, b) => a[0] - b[0]);
          for (const [, f] of vis) {
            const fill = f.fill ? col(f.fill, f.glow) : T(tone(f.pal, dot(f.n, Lt)));
            const part = f.part ?? p.part;   // a face takes its group's name when it has none
            out.push(`<path d="${d3(f.pts)}" fill="${fill}" stroke="${INK}" stroke-width="${f1(W * (p.w || 1))}" stroke-linejoin="round"${tag(part)}/>`);
            if (f.decals) for (const d of f.decals) decal(d, part);
          }
          break;
        }
        case 'ball': {
          const [x, y] = P(p.c), r = p.r, op = p.opacity != null ? ` opacity="${p.opacity.toFixed(2)}"` : '';
          if (p.fill) {
            const ink = p.ink === false ? '' : ` stroke="${INK}" stroke-width="${f1(W * (p.w || 0.8))}"`;
            out.push(circ(x, y, r, ` fill="${col(p.fill, p.glow)}"${ink}${op}${tag(p.part)}`));
            break;
          }
          const hx = x + light2[0] * r * 0.3, hy = y + light2[1] * r * 0.3;
          out.push(`<g${op}${tag(p.part)}>` + circ(x, y, r, ` fill="${T(p.pal.m)}"`) + circ(hx, hy, r * 0.62, ` fill="${T(p.pal.l)}"`) +
            circ(x, y, r, ` fill="none" stroke="${INK}" stroke-width="${f1(W * (p.w || 1))}"`) + '</g>');
          break;
        }
        case 'cyl': {
          const N = 18, [cx, cy] = p.c, slope = (p.r0 - p.r1) / (p.z1 - p.z0);
          const ring = (z, r) => Array.from({ length: N }, (_, i) => { const a = i / N * 2 * Math.PI; return [cx + r * Math.cos(a), cy + r * Math.sin(a), z]; });
          const B = ring(p.z0, p.r0), U = ring(p.z1, p.r1);
          let s = `<g${tag(p.part)}>`;
          for (let i = 0; i < N; i++) {
            const a = (i + 0.5) / N * 2 * Math.PI, n = norm([Math.cos(a), Math.sin(a), slope]);
            if (dot(n, cam.view) <= 0) continue;
            const fill = T(tone(p.pal, dot(n, Lt))), j = (i + 1) % N;
            s += `<path d="${d3([B[i], B[j], U[j], U[i]])}" fill="${fill}" stroke="${fill}" stroke-width=".6"/>`;
          }
          for (const z of p.bands || []) {
            const r = p.r0 + (p.r1 - p.r0) * (z - p.z0) / (p.z1 - p.z0), R = ring(z, r);
            for (let i = 0; i < N; i++) {
              const a = (i + 0.5) / N * 2 * Math.PI;
              if (dot([Math.cos(a), Math.sin(a), 0], cam.view) <= 0.05) continue;
              s += `<path d="${d3([R[i], R[(i + 1) % N]], true)}" stroke="${INK}" stroke-width="${f1(0.6 * W)}" fill="none"/>`;
            }
          }
          s += `<path d="${d2(hull(B.concat(U).map(P)))}" fill="none" stroke="${INK}" stroke-width="${f1(W)}" stroke-linejoin="round"/>`;
          if (p.cap !== false) s += `<path d="${d3(U)}" fill="${T(p.capFill || p.pal.l)}" stroke="${INK}" stroke-width="${f1(W)}"/>`;
          out.push(s + '</g>');
          break;
        }
        case 'line': {
          const d = d3(p.pts, true), w = p.w || 1;
          const op = p.opacity != null ? ` opacity="${p.opacity.toFixed(2)}"` : '';
          out.push(`<g fill="none" stroke-linecap="round" stroke-linejoin="round"${op}${tag(p.part)}>` +
            (p.ink === false ? '' : `<path d="${d}" stroke="${INK}" stroke-width="${f1(w + 1.3 * W)}"/>`) +
            `<path d="${d}" stroke="${col(p.col, p.glow)}" stroke-width="${f1(w)}"/></g>`);
          break;
        }
        case 'poly': {
          let n = newell(p.pts); if (dot(n, cam.view) < 0) n = mul(n, -1);
          const fill = p.fill ? col(p.fill, p.glow) : T(tone(p.pal, dot(n, Lt)));
          out.push(`<path d="${d3(p.pts)}" fill="${fill}" stroke="${p.ink === false ? fill : INK}" stroke-width="${f1(W * (p.w || 0.9))}" stroke-linejoin="round"${tag(p.part)}/>`);
          break;
        }
        case 'group': {
          const kids = p.kids.slice().sort((a, b) => depthOf(a) - depthOf(b));
          for (const k of kids) { if (k.part === undefined && p.part) k.part = p.part; draw(k); }
          break;
        }
      }
    }

    // Shadows fall along the light onto the ground (z = 0).
    function shadow(p) {
      if (p.shadow === false) return '';
      if (p.t === 'group') return p.kids.map(shadow).join('');
      const pts = vertsOf(p).map(v => { const z = Math.max(0, v[2]); return P([v[0] - Lt[0] * z / Lt[2], v[1] - Lt[1] * z / Lt[2], 0]); });
      const h = hull(pts);
      return h.length > 2 ? `<path d="${d2(h)}"/>` : '';
    }

    for (const g of sc.ground || []) draw(g);
    for (const g of sc.groundDecals || []) draw(g);
    if (sc.clip) out.push(`<defs><clipPath id="gclip"><path d="${d3(sc.clip)}"/></clipPath></defs>`);
    out.push(`<g${sc.clip ? ' clip-path="url(#gclip)"' : ''} fill="${o.shadowColour || '#41538f'}" opacity="${(o.shadowOpacity ?? 0.24).toFixed(2)}" pointer-events="none">${(sc.items || []).map(shadow).join('')}</g>`);
    const items = (sc.items || []).slice().sort((a, b) => depthOf(a) - depthOf(b));
    for (const p of items) draw(p);
    WOB = 0;
    return out.join('');
  }

  global.Ink3D = { INK, LIGHT, add, sub, mul, dot, norm, lerp3, centroid, mix, tone, camera, solid, hexa, box, panel, ball, cyl, line, poly, group, hull, render };
})(typeof window !== 'undefined' ? window : globalThis);
