// data/enemies.js — Enemy types, stats, loot tables

const Enemies = (() => {
  const defs = {
    slime: {
      name: 'Slime',
      baseStats: { hp: 30, mp: 0, str: 6, def: 3, int: 2, agi: 3, luk: 5 },
      xpReward: 15, speed: 1.0, aggroRange: 3,
      abilities: [],
      lootTable: [
        { chance: 0.3, rarity: 'common' },
        { chance: 0.1, rarity: 'uncommon' }
      ],
      materialDrops: [{ item: 'Herb Bundle', chance: 0.2 }]
    },
    bat: {
      name: 'Cave Bat',
      baseStats: { hp: 25, mp: 5, str: 5, def: 2, int: 3, agi: 10, luk: 6 },
      xpReward: 12, speed: 2.0, aggroRange: 5,
      abilities: [],
      lootTable: [
        { chance: 0.25, rarity: 'common' }
      ],
      materialDrops: [{ item: 'Monster Fang', chance: 0.15 }]
    },
    wolf: {
      name: 'Dire Wolf',
      baseStats: { hp: 55, mp: 0, str: 12, def: 6, int: 3, agi: 10, luk: 5 },
      xpReward: 25, speed: 2.5, aggroRange: 5,
      abilities: [
        { name: 'Bite', mpCost: 0, power: 1.4, type: 'damage', damageType: 'physical' }
      ],
      lootTable: [
        { chance: 0.35, rarity: 'common' },
        { chance: 0.15, rarity: 'uncommon' }
      ],
      materialDrops: [{ item: 'Monster Fang', chance: 0.25 }]
    },
    goblin: {
      name: 'Goblin',
      baseStats: { hp: 40, mp: 10, str: 8, def: 5, int: 4, agi: 8, luk: 8 },
      xpReward: 20, speed: 1.5, aggroRange: 4,
      abilities: [
        { name: 'Sneak Attack', mpCost: 5, power: 1.5, type: 'damage', damageType: 'physical' }
      ],
      lootTable: [
        { chance: 0.3, rarity: 'common' },
        { chance: 0.1, rarity: 'uncommon' }
      ],
      materialDrops: [{ item: 'Iron Ore', chance: 0.15 }]
    },
    skeleton: {
      name: 'Skeleton',
      baseStats: { hp: 60, mp: 15, str: 10, def: 8, int: 5, agi: 5, luk: 3 },
      xpReward: 30, speed: 1.2, aggroRange: 4,
      abilities: [
        { name: 'Bone Strike', mpCost: 5, power: 1.3, type: 'damage', damageType: 'physical' }
      ],
      lootTable: [
        { chance: 0.3, rarity: 'common' },
        { chance: 0.15, rarity: 'uncommon' }
      ],
      materialDrops: [{ item: 'Ancient Bone', chance: 0.3 }]
    },
    ghost: {
      name: 'Phantom',
      baseStats: { hp: 45, mp: 40, str: 4, def: 3, int: 14, agi: 8, luk: 10 },
      xpReward: 35, speed: 1.5, aggroRange: 5,
      abilities: [
        { name: 'Shadow Bolt', mpCost: 8, power: 1.6, type: 'damage', damageType: 'magical', sfx: 'magic', particleType: 'magic' },
        { name: 'Life Drain', mpCost: 10, power: 1.2, type: 'damage', damageType: 'magical', statusEffect: 'regen', statusChance: 1.0, statusDuration: 2 }
      ],
      lootTable: [
        { chance: 0.2, rarity: 'uncommon' },
        { chance: 0.1, rarity: 'rare' }
      ],
      materialDrops: [{ item: 'Shadow Essence', chance: 0.15 }]
    },
    scorpion: {
      name: 'Giant Scorpion',
      baseStats: { hp: 70, mp: 10, str: 14, def: 10, int: 3, agi: 7, luk: 4 },
      xpReward: 35, speed: 1.3, aggroRange: 3,
      abilities: [
        { name: 'Venom Sting', mpCost: 5, power: 1.2, type: 'damage', damageType: 'physical',
          statusEffect: 'poison', statusChance: 0.5, statusDuration: 3, statusDamage: 8 }
      ],
      lootTable: [
        { chance: 0.3, rarity: 'uncommon' },
        { chance: 0.1, rarity: 'rare' }
      ],
      materialDrops: [{ item: 'Monster Fang', chance: 0.3 }]
    },
    ice_elemental: {
      name: 'Ice Elemental',
      baseStats: { hp: 80, mp: 50, str: 6, def: 8, int: 16, agi: 6, luk: 8 },
      xpReward: 45, speed: 1.0, aggroRange: 4,
      abilities: [
        { name: 'Frost Ray', mpCost: 10, power: 1.8, type: 'damage', damageType: 'magical',
          statusEffect: 'freeze', statusChance: 0.3, statusDuration: 1 },
        { name: 'Blizzard', mpCost: 18, power: 2.2, type: 'damage', damageType: 'magical' }
      ],
      lootTable: [
        { chance: 0.25, rarity: 'uncommon' },
        { chance: 0.15, rarity: 'rare' }
      ],
      materialDrops: [{ item: 'Frost Shard', chance: 0.3 }]
    },
    golem: {
      name: 'Stone Golem',
      baseStats: { hp: 120, mp: 20, str: 15, def: 18, int: 4, agi: 3, luk: 3 },
      xpReward: 50, speed: 0.8, aggroRange: 3,
      abilities: [
        { name: 'Boulder Toss', mpCost: 10, power: 2.0, type: 'damage', damageType: 'physical',
          statusEffect: 'stun', statusChance: 0.3, statusDuration: 1 }
      ],
      lootTable: [
        { chance: 0.3, rarity: 'uncommon' },
        { chance: 0.15, rarity: 'rare' },
        { chance: 0.05, rarity: 'epic' }
      ],
      materialDrops: [{ item: 'Iron Ore', chance: 0.3 }, { item: 'Silver Ore', chance: 0.15 }]
    },
    dark_knight: {
      name: 'Dark Knight',
      baseStats: { hp: 100, mp: 30, str: 16, def: 14, int: 8, agi: 8, luk: 6 },
      xpReward: 55, speed: 1.5, aggroRange: 5,
      abilities: [
        { name: 'Dark Slash', mpCost: 10, power: 1.8, type: 'damage', damageType: 'physical' },
        { name: 'Shadow Strike', mpCost: 15, power: 2.2, type: 'damage', damageType: 'physical',
          statusEffect: 'poison', statusChance: 0.3, statusDuration: 2, statusDamage: 10 }
      ],
      lootTable: [
        { chance: 0.3, rarity: 'rare' },
        { chance: 0.1, rarity: 'epic' }
      ],
      materialDrops: [{ item: 'Shadow Essence', chance: 0.25 }]
    },
    dragon: {
      name: 'Dragon',
      baseStats: { hp: 200, mp: 60, str: 20, def: 16, int: 18, agi: 10, luk: 10 },
      xpReward: 100, speed: 1.2, aggroRange: 6,
      abilities: [
        { name: 'Fire Breath', mpCost: 15, power: 2.5, type: 'damage', damageType: 'magical',
          statusEffect: 'burn', statusChance: 0.5, statusDuration: 3, statusDamage: 15, sfx: 'magic', particleType: 'fire' },
        { name: 'Tail Whip', mpCost: 8, power: 1.8, type: 'damage', damageType: 'physical',
          statusEffect: 'stun', statusChance: 0.2, statusDuration: 1 },
        { name: 'Dragon Fury', mpCost: 25, power: 3.5, type: 'damage', damageType: 'physical' }
      ],
      lootTable: [
        { chance: 0.5, rarity: 'rare' },
        { chance: 0.3, rarity: 'epic' },
        { chance: 0.1, rarity: 'legendary' }
      ],
      materialDrops: [{ item: 'Dragon Scale', chance: 0.5 }]
    }
  };

  function get(enemyType) {
    return defs[enemyType] || null;
  }

  function getScaledStats(enemyType, level) {
    const data = defs[enemyType];
    if (!data) return null;

    const base = data.baseStats;
    const scale = 1 + (level - 1) * 0.3;

    return {
      hp: Math.floor(base.hp * scale),
      maxHp: Math.floor(base.hp * scale),
      mp: Math.floor(base.mp * scale),
      maxMp: Math.floor(base.mp * scale),
      str: Math.floor(base.str * scale),
      def: Math.floor(base.def * scale),
      int: Math.floor(base.int * scale),
      agi: Math.floor(base.agi * scale),
      luk: Math.floor(base.luk * scale)
    };
  }

  return { defs, get, getScaledStats };
})();
