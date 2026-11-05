import * as THREE from 'three';

/**
 * Skid Mark Trail System
 * Renders realistic tire rubber skid marks on the floor texture and track surface
 * when the kart is drifting, braking sharply, or scrubbing curbs.
 */
export function buildSkidMarkTrailSystem() {
  // 1,200 quads = 2,400 triangles = 4,800 vertices in ring buffer
  const maxQuads = 1200;
  const maxVerts = maxQuads * 4;
  const maxIndices = maxQuads * 6;

  const positions = new Float32Array(maxVerts * 3);
  const normals = new Float32Array(maxVerts * 3);
  const uvs = new Float32Array(maxVerts * 2);
  const colors = new Float32Array(maxVerts * 4); // RGBA per vertex
  const indices = new Uint16Array(maxIndices);

  // Pre-generate index buffer for independent quad segments
  for (let q = 0; q < maxQuads; q++) {
    const vOffset = q * 4;
    const iOffset = q * 6;
    indices[iOffset + 0] = vOffset + 0;
    indices[iOffset + 1] = vOffset + 1;
    indices[iOffset + 2] = vOffset + 2;
    indices[iOffset + 3] = vOffset + 0;
    indices[iOffset + 4] = vOffset + 2;
    indices[iOffset + 5] = vOffset + 3;
  }

  // Generate realistic rubber tire tread burn mark texture with longitudinal groove sipes
  const skidCanvas = document.createElement('canvas');
  skidCanvas.width = 128;
  skidCanvas.height = 32;
  const sCtx = skidCanvas.getContext('2d');
  sCtx.clearRect(0, 0, 128, 32);

  // Soft lateral feathered gradient across the tire tread profile
  const tGrad = sCtx.createLinearGradient(0, 0, 0, 32);
  tGrad.addColorStop(0.0, 'rgba(10, 11, 14, 0.0)');
  tGrad.addColorStop(0.18, 'rgba(12, 13, 17, 0.78)');
  tGrad.addColorStop(0.42, 'rgba(10, 11, 14, 0.95)');
  tGrad.addColorStop(0.50, 'rgba(25, 27, 34, 0.35)'); // center tire tread sipe groove
  tGrad.addColorStop(0.58, 'rgba(10, 11, 14, 0.95)');
  tGrad.addColorStop(0.82, 'rgba(12, 13, 17, 0.78)');
  tGrad.addColorStop(1.0, 'rgba(10, 11, 14, 0.0)');
  sCtx.fillStyle = tGrad;
  sCtx.fillRect(0, 0, 128, 32);

  // Subtle longitudinal grain speckle
  for (let i = 0; i < 90; i++) {
    const rx = Math.random() * 128;
    const ry = 4 + Math.random() * 24;
    sCtx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    sCtx.fillRect(rx, ry, 2 + Math.random() * 8, 1);
  }

  const skidTex = new THREE.CanvasTexture(skidCanvas);
  skidTex.wrapS = THREE.RepeatWrapping;
  skidTex.wrapT = THREE.ClampToEdgeWrapping;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));

  // PolygonOffset ensures skid marks cleanly overlay the crowned track without depth z-fighting
  const material = new THREE.MeshBasicMaterial({
    map: skidTex,
    transparent: true,
    vertexColors: true,
    depthTest: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
    side: THREE.DoubleSide,
  });

  const skidMesh = new THREE.Mesh(geometry, material);
  skidMesh.frustumCulled = false;
  skidMesh.name = 'KartSkidMarkTrails';

  // State tracking per wheel
  const WHEEL_TRACKS = [
    { name: 'RearLeft', isRear: true, offset: new THREE.Vector3(-0.0059, 0.00015, -0.0054), lastPos: new THREE.Vector3(), hasLast: false },
    { name: 'RearRight', isRear: true, offset: new THREE.Vector3(0.0059, 0.00015, -0.0054), lastPos: new THREE.Vector3(), hasLast: false },
    { name: 'FrontLeft', isRear: false, offset: new THREE.Vector3(-0.0056, 0.00015, 0.0054), lastPos: new THREE.Vector3(), hasLast: false },
    { name: 'FrontRight', isRear: false, offset: new THREE.Vector3(0.0056, 0.00015, 0.0054), lastPos: new THREE.Vector3(), hasLast: false },
  ];

  let quadPointer = 0;
  let activeQuadCount = 0;
  let fadeThrottleTimer = 0.0;
  const quadAges = new Float32Array(maxQuads);
  const quadInitialAlphas = new Float32Array(maxQuads);

  // Reusable scratch vectors
  const _currTireLocal = new THREE.Vector3();
  const _currTireWorld = new THREE.Vector3();
  const _trackNormal = new THREE.Vector3();
  const _tangent = new THREE.Vector3();
  const _side = new THREE.Vector3();
  const _normOffset = new THREE.Vector3();

  function addQuadSegment(p0, p1, normal, halfWidth, alphaVal) {
    const qIdx = quadPointer % maxQuads;
    quadPointer++;
    if (activeQuadCount < maxQuads) activeQuadCount++;

    // Compute segment direction & perpendicular lateral vector
    _tangent.subVectors(p1, p0);
    const segLen = _tangent.length();
    if (segLen < 1e-5) return;
    _tangent.multiplyScalar(1.0 / segLen);

    _side.crossVectors(_tangent, normal).normalize().multiplyScalar(halfWidth);
    _normOffset.copy(normal).multiplyScalar(0.00028); // 0.28mm elevation above surface

    const vOffset = qIdx * 4;

    // Vertex 0: p0 - side
    positions[(vOffset + 0) * 3 + 0] = p0.x - _side.x + _normOffset.x;
    positions[(vOffset + 0) * 3 + 1] = p0.y - _side.y + _normOffset.y;
    positions[(vOffset + 0) * 3 + 2] = p0.z - _side.z + _normOffset.z;

    // Vertex 1: p0 + side
    positions[(vOffset + 1) * 3 + 0] = p0.x + _side.x + _normOffset.x;
    positions[(vOffset + 1) * 3 + 1] = p0.y + _side.y + _normOffset.y;
    positions[(vOffset + 1) * 3 + 2] = p0.z + _side.z + _normOffset.z;

    // Vertex 2: p1 + side
    positions[(vOffset + 2) * 3 + 0] = p1.x + _side.x + _normOffset.x;
    positions[(vOffset + 2) * 3 + 1] = p1.y + _side.y + _normOffset.y;
    positions[(vOffset + 2) * 3 + 2] = p1.z + _side.z + _normOffset.z;

    // Vertex 3: p1 - side
    positions[(vOffset + 3) * 3 + 0] = p1.x - _side.x + _normOffset.x;
    positions[(vOffset + 3) * 3 + 1] = p1.y - _side.y + _normOffset.y;
    positions[(vOffset + 3) * 3 + 2] = p1.z - _side.z + _normOffset.z;

    for (let i = 0; i < 4; i++) {
      normals[(vOffset + i) * 3 + 0] = normal.x;
      normals[(vOffset + i) * 3 + 1] = normal.y;
      normals[(vOffset + i) * 3 + 2] = normal.z;

      colors[(vOffset + i) * 4 + 0] = 0.08;
      colors[(vOffset + i) * 4 + 1] = 0.09;
      colors[(vOffset + i) * 4 + 2] = 0.11;
      colors[(vOffset + i) * 4 + 3] = alphaVal;
    }

    uvs[(vOffset + 0) * 2 + 0] = 0.0;
    uvs[(vOffset + 0) * 2 + 1] = 0.0;

    uvs[(vOffset + 1) * 2 + 0] = 1.0;
    uvs[(vOffset + 1) * 2 + 1] = 0.0;

    uvs[(vOffset + 2) * 2 + 0] = 1.0;
    uvs[(vOffset + 2) * 2 + 1] = 1.0;

    uvs[(vOffset + 3) * 2 + 0] = 0.0;
    uvs[(vOffset + 3) * 2 + 1] = 1.0;

    quadAges[qIdx] = 0.0;
    quadInitialAlphas[qIdx] = alphaVal;
  }

  function update(dt, state, kartScale, chassisGroup) {
    if (!state || !chassisGroup) return;

    const scale = kartScale || 0.58;
    const speed = Math.abs(state.speed || 0.0);
    const absDrift = Math.abs(state.driftAngle || 0.0);
    const driftThreshold = state.driftThreshold || 0.080;
    const isSteering = Math.abs(state.steerInput || state.steerSmooth || state.turnRight || 0) > 0.08;

    // 1. Drifting condition: tire sliding sideways across roadbed
    const isDrifting =
      (absDrift >= driftThreshold && isSteering && speed > 0.035) ||
      Boolean(state.isDrifting);

    // 2. Sharp braking condition: forward motion with negative throttle / brake applied
    const isHardBraking = speed > 0.025 && (
      (state.turnRight !== undefined && Boolean(state.keys && state.keys.backward)) ||
      (state.brakeActive || false)
    );

    // 3. Curb / barrier scrub
    const isCurbScrub = (state.curbRumble || 0) > 0.40 && speed > 0.045;

    const shouldSkid = isDrifting || isHardBraking || isCurbScrub;

    // Intensity calculation
    let skidAlpha = 0.0;
    if (isDrifting) {
      const dIntensity = THREE.MathUtils.clamp((absDrift - driftThreshold) / 0.10, 0.0, 1.0);
      skidAlpha = THREE.MathUtils.clamp(0.42 + dIntensity * 0.45, 0.40, 0.88);
    } else if (isHardBraking) {
      skidAlpha = 0.72;
    } else if (isCurbScrub) {
      skidAlpha = 0.48;
    }

    _trackNormal.copy(state.normal || new THREE.Vector3(0, 1, 0)).normalize();
    const halfWidth = 0.00065 * (scale / 0.58);
    const minStepDist = 0.0018 * (scale / 0.58); // 1.8mm segment step

    let addedAny = false;

    // Update each wheel
    for (let w = 0; w < WHEEL_TRACKS.length; w++) {
      const wheel = WHEEL_TRACKS[w];

      // Front wheels only lay skid marks during sharp hard braking
      if (!wheel.isRear && !isHardBraking) {
        wheel.hasLast = false;
        continue;
      }

      // Compute current world position of the tire ground contact patch
      _currTireLocal.copy(wheel.offset).multiplyScalar(scale);
      chassisGroup.localToWorld(_currTireWorld.copy(_currTireLocal));

      if (shouldSkid && speed > 0.015) {
        if (wheel.hasLast) {
          const d = wheel.lastPos.distanceTo(_currTireWorld);
          if (d >= minStepDist && d < 0.06) {
            addQuadSegment(wheel.lastPos, _currTireWorld, _trackNormal, halfWidth, skidAlpha);
            wheel.lastPos.copy(_currTireWorld);
            addedAny = true;
          }
        } else {
          wheel.lastPos.copy(_currTireWorld);
          wheel.hasLast = true;
        }
      } else {
        wheel.hasLast = false;
      }
    }

    // Step age-based fade out of existing skid marks (~18 seconds lifetime, throttled to 12Hz)
    let needsColorUpdate = addedAny;
    const fadeRate = 1.0 / 18.0;

    fadeThrottleTimer += dt;
    if (addedAny || (activeQuadCount > 0 && fadeThrottleTimer >= 0.08)) {
      fadeThrottleTimer = 0.0;
      for (let q = 0; q < activeQuadCount; q++) {
        quadAges[q] += dt;
        const progress = quadAges[q] * fadeRate;
        const vOffset = q * 4;

        if (progress >= 1.0) {
          if (colors[vOffset * 4 + 3] > 0.0) {
            for (let i = 0; i < 4; i++) {
              colors[(vOffset + i) * 4 + 3] = 0.0;
            }
            needsColorUpdate = true;
          }
        } else {
          const curA = Math.max(0.0, quadInitialAlphas[q] * (1.0 - progress));
          if (Math.abs(colors[vOffset * 4 + 3] - curA) > 0.02) {
            for (let i = 0; i < 4; i++) {
              colors[(vOffset + i) * 4 + 3] = curA;
            }
            needsColorUpdate = true;
          }
        }
      }
    } else {
      for (let q = 0; q < activeQuadCount; q++) {
        quadAges[q] += dt;
      }
    }

    if (addedAny) {
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.normal.needsUpdate = true;
      geometry.attributes.uv.needsUpdate = true;
    }
    if (needsColorUpdate) {
      geometry.attributes.color.needsUpdate = true;
    }
  }

  function clear() {
    for (let w = 0; w < WHEEL_TRACKS.length; w++) {
      WHEEL_TRACKS[w].hasLast = false;
    }
    for (let i = 0; i < maxVerts * 4; i += 4) {
      colors[i + 3] = 0.0;
    }
    for (let i = 0; i < maxVerts * 3; i += 3) {
      positions[i + 1] = -100;
    }
    quadPointer = 0;
    activeQuadCount = 0;
    quadAges.fill(999);
    quadInitialAlphas.fill(0);
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
  }

  function dispose() {
    geometry.dispose();
    material.dispose();
    skidTex.dispose();
  }

  return {
    skidMesh,
    update,
    clear,
    reset: clear,
    dispose,
  };
}
