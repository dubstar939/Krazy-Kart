import * as THREE from 'three';
import { getTrackAsphaltV4Textures } from './CoasterTrackBuilder.js';
import { createCheckeredGantryTexture } from './ProceduralTextures.js';

/**
 * Procedural Outdoor Go-Kart Racing Circuit Generator & Environment Builder.
 * Generates:
 * 1. An authentic 720-sample C2 periodic outdoor karting circuit spline.
 * 2. An expansive outdoor race track diorama with rolling grass hills, asphalt track with painted start grid,
 *    red/white FIA rumble curbs, stacks of safety tires, spectator grandstands, pit lane, floodlight towers,
 *    perimeter pine trees, and outdoor sun lighting.
 */

// ---------------------------------------------------------------------------
// 1. GENERATE OUTDOOR SPLINE (720 periodic samples with C2 smooth Frenet frame)
// ---------------------------------------------------------------------------
export function generateOutdoorSpline() {
  // 36 control points for a classic outdoor karting layout:
  // Pit straight -> fast Turn 1 -> S-chicane -> Carousel -> Back straight -> Hairpin -> Infield return
  const rawPoints = [
    // Sector 1: Start/Finish Pit Straight & Turn 1 Sweeper
    { pos: [-0.42, 0.010,  0.36], bank: 0, sec: 1 },
    { pos: [-0.22, 0.010,  0.36], bank: 0, sec: 1 },
    { pos: [-0.02, 0.010,  0.36], bank: 0, sec: 1 },
    { pos: [ 0.18, 0.010,  0.36], bank: 2, sec: 1 },
    { pos: [ 0.36, 0.010,  0.34], bank: 6, sec: 1 },
    { pos: [ 0.48, 0.012,  0.26], bank: 10, sec: 1 }, // Turn 1 right apex

    // Sector 2: Rolling S-Chicane (Curb Rumble)
    { pos: [ 0.46, 0.014,  0.14], bank: 6, sec: 2 },
    { pos: [ 0.34, 0.015,  0.06], bank: -8, sec: 2 }, // Chicane left flick
    { pos: [ 0.26, 0.016, -0.04], bank: -6, sec: 2 },
    { pos: [ 0.32, 0.016, -0.12], bank: 8, sec: 2 },  // Chicane right exit
    { pos: [ 0.44, 0.018, -0.18], bank: 10, sec: 2 },

    // Sector 3: Sunlit Forest Carousel Bank
    { pos: [ 0.52, 0.020, -0.26], bank: 14, sec: 3 },
    { pos: [ 0.54, 0.022, -0.36], bank: 16, sec: 3 }, // High bank carousel apex
    { pos: [ 0.46, 0.022, -0.46], bank: 14, sec: 3 },
    { pos: [ 0.32, 0.020, -0.52], bank: 10, sec: 3 },
    { pos: [ 0.16, 0.018, -0.50], bank: 6, sec: 3 },

    // Sector 4: Speed Trap Back Straightaway with gentle crest
    { pos: [ 0.02, 0.018, -0.48], bank: 2, sec: 4 },
    { pos: [-0.14, 0.022, -0.46], bank: 0, sec: 4 }, // Hill crest
    { pos: [-0.28, 0.020, -0.44], bank: 0, sec: 4 },
    { pos: [-0.42, 0.016, -0.42], bank: 0, sec: 4 }, // High speed braking zone
    { pos: [-0.52, 0.014, -0.40], bank: 4, sec: 4 },

    // Sector 5: Grandstand Hairpin Turn (Heavy Braking)
    { pos: [-0.60, 0.012, -0.34], bank: 8, sec: 5 },
    { pos: [-0.64, 0.010, -0.24], bank: 14, sec: 5 }, // Hairpin outer apex
    { pos: [-0.60, 0.010, -0.14], bank: 12, sec: 5 },
    { pos: [-0.50, 0.010, -0.06], bank: 8, sec: 5 },
    { pos: [-0.36, 0.010, -0.02], bank: 4, sec: 5 },

    // Sector 6: Victory Infield S & Start/Finish Return
    { pos: [-0.22, 0.010,  0.04], bank: -6, sec: 6 },
    { pos: [-0.16, 0.010,  0.14], bank: -4, sec: 6 },
    { pos: [-0.22, 0.010,  0.22], bank: 6, sec: 6 },
    { pos: [-0.34, 0.010,  0.28], bank: 8, sec: 6 }, // Final turn onto straight
    { pos: [-0.46, 0.010,  0.32], bank: 4, sec: 6 },
  ];

  const numSamples = 720;
  const vectors = rawPoints.map(p => new THREE.Vector3(...p.pos));
  const curve = new THREE.CatmullRomCurve3(vectors, true, 'centripetal', 0.5);

  const samples = [];
  let totalLength = 0;
  const rawPositions = [];

  for (let i = 0; i < numSamples; i++) {
    const u = i / numSamples;
    const pt = curve.getPointAt(u);
    rawPositions.push(pt);
  }

  // Precompute arc length
  const arcLengths = [0];
  for (let i = 0; i < numSamples; i++) {
    const pCurr = rawPositions[i];
    const pNext = rawPositions[(i + 1) % numSamples];
    const d = pCurr.distanceTo(pNext);
    totalLength += d;
    arcLengths.push(totalLength);
  }

  // Generate smooth Frenet frame with banking
  const upVec = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < numSamples; i++) {
    const u = i / numSamples;
    const pos = rawPositions[i];
    const tangent = curve.getTangentAt(u).normalize();

    // Find nearest control point for sector & bank
    const cpIndex = Math.min(rawPoints.length - 1, Math.floor(u * rawPoints.length));
    const nextCpIndex = (cpIndex + 1) % rawPoints.length;
    const cpFraction = (u * rawPoints.length) - cpIndex;
    const bankDeg = THREE.MathUtils.lerp(rawPoints[cpIndex].bank, rawPoints[nextCpIndex].bank, cpFraction);
    const sector = rawPoints[cpIndex].sec;

    // Build right and normal vectors
    let right = new THREE.Vector3().crossVectors(tangent, upVec).normalize();
    if (right.lengthSq() < 1e-4) right.set(1, 0, 0);
    let normal = new THREE.Vector3().crossVectors(right, tangent).normalize();

    // Apply bank angle rotation around tangent
    if (Math.abs(bankDeg) > 0.01) {
      const bankRad = THREE.MathUtils.degToRad(bankDeg);
      const quat = new THREE.Quaternion().setFromAxisAngle(tangent, bankRad);
      right.applyQuaternion(quat);
      normal.applyQuaternion(quat);
    }

    samples.push({
      index: i,
      t: u,
      sector,
      position: [pos.x, pos.y, pos.z],
      tangent: [tangent.x, tangent.y, tangent.z],
      right: [right.x, right.y, right.z],
      normal: [normal.x, normal.y, normal.z],
      bank_deg: bankDeg,
      arc_length_m: arcLengths[i],
    });
  }

  return {
    name: 'Grand Prix Outdoor Go-Kart Raceway',
    is_closed_periodic_loop: true,
    track_width_m: 0.032, // 32mm wide authentic go-kart track
    curb_width_m: 0.0032,
    rail_height_m: 0.0018,
    total_length_m: totalLength,
    scale_equivalent_length_m: 365.4,
    num_samples: numSamples,
    sectors: [
      { id: 1, name: 'Grand Prix Pit Straight & Turn 1 Sweeper' },
      { id: 2, name: 'Rolling S-Chicane (Apex Curbs)' },
      { id: 3, name: 'Sunlit Forest Carousel Bank' },
      { id: 4, name: 'Speed Trap Back Straightaway' },
      { id: 5, name: 'Grandstand Hairpin (Heavy Braking)' },
      { id: 6, name: 'Victory Infield S & Start/Finish Gantry' },
    ],
    samples,
  };
}

