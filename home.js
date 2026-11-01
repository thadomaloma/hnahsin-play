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

  // ------------------------------------------------ Touch and learn card: name tags on the pictures
  // The card shows the house, pi at her loom and the market stall in turn. The .json files say where each part is
  // in the pictures (written by source/things/snapshot.js). A tap opens the one on show.
  const thingsCover = $('.cover.things'), thingsCard = thingsCover.closest('a'), pin = $('.pin', thingsCover), tag = $('.q', thingsCover);
  const which = $$('.which span', thingsCover);
  const SCENES = ['house', 'loom', 'bazar'];
  Promise.all(SCENES.map(n => fetch(`pics/things-${n}.json`).then(r => r.json()))).then(scenes => {
    let si = 0, ti = 0;
    const PER = 4;   // name tags shown on each picture before it changes
    const show = () => {
      thingsCover.classList.toggle('on-loom', si === 1);
      thingsCover.classList.toggle('on-bazar', si === 2);
      which.forEach((w, i) => w.classList.toggle('on', i === si));
      thingsCard.href = si ? `things.html#${SCENES[si]}` : 'things.html';
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
      if (++n % PER === 0) { si = (si + 1) % scenes.length; ti = 0; show(); } else ti++;
      place();
    }, calm ? 5000 : 2600);
  }).catch(() => {});

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
  const cover = $('.cover.journey');
  const ROUNDS = [
    { q: 'happy', doors: ['inchhirna', 'hlim', 'hlawh'], a: 1 },
    { q: 'dog', doors: ['ui', 'sava', 'vawk'], a: 0 },
    { q: 'bird', doors: ['zawhte', 'sangha', 'sava'], a: 2 },
    { q: 'water', doors: ['mei', 'tui', 'chhum'], a: 1 },
  ];
  const doors = $$('.door', cover), q = $('.q', cover), runner = $('.runner', cover);
  let round = 0, coverPose = 'run';
  // The Journey card's Rova runs only while the card is on the screen.
  let coverSeen = false, coverLooping = false;
  const coverRun = t => { if (!coverSeen || document.hidden) { coverLooping = false; return; } requestAnimationFrame(coverRun); if (t - (coverRun.last || 0) > 30) { coverRun.last = t; drawCover(t / 60, coverPose); } };
  const coverWake = () => { if (coverSeen && !document.hidden && !coverLooping) { coverLooping = true; requestAnimationFrame(coverRun); } };
  new IntersectionObserver(([e]) => { coverSeen = e.isIntersecting; coverWake(); }).observe(cover);
  document.addEventListener('visibilitychange', coverWake);
  const play = () => {
    if (!document.hidden && coverSeen) {
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
