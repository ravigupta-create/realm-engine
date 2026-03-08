// data/newgame-plus.js — New Game+ and Difficulty system

const NewGamePlus = (() => {
  const difficultySettings = {
    easy: {
      name: 'Easy', enemyStatMult: 0.7, xpMult: 1.3, goldMult: 1.5, dropRateMult: 1.3,
      desc: 'Relaxed difficulty. More gold and XP, weaker enemies.'
    },
    normal: {
      name: 'Normal', enemyStatMult: 1.0, xpMult: 1.0, goldMult: 1.0, dropRateMult: 1.0,
      desc: 'The intended experience.'
    },
    hard: {
      name: 'Hard', enemyStatMult: 1.5, xpMult: 1.5, goldMult: 0.8, dropRateMult: 0.9,
      desc: 'Tougher enemies, more XP reward.'
    },
    nightmare: {
      name: 'Nightmare', enemyStatMult: 2.5, xpMult: 2.0, goldMult: 0.6, dropRateMult: 0.7,
      desc: 'Punishing difficulty. For masochists.'
    }
  };

  function init() {
    if (!GS.ngPlus) GS.ngPlus = 0;
    if (!GS.difficulty) GS.difficulty = 'normal';
  }

  function getDifficulty() {
    return difficultySettings[GS.difficulty || 'normal'];
  }

  function setDifficulty(d) {
    if (difficultySettings[d]) {
      GS.difficulty = d;
    }
  }

  function getNGPlus() {
    return GS.ngPlus || 0;
  }

  function getEnemyMultiplier() {
    const diff = getDifficulty();
    const ngBonus = 1 + (GS.ngPlus || 0) * 0.5; // +50% per NG+ level
    return diff.enemyStatMult * ngBonus;
  }

  function getXPMultiplier() {
    const diff = getDifficulty();
    const ngBonus = 1 + (GS.ngPlus || 0) * 0.3;
    return diff.xpMult * ngBonus;
  }

  function getGoldMultiplier() {
    const diff = getDifficulty();
    const ngBonus = 1 + (GS.ngPlus || 0) * 0.2;
    return diff.goldMult * ngBonus;
  }

  function getDropRateMultiplier() {
    const diff = getDifficulty();
    return diff.dropRateMult;
  }

  function startNewGamePlus() {
    const prevNG = GS.ngPlus || 0;
    const player = GS.player;

    // Keep: level, stats, skills, class, equipment, some items, pets
    const keep = {
      classType: player.classType,
      name: player.name,
      stats: { ...player.stats },
      skills: [...player.skills],
      learnedSkillIds: player.learnedSkillIds ? new Set(player.learnedSkillIds) : new Set(),
      equipment: player.equipment ? { ...player.equipment } : {},
      pets: GS.player.pets ? [...GS.player.pets] : [],
      activePet: GS.player.activePet,
      bestiary: GS.bestiary ? { ...GS.bestiary } : {},
      achievements: GS.achievements ? [...GS.achievements] : [],
      achievementCounters: GS.achievementCounters,
      totalPlayTime: GS.playTime || 0,
      fishCaught: player.fishCaught,
      totalFishCaught: player.totalFishCaught
    };

    // Keep only equipment and epic+ items
    const keptItems = (player.items || []).filter(i =>
      i && (i.type === 'equipment' || i.rarity === 'epic' || i.rarity === 'legendary')
    );

    // Reset game state
    GS.ngPlus = prevNG + 1;
    GS.currentZone = 'eldergrove';
    GS.quests = [];
    GS.exploredTiles = {};
    GS.dailyChallenges = null;

    // Rebuild player
    player.stats.gold = Math.floor((player.gold || player.stats.gold || 0) * 0.5); // Keep half gold
    player.gold = player.stats.gold;
    player.stats.xp = 0;
    player.items = keptItems;
    player.party = []; // Allies must be re-recruited

    // Restore kept data
    GS.bestiary = keep.bestiary;
    GS.achievements = keep.achievements;
    GS.achievementCounters = keep.achievementCounters;
    GS.player.pets = keep.pets;
    GS.player.activePet = keep.activePet;
    GS.player.fishCaught = keep.fishCaught;
    GS.player.totalFishCaught = keep.totalFishCaught;

    // Achievement
    if (typeof Achievements !== 'undefined') {
      Achievements.unlock('ng_plus');
      if (GS.ngPlus >= 3) Achievements.unlock('ng_plus_3');
    }

    Core.addNotification(`New Game+ ${GS.ngPlus} started!`, 5);
    if (typeof AudioManager !== 'undefined') AudioManager.playSFX('levelup');

    // Load starting zone
    if (typeof WorldManager !== 'undefined') {
      WorldManager.loadZone('eldergrove');
    }

    return GS.ngPlus;
  }

  function canStartNGPlus() {
    // Can start NG+ after defeating final boss or completing main quest
    return GS.state === GameStates.VICTORY || GS.mainQuestComplete === true;
  }

  return {
    difficultySettings, init, getDifficulty, setDifficulty,
    getNGPlus, getEnemyMultiplier, getXPMultiplier, getGoldMultiplier,
    getDropRateMultiplier, startNewGamePlus, canStartNGPlus
  };
})();
