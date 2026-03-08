// sprites/sprite-gen.js — Programmatic pixel art generator

const SpriteGen = (() => {
  const TILE = 16;
  const cache = {};

  function createCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  function drawPixel(ctx, x, y, color, scale) {
    scale = scale || 1;
    ctx.fillStyle = color;
    ctx.fillRect(x * scale, y * scale, scale, scale);
  }

  function drawRect(ctx, x, y, w, h, color, scale) {
    scale = scale || 1;
    ctx.fillStyle = color;
    ctx.fillRect(x * scale, y * scale, w * scale, h * scale);
  }

  // ========== TILE SPRITES ==========

  function generateGrass(seed) {
    const c = createCanvas(TILE, TILE);
    const ctx = c.getContext('2d');
    const rng = Utils.mulberry32(seed || 101);
    ctx.fillStyle = '#3a7d32';
    ctx.fillRect(0, 0, TILE, TILE);
    // Random grass blades
    const greens = ['#4a8d42', '#2d6d25', '#5a9d52', '#3a7d32'];
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = greens[Math.floor(rng() * greens.length)];
      const x = Math.floor(rng() * TILE);
      const y = Math.floor(rng() * TILE);
      ctx.fillRect(x, y, 1, 1);
    }
    return c;
  }

  function generateGrassVariant(seed) {
    const c = createCanvas(TILE, TILE);
    const ctx = c.getContext('2d');
    const rng = Utils.mulberry32(seed || 102);
    ctx.fillStyle = '#458535';
    ctx.fillRect(0, 0, TILE, TILE);
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = rng() > 0.5 ? '#3a7530' : '#55a548';
      ctx.fillRect(Math.floor(rng() * TILE), Math.floor(rng() * TILE), 1, 2);
    }
    // Small flowers
    if (seed % 3 === 0) {
      ctx.fillStyle = '#ff6'; ctx.fillRect(3, 4, 1, 1);
      ctx.fillStyle = '#f66'; ctx.fillRect(11, 9, 1, 1);
    }
    return c;
  }

  function generateDirt(seed) {
    const c = createCanvas(TILE, TILE);
    const ctx = c.getContext('2d');
    const rng = Utils.mulberry32(seed || 201);
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(0, 0, TILE, TILE);
    const browns = ['#7a5c10', '#9a7520', '#6a4e0e', '#8B6914'];
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = browns[Math.floor(rng() * browns.length)];
      ctx.fillRect(Math.floor(rng() * TILE), Math.floor(rng() * TILE), 1, 1);
    }
    return c;
  }

  function generatePath(seed) {
    const c = createCanvas(TILE, TILE);
    const ctx = c.getContext('2d');
    const rng = Utils.mulberry32(seed || 202);
    ctx.fillStyle = '#c4a55a';
    ctx.fillRect(0, 0, TILE, TILE);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = rng() > 0.5 ? '#b8985a' : '#d0b268';
      ctx.fillRect(Math.floor(rng() * TILE), Math.floor(rng() * TILE), 1, 1);
    }
    return c;
  }

  function generateWater(frame) {
    const c = createCanvas(TILE, TILE);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#2255aa';
    ctx.fillRect(0, 0, TILE, TILE);
    // Animated wave highlights
    const offset = (frame || 0) % 4;
    ctx.fillStyle = 'rgba(100,180,255,0.4)';
    for (let y = 0; y < TILE; y += 4) {
      const x = ((y + offset * 2) % TILE);
      ctx.fillRect(x, y, 3, 1);
    }
    ctx.fillStyle = 'rgba(150,210,255,0.3)';
    for (let y = 2; y < TILE; y += 4) {
      const x = ((y + offset * 2 + 6) % TILE);
      ctx.fillRect(x, y, 2, 1);
    }
    return c;
  }

  function generateStone() {
    const c = createCanvas(TILE, TILE);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#666';
    ctx.fillRect(0, 0, TILE, TILE);
    // Stone texture
    ctx.fillStyle = '#777'; ctx.fillRect(0, 0, 7, 7);
    ctx.fillStyle = '#595959'; ctx.fillRect(8, 0, 8, 8);
    ctx.fillStyle = '#6a6a6a'; ctx.fillRect(0, 8, 8, 8);
    ctx.fillStyle = '#606060'; ctx.fillRect(8, 8, 8, 8);
    // Grout lines
    ctx.fillStyle = '#444';
    ctx.fillRect(7, 0, 1, TILE);
    ctx.fillRect(0, 7, TILE, 1);
    return c;
  }

  function generateWall() {
    const c = createCanvas(TILE, TILE);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#555';
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(0, 0, 7, 5);
    ctx.fillRect(8, 0, 8, 5);
    ctx.fillRect(0, 6, 5, 5);
    ctx.fillRect(6, 6, 6, 5);
    ctx.fillRect(13, 6, 3, 5);
    ctx.fillRect(0, 12, 7, 4);
    ctx.fillRect(8, 12, 8, 4);
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 5, TILE, 1);
    ctx.fillRect(0, 11, TILE, 1);
    ctx.fillRect(7, 0, 1, 6);
    ctx.fillRect(5, 6, 1, 5);
    ctx.fillRect(12, 6, 1, 5);
    ctx.fillRect(7, 12, 1, 4);
    return c;
  }

  function generateSand(seed) {
    const c = createCanvas(TILE, TILE);
    const ctx = c.getContext('2d');
    const rng = Utils.mulberry32(seed || 301);
    ctx.fillStyle = '#d4b545';
    ctx.fillRect(0, 0, TILE, TILE);
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = rng() > 0.5 ? '#c8a838' : '#dcc050';
      ctx.fillRect(Math.floor(rng() * TILE), Math.floor(rng() * TILE), 1, 1);
    }
    return c;
  }

  function generateSnow(seed) {
    const c = createCanvas(TILE, TILE);
    const ctx = c.getContext('2d');
    const rng = Utils.mulberry32(seed || 401);
    ctx.fillStyle = '#e8e8f0';
    ctx.fillRect(0, 0, TILE, TILE);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = rng() > 0.5 ? '#d8d8e8' : '#f0f0ff';
      ctx.fillRect(Math.floor(rng() * TILE), Math.floor(rng() * TILE), 1, 1);
    }
    return c;
  }

  function generateIce() {
    const c = createCanvas(TILE, TILE);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#a0d0f0';
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(2, 3, 4, 1);
    ctx.fillRect(9, 7, 3, 1);
    ctx.fillRect(5, 12, 5, 1);
    return c;
  }

  function generateLava(frame) {
    const c = createCanvas(TILE, TILE);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#cc3300';
    ctx.fillRect(0, 0, TILE, TILE);
    const offset = (frame || 0) % 4;
    ctx.fillStyle = '#ff6600';
    for (let y = 0; y < TILE; y += 3) {
      ctx.fillRect(((y * 3 + offset * 2) % TILE), y, 3, 2);
    }
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect((4 + offset * 3) % TILE, 5, 2, 1);
    ctx.fillRect((10 + offset * 2) % TILE, 11, 2, 1);
    return c;
  }

  function generateCrystal() {
    const c = createCanvas(TILE, TILE);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, TILE, TILE);
    // Crystal formations
    ctx.fillStyle = '#7b2ff7';
    ctx.fillRect(3, 4, 3, 8);
    ctx.fillRect(4, 2, 1, 2);
    ctx.fillStyle = '#9b5ff7';
    ctx.fillRect(10, 5, 3, 7);
    ctx.fillRect(11, 3, 1, 2);
    ctx.fillStyle = '#bb8ff7';
    ctx.fillRect(4, 5, 1, 3);
    ctx.fillRect(11, 6, 1, 2);
    return c;
  }

  function generateVoid() {
    const c = createCanvas(TILE, TILE);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#0a0a15';
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = '#1a1a30';
    ctx.fillRect(3, 5, 1, 1);
    ctx.fillRect(10, 2, 1, 1);
    ctx.fillRect(7, 12, 1, 1);
    return c;
  }

  // ========== OBJECT SPRITES ==========

  function generateTree(type) {
    const c = createCanvas(TILE, TILE * 2);
    const ctx = c.getContext('2d');
    if (type === 'pine') {
      // Trunk
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(7, 18, 2, 8);
      // Pine layers
      ctx.fillStyle = '#1a5a1a';
      ctx.fillRect(3, 8, 10, 4);
      ctx.fillRect(4, 4, 8, 4);
      ctx.fillRect(5, 1, 6, 3);
      ctx.fillStyle = '#2a6a2a';
      ctx.fillRect(4, 10, 3, 2);
      ctx.fillRect(6, 5, 2, 3);
      // Snow on pine
      if (type === 'pine_snow') {
        ctx.fillStyle = '#e8e8f0';
        ctx.fillRect(5, 1, 6, 1);
        ctx.fillRect(4, 4, 8, 1);
      }
    } else {
      // Trunk
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(6, 16, 4, 10);
      ctx.fillStyle = '#6a4a2a';
      ctx.fillRect(7, 18, 2, 6);
      // Canopy (round)
      ctx.fillStyle = '#2a7a2a';
      ctx.fillRect(3, 6, 10, 10);
      ctx.fillRect(2, 8, 12, 6);
      ctx.fillRect(4, 4, 8, 3);
      // Highlights
      ctx.fillStyle = '#3a8a3a';
      ctx.fillRect(4, 7, 4, 4);
      ctx.fillStyle = '#1a6a1a';
      ctx.fillRect(9, 10, 3, 4);
    }
    return c;
  }

  function generateDeadTree() {
    const c = createCanvas(TILE, TILE * 2);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#4a3520';
    ctx.fillRect(7, 8, 2, 18);
    // Branches
    ctx.fillRect(4, 10, 3, 1);
    ctx.fillRect(4, 9, 1, 1);
    ctx.fillRect(11, 12, 3, 1);
    ctx.fillRect(13, 11, 1, 1);
    ctx.fillRect(5, 6, 2, 1);
    ctx.fillRect(10, 7, 2, 1);
    return c;
  }

  function generateRock() {
    const c = createCanvas(TILE, TILE);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#777';
    ctx.fillRect(3, 6, 10, 8);
    ctx.fillRect(4, 4, 8, 2);
    ctx.fillRect(5, 14, 6, 2);
    ctx.fillStyle = '#888';
    ctx.fillRect(4, 6, 4, 4);
    ctx.fillStyle = '#666';
    ctx.fillRect(8, 10, 4, 3);
    return c;
  }

  function generateChest(open) {
    const c = createCanvas(TILE, TILE);
    const ctx = c.getContext('2d');
    // Base
    ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(3, 7, 10, 7);
    ctx.fillStyle = '#A0692B';
    ctx.fillRect(4, 8, 8, 5);
    // Metal bands
    ctx.fillStyle = '#cca000';
    ctx.fillRect(3, 7, 10, 1);
    ctx.fillRect(3, 10, 10, 1);
    ctx.fillRect(7, 7, 2, 7);
    // Lock
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(7, 8, 2, 2);
    if (open) {
      // Lid open
      ctx.fillStyle = '#8B5A2B';
      ctx.fillRect(3, 2, 10, 5);
      ctx.fillStyle = '#A0692B';
      ctx.fillRect(4, 3, 8, 3);
      ctx.fillStyle = '#cca000';
      ctx.fillRect(3, 6, 10, 1);
      // Gleam
      ctx.fillStyle = '#ffffaa';
      ctx.fillRect(5, 5, 2, 1);
    }
    return c;
  }

  function generateDoor() {
    const c = createCanvas(TILE, TILE * 2);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#6a4a2a';
    ctx.fillRect(3, 4, 10, 22);
    ctx.fillStyle = '#7a5a3a';
    ctx.fillRect(4, 5, 3, 9);
    ctx.fillRect(9, 5, 3, 9);
    ctx.fillRect(4, 16, 3, 8);
    ctx.fillRect(9, 16, 3, 8);
    // Handle
    ctx.fillStyle = '#cca000';
    ctx.fillRect(10, 16, 2, 2);
    // Frame
    ctx.fillStyle = '#444';
    ctx.fillRect(2, 3, 1, 24);
    ctx.fillRect(13, 3, 1, 24);
    ctx.fillRect(2, 3, 12, 1);
    return c;
  }

  function generateSign() {
    const c = createCanvas(TILE, TILE);
    const ctx = c.getContext('2d');
    // Post
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(7, 8, 2, 8);
    // Sign board
    ctx.fillStyle = '#8a6a3a';
    ctx.fillRect(2, 2, 12, 7);
    ctx.fillStyle = '#9a7a4a';
    ctx.fillRect(3, 3, 10, 5);
    return c;
  }

  function generateFlower(color) {
    const c = createCanvas(TILE, TILE);
    const ctx = c.getContext('2d');
    // Stem
    ctx.fillStyle = '#2a6a1a';
    ctx.fillRect(7, 8, 1, 6);
    ctx.fillRect(6, 10, 1, 1);
    // Petals
    ctx.fillStyle = color || '#ff4466';
    ctx.fillRect(6, 4, 3, 3);
    ctx.fillRect(5, 5, 1, 1);
    ctx.fillRect(9, 5, 1, 1);
    ctx.fillRect(7, 3, 1, 1);
    ctx.fillRect(7, 7, 1, 1);
    // Center
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(7, 5, 1, 1);
    return c;
  }

  function generateCampfire(frame) {
    const c = createCanvas(TILE, TILE);
    const ctx = c.getContext('2d');
    // Logs
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(3, 12, 10, 2);
    ctx.fillRect(5, 11, 6, 1);
    // Fire
    const f = (frame || 0) % 3;
    ctx.fillStyle = '#ff4400';
    ctx.fillRect(5, 6 - f, 6, 6 + f);
    ctx.fillStyle = '#ff8800';
    ctx.fillRect(6, 7 - f, 4, 4 + f);
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(7, 8 - f, 2, 3 + f);
    return c;
  }

  // ========== CHARACTER SPRITES ==========

  function generatePlayer(dir, frame, classType) {
    const c = createCanvas(TILE, TILE * 2);
    const ctx = c.getContext('2d');
    const f = (frame || 0) % 4;
    const walk = (f === 1 || f === 3) ? 1 : 0;

    let bodyColor, hairColor, armorColor;
    switch (classType) {
      case 'mage':
        bodyColor = '#3344aa'; armorColor = '#4455bb'; hairColor = '#eee';
        break;
      case 'ranger':
        bodyColor = '#2a6a2a'; armorColor = '#3a7a3a'; hairColor = '#8B4513';
        break;
      default: // warrior
        bodyColor = '#888'; armorColor = '#999'; hairColor = '#5a3010';
    }

    // Skin
    const skin = '#e8b888';

    if (dir === 'down' || dir === undefined) {
      // Head
      ctx.fillStyle = skin;
      ctx.fillRect(5, 2, 6, 6);
      // Hair
      ctx.fillStyle = hairColor;
      ctx.fillRect(4, 1, 8, 3);
      ctx.fillRect(4, 1, 1, 5);
      ctx.fillRect(11, 1, 1, 5);
      // Eyes
      ctx.fillStyle = '#222';
      ctx.fillRect(6, 5, 1, 1);
      ctx.fillRect(9, 5, 1, 1);
      // Body
      ctx.fillStyle = bodyColor;
      ctx.fillRect(4, 8, 8, 10);
      ctx.fillStyle = armorColor;
      ctx.fillRect(5, 9, 6, 4);
      // Arms
      ctx.fillStyle = skin;
      ctx.fillRect(3, 9, 1, 5);
      ctx.fillRect(12, 9, 1, 5);
      // Legs
      ctx.fillStyle = '#4a3520';
      if (walk) {
        ctx.fillRect(5, 18, 3, 6 + (f === 1 ? 1 : -1));
        ctx.fillRect(8, 18, 3, 6 + (f === 1 ? -1 : 1));
      } else {
        ctx.fillRect(5, 18, 3, 6);
        ctx.fillRect(8, 18, 3, 6);
      }
      // Boots
      ctx.fillStyle = '#3a2510';
      ctx.fillRect(5, 23, 3, 2);
      ctx.fillRect(8, 23, 3, 2);
    } else if (dir === 'up') {
      ctx.fillStyle = hairColor;
      ctx.fillRect(4, 1, 8, 7);
      ctx.fillStyle = bodyColor;
      ctx.fillRect(4, 8, 8, 10);
      ctx.fillStyle = armorColor;
      ctx.fillRect(5, 9, 6, 4);
      ctx.fillStyle = skin;
      ctx.fillRect(3, 9, 1, 5);
      ctx.fillRect(12, 9, 1, 5);
      ctx.fillStyle = '#4a3520';
      if (walk) {
        ctx.fillRect(5, 18, 3, 6 + (f === 1 ? 1 : -1));
        ctx.fillRect(8, 18, 3, 6 + (f === 1 ? -1 : 1));
      } else {
        ctx.fillRect(5, 18, 3, 6);
        ctx.fillRect(8, 18, 3, 6);
      }
      ctx.fillStyle = '#3a2510';
      ctx.fillRect(5, 23, 3, 2);
      ctx.fillRect(8, 23, 3, 2);
    } else if (dir === 'left') {
      ctx.fillStyle = skin;
      ctx.fillRect(6, 2, 5, 6);
      ctx.fillStyle = hairColor;
      ctx.fillRect(6, 1, 6, 3);
      ctx.fillRect(10, 1, 2, 5);
      ctx.fillStyle = '#222';
      ctx.fillRect(7, 5, 1, 1);
      ctx.fillStyle = bodyColor;
      ctx.fillRect(5, 8, 7, 10);
      ctx.fillStyle = armorColor;
      ctx.fillRect(6, 9, 5, 4);
      ctx.fillStyle = skin;
      ctx.fillRect(4, 9, 1, 5);
      ctx.fillStyle = '#4a3520';
      if (walk) {
        ctx.fillRect(6, 18, 3, 6 + (f === 1 ? 1 : -1));
        ctx.fillRect(8, 18, 2, 6 + (f === 1 ? -1 : 1));
      } else {
        ctx.fillRect(6, 18, 3, 6);
        ctx.fillRect(8, 18, 2, 6);
      }
      ctx.fillStyle = '#3a2510';
      ctx.fillRect(6, 23, 3, 2);
    } else if (dir === 'right') {
      ctx.fillStyle = skin;
      ctx.fillRect(5, 2, 5, 6);
      ctx.fillStyle = hairColor;
      ctx.fillRect(4, 1, 6, 3);
      ctx.fillRect(4, 1, 2, 5);
      ctx.fillStyle = '#222';
      ctx.fillRect(8, 5, 1, 1);
      ctx.fillStyle = bodyColor;
      ctx.fillRect(4, 8, 7, 10);
      ctx.fillStyle = armorColor;
      ctx.fillRect(5, 9, 5, 4);
      ctx.fillStyle = skin;
      ctx.fillRect(11, 9, 1, 5);
      ctx.fillStyle = '#4a3520';
      if (walk) {
        ctx.fillRect(5, 18, 2, 6 + (f === 1 ? 1 : -1));
        ctx.fillRect(7, 18, 3, 6 + (f === 1 ? -1 : 1));
      } else {
        ctx.fillRect(5, 18, 2, 6);
        ctx.fillRect(7, 18, 3, 6);
      }
      ctx.fillStyle = '#3a2510';
      ctx.fillRect(7, 23, 3, 2);
    }
    return c;
  }

  // ========== ENEMY SPRITES ==========

  function generateEnemy(type) {
    const c = createCanvas(TILE, TILE * 2);
    const ctx = c.getContext('2d');

    switch (type) {
      case 'slime':
        ctx.fillStyle = '#44cc44';
        ctx.fillRect(3, 14, 10, 8);
        ctx.fillRect(2, 16, 12, 4);
        ctx.fillRect(4, 12, 8, 2);
        ctx.fillStyle = '#55dd55';
        ctx.fillRect(4, 14, 4, 4);
        ctx.fillStyle = '#fff';
        ctx.fillRect(5, 16, 2, 2);
        ctx.fillRect(9, 16, 2, 2);
        ctx.fillStyle = '#222';
        ctx.fillRect(6, 17, 1, 1);
        ctx.fillRect(10, 17, 1, 1);
        break;

      case 'skeleton':
        ctx.fillStyle = '#ddd';
        ctx.fillRect(5, 2, 6, 5);
        ctx.fillStyle = '#111';
        ctx.fillRect(6, 4, 1, 2);
        ctx.fillRect(9, 4, 1, 2);
        ctx.fillRect(7, 6, 2, 1);
        ctx.fillStyle = '#ccc';
        ctx.fillRect(6, 7, 4, 2);
        ctx.fillRect(7, 9, 2, 8);
        ctx.fillRect(4, 9, 3, 1);
        ctx.fillRect(9, 9, 3, 1);
        ctx.fillRect(4, 10, 1, 4);
        ctx.fillRect(11, 10, 1, 4);
        ctx.fillRect(6, 17, 2, 6);
        ctx.fillRect(8, 17, 2, 6);
        break;

      case 'bat':
        ctx.fillStyle = '#553';
        ctx.fillRect(6, 10, 4, 4);
        ctx.fillStyle = '#664';
        // Wings
        ctx.fillRect(1, 8, 5, 3);
        ctx.fillRect(10, 8, 5, 3);
        ctx.fillRect(0, 9, 2, 2);
        ctx.fillRect(14, 9, 2, 2);
        // Eyes
        ctx.fillStyle = '#f00';
        ctx.fillRect(7, 11, 1, 1);
        ctx.fillRect(8, 11, 1, 1);
        break;

      case 'wolf':
        ctx.fillStyle = '#666';
        ctx.fillRect(3, 12, 10, 6);
        ctx.fillRect(2, 14, 2, 3);
        ctx.fillStyle = '#777';
        ctx.fillRect(4, 13, 4, 4);
        // Head
        ctx.fillRect(11, 10, 4, 5);
        ctx.fillStyle = '#555';
        ctx.fillRect(13, 12, 2, 2);
        ctx.fillStyle = '#ff0';
        ctx.fillRect(12, 11, 1, 1);
        // Legs
        ctx.fillStyle = '#555';
        ctx.fillRect(4, 18, 2, 5);
        ctx.fillRect(9, 18, 2, 5);
        // Tail
        ctx.fillRect(1, 11, 2, 1);
        break;

      case 'goblin':
        ctx.fillStyle = '#4a8a2a';
        ctx.fillRect(5, 4, 6, 5);
        ctx.fillRect(4, 5, 8, 3);
        // Ears
        ctx.fillRect(3, 4, 2, 2);
        ctx.fillRect(11, 4, 2, 2);
        // Eyes
        ctx.fillStyle = '#ff0';
        ctx.fillRect(6, 6, 1, 1);
        ctx.fillRect(9, 6, 1, 1);
        // Body
        ctx.fillStyle = '#774';
        ctx.fillRect(5, 9, 6, 8);
        // Arms
        ctx.fillStyle = '#4a8a2a';
        ctx.fillRect(3, 10, 2, 4);
        ctx.fillRect(11, 10, 2, 4);
        // Legs
        ctx.fillStyle = '#4a8a2a';
        ctx.fillRect(5, 17, 3, 6);
        ctx.fillRect(8, 17, 3, 6);
        break;

      case 'ghost':
        ctx.fillStyle = 'rgba(200,200,255,0.7)';
        ctx.fillRect(4, 4, 8, 12);
        ctx.fillRect(3, 6, 10, 8);
        ctx.fillRect(4, 16, 2, 3);
        ctx.fillRect(7, 17, 2, 2);
        ctx.fillRect(10, 16, 2, 3);
        ctx.fillStyle = '#111';
        ctx.fillRect(6, 8, 2, 2);
        ctx.fillRect(9, 8, 2, 2);
        ctx.fillRect(7, 12, 3, 1);
        break;

      case 'golem':
        ctx.fillStyle = '#887766';
        ctx.fillRect(4, 2, 8, 8);
        ctx.fillRect(3, 4, 10, 4);
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(5, 5, 2, 2);
        ctx.fillRect(9, 5, 2, 2);
        ctx.fillStyle = '#776655';
        ctx.fillRect(3, 10, 10, 10);
        ctx.fillRect(1, 11, 3, 6);
        ctx.fillRect(12, 11, 3, 6);
        ctx.fillRect(4, 20, 3, 5);
        ctx.fillRect(9, 20, 3, 5);
        break;

      case 'dragon':
        // Body
        ctx.fillStyle = '#aa2222';
        ctx.fillRect(3, 8, 10, 10);
        ctx.fillRect(2, 10, 12, 6);
        // Head
        ctx.fillRect(9, 2, 6, 7);
        ctx.fillStyle = '#cc3333';
        ctx.fillRect(10, 3, 4, 5);
        ctx.fillStyle = '#ff0';
        ctx.fillRect(11, 4, 2, 2);
        // Wings
        ctx.fillStyle = '#881111';
        ctx.fillRect(0, 6, 4, 6);
        ctx.fillRect(13, 4, 3, 5);
        // Legs
        ctx.fillStyle = '#992222';
        ctx.fillRect(4, 18, 3, 5);
        ctx.fillRect(9, 18, 3, 5);
        // Tail
        ctx.fillRect(0, 14, 3, 2);
        break;

      case 'dark_knight':
        // Armor
        ctx.fillStyle = '#222';
        ctx.fillRect(5, 2, 6, 6);
        ctx.fillStyle = '#333';
        ctx.fillRect(4, 8, 8, 10);
        ctx.fillStyle = '#444';
        ctx.fillRect(5, 9, 6, 4);
        // Helm visor
        ctx.fillStyle = '#c00';
        ctx.fillRect(6, 4, 4, 2);
        // Arms
        ctx.fillStyle = '#222';
        ctx.fillRect(2, 9, 2, 6);
        ctx.fillRect(12, 9, 2, 6);
        // Sword
        ctx.fillStyle = '#aaa';
        ctx.fillRect(13, 4, 1, 10);
        ctx.fillStyle = '#cca000';
        ctx.fillRect(12, 13, 3, 1);
        // Legs
        ctx.fillStyle = '#333';
        ctx.fillRect(5, 18, 3, 6);
        ctx.fillRect(8, 18, 3, 6);
        ctx.fillStyle = '#222';
        ctx.fillRect(5, 22, 3, 2);
        ctx.fillRect(8, 22, 3, 2);
        break;

      case 'scorpion':
        ctx.fillStyle = '#884422';
        ctx.fillRect(4, 14, 8, 4);
        ctx.fillRect(3, 15, 10, 2);
        // Pincers
        ctx.fillRect(1, 12, 3, 3);
        ctx.fillRect(12, 12, 3, 3);
        ctx.fillRect(0, 12, 1, 2);
        ctx.fillRect(15, 12, 1, 2);
        // Tail
        ctx.fillRect(7, 8, 2, 6);
        ctx.fillRect(6, 6, 2, 2);
        ctx.fillRect(5, 5, 2, 2);
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(5, 4, 2, 1);
        // Legs
        ctx.fillStyle = '#773311';
        ctx.fillRect(3, 18, 1, 3);
        ctx.fillRect(5, 18, 1, 3);
        ctx.fillRect(10, 18, 1, 3);
        ctx.fillRect(12, 18, 1, 3);
        break;

      case 'ice_elemental':
        ctx.fillStyle = '#88ccff';
        ctx.fillRect(4, 4, 8, 14);
        ctx.fillRect(3, 6, 10, 10);
        ctx.fillStyle = '#aaddff';
        ctx.fillRect(5, 5, 6, 4);
        ctx.fillStyle = '#fff';
        ctx.fillRect(6, 7, 1, 2);
        ctx.fillRect(9, 7, 1, 2);
        ctx.fillStyle = '#4488cc';
        ctx.fillRect(7, 12, 2, 1);
        // Ice shards
        ctx.fillStyle = '#ccecff';
        ctx.fillRect(2, 8, 1, 4);
        ctx.fillRect(13, 6, 1, 5);
        ctx.fillRect(6, 2, 1, 3);
        ctx.fillRect(10, 3, 1, 2);
        break;

      default: // generic
        ctx.fillStyle = '#a44';
        ctx.fillRect(4, 4, 8, 14);
        ctx.fillRect(3, 6, 10, 10);
        ctx.fillStyle = '#fff';
        ctx.fillRect(6, 7, 2, 2);
        ctx.fillRect(9, 7, 2, 2);
        ctx.fillStyle = '#222';
        ctx.fillRect(7, 8, 1, 1);
        ctx.fillRect(10, 8, 1, 1);
    }
    return c;
  }

  // ========== NPC SPRITES ==========

  function generateNPC(type) {
    const c = createCanvas(TILE, TILE * 2);
    const ctx = c.getContext('2d');
    const skin = '#e8b888';

    let robeColor, hairColor, accessory;
    switch (type) {
      case 'elder':
        robeColor = '#8844aa'; hairColor = '#ccc'; break;
      case 'merchant':
        robeColor = '#aa7722'; hairColor = '#5a3010'; break;
      case 'blacksmith':
        robeColor = '#664'; hairColor = '#333'; break;
      case 'healer':
        robeColor = '#fff'; hairColor = '#ff8844'; break;
      case 'guard':
        robeColor = '#557'; hairColor = '#333'; break;
      case 'mage_npc':
        robeColor = '#2244aa'; hairColor = '#ddd'; break;
      default:
        robeColor = '#558855'; hairColor = '#5a3a1a';
    }

    // Head
    ctx.fillStyle = skin;
    ctx.fillRect(5, 2, 6, 6);
    // Hair
    ctx.fillStyle = hairColor;
    ctx.fillRect(4, 1, 8, 3);
    ctx.fillRect(4, 1, 1, 4);
    ctx.fillRect(11, 1, 1, 4);
    // Eyes
    ctx.fillStyle = '#222';
    ctx.fillRect(6, 5, 1, 1);
    ctx.fillRect(9, 5, 1, 1);
    // Body/robe
    ctx.fillStyle = robeColor;
    ctx.fillRect(4, 8, 8, 12);
    ctx.fillRect(3, 9, 10, 8);
    // Hands
    ctx.fillStyle = skin;
    ctx.fillRect(3, 14, 1, 2);
    ctx.fillRect(12, 14, 1, 2);
    // Feet
    ctx.fillStyle = '#3a2510';
    ctx.fillRect(5, 20, 3, 2);
    ctx.fillRect(8, 20, 3, 2);

    // Special accessories
    if (type === 'blacksmith') {
      // Hammer
      ctx.fillStyle = '#888';
      ctx.fillRect(13, 10, 2, 2);
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(13, 12, 1, 5);
    } else if (type === 'guard') {
      // Spear
      ctx.fillStyle = '#888';
      ctx.fillRect(14, 2, 1, 18);
      ctx.fillStyle = '#aaa';
      ctx.fillRect(13, 2, 3, 2);
      // Helmet
      ctx.fillStyle = '#557';
      ctx.fillRect(4, 0, 8, 2);
    } else if (type === 'healer') {
      // Cross symbol
      ctx.fillStyle = '#c00';
      ctx.fillRect(7, 10, 2, 4);
      ctx.fillRect(6, 11, 4, 2);
    }

    return c;
  }

  // ========== UI SPRITES ==========

  function generateIcon(type) {
    const c = createCanvas(16, 16);
    const ctx = c.getContext('2d');

    switch (type) {
      case 'sword':
        ctx.fillStyle = '#aaa';
        ctx.fillRect(3, 3, 2, 8);
        ctx.fillRect(5, 5, 1, 1);
        ctx.fillRect(2, 5, 1, 1);
        ctx.fillStyle = '#cca000';
        ctx.fillRect(2, 11, 4, 1);
        ctx.fillStyle = '#5a3a1a';
        ctx.fillRect(3, 12, 2, 3);
        break;
      case 'shield':
        ctx.fillStyle = '#667';
        ctx.fillRect(3, 2, 10, 10);
        ctx.fillRect(4, 12, 8, 2);
        ctx.fillRect(5, 14, 6, 1);
        ctx.fillStyle = '#889';
        ctx.fillRect(4, 3, 8, 8);
        ctx.fillStyle = '#cc0';
        ctx.fillRect(7, 5, 2, 4);
        ctx.fillRect(6, 6, 4, 2);
        break;
      case 'potion_hp':
        ctx.fillStyle = '#c00';
        ctx.fillRect(5, 6, 6, 8);
        ctx.fillRect(6, 4, 4, 2);
        ctx.fillStyle = '#ddd';
        ctx.fillRect(6, 3, 4, 1);
        ctx.fillRect(7, 2, 2, 1);
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(6, 7, 4, 5);
        break;
      case 'potion_mp':
        ctx.fillStyle = '#33a';
        ctx.fillRect(5, 6, 6, 8);
        ctx.fillRect(6, 4, 4, 2);
        ctx.fillStyle = '#ddd';
        ctx.fillRect(6, 3, 4, 1);
        ctx.fillRect(7, 2, 2, 1);
        ctx.fillStyle = '#5577ff';
        ctx.fillRect(6, 7, 4, 5);
        break;
      case 'coin':
        ctx.fillStyle = '#cca000';
        ctx.fillRect(4, 3, 8, 10);
        ctx.fillRect(3, 5, 10, 6);
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(5, 4, 6, 8);
        ctx.fillStyle = '#cca000';
        ctx.fillRect(6, 6, 4, 4);
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(7, 7, 2, 2);
        break;
      case 'star':
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(7, 1, 2, 3);
        ctx.fillRect(3, 5, 10, 2);
        ctx.fillRect(5, 4, 6, 1);
        ctx.fillRect(5, 7, 2, 2);
        ctx.fillRect(9, 7, 2, 2);
        ctx.fillRect(4, 9, 2, 2);
        ctx.fillRect(10, 9, 2, 2);
        ctx.fillRect(3, 11, 2, 2);
        ctx.fillRect(11, 11, 2, 2);
        break;
      case 'quest':
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(6, 2, 4, 2);
        ctx.fillRect(8, 4, 2, 3);
        ctx.fillRect(6, 6, 2, 2);
        ctx.fillRect(6, 8, 2, 2);
        ctx.fillRect(6, 11, 2, 2);
        break;
    }
    return c;
  }

  // ========== PORTRAIT SPRITES ==========

  function generatePortrait(type) {
    const c = createCanvas(48, 48);
    const ctx = c.getContext('2d');
    const skin = '#e8b888';

    // Background
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, 48, 48);
    ctx.fillStyle = '#333';
    ctx.fillRect(1, 1, 46, 46);

    // Face base
    ctx.fillStyle = skin;
    ctx.fillRect(14, 10, 20, 24);
    ctx.fillRect(12, 14, 24, 16);

    let hairColor, eyeColor;
    switch (type) {
      case 'warrior':
        hairColor = '#5a3010'; eyeColor = '#446';
        ctx.fillStyle = hairColor;
        ctx.fillRect(10, 6, 28, 8);
        ctx.fillRect(10, 6, 4, 16);
        ctx.fillRect(34, 6, 4, 16);
        break;
      case 'mage':
        hairColor = '#eee'; eyeColor = '#66a';
        ctx.fillStyle = hairColor;
        ctx.fillRect(10, 4, 28, 10);
        ctx.fillRect(10, 4, 4, 26);
        ctx.fillRect(34, 4, 4, 26);
        break;
      case 'ranger':
        hairColor = '#8B4513'; eyeColor = '#4a4';
        ctx.fillStyle = hairColor;
        ctx.fillRect(12, 6, 24, 8);
        ctx.fillRect(10, 8, 4, 12);
        ctx.fillRect(34, 8, 4, 12);
        break;
      default:
        hairColor = '#5a3a1a'; eyeColor = '#446';
        ctx.fillStyle = hairColor;
        ctx.fillRect(12, 6, 24, 8);
    }

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(17, 20, 6, 4);
    ctx.fillRect(27, 20, 6, 4);
    ctx.fillStyle = eyeColor;
    ctx.fillRect(19, 21, 3, 3);
    ctx.fillRect(29, 21, 3, 3);
    ctx.fillStyle = '#111';
    ctx.fillRect(20, 22, 2, 2);
    ctx.fillRect(30, 22, 2, 2);

    // Mouth
    ctx.fillStyle = '#c08060';
    ctx.fillRect(21, 29, 6, 2);

    return c;
  }

  // ========== GENERATION & CACHING ==========

  function generateAll() {
    // Tiles
    cache.grass = generateGrass(101);
    cache.grass2 = generateGrassVariant(103);
    cache.grass3 = generateGrassVariant(105);
    cache.dirt = generateDirt(201);
    cache.path = generatePath(202);
    cache.stone = generateStone();
    cache.wall = generateWall();
    cache.sand = generateSand(301);
    cache.snow = generateSnow(401);
    cache.ice = generateIce();
    cache.crystal = generateCrystal();
    cache.void_tile = generateVoid();

    // Animated tiles (4 frames each)
    cache.water = [0, 1, 2, 3].map(f => generateWater(f));
    cache.lava = [0, 1, 2, 3].map(f => generateLava(f));
    cache.campfire = [0, 1, 2, 3].map(f => generateCampfire(f));

    // Objects
    cache.tree = generateTree('oak');
    cache.pine = generateTree('pine');
    cache.dead_tree = generateDeadTree();
    cache.rock = generateRock();
    cache.chest_closed = generateChest(false);
    cache.chest_open = generateChest(true);
    cache.door = generateDoor();
    cache.sign = generateSign();
    cache.flower_red = generateFlower('#ff4466');
    cache.flower_blue = generateFlower('#4466ff');
    cache.flower_yellow = generateFlower('#ffcc22');

    // Player (4 dirs x 4 frames x 3 classes)
    cache.player = {};
    for (const cls of ['warrior', 'mage', 'ranger']) {
      cache.player[cls] = {};
      for (const dir of ['down', 'up', 'left', 'right']) {
        cache.player[cls][dir] = [0, 1, 2, 3].map(f => generatePlayer(dir, f, cls));
      }
    }

    // Enemies
    const enemyTypes = ['slime', 'skeleton', 'bat', 'wolf', 'goblin', 'ghost',
      'golem', 'dragon', 'dark_knight', 'scorpion', 'ice_elemental'];
    cache.enemies = {};
    for (const t of enemyTypes) {
      cache.enemies[t] = generateEnemy(t);
    }

    // NPCs
    const npcTypes = ['elder', 'merchant', 'blacksmith', 'healer', 'guard', 'mage_npc', 'villager'];
    cache.npcs = {};
    for (const t of npcTypes) {
      cache.npcs[t] = generateNPC(t);
    }

    // Icons
    const iconTypes = ['sword', 'shield', 'potion_hp', 'potion_mp', 'coin', 'star', 'quest'];
    cache.icons = {};
    for (const t of iconTypes) {
      cache.icons[t] = generateIcon(t);
    }

    // Portraits
    cache.portraits = {};
    for (const t of ['warrior', 'mage', 'ranger']) {
      cache.portraits[t] = generatePortrait(t);
    }
  }

  function get(name) {
    return cache[name];
  }

  return { generateAll, get, cache, TILE, createCanvas };
})();
