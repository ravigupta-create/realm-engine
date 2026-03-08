// data/quests.js — Quest definitions + procedural templates

const Quests = (() => {
  // Quest states: available → active → complete → rewarded
  const questDefs = {
    main_story: {
      id: 'main_story', name: 'The Corrupted Crystals', type: 'main',
      desc: 'Defeat all zone bosses to cleanse the crystals and save the Realm.',
      objectives: [
        { type: 'kill_boss', target: 'Stone Guardian', desc: 'Defeat Stone Guardian in Shadowmere', done: false },
        { type: 'kill_boss', target: 'Sand Wyrm', desc: 'Defeat Sand Wyrm in Sunscorch', done: false },
        { type: 'kill_boss', target: 'Frost Titan', desc: 'Defeat Frost Titan in Frostpeak', done: false },
        { type: 'kill_boss', target: 'Abyssal Lord', desc: 'Defeat Abyssal Lord in The Abyss', done: false },
        { type: 'kill_boss', target: 'Crystal Dragon', desc: 'Defeat the Crystal Dragon', done: false }
      ],
      rewards: { xp: 5000, gold: 1000 },
      followUp: null
    },

    kill_wolves: {
      id: 'kill_wolves', name: 'Wolf Problem', type: 'side',
      desc: 'Farmer Pip needs you to deal with the wolves threatening his farm.',
      objectives: [
        { type: 'kill', target: 'wolf', count: 3, current: 0, desc: 'Kill 3 Dire Wolves' }
      ],
      rewards: { xp: 150, gold: 50 }
    },

    kill_goblins: {
      id: 'kill_goblins', name: 'Goblin Menace', type: 'side',
      desc: 'Ranger Fern asks you to clear out the increasing goblin threat.',
      objectives: [
        { type: 'kill', target: 'goblin', count: 5, current: 0, desc: 'Kill 5 Goblins' }
      ],
      rewards: { xp: 200, gold: 75 }
    },

    cave_explorer: {
      id: 'cave_explorer', name: 'Into the Dark', type: 'side',
      desc: 'Explore the Shadowmere Caves and discover what lurks within.',
      objectives: [
        { type: 'visit_zone', target: 'shadowmere', desc: 'Enter Shadowmere Caves', done: false },
        { type: 'kill', target: 'skeleton', count: 3, current: 0, desc: 'Kill 3 Skeletons' }
      ],
      rewards: { xp: 300, gold: 100 }
    },

    desert_trek: {
      id: 'desert_trek', name: 'Desert Crossing', type: 'side',
      desc: 'Brave the Sunscorch Desert and survive its dangers.',
      objectives: [
        { type: 'visit_zone', target: 'sunscorch', desc: 'Enter Sunscorch Desert', done: false },
        { type: 'kill', target: 'scorpion', count: 3, current: 0, desc: 'Kill 3 Giant Scorpions' }
      ],
      rewards: { xp: 400, gold: 150 }
    },

    frost_challenge: {
      id: 'frost_challenge', name: 'Mountain Ascent', type: 'side',
      desc: 'Climb the Frostpeak Mountains and face its frozen guardians.',
      objectives: [
        { type: 'visit_zone', target: 'frostpeak', desc: 'Enter Frostpeak Mountains', done: false },
        { type: 'kill', target: 'ice_elemental', count: 2, current: 0, desc: 'Kill 2 Ice Elementals' }
      ],
      rewards: { xp: 500, gold: 200 }
    },

    treasure_hunter: {
      id: 'treasure_hunter', name: 'Treasure Hunter', type: 'side',
      desc: 'Find and open treasure chests throughout the Realm.',
      objectives: [
        { type: 'open_chests', count: 5, current: 0, desc: 'Open 5 treasure chests' }
      ],
      rewards: { xp: 250, gold: 200 }
    },

    monster_slayer: {
      id: 'monster_slayer', name: 'Monster Slayer', type: 'side',
      desc: 'Prove your combat prowess by slaying many foes.',
      objectives: [
        { type: 'kill_any', count: 20, current: 0, desc: 'Defeat 20 enemies' }
      ],
      rewards: { xp: 500, gold: 300 }
    },

    material_gatherer: {
      id: 'material_gatherer', name: 'Material Collector', type: 'side',
      desc: 'Collect crafting materials from defeated enemies.',
      objectives: [
        { type: 'collect_materials', count: 10, current: 0, desc: 'Collect 10 materials' }
      ],
      rewards: { xp: 300, gold: 150 }
    },

    level_10: {
      id: 'level_10', name: 'Growing Stronger', type: 'milestone',
      desc: 'Reach level 10 through combat experience.',
      objectives: [
        { type: 'reach_level', level: 10, desc: 'Reach Level 10', done: false }
      ],
      rewards: { xp: 0, gold: 500 }
    },

    // Expanded side quests
    spider_nest: {
      id: 'spider_nest', name: 'Clear the Spider Nest', type: 'side',
      desc: 'Giant spiders have infested the Whisperwood. Exterminate them.',
      objectives: [
        { type: 'kill', target: 'spider', count: 8, current: 0, desc: 'Kill 8 Giant Spiders' }
      ],
      rewards: { xp: 250, gold: 100 }
    },
    ghost_hunt: {
      id: 'ghost_hunt', name: 'Ghost Hunting', type: 'side',
      desc: 'Phantoms have been spotted in the caves. Put them to rest.',
      objectives: [
        { type: 'kill', target: 'ghost', count: 5, current: 0, desc: 'Banish 5 Phantoms' }
      ],
      rewards: { xp: 350, gold: 150 }
    },
    demon_slayer: {
      id: 'demon_slayer', name: 'Demon Slayer', type: 'side',
      desc: 'Lesser demons are emerging from the Abyss. Destroy them.',
      objectives: [
        { type: 'kill', target: 'demon', count: 5, current: 0, desc: 'Slay 5 Lesser Demons' }
      ],
      rewards: { xp: 600, gold: 300 }
    },
    undead_purge: {
      id: 'undead_purge', name: 'Undead Purge', type: 'side',
      desc: 'The undead are rising. Purge skeletons and wraiths.',
      objectives: [
        { type: 'kill', target: 'skeleton', count: 5, current: 0, desc: 'Kill 5 Skeletons' },
        { type: 'kill', target: 'wraith', count: 3, current: 0, desc: 'Banish 3 Wraiths' }
      ],
      rewards: { xp: 450, gold: 200 }
    },
    crystal_collector: {
      id: 'crystal_collector', name: 'Crystal Collector', type: 'side',
      desc: 'Collect crystal dust from crystal golems in the sanctum.',
      objectives: [
        { type: 'kill', target: 'crystal_golem', count: 4, current: 0, desc: 'Kill 4 Crystal Golems' }
      ],
      rewards: { xp: 500, gold: 250 }
    },
    explorer_all: {
      id: 'explorer_all', name: 'World Explorer', type: 'side',
      desc: 'Visit every zone in the realm.',
      objectives: [
        { type: 'visit_zone', target: 'eldergrove', desc: 'Visit Eldergrove', done: false },
        { type: 'visit_zone', target: 'whisperwood', desc: 'Visit Whisperwood', done: false },
        { type: 'visit_zone', target: 'shadowmere', desc: 'Visit Shadowmere', done: false },
        { type: 'visit_zone', target: 'sunscorch', desc: 'Visit Sunscorch', done: false },
        { type: 'visit_zone', target: 'frostpeak', desc: 'Visit Frostpeak', done: false },
        { type: 'visit_zone', target: 'abyss', desc: 'Visit The Abyss', done: false },
        { type: 'visit_zone', target: 'crystal_sanctum', desc: 'Visit Crystal Sanctum', done: false }
      ],
      rewards: { xp: 1000, gold: 500 }
    },
    fishing_quest: {
      id: 'fishing_quest', name: 'Gone Fishing', type: 'side',
      desc: 'Try your hand at fishing. Catch some fish!',
      objectives: [
        { type: 'fish', count: 5, current: 0, desc: 'Catch 5 fish' }
      ],
      rewards: { xp: 200, gold: 100 }
    },
    crafting_mastery: {
      id: 'crafting_mastery', name: 'Artisan Apprentice', type: 'side',
      desc: 'Learn the art of crafting by making several items.',
      objectives: [
        { type: 'craft', count: 5, current: 0, desc: 'Craft 5 items' }
      ],
      rewards: { xp: 300, gold: 150 }
    },
    pet_hunt: {
      id: 'pet_hunt', name: 'Pet Collector', type: 'side',
      desc: 'Find and collect pet companions from defeated enemies.',
      objectives: [
        { type: 'collect_pet', count: 3, current: 0, desc: 'Collect 3 pets' }
      ],
      rewards: { xp: 400, gold: 200 }
    },
    level_20: {
      id: 'level_20', name: 'True Power', type: 'milestone',
      desc: 'Reach level 20 to prove your mastery.',
      objectives: [
        { type: 'reach_level', level: 20, desc: 'Reach Level 20', done: false }
      ],
      rewards: { xp: 0, gold: 1000 }
    },
    level_30: {
      id: 'level_30', name: 'Legendary Hero', type: 'milestone',
      desc: 'Reach the pinnacle of power at level 30.',
      objectives: [
        { type: 'reach_level', level: 30, desc: 'Reach Level 30', done: false }
      ],
      rewards: { xp: 0, gold: 5000 }
    },
    mass_slayer: {
      id: 'mass_slayer', name: 'Mass Slayer', type: 'side',
      desc: 'Prove your might by defeating 50 enemies total.',
      objectives: [
        { type: 'kill_any', count: 50, current: 0, desc: 'Defeat 50 enemies' }
      ],
      rewards: { xp: 800, gold: 400 }
    },
    golem_crusher: {
      id: 'golem_crusher', name: 'Golem Crusher', type: 'side',
      desc: 'Stone golems guard ancient treasures. Smash them.',
      objectives: [
        { type: 'kill', target: 'golem', count: 5, current: 0, desc: 'Kill 5 Stone Golems' }
      ],
      rewards: { xp: 500, gold: 250 }
    },
    dark_knight_hunter: {
      id: 'dark_knight_hunter', name: 'Dark Knight Hunter', type: 'side',
      desc: 'The Dark Knights threaten the realm. Hunt them down.',
      objectives: [
        { type: 'kill', target: 'dark_knight', count: 3, current: 0, desc: 'Defeat 3 Dark Knights' }
      ],
      rewards: { xp: 500, gold: 300 }
    }
  };

  // Procedural quest generation
  const proceduralTemplates = [
    {
      nameTemplate: 'Hunt: {enemy}',
      descTemplate: 'Eliminate {count} {enemy} threatening the area.',
      type: 'procedural',
      objTemplate: { type: 'kill', target: '{enemyId}', count: '{count}', current: 0 },
      enemies: ['slime', 'wolf', 'goblin', 'spider', 'bat', 'scorpion', 'skeleton', 'ghost', 'frost_wolf'],
      countRange: [3, 8],
      rewardScale: { xp: 30, gold: 15 }
    },
    {
      nameTemplate: 'Material Run: {material}',
      descTemplate: 'Collect {count} crafting materials for the smithy.',
      type: 'procedural',
      objTemplate: { type: 'collect_materials', count: '{count}', current: 0 },
      countRange: [5, 15],
      rewardScale: { xp: 20, gold: 20 }
    },
    {
      nameTemplate: 'Slayer Challenge',
      descTemplate: 'Defeat {count} enemies of any kind.',
      type: 'procedural',
      objTemplate: { type: 'kill_any', count: '{count}', current: 0 },
      countRange: [10, 30],
      rewardScale: { xp: 15, gold: 10 }
    }
  ];

  function generateProceduralQuest(playerLevel) {
    const template = proceduralTemplates[Math.floor(Math.random() * proceduralTemplates.length)];
    const count = template.countRange[0] + Math.floor(Math.random() * (template.countRange[1] - template.countRange[0]));

    let name = template.nameTemplate.replace('{count}', count);
    let desc = template.descTemplate.replace('{count}', count);
    const obj = { ...template.objTemplate };
    obj.count = count;
    obj.current = 0;

    if (template.enemies) {
      const enemyId = template.enemies[Math.floor(Math.random() * template.enemies.length)];
      const enemyDef = typeof Enemies !== 'undefined' ? Enemies.get(enemyId) : null;
      const enemyName = enemyDef ? enemyDef.name : enemyId;
      name = name.replace('{enemy}', enemyName);
      desc = desc.replace('{enemy}', enemyName);
      obj.target = enemyId;
      obj.desc = `Kill ${count} ${enemyName}s`;
    } else {
      obj.desc = desc;
    }

    return {
      id: 'proc_' + Utils.genId(),
      name,
      desc,
      type: 'procedural',
      objectives: [obj],
      rewards: {
        xp: Math.floor(template.rewardScale.xp * count * (1 + playerLevel * 0.1)),
        gold: Math.floor(template.rewardScale.gold * count * (1 + playerLevel * 0.1))
      }
    };
  }

  function acceptQuest(questId) {
    const def = questDefs[questId];
    if (!def) return;

    // Check if already active or completed
    if (GS.quests.some(q => q.id === questId)) {
      Core.addNotification('Quest already accepted!', 2);
      return;
    }

    const quest = JSON.parse(JSON.stringify(def)); // deep clone
    quest.state = 'active';
    GS.quests.push(quest);
    Core.addNotification(`Quest accepted: ${quest.name}`, 3);
    if (typeof AudioManager !== 'undefined') AudioManager.playSFX('quest');
  }

  function onEnemyKilled(enemyType, enemyName) {
    if (!GS.quests) return;
    for (const quest of GS.quests) {
      if (quest.state !== 'active') continue;

      for (const obj of quest.objectives) {
        if (obj.done) continue;

        if (obj.type === 'kill' && obj.target === enemyType) {
          obj.current = (obj.current || 0) + 1;
          if (obj.current >= obj.count) obj.done = true;
        }
        if (obj.type === 'kill_boss' && obj.target === enemyName) {
          obj.done = true;
        }
        if (obj.type === 'kill_any') {
          obj.current = (obj.current || 0) + 1;
          if (obj.current >= obj.count) obj.done = true;
        }
      }

      checkQuestComplete(quest);
    }
  }

  function onZoneEntered(zoneId) {
    if (!GS.quests) return;
    for (const quest of GS.quests) {
      if (quest.state !== 'active') continue;

      for (const obj of quest.objectives) {
        if (obj.done) continue;
        if (obj.type === 'visit_zone' && obj.target === zoneId) {
          obj.done = true;
        }
      }

      checkQuestComplete(quest);
    }

    // Offer procedural side quest if player has few active
    if (GS.player && GS.player.stats.level >= 3) {
      const activeProc = GS.quests.filter(q => q.type === 'procedural' && q.state === 'active');
      if (activeProc.length < 2) {
        const quest = generateProceduralQuest(GS.player.stats.level);
        if (quest) {
          quest.state = 'active';
          GS.quests.push(quest);
          Core.addNotification(`Side quest: ${quest.name}`, 3);
          if (typeof AudioManager !== 'undefined') AudioManager.playSFX('quest');
        }
      }
    }
  }

  function onChestOpened() {
    if (!GS.quests) return;
    for (const quest of GS.quests) {
      if (quest.state !== 'active') continue;

      for (const obj of quest.objectives) {
        if (obj.done) continue;
        if (obj.type === 'open_chests') {
          obj.current = (obj.current || 0) + 1;
          if (obj.current >= obj.count) obj.done = true;
        }
      }

      checkQuestComplete(quest);
    }
  }

  function onMaterialCollected() {
    if (!GS.quests) return;
    for (const quest of GS.quests) {
      if (quest.state !== 'active') continue;

      for (const obj of quest.objectives) {
        if (obj.done) continue;
        if (obj.type === 'collect_materials') {
          obj.current = (obj.current || 0) + 1;
          if (obj.current >= obj.count) obj.done = true;
        }
      }

      checkQuestComplete(quest);
    }
  }

  function checkLevelQuests() {
    if (!GS.player || !GS.quests) return;
    for (const quest of GS.quests) {
      if (quest.state !== 'active') continue;

      for (const obj of quest.objectives) {
        if (obj.done) continue;
        if (obj.type === 'reach_level' && GS.player.stats.level >= obj.level) {
          obj.done = true;
        }
      }

      checkQuestComplete(quest);
    }
  }

  function checkQuestComplete(quest) {
    if (quest.objectives.every(o => o.done)) {
      quest.state = 'complete';
      // Auto-reward
      rewardQuest(quest);
    }
  }

  function rewardQuest(quest) {
    if (quest.state !== 'complete') return;
    quest.state = 'rewarded';

    if (quest.rewards) {
      if (quest.rewards.xp) {
        GS.player.stats.xp += quest.rewards.xp;
        if (typeof Combat !== 'undefined') Combat.checkLevelUp();
      }
      if (quest.rewards.gold) {
        GS.player.gold = (GS.player.gold || 0) + quest.rewards.gold;
        GS.player.stats.gold = GS.player.gold;
      }
    }

    Core.addNotification(`Quest Complete: ${quest.name}!`, 4);
    if (quest.rewards) {
      const parts = [];
      if (quest.rewards.xp) parts.push(`+${quest.rewards.xp} XP`);
      if (quest.rewards.gold) parts.push(`+${quest.rewards.gold} Gold`);
      if (parts.length > 0) Core.addNotification(parts.join(', '), 3);
    }

    if (typeof AudioManager !== 'undefined') AudioManager.playSFX('quest_complete');
    if (typeof Achievements !== 'undefined') Achievements.onQuestComplete();
    if (typeof DailyChallenges !== 'undefined') DailyChallenges.onQuestComplete();
  }

  function getActiveQuests() {
    return GS.quests.filter(q => q.state === 'active');
  }

  function getCompletedQuests() {
    return GS.quests.filter(q => q.state === 'rewarded');
  }

  function getAllQuestDefs() {
    return questDefs;
  }

  function onFishCaught() {
    if (!GS.quests) return;
    for (const quest of GS.quests) {
      if (quest.state !== 'active') continue;
      for (const obj of quest.objectives) {
        if (obj.done) continue;
        if (obj.type === 'fish') {
          obj.current = (obj.current || 0) + 1;
          if (obj.current >= obj.count) obj.done = true;
        }
      }
      checkQuestComplete(quest);
    }
  }

  function onItemCrafted() {
    if (!GS.quests) return;
    for (const quest of GS.quests) {
      if (quest.state !== 'active') continue;
      for (const obj of quest.objectives) {
        if (obj.done) continue;
        if (obj.type === 'craft') {
          obj.current = (obj.current || 0) + 1;
          if (obj.current >= obj.count) obj.done = true;
        }
      }
      checkQuestComplete(quest);
    }
  }

  function onPetCollected() {
    if (!GS.quests) return;
    for (const quest of GS.quests) {
      if (quest.state !== 'active') continue;
      for (const obj of quest.objectives) {
        if (obj.done) continue;
        if (obj.type === 'collect_pet') {
          obj.current = (obj.current || 0) + 1;
          if (obj.current >= obj.count) obj.done = true;
        }
      }
      checkQuestComplete(quest);
    }
  }

  return {
    acceptQuest, onEnemyKilled, onZoneEntered, onChestOpened,
    onMaterialCollected, onFishCaught, onItemCrafted, onPetCollected,
    checkLevelQuests, generateProceduralQuest,
    getActiveQuests, getCompletedQuests, getAllQuestDefs
  };
})();
