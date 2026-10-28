/**
 * Lockia - 3D Smart Phone Locker Visualizer (Three.js)
 * Implements 5-compartment CUBE-SHAPED smart phone locker with realistic materials:
 * - Procedural brushed metal, varnished wood grain, and friendly matte plastic textures.
 * - Door frames ALWAYS in metallic black for all finishes.
 * - Solid shelf dividers from back to front separating all compartments and doors.
 * - Full-depth interior matching the selected finish.
 * - Flush hermetic door closure, mechanical hinges, recessed LEDs, and bases.
 */

(function () {
  // =========================================================================
  // PROCEDURAL TEXTURE GENERATION (Offline, Canvas-based, No External Assets)
  // =========================================================================

  // 1. Brushed Metal Texture (Micro-grooves / Anisotropic Satin Sheen)
  function createBrushedMetalTexture(baseColorHex, isDark) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = baseColorHex;
    ctx.fillRect(0, 0, 512, 512);

    // Fine linear brushed streaks
    for (let i = 0; i < 3500; i++) {
      const y = Math.random() * 512;
      const x = Math.random() * 420;
      const len = 35 + Math.random() * 95;
      const alpha = (isDark ? 0.035 : 0.07) + Math.random() * 0.06;
      const val = Math.random() > 0.5 ? 255 : 0;
      ctx.strokeStyle = `rgba(${val},${val},${val},${alpha})`;
      ctx.lineWidth = 1 + Math.random() * 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  // 2. Realistic Wood Grain Texture with Wavy Rings (Natural Oak & Mahogany)
  function createWoodTexture(isCaoba) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const baseColor = isCaoba ? '#562117' : '#cba073';
    const veinDark = isCaoba ? '#3e130c' : '#a37446';
    const veinLight = isCaoba ? '#6b2d20' : '#d8ae80';

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 512);

    // Wavy growth rings & grain striations
    for (let y = 0; y < 512; y += 2) {
      const wave = Math.sin(y * 0.032) * 9 + Math.cos(y * 0.075) * 5;
      const alpha = 0.09 + Math.sin(y * 0.11) * 0.07;
      ctx.fillStyle = y % 4 === 0 ? veinDark : veinLight;
      ctx.globalAlpha = Math.max(0.04, Math.min(0.26, alpha));
      ctx.fillRect(0, y + wave, 512, 2);
    }

    // Organic longitudinal wood fibers
    ctx.globalAlpha = 0.09;
    for (let i = 0; i < 1800; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      ctx.fillStyle = isCaoba ? '#260c07' : '#7d522a';
      ctx.fillRect(x, y, 4 + Math.random() * 28, 1);
    }
    ctx.globalAlpha = 1.0;

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1.5, 3);
    return texture;
  }

  // 3. Molded Plastic Stipple Texture (Friendly, Non-Chilly Matte Polymer)
  function createPlasticTexture(baseColorHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = baseColorHex;
    ctx.fillRect(0, 0, 256, 256);

    const imgData = ctx.getImageData(0, 0, 256, 256);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 12;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }

  // Pre-cached procedural textures
  const TEXTURE_CACHE = {
    metalDark: createBrushedMetalTexture('#1e2229', true),
    metalGray: createBrushedMetalTexture('#94a3b8', false),
    woodNatural: createWoodTexture(false),
    woodCaoba: createWoodTexture(true),
    plasticBlue: createPlasticTexture('#3577cc'),
  };

  // PBR finish configurations:
  // - Metálicos: Textura metal cepillado satinado
  // - Maderas: Textura madera + ligero barnizado (clearcoat gloss)
  // - Azul: Plástico mate amigable para jóvenes
  const FINISH_PROPERTIES = {
    // 1. Negro metálico (Default)
    'negro metálico': {
      color: 0x1e2229,
      type: 'metal',
      metalness: 0.75,
      roughness: 0.40,
      clearcoat: 0.0,
      map: TEXTURE_CACHE.metalDark,
    },
    '#1e2229': {
      color: 0x1e2229,
      type: 'metal',
      metalness: 0.75,
      roughness: 0.40,
      clearcoat: 0.0,
      map: TEXTURE_CACHE.metalDark,
    },
    0x1e2229: {
      color: 0x1e2229,
      type: 'metal',
      metalness: 0.75,
      roughness: 0.40,
      clearcoat: 0.0,
      map: TEXTURE_CACHE.metalDark,
    },

    // 2. Acabado en madera natural (no oscura) - Con barnizado ligero
    'madera natural': {
      color: 0xc89666,
      type: 'wood',
      metalness: 0.02,
      roughness: 0.30,
      clearcoat: 0.65,
      clearcoatRoughness: 0.16,
      map: TEXTURE_CACHE.woodNatural,
    },
    '#c89666': {
      color: 0xc89666,
      type: 'wood',
      metalness: 0.02,
      roughness: 0.30,
      clearcoat: 0.65,
      clearcoatRoughness: 0.16,
      map: TEXTURE_CACHE.woodNatural,
    },
    0xc89666: {
      color: 0xc89666,
      type: 'wood',
      metalness: 0.02,
      roughness: 0.30,
      clearcoat: 0.65,
      clearcoatRoughness: 0.16,
      map: TEXTURE_CACHE.woodNatural,
    },

    // 3. Acabado en madera de caoba - Con barnizado profundo
    'madera de caoba': {
      color: 0x5c2419,
      type: 'wood',
      metalness: 0.02,
      roughness: 0.28,
      clearcoat: 0.70,
      clearcoatRoughness: 0.14,
      map: TEXTURE_CACHE.woodCaoba,
    },
    '#5c2419': {
      color: 0x5c2419,
      type: 'wood',
      metalness: 0.02,
      roughness: 0.28,
      clearcoat: 0.70,
      clearcoatRoughness: 0.14,
      map: TEXTURE_CACHE.woodCaoba,
    },
    0x5c2419: {
      color: 0x5c2419,
      type: 'wood',
      metalness: 0.02,
      roughness: 0.28,
      clearcoat: 0.70,
      clearcoatRoughness: 0.14,
      map: TEXTURE_CACHE.woodCaoba,
    },

    // 4. Azul (Plástico mate amigable para jóvenes, menos chillón)
    'azul': {
      color: 0x3577cc,
      type: 'plastic',
      metalness: 0.02,
      roughness: 0.46,
      clearcoat: 0.0,
      map: TEXTURE_CACHE.plasticBlue,
    },
    '#3577cc': {
      color: 0x3577cc,
      type: 'plastic',
      metalness: 0.02,
      roughness: 0.46,
      clearcoat: 0.0,
      map: TEXTURE_CACHE.plasticBlue,
    },
    '#2563eb': {
      color: 0x3577cc,
      type: 'plastic',
      metalness: 0.02,
      roughness: 0.46,
      clearcoat: 0.0,
      map: TEXTURE_CACHE.plasticBlue,
    },
    0x3577cc: {
      color: 0x3577cc,
      type: 'plastic',
      metalness: 0.02,
      roughness: 0.46,
      clearcoat: 0.0,
      map: TEXTURE_CACHE.plasticBlue,
    },
    0x2563eb: {
      color: 0x3577cc,
      type: 'plastic',
      metalness: 0.02,
      roughness: 0.46,
      clearcoat: 0.0,
      map: TEXTURE_CACHE.plasticBlue,
    },

    // 5. Gris metálico (Metal cepillado satinado)
    'gris metálico': {
      color: 0x94a3b8,
      type: 'metal',
      metalness: 0.78,
      roughness: 0.38,
      clearcoat: 0.0,
      map: TEXTURE_CACHE.metalGray,
    },
    '#94a3b8': {
      color: 0x94a3b8,
      type: 'metal',
      metalness: 0.78,
      roughness: 0.38,
      clearcoat: 0.0,
      map: TEXTURE_CACHE.metalGray,
    },
    0x94a3b8: {
      color: 0x94a3b8,
      type: 'metal',
      metalness: 0.78,
      roughness: 0.38,
      clearcoat: 0.0,
      map: TEXTURE_CACHE.metalGray,
    },
  };

  function getFinishConfig(key) {
    if (typeof key === 'string') {
      const lower = key.toLowerCase();
      if (FINISH_PROPERTIES[lower]) return FINISH_PROPERTIES[lower];
    }
    const num = typeof key === 'number' ? key : parseInt(String(key).replace('#', '0x'), 16);
    return FINISH_PROPERTIES[num] || FINISH_PROPERTIES['negro metálico'];
  }

  // =========================================================================
  // MODEL BUILDER: 5-COMPARTMENT CUBE LOCKER
  // =========================================================================
  function buildLockerModel(options) {
    const initialKey = (options && options.finishName) || (options && options.color) || 'negro metálico';
    const currentFinish = getFinishConfig(initialKey);

    const rootGroup = new THREE.Group();

    // Cube-shaped proportions: Width ~ 1.92, Depth ~ 1.85, Height ~ 1.95 (nearly 1:1:1)
    const cabinetWidth = 1.92;
    const cabinetDepth = 1.85;
    const cabinetHeight = 1.95;
    const numCompartments = 5;

    // Dimensions for walls & opening:
    const leftWallThick = 0.10;
    const rightPillarWidth = 0.28; // Thicker wall where LEDs & latch are mounted
    const leftEdgeX = -cabinetWidth / 2 + leftWallThick;
    const rightEdgeX = cabinetWidth / 2 - rightPillarWidth;
    const openingWidth = rightEdgeX - leftEdgeX; // ~1.54
    const openingCenterX = (leftEdgeX + rightEdgeX) / 2; // ~ -0.09

    // Vertical spacing: 5 compartments with solid dividers reaching from back to front
    const shelfDividerThick = 0.036; // Solid partition shelf thickness (~3.6 cm)
    const compInteriorH = 0.325; // Height of each individual compartment opening

    // Primary Body Material (Exterior + Interior Cavities + Shelf Dividers)
    // Uses MeshPhysicalMaterial so clearcoat varnish works for wood finishes
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: currentFinish.color,
      metalness: currentFinish.metalness,
      roughness: currentFinish.roughness,
      clearcoat: currentFinish.clearcoat,
      clearcoatRoughness: currentFinish.clearcoatRoughness || 0.15,
      map: currentFinish.map,
    });

    // CRITICAL REQUIREMENT:
    // "las partes que enmarcan las compuertas tienen que ser metálicas de color negro metálico para todos los colores."
    // This material stays permanently metallic black across ALL finish changes!
    const doorFrameMat = new THREE.MeshStandardMaterial({
      color: 0x1e2229,
      metalness: 0.80,
      roughness: 0.36,
      map: TEXTURE_CACHE.metalDark,
    });

    // Realistic Polycarbonate Glass Material: tempered, transparent with subtle realistic sheen
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xbde6f5,
      transparent: true,
      opacity: 0.36,
      roughness: 0.22,
      metalness: 0.08,
      transmission: 0.72,
      reflectivity: 0.32,
    });

    // Mechanical Hinge Metal (gunmetal / satin slate steel)
    const hingeMetalMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.75,
      roughness: 0.32,
    });

    // LED Socket Bezel Material (Dark metallic ring)
    const socketBezelMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.85,
      roughness: 0.25,
    });

    // Smartphone Compartment Base Tray Pad
    const basePlateMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.40,
      roughness: 0.65,
    });

    const phoneBodyMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.85,
      roughness: 0.2,
    });

    const phoneScreenMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
    });

    // Red and Green Status LEDs
    const ledGreenMat = new THREE.MeshBasicMaterial({ color: 0x28c745 });
    const ledRedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    // Perimeter Sealing Gasket Material (Hermetic seal)
    const gasketMat = new THREE.MeshStandardMaterial({
      color: 0x0a0d14,
      roughness: 0.9,
      metalness: 0.05,
    });

    // Updatable materials list for setColor (doorFrameMat is NOT in this list!)
    const colorUpdatableMaterials = [bodyMaterial];

    // =========================================================================
    // OUTER CABINET HOUSING (Body Material: Selected Finish)
    // =========================================================================
    // Back wall (Full depth interior)
    const backGeo = new THREE.BoxGeometry(cabinetWidth, cabinetHeight, 0.08);
    const backMesh = new THREE.Mesh(backGeo, bodyMaterial);
    backMesh.position.set(0, 0, -cabinetDepth / 2 + 0.04);
    rootGroup.add(backMesh);

    // Left wall
    const leftGeo = new THREE.BoxGeometry(leftWallThick, cabinetHeight, cabinetDepth);
    const leftMesh = new THREE.Mesh(leftGeo, bodyMaterial);
    leftMesh.position.set(-cabinetWidth / 2 + leftWallThick / 2, 0, 0);
    rootGroup.add(leftMesh);

    // Right wall
    const rightGeo = new THREE.BoxGeometry(0.10, cabinetHeight, cabinetDepth);
    const rightMesh = new THREE.Mesh(rightGeo, bodyMaterial);
    rightMesh.position.set(cabinetWidth / 2 - 0.05, 0, 0);
    rootGroup.add(rightMesh);

    // Thick Right Front Pillar (where LEDs and latch receiver are recessed)
    const rightPillarGeo = new THREE.BoxGeometry(rightPillarWidth, cabinetHeight, 0.09);
    const rightPillarMesh = new THREE.Mesh(rightPillarGeo, bodyMaterial);
    rightPillarMesh.position.set(cabinetWidth / 2 - rightPillarWidth / 2, 0, cabinetDepth / 2 - 0.045);
    rootGroup.add(rightPillarMesh);

    // Top cap (prominent top lid of the cube)
    const capGeo = new THREE.BoxGeometry(cabinetWidth + 0.06, 0.1, cabinetDepth + 0.06);
    const topCap = new THREE.Mesh(capGeo, bodyMaterial);
    topCap.position.set(0, cabinetHeight / 2 + 0.05, 0);
    rootGroup.add(topCap);

    // Top Brand Accent Strip on Lid
    const lidAccentGeo = new THREE.BoxGeometry(cabinetWidth - 0.3, 0.015, cabinetDepth - 0.3);
    const lidAccentMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.5, roughness: 0.4 });
    const lidAccent = new THREE.Mesh(lidAccentGeo, lidAccentMat);
    lidAccent.position.set(0, cabinetHeight / 2 + 0.11, 0);
    rootGroup.add(lidAccent);

    // Bottom base pedestal
    const bottomCap = new THREE.Mesh(capGeo, bodyMaterial);
    bottomCap.position.set(0, -cabinetHeight / 2 - 0.05, 0);
    rootGroup.add(bottomCap);

    // =========================================================================
    // 5 COMPARTMENTS & FULL-DEPTH SOLID SHELF DIVIDERS
    // "separaciones entre los huecos de cada móvil, del color que toque según el diseño,
    // y que estas separaciones lleguen desde el fondo de la taquilla hasta las compuertas,
    // separando estas también, y haz por lo tanto que las compuertas cierren herméticamente los huecos.
    // También que el interior de la caja sea de ese mismo color."
    // =========================================================================
    const doorHinges = [];
    const totalOccupiedH = numCompartments * compInteriorH + (numCompartments - 1) * shelfDividerThick;
    const startCompY = totalOccupiedH * 0.5 - compInteriorH * 0.5;

    // Hinge Pivot Coordinates on the Left Edge
    const hingeX = leftEdgeX + 0.02;
    const hingeZ = cabinetDepth / 2 + 0.002;
    const doorWidth = rightEdgeX - hingeX + 0.015; // ~1.54
    const doorHeight = compInteriorH - 0.008; // Snug flush fit between dividers

    // Full-depth shelf geometry: extends from the back wall to the front face!
    const shelfDividerDepth = cabinetDepth - 0.08;
    const shelfDividerZ = 0.0; // Centered from -cabinetDepth/2 + 0.04 to +cabinetDepth/2 - 0.04

    // 1. Solid Shelf Dividers between compartments (and top/bottom boundary shelves)
    // Total dividers = 6 (roof shelf, 4 intermediate shelf dividers, and floor shelf)
    for (let s = 0; s <= numCompartments; s++) {
      const shelfY = totalOccupiedH * 0.5 - s * (compInteriorH + shelfDividerThick) + (s === 0 ? shelfDividerThick * 0.5 : -shelfDividerThick * 0.5);
      const shelfGeo = new THREE.BoxGeometry(openingWidth + 0.02, shelfDividerThick, shelfDividerDepth);
      const shelfMesh = new THREE.Mesh(shelfGeo, bodyMaterial);
      shelfMesh.position.set(openingCenterX, shelfY, shelfDividerZ);
      rootGroup.add(shelfMesh);

      // Front exposed face of the divider shelf, visibly separating each door vertically
      const frontBevelGeo = new THREE.BoxGeometry(openingWidth + 0.02, shelfDividerThick, 0.03);
      const frontBevelMesh = new THREE.Mesh(frontBevelGeo, bodyMaterial);
      frontBevelMesh.position.set(openingCenterX, shelfY, cabinetDepth / 2 - 0.015);
      rootGroup.add(frontBevelMesh);
    }

    // 2. Individual Compartment Internals, Bases, Smartphones, and Flush Doors
    for (let i = 0; i < numCompartments; i++) {
      const y = startCompY - i * (compInteriorH + shelfDividerThick);

      // Interior Cavity Box: MATCHES CHOSEN DESIGN FINISH COLOR & TEXTURE
      const cavityGeo = new THREE.BoxGeometry(openingWidth - 0.02, compInteriorH - 0.01, shelfDividerDepth - 0.04);
      const cavityMesh = new THREE.Mesh(cavityGeo, bodyMaterial);
      cavityMesh.position.set(openingCenterX, y, shelfDividerZ);
      rootGroup.add(cavityMesh);

      // Base Tray of each compartment
      const trayGeo = new THREE.BoxGeometry(openingWidth - 0.04, 0.02, shelfDividerDepth - 0.12);
      const trayMesh = new THREE.Mesh(trayGeo, basePlateMat);
      trayMesh.position.set(openingCenterX, y - compInteriorH / 2 + 0.02, shelfDividerZ);
      rootGroup.add(trayMesh);

      // Non-slip smartphone resting dock inside the bay
      const dockPadGeo = new THREE.BoxGeometry(0.72, 0.015, 1.05);
      const dockPadMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.85, metalness: 0.1 });
      const dockPad = new THREE.Mesh(dockPadGeo, dockPadMat);
      dockPad.position.set(openingCenterX, y - compInteriorH / 2 + 0.032, 0.05);
      rootGroup.add(dockPad);

      // Smartphone resting in dock
      const phoneGroup = new THREE.Group();
      const pBodyGeo = new THREE.BoxGeometry(0.55, 0.03, 0.85);
      const pBody = new THREE.Mesh(pBodyGeo, phoneBodyMat);
      const pScreenGeo = new THREE.PlaneGeometry(0.48, 0.78);
      const pScreen = new THREE.Mesh(pScreenGeo, phoneScreenMat);
      pScreen.rotation.x = -Math.PI / 2;
      pScreen.position.y = 0.016;
      phoneGroup.add(pBody);
      phoneGroup.add(pScreen);

      phoneGroup.position.set(openingCenterX, y - 0.06, 0.06);
      phoneGroup.rotation.x = 0.10;
      phoneGroup.rotation.y = -0.12;
      rootGroup.add(phoneGroup);

      // Recessed Status LED on the right pillar
      const ledSocketGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.016, 20);
      const ledSocketMesh = new THREE.Mesh(ledSocketGeo, socketBezelMat);
      ledSocketMesh.rotation.x = Math.PI / 2;
      ledSocketMesh.position.set(cabinetWidth / 2 - rightPillarWidth / 2, y, cabinetDepth / 2 - 0.002);
      rootGroup.add(ledSocketMesh);

      const ledGeo = new THREE.SphereGeometry(0.020, 16, 16);
      const ledMesh = new THREE.Mesh(ledGeo, i % 2 === 0 ? ledRedMat : ledGreenMat);
      ledMesh.position.set(cabinetWidth / 2 - rightPillarWidth / 2, y, cabinetDepth / 2 + 0.004);
      rootGroup.add(ledMesh);

      // Mechanical Hinge Brackets attached to the left frame
      const bracketGeo = new THREE.BoxGeometry(0.035, 0.045, 0.035);
      const topBracket = new THREE.Mesh(bracketGeo, hingeMetalMat);
      topBracket.position.set(hingeX - 0.018, y + doorHeight * 0.34, hingeZ - 0.012);
      const btmBracket = new THREE.Mesh(bracketGeo, hingeMetalMat);
      btmBracket.position.set(hingeX - 0.018, y - doorHeight * 0.34, hingeZ - 0.012);
      rootGroup.add(topBracket);
      rootGroup.add(btmBracket);

      // Hermetic Perimeter Sealing Gasket behind the door opening
      const gasketW = doorWidth + 0.02;
      const gasketH = doorHeight + 0.02;
      const gasketGeo = new THREE.BoxGeometry(gasketW, gasketH, 0.008);
      const gasketMesh = new THREE.Mesh(gasketGeo, gasketMat);
      gasketMesh.position.set(openingCenterX, y, cabinetDepth / 2 - 0.012);
      rootGroup.add(gasketMesh);

      // =====================================================================
      // DOOR ASSEMBLY (Pivot on Hinge, Flush Hermetic Fit, METALLIC BLACK FRAME)
      // =====================================================================
      const doorHinge = new THREE.Group();
      doorHinge.position.set(hingeX, y, hingeZ);

      // Hinge Pin Barrel on Door
      const hingeBarrelGeo = new THREE.CylinderGeometry(0.015, 0.015, doorHeight * 0.88, 16);
      const hingeBarrel = new THREE.Mesh(hingeBarrelGeo, hingeMetalMat);
      hingeBarrel.position.set(0, 0, 0);
      doorHinge.add(hingeBarrel);

      // Transparent Polycarbonate Glass Pane
      const paneGeo = new THREE.BoxGeometry(doorWidth - 0.05, doorHeight - 0.04, 0.018);
      const paneMesh = new THREE.Mesh(paneGeo, glassMaterial);
      paneMesh.position.set(doorWidth / 2, 0, 0);
      doorHinge.add(paneMesh);

      // METALLIC BLACK OUTER BORDER FRAME (stays metallic black for all finishes!)
      const frameThick = 0.024;
      // Top & Bottom horizontal frame bars
      const barHGeo = new THREE.BoxGeometry(doorWidth, 0.030, frameThick);
      const topBar = new THREE.Mesh(barHGeo, doorFrameMat);
      topBar.position.set(doorWidth / 2, doorHeight / 2 - 0.015, 0);
      const btmBar = new THREE.Mesh(barHGeo, doorFrameMat);
      btmBar.position.set(doorWidth / 2, -doorHeight / 2 + 0.015, 0);
      doorHinge.add(topBar);
      doorHinge.add(btmBar);

      // Left vertical frame bar
      const barVLeftGeo = new THREE.BoxGeometry(0.032, doorHeight, frameThick);
      const leftBar = new THREE.Mesh(barVLeftGeo, doorFrameMat);
      leftBar.position.set(0.016, 0, 0);
      doorHinge.add(leftBar);

      // Right vertical frame bar (fits flush against right pillar)
      const barVRightGeo = new THREE.BoxGeometry(0.036, doorHeight, frameThick);
      const rightBar = new THREE.Mesh(barVRightGeo, doorFrameMat);
      rightBar.position.set(doorWidth - 0.018, 0, 0);
      doorHinge.add(rightBar);

      // Electronic latch / handle on right edge
      const lockGeo = new THREE.BoxGeometry(0.042, 0.075, 0.030);
      const lockMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.2 });
      const lockMesh = new THREE.Mesh(lockGeo, lockMat);
      lockMesh.position.set(doorWidth - 0.035, 0, 0.012);
      doorHinge.add(lockMesh);

      rootGroup.add(doorHinge);
      doorHinges.push(doorHinge);
    }

    return {
      group: rootGroup,
      doorHinges: doorHinges,
      setColor: function (hexColor, finishName) {
        const finish = getFinishConfig(finishName || hexColor);
        colorUpdatableMaterials.forEach((mat) => {
          mat.color.set(finish.color);
          mat.metalness = finish.metalness;
          mat.roughness = finish.roughness;
          mat.clearcoat = finish.clearcoat || 0.0;
          mat.clearcoatRoughness = finish.clearcoatRoughness || 0.15;
          mat.map = finish.map;
          mat.needsUpdate = true;
        });
        // Note: doorFrameMat is intentionally untouched, remaining metallic black!
      },
    };
  }

  // -------------------------------------------------------------------------
  // Page 1: Hero / Section 2 Auto-Spinning Cube Locker ("Nuestro producto")
  // Default: Negro Metálico (0x1e2229)
  // Camera angle: lowered angle while maintaining an elevated 3/4 top view
  // -------------------------------------------------------------------------
  window.initLocker3DHero = function (containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 450;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);

    // Lowered elevation angle while maintaining top lid view (Y=2.1, Z=4.8)
    camera.position.set(0, 2.1, 4.8);
    camera.lookAt(0, -0.02, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio Lighting (soft, diffuse, non-glaring)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight1.position.set(4, 7, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.35);
    dirLight2.position.set(-4, -2, -3);
    scene.add(dirLight2);

    // Default: Negro metálico
    const modelObj = buildLockerModel({ color: 0x1e2229, finishName: 'negro metálico' });
    const lockerGroup = modelObj.group;
    scene.add(lockerGroup);

    // Animation Cycle Timing:
    // 1 full turn (360 deg) = 8.0s; 3 full turns = 24.0s total cycle
    const turnDuration = 8.0;
    const cycleDuration = turnDuration * 3;
    let clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      const cycleTime = elapsed % cycleDuration;
      const currentTurn = Math.floor(cycleTime / turnDuration);
      const turnTime = cycleTime % turnDuration;

      // Continuous rotation on vertical axis
      lockerGroup.rotation.y += (Math.PI * 2 / turnDuration) * delta;

      // Door Animation logic:
      // Turn 1 (0 <= cycleTime < 8.0s): Opens progressively outward
      // Turn 2 (8.0s <= cycleTime < 16.0s): Begins closing, fully flush at end of turn 2
      // Turn 3 (16.0s <= cycleTime < 24.0s): Doors remain flush closed
      let doorAngle = 0;
      const maxDoorAngle = 1.35; // ~77 degrees open outward

      if (currentTurn === 0) {
        const progress = Math.min(1.0, turnTime / turnDuration);
        const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
        doorAngle = ease * maxDoorAngle;
      } else if (currentTurn === 1) {
        const progress = Math.min(1.0, turnTime / turnDuration);
        const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
        doorAngle = maxDoorAngle * (1.0 - ease);
      } else {
        doorAngle = 0;
      }

      // Apply outward rotation (negative angle swings toward +Z out of the locker)
      modelObj.doorHinges.forEach((hinge) => {
        hinge.rotation.y = -Math.max(0, doorAngle);
      });

      renderer.render(scene, camera);
    }

    animate();

    // Responsive resize handler
    window.addEventListener('resize', () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
  };

  // -------------------------------------------------------------------------
  // Page 3: Taquillas Interactive Cube Model
  // Default: Negro metálico (0x1e2229)
  // Realistic materials, doors closed, wheel zoom, mouse drag rotate, finish updates
  // -------------------------------------------------------------------------
  window.initLocker3DConfigurator = function (containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);

    // Initial position: elevated angle to view top of cube
    let cameraDistance = 5.2;
    const minDistance = 2.8;
    const maxDistance = 9.0;
    let rotX = 0.36; // Lowered balanced angle showing top lid
    let rotY = -0.42; // 3/4 front view

    function updateCameraPos() {
      camera.position.x = cameraDistance * Math.sin(rotY) * Math.cos(rotX);
      camera.position.y = cameraDistance * Math.sin(rotX);
      camera.position.z = cameraDistance * Math.cos(rotY) * Math.cos(rotX);
      camera.lookAt(0, -0.05, 0);
    }
    updateCameraPos();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Soft diffuse studio lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight1.position.set(5, 8, 6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.35);
    dirLight2.position.set(-5, -2, -4);
    scene.add(dirLight2);

    // Default: Negro metálico
    const modelObj = buildLockerModel({ interactive: true, color: 0x1e2229, finishName: 'negro metálico' });
    scene.add(modelObj.group);

    // Mouse drag interaction
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };

    const domElement = renderer.domElement;

    domElement.addEventListener('mousedown', (e) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
      domElement.style.cursor = 'grabbing';
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
      domElement.style.cursor = 'grab';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;
      prevMousePos = { x: e.clientX, y: e.clientY };

      rotY -= deltaX * 0.008;
      rotX += deltaY * 0.008;
      rotX = Math.max(-0.2, Math.min(1.2, rotX));

      updateCameraPos();
    });

    // Mouse wheel zoom
    domElement.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        cameraDistance += e.deltaY * 0.005;
        cameraDistance = Math.max(minDistance, Math.min(maxDistance, cameraDistance));
        updateCameraPos();
      },
      { passive: false }
    );

    // Touch support for mobile devices
    let prevTouchPos = { x: 0, y: 0 };
    domElement.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevTouchPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    });

    window.addEventListener('touchend', () => {
      isDragging = false;
    });

    window.addEventListener('touchmove', (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevTouchPos.x;
      const deltaY = e.touches[0].clientY - prevTouchPos.y;
      prevTouchPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      rotY -= deltaX * 0.01;
      rotX += deltaY * 0.01;
      rotX = Math.max(-0.2, Math.min(1.2, rotX));
      updateCameraPos();
    });

    domElement.style.cursor = 'grab';

    function renderLoop() {
      requestAnimationFrame(renderLoop);
      renderer.render(scene, camera);
    }
    renderLoop();

    // Resize handler
    window.addEventListener('resize', () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });

    return {
      setColor: function (hexColor, finishName) {
        modelObj.setColor(hexColor, finishName);
      },
    };
  };
})();
