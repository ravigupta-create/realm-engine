// data/allies.js — Companion/ally party system

const Allies = (() => {
  const allyDefs = {
    guard_orin: {
      id: 'guard_orin', name: 'Guard Orin', spriteType: 'guard', role: 'tank',
      baseStats: { hp: 150, maxHp: 150, mp: 20, maxMp: 20, str: 14, def: 16, int: 5, agi: 8, luk: 6 },
      growth: { hp: 12, mp: 2, str: 3, def: 3, int: 0, agi: 1, luk: 0 },
      abilities: [
        { name: 'Shield Slam', mpCost: 8, power: 1.3, damageType: 'physical', sfx: 'hit' },
        { name: 'Taunt', mpCost: 5, power: 0, type: 'buff', desc: 'Draws enemy attacks' }
      ],
      recruitZone: 'eldergrove', recruitLevel: 1,
      dialogue: "I'll protect you on the road ahead."
    },
    ranger_fern: {
      id: 'ranger_fern', name: 'Ranger Fern', spriteType: 'villager', role: 'dps',
      baseStats: { hp: 100, maxHp: 100, mp: 40, maxMp: 40, str: 10, def: 8, int: 8, agi: 14, luk: 10 },
      growth: { hp: 8, mp: 4, str: 2, def: 1, int: 2, agi: 3, luk: 1 },
      abilities: [
        { name: 'Arrow Volley', mpCost: 10, power: 1.5, damageType: 'physical', sfx: 'hit' },
        { name: 'Poison Shot', mpCost: 8, power: 1.0, damageType: 'physical', statusEffect: 'poison', statusChance: 0.5, statusDuration: 3, statusDamage: 8 }
      ],
      recruitZone: 'whisperwood', recruitLevel: 3,
      dialogue: "The forest is my home. I know every path."
    },
    healer_willow: {
      id: 'healer_willow', name: 'Healer Willow', spriteType: 'healer', role: 'healer',
      baseStats: { hp: 80, maxHp: 80, mp: 80, maxMp: 80, str: 4, def: 6, int: 16, agi: 8, luk: 12 },
      growth: { hp: 6, mp: 8, str: 0, def: 1, int: 4, agi: 1, luk: 2 },
      abilities: [
        { name: 'Healing Light', mpCost: 12, power: 1.5, type: 'heal', sfx: 'heal' },
        { name: 'Holy Bolt', mpCost: 10, power: 1.3, damageType: 'magical', element: 'light', sfx: 'magic' }
      ],
      recruitZone: 'eldergrove', recruitLevel: 5,
      dialogue: "Let me tend to your wounds."
    },
    shadow_blade: {
      id: 'shadow_blade', name: 'Shadow', spriteType: 'guard', role: 'dps',
      baseStats: { hp: 90, maxHp: 90, mp: 50, maxMp: 50, str: 12, def: 6, int: 10, agi: 16, luk: 14 },
      growth: { hp: 7, mp: 5, str: 2, def: 1, int: 2, agi: 4, luk: 2 },
      abilities: [
        { name: 'Backstab', mpCost: 8, power: 2.0, damageType: 'physical', sfx: 'slash' },
        { name: 'Shadow Step', mpCost: 12, power: 1.5, damageType: 'physical', element: 'dark', statusEffect: 'stun', statusChance: 0.25, statusDuration: 1 }
      ],
      recruitZone: 'shadowmere', recruitLevel: 6,
      dialogue: "I work best in the shadows."
    },
    fire_mage: {
      id: 'fire_mage', name: 'Pyra', spriteType: 'mage_npc', role: 'dps',
      baseStats: { hp: 70, maxHp: 70, mp: 100, maxMp: 100, str: 4, def: 4, int: 18, agi: 8, luk: 8 },
      growth: { hp: 5, mp: 10, str: 0, def: 1, int: 5, agi: 1, luk: 1 },
      abilities: [
        { name: 'Inferno', mpCost: 15, power: 2.0, damageType: 'magical', element: 'fire', sfx: 'magic', particleType: 'fire' },
        { name: 'Flame Shield', mpCost: 10, type: 'buff', desc: 'Fire barrier' }
      ],
      recruitZone: 'sunscorch', recruitLevel: 8,
      dialogue: "Fire cleanses all corruption."
    },
    frost_knight: {
      id: 'frost_knight', name: 'Glacius', spriteType: 'guard', role: 'tank',
      baseStats: { hp: 140, maxHp: 140, mp: 40, maxMp: 40, str: 14, def: 14, int: 10, agi: 6, luk: 6 },
      growth: { hp: 10, mp: 3, str: 2, def: 3, int: 2, agi: 1, luk: 0 },
      abilities: [
        { name: 'Frost Strike', mpCost: 10, power: 1.4, damageType: 'physical', element: 'ice', statusEffect: 'freeze', statusChance: 0.3, statusDuration: 1 },
        { name: 'Ice Wall', mpCost: 15, type: 'buff', desc: 'Defense up' }
      ],
      recruitZone: 'frostpeak', recruitLevel: 8,
      dialogue: "The cold makes me stronger."
    }
  };

  // Summon templates (for Necromancer/Summoner skills)
  const summonDefs = {
    skeleton_warrior: {
      name: 'Skeleton Warrior', spriteType: 'guard', role: 'dps',
      stats: { hp: 40, maxHp: 40, mp: 0, maxMp: 0, str: 10, def: 6, int: 2, agi: 6, luk: 2 },
      abilities: [{ name: 'Bone Strike', mpCost: 0, power: 1.2, damageType: 'physical' }]
    },
    fire_spirit: {
      name: 'Fire Spirit', spriteType: 'mage_npc', role: 'dps',
      stats: { hp: 30, maxHp: 30, mp: 30, maxMp: 30, str: 3, def: 3, int: 14, agi: 10, luk: 5 },
      abilities: [{ name: 'Flame Burst', mpCost: 5, power: 1.5, damageType: 'magical', element: 'fire' }]
    },
    nature_golem: {
      name: 'Nature Golem', spriteType: 'guard', role: 'tank',
      stats: { hp: 80, maxHp: 80, mp: 0, maxMp: 0, str: 8, def: 15, int: 2, agi: 2, luk: 2 },
      abilities: [{ name: 'Ground Pound', mpCost: 0, power: 1.3, damageType: 'physical' }]
    },
    shadow_imp: {
      name: 'Shadow Imp', spriteType: 'villager', role: 'support',
      stats: { hp: 25, maxHp: 25, mp: 20, maxMp: 20, str: 5, def: 3, int: 10, agi: 14, luk: 8 },
      abilities: [{ name: 'Dark Bolt', mpCost: 5, power: 1.2, damageType: 'magical', element: 'dark' }]
    }
  };

  function createSummon(type, level) {
    const def = summonDefs[type];
    if (!def) return null;
    const scale = 1 + (level - 1) * 0.2;
    const stats = {};
    for (const [k, v] of Object.entries(def.stats)) {
      stats[k] = typeof v === 'number' ? Math.floor(v * scale) : v;
    }
    return {
      id: Utils.genId(), name: def.name, spriteType: def.spriteType,
      role: def.role, stats, abilities: def.abilities, isSummon: true
    };
  }

  function recruitAlly(allyId) {
    if (!GS.player) return null;
    const def = allyDefs[allyId];
    if (!def) return null;
    if (!GS.player.party) GS.player.party = [];
    if (GS.player.party.some(a => a.id === allyId)) return null; // Already recruited
    if (GS.player.party.length >= 3) {
      Core.addNotification('Party full! (Max 3 allies)', 3);
      return null;
    }

    const ally = {
      id: def.id, name: def.name, spriteType: def.spriteType, role: def.role,
      level: GS.player.stats.level,
      stats: { ...def.baseStats },
      abilities: def.abilities,
      xp: 0, xpToNext: 100, alive: true
    };

    // Scale to player level
    for (let i = 1; i < ally.level; i++) {
      for (const [k, v] of Object.entries(def.growth)) {
        if (ally.stats[k] !== undefined) ally.stats[k] += v;
        if (k === 'hp') ally.stats.maxHp += v;
        if (k === 'mp') ally.stats.maxMp += v;
      }
    }
    ally.stats.hp = ally.stats.maxHp;
    ally.stats.mp = ally.stats.maxMp;

    GS.player.party.push(ally);
    Core.addNotification(`${ally.name} joined the party!`, 4);
    if (typeof AudioManager !== 'undefined') AudioManager.playSFX('levelup');
    if (GS.player.party.length >= 3 && typeof Achievements !== 'undefined') {
      Achievements.unlock('full_party');
    }
    return ally;
  }

  function dismissAlly(allyId) {
    if (!GS.player.party) return;
    GS.player.party = GS.player.party.filter(a => a.id !== allyId);
  }

  function checkAllyLevelUp(ally) {
    const def = allyDefs[ally.id];
    if (!def) return;
    let xpNeeded = Math.floor(100 * Math.pow(1.5, ally.level - 1));
    while (ally.xp >= xpNeeded && ally.level < 40) {
      ally.xp -= xpNeeded;
      ally.level++;
      for (const [k, v] of Object.entries(def.growth)) {
        if (ally.stats[k] !== undefined) ally.stats[k] += v;
        if (k === 'hp') ally.stats.maxHp += v;
        if (k === 'mp') ally.stats.maxMp += v;
      }
      ally.stats.hp = ally.stats.maxHp;
      ally.stats.mp = ally.stats.maxMp;
      Core.addNotification(`${ally.name} leveled up to Lv.${ally.level}!`, 3);
      if (typeof DailyChallenges !== 'undefined') DailyChallenges.onAllyLevelUp();
      xpNeeded = Math.floor(100 * Math.pow(1.5, ally.level - 1)); // Recalculate for next level
    }
  }

  function getAvailableRecruits() {
    const available = [];
    for (const [id, def] of Object.entries(allyDefs)) {
      if (GS.player.party && GS.player.party.some(a => a.id === id)) continue;
      if (GS.player.stats.level >= def.recruitLevel) {
        available.push({ id, ...def });
      }
    }
    return available;
  }

  return { allyDefs, createSummon, recruitAlly, dismissAlly, checkAllyLevelUp, getAvailableRecruits };
})();
