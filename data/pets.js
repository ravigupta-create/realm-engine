// data/pets.js — Pet companion system

const Pets = (() => {
  const petDefs = {
    baby_slime: {
      name: 'Baby Slime', rarity: 'common', element: 'earth',
      desc: 'A friendly slime that boosts your luck.',
      passive: { luk: 5 },
      combatBonus: { type: 'dot', element: 'poison', chance: 0.1, damage: 3 },
      dropSource: 'slime', dropChance: 0.05
    },
    fire_sprite: {
      name: 'Fire Sprite', rarity: 'uncommon', element: 'fire',
      desc: 'A tiny fire spirit that adds fire damage.',
      passive: { str: 3, int: 3 },
      combatBonus: { type: 'bonus_damage', element: 'fire', amount: 5 },
      dropSource: 'dragon', dropChance: 0.1
    },
    frost_wisp: {
      name: 'Frost Wisp', rarity: 'uncommon', element: 'ice',
      desc: 'An icy wisp that slows enemies.',
      passive: { def: 4, int: 2 },
      combatBonus: { type: 'dot', element: 'freeze', chance: 0.08, damage: 0 },
      dropSource: 'ice_elemental', dropChance: 0.08
    },
    shadow_cat: {
      name: 'Shadow Cat', rarity: 'rare', element: 'dark',
      desc: 'A mysterious cat that boosts critical hits.',
      passive: { agi: 5, luk: 8 },
      combatBonus: { type: 'crit_boost', amount: 0.1 },
      dropSource: 'ghost', dropChance: 0.05
    },
    golden_beetle: {
      name: 'Golden Beetle', rarity: 'rare', element: 'earth',
      desc: 'A shiny beetle that finds extra gold.',
      passive: { luk: 10 },
      combatBonus: { type: 'gold_bonus', multiplier: 1.5 },
      dropSource: 'golem', dropChance: 0.06
    },
    phoenix_chick: {
      name: 'Phoenix Chick', rarity: 'epic', element: 'fire',
      desc: 'A baby phoenix that can revive you once per battle.',
      passive: { hp: 20, mp: 10 },
      combatBonus: { type: 'revive', chance: 1, healPercent: 0.3 },
      dropSource: 'dragon', dropChance: 0.03
    },
    crystal_fairy: {
      name: 'Crystal Fairy', rarity: 'epic', element: 'light',
      desc: 'A radiant fairy that regenerates MP.',
      passive: { mp: 20, int: 5 },
      combatBonus: { type: 'mp_regen', amount: 3 },
      dropSource: 'dark_knight', dropChance: 0.04
    },
    void_dragon: {
      name: 'Void Dragonling', rarity: 'legendary', element: 'dark',
      desc: 'A tiny void dragon. Ultimate companion.',
      passive: { str: 8, int: 8, agi: 5, def: 5 },
      combatBonus: { type: 'bonus_damage', element: 'dark', amount: 15 },
      dropSource: 'dark_knight', dropChance: 0.01
    }
  };

  function tryCapture(enemyType) {
    const results = [];
    for (const [id, pet] of Object.entries(petDefs)) {
      if (pet.dropSource === enemyType && Math.random() < pet.dropChance) {
        results.push(id);
      }
    }
    return results;
  }

  function collectPet(petId) {
    if (!GS.player) return false;
    if (!GS.player.pets) GS.player.pets = [];
    if (GS.player.pets.some(p => p.id === petId)) return false;

    const def = petDefs[petId];
    if (!def) return false;

    const pet = {
      id: petId, name: def.name, rarity: def.rarity, element: def.element,
      level: 1, xp: 0, xpToNext: 50,
      passive: { ...def.passive },
      combatBonus: { ...def.combatBonus }
    };

    GS.player.pets.push(pet);
    Core.addNotification(`Pet obtained: ${def.name}!`, 4);
    if (typeof Achievements !== 'undefined') Achievements.onPetCollected();
    if (typeof AudioManager !== 'undefined') AudioManager.playSFX('levelup');
    return true;
  }

  function setActivePet(petId) {
    if (!GS.player.pets) return;
    const pet = GS.player.pets.find(p => p.id === petId);
    if (pet) {
      GS.player.activePet = pet;
      Core.addNotification(`${pet.name} is now your active pet!`, 2);
    }
  }

  function addXP(pet, amount) {
    if (!pet || pet.level >= 30) return; // Cap at level 30
    pet.xp += amount;
    if (typeof DailyChallenges !== 'undefined') DailyChallenges.onPetXP(amount);
    while (pet.xp >= pet.xpToNext && pet.level < 30) {
      pet.xp -= pet.xpToNext;
      pet.level++;
      pet.xpToNext = Math.floor(50 * Math.pow(1.3, pet.level - 1));
      // Boost passive stats
      for (const k of Object.keys(pet.passive)) {
        pet.passive[k] = Math.floor(pet.passive[k] * 1.1) + 1;
      }
      Core.addNotification(`${pet.name} grew to Lv.${pet.level}!`, 3);
    }
  }

  function getPassiveBonus() {
    if (!GS.player.activePet) return {};
    return GS.player.activePet.passive || {};
  }

  return { petDefs, tryCapture, collectPet, setActivePet, addXP, getPassiveBonus };
})();
