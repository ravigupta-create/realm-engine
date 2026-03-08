// data/npcs.js — NPC definitions + dialogue trees

const NPCs = (() => {
  const defs = {
    'Elder Thorn': {
      type: 'elder',
      role: 'quest_giver',
      dialogueTree: {
        start: {
          text: "Welcome, adventurer. The Realm's crystals have been corrupted by a dark force. Only a brave soul can cleanse them.",
          choices: [
            { text: "I'll help. What must I do?", next: 'quest_info' },
            { text: 'Tell me about the crystals.', next: 'lore' },
            { text: 'Goodbye.', next: null }
          ]
        },
        quest_info: {
          text: "Travel to each zone and defeat the guardian boss. When all crystals are cleansed, The Abyss will open. Defeat the Abyssal Lord to save us all.",
          choices: [
            { text: 'I accept this quest!', next: null, action: 'accept_quest', questId: 'main_story' },
            { text: 'Let me prepare first.', next: null }
          ]
        },
        lore: {
          text: "Five crystals sustain the Realm. Each is guarded by a powerful being. In Whisperwood, Shadowmere, Sunscorch, Frostpeak, and The Abyss. The Crystal Sanctum holds the source of the corruption.",
          choices: [
            { text: "I'll cleanse them.", next: 'quest_info' },
            { text: 'Goodbye.', next: null }
          ]
        }
      }
    },

    'Merchant Gale': {
      type: 'merchant',
      role: 'shop',
      shopItems: [
        { name: 'Health Potion', type: 'consumable', effect: 'heal_hp', value: 50, rarity: 'common', cost: 25 },
        { name: 'Greater Health Potion', type: 'consumable', effect: 'heal_hp', value: 150, rarity: 'uncommon', cost: 75 },
        { name: 'Mana Potion', type: 'consumable', effect: 'heal_mp', value: 30, rarity: 'common', cost: 20 },
        { name: 'Greater Mana Potion', type: 'consumable', effect: 'heal_mp', value: 80, rarity: 'uncommon', cost: 60 },
        { name: 'Antidote', type: 'consumable', effect: 'cure_poison', value: 0, rarity: 'common', cost: 15 }
      ],
      dialogueTree: {
        start: {
          text: "Welcome to my shop! Take a look at my wares.",
          choices: [
            { text: 'Buy items', next: null, action: 'open_shop' },
            { text: 'Sell items', next: null, action: 'open_sell' },
            { text: 'Goodbye.', next: null }
          ]
        }
      }
    },

    'Smith Ironhand': {
      type: 'blacksmith',
      role: 'crafter',
      dialogueTree: {
        start: {
          text: "Need something forged? Bring me the right materials and I'll craft you something special.",
          choices: [
            { text: 'Show me what you can craft.', next: null, action: 'open_crafting' },
            { text: 'What materials do I need?', next: 'materials' },
            { text: 'Goodbye.', next: null }
          ]
        },
        materials: {
          text: "Gather Iron Ore from caves, Silver Ore from mountains, bones from skeletons, frost shards from ice elementals. Dragons drop rare scales. Keep everything you find!",
          choices: [
            { text: "Let's craft.", next: null, action: 'open_crafting' },
            { text: 'Goodbye.', next: null }
          ]
        }
      }
    },

    'Healer Willow': {
      type: 'healer',
      role: 'healer',
      dialogueTree: {
        start: {
          text: "You look weary, traveler. Let me restore your strength.",
          choices: [
            { text: 'Heal me please. (Free)', next: null, action: 'full_heal' },
            { text: 'Learn new skills?', next: 'skills' },
            { text: 'Goodbye.', next: null }
          ]
        },
        skills: {
          text: "If you have skill points from leveling up, you can learn new abilities here.",
          choices: [
            { text: 'Show available skills.', next: null, action: 'open_skills' },
            { text: 'Goodbye.', next: null }
          ]
        }
      }
    },

    'Guard Orin': {
      type: 'guard',
      role: 'lore',
      dialogueTree: {
        start: {
          text: "Halt! Oh, you're an adventurer. The forest east of here has grown dangerous. Wolves and goblins lurk within.",
          choices: [
            { text: 'Any advice for the forest?', next: 'advice' },
            { text: 'What lies beyond the forest?', next: 'beyond' },
            { text: 'Goodbye.', next: null }
          ]
        },
        advice: {
          text: "Stock up on potions before heading out. The slimes near the entrance are weak, but deeper in you'll find wolves. Watch your HP!",
          choices: [
            { text: 'Thanks for the tip.', next: null }
          ]
        },
        beyond: {
          text: "The Shadowmere Caves lie east of Whisperwood. Dark creatures dwell there. North of town are the Frostpeak Mountains — bitterly cold and full of ice beasts.",
          choices: [
            { text: 'Thanks for the info.', next: null }
          ]
        }
      }
    },

    'Farmer Pip': {
      type: 'villager',
      role: 'quest_giver',
      dialogueTree: {
        start: {
          text: "Oh no, the wolves have been getting closer to my farm! Could you help thin their numbers?",
          choices: [
            { text: "I'll take care of it.", next: null, action: 'accept_quest', questId: 'kill_wolves' },
            { text: 'Not right now.', next: null }
          ]
        }
      }
    },

    'Ranger Fern': {
      type: 'villager',
      role: 'quest_giver',
      dialogueTree: {
        start: {
          text: "I've set up camp here to study the forest. Strange things have been happening... goblin activity has increased tenfold.",
          choices: [
            { text: 'I can help with the goblins.', next: null, action: 'accept_quest', questId: 'kill_goblins' },
            { text: 'What have you observed?', next: 'observe' },
            { text: 'Goodbye.', next: null }
          ]
        },
        observe: {
          text: "The goblins seem to be searching for something. I found this old map fragment, but I can't make sense of it. Perhaps the Elder in town would know more.",
          choices: [
            { text: "I'll ask the Elder.", next: null },
            { text: 'Goodbye.', next: null }
          ]
        }
      }
    },

    'Desert Nomad': {
      type: 'villager',
      role: 'lore',
      dialogueTree: {
        start: {
          text: "The desert holds ancient ruins from a forgotten civilization. Beware the Sand Wyrm that guards the deepest chamber.",
          choices: [
            { text: 'Tell me about the ruins.', next: 'ruins' },
            { text: 'How do I find the Sand Wyrm?', next: 'wyrm' },
            { text: 'Goodbye.', next: null }
          ]
        },
        ruins: {
          text: "Long ago, a great kingdom stood here. They built temples to harness the crystal's power. But their greed led to their downfall. The ruins are all that remain.",
          choices: [
            { text: 'Interesting...', next: null }
          ]
        },
        wyrm: {
          text: "Head to the northeast corner of the desert. The ruins entrance is there. The Sand Wyrm lurks within. It breathes fire — bring frost protection if you can.",
          choices: [
            { text: 'Thanks for the warning.', next: null }
          ]
        }
      }
    }
  };

  function get(name) {
    return defs[name] || null;
  }

  function getDialogue(name) {
    const npc = defs[name];
    return npc ? npc.dialogueTree : null;
  }

  return { defs, get, getDialogue };
})();
