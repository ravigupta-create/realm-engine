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
    }
  };

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
  }

  function onChestOpened() {
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
    if (!GS.player) return;
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
        Combat.checkLevelUp();
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

  return {
    acceptQuest, onEnemyKilled, onZoneEntered, onChestOpened,
    onMaterialCollected, checkLevelQuests,
    getActiveQuests, getCompletedQuests, getAllQuestDefs
  };
})();
