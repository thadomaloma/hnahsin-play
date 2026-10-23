// Writes ../../pics/things-house.svg, the still picture on the home page card.
// Run with Node after changing the house: node snapshot.js
const fs = require('fs');
const vm = require('vm');
const ctx = { Math, Object, Array, Map, JSON, String, Number };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/ink3d.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync(__dirname + '/people.js', 'utf8') + '\nglobalThis.Ink3DPeople = Ink3DPeople;', ctx);
vm.runInContext(fs.readFileSync(__dirname + '/house.js', 'utf8') + '\nglobalThis.HOUSE = HOUSE;', ctx);
const { Ink3D, HOUSE } = ctx;
const st = HOUSE.init();
st.t = 3; st.hen = 1.2; st.door = st.doorT = 1;
const cam = Ink3D.camera(HOUSE.view.yaw, HOUSE.view.pitch);
const body = Ink3D.render(HOUSE.scene(st, cam), cam, { tint: HOUSE.tint(st), wobble: 0.45, light: HOUSE.light(st) });
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-130 -118 260 200" preserveAspectRatio="xMidYMid slice">${HOUSE.sky(st)}${body}</svg>`;
fs.writeFileSync(__dirname + '/../../pics/things-house.svg', svg.replace(/ data-p="[^"]*"/g, ''));
// Where some parts are in the picture (in its viewBox), for the name tags that move round the home page card.
const WORDS = Object.fromEntries(JSON.parse(fs.readFileSync(__dirname + '/../journey/words.json', 'utf8')).map(w => [w[0], w[1].toLowerCase()]));
const SHOW = ['tukverh', 'kawngkhar', 'chungkhuh', 'zawhte', 'nu', 'pa', 'vawk', 'arpui', 'thing', 'mau', 'êm', 'pangpâr', 'arbawm', 'puan'];
const tags = [];
for (const a of HOUSE.anchors(st, cam)) {
  if (!SHOW.includes(a.part) || tags.some(t => t[0] === a.part)) continue;
  if (a.n && Ink3D.dot(a.n, cam.view) < 0.08) continue;
  if (a.part === 'tukverh' && a.p[0] > 0) continue;   // the front window is behind nu in this picture; use the side one
  const [x, y] = a.s || cam.P(a.p);
  tags.push([a.part, WORDS[a.part], Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
}
tags.sort((a, b) => SHOW.indexOf(a[0]) - SHOW.indexOf(b[0]));
fs.writeFileSync(__dirname + '/../../pics/things-house.json', JSON.stringify({ box: [-130, -118, 260, 200], tags }));
console.log('pics/things-house.json', tags.length, 'tags');
console.log('pics/things-house.svg', svg.length, 'bytes');
