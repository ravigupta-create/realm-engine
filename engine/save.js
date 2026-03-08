// engine/save.js — Save/load with checksum integrity

const SaveSystem = (() => {
  const SAVE_PREFIX = 'realm_engine_save_';
  const MAX_SLOTS = 3;

  function getSaveKey(slot) {
    return SAVE_PREFIX + (slot || GS.saveSlot || 0);
  }

  function gatherSaveData() {
    if (!GS.player) return null;

    return {
      version: 1,
      timestamp: Date.now(),
      player: {
        name: GS.player.name,
        classType: GS.player.classType,
        x: GS.player.x,
        y: GS.player.y,
        dir: GS.player.dir,
        gold: GS.player.gold || 0,
        stats: { ...GS.player.stats },
        items: GS.player.items.map(i => ({ ...i })),
        equipment: Object.fromEntries(
          Object.entries(GS.player.equipment).map(([k, v]) => [k, v ? { ...v } : null])
        ),
        skills: GS.player.skills.map(s => s.id),
        learnedSkillIds: Array.from(GS.player.learnedSkillIds || []),
        skillPoints: GS.player.skillPoints || 0
      },
      currentZone: GS.currentZone ? GS.currentZone.id : 'eldergrove',
      quests: GS.quests.map(q => JSON.parse(JSON.stringify(q))),
      defeatedBosses: GS.defeatedBosses || [],
      exploredTiles: GS.exploredTiles,
      achievements: GS.achievements || [],
      achievementCounters: GS.achievementCounters ? {
        ...GS.achievementCounters,
        zonesVisited: GS.achievementCounters.zonesVisited instanceof Set
          ? Array.from(GS.achievementCounters.zonesVisited)
          : (GS.achievementCounters.zonesVisited || [])
      } : null,
      ngPlus: GS.ngPlus || 0,
      difficulty: GS.difficulty || 'normal',
      gameTime: GS.gameTime,
      playTime: GS.playTime,
      settings: { ...GS.settings },
      // Pets
      pets: GS.player.pets ? GS.player.pets.map(p => ({ ...p })) : [],
      activePetId: GS.player.activePet ? GS.player.activePet.id : null,
      // Party
      party: GS.player.party ? GS.player.party.map(a => JSON.parse(JSON.stringify(a))) : [],
      // Fishing
      fishingUnlocked: GS.player.fishingUnlocked || false,
      fishCaught: GS.player.fishCaught || {},
      totalFishCaught: GS.player.totalFishCaught || 0,
      fishingCombo: GS.player.fishingCombo || 0,
      bestFishingCombo: GS.player.bestFishingCombo || 0,
      rodLevel: GS.player.rodLevel || 1,
      // Main quest flag
      mainQuestComplete: GS.mainQuestComplete || false,
      // Bestiary
      bestiary: GS.bestiary || {},
      bestiaryRewards: GS.bestiaryRewards || {},
      // Daily challenges
      dailyChallenges: GS.dailyChallenges ? JSON.parse(JSON.stringify(GS.dailyChallenges)) : null,
      // Cheat mode
      cheatActive: GS.cheatActive || false
    };
  }

  async function save(slot) {
    const data = gatherSaveData();
    if (!data) return false;

    const json = JSON.stringify(data);
    const checksum = await Utils.sha256(json);
    const saveObj = { data: json, checksum };

    try {
      localStorage.setItem(getSaveKey(slot), JSON.stringify(saveObj));
      return true;
    } catch (e) {
      Core.addNotification('Save failed! Storage full?', 3);
      return false;
    }
  }

  async function load(slot) {
    try {
      const raw = localStorage.getItem(getSaveKey(slot));
      if (!raw) return false;

      const saveObj = JSON.parse(raw);
      const checksum = await Utils.sha256(saveObj.data);

      if (checksum !== saveObj.checksum) {
        Core.addNotification('Save data corrupted!', 3);
        return false;
      }

      const data = JSON.parse(saveObj.data);
      return applySaveData(data);
    } catch (e) {
      Core.addNotification('Failed to load save!', 3);
      return false;
    }
  }

  function applySaveData(data) {
    if (!data || data.version !== 1) return false;

    // Validate critical fields
    if (!data.player || !data.player.classType || !data.player.stats) return false;
    if (typeof data.player.stats.level !== 'number') return false;

    // Restore game state
    GS.quests = data.quests || [];
    GS.exploredTiles = data.exploredTiles || {};
    GS.defeatedBosses = data.defeatedBosses || [];
    GS.achievements = data.achievements || [];
    GS.gameTime = data.gameTime || 0;
    GS.playTime = data.playTime || 0;
    GS.entities = [];
    GS.ngPlus = data.ngPlus || 0;
    GS.difficulty = data.difficulty || 'normal';
    GS.bestiary = data.bestiary || {};
    GS.bestiaryRewards = data.bestiaryRewards || {};
    GS.dailyChallenges = data.dailyChallenges || null;
    GS.achievementCounters = data.achievementCounters || null;

    if (data.settings) {
      Object.assign(GS.settings, data.settings);
    }

    // Recreate player
    const p = data.player;
    GS.player = Classes.createPlayer(p.classType, p.name);
    GS.player.gold = p.gold || 0;

    // Restore stats with range validation
    const s = p.stats;
    GS.player.stats.level = Utils.clamp(s.level, 1, 99);
    GS.player.stats.xp = Math.max(0, s.xp || 0);
    GS.player.stats.xpToNext = Math.max(100, s.xpToNext || 100);
    GS.player.stats.maxHp = Math.max(1, s.maxHp);
    GS.player.stats.hp = Utils.clamp(s.hp, 1, s.maxHp);
    GS.player.stats.maxMp = Math.max(0, s.maxMp);
    GS.player.stats.mp = Utils.clamp(s.mp, 0, s.maxMp);
    GS.player.stats.str = Math.max(1, s.str);
    GS.player.stats.def = Math.max(0, s.def);
    GS.player.stats.int = Math.max(1, s.int);
    GS.player.stats.agi = Math.max(1, s.agi);
    GS.player.stats.luk = Math.max(0, s.luk);
    GS.player.stats.gold = p.gold || 0;

    // Restore items with validation
    GS.player.items = (p.items || []).filter(item =>
      item && typeof item.name === 'string' && typeof item.type === 'string'
    );

    // Restore equipment
    if (p.equipment) {
      for (const slot of Items.slotTypes) {
        GS.player.equipment[slot] = p.equipment[slot] || null;
      }
    }

    // Restore skills
    GS.player.skills = [];
    GS.player.learnedSkillIds = new Set();
    if (p.skills) {
      for (const skillId of p.skills) {
        const skill = Abilities.getSkill(skillId);
        if (skill) {
          GS.player.skills.push(skill);
          GS.player.learnedSkillIds.add(skillId);
        }
      }
    }
    if (p.learnedSkillIds) {
      for (const id of p.learnedSkillIds) {
        GS.player.learnedSkillIds.add(id);
      }
    }
    GS.player.skillPoints = Math.max(0, p.skillPoints || 0);

    // Restore position
    GS.player.x = p.x;
    GS.player.y = p.y;
    GS.player.dir = p.dir || 'down';

    // Restore pets
    GS.player.pets = data.pets || [];
    if (data.activePetId) {
      GS.player.activePet = GS.player.pets.find(p => p.id === data.activePetId) || null;
    }

    // Restore party
    GS.player.party = data.party || [];

    // Restore fishing
    GS.player.fishingUnlocked = data.fishingUnlocked || false;
    GS.player.fishCaught = data.fishCaught || {};
    GS.player.totalFishCaught = data.totalFishCaught || 0;
    GS.player.fishingCombo = data.fishingCombo || 0;
    GS.player.bestFishingCombo = data.bestFishingCombo || 0;
    GS.player.rodLevel = data.rodLevel || 1;

    // Main quest flag
    GS.mainQuestComplete = data.mainQuestComplete || false;

    // Cheat mode
    GS.cheatActive = data.cheatActive || false;

    // Re-init game subsystems
    if (typeof Achievements !== 'undefined') Achievements.init();
    if (typeof Bestiary !== 'undefined') Bestiary.init();
    if (typeof DailyChallenges !== 'undefined') DailyChallenges.init();
    if (typeof NewGamePlus !== 'undefined') NewGamePlus.init();
    if (typeof Systems !== 'undefined' && Systems.resetPartyTrail) Systems.resetPartyTrail();

    GS.entities.push(GS.player);

    // Load zone
    if (typeof WorldManager !== 'undefined') WorldManager.loadZone(data.currentZone || 'eldergrove', p.x, p.y);

    Core.setState(GameStates.PLAY);
    Core.addNotification('Game loaded!', 2);
    return true;
  }

  function autoSave() {
    save(GS.saveSlot);
  }

  function hasSave(slot) {
    return localStorage.getItem(getSaveKey(slot)) !== null;
  }

  function deleteSave(slot) {
    localStorage.removeItem(getSaveKey(slot));
  }

  function getSaveInfo(slot) {
    try {
      const raw = localStorage.getItem(getSaveKey(slot));
      if (!raw) return null;
      const saveObj = JSON.parse(raw);
      const data = JSON.parse(saveObj.data);
      return {
        name: data.player.name,
        classType: data.player.classType,
        level: data.player.stats.level,
        zone: data.currentZone,
        playTime: data.playTime,
        timestamp: data.timestamp
      };
    } catch (e) {
      return null;
    }
  }

  // Export/Import for backup
  async function exportSave(slot) {
    const raw = localStorage.getItem(getSaveKey(slot));
    if (!raw) return null;
    return raw;
  }

  async function importSave(jsonStr, slot) {
    try {
      const saveObj = JSON.parse(jsonStr);
      if (!saveObj.data || !saveObj.checksum) return false;
      const checksum = await Utils.sha256(saveObj.data);
      if (checksum !== saveObj.checksum) return false;
      localStorage.setItem(getSaveKey(slot), jsonStr);
      return true;
    } catch (e) {
      return false;
    }
  }

  return {
    save, load, autoSave, hasSave, deleteSave, getSaveInfo,
    exportSave, importSave
  };
})();
