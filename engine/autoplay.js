// engine/autoplay.js — Auto-play bot mode (activated by "srg2" cheat code)
// Injects virtual key presses for movement/combat/menus (looks like human playing).
// Calls game APIs directly for management (equip, recruit, craft, enchant, rewards).
// Reads Combat.getState() and Dialogue.getState() for reliable menu navigation.
// Uses WorldManager.canMoveTo() for obstacle-aware pathfinding.
// Uses Enemies.defs for elemental weakness/resistance matching in combat.

const AutoPlay = (() => {
  // ======== FLAGS ========
  let _unlocked = false;
  let _active = false;

  // ======== TIMING ========
  let _combatDelay = 0;
  let _dialogueDelay = 0;
  let _actionTimer = 0;
  let _mgmtTimer = 0;       // Management tick every ~5s

  // ======== EXPLORATION ========
  let _moveTimer = 0;
  let _moveDir = null;
  let _lastInteract = 0;
  let _idleTimer = 0;
  let _zoneTimer = 0;
  let _zoneStayTime = 0;
  let _exitTarget = null;
  let _currentZoneName = '';
  let _lastZoneName = '';
  let _zoneTransitions = 0;

  // Position history for stuck detection + avoidance
  const POS_HISTORY_LEN = 20;
  let _posHistory = [];
  let _posHistoryIdx = 0;
  let _stuckLevel = 0;
  let _stuckTimer = 0;
  let _wallFollowDir = 0;
  let _wallFollowTimer = 0;
  let _lastMoveAngle = 0;
  let _backtrackTimer = 0;

  // Visited tile tracking for systematic exploration
  let _visitedTiles = {};
  let _visitedZone = '';

  // ======== COMBAT ========
  let _wantAction = -1;
  let _wantSkillIdx = 0;
  let _wantItemIdx = 0;
  let _wantTargetIdx = 0;

  // ======== FISHING ========
  let _reelTimer = 0;

  // ======== DIALOGUE ========
  let _dialogueSkippedTypewriter = false;

  // ======== CLASS SELECT ========
  let _classPhase = 'browse';
  let _classBrowseCount = 0;
  let _classBrowseTarget = 0;
  let _chosenName = '';
  let _nameIdx = 0;
  let _classDelay = 0;
  let _classTimer = 0;

  // ======== TITLE ========
  let _titleTimer = 0;

  const BOT_NAMES = [
    'Zephyr', 'Astra', 'Bolt', 'Nova', 'Rex', 'Luna', 'Kai', 'Vex', 'Orion', 'Blaze',
    'Ash', 'Storm', 'Ember', 'Frost', 'Hawk', 'Jade', 'Nyx', 'Sol', 'Wren', 'Rune'
  ];

  // Zone connectivity graph for BFS pathfinding
  const ZONE_GRAPH = {
    eldergrove:       ['whisperwood', 'frostpeak'],
    whisperwood:      ['eldergrove', 'shadowmere', 'sunscorch'],
    shadowmere:       ['whisperwood'],
    sunscorch:        ['whisperwood', 'abyss'],
    frostpeak:        ['eldergrove', 'abyss'],
    abyss:            ['sunscorch', 'frostpeak', 'crystal_sanctum'],
    crystal_sanctum:  ['abyss']
  };

  // Level ranges per zone (min comfortable, max comfortable)
  const ZONE_LEVELS = {
    eldergrove:       [1, 99],   // town, always fine
    whisperwood:      [1, 4],
    shadowmere:       [3, 6],
    sunscorch:        [5, 8],
    frostpeak:        [5, 9],
    abyss:            [8, 13],
    crystal_sanctum:  [10, 18]
  };

  // ================================================================
  //  UTILITIES
  // ================================================================
  function rand(min, max) { return min + Math.random() * (max - min); }
  function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
  function pressKey(code) { Input.justPressed[code] = true; Input.keys[code] = true; }
  function holdKey(code) { Input.keys[code] = true; }

  function distTo(entity) {
    if (!entity || !GS.player) return 999;
    const dx = entity.x - GS.player.x;
    const dy = entity.y - GS.player.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function dist(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function canWalk(x, y) {
    return WorldManager.canMoveTo(x, y);
  }

  // Score an item by its total stats (for equipment comparison)
  function itemScore(item) {
    if (!item || !item.stats) return 0;
    const s = item.stats;
    // Weight offensive and defensive stats, HP/MP at reduced weight
    return (s.str || 0) + (s.def || 0) + (s.int || 0) + (s.agi || 0) +
           (s.luk || 0) + (s.hp || 0) * 0.1 + (s.mp || 0) * 0.08;
  }

  // ================================================================
  //  POSITION TRACKING & STUCK DETECTION
  // ================================================================
  function recordPosition() {
    if (!GS.player) return;
    if (_posHistory.length < POS_HISTORY_LEN) {
      _posHistory.push({ x: GS.player.x, y: GS.player.y, t: GS.time });
    } else {
      _posHistory[_posHistoryIdx] = { x: GS.player.x, y: GS.player.y, t: GS.time };
    }
    _posHistoryIdx = (_posHistoryIdx + 1) % POS_HISTORY_LEN;

    // Track visited tiles
    if (_visitedZone !== _currentZoneName) {
      _visitedTiles = {};
      _visitedZone = _currentZoneName;
    }
    const tileKey = Math.floor(GS.player.x) + ',' + Math.floor(GS.player.y);
    _visitedTiles[tileKey] = GS.time;
  }

  function updateStuckDetection(dt) {
    if (_posHistory.length < 5) { _stuckLevel = 0; return; }
    const now = GS.time;
    let oldest = null;
    for (let i = 0; i < _posHistory.length; i++) {
      const p = _posHistory[i];
      if (p && now - p.t < 1.5 && now - p.t > 0.5) {
        if (!oldest || p.t < oldest.t) oldest = p;
      }
    }
    if (!oldest) { _stuckLevel = 0; return; }

    const displacement = dist(GS.player.x, GS.player.y, oldest.x, oldest.y);
    const elapsed = now - oldest.t;
    const speed = displacement / Math.max(0.1, elapsed);

    if (speed < 0.3) {
      _stuckTimer += dt;
      if (_stuckTimer > 2.5) _stuckLevel = 3;
      else if (_stuckTimer > 1.5) _stuckLevel = 2;
      else if (_stuckTimer > 0.6) _stuckLevel = 1;
    } else {
      _stuckTimer = Math.max(0, _stuckTimer - dt * 2);
      if (_stuckTimer < 0.3) _stuckLevel = 0;
    }
  }

  // ================================================================
  //  SMART MOVEMENT — obstacle-aware pathfinding
  // ================================================================
  function smartWalkToward(tx, ty) {
    if (!GS.player) return;
    const px = GS.player.x, py = GS.player.y;
    const dx = tx - px, dy = ty - py;
    const angle = Math.atan2(dy, dx);
    _lastMoveAngle = angle;
    const step = 0.8;

    // Strategy 1: Direct path
    if (canWalk(px + Math.cos(angle) * step, py + Math.sin(angle) * step)) {
      applyMoveAngle(angle);
      _wallFollowDir = 0;
      return;
    }

    // Strategy 2: Axis sliding
    const hx = px + Math.cos(angle) * step;
    if (Math.abs(Math.cos(angle)) > 0.1 && canWalk(hx, py)) {
      holdKey(Math.cos(angle) > 0 ? 'ArrowRight' : 'ArrowLeft');
      return;
    }
    const vy = py + Math.sin(angle) * step;
    if (Math.abs(Math.sin(angle)) > 0.1 && canWalk(px, vy)) {
      holdKey(Math.sin(angle) > 0 ? 'ArrowDown' : 'ArrowUp');
      return;
    }

    // Strategy 3: Angled deflections (±30°, ±60°, ±90°)
    const deflections = [0.5, -0.5, 1.0, -1.0, 1.5, -1.5];
    for (const d of deflections) {
      const a = angle + d;
      if (canWalk(px + Math.cos(a) * step, py + Math.sin(a) * step)) {
        applyMoveAngle(a);
        return;
      }
    }

    // Strategy 4: Wall following
    if (_wallFollowDir === 0) _wallFollowDir = Math.random() < 0.5 ? -1 : 1;
    const wallAngle = angle + (Math.PI / 2) * _wallFollowDir;
    if (canWalk(px + Math.cos(wallAngle) * step, py + Math.sin(wallAngle) * step)) {
      applyMoveAngle(wallAngle);
    } else {
      _wallFollowDir *= -1;
      applyMoveAngle(angle + (Math.PI / 2) * _wallFollowDir);
    }
  }

  function applyMoveAngle(angle) {
    const ax = Math.cos(angle), ay = Math.sin(angle);
    if (ax > 0.3) holdKey('ArrowRight');
    else if (ax < -0.3) holdKey('ArrowLeft');
    if (ay > 0.3) holdKey('ArrowDown');
    else if (ay < -0.3) holdKey('ArrowUp');
  }

  function pickSmartWanderDir() {
    if (!GS.player) return;
    const px = GS.player.x, py = GS.player.y;
    const zone = WorldManager.getZone();
    if (!zone) { return Math.random() * Math.PI * 2; }

    const directions = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      let passable = 0, unvisited = 0;
      for (let d = 1; d <= 3; d++) {
        const cx = px + Math.cos(a) * d;
        const cy = py + Math.sin(a) * d;
        if (canWalk(cx, cy)) {
          passable++;
          const key = Math.floor(cx) + ',' + Math.floor(cy);
          if (!_visitedTiles[key]) unvisited++;
          else {
            const age = GS.time - (_visitedTiles[key] || 0);
            if (age > 30) unvisited += 0.5;
          }
        }
      }
      const tx = px + Math.cos(a) * 3;
      const ty = py + Math.sin(a) * 3;
      if (tx < 1 || tx >= zone.width - 1 || ty < 1 || ty >= zone.height - 1) passable -= 2;
      directions.push({ angle: a, score: passable * 2 + unvisited * 3 });
    }

    directions.sort((a, b) => b.score - a.score);
    const topN = directions.slice(0, 3);
    const totalScore = topN.reduce((s, d) => s + Math.max(1, d.score), 0);
    let r = Math.random() * totalScore;
    for (const d of topN) {
      r -= Math.max(1, d.score);
      if (r <= 0) { _lastMoveAngle = d.angle; return d.angle; }
    }
    _lastMoveAngle = topN[0].angle;
    return topN[0].angle;
  }

  // ================================================================
  //  CHARACTER MANAGEMENT — direct API calls for optimization
  // ================================================================
  function managementTick() {
    if (!GS.player || !GS.player.stats) return;
    autoEquipBestGear();
    autoRecruitAllies();
    autoActivateBestPet();
    autoClaimRewards();
    autoUseConsumables();
    autoCraftItems();
    autoEnchantGear();
  }

  function autoEquipBestGear() {
    if (!GS.player.items) return;
    const equipment = GS.player.items.filter(i => i.type === 'equipment');
    for (const item of equipment) {
      const slot = item.slot;
      const current = GS.player.equipment ? GS.player.equipment[slot] : null;
      if (!current) {
        // Empty slot — equip immediately
        try { Inventory.equipItem(item); } catch (e) { /* skip */ }
        continue;
      }
      if (itemScore(item) > itemScore(current)) {
        try { Inventory.equipItem(item); } catch (e) { /* skip */ }
      }
    }
  }

  function autoRecruitAllies() {
    if (typeof Allies === 'undefined') return;
    if (!GS.player.party) GS.player.party = [];
    if (GS.player.party.length >= 3) return;

    try {
      const available = Allies.getAvailableRecruits();
      if (!available || available.length === 0) return;

      // Priority: healer > tank > dps/support
      const priority = { healer: 4, tank: 3, dps: 2, support: 1 };
      available.sort((a, b) => (priority[b.role] || 0) - (priority[a.role] || 0));

      for (const ally of available) {
        if (GS.player.party.length >= 3) break;
        Allies.recruitAlly(ally.id);
      }
    } catch (e) { /* skip */ }
  }

  function autoActivateBestPet() {
    if (typeof Pets === 'undefined') return;
    if (!GS.player.pets || GS.player.pets.length === 0) return;
    if (GS.player.activePet) return;

    const rarityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
    const sorted = [...GS.player.pets].sort((a, b) =>
      (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0)
    );
    try { Pets.setActivePet(sorted[0].id); } catch (e) { /* skip */ }
  }

  function autoClaimRewards() {
    // Daily challenges
    if (typeof DailyChallenges !== 'undefined') {
      try {
        const challenges = DailyChallenges.getChallenges();
        if (challenges) {
          for (const c of challenges) {
            if (c.completed && !c.claimed) DailyChallenges.claimReward(c.id);
          }
        }
      } catch (e) { /* skip */ }
    }

    // Bestiary milestones
    if (typeof Bestiary !== 'undefined') {
      try { Bestiary.checkRewards(); } catch (e) { /* skip */ }
    }
  }

  function autoUseConsumables() {
    if (!GS.player.items || typeof Inventory === 'undefined' || typeof Inventory.useItem !== 'function') return;
    const s = GS.player.stats;

    // HP potion if HP < 50%
    if (s.hp < s.maxHp * 0.5) {
      const pot = GS.player.items.find(i =>
        i.type === 'consumable' && (i.effect === 'heal_hp' || i.effect === 'heal_both')
      );
      if (pot) { try { Inventory.useItem(pot); } catch (e) {} return; }
    }

    // MP potion if MP < 20%
    if (s.mp < s.maxMp * 0.2) {
      const pot = GS.player.items.find(i =>
        i.type === 'consumable' && (i.effect === 'heal_mp' || i.effect === 'heal_both')
      );
      if (pot) { try { Inventory.useItem(pot); } catch (e) {} return; }
    }

    // Revive fallen allies
    if (GS.player.party && GS.player.party.length > 0) {
      const fallen = GS.player.party.find(a => a.stats && a.stats.hp <= 0);
      if (fallen) {
        const revive = GS.player.items.find(i => i.type === 'consumable' && i.effect === 'revive');
        if (revive) { try { Inventory.useItem(revive); } catch (e) {} }
      }
    }

    // Cure poison
    if (GS.player.statusEffects && GS.player.statusEffects.some(e => e.type === 'poison')) {
      const cure = GS.player.items.find(i => i.type === 'consumable' && i.effect === 'cure_poison');
      if (cure) { try { Inventory.useItem(cure); } catch (e) {} }
    }
  }

  function autoCraftItems() {
    if (typeof Crafting === 'undefined') return;
    try {
      const recipes = Crafting.getAvailableRecipes(GS.player);
      if (!recipes) return;
      for (const recipe of recipes) {
        if (!recipe.canCraft) continue;

        // Always craft consumables (potions, etc.)
        if (recipe.result.type === 'consumable') {
          Crafting.craft(recipe, GS.player);
          continue;
        }

        // Craft equipment if it's an upgrade over current
        if (recipe.result.type === 'equipment' && recipe.result.slot) {
          const current = GS.player.equipment ? GS.player.equipment[recipe.result.slot] : null;
          if (!current || itemScore(recipe.result) > itemScore(current)) {
            Crafting.craft(recipe, GS.player);
          }
        }
      }
    } catch (e) { /* skip */ }
  }

  function autoEnchantGear() {
    if (typeof Enchanting === 'undefined') return;
    const slots = ['weapon', 'armor', 'helmet', 'boots', 'ring', 'amulet'];

    for (const slot of slots) {
      const item = GS.player.equipment ? GS.player.equipment[slot] : null;
      if (!item || item.enchant) continue;

      try {
        const available = Enchanting.getAvailableEnchants(item);
        if (!available || available.length === 0) continue;

        const best = pickBestEnchant(available, slot);
        if (best) {
          const result = Enchanting.enchantItem(item, best.id);
          if (result && result.ok) {
            try { Inventory.recalcStats(); } catch (e2) {}
          }
        }
      } catch (e) { /* skip */ }
    }
  }

  function pickBestEnchant(enchants, slot) {
    const priorities = {
      weapon:  ['vampiric', 'thunderstrike', 'fire_blade', 'ice_blade', 'holy_blade', 'shadow_blade'],
      armor:   ['phoenix_guard', 'vitality', 'fortify', 'arcane_ward', 'thorns'],
      helmet:  ['vitality', 'fortify', 'arcane_ward'],
      boots:   ['swift', 'fortify'],
      ring:    ['celestial', 'berserker', 'lucky', 'wise', 'swift'],
      amulet:  ['celestial', 'berserker', 'lucky', 'wise', 'swift']
    };
    const prio = priorities[slot] || [];
    for (const id of prio) {
      const found = enchants.find(e => e.id === id);
      if (found) return found;
    }
    return enchants[0];
  }

  // ================================================================
  //  ZONE PROGRESSION — level-appropriate, BFS pathfinding
  // ================================================================
  function getTargetZone() {
    if (!GS.player) return 'whisperwood';
    const level = GS.player.stats.level;

    // Check active quests for zone objectives
    if (typeof Quests !== 'undefined') {
      try {
        const active = Quests.getActiveQuests();
        if (active) {
          for (const q of active) {
            if (q.objectives) {
              for (const obj of q.objectives) {
                if (obj.type === 'visit_zone' && !obj.completed && ZONE_LEVELS[obj.target]) {
                  return obj.target;
                }
              }
            }
          }
        }
      } catch (e) {}
    }

    // Level-appropriate zone
    if (level <= 2) return 'whisperwood';
    if (level <= 4) return 'shadowmere';
    if (level <= 6) return Math.random() < 0.5 ? 'sunscorch' : 'frostpeak';
    if (level <= 9) return 'frostpeak';
    if (level <= 12) return 'abyss';
    return 'crystal_sanctum';
  }

  function shouldReturnToTown() {
    if (!GS.player) return false;
    const s = GS.player.stats;

    // Return if HP critical and no potions
    if (s.hp < s.maxHp * 0.25) {
      const hasPot = GS.player.items && GS.player.items.some(i =>
        i.type === 'consumable' && (i.effect === 'heal_hp' || i.effect === 'heal_both')
      );
      if (!hasPot) return true;
    }

    // Return to town every 4 zone transitions for management
    if (_zoneTransitions > 0 && _zoneTransitions % 4 === 0 && _currentZoneName !== 'eldergrove') return true;

    return false;
  }

  function getSmartZoneStayTime() {
    if (!GS.player) return rand(40, 80);
    const level = GS.player.stats.level;
    const zl = ZONE_LEVELS[_currentZoneName];

    if (_currentZoneName === 'eldergrove') return rand(12, 20); // Town: short visit
    if (!zl) return rand(40, 80);

    // Too hard: leave quickly
    if (level < zl[0] - 1) return rand(10, 20);
    // Too easy: leave sooner
    if (level > zl[1] + 2) return rand(20, 35);
    // Just right: stay and farm
    return rand(55, 100);
  }

  function pickSmartExit() {
    const zone = WorldManager.getZone();
    if (!zone || !zone.exits || zone.exits.length === 0) return null;

    const usable = zone.exits.filter(e =>
      !e.requireBoss || (GS.defeatedBosses && GS.defeatedBosses.includes(e.requireBoss))
    );
    if (usable.length === 0) return null;

    const targetZone = shouldReturnToTown() ? 'eldergrove' : getTargetZone();

    // Direct exit to target?
    const direct = usable.find(e => e.target === targetZone);
    if (direct) return direct;

    // BFS shortest path to target
    const current = GS.currentZone;
    const visited = new Set([current]);
    const queue = [[current]];
    let bestPath = null;

    while (queue.length > 0) {
      const path = queue.shift();
      const node = path[path.length - 1];
      if (node === targetZone) { bestPath = path; break; }

      const neighbors = ZONE_GRAPH[node] || [];
      for (const next of neighbors) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push([...path, next]);
        }
      }
    }

    if (bestPath && bestPath.length > 1) {
      const nextZone = bestPath[1];
      const exit = usable.find(e => e.target === nextZone);
      if (exit) return exit;
    }

    // Fallback: prefer forward exits
    const forward = usable.filter(e => e.target !== _lastZoneName);
    const pool = forward.length > 0 ? forward : usable;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ================================================================
  //  INIT
  // ================================================================
  function activate() { _unlocked = true; _active = true; }
  function isActive() { return _unlocked && _active; }
  function isUnlocked() { return _unlocked; }

  function init() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && _unlocked) {
        _active = !_active;
        Core.addNotification(_active ? 'Auto-Play ON' : 'Auto-Play OFF', 2);
        if (_active) { _wantAction = -1; _stuckLevel = 0; _stuckTimer = 0; }
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    }, true);
  }

  // ================================================================
  //  MAIN UPDATE
  // ================================================================
  function update(dt) {
    if (!_active) return;
    _actionTimer += dt;

    switch (GS.state) {
      case GameStates.PLAY:         botExplore(dt); break;
      case GameStates.COMBAT:       botCombat(dt); break;
      case GameStates.DIALOGUE:     botDialogue(dt); break;
      case GameStates.INVENTORY:    botCloseMenu(dt); break;
      case GameStates.QUEST_LOG:    botCloseMenu(dt); break;
      case GameStates.PAUSED:       botCloseMenu(dt); break;
      case GameStates.GAME_OVER:    botGameOver(dt); break;
      case GameStates.CLASS_SELECT: botClassSelect(dt); break;
      case GameStates.MENU:         botTitleMenu(dt); break;
      case GameStates.VICTORY:      botVictory(dt); break;
    }
  }

  // ================================================================
  //  EXPLORATION — obstacle-aware, zone-aware, management-enabled
  // ================================================================
  function botExplore(dt) {
    _lastInteract += dt;
    _moveTimer -= dt;
    _zoneTimer += dt;
    _mgmtTimer -= dt;

    recordPosition();
    updateStuckDetection(dt);

    // Detect zone changes
    if (GS.currentZone !== _currentZoneName) {
      _lastZoneName = _currentZoneName;
      _currentZoneName = GS.currentZone;
      _zoneTimer = 0;
      _zoneStayTime = getSmartZoneStayTime();
      _exitTarget = null;
      _stuckLevel = 0;
      _stuckTimer = 0;
      _wallFollowDir = 0;
      _zoneTransitions++;
    }

    // Management tick every ~5 seconds
    if (_mgmtTimer <= 0) {
      managementTick();
      _mgmtTimer = rand(4.5, 6.0);
    }

    // Fishing takes priority
    const fishState = typeof Fishing !== 'undefined' ? Fishing.getState() : { active: false };
    if (fishState.active) {
      botFishing(fishState, dt);
      return;
    }

    // Auto-heal with skills outside combat if HP < 60%
    if (GS.player && GS.player.stats && GS.player.skills) {
      const s = GS.player.stats;
      if (s.hp < s.maxHp * 0.6) {
        for (let i = 0; i < Math.min(4, GS.player.skills.length); i++) {
          const skill = GS.player.skills[i];
          if (skill.type === 'heal' && s.mp >= skill.mpCost) {
            pressKey(['Digit1', 'Digit2', 'Digit3', 'Digit4'][i]);
            return;
          }
        }
      }
    }

    // Occasional idle pause (human-like thinking)
    if (_idleTimer <= 0 && _stuckLevel === 0 && Math.random() < 0.002) {
      _idleTimer = rand(0.6, 2.0);
    }
    if (_idleTimer > 0) {
      _idleTimer -= dt;
      return;
    }

    // === STUCK RECOVERY ===
    if (_stuckLevel >= 2) {
      _backtrackTimer -= dt;
      if (_stuckLevel === 3 || _backtrackTimer <= 0) {
        const reverseAngle = _lastMoveAngle + Math.PI + rand(-0.8, 0.8);
        applyMoveAngle(reverseAngle);
        _backtrackTimer = rand(0.8, 1.5);
        _moveDir = null;
        _exitTarget = null;
        _wallFollowDir = 0;
        if (_stuckLevel === 3) { _stuckTimer = 0; _stuckLevel = 1; }
        return;
      }
    }

    const nearby = WorldManager.getEntitiesNear(GS.player.x, GS.player.y, 6);

    // Priority 1: Interact with very close interactable entities
    if (_lastInteract > 2.5) {
      for (const ent of nearby) {
        if (ent === GS.player) continue;
        const d = distTo(ent);
        if (d < 1.8 && ent.interactable && (ent.isNPC || (ent.isChest && !ent.opened))) {
          pressKey('KeyE');
          _lastInteract = 0;
          return;
        }
      }
    }

    // Priority 2: Fish if facing water and have rod
    if (_lastInteract > 4.0 && WorldManager.isFacingWater(GS.player)) {
      if (typeof Fishing !== 'undefined' && Fishing.canFish()) {
        pressKey('KeyE');
        _lastInteract = 0;
        return;
      }
    }

    // Priority 3: Walk toward interesting entities (obstacle-aware)
    let bestTarget = null;
    let bestScore = 0;
    const playerLevel = GS.player.stats ? GS.player.stats.level : 1;

    for (const ent of nearby) {
      if (ent === GS.player) continue;
      const d = distTo(ent);

      if (ent.isEnemy && ent.stats && ent.stats.hp > 0 && !ent.defeated) {
        // Avoid enemies way above our level when HP is low
        const hpPct = GS.player.stats.hp / GS.player.stats.maxHp;
        const levelDiff = (ent.level || 1) - playerLevel;
        let score = 5 + (6 - d);
        if (levelDiff > 3 && hpPct < 0.5) score -= 10; // Too dangerous
        if (ent.isBoss) score += 3; // Bosses are important for progression
        if (score > bestScore) { bestScore = score; bestTarget = ent; }
      }
      if (ent.isChest && !ent.opened) {
        const score = 3 + (4 - Math.min(d, 4));
        if (score > bestScore) { bestScore = score; bestTarget = ent; }
      }
      if (ent.isNPC && _lastInteract > 6 && d > 1.5) {
        // NPCs are important in town for quests/healing
        const score = (_currentZoneName === 'eldergrove') ? 3 : 1.5;
        if (score > bestScore) { bestScore = score; bestTarget = ent; }
      }
    }

    if (bestTarget) {
      smartWalkToward(bestTarget.x, bestTarget.y);
      _moveTimer = 0.15;
      return;
    }

    // Priority 4: Navigate toward zone exit
    if (_zoneTimer > _zoneStayTime) {
      if (!_exitTarget) _exitTarget = pickSmartExit();
      if (_exitTarget) {
        smartWalkToward(_exitTarget.x + 0.5, _exitTarget.y + 0.5);
        _moveTimer = 0.15;
        return;
      }
    }

    // Default: smart wander
    if (_moveTimer <= 0) {
      const angle = pickSmartWanderDir();
      if (angle !== undefined) _moveDir = angle;
      _moveTimer = rand(1.5, 3.5);
    }

    if (_moveDir !== null) {
      const step = 0.8;
      const nx = GS.player.x + Math.cos(_moveDir) * step;
      const ny = GS.player.y + Math.sin(_moveDir) * step;
      if (canWalk(nx, ny)) {
        applyMoveAngle(_moveDir);
      } else {
        const newAngle = pickSmartWanderDir();
        if (newAngle !== undefined) {
          _moveDir = newAngle;
          applyMoveAngle(_moveDir);
        }
        _moveTimer = rand(0.5, 1.5);
      }
    }
  }

  // ================================================================
  //  FISHING — human-like reel timing with phase awareness
  // ================================================================
  function botFishing(fishState, dt) {
    _reelTimer -= dt;
    if (fishState.phase === 'bite' || fishState.phase === 'reel') {
      if (_reelTimer <= 0) {
        pressKey('Enter');
        // Slightly imperfect human timing
        _reelTimer = rand(0.04, 0.14);
      }
    } else if (fishState.phase === 'result' || fishState.phase === 'caught' || fishState.phase === 'escaped') {
      if (_reelTimer <= 0) {
        pressKey('Enter');
        _reelTimer = rand(0.5, 1.0);
      }
    }
  }

  // ================================================================
  //  COMBAT — elemental awareness, summons, status effects, day/night
  // ================================================================
  function botCombat(dt) {
    _combatDelay -= dt;
    if (_combatDelay > 0) return;

    if (!GS.player || !GS.player.stats) return;
    const cs = Combat.getState();

    // Not our turn — wait
    if (!cs.isPlayerTurn) {
      _wantAction = -1;
      _combatDelay = 0.1;
      return;
    }

    // Stunned — just confirm
    if (cs.playerStunned) {
      pressKey('Enter');
      _combatDelay = rand(0.4, 0.7);
      _wantAction = -1;
      return;
    }

    // === Handle submenus ===
    if (cs.subMenu === 'target_enemy') {
      if (cs.selectedTarget < _wantTargetIdx) {
        pressKey('ArrowRight'); _combatDelay = rand(0.1, 0.2);
      } else if (cs.selectedTarget > _wantTargetIdx) {
        pressKey('ArrowLeft'); _combatDelay = rand(0.1, 0.2);
      } else {
        pressKey('Enter'); _combatDelay = rand(0.5, 0.9); _wantAction = -1;
      }
      return;
    }

    if (cs.subMenu === 'skills') {
      if (cs.selectedSkill < _wantSkillIdx) {
        pressKey('ArrowDown'); _combatDelay = rand(0.1, 0.2);
      } else if (cs.selectedSkill > _wantSkillIdx) {
        pressKey('ArrowUp'); _combatDelay = rand(0.1, 0.2);
      } else {
        pressKey('Enter'); _combatDelay = rand(0.25, 0.45);
      }
      return;
    }

    if (cs.subMenu === 'items') {
      if (cs.selectedItem < _wantItemIdx) {
        pressKey('ArrowDown'); _combatDelay = rand(0.1, 0.2);
      } else if (cs.selectedItem > _wantItemIdx) {
        pressKey('ArrowUp'); _combatDelay = rand(0.1, 0.2);
      } else {
        pressKey('Enter'); _combatDelay = rand(0.3, 0.5); _wantAction = -1;
      }
      return;
    }

    // === Main action menu: decide what to do ===
    if (_wantAction < 0) {
      const decision = decideCombatAction(cs);
      _wantAction = decision.action;
      _wantSkillIdx = decision.skillIdx || 0;
      _wantItemIdx = decision.itemIdx || 0;
      _wantTargetIdx = decision.targetIdx;
      // Human-like thinking time: quick for attacks, slower for skills
      _combatDelay = _wantAction === 0 ? rand(0.3, 0.7) : rand(0.5, 1.2);
      // Occasional extra pause (like considering options)
      if (Math.random() < 0.1) _combatDelay += rand(0.3, 0.8);
      return;
    }

    // Navigate to the desired action
    if (cs.selectedAction < _wantAction) {
      pressKey('ArrowDown'); _combatDelay = rand(0.08, 0.18);
    } else if (cs.selectedAction > _wantAction) {
      pressKey('ArrowUp'); _combatDelay = rand(0.08, 0.18);
    } else {
      pressKey('Enter');
      if (_wantAction >= 3) { // Defend/Flee — no submenu
        _combatDelay = rand(0.5, 0.9);
        _wantAction = -1;
      } else {
        _combatDelay = rand(0.2, 0.4);
      }
    }
  }

  function decideCombatAction(cs) {
    const s = GS.player.stats;
    const skills = GS.player.skills || [];
    const hpPct = s.hp / s.maxHp;
    const mpPct = s.mp / Math.max(1, s.maxMp);
    const enemies = cs.liveEnemies || [];
    const hasBoss = enemies.some(e => e.isBoss);
    const enemyCount = enemies.length;

    // Day/night combat modifiers
    const dayMods = typeof DayNight !== 'undefined' ? DayNight.getCombatModifiers() : {};

    // Smart target selection (considers weaknesses, HP, threat)
    const targetIdx = findBestTarget(cs, skills, dayMods);
    const target = enemies[targetIdx] || enemies[0];

    // === CRITICAL HEAL (HP < 25%) ===
    if (hpPct < 0.25) {
      const healIdx = findBestHealSkill(skills, s);
      if (healIdx >= 0) return { action: 1, skillIdx: healIdx, targetIdx };
      const hpItem = findHealItem();
      if (hpItem >= 0) return { action: 2, itemIdx: hpItem, targetIdx };
      return { action: 3, targetIdx }; // Defend to reduce damage
    }

    // === SUMMON if class has summon skills and no summons active ===
    if (!cs.hasSummons && mpPct > 0.3) {
      const summonIdx = skills.findIndex(sk => sk.type === 'summon' && s.mp >= sk.mpCost);
      if (summonIdx >= 0) return { action: 1, skillIdx: summonIdx, targetIdx };
    }

    // === STUN BOSS (70% chance per turn) ===
    if (hasBoss && Math.random() < 0.7) {
      const stunIdx = findStunSkill(skills, s);
      if (stunIdx >= 0) {
        const bossIdx = enemies.findIndex(e => e.isBoss);
        return { action: 1, skillIdx: stunIdx, targetIdx: bossIdx >= 0 ? bossIdx : targetIdx };
      }
    }

    // === LIFESTEAL when HP 30-60% (best of both worlds: damage + heal) ===
    if (hpPct > 0.30 && hpPct < 0.60) {
      const lifeIdx = skills.findIndex(sk => sk.special === 'lifesteal' && s.mp >= sk.mpCost);
      if (lifeIdx >= 0) return { action: 1, skillIdx: lifeIdx, targetIdx };
    }

    // === MODERATE HEAL (HP < 50%, 50% chance) ===
    if (hpPct < 0.50 && Math.random() < 0.5) {
      const healIdx = findBestHealSkill(skills, s);
      if (healIdx >= 0) return { action: 1, skillIdx: healIdx, targetIdx };
    }

    // === NIGHT-ADJUSTED HEAL (enemies hit harder at night) ===
    if (dayMods.isNight && hpPct < 0.65 && Math.random() < 0.4) {
      const healIdx = findBestHealSkill(skills, s);
      if (healIdx >= 0) return { action: 1, skillIdx: healIdx, targetIdx };
    }

    // === BUFF on first turn or 15% chance (with enough MP) ===
    if ((cs.turnCounter <= 1 || Math.random() < 0.15) && mpPct > 0.4) {
      const buffIdx = skills.findIndex(sk => sk.type === 'buff' && s.mp >= sk.mpCost);
      if (buffIdx >= 0) return { action: 1, skillIdx: buffIdx, targetIdx };
    }

    // === FOCUS FIRE: finish off nearly-dead enemies ===
    for (let i = 0; i < enemies.length; i++) {
      if (enemies[i].hp > 0 && enemies[i].hp < enemies[i].maxHp * 0.2) {
        return { action: 0, targetIdx: i };
      }
    }

    // === AoE when 3+ enemies ===
    if (enemyCount >= 3 && mpPct > 0.25) {
      const aoeIdx = findBestAoESkill(skills, s, enemies, dayMods);
      if (aoeIdx >= 0) return { action: 1, skillIdx: aoeIdx, targetIdx };
    }

    // === ELEMENTAL DAMAGE SKILL (65% chance, with MP) ===
    if (mpPct > 0.15 && Math.random() < 0.65) {
      const dmgIdx = findBestDamageSkill(skills, s, target, dayMods);
      if (dmgIdx >= 0) return { action: 1, skillIdx: dmgIdx, targetIdx };
    }

    // === STATUS EFFECT SKILLS (25% chance — apply DoT early) ===
    if (Math.random() < 0.25 && mpPct > 0.2 && cs.turnCounter <= 3) {
      const dotIdx = skills.findIndex(sk =>
        (sk.statusEffect === 'poison' || sk.statusEffect === 'burn') &&
        sk.type === 'damage' && s.mp >= sk.mpCost
      );
      if (dotIdx >= 0) return { action: 1, skillIdx: dotIdx, targetIdx };
    }

    // === CONSERVE MP against weak enemies — basic attack ===
    return { action: 0, targetIdx };
  }

  function findBestTarget(cs, skills, dayMods) {
    const enemies = cs.liveEnemies || [];
    if (enemies.length <= 1) return 0;

    let bestIdx = 0, bestScore = -Infinity;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      let score = 0;
      const hpPct = e.hp / Math.max(1, e.maxHp);

      // Prefer nearly-dead enemies (efficient kills reduce incoming damage)
      if (hpPct < 0.15) score += 60;
      else if (hpPct < 0.3) score += 35;
      else if (hpPct < 0.5) score += 15;

      // Prefer enemies we have elemental advantage against
      if (e.weakness) {
        const hasWeak = skills.some(sk =>
          sk.element === e.weakness && sk.type === 'damage' &&
          GS.player.stats.mp >= sk.mpCost
        );
        if (hasWeak) score += 25;
      }

      // Deprioritize enemies we resist poorly against
      if (e.resistance) {
        const resistedCount = skills.filter(sk =>
          sk.element === e.resistance && sk.type === 'damage'
        ).length;
        score -= resistedCount * 8;
      }

      // Bosses are high threat — prioritize
      if (e.isBoss) score += 20;

      // General HP weighting (finish off weaker enemies)
      score += (1 - hpPct) * 10;

      // Night dark element bonus — prefer non-dark-resistant enemies
      if (dayMods && dayMods.isNight && e.resistance !== 'dark') score += 5;

      if (score > bestScore) { bestScore = score; bestIdx = i; }
    }
    return bestIdx;
  }

  function findBestDamageSkill(skills, stats, target, dayMods) {
    const dmgSkills = skills
      .map((sk, i) => ({ sk, i }))
      .filter(({ sk }) => sk.type === 'damage' && stats.mp >= sk.mpCost && !sk.aoe);

    if (dmgSkills.length === 0) return -1;

    let bestIdx = -1, bestScore = -Infinity;
    for (const { sk, i } of dmgSkills) {
      let score = (sk.power || 1) * (sk.hits || 1);

      // Elemental matching — the most important factor
      if (target && sk.element) {
        if (sk.element === target.weakness) score *= 1.8;        // 80% bonus for weakness hit
        else if (sk.element === target.resistance) score *= 0.15; // Massive penalty for resistance
      }

      // Day/night element bonuses
      if (dayMods) {
        if (dayMods.isNight && sk.element === 'dark') score *= 1.2;
        if (dayMods.lightElementBonus > 0 && sk.element === 'light') score *= 1.15;
      }

      // MP efficiency (damage per MP spent)
      score /= Math.max(1, sk.mpCost * 0.4);

      // Lifesteal is great when not at full HP
      if (sk.special === 'lifesteal') {
        const hpPct = stats.hp / stats.maxHp;
        score *= (hpPct < 0.7) ? 1.5 : 1.1;
      }

      // Status effect bonus (DoT adds value)
      if (sk.statusEffect === 'burn' || sk.statusEffect === 'poison') score *= 1.15;
      if (sk.statusEffect === 'stun' || sk.statusEffect === 'freeze') score *= 1.1;

      if (score > bestScore) { bestScore = score; bestIdx = i; }
    }
    return bestIdx;
  }

  function findBestAoESkill(skills, stats, enemies, dayMods) {
    const aoeSkills = skills
      .map((sk, i) => ({ sk, i }))
      .filter(({ sk }) => sk.aoe && sk.type === 'damage' && stats.mp >= sk.mpCost);

    if (aoeSkills.length === 0) return -1;

    let bestIdx = -1, bestScore = -Infinity;
    for (const { sk, i } of aoeSkills) {
      let score = (sk.power || 1) * enemies.length;

      // Element matching against all enemies
      let weakHits = 0, resistHits = 0;
      for (const e of enemies) {
        if (sk.element && sk.element === e.weakness) weakHits++;
        if (sk.element && sk.element === e.resistance) resistHits++;
      }
      score += weakHits * 25;
      score -= resistHits * 20;

      // Day/night bonuses
      if (dayMods) {
        if (dayMods.isNight && sk.element === 'dark') score *= 1.2;
        if (dayMods.lightElementBonus > 0 && sk.element === 'light') score *= 1.15;
      }

      // MP efficiency
      score /= Math.max(1, sk.mpCost * 0.3);

      if (score > bestScore) { bestScore = score; bestIdx = i; }
    }
    return bestIdx;
  }

  function findStunSkill(skills, stats) {
    // Find best stun/freeze skill with reasonable chance
    let bestIdx = -1, bestChance = 0;
    for (let i = 0; i < skills.length; i++) {
      const sk = skills[i];
      if ((sk.statusEffect === 'stun' || sk.statusEffect === 'freeze') &&
          (sk.statusChance || 0) >= 0.25 && stats.mp >= sk.mpCost) {
        if ((sk.statusChance || 0) > bestChance) {
          bestChance = sk.statusChance || 0;
          bestIdx = i;
        }
      }
    }
    return bestIdx;
  }

  function findBestHealSkill(skills, stats) {
    const heals = skills
      .map((sk, i) => ({ sk, i }))
      .filter(({ sk }) => sk.type === 'heal' && stats.mp >= sk.mpCost);
    if (heals.length === 0) return -1;
    // Pick strongest heal
    return heals.reduce((a, b) => (b.sk.power || 0) > (a.sk.power || 0) ? b : a).i;
  }

  function findHealItem() {
    const items = (GS.player.items || []).filter(i => i.type === 'consumable');
    return items.findIndex(i =>
      i.effect === 'heal_hp' || i.effect === 'heal_both' || i.effect === 'heal_all'
    );
  }

  // ================================================================
  //  DIALOGUE — smart choice selection with quest/heal/recruit awareness
  // ================================================================
  function botDialogue(dt) {
    _dialogueDelay -= dt;
    if (_dialogueDelay > 0) return;

    const ds = Dialogue.getState();
    if (!ds.active) return;

    // Shop mode: currently leave shops (management handles buying via API)
    if (ds.shopMode) {
      pressKey('Escape');
      _dialogueDelay = rand(0.5, 1.0);
      return;
    }

    // Typewriter not done: skip to see full text
    if (!ds.typewriterDone) {
      pressKey('Enter');
      _dialogueSkippedTypewriter = true;
      _dialogueDelay = rand(0.6, 1.4);
      return;
    }

    // No choices: advance text
    if (ds.choiceCount === 0) {
      pressKey('Enter');
      _dialogueSkippedTypewriter = false;
      _dialogueDelay = rand(0.3, 0.7);
      return;
    }

    // === Smart choice selection ===
    const choices = ds.choices;
    let bestIdx = 0;
    let bestPriority = -1;

    for (let i = 0; i < choices.length; i++) {
      const a = choices[i].action;
      const t = (choices[i].text || '').toLowerCase();
      let priority = 0;

      // Highest priority: free heal
      if (a === 'full_heal') priority = 100;
      // Accept quests
      else if (a === 'accept_quest') priority = 90;
      // Recruit allies (if available)
      else if (a === 'recruit' || t.includes('recruit') || t.includes('join')) priority = 85;
      // Learn skills
      else if (a === 'open_skills') priority = 40;
      // Shop actions — lower priority (management handles this)
      else if (a === 'open_shop' || a === 'open_sell') priority = 10;
      else if (a === 'open_crafting' || a === 'open_enchanting') priority = 10;
      // Goodbye/leave/continue — moderate
      else if (t.includes('goodbye') || t.includes('leave') || t.includes('nevermind')) priority = 20;
      // Generic non-action choices (conversation, lore)
      else if (!a) priority = 30;
      // Anything else
      else priority = 25;

      if (priority > bestPriority) {
        bestPriority = priority;
        bestIdx = i;
      }
    }

    // Navigate to the chosen choice
    if (ds.selectedChoice < bestIdx) {
      pressKey('ArrowDown');
      _dialogueDelay = rand(0.12, 0.22);
    } else if (ds.selectedChoice > bestIdx) {
      pressKey('ArrowUp');
      _dialogueDelay = rand(0.12, 0.22);
    } else {
      pressKey('Enter');
      _dialogueSkippedTypewriter = false;
      _dialogueDelay = rand(0.4, 0.8);
    }
  }

  // ================================================================
  //  MENUS — close overlay screens
  // ================================================================
  function botCloseMenu(dt) {
    if (_actionTimer < rand(0.4, 0.7)) return;
    _actionTimer = 0;
    pressKey('Escape');
  }

  // ================================================================
  //  GAME OVER — return to title, reset for new run
  // ================================================================
  function botGameOver(dt) {
    if (_actionTimer < 1.5) return;
    _actionTimer = 0;
    pressKey('Enter');
    resetRunState();
  }

  // ================================================================
  //  VICTORY — start NG+
  // ================================================================
  function botVictory(dt) {
    if (_actionTimer < 2.0) return;
    _actionTimer = 0;
    pressKey('Enter');
  }

  // ================================================================
  //  CLASS SELECT — browse, pick, type name with natural timing
  // ================================================================
  function botClassSelect(dt) {
    _classTimer += dt;
    _classDelay -= dt;
    if (_classDelay > 0) return;

    switch (_classPhase) {
      case 'browse': {
        if (_classTimer < 0.7) return;
        if (_classBrowseCount < _classBrowseTarget) {
          pressKey('ArrowDown');
          _classBrowseCount++;
          _classDelay = rand(0.35, 0.7);
          return;
        }
        if (_classBrowseCount === _classBrowseTarget && Math.random() < 0.3) {
          pressKey('ArrowUp');
          _classBrowseCount++;
          _classDelay = rand(0.4, 0.8);
          return;
        }
        _classPhase = 'pick';
        _classDelay = rand(0.6, 1.2);
        return;
      }
      case 'pick': {
        pressKey('Enter');
        _chosenName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
        _nameIdx = 0;
        _classPhase = 'naming';
        _classDelay = rand(0.4, 0.7);
        return;
      }
      case 'naming': {
        if (_nameIdx < _chosenName.length) {
          const ch = _chosenName[_nameIdx].toUpperCase();
          if (ch === ' ') pressKey('Space');
          else pressKey('Key' + ch);
          _nameIdx++;
          const progress = _nameIdx / _chosenName.length;
          _classDelay = (progress < 0.2 || progress > 0.8) ? rand(0.12, 0.25) : rand(0.06, 0.14);
          return;
        }
        _classPhase = 'confirm_name';
        _classDelay = rand(0.3, 0.6);
        return;
      }
      case 'confirm_name': {
        pressKey('Enter');
        _classPhase = 'done';
        return;
      }
    }
  }

  // ================================================================
  //  TITLE MENU — start new game
  // ================================================================
  function botTitleMenu(dt) {
    _titleTimer += dt;
    if (_titleTimer < rand(1.0, 1.8)) return;
    if (_actionTimer < 0.5) return;
    _actionTimer = 0;

    pressKey('Enter');
    resetRunState();
  }

  function resetRunState() {
    _titleTimer = 0;
    _classTimer = 0;
    _classPhase = 'browse';
    _classBrowseCount = 0;
    _classBrowseTarget = randInt(2, 5);
    _chosenName = '';
    _nameIdx = 0;
    _wantAction = -1;
    _zoneTimer = 0;
    _zoneStayTime = rand(40, 80);
    _exitTarget = null;
    _currentZoneName = '';
    _lastZoneName = '';
    _stuckLevel = 0;
    _stuckTimer = 0;
    _posHistory = [];
    _visitedTiles = {};
    _zoneTransitions = 0;
    _mgmtTimer = 0;
  }

  // Init immediately
  init();

  return { activate, isActive, isUnlocked, update };
})();
