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

  // ------------------------------------------------ Open the Playground: tiles drift across the button
  // Little letter tiles and game bits float from left to right behind the words; they hurry
  // when the button is touched.
  {
    const btn = $('.play-btn'), cv = $('.btn-canvas', btn), c = cv.getContext('2d');
    const BITS = ['A', 'AW', 'CH', 'NG', 'Ṭ', '🧩', '⭐', '🫧', '🐝', 'I', 'U', 'E'];
    const COLS = ['#ffe08a', '#c9ddf3', '#f8bbd0', '#d9cff7', '#c8eebd'];
    let bits = [], fast = 0, last = 0;
    const make = (x) => ({ x, y: Math.random(), s: .7 + Math.random() * .5, v: .25 + Math.random() * .35, r: (Math.random() - .5) * .6, vr: (Math.random() - .5) * .02, t: BITS[Math.floor(Math.random() * BITS.length)], col: COLS[Math.floor(Math.random() * COLS.length)] });
    // The button's size is read once (and again on resize), not every frame.
    let dims = null;
    addEventListener('resize', () => { dims = null; });
    const size = () => { if (!dims) { const dpr = Math.min(devicePixelRatio || 1, 2), w = cv.clientWidth, h = cv.clientHeight; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); dims = [w, h, dpr]; } return dims; };
    const paint = t => {
      const [w, h, dpr] = size(); if (!w) return;
      if (!bits.length) bits = Array.from({ length: Math.round(w / 34) }, () => make(Math.random() * w));
      const dt = Math.min(50, t - (last || t)) / 16.7; last = t;
      fast = Math.max(0, fast - .02 * dt);
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
      for (const b of bits) {
        if (!calm) { b.x += (b.v + fast * 3) * dt; b.r += b.vr * dt; }
        if (b.x > w + 20) Object.assign(b, make(-20));
        const y = 6 + b.y * (h - 12) + (calm ? 0 : Math.sin(t / 700 + b.x * .05) * 3), z = 15 * b.s;
        c.save(); c.translate(b.x, y); c.rotate(b.r); c.globalAlpha = .55;
        if (/[A-ZṬ]/.test(b.t)) {
          c.fillStyle = b.col; c.beginPath(); c.roundRect(-z / 2, -z / 2, z, z, 4); c.fill();
          c.fillStyle = '#1565c0'; c.font = `800 ${z * (b.t.length > 1 ? .45 : .62)}px "Baloo 2", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(b.t, 0, 1);
        } else { c.font = `${z}px system-ui`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(b.t, 0, 0); }
        c.restore();
      }
    };
    const loop = t => { requestAnimationFrame(loop); if (heroOnScreen && !document.hidden && t - (loop.last || 0) > 33) { loop.last = t; paint(t); } };
    if (calm) paint(0); else requestAnimationFrame(loop);
    ['pointerenter', 'pointerdown', 'focus'].forEach(ev => btn.addEventListener(ev, () => { fast = 1; }));
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

  // ------------------------------------------------ the garden: which games are played most
  // Play counts come from GoatCounter's public counter (it must be switched on in the site's
  // GoatCounter settings: "Allow adding visitor counts on your website"). The five most played
  // games grow as cosmos flowers, taller the more they are played. Without counts the garden
  // still grows, with no names, and the numbers stay hidden.
  const GC = 'https://hnahsin.goatcounter.com/counter/';
  const COUNTED = [
    ['/hnahsin-play/journey.html', '🏃', "Rova's Journey"], ['/hnahsin-play/things.html', '🏠', 'Touch and learn'],
    ...[['dungeon', '⚔️', 'Word dungeon'], ['fall', '🧱', 'Falling letters'], ['cave', '🔦', 'Crossword cave'], ['sentences', '🧱', 'Sentence builder'],
      ['sayings', '🗣️', 'Saying match'], ['bee', '🐝', 'Spelling bee'], ['waffle', '🧇', 'Waffle'], ['strands', '🧵', 'Strands'], ['tubes', '🧪', 'Word tubes'],
      ['sort', '⚡', 'Sort it'], ['run', '🏃', 'Rova run'], ['bubble', '🫧', 'Bubble pop'], ['whack', '🐁', 'Whack the rat'], ['bazar', '🛒', 'Bazar'],
      ['spy', '🔍', 'I Spy'], ['count', '🔢', 'Count'], ['dress', '👕', 'Dress Rova'], ['size', '🐘', 'Big and small'], ['days', '📅', 'Days and times'],
      ['says', '👃', 'Rova says'], ['colour', '🎨', 'Colour it'], ['family', '👪', "Rova's family"], ['weather', '🌦️', 'Weather report'], ['stall', '🍲', 'Food stall'],
    ].map(([id, i, n]) => ['playground/' + id, i, n]),
    ...[['picture_match', '🖼️', 'Picture Match'], ['spelling', '🔤', 'Spelling'], ['word_search', '🔍', 'Word Search'], ['word_chain', '🔗', 'Word Chain'],
      ['tawng_upa', '🗣️', 'Tawng Upa'], ['crossword', '✏️', 'Crossword'], ['odd_one_out', '🐷', 'Odd One Out'], ['sentence_builder', '🧱', 'Sentence Builder'],
    ].map(([id, i, n]) => ['playground/app/' + id, i, n]),
  ];
  const num = c => Number(String(c || '0').replace(/[^0-9]/g, '')) || 0;
  const gc = path => fetch(GC + encodeURIComponent(path) + '.json').then(r => (r.ok ? r.json() : null)).then(j => (j ? num(j.count) : null)).catch(() => null);
  const gardenCanvas = $('#garden'), gctx = gardenCanvas.getContext('2d');
  const PETALS = ['#f06292', '#9c7cf0', '#ffc94a', '#f48fb1', '#3c9fea'];
  let blooms = [0, 1, 2, 3, 4].map(i => ({ name: '', icon: '', count: 0, h: [.55, .8, .65, .9, .5][i], grow: 0 }));
  function drawGarden(t) {
    const dpr = Math.min(devicePixelRatio || 1, 3), w = gardenCanvas.clientWidth, h = gardenCanvas.clientHeight;
    if (!w) return;
    if (gardenCanvas.width !== Math.round(w * dpr)) { gardenCanvas.width = Math.round(w * dpr); gardenCanvas.height = Math.round(h * dpr); }
    const c = gctx; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    const ground = h - 44, named = blooms.some(b => b.name);
    // The ground: a soft green hill with grass.
    c.fillStyle = '#7cc65a';
    c.beginPath(); c.moveTo(0, ground + 6); c.quadraticCurveTo(w / 2, ground - 12, w, ground + 6); c.lineTo(w, h); c.lineTo(0, h); c.fill();
    c.strokeStyle = '#5dae47'; c.lineWidth = 1.5; c.lineCap = 'round';
    for (let x = 6; x < w; x += 9) { const sway = calm ? 0 : Math.sin(t / 900 + x * .07) * 2; const gy = ground + 6 - 18 * Math.sin(Math.PI * x / w) * .6; c.beginPath(); c.moveTo(x, gy + 6); c.lineTo(x + sway, gy - 2 - (x * 7 % 5)); c.stroke(); }
    const n = blooms.length, gap = w / n, maxH = ground - (named ? 40 : 26);   // room for the tags
    blooms.forEach((b, i) => {
      b.grow = Math.min(1, b.grow + .02);
      const e = 1 - Math.pow(1 - b.grow, 3), x = gap * (i + .5), stem = 30 + (maxH - 30) * b.h * e;
      const gy = ground + 6 - 18 * Math.sin(Math.PI * x / w) * .6, top = gy - stem;
      const sway = calm ? 0 : Math.sin(t / 1100 + i * 1.7) * 3 * e;
      c.strokeStyle = '#4a9a3e'; c.lineWidth = 3.5;
      c.beginPath(); c.moveTo(x, gy); c.quadraticCurveTo(x + sway * .3, (gy + top) / 2, x + sway, top); c.stroke();
      c.fillStyle = '#6dbe5e';   // a leaf
      c.beginPath(); c.ellipse(x + 7, gy - stem * .4, 8, 3.5, -.6, 0, Math.PI * 2); c.fill();
      // The cosmos: eight petals round a gold middle, turning slowly.
      const r = 11 + 7 * b.h * e, spin = calm ? 0 : t / 6000 + i;
      c.save(); c.translate(x + sway, top); c.rotate(spin); c.fillStyle = PETALS[i % PETALS.length];
      for (let k = 0; k < 8; k++) { c.rotate(Math.PI / 4); c.beginPath(); c.ellipse(0, -r * .62, r * .32, r * .52, 0, 0, Math.PI * 2); c.fill(); }
      c.restore();
      c.fillStyle = '#f2a516'; c.beginPath(); c.arc(x + sway, top, r * .3, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffc94a'; c.beginPath(); c.arc(x + sway, top, r * .2, 0, Math.PI * 2); c.fill();
      if (named) {
        // The game's icon on the ground (its name is written under the canvas).
        c.textAlign = 'center'; c.font = '700 22px system-ui, sans-serif'; c.fillText(b.icon, x, h - 12);
        // How many plays, on a little tag above the flower.
        c.font = '800 12px "Plus Jakarta Sans", system-ui, sans-serif';
        const txt = Math.round(b.count * e).toLocaleString('en'), tw = c.measureText(txt).width + 12;
        const ty = Math.max(2, top - r - 24);
        c.fillStyle = 'rgba(255,255,255,.92)'; c.beginPath(); c.roundRect(x + sway - tw / 2, ty, tw, 18, 9); c.fill();
        c.fillStyle = '#1565c0'; c.fillText(txt, x + sway, ty + 13);
      }
    });
  }
  let gardenOn = false;
  const gardenLoop = t => { if (gardenOn) { if (t - (gardenLoop.last || 0) > 33) { gardenLoop.last = t; drawGarden(t); } requestAnimationFrame(gardenLoop); } };
  new IntersectionObserver(([e]) => {
    gardenOn = e.isIntersecting && !document.hidden;
    if (gardenOn) requestAnimationFrame(gardenLoop);
  }).observe(gardenCanvas);
  // Counts are fetched once, the first time the garden comes into view.
  let fetched = false;
  new IntersectionObserver(([e], obs) => {
    if (!e.isIntersecting || fetched) return;
    fetched = true; obs.disconnect();
    // Ask for the home page's count first: if the public counter is off, ask nothing more.
    gc('/hnahsin-play/').then(visits => (visits === null ? null : Promise.all(COUNTED.map(([p]) => gc(p))).then(counts => [visits, ...counts]))).then(res => {
      if (!res) return;   // the public counter is off: keep the plain garden
      const [visits, ...counts] = res;
      const games = COUNTED.map(([, icon, name], i) => ({ icon, name, count: counts[i] || 0 })).filter(g => g.count > 0).sort((a, b) => b.count - a.count).slice(0, 5);
      const total = counts.reduce((a, b) => a + (b || 0), 0);
      if (games.length) {
        const most = games[0].count;
        // Tallest in the middle, the rest either side, like a little podium.
        const order = [3, 1, 0, 2, 4].map(i => games[i]).filter(Boolean);
        blooms = order.map(g => ({ ...g, h: .25 + .75 * g.count / most, grow: 0 }));
        $('#garden-sub').textContent = 'The most played games. Every game played helps its flower grow.';
        $('#garden-list').innerHTML = games.map(g => `<li>${g.name}: played ${g.count.toLocaleString('en')} times</li>`).join('');
        $('#garden-names').innerHTML = blooms.map(b => `<span>${b.name}</span>`).join('');
        $('#garden-names').hidden = false;
      }
      $('#plays').hidden = false;
      const countUp = (el, to) => {
        const start = performance.now();
        const step = t => { const p = Math.min(1, (t - start) / 1400), v = Math.round(to * (1 - Math.pow(1 - p, 3))); el.textContent = v.toLocaleString('en'); if (p < 1 && !calm) requestAnimationFrame(step); else el.textContent = to.toLocaleString('en'); };
        requestAnimationFrame(step);
      };
      countUp($('#ft-plays'), total); countUp($('#ft-visits'), visits);
    });
  }, { rootMargin: '200px' }).observe(gardenCanvas);

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
