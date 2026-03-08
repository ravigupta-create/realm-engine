// data/enchanting.js — Item enchantment system

const Enchanting = (() => {
  const enchantDefs = {
    // Weapon enchants
    fire_blade: {
      name: 'Flame', slot: 'weapon', tier: 1,
      cost: { gold: 100, materials: { fire_essence: 2 } },
      bonus: { str: 3 }, element: 'fire',
      desc: 'Adds fire damage to weapon'
    },
    ice_blade: {
      name: 'Frost', slot: 'weapon', tier: 1,
      cost: { gold: 100, materials: { ice_shard: 2 } },
      bonus: { int: 3 }, element: 'ice',
      desc: 'Adds ice damage to weapon'
    },
    shadow_blade: {
      name: 'Shadow', slot: 'weapon', tier: 2,
      cost: { gold: 250, materials: { shadow_cloth: 3, void_crystal: 1 } },
      bonus: { str: 5, agi: 3 }, element: 'dark',
      desc: 'Adds dark damage to weapon'
    },
    holy_blade: {
      name: 'Holy', slot: 'weapon', tier: 2,
      cost: { gold: 250, materials: { crystal_dust: 3 } },
      bonus: { int: 5, luk: 3 }, element: 'light',
      desc: 'Adds light damage to weapon'
    },
    vampiric: {
      name: 'Vampiric', slot: 'weapon', tier: 3,
      cost: { gold: 500, materials: { shadow_cloth: 5, blood_ruby: 2 } },
      bonus: { str: 4 }, special: 'lifesteal',
      desc: 'Attacks heal 10% of damage dealt'
    },
    thunderstrike: {
      name: 'Thunder', slot: 'weapon', tier: 3,
      cost: { gold: 500, materials: { lightning_core: 3, crystal_dust: 2 } },
      bonus: { str: 6, agi: 4 }, element: 'lightning',
      desc: 'Chance to stun on hit'
    },

    // Armor enchants
    fortify: {
      name: 'Fortified', slot: 'armor', tier: 1,
      cost: { gold: 100, materials: { iron_ore: 3 } },
      bonus: { def: 5 },
      desc: 'Increased defense'
    },
    vitality: {
      name: 'Vital', slot: 'armor', tier: 1,
      cost: { gold: 100, materials: { herb_bundle: 3 } },
      bonus: { hp: 20 },
      desc: 'Increased max HP'
    },
    arcane_ward: {
      name: 'Warded', slot: 'armor', tier: 2,
      cost: { gold: 250, materials: { crystal_dust: 3, void_crystal: 1 } },
      bonus: { def: 5, mp: 15 },
      desc: 'Magic resistance'
    },
    thorns: {
      name: 'Thorned', slot: 'armor', tier: 2,
      cost: { gold: 250, materials: { iron_ore: 5, ancient_bone: 3 } },
      bonus: { def: 3 }, special: 'thorns',
      desc: 'Reflects 15% damage to attackers'
    },
    phoenix_guard: {
      name: 'Phoenix', slot: 'armor', tier: 3,
      cost: { gold: 750, materials: { fire_essence: 5, crystal_dust: 3 } },
      bonus: { hp: 30, def: 5 }, special: 'auto_revive',
      desc: 'Auto-revive once per battle at 25% HP'
    },

    // Accessory enchants
    lucky: {
      name: 'Lucky', slot: 'accessory', tier: 1,
      cost: { gold: 150, materials: { crystal_dust: 2 } },
      bonus: { luk: 8 },
      desc: 'Increased luck'
    },
    swift: {
      name: 'Swift', slot: 'accessory', tier: 1,
      cost: { gold: 150, materials: { wind_feather: 2 } },
      bonus: { agi: 6 },
      desc: 'Increased speed'
    },
    wise: {
      name: 'Wise', slot: 'accessory', tier: 2,
      cost: { gold: 300, materials: { crystal_dust: 3, herb_bundle: 3 } },
      bonus: { int: 6, mp: 20 },
      desc: 'Increased intelligence and mana'
    },
    berserker: {
      name: 'Berserker', slot: 'accessory', tier: 2,
      cost: { gold: 300, materials: { ancient_bone: 5, blood_ruby: 1 } },
      bonus: { str: 8 }, special: 'berserk_boost',
      desc: '+20% damage when below 30% HP'
    },
    celestial: {
      name: 'Celestial', slot: 'accessory', tier: 3,
      cost: { gold: 1000, materials: { void_crystal: 3, crystal_dust: 5 } },
      bonus: { str: 5, int: 5, agi: 5, def: 5, luk: 5 },
      desc: 'All stats boosted'
    }
  };

  function canEnchant(item, enchantId) {
    const def = enchantDefs[enchantId];
    if (!def) return { ok: false, reason: 'Unknown enchant' };
    if (!item) return { ok: false, reason: 'No item selected' };
    if (item.type !== 'equipment') return { ok: false, reason: 'Can only enchant equipment' };
    if (item.enchant) return { ok: false, reason: 'Item already enchanted' };

    // Check slot compatibility
    const slotMap = {
      weapon: ['weapon'],
      armor: ['armor', 'helmet', 'boots'],
      accessory: ['ring', 'amulet']
    };
    if (!slotMap[def.slot]?.includes(item.slot)) {
      return { ok: false, reason: `This enchant is for ${def.slot} slots` };
    }

    // Check gold
    if ((GS.player.gold || 0) < def.cost.gold) {
      return { ok: false, reason: `Need ${def.cost.gold} gold` };
    }

    // Check materials
    if (def.cost.materials) {
      const inv = GS.player.items || [];
      for (const [matId, qty] of Object.entries(def.cost.materials)) {
        const matName = matId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const have = inv.filter(i => i && i.type === 'material' && (i.name === matName || i.name.toLowerCase() === matId.replace(/_/g, ' '))).length;
        if (have < qty) {
          return { ok: false, reason: `Need ${qty}x ${matName}` };
        }
      }
    }

    return { ok: true };
  }

  function enchantItem(item, enchantId) {
    const check = canEnchant(item, enchantId);
    if (!check.ok) return check;

    const def = enchantDefs[enchantId];

    // Consume gold
    GS.player.gold = (GS.player.gold || 0) - def.cost.gold;
    GS.player.stats.gold = GS.player.gold;

    // Consume materials
    if (def.cost.materials) {
      for (const [matId, qty] of Object.entries(def.cost.materials)) {
        let remaining = qty;
        const items = GS.player.items;
        const matName = matId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        for (let i = items.length - 1; i >= 0 && remaining > 0; i--) {
          if (items[i] && items[i].type === 'material' && (items[i].name === matName || items[i].name.toLowerCase() === matId.replace(/_/g, ' '))) {
            items.splice(i, 1);
            remaining--;
          }
        }
      }
    }

    // Apply enchant
    item.enchant = {
      id: enchantId,
      name: def.name,
      bonus: { ...def.bonus },
      element: def.element || null,
      special: def.special || null
    };

    // Add bonus stats to item
    for (const [stat, val] of Object.entries(def.bonus)) {
      item.stats[stat] = (item.stats[stat] || 0) + val;
    }

    // Update item name
    item.name = `${def.name} ${item.name}`;

    Core.addNotification(`Enchanted: ${item.name}!`, 4);
    if (typeof AudioManager !== 'undefined') AudioManager.playSFX('levelup');
    if (typeof Achievements !== 'undefined') Achievements.onEnchant();
    if (typeof DailyChallenges !== 'undefined') {
      DailyChallenges.onEnchant();
      DailyChallenges.onGoldSpent(def.cost.gold);
    }

    return { ok: true };
  }

  function getAvailableEnchants(item) {
    if (!item || item.type !== 'equipment') return [];
    return Object.entries(enchantDefs)
      .filter(([id]) => canEnchant(item, id).ok)
      .map(([id, def]) => ({ id, ...def }));
  }

  function getAllEnchants() {
    return Object.entries(enchantDefs).map(([id, def]) => ({ id, ...def }));
  }

  return { enchantDefs, canEnchant, enchantItem, getAvailableEnchants, getAllEnchants };
})();
