// data/daily.js — Daily challenge system

const DailyChallenges = (() => {
  const challengeTemplates = [
    { type: 'kill', desc: 'Defeat {n} enemies', targets: [5, 8, 10, 15], reward: { gold: 50, xp: 30 } },
    { type: 'kill_type', desc: 'Defeat {n} {enemy}', targets: [3, 5, 8], reward: { gold: 75, xp: 40 } },
    { type: 'gold', desc: 'Earn {n} gold', targets: [100, 200, 300], reward: { xp: 50 } },
    { type: 'craft', desc: 'Craft {n} items', targets: [1, 2, 3], reward: { gold: 100, xp: 40 } },
    { type: 'fish', desc: 'Catch {n} fish', targets: [3, 5, 8], reward: { gold: 80, xp: 35 } },
    { type: 'quest', desc: 'Complete {n} quests', targets: [1, 2], reward: { gold: 150, xp: 60 } },
    { type: 'boss', desc: 'Defeat a boss', targets: [1], reward: { gold: 200, xp: 100 } },
    { type: 'explore', desc: 'Visit {n} different zones', targets: [2, 3, 4], reward: { gold: 60, xp: 30 } },
    { type: 'combo', desc: 'Get a {n}x combat combo', targets: [3, 4, 5], reward: { gold: 100, xp: 50 } },
    { type: 'no_damage', desc: 'Win a battle without taking damage', targets: [1], reward: { gold: 150, xp: 75 } },
    { type: 'spend', desc: 'Spend {n} gold at shops', targets: [100, 200, 500], reward: { xp: 60 } },
    { type: 'enchant', desc: 'Enchant {n} items', targets: [1, 2], reward: { gold: 120, xp: 50 } },
    { type: 'pet_xp', desc: 'Earn {n} pet XP', targets: [20, 50, 100], reward: { gold: 80, xp: 40 } },
    { type: 'level_ally', desc: 'Level up an ally', targets: [1], reward: { gold: 100, xp: 50 } },
    { type: 'use_skill', desc: 'Use {n} skills in combat', targets: [5, 10, 15], reward: { gold: 50, xp: 30 } }
  ];

  const enemyTypes = ['slime', 'wolf', 'goblin', 'skeleton', 'bat', 'ghost', 'scorpion'];

  function init() {
    if (!GS.dailyChallenges) {
      GS.dailyChallenges = {
        challenges: [],
        lastRefresh: 0,
        streak: 0,
        totalCompleted: 0
      };
    }
    checkRefresh();
  }

  function getDaySeed() {
    const now = new Date();
    return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  }

  function seededRandom(seed) {
    let s = seed;
    return function () {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }

  function checkRefresh() {
    const today = getDaySeed();
    if (GS.dailyChallenges.lastRefresh !== today) {
      // Check if yesterday's were all completed for streak
      const allDone = GS.dailyChallenges.challenges.length > 0 &&
                      GS.dailyChallenges.challenges.every(c => c.completed);
      if (allDone) {
        GS.dailyChallenges.streak++;
      } else if (GS.dailyChallenges.challenges.length > 0) {
        GS.dailyChallenges.streak = 0;
      }
      generateDailies(today);
      GS.dailyChallenges.lastRefresh = today;
    }
  }

  function generateDailies(seed) {
    const rng = seededRandom(seed);
    const count = 3; // 3 daily challenges
    const used = new Set();
    const challenges = [];

    for (let i = 0; i < count; i++) {
      let idx;
      do {
        idx = Math.floor(rng() * challengeTemplates.length);
      } while (used.has(idx));
      used.add(idx);

      const template = challengeTemplates[idx];
      const target = template.targets[Math.floor(rng() * template.targets.length)];
      let desc = template.desc.replace('{n}', target);

      let enemyType = null;
      if (template.type === 'kill_type') {
        enemyType = enemyTypes[Math.floor(rng() * enemyTypes.length)];
        desc = desc.replace('{enemy}', enemyType.replace(/_/g, ' ') + 's');
      }

      // Scale reward by streak
      const streakBonus = 1 + GS.dailyChallenges.streak * 0.1;
      const reward = {};
      if (template.reward.gold) reward.gold = Math.floor(template.reward.gold * streakBonus);
      if (template.reward.xp) reward.xp = Math.floor(template.reward.xp * streakBonus);

      challenges.push({
        id: `daily_${i}_${seed}`,
        type: template.type,
        desc,
        target,
        enemyType,
        progress: 0,
        completed: false,
        claimed: false,
        reward
      });
    }

    GS.dailyChallenges.challenges = challenges;
  }

  // Event hooks
  function onEnemyKilled(enemyType) {
    updateChallenges(c => {
      if (c.type === 'kill') c.progress++;
      if (c.type === 'kill_type' && c.enemyType === enemyType) c.progress++;
    });
  }

  function onGoldEarned(amount) {
    updateChallenges(c => {
      if (c.type === 'gold') c.progress += amount;
    });
  }

  function onItemCrafted() {
    updateChallenges(c => {
      if (c.type === 'craft') c.progress++;
    });
  }

  function onFishCaught() {
    updateChallenges(c => {
      if (c.type === 'fish') c.progress++;
    });
  }

  function onQuestComplete() {
    updateChallenges(c => {
      if (c.type === 'quest') c.progress++;
    });
  }

  function onBossKilled() {
    updateChallenges(c => {
      if (c.type === 'boss') c.progress++;
    });
  }

  function onZoneVisited() {
    updateChallenges(c => {
      if (c.type === 'explore') c.progress++;
    });
  }

  function onCombo(count) {
    updateChallenges(c => {
      if (c.type === 'combo') c.progress = Math.max(c.progress, count);
    });
  }

  function onNoDamageBattle() {
    updateChallenges(c => {
      if (c.type === 'no_damage') c.progress++;
    });
  }

  function onGoldSpent(amount) {
    updateChallenges(c => {
      if (c.type === 'spend') c.progress += amount;
    });
  }

  function onEnchant() {
    updateChallenges(c => {
      if (c.type === 'enchant') c.progress++;
    });
  }

  function onPetXP(amount) {
    updateChallenges(c => {
      if (c.type === 'pet_xp') c.progress += amount;
    });
  }

  function onAllyLevelUp() {
    updateChallenges(c => {
      if (c.type === 'level_ally') c.progress++;
    });
  }

  function onSkillUsed() {
    updateChallenges(c => {
      if (c.type === 'use_skill') c.progress++;
    });
  }

  function updateChallenges(fn) {
    if (!GS.dailyChallenges?.challenges) return;
    for (const c of GS.dailyChallenges.challenges) {
      if (c.completed) continue;
      fn(c);
      if (c.progress >= c.target && !c.completed) {
        c.completed = true;
        Core.addNotification(`Daily complete: ${c.desc}!`, 3);
        if (typeof AudioManager !== 'undefined') AudioManager.playSFX('quest_complete');
      }
    }
  }

  function claimReward(challengeId) {
    const c = GS.dailyChallenges.challenges.find(ch => ch.id === challengeId);
    if (!c || !c.completed || c.claimed) return false;

    c.claimed = true;
    GS.dailyChallenges.totalCompleted++;

    if (c.reward.gold) {
      GS.player.gold = (GS.player.gold || 0) + c.reward.gold;
      GS.player.stats.gold = GS.player.gold;
      Core.addNotification(`+${c.reward.gold} gold!`, 2);
    }
    if (c.reward.xp) {
      if (typeof Classes !== 'undefined') Classes.addXP(c.reward.xp);
      Core.addNotification(`+${c.reward.xp} XP!`, 2);
    }

    // Check all dailies claimed
    if (GS.dailyChallenges.challenges.every(ch => ch.claimed)) {
      // Bonus reward for all dailies
      const bonusGold = 100 * (1 + GS.dailyChallenges.streak * 0.2);
      GS.player.gold = (GS.player.gold || 0) + Math.floor(bonusGold);
      GS.player.stats.gold = GS.player.gold;
      Core.addNotification(`All dailies done! Bonus: ${Math.floor(bonusGold)}g!`, 4);
      if (typeof Achievements !== 'undefined') Achievements.onDailyComplete();
    }

    return true;
  }

  function getChallenges() {
    checkRefresh();
    return GS.dailyChallenges?.challenges || [];
  }

  function getStreak() {
    return GS.dailyChallenges?.streak || 0;
  }

  return {
    init, getChallenges, claimReward, getStreak,
    onEnemyKilled, onGoldEarned, onItemCrafted, onFishCaught, onQuestComplete,
    onBossKilled, onZoneVisited, onCombo, onNoDamageBattle, onGoldSpent,
    onEnchant, onPetXP, onAllyLevelUp, onSkillUsed
  };
})();