// ---------------------------------------------------------------------------
// 2. PROCEDURAL GRASS & ASPHALT PROCEDURAL TEXTURES
// ---------------------------------------------------------------------------
function createOutdoorGrassTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base lush grass gradient
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0.0, '#386622');
  grad.addColorStop(0.5, '#417527');
  grad.addColorStop(1.0, '#345e20');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Mowed stripes pattern (mower lawn roller stripes)
  for (let y = 0; y < 512; y += 32) {
    ctx.fillStyle = (y / 32) % 2 === 0 ? 'rgba(64, 118, 40, 0.28)' : 'rgba(42, 80, 24, 0.28)';
    ctx.fillRect(0, y, 512, 32);
  }

  // Multi-frequency stipple noise
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 22;
    data[i] = Math.max(0, Math.min(255, data[i] + noise * 0.7));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise * 0.5));
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(24, 24);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createStartGridTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, 512, 256);

  // Checkered finish line strip across center
  const sq = 16;
  for (let x = 0; x < 512; x += sq) {
    for (let y = 112; y < 144; y += sq) {
      const isWhite = ((x / sq) + (y / sq)) % 2 === 0;
      ctx.fillStyle = isWhite ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 15, 20, 0.95)';
      ctx.fillRect(x, y, sq, sq);
    }
  }

  // Starting boxes (grid spots 1 to 8)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.lineWidth = 4;
  ctx.font = 'bold 22px Inter, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 4 staggered grid box pairs
  const gridPositions = [
    { x: 180, y: 70, num: '1' },
    { x: 330, y: 50, num: '2' },
    { x: 180, y: 180, num: '3' },
    { x: 330, y: 200, num: '4' },
  ];

  for (const pos of gridPositions) {
    ctx.strokeRect(pos.x - 36, pos.y - 18, 72, 36);
    ctx.fillText(pos.num, pos.x, pos.y);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------------------------------------------------------------------------
// 3. BUILD OUTDOOR ENVIRONMENT & TRACK MESH
// ---------------------------------------------------------------------------
export function buildOutdoorTrack(splineData) {
  const root = new THREE.Group();
  root.name = 'OutdoorTrackRacewayRoot';

  const samples = splineData.samples;
  const N = samples.length;
  const halfWidth = (splineData.track_width_m || 0.032) * 0.5;
  const curbWidth = (splineData.curb_width_m || 0.0032);
  const deckThickness = 0.0022;

  // 1. Lush rolling grass landscape terrain
  const grassTex = createOutdoorGrassTexture();
  const groundGeo = new THREE.PlaneGeometry(2.6, 2.6, 64, 64);
  groundGeo.rotateX(-Math.PI / 2);

  // Subtle natural undulating elevation berms
  const posArr = groundGeo.attributes.position.array;
  for (let i = 0; i < posArr.length; i += 3) {
    const x = posArr[i];
    const z = posArr[i + 2];
    const distFromCenter = Math.hypot(x, z);
    // Outer perimeter rises into gentle grassy hills
    const hill = Math.pow(Math.max(0, distFromCenter - 0.65), 1.6) * 0.09;
    const ripple = Math.sin(x * 6.5) * Math.cos(z * 6.5) * 0.004;
    posArr[i + 1] = hill + ripple - 0.002;
  }
  groundGeo.computeVertexNormals();

  const grassMat = new THREE.MeshStandardMaterial({
    map: grassTex,
    roughness: 0.88,
    metalness: 0.05,
  });
  const groundMesh = new THREE.Mesh(groundGeo, grassMat);
  groundMesh.receiveShadow = true;
  root.add(groundMesh);

  // 2. Track Asphalt Ribbon +FIA Red/White Curbs + Road Edge Lines
  const { trackAsphaltAlbedoTex, trackAsphaltNormalTex, trackAsphaltRoughnessTex } = getTrackAsphaltV4Textures();

  const roadPositions = [];
  const roadNormals = [];
  const roadUvs = [];
  const roadIndices = [];

  const curbRedPositions = [];
  const curbWhitePositions = [];
  const curbNormals = [];
  const curbRedIndices = [];
  const curbWhiteIndices = [];

  let arcLenSum = 0;
  const arcLengths = [0];
  for (let i = 0; i < N; i++) {
    const p0 = samples[i].position;
    const p1 = samples[(i + 1) % N].position;
    arcLenSum += Math.hypot(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]);
    arcLengths.push(arcLenSum);
  }

  for (let i = 0; i <= N; i++) {
    const s = samples[i % N];
    const pos = new THREE.Vector3(...s.position);
    const right = new THREE.Vector3(...s.right);
    const normal = new THREE.Vector3(...s.normal);
    const vCoord = arcLengths[i] / 0.024;

    const pLeftTop = pos.clone().addScaledVector(right, -halfWidth);
    const pRightTop = pos.clone().addScaledVector(right, halfWidth);
    const pLeftBot = pLeftTop.clone().addScaledVector(normal, -deckThickness);
    const pRightBot = pRightTop.clone().addScaledVector(normal, -deckThickness);

    roadPositions.push(
      pLeftTop.x, pLeftTop.y, pLeftTop.z,
      pRightTop.x, pRightTop.y, pRightTop.z,
      pRightBot.x, pRightBot.y, pRightBot.z,
      pLeftBot.x, pLeftBot.y, pLeftBot.z
    );

    roadNormals.push(
      normal.x, normal.y, normal.z,
      normal.x, normal.y, normal.z,
      -normal.x, -normal.y, -normal.z,
      -normal.x, -normal.y, -normal.z
    );

    roadUvs.push(
      0, vCoord,
      1, vCoord,
      1, vCoord,
      0, vCoord
    );

    if (i < N) {
      const b = i * 4;
      roadIndices.push(
        b, b + 1, b + 5,
        b, b + 5, b + 4,
        b + 1, b + 2, b + 6,
        b + 1, b + 6, b + 5,
        b + 2, b + 3, b + 7,
        b + 2, b + 7, b + 6,
        b + 3, b, b + 4,
        b + 3, b + 4, b + 7
      );
    }
  }

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPositions, 3));
  roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(roadNormals, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
  roadGeo.setIndex(roadIndices);

  const asphaltMat = new THREE.MeshStandardMaterial({
    map: trackAsphaltAlbedoTex,
    normalMap: trackAsphaltNormalTex,
    roughnessMap: trackAsphaltRoughnessTex,
    roughness: 0.86,
    metalness: 0.12,
  });
  const roadMesh = new THREE.Mesh(roadGeo, asphaltMat);
  roadMesh.name = 'OutdoorAsphaltRoadMesh';
  roadMesh.receiveShadow = true;
  root.add(roadMesh);

  // 3. Start Grid Painted Decal on the front straight
  const startDecalGeo = new THREE.PlaneGeometry(halfWidth * 1.88, 0.082);
  const startDecalMat = new THREE.MeshBasicMaterial({
    map: createStartGridTexture(),
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  });
  const startDecal = new THREE.Mesh(startDecalGeo, startDecalMat);
  // Sector 1 start line position
  const s0 = samples[0];
  startDecal.position.set(s0.position[0], s0.position[1] + 0.0003, s0.position[2] - 0.02);
  startDecal.rotation.x = -Math.PI / 2;
  root.add(startDecal);

  // 4. Alternating Red & White Curbs along corners
  const curbRedMat = new THREE.MeshStandardMaterial({
    color: 0xee1c25,
    roughness: 0.35,
    metalness: 0.15,
  });
  const curbWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf3f5f8,
    roughness: 0.32,
    metalness: 0.1,
  });

  const curbGroup = new THREE.Group();
  curbGroup.name = 'OutdoorCurbGroup';
  root.add(curbGroup);

  // Place curb strips along both left and right edges
  for (let i = 0; i < N; i += 4) {
    const s = samples[i];
    const isRed = Math.floor(i / 12) % 2 === 0;
    const curMat = isRed ? curbRedMat : curbWhiteMat;

    for (const side of [-1, 1]) {
      const pos = new THREE.Vector3(...s.position);
      const right = new THREE.Vector3(...s.right);
      const normal = new THREE.Vector3(...s.normal);
      const curbPos = pos.clone().addScaledVector(right, side * (halfWidth + curbWidth * 0.5));
      curbPos.addScaledVector(normal, 0.0004);

      const curbMesh = new THREE.Mesh(
        new THREE.BoxGeometry(curbWidth, 0.0012, 0.016),
        curMat
      );
      curbMesh.position.copy(curbPos);
      curbMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...s.tangent));
      curbMesh.receiveShadow = true;
      curbGroup.add(curbMesh);
    }
  }

  // 5. Stacks of Karting Safety Tires (Interlocking Red, White, Blue, Yellow stacks)
  const tireWallGroup = new THREE.Group();
  tireWallGroup.name = 'OutdoorTireWallGroup';
  root.add(tireWallGroup);

  const tireMats = [
    new THREE.MeshStandardMaterial({ color: 0xee2222, roughness: 0.85, metalness: 0.05 }), // Red
    new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.85, metalness: 0.05 }), // White
    new THREE.MeshStandardMaterial({ color: 0x1e88e5, roughness: 0.85, metalness: 0.05 }), // Blue
    new THREE.MeshStandardMaterial({ color: 0xfbc02d, roughness: 0.85, metalness: 0.05 }), // Yellow
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.90, metalness: 0.05 }), // Black
  ];

  // Scatter tire barriers along high-speed corners (Turn 1, Carousel, Hairpin)
  const tireKeySampleIndices = [
    40, 48, 56, 64, 72,        // Turn 1 outer runoff
    180, 192, 204, 216, 228,   // Carousel outer barrier
    460, 472, 484, 496, 508, 520, // Hairpin outer barrier
    640, 652, 664,             // Final turn barrier
  ];

  const tireGeo = new THREE.CylinderGeometry(0.0042, 0.0042, 0.0035, 12);
  tireGeo.rotateX(Math.PI / 2);

  for (const sIdx of tireKeySampleIndices) {
    const s = samples[sIdx];
    const pos = new THREE.Vector3(...s.position);
    const right = new THREE.Vector3(...s.right);
    const normal = new THREE.Vector3(...s.normal);

    // Place 3 stacks deep on outer side
    for (let row = 0; row < 3; row++) {
      const tirePos = pos.clone().addScaledVector(right, (halfWidth + curbWidth + 0.008 + row * 0.007));
      tirePos.y = Math.max(0.003, tirePos.y);

      // Stack 2-3 tires high
      const stackHeight = 2 + (row % 2);
      for (let h = 0; h < stackHeight; h++) {
        const mat = tireMats[(sIdx + row + h) % tireMats.length];
        const tireMesh = new THREE.Mesh(tireGeo, mat);
        tireMesh.position.set(tirePos.x, tirePos.y + h * 0.0034, tirePos.z);
        tireMesh.castShadow = true;
        tireMesh.receiveShadow = true;
        tireWallGroup.add(tireMesh);
      }
    }
  }

  // 6. Grandstands & Spectator Bleachers
  const grandstandGroup = new THREE.Group();
  grandstandGroup.name = 'OutdoorGrandstandGroup';
  root.add(grandstandGroup);

  function createGrandstand(width, depth, tiers, name = 'Grandstand') {
    const gs = new THREE.Group();
    gs.name = name;

    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.75, metalness: 0.1 });
    const seatMats = [
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 }), // Red seats
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.4 }), // Blue seats
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 }), // Yellow seats
    ];
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35, side: THREE.DoubleSide });

    // Tiered seating steps
    for (let t = 0; t < tiers; t++) {
      const tierH = 0.008;
      const stepD = depth / tiers;
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(width, (t + 1) * tierH, stepD),
        concreteMat
      );
      step.position.set(0, ((t + 1) * tierH) * 0.5, t * stepD);
      step.castShadow = true;
      step.receiveShadow = true;
      gs.add(step);

      // Seats with spectator silhouettes
      for (let seat = -width * 0.45; seat <= width * 0.45; seat += 0.014) {
        const seatMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.010, 0.003, 0.008),
          seatMats[Math.floor(Math.random() * seatMats.length)]
        );
        seatMesh.position.set(seat, (t + 1) * tierH + 0.0015, t * stepD);
        gs.add(seatMesh);

        // Spectator head & torso (stylized miniature fans!)
        if (Math.random() > 0.25) {
          const fanMat = new THREE.MeshStandardMaterial({
            color: [0xff4444, 0x4488ff, 0x44dd44, 0xffaa00, 0xffffff][Math.floor(Math.random() * 5)],
            roughness: 0.6,
          });
          const torso = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.007, 0.005), fanMat);
          torso.position.set(seat, (t + 1) * tierH + 0.006, t * stepD);
          const head = new THREE.Mesh(new THREE.SphereGeometry(0.0024, 8, 8), fanMat);
          head.position.set(seat, (t + 1) * tierH + 0.011, t * stepD);
          gs.add(torso);
          gs.add(head);
        }
      }
    }

    // Sunshade Canopy over grandstand
    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(width * 1.05, 0.0018, depth * 1.2),
      canopyMat
    );
    canopy.position.set(0, tiers * 0.008 + 0.024, (depth * 0.5));
    canopy.rotation.x = -0.12;
    canopy.castShadow = true;
    gs.add(canopy);

    // Support pillars
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7, roughness: 0.3 });
    for (const px of [-width * 0.48, width * 0.48]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, tiers * 0.008 + 0.025, 8), pillarMat);
      p.position.set(px, (tiers * 0.008 + 0.025) * 0.5, depth);
      gs.add(p);
    }

    return gs;
  }

  // Main Pit Straight Grandstand
  const mainGS = createGrandstand(0.28, 0.08, 6, 'MainPitGrandstand');
  mainGS.position.set(-0.10, 0.006, 0.45);
  mainGS.rotation.y = Math.PI;
  grandstandGroup.add(mainGS);

  // Hairpin Grandstand
  const hairpinGS = createGrandstand(0.22, 0.06, 5, 'HairpinGrandstand');
  hairpinGS.position.set(-0.72, 0.008, -0.22);
  hairpinGS.rotation.y = Math.PI * 0.48;
  grandstandGroup.add(hairpinGS);

  // 7. Pit Lane Structure with Garages & Canopies
  const pitLaneGroup = new THREE.Group();
  pitLaneGroup.name = 'OutdoorPitLaneGroup';
  root.add(pitLaneGroup);

  const pitWallMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.65, metalness: 0.3 });
  const pitWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.008, 0.004),
    pitWallMat
  );
  pitWall.position.set(-0.12, 0.004, 0.315);
  pitLaneGroup.add(pitWall);

  // Team Canopies (Red, Blue, Green, Purple team tents)
  const tentColors = [0xef4444, 0x06b6d4, 0x22c55e, 0xec4899];
  for (let i = 0; i < 4; i++) {
    const tentMat = new THREE.MeshStandardMaterial({ color: tentColors[i], roughness: 0.4, side: THREE.DoubleSide });
    const tentRoof = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.016, 4), tentMat);
    tentRoof.position.set(-0.24 + i * 0.08, 0.028, 0.28);
    tentRoof.rotation.y = Math.PI / 4;
    pitLaneGroup.add(tentRoof);

    // Tent legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.8 });
    for (const lx of [-0.014, 0.014]) {
      for (const lz of [-0.014, 0.014]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.0008, 0.0008, 0.020, 6), legMat);
        leg.position.set(-0.24 + i * 0.08 + lx, 0.010, 0.28 + lz);
        pitLaneGroup.add(leg);
      }
    }
  }

  // 8. Start/Finish Gantry Bridge with "KRAZY KART GRAND PRIX" Banner
  const gantryGroup = new THREE.Group();
  gantryGroup.name = 'OutdoorStartFinishGantry';
  root.add(gantryGroup);

  const steelMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.82, roughness: 0.25 });
  const gantryWidth = halfWidth * 2.8;
  const gantryHeight = 0.038;

  // Dual vertical lattice towers
  for (const gx of [-gantryWidth * 0.5, gantryWidth * 0.5]) {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.004, gantryHeight, 0.006), steelMat);
    tower.position.set(gx, gantryHeight * 0.5, 0);
    gantryGroup.add(tower);
  }

  // Overhead cross beam
  const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(gantryWidth + 0.008, 0.006, 0.008), steelMat);
  crossBeam.position.set(0, gantryHeight, 0);
  gantryGroup.add(crossBeam);

  // Sponsor Billboard on Gantry: "KRAZY KART GRAND PRIX"
  const bannerCanvas = document.createElement('canvas');
  bannerCanvas.width = 512;
  bannerCanvas.height = 128;
  const bCtx = bannerCanvas.getContext('2d');
  bCtx.fillStyle = '#111827';
  bCtx.fillRect(0, 0, 512, 128);

  // Checkered border
  for (let x = 0; x < 512; x += 16) {
    bCtx.fillStyle = (x / 16) % 2 === 0 ? '#ff1e27' : '#ffffff';
    bCtx.fillRect(x, 0, 16, 12);
    bCtx.fillRect(x, 116, 16, 12);
  }

  bCtx.fillStyle = '#ffd200';
  bCtx.font = 'bold 36px Orbitron, sans-serif';
  bCtx.textAlign = 'center';
  bCtx.textBaseline = 'middle';
  bCtx.fillText('KRAZY KART RACING', 256, 48);

  bCtx.fillStyle = '#ffffff';
  bCtx.font = '600 20px Inter, sans-serif';
  bCtx.fillText('GRAND PRIX OUTDOOR RACEWAY', 256, 88);

  const bannerTex = new THREE.CanvasTexture(bannerCanvas);
  bannerTex.colorSpace = THREE.SRGBColorSpace;
  const bannerMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(gantryWidth * 0.9, 0.016),
    new THREE.MeshStandardMaterial({ map: bannerTex, roughness: 0.25 })
  );
  bannerMesh.position.set(0, gantryHeight - 0.006, 0.0045);
  gantryGroup.add(bannerMesh);

  // 5 F1 Start Lights on Gantry underside
  const f1Lights = [];
  const f1OffMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6 });
  const f1OnMat = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: new THREE.Color(0xff1100),
    emissiveIntensity: 2.5,
    toneMapped: false,
  });

  for (let l = 0; l < 5; l++) {
    const lx = (l - 2) * 0.0065;
    const lightHousing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0022, 0.0022, 0.003, 12),
      f1OffMat
    );
    lightHousing.rotation.x = Math.PI / 2;
    lightHousing.position.set(lx, gantryHeight - 0.012, 0.003);
    gantryGroup.add(lightHousing);
    f1Lights.push(lightHousing);
  }

  // Position gantry right above start line in Sector 1
  gantryGroup.position.set(s0.position[0], s0.position[1], s0.position[2]);
  gantryGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...s0.tangent));

  // 9. Perimeter Pine & Cypress Trees (Zero floating void, natural bounding!)
  const treeGroup = new THREE.Group();
  treeGroup.name = 'OutdoorPerimeterTrees';
  root.add(treeGroup);

  function createStylizedPineTree(scale = 1.0) {
    const tree = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x245329,
      roughness: 0.8,
    });

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.0024 * scale, 0.0038 * scale, 0.038 * scale, 8), trunkMat);
    trunk.position.y = (0.038 * scale) * 0.5;
    trunk.castShadow = true;
    tree.add(trunk);

    // 3 tiered foliage cones
    for (let c = 0; c < 3; c++) {
      const coneR = (0.024 - c * 0.005) * scale;
      const coneH = 0.026 * scale;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(coneR, coneH, 7), foliageMat);
      cone.position.y = (0.022 + c * 0.016) * scale;
      cone.castShadow = true;
      cone.receiveShadow = true;
      tree.add(cone);
    }
    return tree;
  }

  // Place trees in organic natural groves around the perimeter and infield
  const treeLocations = [
    // North outer ring (Carousel backdrop)
    [ 0.65, -0.22, 1.2 ],
    [ 0.72, -0.34, 1.4 ],
    [ 0.68, -0.48, 1.1 ],
    [ 0.55, -0.58, 1.3 ],
    [ 0.38, -0.62, 1.2 ],
    [ 0.18, -0.62, 1.5 ],
    [ 0.00, -0.60, 1.1 ],
    [-0.20, -0.58, 1.3 ],
    [-0.38, -0.55, 1.2 ],
    // West outer ring (Hairpin backdrop)
    [-0.78, -0.42, 1.4 ],
    [-0.85, -0.30, 1.2 ],
    [-0.88, -0.16, 1.5 ],
    [-0.82, -0.02, 1.3 ],
    [-0.74,  0.12, 1.1 ],
    // South outer ring (Pit straight backdrop)
    [-0.58,  0.48, 1.3 ],
    [-0.38,  0.54, 1.2 ],
    [ 0.08,  0.52, 1.4 ],
    [ 0.28,  0.50, 1.1 ],
    [ 0.48,  0.46, 1.3 ],
    [ 0.62,  0.38, 1.2 ],
    // Natural Infield Island clusters
    [ 0.08, -0.20, 0.9 ],
    [ 0.16, -0.28, 1.0 ],
    [-0.04, -0.26, 0.85 ],
    [-0.38, -0.18, 0.95 ],
    [-0.32, -0.28, 1.05 ],
  ];

  for (const [tx, tz, tScale] of treeLocations) {
    const tree = createStylizedPineTree(tScale);
    tree.position.set(tx, 0.002, tz);
    tree.rotation.y = Math.random() * Math.PI * 2;
    treeGroup.add(tree);
  }

  // 10. Stadium Floodlight Mast Towers
  const floodlightGroup = new THREE.Group();
  floodlightGroup.name = 'OutdoorStadiumFloodlights';
  root.add(floodlightGroup);

  const mastMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.25 });
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0xfff5e0),
    emissiveIntensity: 3.0,
    toneMapped: false,
  });

  const towerPositions = [
    [ 0.62,  0.30],
    [ 0.58, -0.42],
    [-0.68, -0.36],
    [-0.64,  0.22],
  ];

  for (const [tx, tz] of towerPositions) {
    const tower = new THREE.Group();
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.005, 0.14, 8), mastMat);
    mast.position.y = 0.07;
    mast.castShadow = true;
    tower.add(mast);

    // Floodlight bank head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.014, 0.008), mastMat);
    head.position.set(0, 0.136, 0);
    head.rotation.x = 0.45;
    tower.add(head);

    // 6 glowing floodlight bulb lenses
    for (let bx = -0.008; bx <= 0.008; bx += 0.008) {
      for (let by = -0.0035; by <= 0.0035; by += 0.007) {
        const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.0025, 8), bulbMat);
        bulb.position.set(bx, 0.136 + by, 0.0045);
        bulb.rotation.x = 0.45;
        tower.add(bulb);
      }
    }

    tower.position.set(tx, 0.002, tz);
    floodlightGroup.add(tower);
  }

  // 11. Sponsor Advertising Billboards along perimeter
  const sponsorGroup = new THREE.Group();
  sponsorGroup.name = 'OutdoorSponsorBoards';
  root.add(sponsorGroup);

  const sponsors = [
    { title: 'KRAZY KART', sub: 'WORLD CHAMPIONSHIP', color: '#ff2832' },
    { title: 'TURBO BOOST', sub: 'OCTANE 104', color: '#00e5ff' },
    { title: 'APEX TIRES', sub: 'MAXIMUM GRIP', color: '#ffd200' },
    { title: 'NITRO POWER', sub: 'FULL THROTTLE', color: '#22c55e' },
    { title: 'CHAMPION', sub: 'RACING SPARK', color: '#b000ff' },
  ];

  const boardLocations = [
    { pos: [ 0.42, 0.004,  0.42], rot: -0.15, s: 0 },
    { pos: [ 0.54, 0.006,  0.18], rot:  0.85, s: 1 },
    { pos: [ 0.58, 0.010, -0.12], rot:  1.45, s: 2 },
    { pos: [ 0.28, 0.012, -0.44], rot: -3.05, s: 3 },
    { pos: [-0.34, 0.010, -0.40], rot: -3.10, s: 4 },
    { pos: [-0.64, 0.006,  0.08], rot: -1.25, s: 0 },
  ];

  for (const bl of boardLocations) {
    const sp = sponsors[bl.s];
    const sCanvas = document.createElement('canvas');
    sCanvas.width = 256;
    sCanvas.height = 64;
    const sCtx = sCanvas.getContext('2d');
    sCtx.fillStyle = '#0f172a';
    sCtx.fillRect(0, 0, 256, 64);
    sCtx.fillStyle = sp.color;
    sCtx.fillRect(0, 0, 16, 64);
    sCtx.fillRect(240, 0, 16, 64);
    sCtx.font = 'bold 24px Orbitron, sans-serif';
    sCtx.fillStyle = sp.color;
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    sCtx.fillText(sp.title, 128, 24);
    sCtx.font = '600 12px Inter, sans-serif';
    sCtx.fillStyle = '#ffffff';
    sCtx.fillText(sp.sub, 128, 46);

    const sTex = new THREE.CanvasTexture(sCanvas);
    sTex.colorSpace = THREE.SRGBColorSpace;
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(0.075, 0.018, 0.003),
      new THREE.MeshStandardMaterial({ map: sTex, roughness: 0.35 })
    );
    board.position.set(bl.pos[0], bl.pos[1] + 0.009, bl.pos[2]);
    board.rotation.y = bl.rot;
    board.castShadow = true;
    sponsorGroup.add(board);
  }

  // 12. Outdoor Lighting Rig (Warm 5600K Sun Key Light + Sky Fill)
  const outdoorLightingGroup = new THREE.Group();
  outdoorLightingGroup.name = 'OutdoorLightingGroup';

  const outdoorSun = new THREE.DirectionalLight(0xfff6e5, 3.2);
  outdoorSun.position.set(0.65, 0.95, 0.55);
  outdoorSun.castShadow = true;
  outdoorSun.shadow.mapSize.width = 2048;
  outdoorSun.shadow.mapSize.height = 2048;
  outdoorSun.shadow.bias = -0.0004;
  outdoorSun.shadow.normalBias = 0.02;
  const d = 0.85;
  outdoorSun.shadow.camera.left = -d;
  outdoorSun.shadow.camera.right = d;
  outdoorSun.shadow.camera.top = d;
  outdoorSun.shadow.camera.bottom = -d;
  outdoorSun.shadow.camera.near = 0.1;
  outdoorSun.shadow.camera.far = 2.5;
  outdoorLightingGroup.add(outdoorSun);

  const outdoorSkyFill = new THREE.HemisphereLight(0x87ceeb, 0x4d7c0f, 1.4);
  outdoorLightingGroup.add(outdoorSkyFill);

  root.add(outdoorLightingGroup);

  // Method to control the 5 start lights on the outdoor gantry
  function setF1StartLights(count) {
    for (let i = 0; i < 5; i++) {
      // Light up from right to left (index 4 to 0)
      const isActive = (4 - i) < count;
      f1Lights[i].material = isActive ? f1OnMat : f1OffMat;
    }
  }

  return {
    root,
    roadGeo,
    roadMesh,
    setF1StartLights,
    outdoorSun,
    outdoorSkyFill,
    splineData,
  };
}
