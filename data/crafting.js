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

    // Create result item
    const item = { ...recipe.result, id: Utils.genId() };
    if (item.type === 'equipment') {
      item.sellValue = Math.floor(20 * (item.level || 1) * ({ common: 1, uncommon: 2, rare: 5, epic: 10, legendary: 25 }[item.rarity] || 1));
    }

    player.items.push(item);
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
