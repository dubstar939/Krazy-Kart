import * as THREE from 'three';
import { getCharacterById, CHARACTERS } from '../data/characters.js';

/**
 * Builds the 1:87 HO Micro-Coaster Racing Go-Kart (18mm x 12mm x 8mm)
 * with 4 steerable/spinning wheels, helmeted driver, steering wheel,
 * twin turbo exhaust flames, headlights, personalized character liveries & accessories,
 * and a 160-particle drift spark emitter.
 */
export function buildMicroKart(initialCharacterId = 'blaze') {
  let activeCharacter = getCharacterById(initialCharacterId);

  const kartRoot = new THREE.Group();
  kartRoot.name = 'Kart1to87Root';

  // Inner suspension/drift yaw-roll body group
  const chassisGroup = new THREE.Group();
  chassisGroup.name = 'KartChassisBody';
  kartRoot.add(chassisGroup);

  const redFairingMat = new THREE.MeshStandardMaterial({
    color: activeCharacter.visuals.primaryColor,
    roughness: 0.22,
    metalness: 0.35,
  });

  const whiteStripeMat = new THREE.MeshStandardMaterial({
    color: activeCharacter.visuals.secondaryColor,
    roughness: 0.25,
    metalness: 0.1,
  });

  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x181b22,
    roughness: 0.42,
    metalness: 0.45,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xdce4f0,
    roughness: 0.15,
    metalness: 0.92,
  });

  const goldRimMat = new THREE.MeshStandardMaterial({
    color: 0xffbb44,
    roughness: 0.25,
    metalness: 0.85,
  });

  const tireRubberMat = new THREE.MeshStandardMaterial({
    color: 0x121419,
    roughness: 0.82,
    metalness: 0.05,
  });

  // Soft multi-layered local contact-shadow decal directly under the kart chassis & 4 tires
  // Positioned at Y = 0.00072m (0.42mm in 0.58x world space) with polygonOffset -8 so it always
  // renders cleanly above the crowned CoasterRoadwayMesh surface without depth-buffer occlusion.
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 256;
  const sCtx = shadowCanvas.getContext('2d');
  sCtx.clearRect(0, 0, 256, 256);

  // 1. Wide soft ambient-occlusion penumbra across the entire kart footprint
  sCtx.save();
  sCtx.translate(128, 128);
  sCtx.scale(0.86, 1.08);
  const penumbraGrad = sCtx.createRadialGradient(0, 0, 14, 0, 0, 112);
  penumbraGrad.addColorStop(0.0, 'rgba(2, 2, 5, 0.92)');
  penumbraGrad.addColorStop(0.48, 'rgba(3, 3, 7, 0.76)');
  penumbraGrad.addColorStop(0.76, 'rgba(5, 5, 10, 0.34)');
  penumbraGrad.addColorStop(1.0, 'rgba(6, 6, 12, 0.0)');
  sCtx.fillStyle = penumbraGrad;
  sCtx.beginPath();
  sCtx.arc(0, 0, 112, 0, Math.PI * 2);
  sCtx.fill();
  sCtx.restore();

  // 2. Deep under-chassis floorpan, nose splitter & rear diffuser umbra core
  sCtx.save();
  sCtx.translate(128, 128);
  sCtx.scale(0.58, 0.92);
  const coreGrad = sCtx.createRadialGradient(0, 0, 10, 0, 0, 96);
  coreGrad.addColorStop(0.0, 'rgba(1, 1, 3, 0.96)');
  coreGrad.addColorStop(0.62, 'rgba(2, 2, 5, 0.88)');
  coreGrad.addColorStop(0.88, 'rgba(4, 4, 8, 0.38)');
  coreGrad.addColorStop(1.0, 'rgba(4, 4, 8, 0.0)');
  sCtx.fillStyle = coreGrad;
  sCtx.beginPath();
  sCtx.arc(0, 0, 96, 0, Math.PI * 2);
  sCtx.fill();
  sCtx.restore();

  // 3. Four dark elliptical wheel-contact shadow blobs at (±0.32, ±0.28) in UV space
  for (const [wx, wz] of [
    [-0.28, -0.22],
    [+0.28, -0.22],
    [-0.28, +0.23],
    [+0.28, +0.23],
  ]) {
    const cx = 128 + wx * 256;
    const cy = 128 + wz * 256;
    sCtx.save();
    sCtx.translate(cx, cy);
    sCtx.scale(0.82, 1.28);
    const wGrad = sCtx.createRadialGradient(0, 0, 4, 0, 0, 34);
    wGrad.addColorStop(0.0, 'rgba(1, 1, 3, 0.95)');
    wGrad.addColorStop(0.55, 'rgba(2, 2, 5, 0.72)');
    wGrad.addColorStop(1.0, 'rgba(4, 4, 8, 0.0)');
    sCtx.fillStyle = wGrad;
    sCtx.beginPath();
    sCtx.arc(0, 0, 34, 0, Math.PI * 2);
    sCtx.fill();
    sCtx.restore();
  }

  const kartShadowTex = new THREE.CanvasTexture(shadowCanvas);
  const kartShadowQuad = new THREE.Mesh(
    new THREE.PlaneGeometry(0.0175, 0.0240),
    new THREE.MeshBasicMaterial({
      map: kartShadowTex,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -8,
      polygonOffsetUnits: -8,
    })
  );
  kartShadowQuad.rotation.x = -Math.PI / 2;
  kartShadowQuad.position.set(0, 0.00072, -0.0002);
  kartShadowQuad.castShadow = false;
  kartShadowQuad.receiveShadow = false;
  kartRoot.add(kartShadowQuad);

  // -------------------------------------------------------------------------
  // 1. FLOOR PAN, TUBULAR FRAME, NOSE CONE & SIDE PODS (18mm long x 12mm wide)
  // -------------------------------------------------------------------------
  // 1. PROCEDURAL KART BODY ASSEMBLY (High-Fidelity Sculpted Geometry)
  //    Kart local forward is +Z (aligned with spline tangent)
  // -------------------------------------------------------------------------
  const proceduralKartGroup = new THREE.Group();
  proceduralKartGroup.name = 'ProceduralKartGroup';
  chassisGroup.add(proceduralKartGroup);

  // Carbon Fiber Aerodynamic Floorpan with Front Splitter & Rear Venturi Diffuser
  const floorPan = new THREE.Mesh(
    new THREE.BoxGeometry(0.0086, 0.0008, 0.0162),
    carbonMat
  );
  floorPan.position.set(0, 0.0012, -0.0002);
  floorPan.castShadow = false;
  proceduralKartGroup.add(floorPan);

  // Front Carbon Splitter Blade
  const frontSplitter = new THREE.Mesh(
    new THREE.BoxGeometry(0.0108, 0.00035, 0.0038),
    carbonMat
  );
  frontSplitter.position.set(0, 0.0009, 0.0076);
  proceduralKartGroup.add(frontSplitter);

  // Left & Right Side Bargeboard Skirts
  for (const bx of [-0.0055, 0.0055]) {
    const bargeboard = new THREE.Mesh(
      new THREE.BoxGeometry(0.0004, 0.0018, 0.0092),
      carbonMat
    );
    bargeboard.position.set(bx, 0.0016, -0.0004);
    proceduralKartGroup.add(bargeboard);
  }

  // Rear Venturi Diffuser with 4 vertical strakes
  for (const dx of [-0.0034, -0.0012, 0.0012, 0.0034]) {
    const strake = new THREE.Mesh(
      new THREE.BoxGeometry(0.0003, 0.0015, 0.0042),
      carbonMat
    );
    strake.position.set(dx, 0.0014, -0.0068);
    strake.rotation.x = 0.15;
    proceduralKartGroup.add(strake);
  }

  // Sculpted Aerodynamic Nose Cone Fairing
  const noseConeGroup = new THREE.Group();
  noseConeGroup.position.set(0, 0.0022, 0.0066);

  const noseMain = new THREE.Mesh(
    new THREE.BoxGeometry(0.0084, 0.0022, 0.0052),
    redFairingMat
  );
  noseMain.rotation.x = 0.22;
  noseConeGroup.add(noseMain);

  // Aerodynamic Beak Nose Tip
  const noseTip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0008, 0.0042, 0.0032, 6),
    redFairingMat
  );
  noseTip.rotation.x = Math.PI / 2;
  noseTip.position.set(0, -0.0004, 0.0024);
  noseConeGroup.add(noseTip);

  // Front Dive Canards / Winglets
  for (const cx of [-0.0046, 0.0046]) {
    const canard = new THREE.Mesh(
      new THREE.BoxGeometry(0.0026, 0.0003, 0.0018),
      carbonMat
    );
    canard.position.set(cx, 0.0002, 0.0008);
    canard.rotation.z = cx < 0 ? -0.18 : 0.18;
    noseConeGroup.add(canard);
  }

  // Glossy #87 White Race Number Plate
  const numberPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.0048, 0.0004, 0.0028),
    whiteStripeMat
  );
  numberPlate.position.set(0, 0.0012, -0.0002);
  numberPlate.rotation.x = 0.22;
  noseConeGroup.add(numberPlate);

  proceduralKartGroup.add(noseConeGroup);

  // Left & Right Sculpted Aerodynamic Side Pods with Radiator Scoops
  for (const sx of [-0.0046, 0.0046]) {
    const podGroup = new THREE.Group();
    podGroup.position.set(sx, 0.0024, -0.0004);

    const podBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.0026, 0.0026, 0.0080),
      redFairingMat
    );
    podGroup.add(podBody);

    // Front Radiator Intake Mesh Duct
    const radiatorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.0022, 0.0020, 0.0006),
      carbonMat
    );
    radiatorMesh.position.set(0, 0.0, 0.0040);
    podGroup.add(radiatorMesh);

    // Top Air Extraction Louvers
    for (let l = -0.0016; l <= 0.0016; l += 0.0016) {
      const louver = new THREE.Mesh(
        new THREE.BoxGeometry(0.0018, 0.0002, 0.0006),
        carbonMat
      );
      louver.position.set(0, 0.00135, l);
      podGroup.add(louver);
    }

    proceduralKartGroup.add(podGroup);
  }

  // Detailed Mini Racing Engine (Crankcase, finned cylinder head, intake horn & exhaust headers)
  const engineGroup = new THREE.Group();
  engineGroup.position.set(0.0022, 0.0034, -0.0048);

  const crankcase = new THREE.Mesh(
    new THREE.BoxGeometry(0.0034, 0.0032, 0.0038),
    chromeMat
  );
  engineGroup.add(crankcase);

  // Ribbed Cylinder Cooling Fins
  for (let f = 0.0012; f <= 0.0024; f += 0.0006) {
    const fin = new THREE.Mesh(
      new THREE.BoxGeometry(0.0036, 0.0002, 0.0036),
      chromeMat
    );
    fin.position.set(0, f, 0);
    engineGroup.add(fin);
  }

  // Chrome Velocity Stack Intake Trumpet
  const intakeStack = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0007, 0.00035, 0.0016, 12),
    goldRimMat
  );
  intakeStack.position.set(0.0006, 0.0028, 0.0008);
  engineGroup.add(intakeStack);

  proceduralKartGroup.add(engineGroup);

  // Carbon Formula 1 Aerodynamic Rear Wing with Profiling and Endplates
  const rearWing = new THREE.Group();
  rearWing.position.set(0, 0.0068, -0.0076);

  const mainWingPlane = new THREE.Mesh(
    new THREE.BoxGeometry(0.0104, 0.0006, 0.0028),
    carbonMat
  );
  mainWingPlane.rotation.x = -0.18;
  rearWing.add(mainWingPlane);

  const upperFlap = new THREE.Mesh(
    new THREE.BoxGeometry(0.0098, 0.0004, 0.0016),
    whiteStripeMat
  );
  upperFlap.position.set(0, 0.0007, -0.0006);
  upperFlap.rotation.x = -0.32;
  rearWing.add(upperFlap);

  // Left & Right Aerodynamic Wing Endplates
  for (const ex of [-0.0053, 0.0053]) {
    const endplate = new THREE.Mesh(
      new THREE.BoxGeometry(0.00035, 0.0028, 0.0036),
      carbonMat
    );
    endplate.position.set(ex, 0.0004, -0.0002);
    rearWing.add(endplate);
  }

  // Twin Upright Wing Support Pylons
  for (const px of [-0.0020, 0.0020]) {
    const pylon = new THREE.Mesh(
      new THREE.BoxGeometry(0.00035, 0.0042, 0.0012),
      carbonMat
    );
    pylon.position.set(px, -0.0018, 0.0004);
    pylon.rotation.x = -0.22;
    rearWing.add(pylon);
  }

  proceduralKartGroup.add(rearWing);

  const jetMaterials = [];

  // Twin Rear Exhaust Pipes + Realistic Volumetric Mach-Diamond Afterburner Jet
  // Plumes (Zero FPS impact!)
  function createExhaustFlameMaterial(pipePhase) {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: {value: 0.0},
        uIntensity: {value: 1.0},
        uPhase: {value: pipePhase},
        uFlameCore: {value: new THREE.Vector3(...activeCharacter.visuals.flameCore)},
        uFlameMid: {value: new THREE.Vector3(...activeCharacter.visuals.flameMid)},
        uFlameTail: {value: new THREE.Vector3(...activeCharacter.visuals.flameTail)},
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uPhase;
        varying float vPlumeU;
        varying float vRadialR;
        varying vec3 vLocalPos;
        varying vec3 vViewNormal;
        varying vec3 vViewPos;
        void main() {
          // Local coordinates: nozzle exit is at z = 0, jet extends backward along -Z to z = -0.0052
          float u = clamp(-position.z / 0.0052, 0.0, 1.0);
          vPlumeU = u;
          vRadialR = clamp(length(position.xy) / 0.00078, 0.0, 1.0);
          vLocalPos = position;

          // High-frequency turbulent jet flutter along the tail (zero displacement at nozzle u=0)
          float flutter = u * u * 0.00022;
          vec3 displaced = position;
          displaced.x += sin(u * 18.0 - uTime * 48.0 + uPhase) * flutter;
          displaced.y += cos(u * 15.0 - uTime * 42.0 + uPhase * 1.7) * flutter * 0.85;

          vec4 mvPos = modelViewMatrix * vec4(displaced, 1.0);
          vViewPos = -mvPos.xyz;
          vViewNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uIntensity;
        uniform float uPhase;
        uniform vec3 uFlameCore;
        uniform vec3 uFlameMid;
        uniform vec3 uFlameTail;
        varying float vPlumeU;
        varying float vRadialR;
        varying vec3 vLocalPos;
        varying vec3 vViewNormal;
        varying vec3 vViewPos;
        void main() {
          float u = clamp(vPlumeU, 0.0, 1.0);

          // Coaxial-safe radial core falloff so the flame stays vivid from 1P Chase Cam directly behind the car
          // while still having a soft Gaussian outer edge with zero hard cone/egg silhouette
          vec3 viewDir = normalize(vViewPos);
          float ndotv = abs(dot(normalize(vViewNormal), viewDir));
          float viewWeight = 0.58 + 0.42 * sqrt(clamp(ndotv, 0.0, 1.0));
          float radialCore = exp(-vRadialR * vRadialR * (2.1 + u * 2.4));
          float radialMask = radialCore * viewWeight;

          // High-frequency advected combustion turbulence & Mach shock diamonds
          float angle = atan(vLocalPos.y, vLocalPos.x);
          float turb1 = sin(u * 22.0 - uTime * 56.0 + angle * 2.0 + uPhase);
          float turb2 = cos(u * 35.0 - uTime * 74.0 - angle * 3.0 + uPhase * 1.3);
          float turbulence = 0.82 + 0.18 * (turb1 * 0.6 + turb2 * 0.4);

          // Crisp internal Mach shock diamond nodes near the nozzle & mid-plume
          float machWave = max(0.0, cos(u * 15.5 - uTime * 34.0 + uPhase * 0.5));
          float machDiamond = pow(machWave, 3.2) * smoothstep(0.85, 0.04, u) * exp(-vRadialR * vRadialR * 3.6);

          // Longitudinal envelope: bright inside the nozzle bore (u=0) with shredded flame tongues at the tip
          float tipCut = clamp(1.0 - u + (turb1 * 0.11 + turb2 * 0.07) * u, 0.0, 1.0);
          float axialEnv = (0.35 + 0.65 * smoothstep(0.0, 0.08, u)) * pow(tipCut, 1.45);

          // Physically inspired motorsport exhaust temperature gradient driven by character palette
          vec3 butaneBlue = uFlameCore;
          vec3 whiteHot = vec3(1.55, 1.38, 0.96);
          vec3 goldenAmber = uFlameMid;
          vec3 fieryCrimson = uFlameTail;

          vec3 baseCol = mix(butaneBlue, goldenAmber, smoothstep(0.04, 0.34, u));
          baseCol = mix(baseCol, fieryCrimson, smoothstep(0.38, 0.86, u));
          float coreHotness = clamp(radialCore * (1.0 - u * 0.52) + machDiamond * 0.90, 0.0, 1.0);
          vec3 flameRgb = mix(baseCol, whiteHot, pow(coreHotness, 1.35));

          float alpha = clamp(axialEnv * radialMask * turbulence * uIntensity * 1.45, 0.0, 1.0);
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(flameRgb * alpha * 1.35, alpha);
        }
      `,
    });
    jetMaterials.push(mat);
    return mat;
  }

  // Build multi-layered open-ended jet cone + crossed axial flame fins + nozzle
  // bore glow disc
  function buildExhaustJetGeometry() {
    // 1. Outer tapered open-ended cone from z = 0 (r = 0.72mm) to z = -5.2mm (r
    // = 0.22mm)
    const outerCone =
        new THREE.CylinderGeometry(0.00072, 0.00022, 0.0052, 16, 8, true);
    outerCone.rotateX(Math.PI / 2);
    outerCone.translate(0, 0, -0.0026);

    // 2. Inner high-velocity Mach core tube from z = 0 (r = 0.46mm) to z =
    // -4.0mm (r = 0.12mm)
    const innerCore =
        new THREE.CylinderGeometry(0.00046, 0.00012, 0.0040, 14, 6, true);
    innerCore.rotateX(Math.PI / 2);
    innerCore.translate(0, 0, -0.0020);

    // 3. Crossed longitudinal flame fins (+38 deg and -38 deg) so the jet is
    // lush from every angle
    const finA = new THREE.PlaneGeometry(0.00145, 0.0050, 1, 6);
    finA.rotateX(Math.PI / 2);
    finA.rotateZ(0.66);
    finA.translate(0, 0, -0.0025);

    const finB = new THREE.PlaneGeometry(0.00145, 0.0050, 1, 6);
    finB.rotateX(Math.PI / 2);
    finB.rotateZ(-0.66);
    finB.translate(0, 0, -0.0025);

    // 4. Head-on nozzle bore glow disc at z = -0.00025 facing -Z (directly
    // toward 1P Chase Cam!)
    const nozzleDisc = new THREE.CircleGeometry(0.00074, 16);
    nozzleDisc.rotateY(Math.PI);
    nozzleDisc.translate(0, 0, -0.00025);

    return {outerCone, innerCore, finA, finB, nozzleDisc};
  }
  const sharedJetGeos = buildExhaustJetGeometry();

  const flameCones = [];
  for (let i = 0; i < 2; i++) {
    const ex = i === 0 ? -0.00108 : 0.00108;
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.00056, 0.00062, 0.0032, 16),
      chromeMat
    );
    pipe.rotation.x = Math.PI / 2 + 0.12;
    pipe.position.set(ex, 0.00215, -0.0076);
    chassisGroup.add(pipe);

    const plumeGroup = new THREE.Group();
    // Anchor right inside the hollow grey/aluminium muffler bore exit and angle
    // slightly upward (+0.18 rad) to match the upswept hot-rod muffler tips so
    // the flames shoot cleanly out of the barrels in 1P Chase Cam
    plumeGroup.position.set(ex, 0.00208, -0.00895);
    plumeGroup.rotation.x = 0.18;
    plumeGroup.visible = false;

    const jetMat = createExhaustFlameMaterial(i * 2.15);
    for (const geo
             of [sharedJetGeos.outerCone,
                 sharedJetGeos.innerCore,
                 sharedJetGeos.finA,
                 sharedJetGeos.finB,
                 sharedJetGeos.nozzleDisc,
    ]) {
      const m = new THREE.Mesh(geo, jetMat);
      m.frustumCulled = false;
      plumeGroup.add(m);
    }

    plumeGroup.userData.jetMat = jetMat;
    plumeGroup.userData.pipeIndex = i;
    chassisGroup.add(plumeGroup);
    flameCones.push(plumeGroup);
  }

  // Soft additive ruby-red tail-light optical glow halo planes (tailGlowL & tailGlowR)
  // Positioned directly in front of the left & right 2x3 tail-light clusters so the rear lamps
  // emit a true ruby-red optical bloom halo instead of looking like flat orange rectangles.
  const tailGlowCanvas = document.createElement('canvas');
  tailGlowCanvas.width = 128;
  tailGlowCanvas.height = 128;
  const tgCtx = tailGlowCanvas.getContext('2d');
  const tgGrad = tgCtx.createRadialGradient(64, 64, 4, 64, 64, 62);
  tgGrad.addColorStop(0.0, 'rgba(255, 10, 34, 0.88)');
  tgGrad.addColorStop(0.32, 'rgba(255, 0, 24, 0.56)');
  tgGrad.addColorStop(0.68, 'rgba(220, 0, 18, 0.20)');
  tgGrad.addColorStop(1.0, 'rgba(180, 0, 12, 0.0)');
  tgCtx.fillStyle = tgGrad;
  tgCtx.fillRect(0, 0, 128, 128);
  const tailGlowTex = new THREE.CanvasTexture(tailGlowCanvas);

  const tailGlowGeo = new THREE.PlaneGeometry(0.0038, 0.0024);
  const tailGlowMat = new THREE.MeshBasicMaterial({
    map: tailGlowTex,
    transparent: true,
    opacity: 0.90,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  });
  const tailLightGlowPlanes = [];
  for (const tx of [-0.00320, 0.00320]) {
    const tailGlowPlane = new THREE.Mesh(tailGlowGeo, tailGlowMat);
    tailGlowPlane.position.set(tx, 0.00275, -0.00906);
    tailGlowPlane.rotation.y = Math.PI;
    tailGlowPlane.castShadow = false;
    tailGlowPlane.receiveShadow = false;
    chassisGroup.add(tailGlowPlane);
    tailLightGlowPlanes.push(tailGlowPlane);
  }

  // Warm flickering fire light under rear exhaust/tires when sparks emit
  // Controlled by the "Fire Downcast Light" slider in Settings (default 0.12x for subtle realism)
  const sparkFireLight = new THREE.PointLight(0xff6818, 0.0, 0.045, 0.0);
  sparkFireLight.position.set(0, 0.0028, -0.009);
  chassisGroup.add(sparkFireLight);

  let fireLightMultiplier = 0.12;
  let fireLightPreviewTimer = 0.0;
  function setFireLightMultiplier(val, triggerPreview = true) {
    fireLightMultiplier = Math.max(0.0, Number(val) || 0.0);
    if (triggerPreview) {
      fireLightPreviewTimer = 0.85;
    }
  }

  // -------------------------------------------------------------------------
  // 2. 1:87 HIGH-FIDELITY BUCKET SEAT & ARTICULATED HELMETED DRIVER
  // -------------------------------------------------------------------------
  const seatGroup = new THREE.Group();
  seatGroup.position.set(0, 0.0034, -0.0016);

  // Ergonomic Deep Bucket Shell with Headrest
  const seatBack = new THREE.Mesh(
    new THREE.BoxGeometry(0.0048, 0.0054, 0.0012),
    carbonMat
  );
  seatBack.position.set(0, 0.0012, -0.0014);
  seatBack.rotation.x = -0.22;
  seatGroup.add(seatBack);

  const seatCushion = new THREE.Mesh(
    new THREE.BoxGeometry(0.0046, 0.0012, 0.0044),
    carbonMat
  );
  seatCushion.position.set(0, -0.0012, 0.0006);
  seatGroup.add(seatCushion);

  // Lateral Rib & Head Support Bolsters
  for (const bx of [-0.0024, 0.0024]) {
    const bolster = new THREE.Mesh(
      new THREE.BoxGeometry(0.0008, 0.0042, 0.0032),
      carbonMat
    );
    bolster.position.set(bx, 0.0008, -0.0004);
    seatGroup.add(bolster);
  }
  proceduralKartGroup.add(seatGroup);

  // Driver Torso in personalized Racing Suit with Shoulder Harness Straps
  const suitMat = new THREE.MeshStandardMaterial({
    color: activeCharacter.visuals.suitColor,
    roughness: 0.35,
    metalness: 0.08,
  });

  const driverGroup = new THREE.Group();
  driverGroup.position.set(0, 0.0048, -0.0010);

  const torsoMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0018, 0.0022, 0.0044, 10),
    suitMat
  );
  torsoMesh.rotation.x = 0.14;
  driverGroup.add(torsoMesh);

  // Shoulder Safety Harness Belts (Red / Contrast Webbing)
  for (const hx of [-0.0010, 0.0010]) {
    const strap = new THREE.Mesh(
      new THREE.BoxGeometry(0.00045, 0.0036, 0.0022),
      redFairingMat
    );
    strap.position.set(hx, 0.0004, 0.0002);
    strap.rotation.x = 0.14;
    driverGroup.add(strap);
  }

  // Glove & Accent Material for Driver Hands & Steering Grips
  const gloveMat = new THREE.MeshStandardMaterial({
    color: activeCharacter.visuals.accentColor,
    roughness: 0.40,
    metalness: 0.20,
  });

  // Articulated Driver Arms with Elbows & Racing Gloves gripping the steering wheel
  const armPivotGroup = new THREE.Group();
  for (const [side, ax] of [[-1, -0.0021], [1, 0.0021]]) {
    const shoulder = new THREE.Mesh(
      new THREE.SphereGeometry(0.00075, 8, 8),
      suitMat
    );
    shoulder.position.set(ax, 0.0012, 0.0002);
    armPivotGroup.add(shoulder);

    // Upper Arm
    const upperArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.00055, 0.0005, 0.0026, 8),
      suitMat
    );
    upperArm.position.set(ax * 0.95, 0.0006, 0.0014);
    upperArm.rotation.x = 0.95;
    upperArm.rotation.z = side * -0.22;
    armPivotGroup.add(upperArm);

    // Forearm extending to steering wheel
    const forearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0005, 0.00045, 0.0024, 8),
      suitMat
    );
    forearm.position.set(ax * 0.72, 0.0004, 0.0030);
    forearm.rotation.x = 0.42;
    forearm.rotation.y = side * -0.32;
    armPivotGroup.add(forearm);

    // Racing Glove Fist at 9:15 and 2:45 on Steering Rim
    const glove = new THREE.Mesh(
      new THREE.SphereGeometry(0.00062, 8, 8),
      gloveMat
    );
    glove.position.set(side * 0.0013, 0.0006, 0.0038);
    armPivotGroup.add(glove);
  }
  driverGroup.add(armPivotGroup);

  // Articulated Driver Helmet Group (tilts into corners!)
  const driverHead = new THREE.Group();
  driverHead.position.set(0, 0.0078, -0.0004);

  const helmetMat = new THREE.MeshStandardMaterial({
    color: activeCharacter.visuals.helmetColor,
    roughness: 0.14,
    metalness: 0.25,
  });

  const helmetShell = new THREE.Mesh(
    new THREE.SphereGeometry(0.00225, 20, 18),
    helmetMat
  );
  helmetShell.scale.set(0.95, 1.0, 1.08);
  helmetShell.castShadow = false;
  driverHead.add(helmetShell);

  // Aerodynamic Chin Guard / Jaw Bar
  const chinGuard = new THREE.Mesh(
    new THREE.BoxGeometry(0.0024, 0.0009, 0.0016),
    helmetMat
  );
  chinGuard.position.set(0, -0.0007, 0.0014);
  driverHead.add(chinGuard);

  // Aerodynamic Crown Rear Spoiler Lip
  const crownLip = new THREE.Mesh(
    new THREE.BoxGeometry(0.0026, 0.00035, 0.0012),
    carbonMat
  );
  crownLip.position.set(0, 0.0009, -0.0016);
  driverHead.add(crownLip);

  // Curved Metallic/Iridescent Visor
  const visorMat = new THREE.MeshStandardMaterial({
    color: activeCharacter.visuals.visorColor,
    emissive: new THREE.Color(activeCharacter.visuals.visorEmissive),
    emissiveIntensity: 0.75,
    roughness: 0.08,
    metalness: 0.9,
  });
  const visor = new THREE.Mesh(
    new THREE.SphereGeometry(0.0023, 16, 12, -0.9, 1.8, 1.05, 0.75),
    visorMat
  );
  visor.rotation.y = Math.PI / 2;
  driverHead.add(visor);

  // Dedicated Helmet Accessories Group (Shared between Procedural & GLB Modes)
  const helmetAccessoriesGroup = new THREE.Group();
  helmetAccessoriesGroup.name = 'HelmetAccessoriesGroup';
  driverHead.add(helmetAccessoriesGroup);

  // 1. Luna's Cyber Cat-Ear Aerodynamic Antennas
  const cyberEarsGroup = new THREE.Group();
  for (const ex of [-0.0011, 0.0011]) {
    const ear = new THREE.Mesh(
      new THREE.ConeGeometry(0.0006, 0.0018, 4),
      new THREE.MeshStandardMaterial({ color: 0x00f0ff, roughness: 0.2, metalness: 0.8 })
    );
    ear.position.set(ex, 0.0022, 0.0003);
    ear.rotation.z = ex < 0 ? 0.35 : -0.35;
    cyberEarsGroup.add(ear);
  }
  cyberEarsGroup.visible = activeCharacter.visuals.helmetStyle === 'cyber_ears';
  helmetAccessoriesGroup.add(cyberEarsGroup);

  // 2. Rex's Motocross Visor Peak
  const motocrossPeak = new THREE.Mesh(
    new THREE.BoxGeometry(0.0032, 0.0004, 0.0018),
    new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.4 })
  );
  motocrossPeak.position.set(0, 0.0019, 0.0016);
  motocrossPeak.rotation.x = -0.35;
  motocrossPeak.visible = activeCharacter.visuals.helmetStyle === 'motocross_peak';
  helmetAccessoriesGroup.add(motocrossPeak);

  // 3. Pixie's Star Crest
  const starCrest = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.0007),
    new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.15, metalness: 0.9 })
  );
  starCrest.position.set(0, 0.0023, 0.0014);
  starCrest.visible = activeCharacter.visuals.helmetStyle === 'star_crest';
  helmetAccessoriesGroup.add(starCrest);

  // 4. Shadow's Ninja Headband Crest
  const shinobiSlit = new THREE.Mesh(
    new THREE.BoxGeometry(0.0034, 0.0005, 0.001),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x990000, roughness: 0.2 })
  );
  shinobiSlit.position.set(0, 0.0018, 0.0018);
  shinobiSlit.visible = activeCharacter.visuals.helmetStyle === 'shinobi_slit';
  helmetAccessoriesGroup.add(shinobiSlit);

  chassisGroup.add(driverHead);
  proceduralKartGroup.add(driverGroup);

  // -------------------------------------------------------------------------
  // PERSONALIZED KART ACCESSORIES (WINGS, ROLL CAGE, BULL BAR, UNDERGLOW)
  // Shared Accessories Group (stays visible in both GLB and Procedural modes!)
  // -------------------------------------------------------------------------
  const accessoriesGroup = new THREE.Group();
  accessoriesGroup.name = 'KartAccessoriesGroup';
  chassisGroup.add(accessoriesGroup);

  // A. Rex's Heavy Steel Tubular Roll Cage
  const rollCageGroup = new THREE.Group();
  const cageMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, metalness: 0.7, roughness: 0.35 });
  // Left and Right main arch hoops
  for (const cx of [-0.0034, 0.0034]) {
    const frontStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.00035, 0.00035, 0.009, 8), cageMat);
    frontStrut.position.set(cx, 0.0055, 0.001);
    frontStrut.rotation.x = 0.22;
    rollCageGroup.add(frontStrut);

    const rearStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.00035, 0.00035, 0.010, 8), cageMat);
    rearStrut.position.set(cx, 0.0055, -0.0045);
    rearStrut.rotation.x = -0.32;
    rollCageGroup.add(rearStrut);
  }
  // Overhead Cross Bar
  const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.0072, 0.0005, 0.006), cageMat);
  topBar.position.set(0, 0.0105, -0.0015);
  rollCageGroup.add(topBar);
  rollCageGroup.visible = Boolean(activeCharacter.visuals.hasRollCage);
  accessoriesGroup.add(rollCageGroup);

  // B. Rex's Front Ramming Bull Bar Bumper
  const bullBarGroup = new THREE.Group();
  const bullBar = new THREE.Mesh(new THREE.BoxGeometry(0.0102, 0.0022, 0.0012), cageMat);
  bullBar.position.set(0, 0.0022, 0.0092);
  bullBarGroup.add(bullBar);
  for (const bx of [-0.0035, 0.0035]) {
    const towHook = new THREE.Mesh(new THREE.TorusGeometry(0.0008, 0.0002, 6, 8), goldRimMat);
    towHook.position.set(bx, 0.0018, 0.0098);
    bullBarGroup.add(towHook);
  }
  bullBarGroup.visible = Boolean(activeCharacter.visuals.hasBullBar);
  accessoriesGroup.add(bullBarGroup);

  // C. Rex's Vertical Semi-Truck Smokestacks
  const smokestackGroup = new THREE.Group();
  for (const sx of [-0.0036, 0.0036]) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.0007, 0.0007, 0.0085, 10), chromeMat);
    pipe.position.set(sx, 0.0075, -0.0055);
    pipe.rotation.x = -0.15;
    smokestackGroup.add(pipe);
  }
  smokestackGroup.visible = activeCharacter.visuals.exhaustStyle === 'smokestack';
  accessoriesGroup.add(smokestackGroup);

  // D. Luna's Swept Cyber Aero Wings
  const cyberWingsGroup = new THREE.Group();
  const cyberMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, roughness: 0.18, metalness: 0.85 });
  for (const wx of [-0.0075, 0.0075]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.0042, 0.0005, 0.0065), cyberMat);
    wing.position.set(wx, 0.0055, -0.0065);
    wing.rotation.z = wx < 0 ? -0.35 : 0.35;
    wing.rotation.y = wx < 0 ? 0.25 : -0.25;
    cyberWingsGroup.add(wing);
  }
  cyberWingsGroup.visible = activeCharacter.visuals.spoilerType === 'cyber_wings';
  accessoriesGroup.add(cyberWingsGroup);

  // E. Pixie's Star Winglets
  const starWingGroup = new THREE.Group();
  const starMat = new THREE.MeshStandardMaterial({ color: 0xff2d87, roughness: 0.2, metalness: 0.6 });
  for (const wx of [-0.0065, 0.0065]) {
    const wing = new THREE.Mesh(new THREE.ConeGeometry(0.0018, 0.005, 5), starMat);
    wing.position.set(wx, 0.0065, -0.0075);
    wing.rotation.x = Math.PI / 2;
    wing.rotation.z = wx < 0 ? -0.4 : 0.4;
    starWingGroup.add(wing);
  }
  starWingGroup.visible = activeCharacter.visuals.spoilerType === 'star_wing';
  accessoriesGroup.add(starWingGroup);

  // F. Shadow's Twin Katana Upright Spoiler Blades
  const katanaWingGroup = new THREE.Group();
  const katanaMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.15, metalness: 0.95 });
  for (const wx of [-0.0055, 0.0055]) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.0004, 0.0068, 0.0052), katanaMat);
    blade.position.set(wx, 0.0078, -0.0072);
    blade.rotation.x = -0.35;
    katanaWingGroup.add(blade);
  }
  katanaWingGroup.visible = activeCharacter.visuals.spoilerType === 'katana_blades';
  accessoriesGroup.add(katanaWingGroup);

  // G. Neon Underglow Glow Mesh (for Luna, Pixie, Shadow)
  const underglowCanvas = document.createElement('canvas');
  underglowCanvas.width = 128;
  underglowCanvas.height = 128;
  const ugCtx = underglowCanvas.getContext('2d');
  const ugGrad = ugCtx.createRadialGradient(64, 64, 8, 64, 64, 60);
  ugGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.95)');
  ugGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.65)');
  ugGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
  ugCtx.fillStyle = ugGrad;
  ugCtx.fillRect(0, 0, 128, 128);
  const underglowTex = new THREE.CanvasTexture(underglowCanvas);

  const underglowMat = new THREE.MeshBasicMaterial({
    map: underglowTex,
    color: activeCharacter.visuals.underglowColor || 0x00f0ff,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -6,
    polygonOffsetUnits: -6,
  });
  const underglowMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.016, 0.022),
    underglowMat
  );
  underglowMesh.rotation.x = -Math.PI / 2;
  underglowMesh.position.set(0, 0.0008, 0);
  underglowMesh.visible = Boolean(activeCharacter.visuals.underglow);
  chassisGroup.add(underglowMesh);

  // Steering Column & Rotating 3-Spoke Steering Wheel
  const steeringAssembly = new THREE.Group();
  steeringAssembly.position.set(0, 0.0050, 0.0024);
  steeringAssembly.rotation.x = -0.55;

  const steerShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0003, 0.0003, 0.0036, 8),
    carbonMat
  );
  steerShaft.position.set(0, 0, -0.0016);
  steerShaft.rotation.x = Math.PI / 2;
  steeringAssembly.add(steerShaft);

  const steeringWheel = new THREE.Mesh(
    new THREE.TorusGeometry(0.0014, 0.00032, 8, 18),
    carbonMat
  );
  steeringAssembly.add(steeringWheel);
  proceduralKartGroup.add(steeringAssembly);

  // -------------------------------------------------------------------------
  // 3. 4 RUBBER SLICK WHEELS (Front Steerable Pivots + All 4 Spinning)
  // -------------------------------------------------------------------------
  const frontPivots = [];
  const wheelMeshes = [];

  function createWheelMesh(isRear = false) {
    const wRadius = isRear ? 0.00215 : 0.00185;
    const wWidth = isRear ? 0.0022 : 0.0017;
    const wGroup = new THREE.Group();

    const tire = new THREE.Mesh(
      new THREE.CylinderGeometry(wRadius, wRadius, wWidth, 20),
      tireRubberMat
    );
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = false;
    wGroup.add(tire);

    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(wRadius * 0.62, wRadius * 0.62, wWidth * 1.04, 14),
      goldRimMat
    );
    rim.rotation.z = Math.PI / 2;
    wGroup.add(rim);

    // Center Locking Hub Nut
    const hubNut = new THREE.Mesh(
      new THREE.OctahedronGeometry(wRadius * 0.22),
      chromeMat
    );
    hubNut.position.set(isRear ? 0.0012 : 0.00095, 0, 0);
    wGroup.add(hubNut);

    return wGroup;
  }

  // Front Left & Front Right Steerable Wheels
  for (const sx of [-0.0056, 0.0056]) {
    const pivot = new THREE.Group();
    pivot.position.set(sx, 0.00185, 0.0054);
    const wheel = createWheelMesh(false);
    pivot.add(wheel);
    proceduralKartGroup.add(pivot);
    frontPivots.push(pivot);
    wheelMeshes.push(wheel);
  }

  // Rear Left & Rear Right Drive Wheels
  for (const sx of [-0.0059, 0.0059]) {
    const wheel = createWheelMesh(true);
    wheel.position.set(sx, 0.00215, -0.0054);
    proceduralKartGroup.add(wheel);
    wheelMeshes.push(wheel);
  }

  // -------------------------------------------------------------------------
  // 4. MICRO-KART HIGH-INTENSITY 3D LED HEADLIGHT BEAM
  // -------------------------------------------------------------------------
  const headlightTarget = new THREE.Object3D();
  headlightTarget.position.set(0, -0.008, 0.072);
  chassisGroup.add(headlightTarget);

  // Elevated 3D SpotLight origin (y = 0.016, decay = 0.0, intensity = 9.5,
  // distance = 0.22) Using decay = 0.0 prevents d^-1.25 close-range blowout at
  // millimeter scale while casting a bright warm-white xenon cone across curved
  // ramps, spirals, curbs, rails, and desk props!
  const headlight =
      new THREE.SpotLight(0xfff4dc, 9.5, 0.22, Math.PI * 0.34, 0.78, 0.0);
  headlight.position.set(0, 0.016, 0.0085);
  headlight.target = headlightTarget;
  chassisGroup.add(headlight);

  // -------------------------------------------------------------------------
  // 5. REALISTIC GLOWING FIRE SPARKS EMITTER (Zero Lines, Soft Radial Fire Glow!)
  // -------------------------------------------------------------------------
  // -------------------------------------------------------------------------
  // 5. HIGH-FIDELITY TIRE DRIFT SPARK PARTICLE SYSTEM (Three.js GPU Points)
  // -------------------------------------------------------------------------
  const sparkCount = 360;
  const sparkPositions = new Float32Array(sparkCount * 3);
  const sparkColors = new Float32Array(sparkCount * 3);
  const sparkLifeAttr = new Float32Array(sparkCount); // 1.0 = fresh hot ember, 0.0 = expired
  const sparkSizes = new Float32Array(sparkCount);
  const sparkVelocities = [];
  const sparkAges = new Float32Array(sparkCount);
  const sparkMaxAges = new Float32Array(sparkCount);

  for (let i = 0; i < sparkCount; i++) {
    sparkPositions[i * 3 + 1] = -10; // hidden initially below track
    sparkVelocities.push(new THREE.Vector3());
    sparkAges[i] = 999;
    sparkMaxAges[i] = 0.30;
    sparkLifeAttr[i] = 0.0;
    sparkSizes[i] = 0.70 + Math.random() * 1.30;
    sparkColors[i * 3 + 0] = 1.0;
    sparkColors[i * 3 + 1] = 0.48;
    sparkColors[i * 3 + 2] = 0.08;
  }

  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
  sparkGeo.setAttribute('color', new THREE.BufferAttribute(sparkColors, 3));
  sparkGeo.setAttribute('aLife', new THREE.BufferAttribute(sparkLifeAttr, 1));
  sparkGeo.setAttribute('aSize', new THREE.BufferAttribute(sparkSizes, 1));

  const sparkMat = new THREE.ShaderMaterial({
    uniforms: {
      uSparkScale: {value: 0.58},
      tSceneDepth: {value: null},
      uNearClip: {value: 0.0015},
      uFarClip: {value: 12.0},
      uFocus: {value: 0.12},
      uAperture: {value: 0.0},
      uMaxBlur: {value: 0.0},
      uResolution: {value: new THREE.Vector2(1440, 900)},
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform float uSparkScale;
      uniform float uFocus;
      uniform float uAperture;
      uniform float uMaxBlur;
      uniform vec2 uResolution;
      attribute vec3 color;
      attribute float aLife;
      attribute float aSize;
      varying vec3 vColor;
      varying float vLife;
      varying float vViewZ;
      varying float vDofFactor;
      void main() {
        vColor = color;
        vLife = aLife;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewZ = mvPosition.z;
        gl_Position = projectionMatrix * mvPosition;

        // Smooth ember size curve: flares rapidly on ground contact, blooms, then shrinks as it cools
        float lifeScale = smoothstep(0.0, 0.08, aLife) * (0.35 + 0.65 * pow(aLife, 0.65));
        float basePointSize = clamp((5.4 * uSparkScale * aSize * lifeScale) / max(0.04, -mvPosition.z), 0.0, 24.0);

        // Evaluate optical Depth of Field from the spark's OWN 3D view-space depth (mvPosition.z)
        float rawFactor = uFocus + mvPosition.z;
        float deadzone = max(0.065, uFocus * 0.28);
        float absDiff = max(0.0, abs(rawFactor) - deadzone);
        float normScale = 1.0 / max(0.22, uFocus * 1.15);
        float cocUv = clamp(absDiff * (0.42 + 0.16 * normScale) * uAperture, 0.0, uMaxBlur);
        float cocPx = cocUv * uResolution.y * 0.50;
        vDofFactor = clamp(cocPx / max(1.0, basePointSize), 0.0, 4.0);

        gl_PointSize = aLife > 0.008 ? clamp(basePointSize + cocPx, 0.0, 28.0) : 0.0;
      }
    `,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <packing>
      uniform sampler2D tSceneDepth;
      uniform float uNearClip;
      uniform float uFarClip;
      uniform vec2 uResolution;
      varying vec3 vColor;
      varying float vLife;
      varying float vViewZ;
      varying float vDofFactor;
      void main() {
        if (vLife <= 0.008) discard;
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv);
        if (d > 0.5) discard;

        // Hardware depth occlusion against closer opaque 3D geometry (kart body, track, barrier)
        vec2 screenUv = gl_FragCoord.xy / max(vec2(1.0), uResolution);
        float rawSceneDepth = texture2D(tSceneDepth, screenUv).x;
        float sceneViewZ = perspectiveDepthToViewZ(rawSceneDepth, uNearClip, uFarClip);
        if (uNearClip > 0.0 && rawSceneDepth < 0.9999 && sceneViewZ > vViewZ + 0.0020) discard;

        // Soft circular radial fire-ember profile with incandescent white-hot core
        float blurLerp = clamp(vDofFactor * 0.35, 0.0, 1.0);
        float core = exp(-d * d * mix(36.0, 9.0, blurLerp));
        float midFire = exp(-d * d * mix(11.0, 5.0, blurLerp)) * smoothstep(0.5, 0.06, d);
        float outerHalo = pow(max(0.0, 1.0 - d * 2.0), mix(2.2, 1.3, blurLerp)) * 0.70;

        // Temperature color shift: incandescent white-hot core -> character plasma color -> deep glowing ember red
        vec3 deepEmber = vec3(0.95, 0.18, 0.02);
        vec3 midFlame = mix(deepEmber, vColor, clamp(vLife * 1.30, 0.0, 1.0));
        vec3 hotCenter = vec3(1.0, 0.98, 0.88);

        vec3 emberColor = mix(midFlame, hotCenter, clamp(core * 1.3, 0.0, 1.0));
        float energyNorm = 1.0 / (1.0 + vDofFactor * 0.85);
        // HDR intensity > 1.0 at center so bloom gives each spark a soft natural fire glow
        vec3 finalRgb = emberColor * (2.2 * core + 1.25 * midFire + 0.65 * outerHalo) * energyNorm;

        float alpha = clamp((core * 1.2 + midFire * 0.9 + outerHalo * 0.6) * vLife * energyNorm, 0.0, 1.0);
        if (alpha < 0.012) discard;
        gl_FragColor = vec4(finalRgb, alpha);
      }
    `,
  });

  const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
  sparkPoints.frustumCulled = false;
  sparkPoints.name = 'KartDriftSparks';

  // 4 Wheel Ground Contact Patch Offsets in chassis local coordinates
  const TIRE_CONTACT_POINTS = [
    { name: 'RearLeft', isRear: true, isLeft: true, offset: new THREE.Vector3(-0.0059, 0.00015, -0.0054) },
    { name: 'RearRight', isRear: true, isLeft: false, offset: new THREE.Vector3(0.0059, 0.00015, -0.0054) },
    { name: 'FrontLeft', isRear: false, isLeft: true, offset: new THREE.Vector3(-0.0056, 0.00015, 0.0054) },
    { name: 'FrontRight', isRear: false, isLeft: false, offset: new THREE.Vector3(0.0056, 0.00015, 0.0054) },
  ];

  let nextSparkIdx = 0;
  let lastWheelUpdateTime = -1;
  let hadActiveSparks = false;

  // Zero-GC module-level vector helpers for tire spark trajectory kinematics
  const _tempTireLocal = new THREE.Vector3();
  const _tireWorldPos = new THREE.Vector3();
  const _backDir = new THREE.Vector3();
  const _sparkLatDir = new THREE.Vector3();
  const _sparkUpDir = new THREE.Vector3();
  const _sparkJitter = new THREE.Vector3();
  const _rearAxleCenter = new THREE.Vector3();
  const _sparkLightPos = new THREE.Vector3();

  /**
   * Spins all 4 wheels proportional to forward velocity (`speed` in m/s)
   * and steers front wheel pivots to `steerAngle` (`+0.45` for Left `A`, `-0.45` for Right `D`).
   */
  function updateWheels(dt, speed, steerAngle = 0.0) {
    const now = performance.now();
    if (Math.abs(now - lastWheelUpdateTime) < 1e-4) {
      return;
    }
    lastWheelUpdateTime = now;

    const wheelSpinDelta = (speed / 0.002) * dt;
    for (const w of wheelMeshes) {
      w.rotation.x += wheelSpinDelta;
    }

    const targetSteerRad = THREE.MathUtils.clamp(steerAngle, -0.52, 0.52);
    for (const p of frontPivots) {
      p.rotation.y = THREE.MathUtils.lerp(p.rotation.y, targetSteerRad, Math.min(1, dt * 16));
    }
    steeringWheel.rotation.z = targetSteerRad * 1.6;
    driverHead.rotation.z = -targetSteerRad * 0.45;
    driverHead.rotation.y = targetSteerRad * 0.55;
  }

  function updateKartVisuals(dt, state) {
    const steerAngle =
      state.steerAngle !== undefined
        ? state.steerAngle - (state.driftAngle || 0.0) * 0.35
        : -(state.steerInput || 0.0) * 0.45 - (state.driftAngle || 0.0) * 0.35;

    updateWheels(dt, state.speed, steerAngle);

    // 3. Apply drift slip-angle yaw + suspension roll/hop to chassisGroup
    chassisGroup.rotation.y = THREE.MathUtils.lerp(
      chassisGroup.rotation.y,
      state.driftAngle || 0.0,
      Math.min(1, dt * 14)
    );
    chassisGroup.rotation.z = THREE.MathUtils.lerp(
      chassisGroup.rotation.z,
      (state.steerInput || 0.0) * 0.09,
      Math.min(1, dt * 12)
    );
    const idleBob =
      Math.abs(state.speed) > 0.005 ? Math.sin(performance.now() * 0.06) * 0.00018 : 0.0;
    chassisGroup.position.y = (state.hopHeight || 0.0) + idleBob;

    // 4. Volumetric Mach-Diamond Exhaust Flames: active during turbo boost with
    // independent left/right combustion crackle and high-frequency afterburner
    // pulsing
    const isBoosting = state.boostActive > 0;
    const tSec = performance.now() * 0.001;

    for (const pGroup of flameCones) {
      pGroup.visible = isBoosting;
      if (!pGroup.visible) continue;
      const pIdx = pGroup.userData.pipeIndex || 0;
      const phase = pIdx * 1.85;
      const crackle = 0.82 + 0.18 * Math.sin(tSec * 58.0 + phase) +
          0.12 * Math.cos(tSec * 93.0 - phase * 1.4);
      const rScale = 0.96 + 0.08 * Math.sin(tSec * 44.0 + phase);
      const zScale = Math.max(0.55, 0.88 + 0.28 * crackle);
      pGroup.scale.set(rScale, rScale, zScale);
      if (pGroup.userData.jetMat) {
        pGroup.userData.jetMat.uniforms.uTime.value = tSec;
        pGroup.userData.jetMat.uniforms.uIntensity.value =
            Math.min(1.35, 0.92 * crackle);
      }
    }

    // 5. Emit & step realistic glowing fire sparks from tires when drift angle exceeds threshold
    const kScale = kartRoot.scale.x || 0.58;
    sparkMat.uniforms.uSparkScale.value = kScale;

    const driftAngle = state.driftAngle || 0.0;
    const absDrift = Math.abs(driftAngle);
    const driftThreshold = state.driftThreshold || 0.080;
    const isSteering =
      Math.abs(state.steerInput || state.steerSmooth || state.turnRight || 0) > 0.08 ||
      (state.autopilot && Math.abs(state.signedCurvature || 0) > 0.35);

    // Triggers sparks from the kart's tires when drift angle exceeds the threshold during steering
    const isDriftSparking =
      (absDrift >= driftThreshold && isSteering && Math.abs(state.speed) > 0.035) ||
      state.isDrifting;
    const isBoostSparking = isBoosting && Math.abs(state.speed) > 0.04;
    const isCurbScrub = (state.curbRumble || 0) > 0.35 && Math.abs(state.speed) > 0.05;

    const isEmitting = isDriftSparking || isBoostSparking || isCurbScrub;

    // Intensity scales smoothly with how far beyond the threshold the drift angle is
    const driftIntensity = THREE.MathUtils.clamp((absDrift - driftThreshold) / 0.10, 0.0, 1.0);
    let emitCount = 0;
    if (isDriftSparking) {
      emitCount = Math.round(5 + driftIntensity * 7); // 5 to 12 sparks per frame
    } else if (isBoostSparking) {
      emitCount = 4;
    } else if (isCurbScrub) {
      emitCount = 3;
    }

    // Flicker warm character-tinted firelight onto the roadbed/desk under slipping rear tires
    const sc = activeCharacter.visuals.sparkColor || [1.0, 0.52, 0.08];
    sparkFireLight.color.setRGB(sc[0], sc[1], sc[2]);

    if (fireLightPreviewTimer > 0) {
      fireLightPreviewTimer = Math.max(0.0, fireLightPreviewTimer - dt);
    }
    const showFireLight = isEmitting || fireLightPreviewTimer > 0;
    const baseFireIntensity = (0.35 + Math.random() * 0.25) * (0.6 + 0.4 * driftIntensity);
    sparkFireLight.intensity = showFireLight
      ? baseFireIntensity * fireLightMultiplier
      : THREE.MathUtils.lerp(sparkFireLight.intensity, 0.0, Math.min(1, dt * 12));

    if (emitCount > 0) {
      _backDir.copy(state.tangent).multiplyScalar(-1);

      for (let e = 0; e < emitCount; e++) {
        const idx = nextSparkIdx % sparkCount;
        nextSparkIdx++;

        // Determine which tire emits this spark:
        // When drifting, outside sliding tires bear the highest friction scrub load!
        let targetTire = TIRE_CONTACT_POINTS[0]; // default RearLeft
        if (isDriftSparking) {
          const r = Math.random();
          if (driftAngle < 0) {
            // Turning right: chassis noses right, rear steps out LEFT -> Left tires are outside
            if (r < 0.68) {
              targetTire = TIRE_CONTACT_POINTS[0]; // RearLeft (primary sliding tire)
            } else if (r < 0.92) {
              targetTire = TIRE_CONTACT_POINTS[1]; // RearRight (inside rear)
            } else {
              targetTire = absDrift > 0.12 ? TIRE_CONTACT_POINTS[2] : TIRE_CONTACT_POINTS[0]; // FrontLeft outside
            }
          } else {
            // Turning left: chassis noses left, rear steps out RIGHT -> Right tires are outside
            if (r < 0.68) {
              targetTire = TIRE_CONTACT_POINTS[1]; // RearRight (primary sliding tire)
            } else if (r < 0.92) {
              targetTire = TIRE_CONTACT_POINTS[0]; // RearLeft (inside rear)
            } else {
              targetTire = absDrift > 0.12 ? TIRE_CONTACT_POINTS[3] : TIRE_CONTACT_POINTS[1]; // FrontRight outside
            }
          }
        } else if (isCurbScrub) {
          // Curb contact: sparks emit from the tire hitting the curb
          targetTire = (state.lateralOffset || 0) > 0 ? TIRE_CONTACT_POINTS[1] : TIRE_CONTACT_POINTS[0];
        } else {
          // Boosting on straights: alternate left and right rear tires
          targetTire = e % 2 === 0 ? TIRE_CONTACT_POINTS[0] : TIRE_CONTACT_POINTS[1];
        }

        // Compute 3D world position of the tire's ground contact patch
        _tempTireLocal.copy(targetTire.offset).multiplyScalar(kScale);
        _tempTireLocal.x += (Math.random() - 0.5) * 0.0012 * kScale;
        _tempTireLocal.z += (Math.random() - 0.5) * 0.0016 * kScale;
        chassisGroup.localToWorld(_tireWorldPos.copy(_tempTireLocal));

        sparkPositions[idx * 3 + 0] = _tireWorldPos.x;
        sparkPositions[idx * 3 + 1] = _tireWorldPos.y;
        sparkPositions[idx * 3 + 2] = _tireWorldPos.z;

        // Kinematic ejection velocity:
        // 1. Backward velocity opposite to travel
        const vBack = (0.13 + Math.random() * 0.26) * (Math.abs(state.speed) / 0.16 + 0.45) * kScale;
        // 2. Lateral centrifugal ejection in direction of tire scrub
        const latSign = driftAngle > 0 ? 1.0 : (driftAngle < 0 ? -1.0 : (Math.random() > 0.5 ? 1.0 : -1.0));
        const vLat = latSign * (0.045 + Math.random() * 0.18) * (0.6 + 0.4 * driftIntensity) * kScale;
        _sparkLatDir.copy(state.right).multiplyScalar(vLat);
        // 3. Upward bounce kick off road surface
        _sparkUpDir.copy(state.normal).multiplyScalar((0.025 + Math.random() * 0.085) * kScale);
        // 4. Micro-turbulence dispersion
        _sparkJitter.set(
          (Math.random() - 0.5) * 0.035,
          (Math.random() - 0.5) * 0.020,
          (Math.random() - 0.5) * 0.035
        ).multiplyScalar(kScale);

        sparkVelocities[idx]
          .copy(_backDir)
          .multiplyScalar(vBack)
          .add(_sparkLatDir)
          .add(_sparkUpDir)
          .add(_sparkJitter);

        sparkAges[idx] = 0.0;
        sparkMaxAges[idx] = 0.18 + Math.random() * 0.22; // 180ms to 400ms lifespan
        sparkLifeAttr[idx] = 1.0;
        sparkSizes[idx] = 0.70 + Math.random() * 1.30;

        // Character-personalized Fire & Plasma Spark Palette
        const j = (Math.random() - 0.5) * 0.18;
        sparkColors[idx * 3 + 0] = THREE.MathUtils.clamp(sc[0] + j * 0.35, 0.0, 1.0);
        sparkColors[idx * 3 + 1] = THREE.MathUtils.clamp(sc[1] + j * 0.65, 0.0, 1.0);
        sparkColors[idx * 3 + 2] = THREE.MathUtils.clamp(sc[2] + j * 0.65, 0.0, 1.0);
      }
    }

    let activeSparksNow = false;
    if (emitCount > 0 || hadActiveSparks) {
      for (let i = 0; i < sparkCount; i++) {
        const maxAge = sparkMaxAges[i] || 0.28;
        if (sparkAges[i] < maxAge) {
          activeSparksNow = true;
          sparkAges[i] += dt;
          sparkLifeAttr[i] = Math.max(0.0, 1.0 - sparkAges[i] / maxAge);

          sparkPositions[i * 3 + 0] += sparkVelocities[i].x * dt;
          sparkPositions[i * 3 + 1] += sparkVelocities[i].y * dt;
          sparkPositions[i * 3 + 2] += sparkVelocities[i].z * dt;

          // Drag deceleration + downward gravity
          sparkVelocities[i].multiplyScalar(Math.max(0.82, 1.0 - 2.8 * dt));
          sparkVelocities[i].y -= 0.38 * dt;
        } else {
          sparkLifeAttr[i] = 0.0;
          sparkPositions[i * 3 + 1] = -10.0; // Hide below track
        }
      }
      sparkGeo.attributes.position.needsUpdate = true;
      sparkGeo.attributes.color.needsUpdate = true;
      sparkGeo.attributes.aLife.needsUpdate = true;
      hadActiveSparks = activeSparksNow;
    }
  }

  let attachedGlbScene = null;
  let cockpitRoadOnly = false;

  // Material registries for dynamic per-character recoloring on kart_1to87.glb
  const glbMaterialSlots = {
    body: [],
    stripes: [],
    accent: [],
    rim: [],
    suit: [],
    helmet: [],
    visor: [],
    gunmetal: [],
    chrome: [],
  };

  function applyCharacterThemeToGlb(char) {
    if (!char || !char.visuals) return;
    const v = char.visuals;

    for (const mat of glbMaterialSlots.body) {
      if (mat && mat.color) mat.color.setHex(v.primaryColor);
      mat.needsUpdate = true;
    }
    for (const mat of glbMaterialSlots.stripes) {
      if (mat && mat.color) mat.color.setHex(v.secondaryColor);
      mat.needsUpdate = true;
    }
    for (const mat of glbMaterialSlots.accent) {
      if (mat && mat.color) mat.color.setHex(v.accentColor);
      mat.needsUpdate = true;
    }
    for (const mat of glbMaterialSlots.rim) {
      if (mat && mat.color) mat.color.setHex(v.rimColor);
      mat.needsUpdate = true;
    }
    for (const mat of glbMaterialSlots.suit) {
      if (mat && mat.color) mat.color.setHex(v.suitColor);
      mat.needsUpdate = true;
    }
    for (const mat of glbMaterialSlots.helmet) {
      if (mat && mat.color) mat.color.setHex(v.helmetColor);
      mat.needsUpdate = true;
    }
    for (const mat of glbMaterialSlots.visor) {
      if (mat) {
        if (mat.color) mat.color.setHex(v.visorColor);
        if (mat.emissive) {
          mat.emissive.setHex(v.visorEmissive || v.visorColor);
          mat.emissiveIntensity = char.id === 'shadow' ? 1.4 : 0.8;
        }
        mat.needsUpdate = true;
      }
    }
  }

  function setCockpitRoadOnly(isRoadOnly) {
    cockpitRoadOnly = Boolean(isRoadOnly);
    kartShadowQuad.visible = !cockpitRoadOnly;
    if (attachedGlbScene) {
      attachedGlbScene.visible = !cockpitRoadOnly;
    }
    if (proceduralKartGroup) {
      proceduralKartGroup.visible = !attachedGlbScene && !cockpitRoadOnly;
    }
    if (accessoriesGroup) {
      accessoriesGroup.visible = !cockpitRoadOnly;
    }
    if (driverHead) {
      driverHead.visible = !cockpitRoadOnly;
    }
    for (const plane of tailLightGlowPlanes) {
      if (plane) plane.visible = !cockpitRoadOnly;
    }
  }

  function attachGlbKart(glbScene) {
    attachedGlbScene = glbScene;
    // Ensure zero extra rotation on glbScene so +Z nose (Z_three = +0.0090) faces straight down +tangent
    glbScene.position.set(0, 0, 0);
    glbScene.rotation.set(0, 0, 0);
    glbScene.visible = !cockpitRoadOnly;
    kartShadowQuad.visible = !cockpitRoadOnly;

    // Hide procedural body/wheels while keeping headlights, accessories, tail-light glow halo planes, and turbo flame cones
    if (proceduralKartGroup) {
      proceduralKartGroup.visible = false;
    }

    function attachKartReadabilityRimShader(mat, cacheKey, minFloorStrength, topFillStrength, rimStrength) {
      mat.customProgramCacheKey = () => cacheKey;
      mat.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <dithering_fragment>',
          `
          vec3 kViewDir = normalize( vViewPosition );
          float kNdotV = clamp( abs( dot( normal, kViewDir ) ), 0.0, 1.0 );
          float kGrazing = pow( 1.0 - kNdotV, 2.15 );
          float kTopFill = clamp( normal.y * 0.65 + normal.z * 0.35, 0.0, 1.0 );
          vec3 minFloorRgb = diffuseColor.rgb * (${minFloorStrength.toFixed(3)} + ${topFillStrength.toFixed(3)} * kTopFill);
          vec3 rimHighlightRgb = mix(diffuseColor.rgb, vec3(1.0, 0.97, 0.92), 0.48) * (kGrazing * ${rimStrength.toFixed(3)});
          gl_FragColor.rgb = max(gl_FragColor.rgb, minFloorRgb) + rimHighlightRgb * (0.45 + 0.55 * kTopFill);
          #include <dithering_fragment>
          `
        );
      };
    }

    const glbFrontWheels = [];
    const glbAllWheels = [];
    glbScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        if (child.geometry && !child.geometry.attributes.normal) {
          child.geometry.computeVertexNormals();
        }
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        for (const mat of mats) {
          if (!mat) continue;
          const mName = (mat.name || '').toLowerCase();
          if (mName.includes('visor')) {
            mat.roughness = 0.14;
            mat.metalness = 0.85;
            mat.envMapIntensity = 0.85;
            glbMaterialSlots.visor.push(mat);
          } else if (mName.includes('helmet') || mName.includes('white')) {
            mat.roughness = 0.20;
            mat.metalness = 0.08;
            mat.envMapIntensity = 0.95;
            attachKartReadabilityRimShader(mat, 'kart_white_rim_v1', 0.22, 0.28, 0.18);
            if (mName.includes('helmet')) {
              glbMaterialSlots.helmet.push(mat);
            } else {
              glbMaterialSlots.stripes.push(mat);
            }
          } else if (mName.includes('crimson') || mName.includes('red') || mName.includes('body')) {
            mat.roughness = 0.20;
            mat.metalness = 0.48;
            mat.envMapIntensity = 1.35;
            attachKartReadabilityRimShader(mat, 'kart_crimson_rim_v1', 0.28, 0.34, 0.26);
            glbMaterialSlots.body.push(mat);
          } else if (mName.includes('gold')) {
            mat.roughness = 0.24;
            mat.metalness = 0.78;
            mat.envMapIntensity = 1.15;
            attachKartReadabilityRimShader(mat, 'kart_gold_rim_v1', 0.24, 0.30, 0.24);
            glbMaterialSlots.accent.push(mat);
            glbMaterialSlots.rim.push(mat);
          } else if (mName.includes('gunmetal')) {
            mat.roughness = 0.26;
            mat.metalness = 0.58;
            mat.envMapIntensity = 1.30;
            attachKartReadabilityRimShader(mat, 'kart_gunmetal_rim_v1', 0.28, 0.36, 0.30);
            glbMaterialSlots.gunmetal.push(mat);
          } else if (mName.includes('suit')) {
            mat.roughness = 0.50;
            mat.metalness = 0.12;
            mat.envMapIntensity = 0.85;
            attachKartReadabilityRimShader(mat, 'kart_suit_rim_v1', 0.20, 0.24, 0.16);
            glbMaterialSlots.suit.push(mat);
          } else if (mName.includes('tire') || mName.includes('rubber')) {
            if (mat.color) mat.color.setHex(0x16191e);
            mat.roughness = 0.72;
            mat.metalness = 0.06;
            mat.envMapIntensity = 0.65;
            attachKartReadabilityRimShader(mat, 'kart_tire_rim_v1', 0.14, 0.18, 0.14);
            mat.needsUpdate = true;
          } else if (mName.includes('headlight')) {
            if (mat.color) mat.color.setHex(0xffffff);
            if (mat.emissive) mat.emissive.setHex(0xfff4d8);
            mat.emissiveIntensity = 2.2;
            mat.roughness = 0.08;
            mat.needsUpdate = true;
          } else if (mName.includes('rainlight') || mName.includes('taillight')) {
            if (mat.color) mat.color.setHex(0xff0010);
            if (mat.emissive) mat.emissive.setHex(0xff0018);
            mat.emissiveIntensity = 1.35;
            mat.roughness = 0.08;
            mat.toneMapped = false;
            mat.customProgramCacheKey = () => 'tail_led_ruby_glow_v1';
            mat.onBeforeCompile = (shader) => {
              shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `#include <common>\nvarying vec3 vLedLocalPos;`
              );
              shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `#include <begin_vertex>\nvLedLocalPos = position;`
              );
              shader.fragmentShader = shader.fragmentShader.replace(
                '#include <common>',
                `#include <common>\nvarying vec3 vLedLocalPos;`
              );
              shader.fragmentShader = shader.fragmentShader.replace(
                '#include <dithering_fragment>',
                `
                float ax = abs(vLedLocalPos.x);
                float uCluster = clamp((ax - 0.00218) / 0.00212, 0.0, 1.0);
                float segU = fract(uCluster * 3.0) - 0.5;
                float rowCenterY = vLedLocalPos.y > 0.00276 ? 0.00309 : 0.00244;
                float segV = clamp((vLedLocalPos.y - rowCenterY) / 0.00025, -1.0, 1.0);
                float edgeDist = max(abs(segU) * 2.0, abs(segV));
                float diodeCore = exp(- (segU * segU * 7.5 + segV * segV * 2.8));
                float rimShade = smoothstep(1.0, 0.25, edgeDist);
                vec3 deepCrimson = vec3(0.58, 0.0, 0.014);
                vec3 hotRubyCore = vec3(1.42, 0.0, 0.048);
                vec3 rubyLedRgb = mix(deepCrimson, hotRubyCore, clamp(diodeCore * 0.85 + rimShade * 0.25, 0.0, 1.0));
                gl_FragColor = vec4(rubyLedRgb, 1.0);
                #include <dithering_fragment>
                `
              );
            };
            mat.needsUpdate = true;
          } else if (mName.includes('chrome')) {
            if (mat.color) mat.color.setHex(0x7d8796);
            mat.roughness = 0.30;
            mat.metalness = 0.82;
            mat.envMapIntensity = 0.65;
            attachKartReadabilityRimShader(mat, 'kart_chrome_rim_v2', 0.14, 0.18, 0.12);
            glbMaterialSlots.chrome.push(mat);
            mat.needsUpdate = true;
          }
        }
      }
      if (child.name === 'Wheel_FL' || child.name === 'Wheel_FR') {
        glbFrontWheels.push(child);
        glbAllWheels.push(child);
      } else if (child.name === 'Wheel_RL' || child.name === 'Wheel_RR') {
        glbAllWheels.push(child);
      }
    });

    // Apply currently active character's livery onto the GLB materials immediately
    applyCharacterThemeToGlb(activeCharacter);

    chassisGroup.add(glbScene);
    // Register GLB wheels for 60FPS spin & steering
    if (glbAllWheels.length > 0) {
      wheelMeshes.push(...glbAllWheels);
    }
    if (glbFrontWheels.length > 0) {
      frontPivots.push(...glbFrontWheels);
    }
  }

  function setCharacter(characterId) {
    const char = getCharacterById(characterId);
    if (!char) return activeCharacter;
    activeCharacter = char;

    // Update procedural materials
    redFairingMat.color.setHex(char.visuals.primaryColor);
    whiteStripeMat.color.setHex(char.visuals.secondaryColor);
    goldRimMat.color.setHex(char.visuals.rimColor);
    suitMat.color.setHex(char.visuals.suitColor);
    helmetMat.color.setHex(char.visuals.helmetColor);
    visorMat.color.setHex(char.visuals.visorColor);
    visorMat.emissive.setHex(char.visuals.visorEmissive);

    // Apply palette to GLB materials if kart_1to87.glb is loaded
    if (attachedGlbScene) {
      applyCharacterThemeToGlb(char);
    }

    // Toggle custom 3D helmet accessories
    cyberEarsGroup.visible = char.visuals.helmetStyle === 'cyber_ears';
    motocrossPeak.visible = char.visuals.helmetStyle === 'motocross_peak';
    starCrest.visible = char.visuals.helmetStyle === 'star_crest';
    shinobiSlit.visible = char.visuals.helmetStyle === 'shinobi_slit';

    // Toggle custom 3D kart accessories
    rollCageGroup.visible = Boolean(char.visuals.hasRollCage);
    bullBarGroup.visible = Boolean(char.visuals.hasBullBar);
    smokestackGroup.visible = char.visuals.exhaustStyle === 'smokestack';
    cyberWingsGroup.visible = char.visuals.spoilerType === 'cyber_wings';
    starWingGroup.visible = char.visuals.spoilerType === 'star_wing';
    katanaWingGroup.visible = char.visuals.spoilerType === 'katana_blades';
    rearWing.visible = char.visuals.spoilerType === 'carbon_formula';

    // Update underglow
    underglowMesh.visible = Boolean(char.visuals.underglow);
    if (char.visuals.underglowColor) {
      underglowMat.color.setHex(char.visuals.underglowColor);
    }

    // Update exhaust flame shaders
    for (const jMat of jetMaterials) {
      if (jMat && jMat.uniforms) {
        if (jMat.uniforms.uFlameCore) jMat.uniforms.uFlameCore.value.set(...char.visuals.flameCore);
        if (jMat.uniforms.uFlameMid) jMat.uniforms.uFlameMid.value.set(...char.visuals.flameMid);
        if (jMat.uniforms.uFlameTail) jMat.uniforms.uFlameTail.value.set(...char.visuals.flameTail);
      }
    }

    // Keep the high-fidelity GLB model visible for ALL characters (never fall back to colored blocks!)
    if (attachedGlbScene) {
      attachedGlbScene.visible = !cockpitRoadOnly;
      if (proceduralKartGroup) proceduralKartGroup.visible = false;
    } else {
      if (proceduralKartGroup) proceduralKartGroup.visible = !cockpitRoadOnly;
    }

    return char;
  }

  return {
    kartRoot,
    chassisGroup,
    sparkPoints,
    sparkFireLight,
    setFireLightMultiplier,
    setCockpitRoadOnly,
    updateWheels,
    updateKartVisuals,
    attachGlbKart,
    setCharacter,
    getCharacter: () => activeCharacter,
    getTireContactPoints: () => TIRE_CONTACT_POINTS,
    sparkCount,
  };
}
