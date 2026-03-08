// data/crafting.js — Crafting recipes

const Crafting = (() => {
  const recipes = [
    {
      name: 'Iron Sword',
      materials: [{ name: 'Iron Ore', count: 3 }],
      result: { type: 'equipment', slot: 'weapon', name: 'Iron Sword', rarity: 'uncommon', level: 3,
        stats: { str: 8 }, desc: 'A sturdy iron sword.' }
    },
    {
      name: 'Silver Blade',
      materials: [{ name: 'Silver Ore', count: 3 }, { name: 'Iron Ore', count: 1 }],
      result: { type: 'equipment', slot: 'weapon', name: 'Silver Blade', rarity: 'rare', level: 5,
        stats: { str: 14, agi: 3 }, desc: 'A gleaming silver blade.' }
    },
    {
      name: 'Bone Shield',
      materials: [{ name: 'Ancient Bone', count: 4 }, { name: 'Iron Ore', count: 2 }],
      result: { type: 'equipment', slot: 'armor', name: 'Bone Shield Armor', rarity: 'rare', level: 5,
        stats: { def: 12, hp: 20 }, desc: 'Armor reinforced with ancient bones.' }
    },
    {
      name: 'Frost Ring',
      materials: [{ name: 'Frost Shard', count: 3 }, { name: 'Silver Ore', count: 1 }],
      result: { type: 'equipment', slot: 'ring', name: 'Frost Ring', rarity: 'rare', level: 6,
        stats: { int: 8, mp: 15 }, desc: 'A ring crackling with ice magic.' }
    },
    {
      name: 'Shadow Amulet',
      materials: [{ name: 'Shadow Essence', count: 3 }, { name: 'Magic Crystal', count: 2 }],
      result: { type: 'equipment', slot: 'amulet', name: 'Shadow Amulet', rarity: 'epic', level: 8,
        stats: { agi: 10, luk: 5, str: 5 }, desc: 'An amulet pulsing with dark energy.' }
    },
    {
      name: 'Dragon Armor',
      materials: [{ name: 'Dragon Scale', count: 5 }, { name: 'Gold Ore', count: 3 }],
      result: { type: 'equipment', slot: 'armor', name: 'Dragon Scale Armor', rarity: 'legendary', level: 12,
        stats: { def: 25, str: 10, hp: 50 }, desc: 'Legendary armor forged from dragon scales.' }
    },
    {
      name: 'Health Potion',
      materials: [{ name: 'Herb Bundle', count: 2 }],
      result: { type: 'consumable', name: 'Health Potion', effect: 'heal_hp', value: 50, rarity: 'common',
        desc: 'Restores 50 HP.' }
    },
    {
      name: 'Greater Health Potion',
      materials: [{ name: 'Herb Bundle', count: 4 }, { name: 'Magic Crystal', count: 1 }],
      result: { type: 'consumable', name: 'Greater Health Potion', effect: 'heal_hp', value: 150, rarity: 'uncommon',
        desc: 'Restores 150 HP.' }
    },
    {
      name: 'Crystal Staff',
      materials: [{ name: 'Magic Crystal', count: 4 }, { name: 'Ancient Bone', count: 2 }],
      result: { type: 'equipment', slot: 'weapon', name: 'Crystal Staff', rarity: 'epic', level: 8,
        stats: { int: 18, mp: 30 }, desc: 'A staff humming with arcane power.' }
    },
    {
      name: 'Swift Boots',
      materials: [{ name: 'Monster Fang', count: 3 }, { name: 'Frost Shard', count: 2 }],
      result: { type: 'equipment', slot: 'boots', name: 'Windwalker Boots', rarity: 'rare', level: 6,
        stats: { agi: 8, def: 3 }, desc: 'Boots enchanted with wind magic.' }
    },
    {
      name: 'Mana Potion',
      materials: [{ name: 'Herb Bundle', count: 1 }, { name: 'Magic Crystal', count: 1 }],
      result: { type: 'consumable', name: 'Mana Potion', effect: 'heal_mp', value: 30, rarity: 'common',
        desc: 'Restores 30 MP.' }
    },
    {
      name: 'Fire Blade',
      materials: [{ name: 'Iron Ore', count: 3 }, { name: 'Fire Essence', count: 3 }],
      result: { type: 'equipment', slot: 'weapon', name: 'Fire Blade', rarity: 'rare', level: 6,
        stats: { str: 12, int: 4 }, desc: 'A blade wreathed in flame.' }
    },
    {
      name: 'Ice Shield Helm',
      materials: [{ name: 'Ice Shard', count: 4 }, { name: 'Iron Ore', count: 2 }],
      result: { type: 'equipment', slot: 'helmet', name: 'Frostguard Helm', rarity: 'rare', level: 7,
        stats: { def: 8, int: 5, mp: 10 }, desc: 'A helm crackling with ice.' }
    },
    {
      name: 'Shadow Cloak',
      materials: [{ name: 'Shadow Cloth', count: 4 }, { name: 'Shadow Essence', count: 2 }],
      result: { type: 'equipment', slot: 'armor', name: 'Shadow Cloak', rarity: 'epic', level: 9,
        stats: { agi: 12, luk: 8, def: 5 }, desc: 'A cloak woven from pure shadow.' }
    },
    {
      name: 'Crystal Crown',
      materials: [{ name: 'Crystal Dust', count: 5 }, { name: 'Magic Crystal', count: 3 }],
      result: { type: 'equipment', slot: 'helmet', name: 'Crystal Crown', rarity: 'epic', level: 10,
        stats: { int: 15, mp: 30, luk: 5 }, desc: 'A crown of pure crystal.' }
    },
    {
      name: 'Spider Silk Armor',
      materials: [{ name: 'Spider Silk', count: 6 }, { name: 'Iron Ore', count: 2 }],
      result: { type: 'equipment', slot: 'armor', name: 'Silken Mail', rarity: 'uncommon', level: 4,
        stats: { def: 6, agi: 4 }, desc: 'Lightweight silk armor.' }
    },
    {
      name: 'Blood Ring',
      materials: [{ name: 'Blood Ruby', count: 2 }, { name: 'Gold Ore', count: 1 }],
      result: { type: 'equipment', slot: 'ring', name: 'Blood Ring', rarity: 'epic', level: 10,
        stats: { str: 10, hp: 30 }, desc: 'A ring pulsing with blood magic.' }
    },
    {
      name: 'Void Amulet',
      materials: [{ name: 'Void Crystal', count: 3 }, { name: 'Shadow Essence', count: 3 }],
      result: { type: 'equipment', slot: 'amulet', name: 'Void Pendant', rarity: 'legendary', level: 14,
        stats: { int: 18, str: 10, mp: 40, hp: 30 }, desc: 'An amulet from the void itself.' }
    },
    {
      name: 'Thunder Hammer',
      materials: [{ name: 'Lightning Core', count: 3 }, { name: 'Iron Ore', count: 4 }, { name: 'Gold Ore', count: 2 }],
      result: { type: 'equipment', slot: 'weapon', name: 'Thunder Hammer', rarity: 'legendary', level: 14,
        stats: { str: 22, int: 10 }, desc: 'A hammer crackling with lightning.' }
    },
    {
      name: 'Feather Boots',
      materials: [{ name: 'Wind Feather', count: 4 }, { name: 'Spider Silk', count: 2 }],
      result: { type: 'equipment', slot: 'boots', name: 'Featherlight Boots', rarity: 'rare', level: 7,
        stats: { agi: 12, luk: 4 }, desc: 'Incredibly light wind-blessed boots.' }
    },
    {
      name: 'Revive Potion',
      materials: [{ name: 'Herb Bundle', count: 5 }, { name: 'Magic Crystal', count: 2 }, { name: 'Crystal Dust', count: 1 }],
      result: { type: 'consumable', name: 'Revive Potion', effect: 'revive', value: 50, rarity: 'rare',
        desc: 'Revive a fallen ally at 50% HP.' }
    },
    {
      name: 'Strength Tonic',
      materials: [{ name: 'Monster Fang', count: 3 }, { name: 'Herb Bundle', count: 2 }],
      result: { type: 'consumable', name: 'Strength Tonic', effect: 'buff_str', value: 10, rarity: 'uncommon',
        desc: '+10 STR for the battle.' }
    },
    {
      name: 'Elixir',
      materials: [{ name: 'Herb Bundle', count: 6 }, { name: 'Magic Crystal', count: 3 }, { name: 'Crystal Dust', count: 2 }],
      result: { type: 'consumable', name: 'Elixir', effect: 'heal_hp', value: 9999, rarity: 'epic',
        desc: 'Fully restores HP.' }
    },
    {
      name: 'Fishing Rod',
      materials: [{ name: 'Iron Ore', count: 1 }, { name: 'Spider Silk', count: 2 }],
      result: { type: 'consumable', name: 'Fishing Rod', id: 'fishing_rod', effect: 'none', value: 0, rarity: 'uncommon',
        desc: 'Used for fishing at water spots.' }
    }
  ];

  function canCraft(recipe, playerItems) {
    for (const mat of recipe.materials) {
      const count = playerItems.filter(i => i.name === mat.name && i.type === 'material').length;
      if (count < mat.count) return false;
    }
    return true;
  }

  function craft(recipe, player) {
    if (!canCraft(recipe, player.items)) return null;

    // Remove materials
    for (const mat of recipe.materials) {
      let remaining = mat.count;
      for (let i = player.items.length - 1; i >= 0 && remaining > 0; i--) {
        if (player.items[i].name === mat.name && player.items[i].type === 'material') {
          player.items.splice(i, 1);
          remaining--;
        }
      }
    }

    // Create result item (preserve explicit id like 'fishing_rod' if set)
    const item = { ...recipe.result };
    if (!item.id || typeof item.id !== 'string' || item.id.length > 20) {
      item.id = Utils.genId();
    }
    if (item.type === 'equipment') {
      item.sellValue = Math.floor(20 * (item.level || 1) * ({ common: 1, uncommon: 2, rare: 5, epic: 10, legendary: 25 }[item.rarity] || 1));
    }

    player.items.push(item);

    // Event hooks
    if (typeof DailyChallenges !== 'undefined') DailyChallenges.onItemCrafted();
    if (typeof Achievements !== 'undefined') Achievements.onItemCrafted();
    if (typeof Quests !== 'undefined') Quests.onItemCrafted();

    return item;
  }

  function getAvailableRecipes(player) {
    return recipes.map(r => ({
      ...r,
      canCraft: canCraft(r, player.items)
    }));
  }

  return { recipes, canCraft, craft, getAvailableRecipes };
})();
