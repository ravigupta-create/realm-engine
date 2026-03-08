// ecs/components.js — Component type definitions with defaults

const Components = (() => {
  const defaults = {
    position: {
      x: 0, y: 0
    },
    sprite: {
      spriteKey: null,
      dir: 'down',
      animState: null
    },
    stats: {
      level: 1,
      xp: 0,
      xpToNext: 100,
      hp: 100, maxHp: 100,
      mp: 50, maxMp: 50,
      str: 10,   // Strength — physical damage
      def: 10,   // Defense — damage reduction
      int: 10,   // Intelligence — magic damage
      agi: 10,   // Agility — speed, dodge
      luk: 10,   // Luck — crits, drops
      gold: 0
    },
    inventory: {
      items: [],       // [{id, name, type, ...}]
      maxSlots: 20,
      equipment: {
        weapon: null,
        armor: null,
        helmet: null,
        boots: null,
        ring: null,
        amulet: null
      }
    },
    ai: {
      aiState: 'idle',   // idle, patrol, chase, flee, attack
      aiTimer: 0,
      patrolDir: { x: 0, y: 0 },
      aggroRange: 4,
      targetEntity: null
    },
    dialogue: {
      dialogueTree: null,
      currentNode: null
    },
    loot: {
      lootTable: [],
      goldDrop: { min: 1, max: 10 }
    },
    questGiver: {
      questIds: []
    },
    enemy: {
      enemyType: 'slime',
      level: 1,
      isBoss: false,
      xpReward: 25,
      abilities: []
    },
    npc: {
      npcType: 'villager',
      shopItems: [],
      trainSkills: []
    },
    chest: {
      opened: false,
      loot: 'random',
      level: 1
    },
    player: {
      isPlayer: true,
      classType: 'warrior',
      skillPoints: 0,
      skills: [],
      activeSkills: [null, null, null, null], // quickslot bindings
      craftingRecipes: []
    }
  };

  return { defaults };
})();
