// world/zones.js — Zone definitions (all map data)
// Each zone: { name, width, height, ground[][], objects[][], spawns, exits, music, ambience }

const Zones = (() => {
  const T = Tileset.T;

  // Helper: fill a 2D array
  function fill(w, h, val) {
    const arr = [];
    for (let y = 0; y < h; y++) {
      arr[y] = [];
      for (let x = 0; x < w; x++) arr[y][x] = val;
    }
    return arr;
  }

  // Helper: draw a rect into a 2D array
  function rect(arr, x, y, w, h, val) {
    for (let row = y; row < y + h && row < arr.length; row++) {
      for (let col = x; col < x + w && col < arr[0].length; col++) {
        if (row >= 0 && col >= 0) arr[row][col] = val;
      }
    }
  }

  // Helper: scatter random tiles
  function scatter(arr, val, count, seed, avoid) {
    const rng = Utils.mulberry32(seed);
    const h = arr.length, w = arr[0].length;
    avoid = avoid || new Set();
    for (let i = 0; i < count; i++) {
      let x, y, attempts = 0;
      do {
        x = Math.floor(rng() * w);
        y = Math.floor(rng() * h);
        attempts++;
      } while (attempts < 50 && (avoid.has(arr[y][x]) || arr[y][x] === val));
      if (attempts < 50) arr[y][x] = val;
    }
  }

  // ======== ELDERGROVE VILLAGE (Safe Town) ========
  function createEldergrove() {
    const W = 40, H = 30;
    const ground = fill(W, H, T.GRASS);
    const objects = fill(W, H, 0);

    // Paths
    rect(ground, 5, 14, 30, 2, T.PATH);   // Main east-west road
    rect(ground, 19, 5, 2, 20, T.PATH);   // North-south crossroad

    // Water pond
    rect(ground, 30, 4, 6, 4, T.WATER);
    rect(ground, 31, 3, 4, 1, T.WATER);
    rect(ground, 31, 8, 4, 1, T.WATER);

    // Variant grass
    scatter(ground, T.GRASS2, 40, 1001);
    scatter(ground, T.GRASS3, 20, 1002);

    // Buildings (stone floors with walls around)
    // Elder's house (top-left area)
    rect(ground, 4, 4, 8, 6, T.STONE);
    rect(objects, 4, 4, 8, 1, T.WALL);
    rect(objects, 4, 9, 8, 1, T.WALL);
    rect(objects, 4, 4, 1, 6, T.WALL);
    rect(objects, 11, 4, 1, 6, T.WALL);
    objects[9][7] = 0; // Door gap

    // Shop (right side)
    rect(ground, 26, 18, 8, 6, T.STONE);
    rect(objects, 26, 18, 8, 1, T.WALL);
    rect(objects, 26, 23, 8, 1, T.WALL);
    rect(objects, 26, 18, 1, 6, T.WALL);
    rect(objects, 33, 18, 1, 6, T.WALL);
    objects[23][29] = 0; // Door gap

    // Blacksmith (left side)
    rect(ground, 2, 18, 8, 6, T.STONE);
    rect(objects, 2, 18, 8, 1, T.WALL);
    rect(objects, 2, 23, 8, 1, T.WALL);
    rect(objects, 2, 18, 1, 6, T.WALL);
    rect(objects, 9, 18, 1, 6, T.WALL);
    objects[23][5] = 0; // Door gap
    objects[20][4] = T.CAMPFIRE; // Forge

    // Trees around edges
    for (let x = 0; x < W; x++) {
      if (x < 3 || x > 36) { objects[0][x] = T.TREE; objects[1][x] = T.TREE; }
      if (x < 3 || x > 36) { objects[H - 1][x] = T.TREE; objects[H - 2][x] = T.TREE; }
    }
    for (let y = 0; y < H; y++) {
      if (y < 3 || y > 26) { objects[y][0] = T.TREE; objects[y][1] = T.TREE; }
      if (y < 3 || y > 26) { objects[y][W - 1] = T.TREE; objects[y][W - 2] = T.TREE; }
    }

    // Scattered decorations
    scatter(objects, T.FLOWER_R, 5, 1010, new Set([T.WALL, T.TREE]));
    scatter(objects, T.FLOWER_Y, 4, 1011, new Set([T.WALL, T.TREE]));
    scatter(objects, T.FLOWER_B, 3, 1012, new Set([T.WALL, T.TREE]));

    // Signs
    objects[14][18] = T.SIGN;

    return {
      id: 'eldergrove',
      name: 'Eldergrove Village',
      width: W, height: H,
      ground, objects,
      playerStart: { x: 19, y: 15 },
      music: 'town',
      ambience: 'peaceful',
      spawns: [
        { type: 'npc', npcType: 'elder', x: 7, y: 6, name: 'Elder Thorn' },
        { type: 'npc', npcType: 'merchant', x: 29, y: 20, name: 'Merchant Gale' },
        { type: 'npc', npcType: 'blacksmith', x: 5, y: 20, name: 'Smith Ironhand' },
        { type: 'npc', npcType: 'healer', x: 22, y: 8, name: 'Healer Willow' },
        { type: 'npc', npcType: 'guard', x: 15, y: 14, name: 'Guard Orin' },
        { type: 'npc', npcType: 'villager', x: 25, y: 12, name: 'Farmer Pip' }
      ],
      exits: [
        { x: 39, y: 14, target: 'whisperwood', spawnX: 1, spawnY: 15 },
        { x: 39, y: 15, target: 'whisperwood', spawnX: 1, spawnY: 16 },
        { x: 19, y: 0, target: 'frostpeak', spawnX: 20, spawnY: 38 },
        { x: 20, y: 0, target: 'frostpeak', spawnX: 21, spawnY: 38 }
      ]
    };
  }

  // ======== WHISPERWOOD FOREST ========
  function createWhisperwood() {
    const W = 50, H = 40;
    const ground = fill(W, H, T.GRASS2);
    const objects = fill(W, H, 0);

    // Dense tree coverage
    scatter(objects, T.TREE, 180, 2001, new Set());

    // Clear paths
    rect(objects, 0, 14, W, 3, 0);   // East-west path
    rect(ground, 0, 14, W, 3, T.DIRT);
    rect(objects, 24, 0, 3, H, 0);   // North-south path
    rect(ground, 24, 0, 3, H, T.DIRT);

    // Clearing in the center
    rect(objects, 20, 18, 10, 8, 0);
    rect(ground, 20, 18, 10, 8, T.GRASS);

    // Small pond
    rect(ground, 35, 28, 5, 4, T.WATER);

    // Campfire in clearing
    objects[21][24] = T.CAMPFIRE;

    // Mushroom ring (flowers as stand-in)
    objects[19][22] = T.FLOWER_B;
    objects[19][27] = T.FLOWER_B;
    objects[24][22] = T.FLOWER_B;
    objects[24][27] = T.FLOWER_B;

    // Some rocks
    scatter(objects, T.ROCK, 15, 2010, new Set([T.TREE]));

    return {
      id: 'whisperwood',
      name: 'Whisperwood Forest',
      width: W, height: H,
      ground, objects,
      playerStart: { x: 1, y: 15 },
      music: 'forest',
      ambience: 'forest',
      spawns: [
        { type: 'enemy', enemyType: 'slime', x: 10, y: 10, level: 1 },
        { type: 'enemy', enemyType: 'slime', x: 30, y: 8, level: 1 },
        { type: 'enemy', enemyType: 'slime', x: 15, y: 25, level: 2 },
        { type: 'enemy', enemyType: 'wolf', x: 35, y: 20, level: 3 },
        { type: 'enemy', enemyType: 'wolf', x: 40, y: 30, level: 3 },
        { type: 'enemy', enemyType: 'goblin', x: 42, y: 12, level: 2 },
        { type: 'enemy', enemyType: 'goblin', x: 8, y: 30, level: 2 },
        { type: 'enemy', enemyType: 'bat', x: 20, y: 5, level: 1 },
        { type: 'npc', npcType: 'villager', x: 24, y: 21, name: 'Ranger Fern' },
        { type: 'chest', x: 38, y: 5, loot: 'random', level: 2 }
      ],
      exits: [
        { x: 0, y: 14, target: 'eldergrove', spawnX: 38, spawnY: 14 },
        { x: 0, y: 15, target: 'eldergrove', spawnX: 38, spawnY: 15 },
        { x: 0, y: 16, target: 'eldergrove', spawnX: 38, spawnY: 14 },
        { x: 49, y: 14, target: 'shadowmere', spawnX: 1, spawnY: 15 },
        { x: 49, y: 15, target: 'shadowmere', spawnX: 1, spawnY: 16 },
        { x: 24, y: 39, target: 'sunscorch', spawnX: 20, spawnY: 1 },
        { x: 25, y: 39, target: 'sunscorch', spawnX: 21, spawnY: 1 }
      ]
    };
  }

  // ======== SHADOWMERE CAVES ========
  function createShadowmere() {
    const W = 45, H = 35;
    const ground = fill(W, H, T.STONE);
    const objects = fill(W, H, T.WALL);

    // Carve corridors
    rect(objects, 0, 14, 15, 3, 0);    // Entrance corridor
    rect(objects, 12, 8, 10, 12, 0);   // Main chamber
    rect(objects, 20, 12, 12, 3, 0);   // East corridor
    rect(objects, 30, 6, 8, 12, 0);    // East chamber
    rect(objects, 14, 20, 3, 10, 0);   // South corridor
    rect(objects, 10, 27, 12, 5, 0);   // South chamber
    rect(objects, 22, 18, 3, 10, 0);   // SE corridor
    rect(objects, 22, 25, 10, 5, 0);   // SE chamber
    rect(objects, 35, 14, 8, 3, 0);    // Far east
    rect(objects, 38, 8, 5, 9, 0);     // Boss room

    // Lava pools
    rect(ground, 14, 10, 3, 2, T.LAVA);
    rect(ground, 32, 8, 2, 3, T.LAVA);

    // Crystal formations
    objects[9][16] = T.ROCK;
    objects[9][20] = T.ROCK;
    objects[28][14] = T.ROCK;

    return {
      id: 'shadowmere',
      name: 'Shadowmere Caves',
      width: W, height: H,
      ground, objects,
      playerStart: { x: 1, y: 15 },
      music: 'cave',
      ambience: 'cave',
      spawns: [
        { type: 'enemy', enemyType: 'bat', x: 8, y: 14, level: 3 },
        { type: 'enemy', enemyType: 'bat', x: 16, y: 11, level: 3 },
        { type: 'enemy', enemyType: 'skeleton', x: 25, y: 13, level: 4 },
        { type: 'enemy', enemyType: 'skeleton', x: 33, y: 9, level: 4 },
        { type: 'enemy', enemyType: 'skeleton', x: 15, y: 29, level: 5 },
        { type: 'enemy', enemyType: 'ghost', x: 35, y: 10, level: 5 },
        { type: 'enemy', enemyType: 'ghost', x: 25, y: 27, level: 5 },
        { type: 'boss', enemyType: 'golem', x: 40, y: 11, level: 8, name: 'Stone Guardian' },
        { type: 'chest', x: 34, y: 7, loot: 'random', level: 5 },
        { type: 'chest', x: 18, y: 29, loot: 'random', level: 4 }
      ],
      exits: [
        { x: 0, y: 14, target: 'whisperwood', spawnX: 48, spawnY: 14 },
        { x: 0, y: 15, target: 'whisperwood', spawnX: 48, spawnY: 15 },
        { x: 0, y: 16, target: 'whisperwood', spawnX: 48, spawnY: 14 }
      ]
    };
  }

  // ======== SUNSCORCH DESERT ========
  function createSunscorch() {
    const W = 50, H = 40;
    const ground = fill(W, H, T.SAND);
    const objects = fill(W, H, 0);

    // Oasis
    rect(ground, 20, 18, 8, 6, T.WATER);
    rect(ground, 18, 16, 12, 2, T.GRASS);
    rect(ground, 18, 24, 12, 2, T.GRASS);
    rect(ground, 18, 18, 2, 6, T.GRASS);
    rect(ground, 28, 18, 2, 6, T.GRASS);
    objects[17][20] = T.TREE;
    objects[17][27] = T.TREE;

    // Rocky areas
    scatter(objects, T.ROCK, 30, 4001, new Set());
    scatter(objects, T.DEAD_TREE, 12, 4002, new Set([T.ROCK]));

    // Ruins (stone floor)
    rect(ground, 35, 5, 10, 8, T.STONE);
    rect(objects, 35, 5, 10, 1, T.WALL);
    rect(objects, 35, 12, 10, 1, T.WALL);
    rect(objects, 35, 5, 1, 8, T.WALL);
    rect(objects, 44, 5, 1, 8, T.WALL);
    // Crumbling walls (gaps)
    objects[5][39] = 0; objects[5][40] = 0;
    objects[12][38] = 0;

    // Path to oasis
    rect(ground, 20, 0, 3, 18, T.PATH);
    rect(ground, 23, 24, 3, 16, T.PATH);

    return {
      id: 'sunscorch',
      name: 'Sunscorch Desert',
      width: W, height: H,
      ground, objects,
      playerStart: { x: 20, y: 1 },
      music: 'desert',
      ambience: 'wind',
      spawns: [
        { type: 'enemy', enemyType: 'scorpion', x: 10, y: 10, level: 5 },
        { type: 'enemy', enemyType: 'scorpion', x: 35, y: 25, level: 5 },
        { type: 'enemy', enemyType: 'scorpion', x: 8, y: 30, level: 6 },
        { type: 'enemy', enemyType: 'skeleton', x: 38, y: 8, level: 6 },
        { type: 'enemy', enemyType: 'skeleton', x: 40, y: 10, level: 6 },
        { type: 'enemy', enemyType: 'golem', x: 15, y: 25, level: 7 },
        { type: 'boss', enemyType: 'dragon', x: 40, y: 8, level: 12, name: 'Sand Wyrm' },
        { type: 'npc', npcType: 'villager', x: 24, y: 17, name: 'Desert Nomad' },
        { type: 'chest', x: 42, y: 7, loot: 'random', level: 6 },
        { type: 'chest', x: 5, y: 35, loot: 'random', level: 5 }
      ],
      exits: [
        { x: 20, y: 0, target: 'whisperwood', spawnX: 24, spawnY: 38 },
        { x: 21, y: 0, target: 'whisperwood', spawnX: 25, spawnY: 38 },
        { x: 49, y: 20, target: 'abyss', spawnX: 1, spawnY: 15 },
        { x: 49, y: 21, target: 'abyss', spawnX: 1, spawnY: 16 }
      ]
    };
  }

  // ======== FROSTPEAK MOUNTAINS ========
  function createFrostpeak() {
    const W = 50, H = 40;
    const ground = fill(W, H, T.SNOW);
    const objects = fill(W, H, 0);

    // Mountain walls
    scatter(objects, T.ROCK, 60, 5001, new Set());

    // Ice lake
    rect(ground, 10, 10, 12, 8, T.ICE);
    rect(ground, 12, 8, 8, 2, T.ICE);
    rect(ground, 12, 18, 8, 2, T.ICE);

    // Pine forest area
    for (let y = 25; y < 35; y++) {
      for (let x = 5; x < 20; x++) {
        if (Utils.mulberry32(x * 100 + y)() > 0.6) objects[y][x] = T.PINE;
      }
    }
    // Clear path through forest
    rect(objects, 10, 25, 3, 10, 0);

    // Cave entrance (connect to Abyss)
    rect(ground, 40, 18, 6, 4, T.STONE);
    rect(objects, 40, 18, 6, 1, T.WALL);
    rect(objects, 40, 21, 6, 1, T.WALL);
    rect(objects, 40, 18, 1, 4, T.WALL);
    objects[18][42] = 0; objects[18][43] = 0; // Entrance

    // Paths
    rect(ground, 20, 35, 2, 5, T.PATH);
    rect(ground, 20, 20, 20, 2, T.PATH);

    return {
      id: 'frostpeak',
      name: 'Frostpeak Mountains',
      width: W, height: H,
      ground, objects,
      playerStart: { x: 20, y: 38 },
      music: 'mountain',
      ambience: 'wind',
      spawns: [
        { type: 'enemy', enemyType: 'wolf', x: 8, y: 15, level: 5 },
        { type: 'enemy', enemyType: 'wolf', x: 30, y: 10, level: 6 },
        { type: 'enemy', enemyType: 'wolf', x: 15, y: 30, level: 5 },
        { type: 'enemy', enemyType: 'ice_elemental', x: 14, y: 13, level: 7 },
        { type: 'enemy', enemyType: 'ice_elemental', x: 35, y: 8, level: 7 },
        { type: 'enemy', enemyType: 'ghost', x: 42, y: 25, level: 6 },
        { type: 'boss', enemyType: 'ice_elemental', x: 25, y: 5, level: 14, name: 'Frost Titan' },
        { type: 'chest', x: 5, y: 5, loot: 'random', level: 7 },
        { type: 'chest', x: 44, y: 19, loot: 'random', level: 6 }
      ],
      exits: [
        { x: 20, y: 39, target: 'eldergrove', spawnX: 19, spawnY: 1 },
        { x: 21, y: 39, target: 'eldergrove', spawnX: 20, spawnY: 1 },
        { x: 42, y: 19, target: 'abyss', spawnX: 20, spawnY: 1 },
        { x: 43, y: 19, target: 'abyss', spawnX: 21, spawnY: 1 }
      ]
    };
  }

  // ======== THE ABYSS (Dungeon) ========
  function createAbyss() {
    const W = 45, H = 40;
    const ground = fill(W, H, T.VOID);
    const objects = fill(W, H, T.WALL);

    // Carve rooms and corridors
    // Entry hall
    rect(objects, 18, 0, 5, 8, 0);
    rect(ground, 18, 0, 5, 8, T.STONE);

    // Central hub
    rect(objects, 15, 8, 15, 12, 0);
    rect(ground, 15, 8, 15, 12, T.STONE);

    // West wing
    rect(objects, 3, 12, 12, 8, 0);
    rect(ground, 3, 12, 12, 8, T.STONE);
    rect(objects, 5, 10, 3, 2, 0);
    rect(ground, 5, 10, 3, 2, T.STONE);

    // East wing
    rect(objects, 30, 10, 12, 8, 0);
    rect(ground, 30, 10, 12, 8, T.STONE);

    // South corridor
    rect(objects, 20, 20, 3, 8, 0);
    rect(ground, 20, 20, 3, 8, T.STONE);

    // Boss arena
    rect(objects, 12, 28, 20, 10, 0);
    rect(ground, 12, 28, 20, 10, T.STONE);
    // Lava moat
    rect(ground, 13, 29, 18, 1, T.LAVA);
    rect(ground, 13, 37, 18, 1, T.LAVA);
    rect(ground, 13, 29, 1, 9, T.LAVA);
    rect(ground, 30, 29, 1, 9, T.LAVA);

    // Crystal formations
    ground[32][20] = T.CRYSTAL;
    ground[32][24] = T.CRYSTAL;
    ground[34][22] = T.CRYSTAL;

    return {
      id: 'abyss',
      name: 'The Abyss',
      width: W, height: H,
      ground, objects,
      playerStart: { x: 20, y: 1 },
      music: 'dungeon',
      ambience: 'dark',
      spawns: [
        { type: 'enemy', enemyType: 'dark_knight', x: 18, y: 12, level: 10 },
        { type: 'enemy', enemyType: 'dark_knight', x: 26, y: 14, level: 10 },
        { type: 'enemy', enemyType: 'ghost', x: 6, y: 14, level: 9 },
        { type: 'enemy', enemyType: 'ghost', x: 12, y: 16, level: 9 },
        { type: 'enemy', enemyType: 'skeleton', x: 35, y: 12, level: 8 },
        { type: 'enemy', enemyType: 'skeleton', x: 38, y: 15, level: 9 },
        { type: 'enemy', enemyType: 'golem', x: 8, y: 18, level: 10 },
        { type: 'boss', enemyType: 'dark_knight', x: 22, y: 33, level: 18, name: 'Abyssal Lord' },
        { type: 'chest', x: 40, y: 11, loot: 'random', level: 10 },
        { type: 'chest', x: 4, y: 13, loot: 'random', level: 9 }
      ],
      exits: [
        { x: 20, y: 0, target: 'frostpeak', spawnX: 42, spawnY: 20 },
        { x: 21, y: 0, target: 'frostpeak', spawnX: 43, spawnY: 20 },
        { x: 0, y: 15, target: 'sunscorch', spawnX: 48, spawnY: 20 },
        { x: 0, y: 16, target: 'sunscorch', spawnX: 48, spawnY: 21 },
        // After beating boss, portal to Crystal Sanctum
        { x: 22, y: 33, target: 'crystal_sanctum', spawnX: 15, spawnY: 28, requireBoss: 'Abyssal Lord' }
      ]
    };
  }

  // ======== CRYSTAL SANCTUM (Endgame) ========
  function createCrystalSanctum() {
    const W = 30, H = 30;
    const ground = fill(W, H, T.CRYSTAL);
    const objects = fill(W, H, T.WALL);

    // Crystal cavern
    rect(objects, 10, 25, 10, 5, 0);
    rect(ground, 10, 25, 10, 5, T.CRYSTAL);

    // Central path
    rect(objects, 13, 10, 4, 15, 0);
    rect(ground, 13, 10, 4, 15, T.CRYSTAL);

    // Boss arena
    rect(objects, 5, 3, 20, 10, 0);
    rect(ground, 5, 3, 20, 10, T.CRYSTAL);

    // Decorative void borders
    rect(ground, 6, 4, 18, 1, T.VOID);
    rect(ground, 6, 12, 18, 1, T.VOID);
    rect(ground, 6, 4, 1, 9, T.VOID);
    rect(ground, 23, 4, 1, 9, T.VOID);
    // Inner floor
    rect(ground, 7, 5, 16, 7, T.STONE);
    rect(ground, 10, 6, 10, 5, T.CRYSTAL);

    return {
      id: 'crystal_sanctum',
      name: 'Crystal Sanctum',
      width: W, height: H,
      ground, objects,
      playerStart: { x: 15, y: 28 },
      music: 'final',
      ambience: 'crystal',
      spawns: [
        { type: 'enemy', enemyType: 'dark_knight', x: 14, y: 20, level: 15 },
        { type: 'enemy', enemyType: 'dark_knight', x: 16, y: 18, level: 15 },
        { type: 'boss', enemyType: 'dragon', x: 15, y: 7, level: 25, name: 'Crystal Dragon', isFinalBoss: true },
        { type: 'chest', x: 15, y: 5, loot: 'legendary', level: 15 }
      ],
      exits: [
        { x: 15, y: 29, target: 'abyss', spawnX: 22, spawnY: 32 }
      ]
    };
  }

  // Zone registry
  const creators = {
    eldergrove: createEldergrove,
    whisperwood: createWhisperwood,
    shadowmere: createShadowmere,
    sunscorch: createSunscorch,
    frostpeak: createFrostpeak,
    abyss: createAbyss,
    crystal_sanctum: createCrystalSanctum
  };

  function getZone(id) {
    if (!creators[id]) return null;
    return creators[id]();
  }

  function getAllZoneIds() {
    return Object.keys(creators);
  }

  return { getZone, getAllZoneIds };
})();
