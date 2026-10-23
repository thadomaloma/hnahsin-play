// Writes ../../pics/things-house.svg, the still picture on the home page card.
// Run with Node after changing the house: node snapshot.js
const fs = require('fs');
const vm = require('vm');
const ctx = { Math, Object, Array, Map, JSON, String, Number };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/ink3d.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync(__dirname + '/house.js', 'utf8') + '\nglobalThis.HOUSE = HOUSE;', ctx);
const { Ink3D, HOUSE } = ctx;
const st = HOUSE.init();
st.t = 3; st.hen = 1.2; st.door = st.doorT = 1;
const cam = Ink3D.camera(HOUSE.view.yaw, HOUSE.view.pitch);
const body = Ink3D.render(HOUSE.scene(st, cam), cam, { tint: HOUSE.tint(st), wobble: 0.45 });
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-130 -118 260 200" preserveAspectRatio="xMidYMid slice">${HOUSE.sky(st)}${body}</svg>`;
fs.writeFileSync(__dirname + '/../../pics/things-house.svg', svg.replace(/ data-p="[^"]*"/g, ''));
console.log('pics/things-house.svg', svg.length, 'bytes');
