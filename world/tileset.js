// world/tileset.js — Tile type mapping and lookup

const Tileset = (() => {
  // Tile type constants
  const T = {
    EMPTY: 0,
    GRASS: 1,
    GRASS2: 2,
    GRASS3: 3,
    DIRT: 4,
    PATH: 5,
    WATER: 6,
    STONE: 7,
    WALL: 8,
    SAND: 9,
    SNOW: 10,
    ICE: 11,
    LAVA: 12,
    CRYSTAL: 13,
    VOID: 14,
    // Object tiles (blocking)
    TREE: 20,
    PINE: 21,
    DEAD_TREE: 22,
    ROCK: 23,
    CHEST: 24,
    CHEST_OPEN: 25,
    DOOR: 26,
    SIGN: 27,
    FLOWER_R: 28,
    FLOWER_B: 29,
    FLOWER_Y: 30,
    CAMPFIRE: 31,
    // Zone transition
    ZONE_EXIT: 50
  };

  // Which tiles block movement
  const solid = new Set([
    T.WATER, T.WALL, T.LAVA, T.VOID,
    T.TREE, T.PINE, T.DEAD_TREE, T.ROCK
  ]);

  // Animated tile frame counter
  let _animFrame = 0;
  let _animTimer = 0;

  function update(dt) {
    _animTimer += dt;
    if (_animTimer >= 0.25) {
      _animTimer -= 0.25;
      _animFrame = (_animFrame + 1) % 4;
    }
  }

  function isSolid(tileType) {
    return solid.has(tileType);
  }

  function isWater(tileType) {
    return tileType === T.WATER;
  }

  function isInteractable(tileType) {
    return tileType === T.CHEST || tileType === T.SIGN || tileType === T.DOOR || tileType === T.ZONE_EXIT;
  }

  function getSprite(tileType) {
    const c = SpriteGen.cache;
    switch (tileType) {
      case T.GRASS: return c.grass;
      case T.GRASS2: return c.grass2;
      case T.GRASS3: return c.grass3;
      case T.DIRT: return c.dirt;
      case T.PATH: return c.path;
      case T.WATER: return c.water[_animFrame];
      case T.STONE: return c.stone;
      case T.WALL: return c.wall;
      case T.SAND: return c.sand;
      case T.SNOW: return c.snow;
      case T.ICE: return c.ice;
      case T.LAVA: return c.lava[_animFrame];
      case T.CRYSTAL: return c.crystal;
      case T.VOID: return c.void_tile;
      case T.CAMPFIRE: return c.campfire[_animFrame];
      default: return null;
    }
  }

  function getObjectSprite(tileType) {
    const c = SpriteGen.cache;
    switch (tileType) {
      case T.TREE: return c.tree;
      case T.PINE: return c.pine;
      case T.DEAD_TREE: return c.dead_tree;
      case T.ROCK: return c.rock;
      case T.CHEST: return c.chest_closed;
      case T.CHEST_OPEN: return c.chest_open;
      case T.DOOR: return c.door;
      case T.SIGN: return c.sign;
      case T.FLOWER_R: return c.flower_red;
      case T.FLOWER_B: return c.flower_blue;
      case T.FLOWER_Y: return c.flower_yellow;
      default: return null;
    }
  }

  // Is this an object tile that renders differently (taller, etc)?
  function isObjectTile(tileType) {
    return tileType >= 20 && tileType < 50;
  }

  // Get the ground tile to show under an object
  function getGroundUnder(tileType, zone) {
    // Default ground for each zone
    const defaults = {
      eldergrove: T.GRASS,
      whisperwood: T.GRASS2,
      shadowmere: T.STONE,
      sunscorch: T.SAND,
      frostpeak: T.SNOW,
      abyss: T.VOID,
      crystal_sanctum: T.CRYSTAL
    };
    return defaults[zone] || T.GRASS;
  }

  return {
    T, isSolid, isWater, isInteractable, getSprite, getObjectSprite,
    isObjectTile, getGroundUnder, update,
    get animFrame() { return _animFrame; }
  };
})();
