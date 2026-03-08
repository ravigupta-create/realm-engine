// data/classes.js — Player classes, stat growth, skill trees

const Classes = (() => {
  const defs = {
    warrior: {
      name: 'Warrior',
      desc: 'A mighty fighter with high strength and defense.',
      baseStats: {
        hp: 120, maxHp: 120, mp: 30, maxMp: 30,
        str: 14, def: 12, int: 6, agi: 8, luk: 8
      },
      growth: { hp: 15, mp: 3, str: 3, def: 3, int: 1, agi: 1, luk: 1 },
      skillTree: ['cleave', 'shield_bash', 'war_cry', 'iron_wall', 'berserk', 'ground_slam', 'second_wind', 'executioner'],
      startSkills: ['cleave'],
      color: '#888'
    },
    mage: {
      name: 'Mage',
      desc: 'A spellcaster with powerful magic and healing.',
      baseStats: {
        hp: 80, maxHp: 80, mp: 80, maxMp: 80,
        str: 5, def: 6, int: 16, agi: 8, luk: 10
      },
      growth: { hp: 8, mp: 8, str: 1, def: 1, int: 4, agi: 1, luk: 2 },
      skillTree: ['fireball', 'heal', 'ice_storm', 'lightning', 'barrier', 'arcane_blast', 'regen', 'meteor'],
      startSkills: ['fireball', 'heal'],
      color: '#3344aa'
    },
    ranger: {
      name: 'Ranger',
      desc: 'A swift hunter with ranged attacks and utility.',
      baseStats: {
        hp: 100, maxHp: 100, mp: 50, maxMp: 50,
        str: 10, def: 8, int: 8, agi: 14, luk: 12
      },
      growth: { hp: 10, mp: 5, str: 2, def: 1, int: 2, agi: 3, luk: 2 },
      skillTree: ['power_shot', 'poison_arrow', 'trap', 'double_strike', 'stealth', 'multi_shot', 'nature_heal', 'assassinate'],
      startSkills: ['power_shot'],
      color: '#2a6a2a'
    }
  };

  function getClass(classType) {
    return defs[classType] || null;
  }

  function createPlayer(classType, name) {
    const cls = defs[classType];
    if (!cls) return null;

    const player = ECS.createEntity();
    player.isPlayer = true;
    player.classType = classType;
    player.name = name || cls.name;
    player.speed = 3;
    player.dir = 'down';
    player.animState = Animations.createAnimState('idle');

    // Stats
    player.stats = { ...cls.baseStats, level: 1, xp: 0, xpToNext: 100, gold: 0 };
    player.gold = 0;

    // Inventory
    player.items = [];
    player.maxSlots = 20;
    player.equipment = {
      weapon: null, armor: null, helmet: null,
      boots: null, ring: null, amulet: null
    };

    // Skills
    player.skills = cls.startSkills.map(id => Abilities.getSkill(id)).filter(Boolean);
    player.skillPoints = 0;
    player.learnedSkillIds = new Set(cls.startSkills);

    // Starting items
    player.items.push({
      id: Utils.genId(), name: 'Health Potion', type: 'consumable',
      effect: 'heal_hp', value: 50, rarity: 'common',
      desc: 'Restores 50 HP.'
    });
    player.items.push({
      id: Utils.genId(), name: 'Health Potion', type: 'consumable',
      effect: 'heal_hp', value: 50, rarity: 'common',
      desc: 'Restores 50 HP.'
    });
    player.items.push({
      id: Utils.genId(), name: 'Mana Potion', type: 'consumable',
      effect: 'heal_mp', value: 30, rarity: 'common',
      desc: 'Restores 30 MP.'
    });

    ECS.addComponent(player, 'player');
    ECS.addComponent(player, 'stats');
    ECS.addComponent(player, 'inventory');

    return player;
  }

  function applyLevelUp(classType, stats) {
    const cls = defs[classType];
    if (!cls) return;

    stats.maxHp += cls.growth.hp;
    stats.maxMp += cls.growth.mp;
    stats.str += cls.growth.str;
    stats.def += cls.growth.def;
    stats.int += cls.growth.int;
    stats.agi += cls.growth.agi;
    stats.luk += cls.growth.luk;
  }

  function getAvailableSkillUpgrades(player) {
    const cls = defs[player.classType];
    if (!cls) return [];

    const available = [];
    for (const skillId of cls.skillTree) {
      if (player.learnedSkillIds && player.learnedSkillIds.has(skillId)) continue;
      const skill = Abilities.getSkill(skillId);
      if (skill && skill.levelReq <= player.stats.level) {
        available.push(skill);
      }
    }
    return available;
  }

  function learnSkill(player, skillId) {
    if (player.skillPoints <= 0) return false;
    const skill = Abilities.getSkill(skillId);
    if (!skill) return false;
    if (player.learnedSkillIds && player.learnedSkillIds.has(skillId)) return false;

    player.skills.push(skill);
    if (!player.learnedSkillIds) player.learnedSkillIds = new Set();
    player.learnedSkillIds.add(skillId);
    player.skillPoints--;
    return true;
  }

  function getAllClasses() {
    return Object.keys(defs);
  }

  return { defs, getClass, createPlayer, applyLevelUp, getAvailableSkillUpgrades, learnSkill, getAllClasses };
})();
