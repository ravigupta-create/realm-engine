// data/fishing.js — Fishing minigame system

const Fishing = (() => {
  const fishDefs = {
    // Common fish
    pond_minnow: { name: 'Pond Minnow', rarity: 'common', value: 5, xp: 2, zone: 'any', desc: 'A tiny common fish.' },
    river_trout: { name: 'River Trout', rarity: 'common', value: 8, xp: 3, zone: 'eldergrove', desc: 'A healthy trout from the village river.' },
    forest_bass: { name: 'Forest Bass', rarity: 'common', value: 10, xp: 4, zone: 'whisperwood', desc: 'A green-scaled bass from woodland streams.' },
    sand_perch: { name: 'Sand Perch', rarity: 'common', value: 12, xp: 5, zone: 'sunscorch', desc: 'Hardy fish that thrives in oasis pools.' },

    // Uncommon fish
    cave_eel: { name: 'Cave Eel', rarity: 'uncommon', value: 25, xp: 10, zone: 'shadowmere', desc: 'An eyeless eel from underground rivers.' },
    frost_salmon: { name: 'Frost Salmon', rarity: 'uncommon', value: 30, xp: 12, zone: 'frostpeak', desc: 'A cold-water salmon with icy scales.' },
    shadow_catfish: { name: 'Shadow Catfish', rarity: 'uncommon', value: 28, xp: 11, zone: 'shadowmere', desc: 'A dark catfish that feeds on shadows.' },
    golden_carp: { name: 'Golden Carp', rarity: 'uncommon', value: 35, xp: 15, zone: 'eldergrove', desc: 'A beautiful golden fish.' },

    // Rare fish
    lava_fish: { name: 'Lava Fish', rarity: 'rare', value: 80, xp: 30, zone: 'abyss', desc: 'A fish that swims in magma. How?!' },
    crystal_pike: { name: 'Crystal Pike', rarity: 'rare', value: 100, xp: 40, zone: 'crystal_sanctum', desc: 'A pike with crystalline scales.' },
    abyssal_angler: { name: 'Abyssal Angler', rarity: 'rare', value: 90, xp: 35, zone: 'abyss', desc: 'Bioluminescent deep-sea predator.' },
    ghost_fish: { name: 'Ghost Fish', rarity: 'rare', value: 75, xp: 25, zone: 'shadowmere', desc: 'A translucent fish. Is it even real?' },

    // Epic fish
    void_koi: { name: 'Void Koi', rarity: 'epic', value: 250, xp: 80, zone: 'abyss', desc: 'A koi from the void between worlds.' },
    ancient_coelacanth: { name: 'Ancient Coelacanth', rarity: 'epic', value: 300, xp: 100, zone: 'any', desc: 'A living fossil, incredibly rare.' },
    storm_marlin: { name: 'Storm Marlin', rarity: 'epic', value: 280, xp: 90, zone: 'frostpeak', desc: 'Crackling with electrical energy.' },

    // Legendary fish
    leviathan_fry: { name: 'Leviathan Fry', rarity: 'legendary', value: 1000, xp: 250, zone: 'abyss', desc: 'Baby of the legendary sea monster.' },
    celestial_goldfish: { name: 'Celestial Goldfish', rarity: 'legendary', value: 1500, xp: 500, zone: 'crystal_sanctum', desc: 'A goldfish made of pure starlight.' },

    // Junk / treasures
    old_boot: { name: 'Old Boot', rarity: 'junk', value: 1, xp: 1, zone: 'any', desc: 'Someone lost their boot.' },
    rusty_sword: { name: 'Rusty Sword', rarity: 'junk', value: 10, xp: 2, zone: 'any', desc: 'A corroded blade. Could be repaired?' },
    treasure_chest: { name: 'Sunken Chest', rarity: 'rare', value: 200, xp: 50, zone: 'any', desc: 'A waterlogged treasure chest!' }
  };

  const rarityWeights = {
    junk: 0.10,
    common: 0.45,
    uncommon: 0.25,
    rare: 0.12,
    epic: 0.06,
    legendary: 0.02
  };

  // Fishing state
  let _state = {
    active: false,
    phase: 'idle', // idle, casting, waiting, bite, reeling, caught, failed
    timer: 0,
    biteTimer: 0,
    reelProgress: 0,
    targetReel: 0,
    fish: null,
    combo: 0,
    rodLevel: 1
  };

  function canFish() {
    if (_state.active) return false;
    // Check if player has fishing rod by various indicators
    const inv = GS.player.items || [];
    const hasRod = inv.some(i => i && (i.id === 'fishing_rod' || i.name === 'Fishing Rod' ||
                   (i.name && i.name.toLowerCase().includes('fishing rod')))) ||
                   (GS.player.equipment?.weapon?.id === 'fishing_rod') ||
                   (GS.player.equipment?.weapon?.name && GS.player.equipment.weapon.name.toLowerCase().includes('fishing rod'));
    // Also check if fishing skill unlocked or rod level set
    return hasRod || (GS.player.fishingUnlocked === true) || (GS.player.rodLevel && GS.player.rodLevel > 0);
  }

  function startFishing() {
    if (!canFish()) {
      Core.addNotification('You need a fishing rod!', 2);
      return false;
    }
    _state.active = true;
    _state.phase = 'casting';
    _state.timer = 0;
    _state.combo = GS.player.fishingCombo || 0;
    _state.rodLevel = GS.player.rodLevel || 1;
    if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    return true;
  }

  function update(dt) {
    if (!_state.active) return;

    switch (_state.phase) {
      case 'casting':
        _state.timer += dt;
        if (_state.timer > 0.5) {
          _state.phase = 'waiting';
          _state.timer = 0;
          _state.biteTimer = 2 + Math.random() * 5; // 2-7 seconds
        }
        break;

      case 'waiting':
        _state.timer += dt;
        if (_state.timer >= _state.biteTimer) {
          _state.phase = 'bite';
          _state.timer = 0;
          _state.fish = selectFish();
          _state.targetReel = getReelDifficulty(_state.fish);
          _state.reelProgress = 0;
          if (typeof AudioManager !== 'undefined') AudioManager.playSFX('hit');
          Core.addNotification('A bite! Press SPACE rapidly!', 1.5);
        }
        break;

      case 'bite':
        _state.timer += dt;
        // Fish escapes after window — higher rod = longer window
        const window = 3 + _state.rodLevel * 0.8;
        if (_state.timer > window) {
          _state.phase = 'failed';
          _state.timer = 0;
          _state.combo = 0;
          GS.player.fishingCombo = 0;
          Core.addNotification('The fish got away!', 2);
        }
        // Reel decays
        _state.reelProgress = Math.max(0, _state.reelProgress - dt * 15);
        break;

      case 'caught':
        _state.timer += dt;
        if (_state.timer > 2) {
          _state.active = false;
          _state.phase = 'idle';
        }
        break;

      case 'failed':
        _state.timer += dt;
        if (_state.timer > 1.5) {
          _state.active = false;
          _state.phase = 'idle';
        }
        break;
    }
  }

  function onReel() {
    if (_state.phase !== 'bite') return;
    _state.reelProgress += 8 + _state.rodLevel * 2;
    if (_state.reelProgress >= _state.targetReel) {
      catchFish(_state.fish);
    }
  }

  function selectFish() {
    const zone = typeof WorldManager !== 'undefined' ? WorldManager.getZone() : null;
    const zoneId = zone ? zone.id : 'any';

    // Filter fish by zone
    const available = Object.entries(fishDefs).filter(([, f]) =>
      f.zone === 'any' || f.zone === zoneId
    );

    // Luck bonus from player
    const luk = GS.player.stats?.luk || 0;
    const luckBonus = luk * 0.002; // Each LUK adds 0.2% to rare chances

    // Weighted random selection
    const roll = Math.random();
    let cumulative = 0;

    // Sort by rarity (best first for luck bonus)
    const rarities = ['legendary', 'epic', 'rare', 'uncommon', 'common', 'junk'];
    for (const rarity of rarities) {
      const weight = rarityWeights[rarity] + (rarity !== 'common' && rarity !== 'junk' ? luckBonus : 0);
      cumulative += weight;
      if (roll < cumulative) {
        const pool = available.filter(([, f]) => f.rarity === rarity);
        if (pool.length > 0) {
          const pick = pool[Math.floor(Math.random() * pool.length)];
          return { id: pick[0], ...pick[1] };
        }
      }
    }

    // Fallback to common
    const commons = available.filter(([, f]) => f.rarity === 'common');
    if (commons.length > 0) {
      const pick = commons[Math.floor(Math.random() * commons.length)];
      return { id: pick[0], ...pick[1] };
    }
    return { id: 'pond_minnow', ...fishDefs.pond_minnow };
  }

  function getReelDifficulty(fish) {
    const base = { junk: 30, common: 40, uncommon: 55, rare: 75, epic: 95, legendary: 120 };
    const baseDiff = base[fish.rarity] || 50;
    // Rod level reduces difficulty (higher rod = easier reeling)
    const rodReduction = Math.max(0.5, 1 - (_state.rodLevel - 1) * 0.08);
    return Math.floor(baseDiff * rodReduction);
  }

  function catchFish(fish) {
    _state.phase = 'caught';
    _state.timer = 0;
    _state.combo++;
    GS.player.fishingCombo = _state.combo;
    if (_state.combo > (GS.player.bestFishingCombo || 0)) {
      GS.player.bestFishingCombo = _state.combo;
    }

    // Track fish
    if (!GS.player.fishCaught) GS.player.fishCaught = {};
    GS.player.fishCaught[fish.id] = (GS.player.fishCaught[fish.id] || 0) + 1;
    GS.player.totalFishCaught = (GS.player.totalFishCaught || 0) + 1;

    // Award gold (combo bonus)
    const comboMult = 1 + Math.min(_state.combo * 0.1, 1.0);
    const gold = Math.floor(fish.value * comboMult);
    GS.player.gold = (GS.player.gold || 0) + gold;
    GS.player.stats.gold = GS.player.gold;

    // Award XP
    const xp = Math.floor(fish.xp * comboMult);
    if (typeof Classes !== 'undefined') Classes.addXP(xp);

    // Notification
    const rarityColors = { junk: '#888', common: '#fff', uncommon: '#4f4', rare: '#48f', epic: '#c4f', legendary: '#fa0' };
    Core.addNotification(`Caught: ${fish.name}! (+${gold}g, +${xp}xp)`, 3);

    if (typeof AudioManager !== 'undefined') AudioManager.playSFX(fish.rarity === 'legendary' ? 'levelup' : 'quest_complete');
    if (typeof Achievements !== 'undefined') Achievements.onFishCaught();
    if (typeof Quests !== 'undefined') Quests.onFishCaught();
    if (typeof DailyChallenges !== 'undefined') DailyChallenges.onFishCaught();
    // Rarity-appropriate victory particles
    if (typeof Particles !== 'undefined') {
      const rarityParticles = { junk: 'dust', common: 'hit', uncommon: 'heal', rare: 'magic', epic: 'arcane', legendary: 'levelup' };
      const pType = rarityParticles[fish.rarity] || 'hit';
      const pCount = { junk: 5, common: 8, uncommon: 12, rare: 18, epic: 25, legendary: 35 }[fish.rarity] || 10;
      Particles.emit(pType, Renderer.getWidth() / 2, Renderer.getHeight() / 2, pCount);
    }

    // Special treasure chest catch
    if (fish.id === 'treasure_chest') {
      const item = typeof Items !== 'undefined' ? Items.generateItem(GS.player.stats.level + 2) : null;
      if (item) {
        Items.addToInventory(item);
        Core.addNotification(`Found: ${item.name}!`, 4);
      }
    }
  }

  function getState() {
    return { ..._state };
  }

  function getStats() {
    return {
      totalCaught: GS.player.totalFishCaught || 0,
      uniqueCaught: GS.player.fishCaught ? Object.keys(GS.player.fishCaught).length : 0,
      totalSpecies: Object.keys(fishDefs).length,
      bestCombo: GS.player.bestFishingCombo || 0,
      fishLog: GS.player.fishCaught || {}
    };
  }

  function cancel() {
    _state.active = false;
    _state.phase = 'idle';
    _state.combo = 0;
  }

  return { fishDefs, canFish, startFishing, update, onReel, getState, getStats, cancel };
})();
