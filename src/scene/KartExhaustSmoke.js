import * as THREE from 'three';

/**
 * Kart Exhaust Smoke Particle System
 * Emits light volumetric smoke puffs from the exhaust pipes / smokestacks
 * when the kart is under heavy acceleration or when the engine revs high.
 */
export function buildKartExhaustSmoke() {
  const maxParticles = 260;
  const positions = new Float32Array(maxParticles * 3);
  const colors = new Float32Array(maxParticles * 3);
  const alphas = new Float32Array(maxParticles);
  const sizes = new Float32Array(maxParticles);
  const ages = new Float32Array(maxParticles);
  const maxAges = new Float32Array(maxParticles);
  const velocities = [];

  // Generate procedural soft-edged turbulent smoke puff alpha texture
  const puffCanvas = document.createElement('canvas');
  puffCanvas.width = 64;
  puffCanvas.height = 64;
  const pCtx = puffCanvas.getContext('2d');
  const pGrad = pCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
  pGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.95)');
  pGrad.addColorStop(0.35, 'rgba(240, 245, 255, 0.72)');
  pGrad.addColorStop(0.65, 'rgba(210, 220, 235, 0.28)');
  pGrad.addColorStop(1.0, 'rgba(180, 195, 215, 0.0)');
  pCtx.fillStyle = pGrad;
  pCtx.beginPath();
  pCtx.arc(32, 32, 30, 0, Math.PI * 2);
  pCtx.fill();

  const puffTex = new THREE.CanvasTexture(puffCanvas);

  for (let i = 0; i < maxParticles; i++) {
    positions[i * 3 + 0] = 0;
    positions[i * 3 + 1] = -100; // initially offscreen
    positions[i * 3 + 2] = 0;
    colors[i * 3 + 0] = 0.88;
    colors[i * 3 + 1] = 0.90;
    colors[i * 3 + 2] = 0.94;
    alphas[i] = 0.0;
    sizes[i] = 1.0;
    ages[i] = 999;
    maxAges[i] = 0.60;
    velocities.push(new THREE.Vector3());
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: puffTex },
      uScale: { value: 0.58 },
    },
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    vertexShader: /* glsl */ `
      uniform float uScale;
      attribute vec3 color;
      attribute float aAlpha;
      attribute float aSize;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vColor = color;
        vAlpha = aAlpha;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        // Smoke puff blossoms as it expands and drifts away from the exhaust pipe
        float pointSize = (aSize * uScale * 5.2) / max(0.04, -mvPosition.z);
        gl_PointSize = clamp(pointSize, 0.0, 36.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        if (vAlpha <= 0.005) discard;
        vec4 tex = texture2D(uMap, gl_PointCoord);
        float alpha = tex.a * vAlpha;
        if (alpha <= 0.005) discard;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
  });

  const smokePoints = new THREE.Points(geometry, material);
  smokePoints.frustumCulled = false;
  smokePoints.name = 'KartExhaustSmokePoints';

  let nextIdx = 0;
  let emitTimer = 0.0;
  let hasActiveParticles = false;

  // Reusable vectors for zero allocation during step
  const _nozzleLocal = new THREE.Vector3();
  const _nozzleWorld = new THREE.Vector3();
  const _backVel = new THREE.Vector3();
  const _upVel = new THREE.Vector3();
  const _turbVel = new THREE.Vector3();

  // Standard dual exhaust tips in local chassis space
  const STD_EXHAUST_OFFSETS = [
    new THREE.Vector3(-0.00108, 0.00208, -0.00895),
    new THREE.Vector3(0.00108, 0.00208, -0.00895),
  ];
  // Rex's twin vertical semi-truck smokestacks
  const TRUCK_STACK_OFFSETS = [
    new THREE.Vector3(-0.0036, 0.0118, -0.0055),
    new THREE.Vector3(0.0036, 0.0118, -0.0055),
  ];

  function emitPuff(originWorld, dirBack, dirUp, scale, intensity, isTruckStack) {
    const idx = nextIdx % maxParticles;
    nextIdx++;

    positions[idx * 3 + 0] = originWorld.x + (Math.random() - 0.5) * 0.0006 * scale;
    positions[idx * 3 + 1] = originWorld.y + (Math.random() - 0.5) * 0.0004 * scale;
    positions[idx * 3 + 2] = originWorld.z + (Math.random() - 0.5) * 0.0006 * scale;

    // Ejection speed: backward draft + thermal upward rise + gentle curl turbulence
    const backSpeed = (isTruckStack ? 0.025 : 0.065 + Math.random() * 0.08) * scale;
    const upSpeed = (isTruckStack ? 0.065 + Math.random() * 0.045 : 0.022 + Math.random() * 0.025) * scale;
    const turbSpeed = (0.012 + Math.random() * 0.015) * scale;

    _backVel.copy(dirBack).multiplyScalar(backSpeed);
    _upVel.copy(dirUp).multiplyScalar(upSpeed);
    _turbVel.set(
      (Math.random() - 0.5) * turbSpeed,
      (Math.random() - 0.5) * turbSpeed * 0.5,
      (Math.random() - 0.5) * turbSpeed
    );

    velocities[idx].copy(_backVel).add(_upVel).add(_turbVel);

    ages[idx] = 0.0;
    maxAges[idx] = 0.42 + Math.random() * 0.28; // 420ms - 700ms lifespan
    sizes[idx] = (0.8 + Math.random() * 0.4) * (isTruckStack ? 1.25 : 1.0);

    // Initial light translucent opacity (0.28 to 0.48 based on acceleration intensity)
    alphas[idx] = THREE.MathUtils.clamp(0.24 + intensity * 0.26, 0.20, 0.52);

    // Subtle warm combustion grey tones with slight atmospheric blue/white
    const rShade = 0.86 + (Math.random() - 0.5) * 0.08;
    const gShade = 0.88 + (Math.random() - 0.5) * 0.06;
    const bShade = 0.92 + (Math.random() - 0.5) * 0.06;
    colors[idx * 3 + 0] = rShade;
    colors[idx * 3 + 1] = gShade;
    colors[idx * 3 + 2] = bShade;
  }

  function update(dt, state, kartScale, chassisGroup, activeCharacter) {
    if (!state || !chassisGroup) return;

    material.uniforms.uScale.value = kartScale || 0.58;

    const speed = Math.abs(state.speed || 0.0);
    const throttle = state.turnRight !== undefined && state.turnRight !== null
      ? (state.steerInput !== undefined ? (state.steerInput) : 0.0) // placeholder
      : 0.0;

    // Detect Heavy Acceleration & High Engine Revs
    const isBoosting = (state.boostActive || 0) > 0;
    const isLaunching = speed < 0.11 && (state.turnRight !== undefined); // launching from stop
    const isHardAccel = speed > 0.005 && speed < 0.14 && (state.turnRight !== undefined);
    const isHighRevSpeed = speed > 0.165; // High speed cruise / flat-out
    const isCountdownRevving = Boolean(state.countdownLocked && state.wasCountdownLocked);

    // Evaluate acceleration / rev load (0.0 to 1.0)
    let revLoad = 0.0;
    if (isBoosting) {
      revLoad = 0.95;
    } else if (isHighRevSpeed) {
      revLoad = 0.45 + 0.50 * THREE.MathUtils.clamp((speed - 0.165) / 0.04, 0.0, 1.0);
    } else if (isHardAccel) {
      revLoad = 0.65;
    } else if (isCountdownRevving) {
      revLoad = 0.55;
    }

    const isTruckStack = Boolean(
      activeCharacter &&
      activeCharacter.visuals &&
      activeCharacter.visuals.exhaustStyle === 'smokestack'
    );
    const offsets = isTruckStack ? TRUCK_STACK_OFFSETS : STD_EXHAUST_OFFSETS;

    if (revLoad > 0.15) {
      emitTimer += dt;
      // Emit every ~0.045s (approx 22 puffs per second)
      const emitInterval = THREE.MathUtils.lerp(0.065, 0.035, revLoad);
      if (emitTimer >= emitInterval) {
        emitTimer = 0.0;
        const dirBack = _backVel.copy(state.tangent || new THREE.Vector3(0, 0, -1)).multiplyScalar(-1);
        const dirUp = _upVel.copy(state.normal || new THREE.Vector3(0, 1, 0));

        // Alternate or emit from both exhaust nozzles
        for (let p = 0; p < offsets.length; p++) {
          _nozzleLocal.copy(offsets[p]).multiplyScalar(kartScale || 0.58);
          chassisGroup.localToWorld(_nozzleWorld.copy(_nozzleLocal));
          emitPuff(_nozzleWorld, dirBack, dirUp, kartScale || 0.58, revLoad, isTruckStack);
        }
      }
    } else {
      emitTimer = 0.0;
    }

    // Step active particles
    let anyActive = false;
    const dragFactor = Math.exp(-2.2 * dt); // aerodynamic velocity drag on smoke puff

    for (let i = 0; i < maxParticles; i++) {
      if (ages[i] >= maxAges[i]) continue;

      anyActive = true;
      ages[i] += dt;
      const progress = ages[i] / maxAges[i]; // 0.0 to 1.0

      if (progress >= 1.0) {
        alphas[i] = 0.0;
        positions[i * 3 + 1] = -100;
        continue;
      }

      // Move particle by velocity
      positions[i * 3 + 0] += velocities[i].x * dt;
      positions[i * 3 + 1] += velocities[i].y * dt;
      positions[i * 3 + 2] += velocities[i].z * dt;

      // Dampen velocity as it mixes with ambient air
      velocities[i].multiplyScalar(dragFactor);

      // Blossom in size as it disperses (from 1.0x at birth to 3.2x)
      sizes[i] = 1.0 + progress * 2.2;

      // Smooth alpha envelope: rises quickly on emission, stays visible, then gently dissipates
      const lifeFade = Math.sin(progress * Math.PI * 0.95);
      alphas[i] = (0.35 + 0.15 * (1.0 - progress)) * lifeFade;
    }

    if (anyActive || hasActiveParticles) {
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
      geometry.attributes.aAlpha.needsUpdate = true;
      geometry.attributes.aSize.needsUpdate = true;
      hasActiveParticles = anyActive;
    }
  }

  function reset() {
    for (let i = 0; i < maxParticles; i++) {
      positions[i * 3 + 1] = -100;
      alphas[i] = 0.0;
      ages[i] = 999;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.aAlpha.needsUpdate = true;
    hasActiveParticles = false;
  }

  function dispose() {
    geometry.dispose();
    material.dispose();
    puffTex.dispose();
  }

  return {
    smokePoints,
    update,
    reset,
    dispose,
  };
}
