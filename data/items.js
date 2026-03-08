// data/items.js — Item database + procedural generation

const Items = (() => {
  const rarities = {
    common:    { color: '#aaa', statMult: 1.0, nameColor: '#aaa' },
    uncommon:  { color: '#4a4', statMult: 1.3, nameColor: '#55cc55' },
    rare:      { color: '#44f', statMult: 1.7, nameColor: '#5577ff' },
    epic:      { color: '#a4f', statMult: 2.2, nameColor: '#aa55ff' },
    legendary: { color: '#fa0', statMult: 3.0, nameColor: '#ffaa00' }
  };

  const slotTypes = ['weapon', 'armor', 'helmet', 'boots', 'ring', 'amulet'];

  // Base items by slot
  const baseItems = {
    weapon: [
      { name: 'Sword', str: 5 },
      { name: 'Axe', str: 7 },
      { name: 'Mace', str: 6 },
      { name: 'Dagger', str: 3, agi: 3 },
      { name: 'Staff', int: 6 },
      { name: 'Wand', int: 4, mp: 10 },
      { name: 'Bow', str: 4, agi: 2 },
      { name: 'Spear', str: 5, agi: 1 },
      { name: 'Greatsword', str: 9 },
      { name: 'Katana', str: 5, agi: 3 }
    ],
    armor: [
      { name: 'Leather Armor', def: 4 },
      { name: 'Chainmail', def: 6 },
      { name: 'Plate Armor', def: 8, agi: -1 },
      { name: 'Robe', def: 2, int: 3 },
      { name: 'Scale Armor', def: 5, str: 1 },
      { name: 'Hide Vest', def: 3, agi: 1 }
    ],
    helmet: [
      { name: 'Cap', def: 1 },
      { name: 'Helm', def: 3 },
      { name: 'Hood', def: 1, agi: 2 },
      { name: 'Crown', def: 1, int: 3 },
      { name: 'Headband', agi: 2, luk: 1 }
    ],
    boots: [
      { name: 'Sandals', agi: 1 },
      { name: 'Boots', def: 1, agi: 1 },
      { name: 'Greaves', def: 3 },
      { name: 'Swift Boots', agi: 4 },
      { name: 'Heavy Boots', def: 2, str: 1 }
    ],
    ring: [
      { name: 'Ring', str: 1 },
      { name: 'Band', def: 1 },
      { name: 'Loop', int: 1 },
      { name: 'Signet', luk: 2 },
      { name: 'Seal', str: 1, int: 1 }
    ],
    amulet: [
      { name: 'Pendant', hp: 10 },
      { name: 'Necklace', mp: 10 },
      { name: 'Amulet', def: 2, int: 1 },
      { name: 'Charm', luk: 3 },
      { name: 'Talisman', hp: 5, mp: 5 }
    ]
  };

  // Prefixes (bonus stats)
  const prefixes = [
    { name: 'Iron', str: 2 },
    { name: 'Sturdy', def: 2 },
    { name: 'Swift', agi: 2 },
    { name: 'Lucky', luk: 2 },
    { name: 'Blazing', str: 3, effect: 'fire' },
    { name: 'Frozen', int: 2, def: 1, effect: 'ice' },
    { name: 'Venomous', str: 1, effect: 'poison' },
    { name: 'Radiant', int: 3 },
    { name: 'Shadow', agi: 3 },
    { name: 'Mighty', str: 4 },
    { name: 'Ancient', str: 2, int: 2 },
    { name: 'Brutal', str: 5 },
    { name: 'Mystic', int: 4 },
    { name: 'Divine', hp: 15, mp: 10 },
    { name: 'Cursed', str: 6, def: -2 }
  ];

  // Suffixes (bonus stats)
  const suffixes = [
    { name: 'of Power', str: 2 },
    { name: 'of Protection', def: 3 },
    { name: 'of Wisdom', int: 2 },
    { name: 'of Speed', agi: 2 },
    { name: 'of Fortune', luk: 3 },
    { name: 'of the Bear', hp: 20, str: 1 },
    { name: 'of the Owl', mp: 15, int: 1 },
    { name: 'of the Titan', str: 4, hp: 10 },
    { name: 'of the Phoenix', hp: 10, mp: 10 },
    { name: 'of Shadows', agi: 3, luk: 1 },
    { name: 'of the Dragon', str: 3, int: 3 },
    { name: 'of Eternity', hp: 25, mp: 15, def: 2 }
  ];

  // Consumables
  const consumables = [
    { name: 'Health Potion', type: 'consumable', effect: 'heal_hp', value: 50, rarity: 'common', desc: 'Restores 50 HP.', cost: 25 },
    { name: 'Greater Health Potion', type: 'consumable', effect: 'heal_hp', value: 150, rarity: 'uncommon', desc: 'Restores 150 HP.', cost: 75 },
    { name: 'Supreme Health Potion', type: 'consumable', effect: 'heal_hp', value: 400, rarity: 'rare', desc: 'Restores 400 HP.', cost: 200 },
    { name: 'Mana Potion', type: 'consumable', effect: 'heal_mp', value: 30, rarity: 'common', desc: 'Restores 30 MP.', cost: 20 },
    { name: 'Greater Mana Potion', type: 'consumable', effect: 'heal_mp', value: 80, rarity: 'uncommon', desc: 'Restores 80 MP.', cost: 60 },
    { name: 'Supreme Mana Potion', type: 'consumable', effect: 'heal_mp', value: 200, rarity: 'rare', desc: 'Restores 200 MP.', cost: 150 },
    { name: 'Antidote', type: 'consumable', effect: 'cure_poison', value: 0, rarity: 'common', desc: 'Cures poison.', cost: 15 },
    { name: 'Elixir', type: 'consumable', effect: 'heal_hp', value: 9999, rarity: 'epic', desc: 'Fully restores HP.', cost: 500 },
    { name: 'Full Elixir', type: 'consumable', effect: 'heal_both', value: 9999, rarity: 'legendary', desc: 'Fully restores HP and MP.', cost: 1000 },
    { name: 'Revive Potion', type: 'consumable', effect: 'revive', value: 50, rarity: 'rare', desc: 'Revive a fallen ally at 50% HP.', cost: 250 },
    { name: 'Strength Tonic', type: 'consumable', effect: 'buff_str', value: 10, rarity: 'uncommon', desc: '+10 STR for the battle.', cost: 80 },
    { name: 'Defense Tonic', type: 'consumable', effect: 'buff_def', value: 10, rarity: 'uncommon', desc: '+10 DEF for the battle.', cost: 80 },
    { name: 'Speed Tonic', type: 'consumable', effect: 'buff_agi', value: 10, rarity: 'uncommon', desc: '+10 AGI for the battle.', cost: 80 },
    { name: 'Fishing Rod', type: 'consumable', effect: 'none', value: 0, rarity: 'uncommon', desc: 'Used for fishing at water spots.', cost: 50 }
  ];

  // Crafting materials
  const materials = [
    { name: 'Iron Ore', type: 'material', rarity: 'common', desc: 'Raw iron ore.' },
    { name: 'Silver Ore', type: 'material', rarity: 'uncommon', desc: 'Refined silver ore.' },
    { name: 'Gold Ore', type: 'material', rarity: 'rare', desc: 'Precious gold ore.' },
    { name: 'Monster Fang', type: 'material', rarity: 'common', desc: 'Sharp fang from a beast.' },
    { name: 'Dragon Scale', type: 'material', rarity: 'epic', desc: 'Scale from a dragon.' },
    { name: 'Magic Crystal', type: 'material', rarity: 'rare', desc: 'Crystalized magic.' },
    { name: 'Shadow Essence', type: 'material', rarity: 'epic', desc: 'Dark energy essence.' },
    { name: 'Frost Shard', type: 'material', rarity: 'uncommon', desc: 'Frozen ice shard.' },
    { name: 'Ancient Bone', type: 'material', rarity: 'uncommon', desc: 'Bone from ancient creatures.' },
    { name: 'Herb Bundle', type: 'material', rarity: 'common', desc: 'Medicinal herbs.' },
    { name: 'Spider Silk', type: 'material', rarity: 'common', desc: 'Strong silk from spiders.' },
    { name: 'Wind Feather', type: 'material', rarity: 'uncommon', desc: 'Feather infused with wind.' },
    { name: 'Fire Essence', type: 'material', rarity: 'uncommon', desc: 'Condensed fire energy.' },
    { name: 'Ice Shard', type: 'material', rarity: 'uncommon', desc: 'A shard of eternal ice.' },
    { name: 'Shadow Cloth', type: 'material', rarity: 'rare', desc: 'Cloth woven from shadows.' },
    { name: 'Crystal Dust', type: 'material', rarity: 'rare', desc: 'Powdered magical crystal.' },
    { name: 'Blood Ruby', type: 'material', rarity: 'epic', desc: 'A ruby pulsing with dark power.' },
    { name: 'Void Crystal', type: 'material', rarity: 'epic', desc: 'Crystal from the void between worlds.' },
    { name: 'Lightning Core', type: 'material', rarity: 'epic', desc: 'Core of a lightning elemental.' }
  ];

  function generateItem(level, forceRarity) {
    level = level || 1;

    // Determine rarity
    let rarity;
    if (forceRarity) {
      rarity = forceRarity;
    } else {
      const roll = Math.random();
      if (roll < 0.45) rarity = 'common';
      else if (roll < 0.75) rarity = 'uncommon';
      else if (roll < 0.90) rarity = 'rare';
      else if (roll < 0.97) rarity = 'epic';
      else rarity = 'legendary';
    }

    // Random slot
    const slot = slotTypes[Math.floor(Math.random() * slotTypes.length)];
    const bases = baseItems[slot];
    const base = bases[Math.floor(Math.random() * bases.length)];
    const rarityData = rarities[rarity];

    // Build item
    const item = {
      id: Utils.genId(),
      type: 'equipment',
      slot,
      rarity,
      level,
      stats: {}
    };

    // Apply base stats scaled by level and rarity
    const statKeys = ['str', 'def', 'int', 'agi', 'luk', 'hp', 'mp'];
    for (const key of statKeys) {
      if (base[key]) {
        item.stats[key] = Math.floor(base[key] * (1 + level * 0.3) * rarityData.statMult);
      }
    }

    // Add prefix for uncommon+
    let prefix = null;
    if (rarity !== 'common' && Math.random() > 0.3) {
      prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      for (const key of statKeys) {
        if (prefix[key]) {
          item.stats[key] = (item.stats[key] || 0) + Math.floor(prefix[key] * (1 + level * 0.15));
        }
      }
    }

    // Add suffix for rare+
    let suffix = null;
    if ((rarity === 'rare' || rarity === 'epic' || rarity === 'legendary') && Math.random() > 0.2) {
      suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      for (const key of statKeys) {
        if (suffix[key]) {
          item.stats[key] = (item.stats[key] || 0) + Math.floor(suffix[key] * (1 + level * 0.1));
        }
      }
    }

    // Build name
    let name = '';
    if (prefix) name += prefix.name + ' ';
    name += base.name;
    if (suffix) name += ' ' + suffix.name;
    item.name = name;

    // Description
    const statDesc = Object.entries(item.stats)
      .filter(([, v]) => v !== 0)
      .map(([k, v]) => `${k.toUpperCase()}: ${v > 0 ? '+' : ''}${v}`)
      .join(', ');
    item.desc = `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} ${slot}. ${statDesc}`;

    // Sell value
    const rarityValue = { common: 1, uncommon: 2, rare: 5, epic: 10, legendary: 25 };
    item.sellValue = Math.floor(10 * level * (rarityValue[rarity] || 1));
    item.buyValue = item.sellValue * 3;

    return item;
  }

  function generateConsumable(level) {
    // Filter appropriate potions by level
    const available = consumables.filter(c => {
      if (c.rarity === 'common') return true;
      if (c.rarity === 'uncommon') return level >= 3;
      if (c.rarity === 'rare') return level >= 6;
      if (c.rarity === 'epic') return level >= 10;
      return false;
    });
    const template = available[Math.floor(Math.random() * available.length)];
    return { ...template, id: Utils.genId() };
  }

  function generateMaterial(level) {
    const available = materials.filter(m => {
      if (m.rarity === 'common') return true;
      if (m.rarity === 'uncommon') return level >= 3;
      if (m.rarity === 'rare') return level >= 5;
      if (m.rarity === 'epic') return level >= 8;
      return false;
    });
    const template = available[Math.floor(Math.random() * available.length)];
    return { ...template, id: Utils.genId() };
  }

  function getEquipmentBonus(equipment) {
    const totals = { str: 0, def: 0, int: 0, agi: 0, luk: 0, hp: 0, mp: 0 };
    for (const slot of slotTypes) {
      const item = equipment[slot];
      if (item && item.stats) {
        for (const [key, val] of Object.entries(item.stats)) {
          if (totals[key] !== undefined) totals[key] += val;
        }
      }
    }
    return totals;
  }

  function addToInventory(item) {
    if (!GS.player || !GS.player.items) return false;
    if (GS.player.items.length >= (GS.player.maxSlots || 20)) {
      Core.addNotification('Inventory full!', 2);
      return false;
    }
    if (!item.id) item.id = Utils.genId();
    GS.player.items.push(item);
    return true;
  }

  function getRarityColor(rarity) {
    return rarities[rarity]?.nameColor || '#aaa';
  }

  return {
    generateItem, generateConsumable, generateMaterial,
    getEquipmentBonus, getRarityColor, addToInventory,
    consumables, materials, rarities, slotTypes
  };
})();
