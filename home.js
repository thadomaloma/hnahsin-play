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
  // Android and desktop Chrome offer a prompt. iPhone has none, so a button opens a short
  // guide that acts the three taps out on a little phone, then points at Safari's Share
  // button. Inside an app's own browser (Facebook, Instagram, Messenger …) a page can't be
  // added at all, so we ask to open it in Safari and offer to copy the link.
  const ua = navigator.userAgent;
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const iPad = /ipad/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  const ios = /iphone|ipod/i.test(ua) || iPad;
  const inApp = /FBAN|FBAV|FB_IAB|Instagram|Messenger|Line\/|MicroMessenger|Snapchat|TikTok/i.test(ua);
  // Safari 26 tucks Share into the ••• menu at the bottom right.
  const safariVer = Number((ua.match(/Version\/(\d+)/) || [])[1] || 0);
  const newSafari = safariVer >= 26;
  let prompt = null;
  if (!standalone) {
    addEventListener('beforeinstallprompt', e => { e.preventDefault(); prompt = e; $('#install').hidden = false; $('#install-btn').hidden = false; });
    if (ios) {
      $('#install').hidden = false; $('#install-btn').hidden = true;
      if (inApp) {
        $('#install-inapp').hidden = false;
        $('#inapp-browser').textContent = 'Safari';
      } else $('#install-ios').hidden = false;
    }
    $('#install-btn').addEventListener('click', async () => {
      if (!prompt) return;
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      prompt = null;
      if (outcome === 'accepted') $('#install').hidden = true;
    });
    addEventListener('appinstalled', () => { $('#install').hidden = true; });
  }
  $('#inapp-copy').addEventListener('click', async () => {
    const b = $('#inapp-copy');
    try { await navigator.clipboard.writeText(location.href.split('#')[0]); b.textContent = '✓ Copied. Now open Safari and paste it'; }
    catch (e) { b.textContent = location.href.split('#')[0]; }
  });
  // The guide
  const sheet = $('#ios-sheet'), phone = $('.phone', sheet), steps = $$('#ios-steps li');
  phone.classList.toggle('new-safari', newSafari);
  $('#step1-where').textContent = iPad ? 'at the top right of Safari' : newSafari ? 'at the bottom right: first tap •••, then Share' : 'in the bar at the bottom of Safari';
  let stepTimer = 0, step = 1;
  const showStep = n => {
    step = n; phone.dataset.step = n;
    steps.forEach(li => li.classList.toggle('on', +li.dataset.step === n));
  };
  const openSheet = () => {
    sheet.hidden = false; showStep(1);
    clearInterval(stepTimer);
    if (!calm) stepTimer = setInterval(() => showStep(step % 3 + 1), 2600);
    hnStat('install/ios-guide', 'Opened the iPhone install guide');
  };
  const closeSheet = () => { sheet.hidden = true; clearInterval(stepTimer); };
  $('#install-ios').addEventListener('click', openSheet);
  steps.forEach(li => li.addEventListener('click', () => { clearInterval(stepTimer); showStep(+li.dataset.step); }));
  sheet.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeSheet(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });
  // "Show me where": close the guide and point at the Share button for a while.
  $('#sheet-go').addEventListener('click', () => {
    closeSheet();
    const ptr = $('#share-pointer');
    ptr.classList.toggle('top', iPad); ptr.classList.toggle('right', !iPad && newSafari);
    $('#pointer-tip').innerHTML = newSafari && !iPad ? 'Tap <b>•••</b> here, then <b>Share</b>' : 'Tap <b>Share</b> ⬆ ' + (iPad ? 'up here' : 'down here');
    ptr.hidden = false;
    clearTimeout(ptr.t); ptr.t = setTimeout(() => { ptr.hidden = true; }, 9000);
  });
  addEventListener('scroll', () => { const ptr = $('#share-pointer'); if (!ptr.hidden && scrollY > 400) ptr.hidden = true; }, { passive: true });

  // ------------------------------------------------ the tagline: flowers and a wave of letters
  // Tapping a flower spins it and scatters petals; every few seconds a wave runs along the words.
  const tagText = $('.tag-text');
  tagText.innerHTML = [...tagText.textContent].map((ch, i) => `<span style="--i:${i}">${ch}</span>`).join('');
  const wave = () => { tagText.classList.remove('wave'); void tagText.offsetWidth; tagText.classList.add('wave'); };
  $$('.bloom').forEach(b => b.addEventListener('click', () => {
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    setTimeout(() => b.classList.remove('pop'), 700);
    wave();
    if (calm) return;
    const r = b.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    for (let i = 0; i < 12; i++) {
      const p = document.createElement('i');
      p.className = 'petal-bit'; p.style.background = b.dataset.c;
      p.style.left = r.left - hr.left + r.width / 2 + 'px'; p.style.top = r.top - hr.top + r.height / 2 + 'px';
      hero.appendChild(p);
      const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 50;
      p.animate([{ transform: 'translate(-50%,-50%) rotate(0deg)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d + 30}px)) rotate(${Math.random() * 540}deg)`, opacity: 0 }],
        { duration: 900 + Math.random() * 400, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => p.remove();
    }
  }));
  if (!calm) { setTimeout(wave, 1400); setInterval(() => { if (heroOnScreen && !document.hidden) wave(); }, 6500); }

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

  // ------------------------------------------------ the logo at the foot: back to the top
  const footLogo = $('.foot-logo-link');
  if (footLogo) footLogo.addEventListener('click', e => {
    e.preventDefault();
    scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
    $('h1').setAttribute('tabindex', '-1'); $('h1').focus({ preventScroll: true });
  });

  // ------------------------------------------------ Touch and learn card: a finger shows the names
  // The card shows the old village, the year, pi at her loom and the market stall in turn. While each is shown it
  // closes in slowly, and a fingertip glides to one part after another and taps it, and its name shows above it,
  // as in the game. The .json files say where each part is in its picture (source/things/snapshot.js).
  // A tap on the card opens the one on show.
  const thingsCover = $('.cover.things'), thingsCard = thingsCover.closest('a'), view = $('.view', thingsCover);
  const touchEl = $('.touch', thingsCover), tagEl = $('.tag', thingsCover), chips = $$('.which span', thingsCover), pics = $$('.scene', thingsCover);
  const SCENES = [['zokhua', 'zokhua'], ['kumtluang', 'zonun'], ['loom', 'loom'], ['bazar', 'bazar']];   // the picture, and the page's #
  const PER = 4, STEP = calm ? 5000 : 2600;   // names shown on each picture, and how long each stays
  thingsCover.style.setProperty('--dur', PER * STEP + 'ms');
  Promise.all(SCENES.map(([n]) => fetch(`pics/things-${n}.json`).then(r => r.json()))).then(scenes => {
    let si = 0, ti = 0, n = 0, timer = 0;
    // A point of the picture → where it is on the card (the picture covers the card, cropped in the middle)
    const at = (x, y) => {
      const { box } = scenes[si], w = thingsCover.clientWidth, h = thingsCover.clientHeight, k = Math.max(w / box[2], h / box[3]);
      return [(w - box[2] * k) / 2 + (x - box[0]) * k, (h - box[3] * k) / 2 + (y - box[1]) * k];
    };
    const show = () => {
      pics.forEach((p, i) => p.classList.toggle('on', i === si));
      chips.forEach((c, i) => { c.classList.toggle('on', i === si); c.classList.remove('run'); });
      if (!calm) { void chips[si].offsetWidth; chips[si].classList.add('run'); }
      thingsCard.href = `things.html#${SCENES[si][1]}`;
      tagEl.hidden = true;
      if (calm) return;
      // close in slowly on the middle of the picture's parts
      const tags = scenes[si].tags, mid = at(tags.reduce((a, t) => a + t[2], 0) / tags.length, tags.reduce((a, t) => a + t[3], 0) / tags.length);
      view.style.transition = 'none'; view.style.transform = 'none'; view.style.transformOrigin = `${mid[0]}px ${mid[1]}px`;
      void view.offsetWidth;
      view.style.transition = `transform ${PER * STEP}ms linear`; view.style.transform = 'scale(1.08)';
    };
    const point = () => {
      const tags = scenes[si].tags;
      if (!tags.length || !thingsCover.clientWidth) return;
      const [m, en, x, y] = tags[ti % tags.length], [px, py] = at(x, y);
      touchEl.hidden = false; touchEl.classList.remove('press');
      touchEl.style.left = px + 'px'; touchEl.style.top = py + 'px';
      tagEl.hidden = true; tagEl.classList.remove('pop');
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!calm) touchEl.classList.add('press');
        tagEl.innerHTML = `<b>${m}</b><small>${en}</small>`;
        tagEl.hidden = false;
        const w = thingsCover.clientWidth, tw = tagEl.offsetWidth, th = tagEl.offsetHeight;
        tagEl.style.left = Math.max(8, Math.min(w - tw - 8, px - tw / 2)) + 'px';
        tagEl.style.top = (py - th - 22 < 50 ? py + 22 : py - th - 22) + 'px';   // above the finger, or below it near the top
        if (!calm) tagEl.classList.add('pop');
      }, calm ? 0 : 750);
    };
    show(); point();
    addEventListener('resize', () => { show(); point(); });
    setInterval(() => {
      if (document.hidden || thingsCover.getBoundingClientRect().bottom < 0 || thingsCover.getBoundingClientRect().top > innerHeight) return;
      if (++n % PER === 0) { si = (si + 1) % scenes.length; ti = 0; show(); } else ti++;
      point();
    }, STEP);
  }).catch(() => {});

  // ------------------------------------------------ the games people play, as bars
  // How many times each game has been opened, from GoatCounter's public counter (no cookies, nothing
  // that tells who anyone is). Asked for once, when the foot of the page comes near; if the counter
  // cannot be reached, the plain line about counting stays instead.
  const played = $('.played');
  if (played) new IntersectionObserver(([e], obs) => {
    if (!e.isIntersecting) return;
    obs.disconnect();
    const GAMES = [['journey', '🏃', "Rova's Journey", '#f2a516'], ['playground', '🎮', 'Playground', '#7569e8'], ['things', '🏠', 'Touch and learn', '#4caf50'], ['ride', '🛵', 'Aizawl Ride', '#3c9fea']];
    const count = id => fetch(`https://hnahsin.goatcounter.com/counter/${encodeURIComponent(`/hnahsin-play/${id}.html`)}.json`)
      .then(r => (r.ok ? r.json() : null)).then(j => (j ? Number(String(j.count).replace(/[^0-9]/g, '')) : null)).catch(() => null);
    Promise.all(GAMES.map(([id]) => count(id))).then(ns => {
      if (ns.some(n => n === null)) return;
      const rows = GAMES.map((g, i) => [...g, ns[i]]).sort((a, b) => b[4] - a[4]), top = Math.max(1, rows[0][4]);
      $('#bars').innerHTML = rows.map(([, icon, name, col, n], i) =>
        `<li><span class="ic" aria-hidden="true">${icon}</span><span class="nm">${name}</span><span class="tr" aria-hidden="true"><i style="--w:${Math.max(3, n / top * 100)}%;--c:${col};--d:${i * 120}ms"></i></span><b data-n="${n}">${calm ? n.toLocaleString('en') : 0}</b><span class="sr-only"> times played</span></li>`).join('');
      played.hidden = false; $('#privacy').hidden = true;
      if (calm) return;
      played.classList.add('grow');
      const start = performance.now();
      const step = t => {
        const k = 1 - Math.pow(1 - Math.min(1, (t - start) / 1200), 3);
        $$('#bars b').forEach(b => { b.textContent = Math.round(b.dataset.n * k).toLocaleString('en'); });
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { rootMargin: '300px' }).observe($('#privacy'));     // (the line shows while the chart is hidden, so it is the one watched)

  // A canvas that draws Rova at the screen's sharpness.
  const rovaOn = (canvas, draw = drawRova) => {
    const ctx = canvas.getContext('2d');
    return (phase, pose, extra) => {
      const dpr = Math.min(devicePixelRatio || 1, 3), w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w) return;
      if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
      ctx.setTransform(canvas.width / 120, 0, 0, canvas.height / 160, 0, 0);
      ctx.clearRect(0, 0, 120, 160);
      draw(ctx, phase, pose, { live: true, ...extra });
    };
  };
  // Rova on the Journey card: the game's own 3D frames (made with Blender, 120 × 160 box units at
  // SHEET.px pixels each, five a row), fetched when the card comes near. Until they arrive, or if they
  // cannot be had, rova.js draws him. frame: 0–15 the run, 16 going up, 17 at the top, 18 coming down.
  const coverCanvas = $('.cover.journey .runner canvas'), coverRunner = coverCanvas.parentNode;
  const SHEET = { px: 3.2, cols: 5 }, rovaSheet = new Image(), drawCover2d = rovaOn(coverCanvas), coverCtx = coverCanvas.getContext('2d');
  new IntersectionObserver(([e], obs) => { if (e.isIntersecting) { obs.disconnect(); rovaSheet.src = coverRunner.dataset.sheet; } }, { rootMargin: '400px' }).observe(coverRunner);
  const drawCover = frame => {
    if (!(rovaSheet.complete && rovaSheet.naturalWidth)) { drawCover2d(frame < 16 ? frame * Math.PI / 8 : 0, frame < 16 ? 'run' : 'jump'); return; }
    const dpr = Math.min(devicePixelRatio || 1, 3), w = coverCanvas.clientWidth, h = coverCanvas.clientHeight;
    if (!w) return;
    if (coverCanvas.width !== Math.round(w * dpr)) { coverCanvas.width = Math.round(w * dpr); coverCanvas.height = Math.round(h * dpr); }
    const sw = Math.round(120 * SHEET.px), sh = Math.round(160 * SHEET.px);
    coverCtx.setTransform(1, 0, 0, 1, 0, 0);
    coverCtx.clearRect(0, 0, coverCanvas.width, coverCanvas.height);
    coverCtx.imageSmoothingQuality = 'high';
    coverCtx.drawImage(rovaSheet, (frame % SHEET.cols) * sw, Math.floor(frame / SHEET.cols) * sh, sw, sh, 0, 0, coverCanvas.width, coverCanvas.height);
  };
  if (calm) {
    $$('.kid').forEach(k => { k.hidden = true; });
    drawCover(4); rovaSheet.addEventListener('load', () => drawCover(4));
    return;
  }

  // ------------------------------------------------ cosmos petals on the wind
  const canvas = $('.petals'), ctx = canvas.getContext('2d');
  const COLOURS = ['#f06292', '#f48fb1', '#fbe4ee', '#9c7cf0', '#c5b5ff', '#d81b60', '#ff8f00', '#fdd835', '#ffffff'];
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
  // Writes only when something moved: on a phone that is only while scrolling.
  let lastS = -1, heroH = hero.clientHeight;
  addEventListener('resize', () => { heroH = hero.clientHeight; lastS = -1; });
  const parallax = () => {
    requestAnimationFrame(parallax);
    if (!heroOnScreen) return;
    const s = scrollY, moving = Math.abs(tx - px) > .002 || Math.abs(ty - py) > .002;
    if (!moving && s === lastS) return;
    lastS = s;
    px += (tx - px) * .06; py += (ty - py) * .06;
    for (const { el, d } of layers) el.style.transform = `translate3d(${-px * d}px, ${-py * d * .6 + s * d * .02}px, 0)`;
    content.style.transform = `translate3d(0, ${s * .28}px, 0)`;
    content.style.opacity = Math.max(0, 1 - s / (heroH * .7));
  };
  requestAnimationFrame(parallax);

  // ------------------------------------------------ Rova and Mami on the hill
  // They run in from either side, meet in the middle, turn to face you and bow to you,
  // Japanese style, saying "Chibai!". Then they play: a game picked at random each time (tag, a race, hopping
  // about, or wandering off to look at the flowers), and every so often they meet to bow again.
  const field = $('.field'), hill = $('#hill-front'), hello = $('.hello');
  const len = hill.getTotalLength();
  const samples = Array.from({ length: 121 }, (_, i) => hill.getPointAtLength(len * i / 120)).filter(p => p.y < 229);
  const hillY = x => { // the hill's height at x, in the SVG's 1440 × 230 box
    let best = samples[0];
    for (const p of samples) if (Math.abs(p.x - x) < Math.abs(best.x - x)) best = p;
    return best.y;
  };
  const rnd = (a, b) => a + Math.random() * (b - a);
  // Mami starts off the left edge, Rova off the right.
  const kids = [
    { name: 'mami', el: $('.kid.mami'), draw: rovaOn($('.kid.mami canvas'), drawMami), x: -120, dir: 1, v: 0, hop: 0, cheer: 0, phase: 1.3, target: null, wait: 0 },
    { name: 'rova', el: $('.kid.rova'), draw: rovaOn($('.kid.rova canvas'), drawRova), x: 2000, dir: -1, v: 0, hop: 0, cheer: 0, phase: 0, target: null, wait: 0 },
  ];
  let started = false, scene = 'enter', sceneT = 0, game = null, lastGame = '', games = 0, lastT = 0, bow = 0;
  const GAMES = ['tag', 'race', 'hops', 'wander'];
  function newGame(t) {
    const pick = GAMES.filter(g => g !== lastGame);
    game = { kind: pick[Math.floor(Math.random() * pick.length)], until: t + rnd(6000, 10000), chaser: Math.round(Math.random()), dir: Math.random() < .5 ? 1 : -1, tagged: 0 };
    lastGame = game.kind; games++;
    kids.forEach(k => { k.target = null; k.wait = 0; });
  }
  const run = t => {
    requestAnimationFrame(run);
    if (!heroOnScreen || document.hidden) { lastT = t; return; }
    const dt = Math.min(50, t - (lastT || t)) / 16.7; lastT = t;
    const fw = field.clientWidth, fh = field.clientHeight, unit = fw / 900 * 1.4 + .8;
    const kw = kids[0].el.offsetWidth, mid = fw / 2;
    const lo = 36, hi = fw - kw - 36;   // the field reaches 28px past each side of the screen; stay in view
    if (!started) { started = true; kids[0].x = -kw - 30; kids[1].x = fw + 30; sceneT = t; }
    const flowers = $$('.flower', field).map(f => f.offsetLeft + f.offsetWidth / 2);
    const runTo = (k, x, speed) => {
      const d = x - k.x;
      if (Math.abs(d) < speed * unit * dt + 1) { k.x = x; k.v = 0; return true; }
      k.dir = Math.sign(d); k.v = speed; k.x += k.dir * unit * speed * dt; return false;
    };

    if (scene === 'enter') {
      // Each runs to a spot a little apart from the middle, facing the other.
      const a = runTo(kids[0], mid - kw * .95, 1.5), b = runTo(kids[1], mid - kw * .05, 1.5);
      if (a && b) { kids.forEach(k => { k.dir = 1; }); scene = 'bow'; sceneT = t; }
    } else if (scene === 'bow') {
      // Face the viewer, bow down slowly, hold, and come up: about two seconds.
      const e = (t - sceneT) / 1000;
      bow = e < .35 ? 0 : e < 1 ? (e - .35) / .65 : e < 1.6 ? 1 : e < 2.2 ? 1 - (e - 1.6) / .6 : 0;
      hello.classList.toggle('on', e > .3 && e < 2.2);
      // Over their heads, where the hill is in the middle.
      const g0 = hillY(mid / fw * 1440) / 230 * fh;
      hello.style.left = (mid - kw * .45 + kw / 2) + 'px';
      hello.style.top = (g0 - kids[0].el.offsetHeight * 1.05 - 40) + 'px';
      if (e > 2.6) { scene = 'play'; newGame(t); kids.forEach(k => { k.cheer = 1; }); }
    } else {
      const g = game;
      if (g.kind === 'tag') {
        // One runs, the other chases a little faster in bursts; a tag (or the edge) turns them round
        // and the one caught does the chasing.
        const runner = kids[1 - g.chaser], chaser = kids[g.chaser];
        if (t > g.tagged) {
          runner.dir = chaser.dir = g.dir;
          runner.x += g.dir * unit * 1.05 * dt; runner.v = 1;
          chaser.x += g.dir * unit * (0.95 + 0.5 * Math.max(0, Math.sin(t / 700))) * dt; chaser.v = 1;
        } else kids.forEach(k => { k.v = 0; });
        const gap = (runner.x - chaser.x) * g.dir;
        const atEdge = g.dir > 0 ? runner.x > hi : runner.x < lo;
        if (t > g.tagged && (gap < 26 || atEdge)) {
          if (gap < 26) kids.forEach(k => { k.cheer = 1; });
          g.dir = -g.dir; g.chaser = 1 - g.chaser; g.tagged = t + 450;
        }
      } else if (g.kind === 'race') {
        // Side by side to the edge and back, each with bursts of speed.
        kids.forEach((k, i) => {
          k.dir = g.dir; k.v = 1.2 + .5 * Math.max(0, Math.sin(t / (500 + i * 170) + i * 2));
          k.x += g.dir * unit * k.v * dt;
        });
        if (kids.some(k => (g.dir > 0 ? k.x > hi : k.x < lo))) { g.dir = -g.dir; kids.forEach(k => { k.cheer = 1; }); }
      } else if (g.kind === 'hops') {
        // They stand facing each other and hop, now one, now the other, now both.
        const a = kids[0].x < kids[1].x ? kids[0] : kids[1], b = a === kids[0] ? kids[1] : kids[0];
        a.dir = 1; b.dir = -1; kids.forEach(k => { k.v = 0; });
        if (Math.random() < .02 * dt) kids[Math.floor(Math.random() * 2)].cheer = 1;
        if (Math.random() < .006 * dt) kids.forEach(k => { k.cheer = 1; });
      } else {
        // Each wanders to a spot of their own, stops to look about, and goes on.
        kids.forEach(k => {
          if (k.wait > t) { k.v = 0; return; }
          if (k.target === null) k.target = rnd(lo, hi);
          if (runTo(k, k.target, rnd(.9, 1.3))) { k.target = null; k.wait = t + rnd(500, 1800); if (Math.random() < .4) k.cheer = 1; }
        });
      }
      if (t > g.until) {
        // Every third game they meet in the middle and bow again; otherwise a new game.
        if (games % 3 === 0) { scene = 'enter'; } else newGame(t);
      }
    }

    for (const k of kids) {
      const near = k.v > 0 && flowers.some(fx => Math.abs(fx - k.x - 20) < 34);
      k.hop = near || k.cheer > 0 ? Math.min(1, k.hop + .08 * dt) : Math.max(0, k.hop - .06 * dt);
      k.cheer = Math.max(0, k.cheer - .04 * dt);
      if (k.v > 0) k.phase += .3 * k.v * dt;
      const ground = hillY(Math.max(0, Math.min(fw, k.x + kw / 2)) / fw * 1440) / 230 * fh;
      const lift = Math.sin(k.hop * Math.PI / 2) * 40;
      k.el.style.transform = `translate3d(${k.x}px, ${ground - fh - lift - k.el.offsetHeight * .97}px, 0) scaleX(${k.dir}) rotate(${k.hop ? -6 * k.hop : 0}deg)`;
      const pose = k.hop > .25 ? 'jump' : scene === 'bow' ? 'front' : k.v > 0 ? 'run' : 'stand';
      // They move every frame, but are redrawn about 30 times a second.
      if (t - (k.drawn || 0) > 30) { k.drawn = t; k.draw(k.phase, pose, { bow }); }
    }
  };
  requestAnimationFrame(run);

  // ------------------------------------------------ the Journey card plays itself
  // A round every 4.2 s, as in the game: the word doors slide in, Rova crouches and jumps into the right
  // one, it lights up with a coin and the meaning, the doors slide away, and he drops back in to run on.
  // It runs only while the card is on the screen (the hills and clouds stop with it).
  const cover = $('.cover.journey');
  const ROUNDS = [
    { q: 'happy', doors: ['inchhirna', 'hlim', 'hlawh'], a: 1 },
    { q: 'dog', doors: ['ui', 'sava', 'vawk'], a: 0 },
    { q: 'bird', doors: ['zawhte', 'sangha', 'sava'], a: 2 },
    { q: 'water', doors: ['mei', 'tui', 'chhum'], a: 1 },
    { q: 'sun', doors: ['ni', 'thla', 'arsi'], a: 0 },
    { q: 'mother', doors: ['pa', 'nu', 'u'], a: 1 },
  ];
  const doors = $$('.door', cover), q = $('.q', cover), runner = coverRunner, shadow = $('.shadow', cover);
  const ROUND = 4200, J0 = 1350, J1 = 2050, CROUCH = 150, DROP = 3150, LAND = 3550;
  const clamp01 = k => Math.max(0, Math.min(1, k));
  const easeBack = k => 1 + 2.4 * Math.pow(k - 1, 3) + 1.4 * Math.pow(k - 1, 2);
  const swap = el => { el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap'); };
  let round = 0, r = ROUNDS[0], start = 0, drawn = 0, geo = null, hitDone = false, landed = false;
  const setRound = () => {
    r = ROUNDS[round++ % ROUNDS.length];
    q.textContent = `Which one means “${r.q}”?`; q.classList.remove('right'); swap(q);
    doors.forEach((d, i) => { d.textContent = r.doors[i]; d.classList.remove('hit', 'miss'); });
    geo = null; hitDone = landed = false;
  };
  // Where things are in the card, without the doors' slide or Rova's own moves: measured once a round.
  const measure = () => {
    const d = doors[r.a], rw = runner.offsetWidth, rh = runner.offsetHeight;
    const cx = runner.offsetLeft + rw / 2, cy = runner.offsetTop + rh * .55;
    const dx = d.offsetLeft + d.offsetWidth * .3 - cx, dy = d.offsetTop + d.offsetHeight / 2 - cy;
    return { W: cover.clientWidth, H: cover.clientHeight, dx, dy, lift: 40 + Math.max(0, -dy) * .6, shadowX: cx - shadow.offsetWidth / 2 };
  };
  const hit = () => {
    const d = doors[r.a];
    d.classList.add('hit');
    doors.forEach(o => { if (o !== d) o.classList.add('miss'); });
    const x = d.offsetLeft + d.offsetWidth / 2, y = d.offsetTop + d.offsetHeight / 2;
    burst(cover, x, y);
    const coin = document.createElement('span');
    coin.className = 'coin'; coin.textContent = '🪙'; coin.style.left = x - 11 + 'px'; coin.style.top = y - 30 + 'px';
    cover.appendChild(coin);
    coin.animate([{ transform: 'translateY(0) scale(.6)', opacity: 0 }, { transform: 'translateY(-14px) scale(1.15)', opacity: 1, offset: .3 }, { transform: 'translateY(-46px) scale(1)', opacity: 0 }],
      { duration: 900, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => coin.remove();
    q.textContent = `✓ ${r.doors[r.a]} = ${r.q}`; q.classList.add('right'); swap(q);
  };
  const dust = () => {
    const x = runner.offsetLeft + runner.offsetWidth / 2, y = runner.offsetTop + runner.offsetHeight * .97;
    for (let i = 0; i < 6; i++) {
      const s = document.createElement('i');
      s.className = 'spark'; s.style.left = x + 'px'; s.style.top = y + 'px'; s.style.background = '#f4f1e4';
      cover.appendChild(s);
      const dir = i < 3 ? -1 : 1, d = 14 + (i % 3) * 9;
      s.animate([{ transform: 'translate(-50%, -50%) scale(1.2)', opacity: .9 },
        { transform: `translate(calc(-50% + ${dir * d}px), calc(-50% - ${6 + (i % 3) * 4}px)) scale(.2)`, opacity: 0 }],
        { duration: 450, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => s.remove();
    }
  };
  const coverStep = now => {
    if (!coverSeen || document.hidden) { coverLooping = false; return; }
    requestAnimationFrame(coverStep);
    if (now - drawn < 30) return;    // about 30 drawings a second is plenty for a card
    drawn = now;
    let k = now - start;
    if (k >= ROUND) { start = now; k = 0; setRound(); }
    if (!geo) geo = measure();
    // the doors: in from the right with a little overshoot, out to the left
    doors.forEach((d, i) => {
      const kin = clamp01((k - i * 90) / 650), kout = clamp01((k - 2900 - i * 70) / 550);
      d.style.translate = `${((1 - easeBack(kin)) * .6 - kout * kout) * geo.W}px 0`;
      d.style.opacity = kout > 0 ? 1 - kout : '';
    });
    // Rova: run, crouch, jump into the door, gone, drop back in, land
    let x = 0, y = 0, sx = 1, sy = 1, alpha = 1, frame = Math.floor(now / 34) % 16;
    if (k > J0 - CROUCH && k < J0) {
      const c = Math.sin((k - J0 + CROUCH) / CROUCH * Math.PI);
      sy = 1 - .12 * c; sx = 1 + .08 * c;
    } else if (k >= J0 && k < J1) {
      const s = (k - J0) / (J1 - J0), vy = geo.dy - 4 * geo.lift * (1 - 2 * s);
      x = geo.dx * s; y = geo.dy * s - 4 * geo.lift * s * (1 - s);
      frame = vy < -geo.lift ? 16 : vy < geo.lift ? 17 : 18;
      if (s < .2) { sy = 1 + .08 * (1 - s / .2); sx = 1 - .05 * (1 - s / .2); }
      if (s > .8) { const e = (s - .8) / .2; sx = sy = 1 - .55 * e; alpha = 1 - e; }   // into the door
    } else if (k >= J1 && k < DROP) alpha = 0;
    else if (k >= DROP && k < LAND) { const e = (k - DROP) / (LAND - DROP); y = -geo.H * .75 * (1 - e * e); frame = 18; }
    else if (k >= LAND && k < LAND + 180) {
      const c = Math.sin((k - LAND) / 180 * Math.PI);
      sy = 1 - .16 * c; sx = 1 + .1 * c;
      if (!landed) { landed = true; dust(); }
    }
    if (k >= J1 && !hitDone) { hitDone = true; hit(); }
    runner.style.transform = `translate(${x}px, ${y}px) scale(${sx}, ${sy})`;
    runner.style.opacity = alpha;
    // the shadow stays on the ground, smaller and fainter the higher he is
    const sc = Math.max(.3, 1 - Math.max(0, -y) / 160);
    shadow.style.transform = `translateX(${geo.shadowX + x}px) scale(${sc * sx})`;
    shadow.style.opacity = (k >= J0 && k < J1) ? alpha * sc : alpha;
    drawCover(frame);
  };
  let coverSeen = false, coverLooping = false;
  const coverWake = () => { if (coverSeen && !document.hidden && !coverLooping) { coverLooping = true; start = performance.now() - ROUND; requestAnimationFrame(coverStep); } };
  new IntersectionObserver(([e]) => { coverSeen = e.isIntersecting; cover.classList.toggle('live', coverSeen); coverWake(); }).observe(cover);
  document.addEventListener('visibilitychange', coverWake);

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

  // ------------------------------------------------ the Aizawl Ride card rides
  // A few seconds of the game on a loop, fetched only when the card comes on the screen and played only
  // while it is there; a still for reduced motion or when the phone is saving data. The Mizo word on it
  // changes as the road goes by.
  const rideCover = $('.cover.ride');
  if (rideCover) {
    const clip = $('.clip', rideCover), word = $('.q', rideCover);
    const save = navigator.connection && navigator.connection.saveData;
    let onScreen = false, loaded = false;
    const wake = () => {
      if (!clip || calm || save) return;
      if (onScreen && !document.hidden) {
        if (!loaded) {
          loaded = true;
          clip.innerHTML = '<source src="pics/ride-loop.webm" type="video/webm; codecs=av01.0.05M.08"><source src="pics/ride-loop.mp4" type="video/mp4">';
          clip.addEventListener('playing', () => clip.classList.add('on'), { once: true });
          clip.load();
        }
        const p = clip.play(); if (p) p.catch(() => {});
      } else clip.pause();
    };
    new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; wake(); }, { threshold: 0.25 }).observe(rideCover);
    document.addEventListener('visibilitychange', wake);
    const WORDS = [['tlang', 'hill'], ['mi', 'a person'], ['kalkawng', 'a path'], ['zah', 'respect'], ['mau', 'bamboo'], ['tlar', 'a queue'], ['ruam', 'a valley'], ['romei', 'haze']];
    let wi = 0;
    if (!calm) setInterval(() => {
      if (!onScreen || document.hidden) return;
      const [m, e] = WORDS[++wi % WORDS.length];
      word.innerHTML = `<b>${m}</b> · ${e}`;
      word.classList.remove('swap'); void word.offsetWidth; word.classList.add('swap');
    }, 2600);
  }

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
