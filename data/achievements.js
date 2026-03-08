// data/achievements.js — Achievement tracking system

const Achievements = (() => {
  const defs = {
    first_blood: { name: 'First Blood', desc: 'Defeat your first enemy', icon: 'sword', secret: false },
    slime_slayer: { name: 'Slime Slayer', desc: 'Defeat 10 slimes', icon: 'sword', target: 10 },
    wolf_hunter: { name: 'Wolf Hunter', desc: 'Defeat 10 wolves', icon: 'sword', target: 10 },
    boss_slayer_1: { name: 'Guardian Down', desc: 'Defeat the Stone Guardian', icon: 'star' },
    boss_slayer_2: { name: 'Wyrm Wrangler', desc: 'Defeat the Sand Wyrm', icon: 'star' },
    boss_slayer_3: { name: 'Ice Breaker', desc: 'Defeat the Frost Titan', icon: 'star' },
    boss_slayer_4: { name: 'Abyss Walker', desc: 'Defeat the Abyssal Lord', icon: 'star' },
    boss_slayer_5: { name: 'Dragon Slayer', desc: 'Defeat the Crystal Dragon', icon: 'star' },
    level_5: { name: 'Apprentice', desc: 'Reach level 5', icon: 'star' },
    level_10: { name: 'Journeyman', desc: 'Reach level 10', icon: 'star' },
    level_15: { name: 'Veteran', desc: 'Reach level 15', icon: 'star' },
    level_20: { name: 'Master', desc: 'Reach level 20', icon: 'star' },
    level_25: { name: 'Legend', desc: 'Reach level 25', icon: 'star' },
    level_30: { name: 'Mythic', desc: 'Reach level 30', icon: 'star' },
    gold_100: { name: 'Pocket Change', desc: 'Earn 100 gold', icon: 'coin' },
    gold_1000: { name: 'Wealthy', desc: 'Earn 1,000 gold', icon: 'coin' },
    gold_10000: { name: 'Tycoon', desc: 'Earn 10,000 gold', icon: 'coin' },
    quest_5: { name: 'Adventurer', desc: 'Complete 5 quests', icon: 'quest' },
    quest_10: { name: 'Hero', desc: 'Complete 10 quests', icon: 'quest' },
    quest_20: { name: 'Champion', desc: 'Complete 20 quests', icon: 'quest' },
    all_zones: { name: 'Explorer', desc: 'Visit every zone', icon: 'star' },
    kill_100: { name: 'Centurion', desc: 'Defeat 100 enemies', icon: 'sword' },
    kill_500: { name: 'Warlord', desc: 'Defeat 500 enemies', icon: 'sword' },
    no_damage_boss: { name: 'Untouchable', desc: 'Defeat a boss without taking damage', icon: 'shield', secret: true },
    speed_kill: { name: 'Quick Draw', desc: 'Win a battle in 3 turns or less', icon: 'sword' },
    full_party: { name: 'Band Together', desc: 'Have 3 allies in your party', icon: 'star' },
    legendary_item: { name: 'Legendary Find', desc: 'Find a legendary item', icon: 'star' },
    craft_10: { name: 'Artisan', desc: 'Craft 10 items', icon: 'star' },
    fish_catch: { name: 'Angler', desc: 'Catch your first fish', icon: 'star' },
    fish_20: { name: 'Master Angler', desc: 'Catch 20 fish', icon: 'star' },
    pet_collect: { name: 'Pet Collector', desc: 'Collect your first pet', icon: 'star' },
    all_pets: { name: 'Pet Master', desc: 'Collect 5 pets', icon: 'star' },
    ng_plus: { name: 'New Game+', desc: 'Start New Game+', icon: 'star' },
    ng_plus_3: { name: 'Eternal Hero', desc: 'Reach New Game+ 3', icon: 'star', secret: true },
    bestiary_50: { name: 'Monster Scholar', desc: 'Record 50% of bestiary', icon: 'quest' },
    bestiary_100: { name: 'Monster Expert', desc: 'Complete the bestiary', icon: 'quest' },
    play_1hr: { name: 'Dedicated', desc: 'Play for 1 hour', icon: 'star' },
    play_5hr: { name: 'Devoted', desc: 'Play for 5 hours', icon: 'star' },
    max_combo: { name: 'Combo King', desc: 'Get a 5x combo in combat', icon: 'sword', secret: true },
    all_skills: { name: 'Skill Master', desc: 'Learn all skills for your class', icon: 'star' },
    enchant_5: { name: 'Enchanter', desc: 'Enchant 5 items', icon: 'star' },
    daily_7: { name: 'Streak!', desc: 'Complete 7 daily challenges', icon: 'quest' }
  };

  // Tracking counters
  let _counters = {
    kills: 0, bossKills: 0, questsCompleted: 0, itemsCrafted: 0,
    fishCaught: 0, petsCollected: 0, enchantsDone: 0, dailiesCompleted: 0,
    killsByType: {}, zonesVisited: new Set(), goldEarned: 0
  };

  function init() {
    if (!GS.achievements) GS.achievements = [];
    if (GS.achievementCounters) {
      _counters = GS.achievementCounters;
      if (_counters.zonesVisited && !(_counters.zonesVisited instanceof Set)) {
        _counters.zonesVisited = new Set(_counters.zonesVisited);
      }
    }
  }

  function unlock(id) {
    if (!defs[id]) return;
    if (GS.achievements.includes(id)) return;
    GS.achievements.push(id);
    Core.addNotification(`Achievement: ${defs[id].name}!`, 4);
    if (typeof AudioManager !== 'undefined') AudioManager.playSFX('quest_complete');
  }

  function isUnlocked(id) {
    return GS.achievements.includes(id);
  }

  function onEnemyKilled(enemyType, isBoss) {
    _counters.kills++;
    _counters.killsByType[enemyType] = (_counters.killsByType[enemyType] || 0) + 1;

    if (_counters.kills === 1) unlock('first_blood');
    if (_counters.kills >= 100) unlock('kill_100');
    if (_counters.kills >= 500) unlock('kill_500');

    if (_counters.killsByType.slime >= 10) unlock('slime_slayer');
    if (_counters.killsByType.wolf >= 10) unlock('wolf_hunter');

    if (isBoss) {
      _counters.bossKills++;
    }
    GS.achievementCounters = _counters;
  }

  function onLevelUp(level) {
    if (level >= 5) unlock('level_5');
    if (level >= 10) unlock('level_10');
    if (level >= 15) unlock('level_15');
    if (level >= 20) unlock('level_20');
    if (level >= 25) unlock('level_25');
    if (level >= 30) unlock('level_30');
  }

  function onQuestComplete() {
    _counters.questsCompleted++;
    if (_counters.questsCompleted >= 5) unlock('quest_5');
    if (_counters.questsCompleted >= 10) unlock('quest_10');
    if (_counters.questsCompleted >= 20) unlock('quest_20');
    GS.achievementCounters = _counters;
  }

  function onZoneVisited(zoneId) {
    _counters.zonesVisited.add(zoneId);
    const allZones = typeof Zones !== 'undefined' ? Zones.getAllZoneIds() : [];
    if (_counters.zonesVisited.size >= allZones.length && allZones.length > 0) unlock('all_zones');
    GS.achievementCounters = _counters;
  }

  function checkCombat(turns, enemyCount) {
    if (turns <= 3) unlock('speed_kill');
  }

  function onGoldEarned(amount) {
    _counters.goldEarned += amount;
    if (_counters.goldEarned >= 100) unlock('gold_100');
    if (_counters.goldEarned >= 1000) unlock('gold_1000');
    if (_counters.goldEarned >= 10000) unlock('gold_10000');
    GS.achievementCounters = _counters;
  }

  function onItemCrafted() { _counters.itemsCrafted++; if (_counters.itemsCrafted >= 10) unlock('craft_10'); GS.achievementCounters = _counters; }
  function onFishCaught() { _counters.fishCaught++; if (_counters.fishCaught === 1) unlock('fish_catch'); if (_counters.fishCaught >= 20) unlock('fish_20'); GS.achievementCounters = _counters; }
  function onPetCollected() { _counters.petsCollected++; if (_counters.petsCollected === 1) unlock('pet_collect'); if (_counters.petsCollected >= 5) unlock('all_pets'); GS.achievementCounters = _counters; }
  function onEnchant() { _counters.enchantsDone++; if (_counters.enchantsDone >= 5) unlock('enchant_5'); GS.achievementCounters = _counters; }
  function onDailyComplete() { _counters.dailiesCompleted++; if (_counters.dailiesCompleted >= 7) unlock('daily_7'); GS.achievementCounters = _counters; }

  function getAll() {
    return Object.entries(defs).map(([id, def]) => ({
      id, ...def, unlocked: isUnlocked(id)
    }));
  }

  function getUnlockedCount() {
    return GS.achievements ? GS.achievements.length : 0;
  }

  function getTotalCount() {
    return Object.keys(defs).length;
  }

  return {
    init, unlock, isUnlocked, getAll, getUnlockedCount, getTotalCount,
    onEnemyKilled, onLevelUp, onQuestComplete, onZoneVisited, checkCombat,
    onGoldEarned, onItemCrafted, onFishCaught, onPetCollected, onEnchant, onDailyComplete
  };
})();
