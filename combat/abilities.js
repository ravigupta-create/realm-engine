// combat/abilities.js — Skills, spells, status effects

const Abilities = (() => {
  // Skill database
  const skills = {
    // ======== WARRIOR SKILLS ========
    cleave: {
      id: 'cleave', name: 'Cleave', class: 'warrior', levelReq: 1,
      mpCost: 8, power: 1.5, type: 'damage', damageType: 'physical',
      desc: 'A powerful sweeping attack.', sfx: 'slash', particleType: 'hit'
    },
    shield_bash: {
      id: 'shield_bash', name: 'Shield Bash', class: 'warrior', levelReq: 3,
      mpCost: 10, power: 1.2, type: 'damage', damageType: 'physical',
      statusEffect: 'stun', statusChance: 0.35, statusDuration: 1,
      desc: 'Bash with shield. May stun.', sfx: 'hit', particleType: 'hit'
    },
    war_cry: {
      id: 'war_cry', name: 'War Cry', class: 'warrior', levelReq: 5,
      mpCost: 15, type: 'buff', effect: 'berserk', duration: 3,
      buffData: { strBonus: 10 },
      desc: 'Boost attack power for 3 turns.'
    },
    berserk: {
      id: 'berserk', name: 'Berserk', class: 'warrior', levelReq: 8,
      mpCost: 20, power: 2.5, type: 'damage', damageType: 'physical',
      desc: 'Reckless all-out attack.', sfx: 'slash', particleType: 'hit'
    },
    iron_wall: {
      id: 'iron_wall', name: 'Iron Wall', class: 'warrior', levelReq: 6,
      mpCost: 12, type: 'buff', effect: 'iron_wall', duration: 3,
      buffData: { defBonus: 15 },
      desc: 'Greatly boost defense for 3 turns.'
    },
    ground_slam: {
      id: 'ground_slam', name: 'Ground Slam', class: 'warrior', levelReq: 10,
      mpCost: 25, power: 2.0, type: 'damage', damageType: 'physical',
      statusEffect: 'stun', statusChance: 0.5, statusDuration: 2,
      desc: 'Slam ground. High stun chance.', sfx: 'hit', particleType: 'hit'
    },
    second_wind: {
      id: 'second_wind', name: 'Second Wind', class: 'warrior', levelReq: 12,
      mpCost: 30, type: 'heal', power: 1.0,
      desc: 'Recover HP based on INT.'
    },
    executioner: {
      id: 'executioner', name: 'Executioner', class: 'warrior', levelReq: 15,
      mpCost: 35, power: 3.5, type: 'damage', damageType: 'physical',
      desc: 'Devastating finishing blow.', sfx: 'slash', particleType: 'hit'
    },

    // ======== MAGE SKILLS ========
    fireball: {
      id: 'fireball', name: 'Fireball', class: 'mage', levelReq: 1,
      mpCost: 10, power: 1.8, type: 'damage', damageType: 'magical',
      statusEffect: 'burn', statusChance: 0.3, statusDuration: 3, statusDamage: 5,
      desc: 'Hurl a fireball. May burn.', sfx: 'magic', particleType: 'fire'
    },
    ice_storm: {
      id: 'ice_storm', name: 'Ice Storm', class: 'mage', levelReq: 3,
      mpCost: 14, power: 1.5, type: 'damage', damageType: 'magical',
      statusEffect: 'freeze', statusChance: 0.25, statusDuration: 1,
      desc: 'Icy blast. May freeze.', sfx: 'magic', particleType: 'ice'
    },
    lightning: {
      id: 'lightning', name: 'Lightning', class: 'mage', levelReq: 5,
      mpCost: 18, power: 2.2, type: 'damage', damageType: 'magical',
      desc: 'Strike with lightning.', sfx: 'magic', particleType: 'magic'
    },
    heal: {
      id: 'heal', name: 'Heal', class: 'mage', levelReq: 2,
      mpCost: 12, type: 'heal', power: 1.5,
      desc: 'Restore HP.', sfx: 'heal', particleType: 'heal'
    },
    barrier: {
      id: 'barrier', name: 'Barrier', class: 'mage', levelReq: 6,
      mpCost: 16, type: 'buff', effect: 'barrier', duration: 3,
      buffData: { defBonus: 20 },
      desc: 'Magic shield for 3 turns.'
    },
    arcane_blast: {
      id: 'arcane_blast', name: 'Arcane Blast', class: 'mage', levelReq: 8,
      mpCost: 22, power: 2.5, type: 'damage', damageType: 'magical',
      desc: 'Pure arcane energy.', sfx: 'magic', particleType: 'magic'
    },
    regen: {
      id: 'regen', name: 'Regenerate', class: 'mage', levelReq: 10,
      mpCost: 20, type: 'buff', effect: 'regen', duration: 5,
      buffData: { damage: 0 },  // Uses 5% maxHP per turn
      desc: 'Heal over time for 5 turns.'
    },
    meteor: {
      id: 'meteor', name: 'Meteor', class: 'mage', levelReq: 15,
      mpCost: 40, power: 4.0, type: 'damage', damageType: 'magical',
      statusEffect: 'burn', statusChance: 0.5, statusDuration: 3, statusDamage: 10,
      desc: 'Call down a meteor.', sfx: 'magic', particleType: 'fire'
    },

    // ======== RANGER SKILLS ========
    power_shot: {
      id: 'power_shot', name: 'Power Shot', class: 'ranger', levelReq: 1,
      mpCost: 8, power: 1.6, type: 'damage', damageType: 'physical',
      desc: 'Charged arrow shot.', sfx: 'hit', particleType: 'hit'
    },
    poison_arrow: {
      id: 'poison_arrow', name: 'Poison Arrow', class: 'ranger', levelReq: 3,
      mpCost: 10, power: 1.0, type: 'damage', damageType: 'physical',
      statusEffect: 'poison', statusChance: 0.6, statusDuration: 4, statusDamage: 8,
      desc: 'Poison-tipped arrow.', sfx: 'hit', particleType: 'hit'
    },
    trap: {
      id: 'trap', name: 'Trap', class: 'ranger', levelReq: 4,
      mpCost: 12, power: 1.3, type: 'damage', damageType: 'physical',
      statusEffect: 'stun', statusChance: 0.4, statusDuration: 1,
      desc: 'Set a trap. May immobilize.', sfx: 'hit', particleType: 'hit'
    },
    double_strike: {
      id: 'double_strike', name: 'Double Strike', class: 'ranger', levelReq: 5,
      mpCost: 14, power: 1.3, type: 'damage', damageType: 'physical',
      desc: 'Strike twice quickly.', sfx: 'slash', particleType: 'hit'
    },
    stealth: {
      id: 'stealth', name: 'Stealth', class: 'ranger', levelReq: 6,
      mpCost: 15, type: 'buff', effect: 'stealth', duration: 2,
      buffData: { agiBonus: 15 },
      desc: 'Increase evasion for 2 turns.'
    },
    multi_shot: {
      id: 'multi_shot', name: 'Multi Shot', class: 'ranger', levelReq: 8,
      mpCost: 20, power: 2.0, type: 'damage', damageType: 'physical',
      desc: 'Barrage of arrows.', sfx: 'hit', particleType: 'hit'
    },
    nature_heal: {
      id: 'nature_heal', name: "Nature's Gift", class: 'ranger', levelReq: 10,
      mpCost: 18, type: 'heal', power: 1.2,
      desc: 'Nature restores your health.'
    },
    assassinate: {
      id: 'assassinate', name: 'Assassinate', class: 'ranger', levelReq: 15,
      mpCost: 35, power: 4.5, type: 'damage', damageType: 'physical',
      desc: 'Lethal precision strike.', sfx: 'slash', particleType: 'hit'
    }
  };

  function getSkill(id) {
    return skills[id] || null;
  }

  function getClassSkills(classType) {
    return Object.values(skills).filter(s => s.class === classType);
  }

  function getAvailableSkills(classType, level) {
    return Object.values(skills).filter(s => s.class === classType && s.levelReq <= level);
  }

  return { skills, getSkill, getClassSkills, getAvailableSkills };
})();
