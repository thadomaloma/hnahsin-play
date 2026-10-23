// Motion for the home page. Everything here is extra: the page reads and works without it,
// and none of it runs when the viewer asks for reduced motion.
(() => {
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const hero = $('.hero');
  let heroOnScreen = true;
  new IntersectionObserver(([e]) => { heroOnScreen = e.isIntersecting; }).observe(hero);

  // ------------------------------------------------ words that scroll past
  const WORDS = [
    ['ui', '🐕', 'dog'], ['tui', '💧', 'water'], ['ni', '☀️', 'sun'], ['in', '🏠', 'house'], ['ruah', '🌧️', 'rain'],
    ['pangpâr', '🌸', 'flower'], ['sangha', '🐟', 'fish'], ['thingkung', '🌳', 'tree'], ['zawhte', '🐈', 'cat'],
    ['thla', '🌙', 'moon'], ['lehkhabu', '📖', 'book'], ['sava', '🐦', 'bird'], ['arsi', '⭐', 'star'],
    ['mei', '🔥', 'fire'], ['sikul', '🏫', 'school'], ['balhla', '🍌', 'banana'], ['lui', '🏞️', 'river'],
    ['bâwngnu', '🐄', 'cow'], ['motor', '🚗', 'car'], ['thingpui', '🍵', 'tea'], ['hnute', '🥛', 'milk'],
    ['vawk', '🐖', 'pig'], ['chhum', '☁️', 'cloud'], ['kawng', '🛣️', 'road'], ['muhil', '😴', 'sleep'], ['sen', '🔴', 'red'],
  ];
  $$('.ticker .row').forEach((row, i) => {
    const half = i ? WORDS.slice(13).concat(WORDS.slice(0, 13)) : WORDS;
    const chips = half.map(([m, e, g]) => `<span class="word"><i>${e}</i><b>${m}</b><small>${g}</small></span>`).join('');
    row.innerHTML = `<div class="track">${chips}${chips}</div>`; // twice, so the loop has no seam
  });

  // ------------------------------------------------ reveal on scroll
  document.documentElement.classList.add('js');
  const reveal = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    reveal.unobserve(e.target);
  }), { rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal]').forEach(el => {
    [...el.children].forEach((child, i) => child.style.setProperty('--d', i * 90 + 'ms'));
    reveal.observe(el);
  });

  // ------------------------------------------------ numbers count up
  const counter = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    counter.unobserve(e.target);
    const el = e.target, to = Number(el.dataset.count), start = performance.now(), ms = 1400;
    if (calm) { el.textContent = to.toLocaleString('en'); return; }
    const step = t => {
      const p = Math.min(1, (t - start) / ms), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * eased).toLocaleString('en');
      if (p < 1) requestAnimationFrame(step); else el.classList.add('done');
    };
    requestAnimationFrame(step);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => { if (!calm) el.textContent = '0'; counter.observe(el); });

  // ------------------------------------------------ button ripple
  document.addEventListener('pointerdown', e => {
    const b = e.target.closest('.btn'); if (!b || calm) return;
    const r = b.getBoundingClientRect(), s = document.createElement('span');
    s.className = 'ripple';
    s.style.left = e.clientX - r.left + 'px'; s.style.top = e.clientY - r.top + 'px';
    b.appendChild(s); setTimeout(() => s.remove(), 600);
  });

  // ------------------------------------------------ the letter tiles
  const tiles = $$('.tile');
  const boing = t => { t.classList.remove('boing'); void t.offsetWidth; t.classList.add('boing'); };
  tiles.forEach(t => {
    t.addEventListener('pointerenter', () => boing(t));
    t.addEventListener('pointerdown', () => boing(t));
  });
  if (!calm) setInterval(() => {
    if (!heroOnScreen || document.hidden) return;
    tiles.forEach((t, i) => setTimeout(() => boing(t), i * 80));
  }, 7000);

  // ------------------------------------------------ install on the phone
  // Android and desktop Chrome offer a prompt; iPhone needs Share → Add to Home Screen.
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
  let prompt = null;
  if (!standalone) {
    addEventListener('beforeinstallprompt', e => { e.preventDefault(); prompt = e; $('#install').hidden = false; $('#install-btn').hidden = false; });
    if (ios) { $('#install').hidden = false; $('#install-btn').hidden = true; $('#install-ios').hidden = false; }
    $('#install-btn').addEventListener('click', async () => {
      if (!prompt) return;
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      prompt = null;
      if (outcome === 'accepted') $('#install').hidden = true;
    });
    addEventListener('appinstalled', () => { $('#install').hidden = true; });
  }

  // A canvas that draws Rova at the screen's sharpness.
  const rovaOn = canvas => {
    const ctx = canvas.getContext('2d');
    return (phase, pose) => {
      const dpr = Math.min(devicePixelRatio || 1, 3), w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w) return;
      if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
      ctx.setTransform(canvas.width / 120, 0, 0, canvas.height / 160, 0, 0);
      ctx.clearRect(0, 0, 120, 160);
      drawRova(ctx, phase, pose);
    };
  };
  const drawCover = rovaOn($('.cover.journey .runner canvas'));
  if (calm) { $('.rova').hidden = true; drawCover(.6, 'run'); return; }

  // ------------------------------------------------ cosmos petals on the wind
  const canvas = $('.petals'), ctx = canvas.getContext('2d');
  const COLOURS = ['#f06292', '#f48fb1', '#fbe4ee', '#9c7cf0', '#c5b5ff'];
  let W = 0, H = 0, petals = [];
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = hero.clientWidth; H = hero.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(40, W / 32));
    while (petals.length < n) petals.push(petal(true));
    petals.length = n;
  };
  const petal = anywhere => ({
    x: anywhere ? Math.random() * W : -20, y: Math.random() * H * .85,
    r: 5 + Math.random() * 7, vx: 22 + Math.random() * 38, vy: 8 + Math.random() * 18,
    spin: Math.random() * 6, vs: 1 + Math.random() * 2.5, sway: Math.random() * 6,
    c: COLOURS[Math.floor(Math.random() * COLOURS.length)], a: .55 + Math.random() * .4,
  });
  let wind = 0, last = 0;
  const draw = t => {
    requestAnimationFrame(draw);
    if (!heroOnScreen || document.hidden) { last = t; return; }
    const dt = Math.min(.05, (t - (last || t)) / 1000); last = t;
    wind = Math.sin(t / 3000) * 18 + Math.sin(t / 1100) * 6;
    ctx.clearRect(0, 0, W, H);
    for (const p of petals) {
      p.x += (p.vx + wind) * dt; p.y += (p.vy + Math.sin(t / 700 + p.sway) * 14) * dt; p.spin += p.vs * dt;
      if (p.x > W + 20 || p.y > H + 20) Object.assign(p, petal(false));
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.spin); ctx.scale(1, Math.abs(Math.cos(p.spin * 1.3)) * .8 + .2);
      ctx.globalAlpha = p.a; ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * .55, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  };
  resize(); addEventListener('resize', resize); requestAnimationFrame(draw);

  // ------------------------------------------------ depth: pointer and scroll parallax
  const layers = $$('[data-depth]').map(el => ({ el, d: Number(el.dataset.depth) }));
  let px = 0, py = 0, tx = 0, ty = 0;
  if (finePointer) hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width * 2 - 1; ty = (e.clientY - r.top) / r.height * 2 - 1;
  });
  hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
  const content = $('.hero .wrap');
  const parallax = () => {
    requestAnimationFrame(parallax);
    if (!heroOnScreen) return;
    px += (tx - px) * .06; py += (ty - py) * .06;
    const s = scrollY;
    for (const { el, d } of layers) el.style.transform = `translate3d(${-px * d}px, ${-py * d * .6 + s * d * .02}px, 0)`;
    content.style.transform = `translate3d(0, ${s * .28}px, 0)`;
    content.style.opacity = Math.max(0, 1 - s / (hero.clientHeight * .7));
  };
  requestAnimationFrame(parallax);

  // ------------------------------------------------ Rova runs along the hill and hops the flowers
  const field = $('.field'), hill = $('#hill-front'), rova = $('.rova');
  const len = hill.getTotalLength();
  const samples = Array.from({ length: 121 }, (_, i) => hill.getPointAtLength(len * i / 120)).filter(p => p.y < 229);
  const hillY = x => { // the hill's height at x, in the SVG's 1440 × 230 box
    let best = samples[0];
    for (const p of samples) if (Math.abs(p.x - x) < Math.abs(best.x - x)) best = p;
    return best.y;
  };
  let rx = -60, hop = 0;
  const drawHill = rovaOn($('canvas', rova));
  const run = t => {
    requestAnimationFrame(run);
    if (!heroOnScreen || document.hidden) return;
    const fw = field.clientWidth, fh = field.clientHeight;
    rx += fw / 900 * 1.6 + .9;
    if (rx > fw + 60) rx = -60;
    const flowers = $$('.flower', field).map(f => f.offsetLeft + f.offsetWidth / 2);
    const near = flowers.some(fx => Math.abs(fx - rx - 20) < 34);
    hop = near ? Math.min(1, hop + .08) : Math.max(0, hop - .06);
    const ground = hillY(rx / fw * 1440) / 230 * fh;
    const lift = Math.sin(hop * Math.PI / 2) * 46;
    rova.style.transform = `translate3d(${rx}px, ${ground - fh - lift - rova.offsetHeight * .97}px, 0) rotate(${hop ? -6 * hop : 0}deg)`;
    drawHill(t / 55, hop > .25 ? 'jump' : 'run');
  };
  requestAnimationFrame(run);

  // ------------------------------------------------ the Journey card plays itself
  const cover = $('.cover.journey');
  const ROUNDS = [
    { q: 'happy', doors: ['inchhirna', 'hlim', 'hlawh'], a: 1 },
    { q: 'dog', doors: ['ui', 'sava', 'vawk'], a: 0 },
    { q: 'bird', doors: ['zawhte', 'sangha', 'sava'], a: 2 },
    { q: 'water', doors: ['mei', 'tui', 'chhum'], a: 1 },
  ];
  const doors = $$('.door', cover), q = $('.q', cover), runner = $('.runner', cover);
  let round = 0, coverPose = 'run';
  const coverRun = t => { requestAnimationFrame(coverRun); if (!document.hidden) drawCover(t / 60, coverPose); };
  requestAnimationFrame(coverRun);
  const play = () => {
    if (!document.hidden) {
      const r = ROUNDS[round++ % ROUNDS.length];
      q.textContent = `Which one means “${r.q}”?`;
      doors.forEach((d, i) => { d.textContent = r.doors[i]; d.classList.remove('hit'); });
      const door = doors[r.a], cr = cover.getBoundingClientRect(), dr = door.getBoundingClientRect(), rr = runner.getBoundingClientRect();
      const dx = dr.left - rr.right + 14, dy = dr.top + dr.height / 2 - (rr.top + rr.height / 2);
      setTimeout(() => { coverPose = 'jump'; }, 500);
      runner.animate([
        { transform: 'translate(0, 0)' },
        { transform: `translate(${dx * .5}px, ${Math.min(dy, 0) - 40}px) rotate(-6deg)`, offset: .55 },
        { transform: `translate(${dx}px, ${dy}px)` },
      ], { duration: 900, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'forwards', delay: 500 }).onfinish = () => {
        coverPose = 'run';
        door.classList.add('hit');
        burst(cover, dr.left - cr.left + dr.width / 2, dr.top - cr.top + dr.height / 2);
        setTimeout(() => runner.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }).onfinish = () =>
          runner.animate([{ transform: 'none', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 300, fill: 'forwards' }), 900);
      };
    }
    setTimeout(play, 3400);
  };
  play();

  function burst(box, x, y) {
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('i');
      s.className = 'spark';
      const a = Math.PI * 2 * i / 14, d = 40 + Math.random() * 30;
      s.style.left = x + 'px'; s.style.top = y + 'px';
      s.style.background = ['#ffc94a', '#ffffff', '#6dbe5e', '#f06292'][i % 4];
      box.appendChild(s);
      s.animate([{ transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(0)`, opacity: 0 }],
        { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => s.remove();
    }
  }

  // ------------------------------------------------ cards lean toward the pointer
  if (finePointer) $$('.game').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.transform = `perspective(900px) rotateX(${(.5 - y) * 6}deg) rotateY(${(x - .5) * 8}deg) translateY(-4px)`;
      card.style.setProperty('--mx', x * 100 + '%'); card.style.setProperty('--my', y * 100 + '%');
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
})();
