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
    },
    paladin: {
      name: 'Paladin',
      desc: 'A holy knight with healing and protective abilities.',
      baseStats: {
        hp: 110, maxHp: 110, mp: 50, maxMp: 50,
        str: 12, def: 14, int: 10, agi: 6, luk: 8
      },
      growth: { hp: 13, mp: 5, str: 2, def: 3, int: 2, agi: 1, luk: 1 },
      skillTree: ['holy_strike', 'divine_shield', 'smite', 'lay_on_hands', 'consecrate', 'righteous_fury', 'aura_of_light', 'judgment'],
      startSkills: ['holy_strike'],
      color: '#dda520'
    },
    rogue: {
      name: 'Rogue',
      desc: 'A cunning thief who exploits weaknesses and steals.',
      baseStats: {
        hp: 90, maxHp: 90, mp: 45, maxMp: 45,
        str: 10, def: 6, int: 6, agi: 16, luk: 14
      },
      growth: { hp: 8, mp: 4, str: 2, def: 1, int: 1, agi: 4, luk: 3 },
      skillTree: ['backstab', 'pickpocket', 'smoke_bomb', 'fan_of_knives', 'shadow_dance', 'envenom', 'evasion_mastery', 'death_mark'],
      startSkills: ['backstab'],
      color: '#444'
    },
    necromancer: {
      name: 'Necromancer',
      desc: 'A dark caster who commands the undead and drains life.',
      baseStats: {
        hp: 75, maxHp: 75, mp: 90, maxMp: 90,
        str: 4, def: 5, int: 16, agi: 6, luk: 10
      },
      growth: { hp: 6, mp: 9, str: 0, def: 1, int: 4, agi: 1, luk: 2 },
      skillTree: ['dark_bolt', 'life_drain', 'raise_skeleton', 'curse', 'bone_shield', 'soul_harvest', 'plague', 'army_of_dead'],
      startSkills: ['dark_bolt', 'life_drain'],
      color: '#6a0dad'
    },
    druid: {
      name: 'Druid',
      desc: 'A nature mage who heals, transforms, and summons beasts.',
      baseStats: {
        hp: 95, maxHp: 95, mp: 70, maxMp: 70,
        str: 8, def: 8, int: 14, agi: 10, luk: 10
      },
      growth: { hp: 10, mp: 7, str: 1, def: 2, int: 3, agi: 2, luk: 2 },
      skillTree: ['nature_bolt', 'rejuvenate', 'entangle', 'summon_wolf', 'thorns_aura', 'wild_growth', 'bear_form', 'wrath_of_nature'],
      startSkills: ['nature_bolt', 'rejuvenate'],
      color: '#228b22'
    },
    monk: {
      name: 'Monk',
      desc: 'A martial artist with chi-powered strikes and self-heals.',
      baseStats: {
        hp: 100, maxHp: 100, mp: 60, maxMp: 60,
        str: 12, def: 10, int: 8, agi: 14, luk: 8
      },
      growth: { hp: 11, mp: 5, str: 3, def: 2, int: 1, agi: 3, luk: 1 },
      skillTree: ['palm_strike', 'chi_heal', 'roundhouse', 'inner_peace', 'pressure_point', 'flurry', 'iron_body', 'one_inch_punch'],
      startSkills: ['palm_strike'],
      color: '#d2691e'
    },
    bard: {
      name: 'Bard',
      desc: 'A musical support who buffs allies and debuffs enemies.',
      baseStats: {
        hp: 85, maxHp: 85, mp: 70, maxMp: 70,
        str: 6, def: 6, int: 12, agi: 12, luk: 14
      },
      growth: { hp: 8, mp: 7, str: 1, def: 1, int: 3, agi: 2, luk: 3 },
      skillTree: ['dissonance', 'battle_hymn', 'lullaby', 'healing_melody', 'war_drums', 'cacophony', 'inspire', 'symphony_of_destruction'],
      startSkills: ['dissonance', 'battle_hymn'],
      color: '#ff69b4'
    },
    summoner: {
      name: 'Summoner',
      desc: 'Commands elemental spirits and conjured creatures.',
      baseStats: {
        hp: 70, maxHp: 70, mp: 100, maxMp: 100,
        str: 4, def: 5, int: 18, agi: 6, luk: 10
      },
      growth: { hp: 5, mp: 10, str: 0, def: 1, int: 5, agi: 1, luk: 2 },
      skillTree: ['spirit_bolt', 'summon_fire_spirit', 'summon_golem', 'mana_transfer', 'elemental_surge', 'summon_shadow', 'spirit_link', 'summon_phoenix'],
      startSkills: ['spirit_bolt', 'summon_fire_spirit'],
      color: '#00ced1'
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

    // Check if all skills learned for class
    if (typeof Achievements !== 'undefined') {
      const cls = defs[player.classType];
      if (cls && cls.skillTree.every(id => player.learnedSkillIds.has(id))) {
        Achievements.unlock('all_skills');
      }
    }

    return true;
  }

  function addXP(amount) {
    if (!GS.player || !GS.player.stats) return;
    GS.player.stats.xp += amount;
    // Check level up
    if (typeof Combat !== 'undefined' && Combat.checkLevelUp) {
      Combat.checkLevelUp();
    }
  }

  function getAllClasses() {
    return Object.keys(defs);
  }

  return { defs, getClass, createPlayer, applyLevelUp, addXP, getAvailableSkillUpgrades, learnSkill, getAllClasses };
})();
