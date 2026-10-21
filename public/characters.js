import * as THREE from './vendor/three.module.js';

// All three little residents are built from solid, softly bevelled clay forms.
// No image textures or remote assets are needed.
export function createTrio() {
  const group = new THREE.Group();
  group.name = 'The three sleepy residents';

  const mat = (color, roughness = 0.88) => new THREE.MeshStandardMaterial({
    color, roughness, metalness: 0,
  });
  const m = {
    cream: mat('#fff0d3'), creamLight: mat('#fff7e6'), creamShade: mat('#e8cfac'),
    pink: mat('#eeb4b7'), softPink: mat('#f5c8bf'), ink: mat('#534754'),
    mint: mat('#a8dbc6'), mintLight: mat('#caecdc'), mintShade: mat('#8bbcab'),
    leaf: mat('#7fb999'), leafLight: mat('#afd9ac'),
    lavender: mat('#c7b5ef'), lavenderLight: mat('#dfcff8'),
    glasses: mat('#79618f'), white: mat('#fff9ef'),
  };
  const spheres = {
    soft: new THREE.SphereGeometry(1, 24, 18),
    small: new THREE.SphereGeometry(1, 16, 12),
    face: new THREE.SphereGeometry(1, 12, 10),
  };

  function mesh(parent, geometry, material, x = 0, y = 0, z = 0) {
    const item = new THREE.Mesh(geometry, material);
    item.position.set(x, y, z);
    item.castShadow = true;
    item.receiveShadow = true;
    parent.add(item);
    return item;
  }
  function ball(parent, material, xyz, scale, detail = 'small') {
    const item = mesh(parent, spheres[detail], material, ...xyz);
    item.scale.set(...scale);
    return item;
  }
  function stroke(parent, points, material, radius = 0.012, segments = 16) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    return mesh(parent, new THREE.TubeGeometry(curve, segments, radius, 6, false), material);
  }
  function part(parent, name, xyz = [0, 0, 0]) {
    const item = new THREE.Group();
    item.name = name;
    item.position.set(...xyz);
    parent.add(item);
    return item;
  }
  function eye(parent, x, y, z, size = 1) {
    ball(parent, m.ink, [x, y, z], [0.026 * size, 0.044 * size, 0.020], 'face');
    ball(parent, m.white, [x - 0.007 * size, y + 0.016 * size, z + 0.018], [0.006, 0.008, 0.004], 'face');
  }
  function sleepyEye(parent, x, y, z, width = 0.085) {
    stroke(parent, [
      [x - width / 2, y + 0.012, z],
      [x - width / 4, y - 0.004, z + 0.004],
      [x, y - 0.010, z + 0.006],
      [x + width / 4, y - 0.004, z + 0.004],
      [x + width / 2, y + 0.012, z],
    ], m.ink, 0.010, 12);
  }
  function smile(parent, x, y, z, width = 0.085, material = m.ink) {
    stroke(parent, [[x - width / 2, y, z], [x, y - 0.022, z + 0.004], [x + width / 2, y, z]], material, 0.009, 12);
  }
  function roundedEarGeometry(size = 1) {
    const shape = new THREE.Shape();
    shape.moveTo(-0.15 * size, 0);
    shape.quadraticCurveTo(-0.12 * size, 0.23 * size, -0.017 * size, 0.42 * size);
    shape.quadraticCurveTo(0, 0.452 * size, 0.024 * size, 0.413 * size);
    shape.quadraticCurveTo(0.14 * size, 0.19 * size, 0.15 * size, 0);
    shape.quadraticCurveTo(0, -0.055 * size, -0.15 * size, 0);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.09 * size, bevelEnabled: true,
      bevelSegments: 3, steps: 1, bevelSize: 0.034 * size,
      bevelThickness: 0.037 * size, curveSegments: 10,
    });
    geo.computeVertexNormals();
    return geo;
  }
  function arm(parent, name, material, x, y, z, length = 0.22) {
    const pivot = part(parent, name, [x, y, z]);
    ball(pivot, material, [0, -length * 0.45, 0], [0.13, length, 0.135]);
    return pivot;
  }

  // Flewolf: a squashy cream wolf with ears, a tiny double muzzle and a curl tail.
  const wolf = part(group, 'Flewolf');
  ball(wolf, m.cream, [0, 0.47, 0], [0.425, 0.48, 0.34], 'soft');
  ball(wolf, m.creamLight, [0, 0.48, 0.288], [0.27, 0.30, 0.070]);

  const tail = part(wolf, 'Fluffy curled tail', [0.40, 0.29, -0.22]);
  const tailBase = ball(tail, m.cream, [0.11, 0.02, -0.015], [0.31, 0.165, 0.21]);
  tailBase.rotation.z = -0.18;
  const tailTip = ball(tail, m.creamLight, [0.27, 0.09, 0.04], [0.18, 0.145, 0.17]);
  tailTip.rotation.z = 0.48;

  const wolfHead = part(wolf, 'Round wolf head', [0, 1.15, 0.08]);
  ball(wolfHead, m.cream, [0, 0, 0], [0.58, 0.515, 0.43], 'soft');
  // These little side puffs are sculpted into the silhouette, not flat decals.
  ball(wolfHead, m.cream, [-0.48, -0.15, 0.04], [0.16, 0.145, 0.23]);
  ball(wolfHead, m.cream, [0.48, -0.15, 0.04], [0.16, 0.145, 0.23]);
  for (const side of [-1, 1]) {
    const ear = part(wolfHead, side < 0 ? 'Left wolf ear' : 'Right wolf ear', [side * 0.37, 0.34, -0.04]);
    ear.rotation.z = -side * 0.20;
    mesh(ear, roundedEarGeometry(), m.cream);
    const inner = mesh(ear, roundedEarGeometry(), m.pink, 0, 0.066, 0.113);
    inner.scale.set(0.58, 0.63, 0.22);
  }
  ball(wolfHead, m.creamLight, [0, 0.44, 0.03], [0.13, 0.095, 0.17]);
  const wolfOpen = part(wolfHead, 'Bright wolf eyes');
  const wolfClosed = part(wolfHead, 'Sleepy wolf eyes');
  for (const side of [-1, 1]) {
    eye(wolfOpen, side * 0.195, 0.035, 0.408);
    sleepyEye(wolfClosed, side * 0.195, 0.024, 0.427, 0.095);
    ball(wolfHead, m.softPink, [side * 0.344, -0.107, 0.350], [0.090, 0.047, 0.028], 'face');
    ball(wolfHead, m.creamLight, [side * 0.080, -0.145, 0.420], [0.125, 0.086, 0.080]);
  }
  ball(wolfHead, m.ink, [0, -0.093, 0.505], [0.047, 0.030, 0.030], 'face');
  ball(wolfHead, m.white, [-0.013, -0.084, 0.530], [0.010, 0.004, 0.004], 'face');
  stroke(wolfHead, [[0, -0.110, 0.512], [0, -0.147, 0.518], [-0.031, -0.171, 0.510], [-0.061, -0.159, 0.501]], m.ink, 0.009, 14);
  stroke(wolfHead, [[0, -0.147, 0.518], [0.031, -0.171, 0.510], [0.061, -0.159, 0.501]], m.ink, 0.009, 12);
  const wolfArms = [
    arm(wolf, 'Left soft paw', m.cream, -0.39, 0.61, 0.15),
    arm(wolf, 'Right soft paw', m.cream, 0.39, 0.61, 0.15),
  ];
  for (const side of [-1, 1]) {
    const foot = ball(wolf, m.creamLight, [side * 0.26, 0.115, 0.28], [0.19, 0.13, 0.25]);
    foot.rotation.z = -side * 0.07;
    for (let toe = -1; toe <= 1; toe++) {
      ball(wolf, m.creamShade, [side * 0.26 + toe * 0.047, 0.108, 0.509], [0.015, 0.027, 0.008], 'face');
    }
  }

  // GPT: a mint mochi with small feet and a fresh two-leaf tuft.
  const gpt = part(group, 'GPT', [-1.27, 0, 0]);
  const gptBody = part(gpt, 'Mint mochi');
  ball(gptBody, m.mint, [0, 0.665, 0], [0.455, 0.535, 0.355], 'soft');
  ball(gptBody, m.mintLight, [0, 0.420, 0.282], [0.285, 0.235, 0.065]);
  for (const side of [-1, 1]) {
    ball(gpt, m.mintLight, [side * 0.215, 0.125, 0.145], [0.17, 0.125, 0.21]);
  }
  const gptArms = [
    arm(gptBody, 'GPT left arm', m.mint, -0.400, 0.62, 0.03, 0.18),
    arm(gptBody, 'GPT right arm', m.mint, 0.400, 0.62, 0.03, 0.18),
  ];
  const tuft = part(gptBody, 'Two tiny leaves', [0, 1.18, 0]);
  stroke(tuft, [[0, -0.01, 0], [0.025, 0.12, 0], [0.065, 0.21, 0.005]], m.leaf, 0.021, 12);
  const leafA = ball(tuft, m.leaf, [-0.061, 0.127, 0], [0.078, 0.158, 0.035]);
  leafA.rotation.z = 0.66;
  const leafB = ball(tuft, m.leafLight, [0.089, 0.174, -0.012], [0.068, 0.146, 0.034]);
  leafB.rotation.z = -0.61;
  stroke(tuft, [[-0.014, 0.041, 0.031], [-0.068, 0.13, 0.034], [-0.120, 0.216, 0.022]], m.mintShade, 0.005, 8);
  const gptOpen = part(gptBody, 'Bright GPT eyes');
  const gptClosed = part(gptBody, 'Sleepy GPT eyes');
  for (const side of [-1, 1]) {
    eye(gptOpen, side * 0.135, 0.749, 0.343, 0.92);
    sleepyEye(gptClosed, side * 0.135, 0.741, 0.356, 0.082);
    ball(gptBody, m.softPink, [side * 0.256, 0.635, 0.286], [0.065, 0.037, 0.027], 'face');
  }
  smile(gptBody, 0, 0.646, 0.367, 0.075);

  // Astra: a softly rounded five-point star, with little circular spectacles.
  const astra = part(group, 'Astra', [1.27, 0, 0]);
  const astraBody = part(astra, 'Lavender star', [0, 0.775, 0]);
  const vertices = Array.from({ length: 10 }, (_, i) => {
    const a = Math.PI / 2 - i * Math.PI / 5;
    const r = i % 2 ? 0.365 : 0.59;
    return new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r);
  });
  const roundedStar = new THREE.Shape();
  for (let i = 0; i < vertices.length; i++) {
    const p = vertices[i];
    const before = p.clone().lerp(vertices[(i + 9) % 10], 0.17);
    const after = p.clone().lerp(vertices[(i + 1) % 10], 0.17);
    if (i === 0) roundedStar.moveTo(before.x, before.y);
    else roundedStar.lineTo(before.x, before.y);
    roundedStar.quadraticCurveTo(p.x, p.y, after.x, after.y);
  }
  roundedStar.closePath();
  const starGeometry = new THREE.ExtrudeGeometry(roundedStar, {
    depth: 0.16, bevelEnabled: true, bevelSegments: 5,
    steps: 1, bevelSize: 0.055, bevelThickness: 0.115, curveSegments: 7,
  });
  starGeometry.translate(0, 0, -0.08);
  starGeometry.computeVertexNormals();
  mesh(astraBody, starGeometry, m.lavender);
  // The gentle convex centre gives the flat star extrusion a soft mochi cheek.
  ball(astraBody, m.lavender, [0, -0.025, 0.158], [0.35, 0.35, 0.080], 'soft');
  const astraOpen = part(astraBody, 'Astra eyes and spectacles');
  const astraClosed = part(astraBody, 'Sleepy Astra eyes');
  for (const side of [-1, 1]) {
    eye(astraOpen, side * 0.137, 0.024, 0.237, 0.86);
    sleepyEye(astraClosed, side * 0.137, 0.016, 0.252, 0.081);
    const rim = mesh(astraOpen, new THREE.TorusGeometry(0.105, 0.011, 8, 32), m.glasses, side * 0.143, 0.027, 0.278);
    rim.name = 'Tiny round spectacle rim';
    ball(astraBody, m.pink, [side * 0.270, -0.083, 0.216], [0.061, 0.032, 0.015], 'face');
  }
  stroke(astraOpen, [[-0.037, 0.034, 0.278], [0, 0.050, 0.280], [0.037, 0.034, 0.278]], m.glasses, 0.010, 10);
  stroke(astraOpen, [[-0.248, 0.049, 0.271], [-0.300, 0.069, 0.230]], m.glasses, 0.010, 4);
  stroke(astraOpen, [[0.248, 0.049, 0.271], [0.300, 0.069, 0.230]], m.glasses, 0.010, 4);
  smile(astraBody, 0, -0.116, 0.247, 0.081);
  for (const side of [-1, 1]) {
    ball(astra, m.lavenderLight, [side * 0.235, 0.155, 0.05], [0.15, 0.115, 0.18]);
  }
  const astraArms = [
    arm(astraBody, 'Astra left mitten', m.lavender, -0.445, -0.03, 0.075, 0.13),
    arm(astraBody, 'Astra right mitten', m.lavender, 0.445, -0.03, 0.075, 0.13),
  ];

  for (const [name, resident] of [['wolf', wolf], ['gpt', gpt], ['astra', astra]]) {
    resident.traverse(object => {
      object.userData.character = name;
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  }

  let sleeping = false;
  let cuddle = 0;
  let targetCuddle = 0;
  let lastTime = null;
  let sleepBlend = 0;
  const eyes = [[wolfOpen, wolfClosed], [gptOpen, gptClosed], [astraOpen, astraClosed]];

  function setSleep(value) {
    sleeping = Boolean(value);
    for (const [open, closed] of eyes) {
      open.visible = !sleeping;
      closed.visible = sleeping;
    }
  }
  function setCuddle(amount) {
    const value = Number(amount);
    targetCuddle = Number.isFinite(value) ? THREE.MathUtils.clamp(value, 0, 1) : 0;
  }
  function animate(timeSeconds = 0, activeCharacter = null, reduced = false) {
    const t = !reduced && Number.isFinite(timeSeconds) ? timeSeconds : 0;
    const dt = lastTime === null ? 1 / 60 : Math.max(0, Math.min(0.12, t - lastTime));
    lastTime = t;
    const smooth = reduced ? 1 : 1 - Math.exp(-dt * 6);
    cuddle += (targetCuddle - cuddle) * smooth;
    sleepBlend += ((sleeping ? 1 : 0) - sleepBlend) * smooth;
    const active = typeof activeCharacter === 'string'
      ? activeCharacter
      : activeCharacter?.userData?.character;
    const breath = Math.sin(t * (sleeping ? 1.15 : 1.5));
    const happy = name => active === name && !sleeping ? Math.sin(t * 8) * 0.024 : 0;

    wolf.position.set(0, 0.007 * breath + happy('wolf'), 0.10 * cuddle);
    wolf.rotation.z = Math.sin(t * 0.65) * 0.007 * (1 - sleepBlend);
    wolfHead.rotation.x = -0.055 * sleepBlend;
    wolfHead.rotation.z = -0.035 * sleepBlend;
    wolfArms[0].rotation.z = -0.17 - 0.57 * cuddle;
    wolfArms[1].rotation.z = 0.17 + 0.57 * cuddle;
    wolfArms.forEach(a => { a.rotation.x = -0.10 - 0.18 * cuddle; });
    tail.rotation.y = Math.sin(t * (active === 'wolf' ? 5 : 1.3)) * (sleeping ? 0.025 : 0.10);

    gpt.position.set(-1.27 + 0.20 * cuddle, 0.004 * Math.sin(t * 1.5 + 0.8) + happy('gpt'), 0.025 * cuddle);
    gpt.rotation.z = -0.025 - 0.065 * cuddle - 0.024 * sleepBlend;
    gptBody.scale.y = 1 + 0.009 * breath;
    gptArms[0].rotation.z = -0.30 - (active === 'gpt' && !sleeping ? 0.22 + Math.sin(t * 4) * 0.12 : 0);
    gptArms[1].rotation.z = 0.30 + 0.66 * cuddle;
    gptArms[1].rotation.x = -0.16 * cuddle;
    tuft.rotation.z = Math.sin(t * 1.3) * (sleeping ? 0.015 : 0.035);

    astra.position.set(1.27 - 0.20 * cuddle, 0.006 * Math.sin(t * 1.4 + 1.8) + happy('astra'), 0.025 * cuddle);
    astra.rotation.z = 0.025 + 0.075 * cuddle + 0.020 * sleepBlend;
    astraBody.scale.y = 1 + 0.007 * breath;
    astraArms[0].rotation.z = -0.20 - 0.62 * cuddle;
    astraArms[0].rotation.x = -0.16 * cuddle;
    astraArms[1].rotation.z = 0.25 + (active === 'astra' && !sleeping ? 0.28 + Math.sin(t * 4) * 0.12 : 0);
  }

  setSleep(false);
  animate(0);
  return { group, wolf, gpt, astra, setSleep, setCuddle, animate };
}
