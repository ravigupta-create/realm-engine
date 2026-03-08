// data/enemies.js — Enemy types, stats, loot tables

const Enemies = (() => {
  const defs = {
    slime: {
      name: 'Slime',
      element: 'earth', weakness: 'fire', resistance: 'earth',
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
      element: 'dark', weakness: 'light',
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
      element: 'none', weakness: 'fire',
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
      element: 'none',
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
      element: 'dark', weakness: 'light', resistance: 'dark',
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
      element: 'dark', weakness: 'light', resistance: 'dark',
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
      element: 'earth', weakness: 'ice',
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
      element: 'ice', weakness: 'fire', resistance: 'ice',
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
      element: 'earth', weakness: 'lightning', resistance: 'earth',
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
      element: 'dark', weakness: 'light', resistance: 'dark',
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
      element: 'fire', weakness: 'ice', resistance: 'fire',
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
    },

    // ======== NEW ENEMIES ========
    spider: {
      name: 'Giant Spider',
      element: 'dark', weakness: 'fire', resistance: 'dark',
      baseStats: { hp: 35, mp: 10, str: 8, def: 4, int: 4, agi: 9, luk: 6 },
      xpReward: 18, speed: 2.0, aggroRange: 4,
      abilities: [
        { name: 'Web Shot', mpCost: 5, power: 0.8, type: 'damage', damageType: 'physical',
          statusEffect: 'stun', statusChance: 0.3, statusDuration: 1 }
      ],
      lootTable: [{ chance: 0.3, rarity: 'common' }],
      materialDrops: [{ item: 'Spider Silk', chance: 0.25 }]
    },
    mushroom: {
      name: 'Toxic Mushroom',
      element: 'earth', weakness: 'fire', resistance: 'earth',
      baseStats: { hp: 45, mp: 20, str: 5, def: 6, int: 8, agi: 3, luk: 8 },
      xpReward: 20, speed: 0.5, aggroRange: 2,
      abilities: [
        { name: 'Spore Cloud', mpCost: 8, power: 0.6, type: 'damage', damageType: 'magical',
          statusEffect: 'poison', statusChance: 0.7, statusDuration: 4, statusDamage: 6 }
      ],
      lootTable: [{ chance: 0.3, rarity: 'common' }],
      materialDrops: [{ item: 'Herb Bundle', chance: 0.4 }]
    },
    fire_imp: {
      name: 'Fire Imp',
      element: 'fire', weakness: 'ice', resistance: 'fire',
      baseStats: { hp: 40, mp: 30, str: 6, def: 4, int: 12, agi: 10, luk: 7 },
      xpReward: 28, speed: 2.0, aggroRange: 5,
      abilities: [
        { name: 'Flame Bolt', mpCost: 6, power: 1.5, type: 'damage', damageType: 'magical', sfx: 'magic', particleType: 'fire' },
        { name: 'Firecracker', mpCost: 10, power: 1.0, type: 'damage', damageType: 'magical',
          statusEffect: 'burn', statusChance: 0.4, statusDuration: 2, statusDamage: 6 }
      ],
      lootTable: [{ chance: 0.3, rarity: 'uncommon' }],
      materialDrops: [{ item: 'Fire Essence', chance: 0.2 }]
    },
    sand_wurm: {
      name: 'Sand Wurm',
      element: 'earth', weakness: 'ice', resistance: 'fire',
      baseStats: { hp: 90, mp: 10, str: 16, def: 12, int: 3, agi: 4, luk: 4 },
      xpReward: 40, speed: 0.8, aggroRange: 3,
      abilities: [
        { name: 'Burrow Strike', mpCost: 5, power: 2.0, type: 'damage', damageType: 'physical' },
        { name: 'Sand Blast', mpCost: 8, power: 1.3, type: 'damage', damageType: 'physical',
          statusEffect: 'stun', statusChance: 0.2, statusDuration: 1 }
      ],
      lootTable: [{ chance: 0.3, rarity: 'uncommon' }, { chance: 0.1, rarity: 'rare' }],
      materialDrops: [{ item: 'Iron Ore', chance: 0.2 }]
    },
    wraith: {
      name: 'Wraith',
      element: 'dark', weakness: 'light', resistance: 'dark',
      baseStats: { hp: 50, mp: 50, str: 5, def: 3, int: 16, agi: 12, luk: 10 },
      xpReward: 40, speed: 1.5, aggroRange: 5,
      abilities: [
        { name: 'Soul Rend', mpCost: 10, power: 1.8, type: 'damage', damageType: 'magical' },
        { name: 'Wail', mpCost: 8, power: 1.0, type: 'damage', damageType: 'magical',
          statusEffect: 'freeze', statusChance: 0.3, statusDuration: 1 }
      ],
      lootTable: [{ chance: 0.2, rarity: 'uncommon' }, { chance: 0.15, rarity: 'rare' }],
      materialDrops: [{ item: 'Shadow Essence', chance: 0.3 }]
    },
    treant: {
      name: 'Corrupted Treant',
      element: 'earth', weakness: 'fire', resistance: 'earth',
      baseStats: { hp: 110, mp: 20, str: 14, def: 16, int: 6, agi: 2, luk: 4 },
      xpReward: 45, speed: 0.6, aggroRange: 3,
      abilities: [
        { name: 'Root Slam', mpCost: 8, power: 1.6, type: 'damage', damageType: 'physical',
          statusEffect: 'stun', statusChance: 0.3, statusDuration: 1 },
        { name: 'Thorn Barrage', mpCost: 10, power: 1.2, type: 'damage', damageType: 'physical' }
      ],
      lootTable: [{ chance: 0.3, rarity: 'uncommon' }, { chance: 0.1, rarity: 'rare' }],
      materialDrops: [{ item: 'Herb Bundle', chance: 0.3 }, { item: 'Ancient Bone', chance: 0.1 }]
    },
    harpy: {
      name: 'Harpy',
      element: 'wind', weakness: 'lightning', resistance: 'earth',
      baseStats: { hp: 50, mp: 25, str: 9, def: 5, int: 10, agi: 14, luk: 8 },
      xpReward: 30, speed: 2.5, aggroRange: 5,
      abilities: [
        { name: 'Dive Bomb', mpCost: 8, power: 1.6, type: 'damage', damageType: 'physical' },
        { name: 'Screech', mpCost: 6, power: 0.5, type: 'damage', damageType: 'magical',
          statusEffect: 'stun', statusChance: 0.3, statusDuration: 1 }
      ],
      lootTable: [{ chance: 0.25, rarity: 'common' }, { chance: 0.15, rarity: 'uncommon' }],
      materialDrops: [{ item: 'Wind Feather', chance: 0.3 }]
    },
    mimic: {
      name: 'Mimic',
      element: 'dark', weakness: 'light',
      baseStats: { hp: 75, mp: 20, str: 14, def: 12, int: 8, agi: 8, luk: 15 },
      xpReward: 50, speed: 0, aggroRange: 1,
      abilities: [
        { name: 'Chomp', mpCost: 0, power: 2.0, type: 'damage', damageType: 'physical' },
        { name: 'Gold Spit', mpCost: 10, power: 1.5, type: 'damage', damageType: 'physical' }
      ],
      lootTable: [{ chance: 0.5, rarity: 'rare' }, { chance: 0.2, rarity: 'epic' }],
      materialDrops: [{ item: 'Crystal Dust', chance: 0.3 }]
    },
    gargoyle: {
      name: 'Gargoyle',
      element: 'earth', weakness: 'lightning',
      baseStats: { hp: 95, mp: 15, str: 14, def: 18, int: 5, agi: 6, luk: 5 },
      xpReward: 42, speed: 1.0, aggroRange: 4,
      abilities: [
        { name: 'Stone Fist', mpCost: 5, power: 1.5, type: 'damage', damageType: 'physical' },
        { name: 'Petrify Gaze', mpCost: 10, power: 0.8, type: 'damage', damageType: 'magical',
          statusEffect: 'stun', statusChance: 0.4, statusDuration: 2 }
      ],
      lootTable: [{ chance: 0.3, rarity: 'uncommon' }, { chance: 0.1, rarity: 'rare' }],
      materialDrops: [{ item: 'Iron Ore', chance: 0.2 }]
    },
    necromancer_enemy: {
      name: 'Dark Necromancer',
      element: 'dark', weakness: 'light', resistance: 'dark',
      baseStats: { hp: 70, mp: 80, str: 5, def: 6, int: 20, agi: 7, luk: 8 },
      xpReward: 60, speed: 1.0, aggroRange: 5,
      abilities: [
        { name: 'Death Bolt', mpCost: 10, power: 2.0, type: 'damage', damageType: 'magical' },
        { name: 'Life Siphon', mpCost: 15, power: 1.5, type: 'damage', damageType: 'magical',
          statusEffect: 'regen', statusChance: 1.0, statusDuration: 2 },
        { name: 'Curse of Weakness', mpCost: 12, power: 0.5, type: 'damage', damageType: 'magical',
          statusEffect: 'poison', statusChance: 0.8, statusDuration: 4, statusDamage: 12 }
      ],
      lootTable: [{ chance: 0.3, rarity: 'rare' }, { chance: 0.1, rarity: 'epic' }],
      materialDrops: [{ item: 'Shadow Essence', chance: 0.3 }, { item: 'Ancient Bone', chance: 0.2 }]
    },
    frost_wolf: {
      name: 'Frost Wolf',
      element: 'ice', weakness: 'fire', resistance: 'ice',
      baseStats: { hp: 65, mp: 10, str: 13, def: 7, int: 5, agi: 12, luk: 6 },
      xpReward: 30, speed: 2.5, aggroRange: 5,
      abilities: [
        { name: 'Ice Fang', mpCost: 5, power: 1.5, type: 'damage', damageType: 'physical',
          statusEffect: 'freeze', statusChance: 0.2, statusDuration: 1 }
      ],
      lootTable: [{ chance: 0.35, rarity: 'common' }, { chance: 0.15, rarity: 'uncommon' }],
      materialDrops: [{ item: 'Ice Shard', chance: 0.2 }, { item: 'Monster Fang', chance: 0.2 }]
    },
    lava_golem: {
      name: 'Lava Golem',
      element: 'fire', weakness: 'ice', resistance: 'fire',
      baseStats: { hp: 150, mp: 30, str: 18, def: 20, int: 8, agi: 2, luk: 3 },
      xpReward: 65, speed: 0.6, aggroRange: 3,
      abilities: [
        { name: 'Magma Smash', mpCost: 10, power: 2.2, type: 'damage', damageType: 'physical',
          statusEffect: 'burn', statusChance: 0.4, statusDuration: 3, statusDamage: 12 },
        { name: 'Lava Pool', mpCost: 15, power: 1.5, type: 'damage', damageType: 'magical' }
      ],
      lootTable: [{ chance: 0.3, rarity: 'rare' }, { chance: 0.1, rarity: 'epic' }],
      materialDrops: [{ item: 'Fire Essence', chance: 0.3 }, { item: 'Iron Ore', chance: 0.2 }]
    },
    shadow_assassin: {
      name: 'Shadow Assassin',
      element: 'dark', weakness: 'light', resistance: 'dark',
      baseStats: { hp: 60, mp: 30, str: 14, def: 5, int: 8, agi: 18, luk: 12 },
      xpReward: 48, speed: 3.0, aggroRange: 6,
      abilities: [
        { name: 'Shadow Strike', mpCost: 8, power: 2.2, type: 'damage', damageType: 'physical' },
        { name: 'Vanish', mpCost: 10, power: 0, type: 'damage', damageType: 'physical',
          statusEffect: 'stun', statusChance: 0.5, statusDuration: 1 }
      ],
      lootTable: [{ chance: 0.25, rarity: 'uncommon' }, { chance: 0.15, rarity: 'rare' }],
      materialDrops: [{ item: 'Shadow Cloth', chance: 0.25 }]
    },
    crystal_golem: {
      name: 'Crystal Golem',
      element: 'light', weakness: 'dark', resistance: 'light',
      baseStats: { hp: 130, mp: 40, str: 16, def: 20, int: 12, agi: 3, luk: 5 },
      xpReward: 55, speed: 0.7, aggroRange: 3,
      abilities: [
        { name: 'Crystal Smash', mpCost: 10, power: 1.8, type: 'damage', damageType: 'physical' },
        { name: 'Prism Beam', mpCost: 15, power: 2.0, type: 'damage', damageType: 'magical' }
      ],
      lootTable: [{ chance: 0.3, rarity: 'rare' }, { chance: 0.15, rarity: 'epic' }],
      materialDrops: [{ item: 'Crystal Dust', chance: 0.4 }]
    },
    demon: {
      name: 'Lesser Demon',
      element: 'fire', weakness: 'light', resistance: 'dark',
      baseStats: { hp: 85, mp: 40, str: 15, def: 10, int: 14, agi: 10, luk: 6 },
      xpReward: 50, speed: 1.5, aggroRange: 5,
      abilities: [
        { name: 'Hellfire', mpCost: 12, power: 2.0, type: 'damage', damageType: 'magical',
          statusEffect: 'burn', statusChance: 0.4, statusDuration: 3, statusDamage: 10, sfx: 'magic', particleType: 'fire' },
        { name: 'Demon Claw', mpCost: 5, power: 1.6, type: 'damage', damageType: 'physical' }
      ],
      lootTable: [{ chance: 0.3, rarity: 'rare' }, { chance: 0.1, rarity: 'epic' }],
      materialDrops: [{ item: 'Fire Essence', chance: 0.2 }, { item: 'Blood Ruby', chance: 0.1 }]
    },
    lich: {
      name: 'Lich',
      element: 'dark', weakness: 'light', resistance: 'dark',
      baseStats: { hp: 90, mp: 100, str: 6, def: 8, int: 22, agi: 6, luk: 10 },
      xpReward: 70, speed: 1.0, aggroRange: 5,
      abilities: [
        { name: 'Death Ray', mpCost: 15, power: 2.5, type: 'damage', damageType: 'magical' },
        { name: 'Soul Fire', mpCost: 12, power: 1.8, type: 'damage', damageType: 'magical',
          statusEffect: 'burn', statusChance: 0.5, statusDuration: 3, statusDamage: 15 },
        { name: 'Dark Shield', mpCost: 10, power: 0, type: 'damage', damageType: 'magical' }
      ],
      lootTable: [{ chance: 0.4, rarity: 'rare' }, { chance: 0.2, rarity: 'epic' }],
      materialDrops: [{ item: 'Shadow Essence', chance: 0.3 }, { item: 'Void Crystal', chance: 0.1 }]
    },
    yeti: {
      name: 'Yeti',
      element: 'ice', weakness: 'fire', resistance: 'ice',
      baseStats: { hp: 130, mp: 15, str: 18, def: 14, int: 4, agi: 6, luk: 5 },
      xpReward: 55, speed: 1.2, aggroRange: 4,
      abilities: [
        { name: 'Frost Slam', mpCost: 8, power: 2.0, type: 'damage', damageType: 'physical',
          statusEffect: 'freeze', statusChance: 0.3, statusDuration: 1 },
        { name: 'Blizzard Roar', mpCost: 12, power: 1.5, type: 'damage', damageType: 'magical' }
      ],
      lootTable: [{ chance: 0.3, rarity: 'uncommon' }, { chance: 0.15, rarity: 'rare' }],
      materialDrops: [{ item: 'Ice Shard', chance: 0.3 }, { item: 'Monster Fang', chance: 0.2 }]
    },
    blood_knight: {
      name: 'Blood Knight',
      element: 'dark', weakness: 'light',
      baseStats: { hp: 120, mp: 35, str: 18, def: 16, int: 10, agi: 9, luk: 7 },
      xpReward: 65, speed: 1.5, aggroRange: 5,
      abilities: [
        { name: 'Blood Slash', mpCost: 8, power: 1.8, type: 'damage', damageType: 'physical' },
        { name: 'Vampiric Strike', mpCost: 12, power: 1.5, type: 'damage', damageType: 'physical',
          statusEffect: 'regen', statusChance: 1.0, statusDuration: 2 },
        { name: 'Crimson Wave', mpCost: 18, power: 2.5, type: 'damage', damageType: 'physical' }
      ],
      lootTable: [{ chance: 0.35, rarity: 'rare' }, { chance: 0.15, rarity: 'epic' }],
      materialDrops: [{ item: 'Blood Ruby', chance: 0.2 }, { item: 'Shadow Cloth', chance: 0.15 }]
    },
    elemental_lord: {
      name: 'Elemental Lord',
      element: 'fire', weakness: 'ice',
      baseStats: { hp: 180, mp: 80, str: 16, def: 14, int: 22, agi: 8, luk: 8 },
      xpReward: 90, speed: 1.0, aggroRange: 5,
      abilities: [
        { name: 'Elemental Fury', mpCost: 20, power: 2.8, type: 'damage', damageType: 'magical', sfx: 'magic', particleType: 'fire' },
        { name: 'Storm Call', mpCost: 15, power: 2.0, type: 'damage', damageType: 'magical',
          statusEffect: 'stun', statusChance: 0.3, statusDuration: 1 },
        { name: 'Elemental Shield', mpCost: 10, power: 0, type: 'damage', damageType: 'magical' }
      ],
      lootTable: [{ chance: 0.4, rarity: 'rare' }, { chance: 0.25, rarity: 'epic' }, { chance: 0.05, rarity: 'legendary' }],
      materialDrops: [{ item: 'Fire Essence', chance: 0.3 }, { item: 'Lightning Core', chance: 0.15 }]
    },
    void_horror: {
      name: 'Void Horror',
      element: 'dark', weakness: 'light', resistance: 'dark',
      baseStats: { hp: 220, mp: 70, str: 22, def: 18, int: 20, agi: 8, luk: 8 },
      xpReward: 120, speed: 1.0, aggroRange: 6,
      abilities: [
        { name: 'Void Rend', mpCost: 15, power: 2.8, type: 'damage', damageType: 'magical' },
        { name: 'Chaos Bolt', mpCost: 20, power: 3.0, type: 'damage', damageType: 'magical',
          statusEffect: 'poison', statusChance: 0.5, statusDuration: 3, statusDamage: 15 },
        { name: 'Dimensional Rift', mpCost: 25, power: 3.5, type: 'damage', damageType: 'magical' }
      ],
      lootTable: [
        { chance: 0.4, rarity: 'rare' },
        { chance: 0.3, rarity: 'epic' },
        { chance: 0.1, rarity: 'legendary' }
      ],
      materialDrops: [{ item: 'Void Crystal', chance: 0.3 }, { item: 'Shadow Essence', chance: 0.2 }]
    },
    phoenix_enemy: {
      name: 'Phoenix',
      element: 'fire', weakness: 'ice', resistance: 'fire',
      baseStats: { hp: 160, mp: 60, str: 14, def: 12, int: 20, agi: 14, luk: 12 },
      xpReward: 85, speed: 2.0, aggroRange: 5,
      abilities: [
        { name: 'Flame Wing', mpCost: 12, power: 2.2, type: 'damage', damageType: 'magical',
          statusEffect: 'burn', statusChance: 0.5, statusDuration: 3, statusDamage: 12, sfx: 'magic', particleType: 'fire' },
        { name: 'Rebirth Flame', mpCost: 20, power: 1.0, type: 'damage', damageType: 'magical' },
        { name: 'Inferno', mpCost: 25, power: 3.0, type: 'damage', damageType: 'magical', sfx: 'magic', particleType: 'fire' }
      ],
      lootTable: [{ chance: 0.4, rarity: 'rare' }, { chance: 0.2, rarity: 'epic' }],
      materialDrops: [{ item: 'Fire Essence', chance: 0.4 }, { item: 'Wind Feather', chance: 0.2 }]
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
      luk: Math.floor(base.luk * scale),
      // Include elemental data for combat damage calculations
      element: data.element || 'none',
      weakness: data.weakness || null,
      resistance: data.resistance || null
    };
  }

  function getAllEnemies() {
    return Object.entries(defs).map(([type, data]) => ({
      type, name: data.name, level: data.level, element: data.element,
      weakness: data.weakness, resistance: data.resistance,
      stats: data, lootTable: data.lootTable || [], isBoss: data.isBoss || false
    }));
  }

  return { defs, get, getScaledStats, getAllEnemies };
})();
