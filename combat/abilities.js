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
      mpCost: 10, power: 1.8, type: 'damage', damageType: 'magical', element: 'fire',
      statusEffect: 'burn', statusChance: 0.3, statusDuration: 3, statusDamage: 5,
      desc: 'Hurl a fireball. May burn.', sfx: 'magic', particleType: 'fire'
    },
    ice_storm: {
      id: 'ice_storm', name: 'Ice Storm', class: 'mage', levelReq: 3,
      mpCost: 14, power: 1.5, type: 'damage', damageType: 'magical', element: 'ice',
      statusEffect: 'freeze', statusChance: 0.25, statusDuration: 1,
      desc: 'Icy blast. May freeze.', sfx: 'magic', particleType: 'ice'
    },
    lightning: {
      id: 'lightning', name: 'Lightning', class: 'mage', levelReq: 5,
      mpCost: 18, power: 2.2, type: 'damage', damageType: 'magical', element: 'lightning',
      desc: 'Strike with lightning.', sfx: 'lightning', particleType: 'lightning'
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
      mpCost: 22, power: 2.5, type: 'damage', damageType: 'magical', element: 'arcane',
      desc: 'Pure arcane energy.', sfx: 'arcane', particleType: 'magic'
    },
    regen: {
      id: 'regen', name: 'Regenerate', class: 'mage', levelReq: 10,
      mpCost: 20, type: 'buff', effect: 'regen', duration: 5,
      buffData: { damage: 0 },  // Uses 5% maxHP per turn
      desc: 'Heal over time for 5 turns.'
    },
    meteor: {
      id: 'meteor', name: 'Meteor', class: 'mage', levelReq: 15,
      mpCost: 40, power: 4.0, type: 'damage', damageType: 'magical', element: 'fire',
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
      desc: 'Poison-tipped arrow.', sfx: 'poison', particleType: 'poison'
    },
    trap: {
      id: 'trap', name: 'Trap', class: 'ranger', levelReq: 4,
      mpCost: 12, power: 1.3, type: 'damage', damageType: 'physical',
      statusEffect: 'stun', statusChance: 0.4, statusDuration: 1,
      desc: 'Set a trap. May immobilize.', sfx: 'hit', particleType: 'hit'
    },
    double_strike: {
      id: 'double_strike', name: 'Double Strike', class: 'ranger', levelReq: 5,
      mpCost: 14, power: 0.8, type: 'damage', damageType: 'physical',
      hits: 2,
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
    },

    // ======== PALADIN SKILLS ========
    holy_strike: {
      id: 'holy_strike', name: 'Holy Strike', class: 'paladin', levelReq: 1,
      mpCost: 8, power: 1.4, type: 'damage', damageType: 'physical', element: 'light',
      desc: 'A light-infused melee strike.', sfx: 'holy', particleType: 'holy'
    },
    divine_shield: {
      id: 'divine_shield', name: 'Divine Shield', class: 'paladin', levelReq: 3,
      mpCost: 15, type: 'buff', effect: 'divine_shield', duration: 2,
      buffData: { defBonus: 25 },
      desc: 'Impenetrable holy shield for 2 turns.'
    },
    smite: {
      id: 'smite', name: 'Smite', class: 'paladin', levelReq: 4,
      mpCost: 12, power: 2.0, type: 'damage', damageType: 'magical', element: 'light',
      desc: 'Holy light smites the enemy.', sfx: 'holy', particleType: 'holy'
    },
    lay_on_hands: {
      id: 'lay_on_hands', name: 'Lay on Hands', class: 'paladin', levelReq: 6,
      mpCost: 25, type: 'heal', power: 3.0,
      desc: 'Massive single-target heal.', sfx: 'heal', particleType: 'heal'
    },
    consecrate: {
      id: 'consecrate', name: 'Consecrate', class: 'paladin', levelReq: 8,
      mpCost: 18, power: 1.5, type: 'damage', damageType: 'magical', element: 'light',
      aoe: true,
      desc: 'Holy ground damages all enemies.', sfx: 'holy', particleType: 'holy'
    },
    righteous_fury: {
      id: 'righteous_fury', name: 'Righteous Fury', class: 'paladin', levelReq: 10,
      mpCost: 20, type: 'buff', effect: 'berserk', duration: 4,
      buffData: { strBonus: 12, defBonus: 8 },
      desc: 'Holy rage boosts ATK and DEF.'
    },
    aura_of_light: {
      id: 'aura_of_light', name: 'Aura of Light', class: 'paladin', levelReq: 12,
      mpCost: 25, type: 'buff', effect: 'regen', duration: 5,
      buffData: { damage: 0 },
      desc: 'Party-wide healing aura.'
    },
    judgment: {
      id: 'judgment', name: 'Judgment', class: 'paladin', levelReq: 15,
      mpCost: 35, power: 4.0, type: 'damage', damageType: 'magical', element: 'light',
      desc: 'Divine judgment upon the wicked.', sfx: 'holy', particleType: 'holy'
    },

    // ======== ROGUE SKILLS ========
    backstab: {
      id: 'backstab', name: 'Backstab', class: 'rogue', levelReq: 1,
      mpCost: 6, power: 2.0, type: 'damage', damageType: 'physical',
      desc: 'Strike from the shadows.', sfx: 'slash', particleType: 'hit'
    },
    pickpocket: {
      id: 'pickpocket', name: 'Pickpocket', class: 'rogue', levelReq: 2,
      mpCost: 5, power: 0.5, type: 'damage', damageType: 'physical',
      special: 'steal_gold',
      desc: 'Attack and steal gold.', sfx: 'hit', particleType: 'hit'
    },
    smoke_bomb: {
      id: 'smoke_bomb', name: 'Smoke Bomb', class: 'rogue', levelReq: 4,
      mpCost: 10, type: 'buff', effect: 'stealth', duration: 2,
      buffData: { agiBonus: 20 },
      desc: 'Vanish in smoke. High evasion for 2 turns.'
    },
    fan_of_knives: {
      id: 'fan_of_knives', name: 'Fan of Knives', class: 'rogue', levelReq: 6,
      mpCost: 14, power: 1.3, type: 'damage', damageType: 'physical', aoe: true,
      desc: 'Throw knives at all enemies.', sfx: 'slash', particleType: 'hit'
    },
    shadow_dance: {
      id: 'shadow_dance', name: 'Shadow Dance', class: 'rogue', levelReq: 8,
      mpCost: 18, power: 1.8, type: 'damage', damageType: 'physical',
      statusEffect: 'stun', statusChance: 0.4, statusDuration: 1,
      desc: 'Rapid shadow strikes. May stun.', sfx: 'slash', particleType: 'hit'
    },
    envenom: {
      id: 'envenom', name: 'Envenom', class: 'rogue', levelReq: 10,
      mpCost: 15, power: 1.2, type: 'damage', damageType: 'physical',
      statusEffect: 'poison', statusChance: 0.8, statusDuration: 5, statusDamage: 12,
      desc: 'Deadly poison coating.', sfx: 'poison', particleType: 'poison'
    },
    evasion_mastery: {
      id: 'evasion_mastery', name: 'Evasion', class: 'rogue', levelReq: 12,
      mpCost: 20, type: 'buff', effect: 'stealth', duration: 3,
      buffData: { agiBonus: 30 },
      desc: 'Near-untouchable evasion for 3 turns.'
    },
    death_mark: {
      id: 'death_mark', name: 'Death Mark', class: 'rogue', levelReq: 15,
      mpCost: 30, power: 5.0, type: 'damage', damageType: 'physical',
      desc: 'Execute a marked target.', sfx: 'slash', particleType: 'hit'
    },

    // ======== NECROMANCER SKILLS ========
    dark_bolt: {
      id: 'dark_bolt', name: 'Dark Bolt', class: 'necromancer', levelReq: 1,
      mpCost: 8, power: 1.6, type: 'damage', damageType: 'magical', element: 'dark',
      desc: 'A bolt of dark energy.', sfx: 'dark', particleType: 'dark'
    },
    life_drain: {
      id: 'life_drain', name: 'Life Drain', class: 'necromancer', levelReq: 1,
      mpCost: 10, power: 1.2, type: 'damage', damageType: 'magical', element: 'dark',
      special: 'lifesteal',
      desc: 'Drain life from enemy. Heals you.', sfx: 'dark', particleType: 'dark'
    },
    raise_skeleton: {
      id: 'raise_skeleton', name: 'Raise Skeleton', class: 'necromancer', levelReq: 4,
      mpCost: 20, type: 'summon', summonType: 'skeleton_warrior',
      desc: 'Raise a skeleton warrior to fight.', sfx: 'dark', particleType: 'dark'
    },
    curse: {
      id: 'curse', name: 'Curse', class: 'necromancer', levelReq: 5,
      mpCost: 12, power: 0.5, type: 'damage', damageType: 'magical', element: 'dark',
      statusEffect: 'poison', statusChance: 1.0, statusDuration: 5, statusDamage: 10,
      desc: 'Curse the enemy. Guaranteed DoT.', sfx: 'dark', particleType: 'poison'
    },
    bone_shield: {
      id: 'bone_shield', name: 'Bone Shield', class: 'necromancer', levelReq: 7,
      mpCost: 15, type: 'buff', effect: 'iron_wall', duration: 3,
      buffData: { defBonus: 18 },
      desc: 'Shield of bones blocks attacks.'
    },
    soul_harvest: {
      id: 'soul_harvest', name: 'Soul Harvest', class: 'necromancer', levelReq: 9,
      mpCost: 20, power: 1.8, type: 'damage', damageType: 'magical', element: 'dark', aoe: true,
      desc: 'Harvest souls from all enemies.', sfx: 'dark', particleType: 'dark'
    },
    plague: {
      id: 'plague', name: 'Plague', class: 'necromancer', levelReq: 12,
      mpCost: 25, power: 0.8, type: 'damage', damageType: 'magical', element: 'dark', aoe: true,
      statusEffect: 'poison', statusChance: 0.7, statusDuration: 4, statusDamage: 15,
      desc: 'Spread plague to all enemies.', sfx: 'poison', particleType: 'poison'
    },
    army_of_dead: {
      id: 'army_of_dead', name: 'Army of Dead', class: 'necromancer', levelReq: 15,
      mpCost: 45, power: 3.5, type: 'damage', damageType: 'magical', element: 'dark', aoe: true,
      desc: 'Unleash an undead army.', sfx: 'dark', particleType: 'dark'
    },

    // ======== DRUID SKILLS ========
    nature_bolt: {
      id: 'nature_bolt', name: 'Nature Bolt', class: 'druid', levelReq: 1,
      mpCost: 8, power: 1.5, type: 'damage', damageType: 'magical', element: 'earth',
      desc: 'A bolt of natural energy.', sfx: 'earth', particleType: 'earth'
    },
    rejuvenate: {
      id: 'rejuvenate', name: 'Rejuvenate', class: 'druid', levelReq: 1,
      mpCost: 10, type: 'heal', power: 1.3,
      desc: 'Nature heals your wounds.', sfx: 'heal', particleType: 'heal'
    },
    entangle: {
      id: 'entangle', name: 'Entangle', class: 'druid', levelReq: 4,
      mpCost: 12, power: 0.8, type: 'damage', damageType: 'magical', element: 'earth',
      statusEffect: 'stun', statusChance: 0.6, statusDuration: 2,
      desc: 'Roots hold the enemy. High stun.', sfx: 'earth', particleType: 'earth'
    },
    summon_wolf: {
      id: 'summon_wolf', name: 'Summon Wolf', class: 'druid', levelReq: 5,
      mpCost: 18, type: 'summon', summonType: 'nature_golem',
      desc: 'Summon a nature beast to fight.', sfx: 'earth', particleType: 'earth'
    },
    thorns_aura: {
      id: 'thorns_aura', name: 'Thorns Aura', class: 'druid', levelReq: 7,
      mpCost: 15, type: 'buff', effect: 'thorns', duration: 4,
      buffData: { defBonus: 10 },
      desc: 'Thorns damage attackers for 4 turns.'
    },
    wild_growth: {
      id: 'wild_growth', name: 'Wild Growth', class: 'druid', levelReq: 9,
      mpCost: 22, type: 'buff', effect: 'regen', duration: 5,
      buffData: { damage: 0 },
      desc: 'Party-wide HoT for 5 turns.'
    },
    bear_form: {
      id: 'bear_form', name: 'Bear Form', class: 'druid', levelReq: 12,
      mpCost: 25, type: 'buff', effect: 'bear_form', duration: 4,
      buffData: { strBonus: 15, defBonus: 15, hpBonus: 50 },
      desc: 'Transform into a bear. +STR/DEF/HP.'
    },
    wrath_of_nature: {
      id: 'wrath_of_nature', name: 'Wrath of Nature', class: 'druid', levelReq: 15,
      mpCost: 40, power: 3.8, type: 'damage', damageType: 'magical', element: 'earth', aoe: true,
      desc: 'Nature devastates all enemies.', sfx: 'earth', particleType: 'earth'
    },

    // ======== MONK SKILLS ========
    palm_strike: {
      id: 'palm_strike', name: 'Palm Strike', class: 'monk', levelReq: 1,
      mpCost: 6, power: 1.5, type: 'damage', damageType: 'physical',
      desc: 'Chi-focused palm strike.', sfx: 'hit', particleType: 'hit'
    },
    chi_heal: {
      id: 'chi_heal', name: 'Chi Heal', class: 'monk', levelReq: 3,
      mpCost: 12, type: 'heal', power: 1.4,
      desc: 'Channel chi to heal wounds.', sfx: 'heal', particleType: 'heal'
    },
    roundhouse: {
      id: 'roundhouse', name: 'Roundhouse Kick', class: 'monk', levelReq: 4,
      mpCost: 10, power: 1.8, type: 'damage', damageType: 'physical',
      statusEffect: 'stun', statusChance: 0.25, statusDuration: 1,
      desc: 'Spinning kick. May stun.', sfx: 'hit', particleType: 'hit'
    },
    inner_peace: {
      id: 'inner_peace', name: 'Inner Peace', class: 'monk', levelReq: 6,
      mpCost: 18, type: 'buff', effect: 'regen', duration: 4,
      buffData: { damage: 0 },
      desc: 'Meditate to regenerate HP over time.'
    },
    pressure_point: {
      id: 'pressure_point', name: 'Pressure Point', class: 'monk', levelReq: 8,
      mpCost: 14, power: 1.3, type: 'damage', damageType: 'physical',
      statusEffect: 'stun', statusChance: 0.6, statusDuration: 2,
      desc: 'Target a nerve. High stun chance.', sfx: 'hit', particleType: 'hit'
    },
    flurry: {
      id: 'flurry', name: 'Flurry of Blows', class: 'monk', levelReq: 10,
      mpCost: 20, power: 2.5, type: 'damage', damageType: 'physical',
      desc: 'Rapid barrage of punches.', sfx: 'hit', particleType: 'hit'
    },
    iron_body: {
      id: 'iron_body', name: 'Iron Body', class: 'monk', levelReq: 12,
      mpCost: 22, type: 'buff', effect: 'iron_wall', duration: 3,
      buffData: { defBonus: 20, strBonus: 10 },
      desc: 'Harden body. Boost DEF and STR.'
    },
    one_inch_punch: {
      id: 'one_inch_punch', name: 'One Inch Punch', class: 'monk', levelReq: 15,
      mpCost: 35, power: 5.0, type: 'damage', damageType: 'physical',
      desc: 'Devastating close-range strike.', sfx: 'hit', particleType: 'hit'
    },

    // ======== BARD SKILLS ========
    dissonance: {
      id: 'dissonance', name: 'Dissonance', class: 'bard', levelReq: 1,
      mpCost: 8, power: 1.3, type: 'damage', damageType: 'magical',
      desc: 'Jarring notes damage the enemy.', sfx: 'magic', particleType: 'magic'
    },
    battle_hymn: {
      id: 'battle_hymn', name: 'Battle Hymn', class: 'bard', levelReq: 1,
      mpCost: 10, type: 'buff', effect: 'berserk', duration: 3,
      buffData: { strBonus: 8 },
      desc: 'Inspiring song boosts party ATK.'
    },
    lullaby: {
      id: 'lullaby', name: 'Lullaby', class: 'bard', levelReq: 4,
      mpCost: 14, power: 0.5, type: 'damage', damageType: 'magical',
      statusEffect: 'stun', statusChance: 0.5, statusDuration: 2,
      desc: 'Sing the enemy to sleep.', sfx: 'magic', particleType: 'magic'
    },
    healing_melody: {
      id: 'healing_melody', name: 'Healing Melody', class: 'bard', levelReq: 5,
      mpCost: 14, type: 'heal', power: 1.2,
      desc: 'Soothing tune restores HP.', sfx: 'heal', particleType: 'heal'
    },
    war_drums: {
      id: 'war_drums', name: 'War Drums', class: 'bard', levelReq: 7,
      mpCost: 16, type: 'buff', effect: 'berserk', duration: 4,
      buffData: { strBonus: 6, agiBonus: 6 },
      desc: 'Drums boost party ATK and AGI.'
    },
    cacophony: {
      id: 'cacophony', name: 'Cacophony', class: 'bard', levelReq: 9,
      mpCost: 20, power: 1.5, type: 'damage', damageType: 'magical', aoe: true,
      desc: 'Deafening noise hits all enemies.', sfx: 'magic', particleType: 'magic'
    },
    inspire: {
      id: 'inspire', name: 'Inspire', class: 'bard', levelReq: 12,
      mpCost: 25, type: 'buff', effect: 'regen', duration: 4,
      buffData: { damage: 0, strBonus: 5 },
      desc: 'Inspiring ballad: party regen + ATK.'
    },
    symphony_of_destruction: {
      id: 'symphony_of_destruction', name: 'Symphony', class: 'bard', levelReq: 15,
      mpCost: 40, power: 3.5, type: 'damage', damageType: 'magical', aoe: true,
      statusEffect: 'stun', statusChance: 0.4, statusDuration: 1,
      desc: 'Devastating musical finale.', sfx: 'magic', particleType: 'magic'
    },

    // ======== SUMMONER SKILLS ========
    spirit_bolt: {
      id: 'spirit_bolt', name: 'Spirit Bolt', class: 'summoner', levelReq: 1,
      mpCost: 8, power: 1.4, type: 'damage', damageType: 'magical',
      desc: 'A bolt of spirit energy.', sfx: 'magic', particleType: 'magic'
    },
    summon_fire_spirit: {
      id: 'summon_fire_spirit', name: 'Summon Fire Spirit', class: 'summoner', levelReq: 1,
      mpCost: 20, type: 'summon', summonType: 'fire_spirit',
      desc: 'Summon a fire spirit.', sfx: 'magic', particleType: 'fire'
    },
    summon_golem: {
      id: 'summon_golem', name: 'Summon Golem', class: 'summoner', levelReq: 5,
      mpCost: 25, type: 'summon', summonType: 'nature_golem',
      desc: 'Summon a nature golem tank.', sfx: 'magic', particleType: 'heal'
    },
    mana_transfer: {
      id: 'mana_transfer', name: 'Mana Transfer', class: 'summoner', levelReq: 4,
      mpCost: 5, type: 'heal', power: 0.8,
      desc: 'Convert MP to HP.', sfx: 'heal', particleType: 'heal'
    },
    elemental_surge: {
      id: 'elemental_surge', name: 'Elemental Surge', class: 'summoner', levelReq: 7,
      mpCost: 18, power: 2.0, type: 'damage', damageType: 'magical', element: 'fire', aoe: true,
      desc: 'Elemental burst hits all enemies.', sfx: 'magic', particleType: 'fire'
    },
    summon_shadow: {
      id: 'summon_shadow', name: 'Summon Shadow', class: 'summoner', levelReq: 9,
      mpCost: 22, type: 'summon', summonType: 'shadow_imp',
      desc: 'Summon a shadow imp.', sfx: 'magic', particleType: 'magic'
    },
    spirit_link: {
      id: 'spirit_link', name: 'Spirit Link', class: 'summoner', levelReq: 12,
      mpCost: 20, type: 'buff', effect: 'regen', duration: 5,
      buffData: { damage: 0, intBonus: 10 },
      desc: 'Link with spirits. Regen + INT.'
    },
    summon_phoenix: {
      id: 'summon_phoenix', name: 'Summon Phoenix', class: 'summoner', levelReq: 15,
      mpCost: 50, power: 3.0, type: 'damage', damageType: 'magical', element: 'fire', aoe: true,
      special: 'phoenix_summon',
      desc: 'Call a phoenix. Massive fire AoE.', sfx: 'magic', particleType: 'fire'
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
