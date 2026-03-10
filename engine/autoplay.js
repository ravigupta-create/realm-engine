// engine/autoplay.js — Auto-play bot mode (activated by "srg2" cheat code)
// Injects virtual key presses so all animations, sounds, and effects trigger naturally.
// Reads Combat.getState() and Dialogue.getState() for reliable menu navigation.
// Uses WorldManager.canMoveTo() for obstacle-aware pathfinding.

const AutoPlay = (() => {
  // ======== FLAGS ========
  let _unlocked = false;
  let _active = false;

  // ======== TIMING ========
  let _combatDelay = 0;
  let _dialogueDelay = 0;
  let _actionTimer = 0;

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

  // Position history for stuck detection + avoidance
  const POS_HISTORY_LEN = 20;
  let _posHistory = [];        // ring buffer of { x, y, t }
  let _posHistoryIdx = 0;
  let _stuckLevel = 0;         // 0=free, 1=slightly stuck, 2=very stuck, 3=trapped
  let _stuckTimer = 0;
  let _wallFollowDir = 0;      // -1=follow left, 1=follow right, 0=off
  let _wallFollowTimer = 0;
  let _lastMoveAngle = 0;      // Direction we're trying to go (radians)
  let _backtrackTimer = 0;     // Force reverse when badly stuck

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

  // ======== UTILITIES ========
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

  // Check if a position is walkable
  function canWalk(x, y) {
    return WorldManager.canMoveTo(x, y);
  }

  // Record current position in history
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

  // Detect how stuck we are by analyzing position history
  function updateStuckDetection(dt) {
    if (_posHistory.length < 5) { _stuckLevel = 0; return; }
    const now = GS.time;
    // Check displacement over last 1.5 seconds
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

    // Expected speed is ~3 tiles/s. If moving at < 10% of that, we're stuck
    if (speed < 0.3) {
      _stuckTimer += dt;
      if (_stuckTimer > 2.5) _stuckLevel = 3;       // Trapped
      else if (_stuckTimer > 1.5) _stuckLevel = 2;   // Very stuck
      else if (_stuckTimer > 0.6) _stuckLevel = 1;   // Slightly stuck
    } else {
      _stuckTimer = Math.max(0, _stuckTimer - dt * 2); // Decay when moving
      if (_stuckTimer < 0.3) _stuckLevel = 0;
    }
  }

  // ======== SMART MOVEMENT ========
  // Walk toward a target with obstacle avoidance
  function smartWalkToward(tx, ty) {
    if (!GS.player) return;
    const px = GS.player.x, py = GS.player.y;
    const dx = tx - px, dy = ty - py;
    const angle = Math.atan2(dy, dx);
    _lastMoveAngle = angle;
    const step = 0.8; // Look-ahead distance

    // Strategy 1: Try direct path
    const directX = px + Math.cos(angle) * step;
    const directY = py + Math.sin(angle) * step;
    if (canWalk(directX, directY)) {
      applyMoveAngle(angle);
      _wallFollowDir = 0;
      return;
    }

    // Strategy 2: Try sliding along one axis
    // Try horizontal slide
    const hx = px + Math.cos(angle) * step;
    if (Math.abs(Math.cos(angle)) > 0.1 && canWalk(hx, py)) {
      holdKey(Math.cos(angle) > 0 ? 'ArrowRight' : 'ArrowLeft');
      return;
    }
    // Try vertical slide
    const vy = py + Math.sin(angle) * step;
    if (Math.abs(Math.sin(angle)) > 0.1 && canWalk(px, vy)) {
      holdKey(Math.sin(angle) > 0 ? 'ArrowDown' : 'ArrowUp');
      return;
    }

    // Strategy 3: Try angled deflections (±30°, ±60°, ±90°)
    const deflections = [0.5, -0.5, 1.0, -1.0, 1.5, -1.5];
    for (const d of deflections) {
      const a = angle + d;
      const nx = px + Math.cos(a) * step;
      const ny = py + Math.sin(a) * step;
      if (canWalk(nx, ny)) {
        applyMoveAngle(a);
        return;
      }
    }

    // Strategy 4: Wall follow mode — hug the wall and trace around it
    if (_wallFollowDir === 0) _wallFollowDir = Math.random() < 0.5 ? -1 : 1;
    const wallAngle = angle + (Math.PI / 2) * _wallFollowDir;
    const wx = px + Math.cos(wallAngle) * step;
    const wy = py + Math.sin(wallAngle) * step;
    if (canWalk(wx, wy)) {
      applyMoveAngle(wallAngle);
    } else {
      // Flip wall follow direction
      _wallFollowDir *= -1;
      const wallAngle2 = angle + (Math.PI / 2) * _wallFollowDir;
      applyMoveAngle(wallAngle2);
    }
  }

  // Convert an angle to arrow key presses
  function applyMoveAngle(angle) {
    const ax = Math.cos(angle), ay = Math.sin(angle);
    if (ax > 0.3) holdKey('ArrowRight');
    else if (ax < -0.3) holdKey('ArrowLeft');
    if (ay > 0.3) holdKey('ArrowDown');
    else if (ay < -0.3) holdKey('ArrowUp');
  }

  // Pick a smart wander direction, preferring unvisited tiles
  function pickSmartWanderDir() {
    if (!GS.player) return;
    const px = GS.player.x, py = GS.player.y;
    const zone = WorldManager.getZone();
    if (!zone) { applyMoveAngle(Math.random() * Math.PI * 2); return; }

    // Score 8 directions by: unvisited tiles ahead + passability
    const directions = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const lookDist = 3;
      const tx = px + Math.cos(a) * lookDist;
      const ty = py + Math.sin(a) * lookDist;

      // Check passability at 1, 2, 3 tiles ahead
      let passable = 0;
      let unvisited = 0;
      for (let d = 1; d <= 3; d++) {
        const cx = px + Math.cos(a) * d;
        const cy = py + Math.sin(a) * d;
        if (canWalk(cx, cy)) {
          passable++;
          const key = Math.floor(cx) + ',' + Math.floor(cy);
          if (!_visitedTiles[key]) unvisited++;
          else {
            // Prefer tiles visited long ago over recently visited ones
            const age = GS.time - (_visitedTiles[key] || 0);
            if (age > 30) unvisited += 0.5;
          }
        }
      }
      // Bounds check
      if (tx < 1 || tx >= zone.width - 1 || ty < 1 || ty >= zone.height - 1) passable -= 2;

      directions.push({ angle: a, score: passable * 2 + unvisited * 3 });
    }

    // Pick best direction, with some randomness
    directions.sort((a, b) => b.score - a.score);
    // Weighted random from top 3
    const topN = directions.slice(0, 3);
    const totalScore = topN.reduce((s, d) => s + Math.max(1, d.score), 0);
    let r = Math.random() * totalScore;
    for (const d of topN) {
      r -= Math.max(1, d.score);
      if (r <= 0) {
        _lastMoveAngle = d.angle;
        return d.angle;
      }
    }
    _lastMoveAngle = topN[0].angle;
    return topN[0].angle;
  }

  // ======== INIT ========
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

  // ======== MAIN UPDATE ========
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
  //  EXPLORATION — obstacle-aware movement, systematic exploration
  // ================================================================
  function botExplore(dt) {
    _lastInteract += dt;
    _moveTimer -= dt;
    _zoneTimer += dt;

    recordPosition();
    updateStuckDetection(dt);

    // Detect zone changes
    if (GS.currentZone !== _currentZoneName) {
      _lastZoneName = _currentZoneName;
      _currentZoneName = GS.currentZone;
      _zoneTimer = 0;
      _zoneStayTime = rand(40, 80);
      _exitTarget = null;
      _stuckLevel = 0;
      _stuckTimer = 0;
      _wallFollowDir = 0;
    }

    // Fishing takes priority
    const fishState = typeof Fishing !== 'undefined' ? Fishing.getState() : { active: false };
    if (fishState.active) {
      botFishing(fishState, dt);
      return;
    }

    // Auto-heal outside combat if HP < 60%
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

    // Occasional idle pause (like a real player thinking)
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
        // Level 3: completely reverse direction + random offset
        const reverseAngle = _lastMoveAngle + Math.PI + rand(-0.8, 0.8);
        applyMoveAngle(reverseAngle);
        _backtrackTimer = rand(0.8, 1.5);
        _moveDir = null;
        _exitTarget = null;
        _wallFollowDir = 0;
        if (_stuckLevel === 3) {
          _stuckTimer = 0;
          _stuckLevel = 1;
        }
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
    for (const ent of nearby) {
      if (ent === GS.player) continue;
      const d = distTo(ent);

      if (ent.isEnemy && ent.stats && ent.stats.hp > 0 && !ent.defeated) {
        const score = 5 + (6 - d);
        if (score > bestScore) { bestScore = score; bestTarget = ent; }
      }
      if (ent.isChest && !ent.opened) {
        const score = 3 + (4 - Math.min(d, 4));
        if (score > bestScore) { bestScore = score; bestTarget = ent; }
      }
      if (ent.isNPC && _lastInteract > 6 && d > 1.5) {
        const score = 1.5;
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
      if (!_exitTarget) _exitTarget = pickExit();
      if (_exitTarget) {
        smartWalkToward(_exitTarget.x + 0.5, _exitTarget.y + 0.5);
        _moveTimer = 0.15;
        return;
      }
    }

    // Default: smart wander — prefer unvisited tiles, avoid walls
    if (_moveTimer <= 0) {
      const angle = pickSmartWanderDir();
      if (angle !== undefined) {
        _moveDir = angle;
      }
      _moveTimer = rand(1.5, 3.5);
    }

    if (_moveDir !== null) {
      // Check if current wander direction is blocked, and adjust
      const step = 0.8;
      const nx = GS.player.x + Math.cos(_moveDir) * step;
      const ny = GS.player.y + Math.sin(_moveDir) * step;
      if (canWalk(nx, ny)) {
        applyMoveAngle(_moveDir);
      } else {
        // Immediate redirect: pick a new passable direction
        const newAngle = pickSmartWanderDir();
        if (newAngle !== undefined) {
          _moveDir = newAngle;
          applyMoveAngle(_moveDir);
        }
        _moveTimer = rand(0.5, 1.5);
      }
    }
  }

  function pickExit() {
    const zone = WorldManager.getZone();
    if (!zone || !zone.exits || zone.exits.length === 0) return null;
    const usable = zone.exits.filter(e =>
      !e.requireBoss || (GS.defeatedBosses && GS.defeatedBosses.includes(e.requireBoss))
    );
    if (usable.length === 0) return null;
    const forward = usable.filter(e => e.target !== _lastZoneName);
    const pool = forward.length > 0 ? forward : usable;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ================================================================
  //  FISHING — human-like reel timing
  // ================================================================
  function botFishing(fishState, dt) {
    _reelTimer -= dt;
    if (fishState.phase === 'bite') {
      if (_reelTimer <= 0) {
        pressKey('Enter');
        _reelTimer = rand(0.04, 0.13);
      }
    } else {
      _reelTimer = 0;
    }
  }

  // ================================================================
  //  COMBAT — reads Combat.getState() for reliable menu navigation
  // ================================================================
  function botCombat(dt) {
    _combatDelay -= dt;
    if (_combatDelay > 0) return;

    if (!GS.player || !GS.player.stats) return;
    const cs = Combat.getState();

    if (!cs.isPlayerTurn) {
      _wantAction = -1;
      _combatDelay = 0.1;
      return;
    }

    if (cs.playerStunned) {
      pressKey('Enter');
      _combatDelay = rand(0.4, 0.7);
      _wantAction = -1;
      return;
    }

    // === Handle submenus ===

    if (cs.subMenu === 'target_enemy') {
      if (cs.selectedTarget < _wantTargetIdx) {
        pressKey('ArrowRight');
        _combatDelay = rand(0.1, 0.2);
      } else if (cs.selectedTarget > _wantTargetIdx) {
        pressKey('ArrowLeft');
        _combatDelay = rand(0.1, 0.2);
      } else {
        pressKey('Enter');
        _combatDelay = rand(0.5, 0.9);
        _wantAction = -1;
      }
      return;
    }

    if (cs.subMenu === 'skills') {
      if (cs.selectedSkill < _wantSkillIdx) {
        pressKey('ArrowDown');
        _combatDelay = rand(0.1, 0.2);
      } else if (cs.selectedSkill > _wantSkillIdx) {
        pressKey('ArrowUp');
        _combatDelay = rand(0.1, 0.2);
      } else {
        pressKey('Enter');
        _combatDelay = rand(0.25, 0.45);
      }
      return;
    }

    if (cs.subMenu === 'items') {
      if (cs.selectedItem < _wantItemIdx) {
        pressKey('ArrowDown');
        _combatDelay = rand(0.1, 0.2);
      } else if (cs.selectedItem > _wantItemIdx) {
        pressKey('ArrowUp');
        _combatDelay = rand(0.1, 0.2);
      } else {
        pressKey('Enter');
        _combatDelay = rand(0.3, 0.5);
        _wantAction = -1;
      }
      return;
    }

    // === Main action menu ===

    if (_wantAction < 0) {
      const decision = decideCombatAction(cs);
      _wantAction = decision.action;
      _wantSkillIdx = decision.skillIdx || 0;
      _wantItemIdx = decision.itemIdx || 0;
      _wantTargetIdx = decision.targetIdx;
      _combatDelay = _wantAction === 0 ? rand(0.3, 0.7) : rand(0.5, 1.2);
      if (Math.random() < 0.1) _combatDelay += rand(0.3, 0.8);
      return;
    }

    if (cs.selectedAction < _wantAction) {
      pressKey('ArrowDown');
      _combatDelay = rand(0.08, 0.18);
    } else if (cs.selectedAction > _wantAction) {
      pressKey('ArrowUp');
      _combatDelay = rand(0.08, 0.18);
    } else {
      pressKey('Enter');
      if (_wantAction >= 3) {
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
    const targetIdx = findWeakestEnemy(cs);

    // CRITICAL HEAL (HP < 30%)
    if (hpPct < 0.3) {
      const healIdx = skills.findIndex(sk => sk.type === 'heal' && s.mp >= sk.mpCost);
      if (healIdx >= 0) return { action: 1, skillIdx: healIdx, targetIdx };
      const items = (GS.player.items || []).filter(i => i.type === 'consumable');
      const hpItem = items.findIndex(i => i.effect === 'heal_hp' || i.effect === 'heal_both' || i.effect === 'heal_all');
      if (hpItem >= 0) return { action: 2, itemIdx: hpItem, targetIdx };
      return { action: 3, targetIdx }; // Defend
    }

    // MODERATE HEAL (HP < 55%, 40% chance)
    if (hpPct < 0.55 && Math.random() < 0.4) {
      const healIdx = skills.findIndex(sk => sk.type === 'heal' && s.mp >= sk.mpCost);
      if (healIdx >= 0) return { action: 1, skillIdx: healIdx, targetIdx };
    }

    // BUFF (12% chance)
    if (Math.random() < 0.12) {
      const buffIdx = skills.findIndex(sk => sk.type === 'buff' && s.mp >= sk.mpCost);
      if (buffIdx >= 0) return { action: 1, skillIdx: buffIdx, targetIdx };
    }

    // FOCUS FIRE: if an enemy is nearly dead (< 20% HP), always attack it
    if (cs.liveEnemies && cs.liveEnemies.length > 1) {
      for (let i = 0; i < cs.liveEnemies.length; i++) {
        const e = cs.liveEnemies[i];
        if (e.hp > 0 && e.hp < e.maxHp * 0.2) {
          return { action: 0, targetIdx: i };
        }
      }
    }

    // DAMAGE SKILL (MP > 20%, 55% chance)
    if (mpPct > 0.2 && Math.random() < 0.55) {
      const dmgSkills = skills.map((sk, i) => ({ sk, i }))
        .filter(({ sk }) => sk.type === 'damage' && s.mp >= sk.mpCost);
      if (dmgSkills.length > 0) {
        if (cs.liveEnemyCount > 1) {
          const aoe = dmgSkills.find(({ sk }) => sk.aoe || sk.targetType === 'all_enemies');
          if (aoe) return { action: 1, skillIdx: aoe.i, targetIdx };
        }
        const best = dmgSkills.reduce((a, b) =>
          (b.sk.power || 1) * (b.sk.hits || 1) > (a.sk.power || 1) * (a.sk.hits || 1) ? b : a
        );
        return { action: 1, skillIdx: best.i, targetIdx };
      }
    }

    return { action: 0, targetIdx };
  }

  function findWeakestEnemy(cs) {
    if (!cs.liveEnemies || cs.liveEnemies.length <= 1) return 0;
    let weakest = 0;
    let lowestHp = cs.liveEnemies[0].hp;
    for (let i = 1; i < cs.liveEnemies.length; i++) {
      if (cs.liveEnemies[i].hp < lowestHp) {
        lowestHp = cs.liveEnemies[i].hp;
        weakest = i;
      }
    }
    return weakest;
  }

  // ================================================================
  //  DIALOGUE — reads Dialogue.getState() for smart choice navigation
  // ================================================================
  function botDialogue(dt) {
    _dialogueDelay -= dt;
    if (_dialogueDelay > 0) return;

    const ds = Dialogue.getState();
    if (!ds.active) return;

    if (ds.shopMode) {
      pressKey('Escape');
      _dialogueDelay = rand(0.5, 1.0);
      return;
    }

    if (!ds.typewriterDone) {
      pressKey('Enter');
      _dialogueSkippedTypewriter = true;
      _dialogueDelay = rand(0.6, 1.4);
      return;
    }

    if (ds.choiceCount === 0) {
      pressKey('Enter');
      _dialogueSkippedTypewriter = false;
      _dialogueDelay = rand(0.3, 0.7);
      return;
    }

    const choices = ds.choices;
    let bestIdx = 0;
    const shopActions = ['open_shop', 'open_sell', 'open_crafting', 'open_enchanting', 'open_skills'];
    let foundGood = false;

    for (let i = 0; i < choices.length; i++) {
      const a = choices[i].action;
      if (a === 'full_heal') { bestIdx = i; foundGood = true; break; }
      if (a === 'accept_quest') { bestIdx = i; foundGood = true; break; }
    }

    if (!foundGood) {
      for (let i = 0; i < choices.length; i++) {
        if (!choices[i].action || !shopActions.includes(choices[i].action)) {
          bestIdx = i;
          foundGood = true;
          break;
        }
      }
      if (!foundGood) bestIdx = choices.length - 1;
    }

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
    _classPhase = 'browse';
    _classBrowseCount = 0;
    _classBrowseTarget = randInt(2, 5);
    _chosenName = '';
    _nameIdx = 0;
    _classTimer = 0;
    _titleTimer = 0;
  }

  // ================================================================
  //  VICTORY — start NG+ (first option)
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
  }

  // Init immediately
  init();

  return { activate, isActive, isUnlocked, update };
})();
