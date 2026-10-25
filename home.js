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

  // ------------------------------------------------ how far down the page you are
  const bar = $('.progress');
  let barQueued = false;
  const showProgress = () => {
    barQueued = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
  };
  addEventListener('scroll', () => { if (!barQueued) { barQueued = true; requestAnimationFrame(showProgress); } }, { passive: true });
  showProgress();

  // ------------------------------------------------ turning a card over
  // Turn it edge-on, change what it shows, and turn it back.
  function turnOver(el, change, ms = 460) {
    if (calm) { change(); return; }
    el.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(90deg)' }], { duration: ms / 2, easing: 'ease-in' }).onfinish = () => {
      change();
      el.animate([{ transform: 'rotateY(-90deg)' }, { transform: 'rotateY(0deg)' }], { duration: ms / 2 + 80, easing: 'cubic-bezier(.3,1.5,.5,1)' });
    };
  }

  // ------------------------------------------------ word of the day: tap to turn it over
  // The same word all day, from the words in the ticker; "Another word" picks the next one.
  const card = $('#wotd'), face = $('.face', card), today = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
  let wi = today % WORDS.length;
  const showWord = () => {
    const [m, e, g] = WORDS[wi], over = card.classList.contains('over');
    $('.e', card).hidden = over;
    $('.m', card).textContent = over ? g : m;
    $('.sub', card).hidden = !over; $('.sub', card).textContent = m;
    $('.hint', card).textContent = over ? 'Tap to turn it back' : 'Tap to see what it means';
    $('.e', card).textContent = e;
    card.setAttribute('aria-label', over ? `${m} means ${g}. Tap to turn it back.` : `${m}. Tap to see what it means.`);
  };
  card.addEventListener('click', () => {
    turnOver(face, () => {
      card.classList.toggle('over');
      showWord();
      if (card.classList.contains('over') && !calm) confetti(card);
    });
  });
  $('#wotd-next').addEventListener('click', () => {
    turnOver(face, () => { wi = (wi + 1) % WORDS.length; card.classList.remove('over'); showWord(); });
  });
  showWord();
  function confetti(box) {
    const r = box.getBoundingClientRect();
    for (let i = 0; i < 26; i++) {
      const c = document.createElement('i');
      c.className = 'confetti';
      c.style.left = r.width / 2 + 'px'; c.style.top = r.height / 2 + 'px';
      c.style.background = ['#f06292', '#ffc94a', '#6dbe5e', '#3c9fea', '#9c7cf0'][i % 5];
      box.appendChild(c);
      const a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 90;
      c.animate([
        { transform: 'translate(-50%, -50%) rotate(0deg)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d * .7 + 40}px)) rotate(${Math.random() * 720 - 360}deg)`, opacity: 0 },
      ], { duration: 900 + Math.random() * 400, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => c.remove();
    }
  }

  // ------------------------------------------------ back to the top
  $('#to-top').addEventListener('click', () => scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' }));

  // ------------------------------------------------ Touch and learn card: name tags on the pictures
  // The card shows the house, then pi at her loom, and back. The .json files say where each part is
  // in the pictures (written by source/things/snapshot.js). A tap opens the one on show.
  const thingsCover = $('.cover.things'), thingsCard = thingsCover.closest('a'), pin = $('.pin', thingsCover), tag = $('.q', thingsCover);
  const which = $$('.which span', thingsCover);
  Promise.all(['house', 'loom'].map(n => fetch(`pics/things-${n}.json`).then(r => r.json()))).then(scenes => {
    let si = 0, ti = 0;
    const PER = 4;   // name tags shown on each picture before it changes
    const show = () => {
      thingsCover.classList.toggle('on-loom', si === 1);
      which.forEach((w, i) => w.classList.toggle('on', i === si));
      thingsCard.href = si ? 'things.html#loom' : 'things.html';
    };
    const place = () => {
      const { box, tags } = scenes[si], w = thingsCover.clientWidth, h = thingsCover.clientHeight;
      if (!w) return;
      const k = Math.max(w / box[2], h / box[3]);   // the picture covers the card, cropped in the middle
      const [m, en, x, y] = tags[ti % tags.length];
      const px = (w - box[2] * k) / 2 + (x - box[0]) * k, py = (h - box[3] * k) / 2 + (y - box[1]) * k;
      pin.hidden = false;
      pin.style.left = px + 'px'; pin.style.top = py + 'px';
      tag.innerHTML = `<b>${m}</b> · ${en}`;
      tag.classList.add('moving');
      const tw = tag.offsetWidth, th = tag.offsetHeight;
      tag.style.right = 'auto'; tag.style.bottom = 'auto';
      tag.style.left = Math.max(8, Math.min(w - tw - 8, px - tw / 2)) + 'px';
      tag.style.top = (py - th - 16 < 48 ? py + 16 : py - th - 16) + 'px';   // keep clear of the In / Puan tah labels
      if (!calm) { tag.classList.remove('pop'); void tag.offsetWidth; tag.classList.add('pop'); }
    };
    show(); place();
    addEventListener('resize', place);
    let n = 0;
    setInterval(() => {
      if (document.hidden || thingsCover.getBoundingClientRect().bottom < 0) return;
      if (++n % PER === 0) { si = 1 - si; ti = 0; show(); } else ti++;
      place();
    }, calm ? 5000 : 2600);
  }).catch(() => {});

  // A canvas that draws Rova at the screen's sharpness.
  const rovaOn = (canvas, draw = drawRova) => {
    const ctx = canvas.getContext('2d');
    return (phase, pose) => {
      const dpr = Math.min(devicePixelRatio || 1, 3), w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w) return;
      if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
      ctx.setTransform(canvas.width / 120, 0, 0, canvas.height / 160, 0, 0);
      ctx.clearRect(0, 0, 120, 160);
      draw(ctx, phase, pose, { live: true });
    };
  };
  const drawCover = rovaOn($('.cover.journey .runner canvas'));
  if (calm) { $$('.kid').forEach(k => { k.hidden = true; }); drawCover(.6, 'run'); return; }

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

  // ------------------------------------------------ Rova and Mami play tag on the hill
  // One runs, the other chases a little faster in bursts. When the chaser
  // catches up, or the runner reaches the edge, both turn round: the one who
  // was caught now does the chasing. They hop over the flowers on the way.
  const field = $('.field'), hill = $('#hill-front');
  const len = hill.getTotalLength();
  const samples = Array.from({ length: 121 }, (_, i) => hill.getPointAtLength(len * i / 120)).filter(p => p.y < 229);
  const hillY = x => { // the hill's height at x, in the SVG's 1440 × 230 box
    let best = samples[0];
    for (const p of samples) if (Math.abs(p.x - x) < Math.abs(best.x - x)) best = p;
    return best.y;
  };
  const kids = [
    { el: $('.kid.rova'), draw: rovaOn($('.kid.rova canvas'), drawRova), x: 160, hop: 0, cheer: 0 },
    { el: $('.kid.mami'), draw: rovaOn($('.kid.mami canvas'), drawMami), x: 40, hop: 0, cheer: 0 },
  ];
  let dir = 1, chaser = 1, lastT = 0, tagged = 0;
  const run = t => {
    requestAnimationFrame(run);
    if (!heroOnScreen || document.hidden) { lastT = t; return; }
    const dt = Math.min(50, t - (lastT || t)) / 16.7; lastT = t;
    const fw = field.clientWidth, fh = field.clientHeight, unit = fw / 900 * 1.4 + .8;
    const flowers = $$('.flower', field).map(f => f.offsetLeft + f.offsetWidth / 2);
    const runner = 1 - chaser;
    if (t > tagged) {
      kids[runner].x += dir * unit * 1.05 * dt;
      kids[chaser].x += dir * unit * (0.95 + 0.5 * Math.max(0, Math.sin(t / 700))) * dt; // bursts of speed
    }
    const gap = (kids[runner].x - kids[chaser].x) * dir;
    const kw = kids[runner].el.offsetWidth;
    // The field reaches 28px past each side of the screen (for the parallax); turn while in view.
    const atEdge = dir > 0 ? kids[runner].x > fw - kw - 36 : kids[runner].x < 36;
    if (t > tagged && (gap < 26 || atEdge)) {
      // Tag! Both stop for a moment and hop, then turn and swap roles.
      if (gap < 26) kids.forEach(k => { k.cheer = 1; });
      dir = -dir; chaser = runner; tagged = t + 450;
    }
    for (const k of kids) {
      const near = flowers.some(fx => Math.abs(fx - k.x - 20) < 34);
      k.hop = near || k.cheer > 0 ? Math.min(1, k.hop + .08 * dt) : Math.max(0, k.hop - .06 * dt);
      k.cheer = Math.max(0, k.cheer - .04 * dt);
      const ground = hillY(Math.max(0, Math.min(fw, k.x)) / fw * 1440) / 230 * fh;
      const lift = Math.sin(k.hop * Math.PI / 2) * 40;
      k.el.style.transform = `translate3d(${k.x}px, ${ground - fh - lift - k.el.offsetHeight * .97}px, 0) scaleX(${dir}) rotate(${k.hop ? -6 * k.hop : 0}deg)`;
      k.draw(t / 55 + (k === kids[1] ? 1.3 : 0), k.hop > .25 ? 'jump' : 'run');
    }
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

  // ------------------------------------------------ Playground cover: tiles turn over to show a game
  const GAME_NAMES = ['Bazar', 'I Spy', 'Rova run', "Rova's family", 'Sort it', 'Bubble pop', 'Whack the rat', 'Weather report'];
  const labTiles = $$('.cover.lab span').map(t => [t, t.textContent]);
  let li = 0;
  setInterval(() => {
    if (document.hidden) return;
    const i = li++ % labTiles.length, [t, icon] = labTiles[i];
    turnOver(t, () => { t.textContent = GAME_NAMES[i]; t.classList.add('name'); });
    setTimeout(() => turnOver(t, () => { t.textContent = icon; t.classList.remove('name'); }), 1900);
  }, 900);

  // ------------------------------------------------ stars behind the page at night (dark mode)
  const sky = $('.stars');
  for (let i = 0; i < 40; i++) {
    const s = document.createElement('i');
    s.style.left = Math.random() * 100 + '%'; s.style.top = Math.random() * 100 + '%';
    s.style.setProperty('--t', 2 + Math.random() * 3 + 's'); s.style.setProperty('--d', -Math.random() * 5 + 's');
    if (i % 7 === 0) { s.style.width = s.style.height = '4px'; s.style.background = '#ffe28a'; }
    sky.appendChild(s);
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
