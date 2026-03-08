// data/bestiary.js — Monster encyclopedia / bestiary system

const Bestiary = (() => {
  function init() {
    if (!GS.bestiary) GS.bestiary = {};
  }

  function recordKill(enemyType, enemy) {
    if (!GS.bestiary) GS.bestiary = {};
    if (!GS.bestiary[enemyType]) {
      GS.bestiary[enemyType] = {
        id: enemyType,
        kills: 0,
        firstSeen: GS.playTime || 0,
        maxDamageDealt: 0,
        maxDamageTaken: 0,
        drops: [],
        discovered: false
      };
    }
    const entry = GS.bestiary[enemyType];
    entry.kills++;
    entry.discovered = true;

    // Check achievement milestones
    const total = getTotalDiscovered();
    const allEnemies = typeof Enemies !== 'undefined' ? Object.keys(Enemies.defs).length : 50;
    if (total >= Math.floor(allEnemies * 0.5)) {
      if (typeof Achievements !== 'undefined') Achievements.unlock('bestiary_50');
    }
    if (total >= allEnemies) {
      if (typeof Achievements !== 'undefined') Achievements.unlock('bestiary_100');
    }
  }

  function recordDamage(enemyType, dealt, taken) {
    if (!GS.bestiary || !GS.bestiary[enemyType]) return;
    const entry = GS.bestiary[enemyType];
    if (dealt > entry.maxDamageDealt) entry.maxDamageDealt = dealt;
    if (taken > entry.maxDamageTaken) entry.maxDamageTaken = taken;
  }

  function recordDrop(enemyType, itemName) {
    if (!GS.bestiary || !GS.bestiary[enemyType]) return;
    const entry = GS.bestiary[enemyType];
    if (!entry.drops.includes(itemName)) {
      entry.drops.push(itemName);
    }
  }

  function getEntry(enemyType) {
    if (!GS.bestiary) return null;
    return GS.bestiary[enemyType] || null;
  }

  function getAllEntries() {
    if (!GS.bestiary) return [];
    // Get all enemy defs to show undiscovered ones too
    const allDefs = typeof Enemies !== 'undefined' ? Enemies.defs : {};
    const entries = [];
    for (const [id, def] of Object.entries(allDefs)) {
      const entry = GS.bestiary[id];
      entries.push({
        id,
        name: entry && entry.discovered ? def.name : '???',
        discovered: entry ? entry.discovered : false,
        kills: entry ? entry.kills : 0,
        maxDamageDealt: entry ? entry.maxDamageDealt : 0,
        maxDamageTaken: entry ? entry.maxDamageTaken : 0,
        drops: entry ? entry.drops : [],
        stats: entry && entry.discovered ? def : null,
        element: entry && entry.discovered ? (def.element || 'none') : '???',
        zone: entry && entry.discovered ? (def.zone || 'unknown') : '???'
      });
    }
    return entries;
  }

  function getTotalDiscovered() {
    if (!GS.bestiary) return 0;
    return Object.values(GS.bestiary).filter(e => e.discovered).length;
  }

  function getTotalEntries() {
    return typeof Enemies !== 'undefined' ? Object.keys(Enemies.defs).length : 0;
  }

  function getCompletionPercent() {
    const total = getTotalEntries();
    if (total === 0) return 0;
    return Math.floor((getTotalDiscovered() / total) * 100);
  }

  // Reward tiers for bestiary completion
  function checkRewards() {
    const pct = getCompletionPercent();
    const rewards = [];
    if (pct >= 25 && !GS.bestiaryRewards?.tier1) {
      rewards.push({ tier: 1, gold: 500, desc: '25% Bestiary — 500 Gold' });
      if (!GS.bestiaryRewards) GS.bestiaryRewards = {};
      GS.bestiaryRewards.tier1 = true;
      GS.player.gold = (GS.player.gold || 0) + 500;
      GS.player.stats.gold = GS.player.gold;
    }
    if (pct >= 50 && !GS.bestiaryRewards?.tier2) {
      rewards.push({ tier: 2, gold: 1500, desc: '50% Bestiary — 1500 Gold' });
      if (!GS.bestiaryRewards) GS.bestiaryRewards = {};
      GS.bestiaryRewards.tier2 = true;
      GS.player.gold = (GS.player.gold || 0) + 1500;
      GS.player.stats.gold = GS.player.gold;
    }
    if (pct >= 75 && !GS.bestiaryRewards?.tier3) {
      rewards.push({ tier: 3, gold: 3000, desc: '75% Bestiary — 3000 Gold' });
      if (!GS.bestiaryRewards) GS.bestiaryRewards = {};
      GS.bestiaryRewards.tier3 = true;
      GS.player.gold = (GS.player.gold || 0) + 3000;
      GS.player.stats.gold = GS.player.gold;
    }
    if (pct >= 100 && !GS.bestiaryRewards?.tier4) {
      rewards.push({ tier: 4, gold: 10000, desc: '100% Bestiary — 10000 Gold + Title' });
      if (!GS.bestiaryRewards) GS.bestiaryRewards = {};
      GS.bestiaryRewards.tier4 = true;
      GS.player.gold = (GS.player.gold || 0) + 10000;
      GS.player.stats.gold = GS.player.gold;
      GS.player.title = 'Monster Expert';
    }
    for (const r of rewards) {
      Core.addNotification(r.desc, 4);
    }
    return rewards;
  }

  return { init, recordKill, recordDamage, recordDrop, getEntry, getAllEntries, getTotalDiscovered, getTotalEntries, getCompletionPercent, checkRewards };
})();
