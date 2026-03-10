// engine/autoplay.js — Auto-play bot mode (activated by "srg2" cheat code)
// Injects virtual key presses so all animations, sounds, and effects trigger naturally.
// Designed to look like a skilled human player — variable timing, smart decisions, purposeful movement.

const AutoPlay = (() => {
  let _unlocked = false;
  let _active = false;

  // ======== TIMING ========
  let _actionTimer = 0;       // General action cooldown
  let _thinkTimer = 0;        // "Thinking" delay before acting (variable for realism)
  let _idleTimer = 0;         // Occasional idle pauses like a real player

  // ======== EXPLORATION ========
  let _moveTimer = 0;
  let _moveDir = null;         // Array of keys to hold
  let _seekTarget = null;      // Entity we're walking toward
  let _seekTimer = 0;          // How long we've been seeking current target
  let _lastInteract = 0;       // Cooldown after interacting
  let _explorePhase = 'wander'; // 'wander', 'seek_enemy', 'seek_npc', 'seek_chest', 'idle_pause'
  let _pauseDuration = 0;
  let _stuckTimer = 0;         // Detect if stuck on a wall
  let _lastPos = { x: 0, y: 0 };
  let _dirChangeCount = 0;     // Avoid spinning in place

  // ======== COMBAT ========
  // Multi-frame state machine for navigating combat menus
  let _combatPhase = 'think';  // 'think', 'nav_action', 'confirm_action', 'nav_submenu', 'confirm_submenu', 'nav_target', 'confirm_target', 'wait'
  let _combatGoal = null;      // { action: 0-4, skillIdx, targetIdx }
  let _combatDelay = 0;        // Natural delay between combat inputs
  let _combatNavStep = 0;      // Current navigation step toward target action
  let _combatCurrentAction = 0; // Track what _selectedAction should be

  // ======== FISHING ========
  let _reelTimer = 0;          // Pace reel presses to look human

  // ======== DIALOGUE ========
  let _dialogueWait = 0;       // Wait time simulating reading
  let _dialogueSkipped = false; // Whether we've skipped typewriter this node

  // ======== CLASS SELECT ========
  let _classPickTimer = 0;
  let _classPhase = 'browse';  // 'browse', 'pick', 'naming', 'confirm_name'
  let _classBrowseCount = 0;
  let _targetClassIdx = 0;
  let _chosenName = '';
  let _nameIdx = 0;

  // ======== TITLE ========
  let _titleTimer = 0;

  const BOT_NAMES = ['Zephyr', 'Astra', 'Bolt', 'Nova', 'Rex', 'Luna', 'Kai', 'Vex', 'Orion', 'Blaze',
                     'Ash', 'Storm', 'Ember', 'Frost', 'Hawk', 'Jade', 'Nyx', 'Sol', 'Wren', 'Rune'];

  // ======== UTILITY ========
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

  function dirKeysToward(target) {
    if (!target || !GS.player) return [];
    const dx = target.x - GS.player.x;
    const dy = target.y - GS.player.y;
    const keys = [];
    // Move along the axis with greater distance first for natural pathing
    if (Math.abs(dx) > 0.3) keys.push(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
    if (Math.abs(dy) > 0.3) keys.push(dy > 0 ? 'ArrowDown' : 'ArrowUp');
    return keys;
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
        if (_active) resetCombatState();
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    }, true);
  }

  function resetCombatState() {
    _combatPhase = 'think';
    _combatGoal = null;
    _combatDelay = 0;
    _combatNavStep = 0;
    _combatCurrentAction = 0;
  }

  // ======== MAIN UPDATE ========
  function update(dt) {
    if (!_active) return;
    _actionTimer += dt;

    switch (GS.state) {
      case GameStates.PLAY:         botExplore(dt); break;
      case GameStates.COMBAT:       botCombat(dt); break;
      case GameStates.DIALOGUE:     botDialogue(dt); break;
      case GameStates.INVENTORY:    botInventory(dt); break;
      case GameStates.QUEST_LOG:    botCloseMenu(dt); break;
      case GameStates.PAUSED:       botCloseMenu(dt); break;
      case GameStates.GAME_OVER:    botGameOver(dt); break;
      case GameStates.CLASS_SELECT: botClassSelect(dt); break;
      case GameStates.MENU:         botTitleMenu(dt); break;
      case GameStates.VICTORY:      botVictory(dt); break;
    }
  }

  // ================================================================
  //  EXPLORATION — purposeful movement, enemy seeking, NPC interaction
  // ================================================================
  function botExplore(dt) {
    _lastInteract += dt;
    _moveTimer -= dt;

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

    // Occasional idle pause (1-3s) to look human — every 8-15s
    if (_explorePhase === 'idle_pause') {
      _pauseDuration -= dt;
      if (_pauseDuration <= 0) {
        _explorePhase = 'wander';
      }
      return; // Stand still
    }
    if (_idleTimer <= 0 && Math.random() < 0.003) {
      _explorePhase = 'idle_pause';
      _pauseDuration = rand(0.5, 2.0);
      _idleTimer = rand(8, 15);
      return;
    }
    _idleTimer -= dt;

    // Stuck detection — if we haven't moved much in 2s, change direction
    if (GS.player) {
      const moved = Math.abs(GS.player.x - _lastPos.x) + Math.abs(GS.player.y - _lastPos.y);
      if (moved < 0.1) {
        _stuckTimer += dt;
        if (_stuckTimer > 1.5) {
          _moveDir = null;
          _moveTimer = 0;
          _seekTarget = null;
          _stuckTimer = 0;
          _explorePhase = 'wander';
        }
      } else {
        _stuckTimer = 0;
      }
      _lastPos.x = GS.player.x;
      _lastPos.y = GS.player.y;
    }

    // Scan for nearby entities
    const nearby = WorldManager.getEntitiesNear(GS.player.x, GS.player.y, 6);

    // Priority 1: Interact with very close NPCs/chests (< 2 tiles, facing them)
    if (_lastInteract > 2.0) {
      for (const ent of nearby) {
        if (ent === GS.player) continue;
        const d = distTo(ent);
        if (d < 2 && (ent.isNPC || (ent.isChest && !ent.opened))) {
          pressKey('KeyE');
          _lastInteract = 0;
          _actionTimer = 0;
          return;
        }
      }
    }

    // Priority 2: Fish if facing water and have rod (cooldown)
    if (_lastInteract > 3.0 && WorldManager.isFacingWater(GS.player)) {
      if (typeof Fishing !== 'undefined' && Fishing.canFish()) {
        pressKey('KeyE');
        _lastInteract = 0;
        return;
      }
    }

    // Priority 3: Seek enemies, NPCs, or chests
    let bestTarget = null;
    let bestPriority = 0;
    for (const ent of nearby) {
      if (ent === GS.player) continue;
      const d = distTo(ent);
      if (d > 6) continue;

      // Enemies — walk toward them for combat (combat triggers at 0.8 tiles via AI chase)
      if (ent.isEnemy && ent.stats && ent.stats.hp > 0 && !ent.defeated) {
        const priority = 3 + (6 - d) * 0.5; // Closer enemies = higher priority
        if (priority > bestPriority) { bestPriority = priority; bestTarget = ent; }
      }
      // Unopened chests
      if (ent.isChest && !ent.opened && d > 2) {
        const priority = 2;
        if (priority > bestPriority) { bestPriority = priority; bestTarget = ent; }
      }
      // NPCs we haven't talked to recently
      if (ent.isNPC && _lastInteract > 5 && d > 2) {
        const priority = 1;
        if (priority > bestPriority) { bestPriority = priority; bestTarget = ent; }
      }
    }

    // Walk toward target if we have one
    if (bestTarget) {
      _seekTarget = bestTarget;
      _seekTimer = 0;
      const keys = dirKeysToward(bestTarget);
      if (keys.length > 0) {
        for (const k of keys) holdKey(k);
        _moveTimer = 0.5; // Re-evaluate soon
        return;
      }
    }

    // Default: wander with natural direction changes
    if (_moveTimer <= 0) {
      // Pick a new direction — prefer forward momentum, sometimes turn
      const allDirs = [
        ['ArrowUp'], ['ArrowDown'], ['ArrowLeft'], ['ArrowRight'],
        ['ArrowUp', 'ArrowRight'], ['ArrowUp', 'ArrowLeft'],
        ['ArrowDown', 'ArrowRight'], ['ArrowDown', 'ArrowLeft']
      ];

      // Bias toward continuing current direction (70% chance)
      if (_moveDir && Math.random() < 0.7) {
        // Keep same direction
      } else {
        _moveDir = allDirs[Math.floor(Math.random() * allDirs.length)];
      }
      _moveTimer = rand(1.5, 4.0);
    }

    if (_moveDir) {
      for (const k of _moveDir) holdKey(k);
    }
  }

  // ================================================================
  //  FISHING — realistic reel timing
  // ================================================================
  function botFishing(fishState, dt) {
    _reelTimer -= dt;
    if (fishState.phase === 'bite') {
      // Press confirm rapidly but with slight human-like variation (every 0.05-0.15s)
      if (_reelTimer <= 0) {
        pressKey('Space');
        _reelTimer = rand(0.05, 0.15);
      }
    } else {
      _reelTimer = 0;
    }
  }

  // ================================================================
  //  COMBAT — multi-frame menu navigation with smart decisions
  // ================================================================
  function botCombat(dt) {
    _combatDelay -= dt;
    if (_combatDelay > 0) return;

    if (!GS.player || !GS.player.stats) return;
    const s = GS.player.stats;

    switch (_combatPhase) {
      case 'think': combatThink(s); break;
      case 'nav_action': combatNavAction(); break;
      case 'confirm_action': combatConfirmAction(); break;
      case 'nav_submenu': combatNavSubmenu(); break;
      case 'confirm_submenu': combatConfirmSubmenu(); break;
      case 'nav_target': combatNavTarget(); break;
      case 'confirm_target': combatConfirmTarget(); break;
      case 'wait':
        // Wait for animations/enemy turns — reset when it's our turn again
        _combatPhase = 'think';
        _combatDelay = rand(0.3, 0.7);
        _combatCurrentAction = 0;
        break;
    }
  }

  // Decide what to do this turn
  function combatThink(s) {
    const skills = GS.player.skills || [];
    const hpPct = s.hp / s.maxHp;
    const mpPct = s.mp / Math.max(1, s.maxMp);

    // Check if stunned — just press confirm
    // (handlePlayerInput will detect stun and skip our turn)
    // We can just press Enter and the system handles it
    _combatGoal = null;

    // PRIORITY 1: Heal if HP critical (< 35%)
    if (hpPct < 0.35) {
      // Try heal skill first
      const healIdx = skills.findIndex(sk => sk.type === 'heal' && s.mp >= sk.mpCost);
      if (healIdx >= 0) {
        _combatGoal = { action: 1, skillIdx: healIdx }; // Skills = index 1
        _combatPhase = 'nav_action';
        _combatDelay = rand(0.2, 0.5);
        _combatCurrentAction = 0;
        return;
      }
      // Try health potion
      const items = (GS.player.items || []).filter(i => i.type === 'consumable');
      const healItemIdx = items.findIndex(i => i.effect === 'heal_hp' || i.effect === 'heal_both' || i.effect === 'heal_all');
      if (healItemIdx >= 0) {
        _combatGoal = { action: 2, itemIdx: healItemIdx }; // Items = index 2
        _combatPhase = 'nav_action';
        _combatDelay = rand(0.2, 0.5);
        _combatCurrentAction = 0;
        return;
      }
      // Desperate: Defend to reduce incoming damage
      if (hpPct < 0.2) {
        _combatGoal = { action: 3 }; // Defend = index 3
        _combatPhase = 'nav_action';
        _combatDelay = rand(0.15, 0.3);
        _combatCurrentAction = 0;
        return;
      }
    }

    // PRIORITY 2: Use buff skill if available and not already buffed (low chance per turn)
    if (Math.random() < 0.15) {
      const buffIdx = skills.findIndex(sk => sk.type === 'buff' && s.mp >= sk.mpCost);
      if (buffIdx >= 0) {
        _combatGoal = { action: 1, skillIdx: buffIdx };
        _combatPhase = 'nav_action';
        _combatDelay = rand(0.4, 0.8);
        _combatCurrentAction = 0;
        return;
      }
    }

    // PRIORITY 3: Use damage skill (if MP > 25%)
    if (mpPct > 0.25 && skills.length > 0 && Math.random() < 0.6) {
      // Find best damage skill we can afford
      const dmgSkills = skills
        .map((sk, i) => ({ sk, i }))
        .filter(({ sk }) => sk.type === 'damage' && s.mp >= sk.mpCost);
      if (dmgSkills.length > 0) {
        // Pick strongest affordable skill (highest power * mpCost as proxy)
        const best = dmgSkills.reduce((a, b) =>
          (b.sk.power || 1) * (b.sk.hits || 1) > (a.sk.power || 1) * (a.sk.hits || 1) ? b : a
        );
        _combatGoal = { action: 1, skillIdx: best.i };
        _combatPhase = 'nav_action';
        _combatDelay = rand(0.3, 0.7);
        _combatCurrentAction = 0;
        return;
      }
    }

    // PRIORITY 4: Heal at moderate HP (< 55%) if heal available
    if (hpPct < 0.55) {
      const healIdx = skills.findIndex(sk => sk.type === 'heal' && s.mp >= sk.mpCost);
      if (healIdx >= 0 && Math.random() < 0.4) {
        _combatGoal = { action: 1, skillIdx: healIdx };
        _combatPhase = 'nav_action';
        _combatDelay = rand(0.3, 0.6);
        _combatCurrentAction = 0;
        return;
      }
    }

    // DEFAULT: Basic Attack (index 0)
    _combatGoal = { action: 0 };
    _combatPhase = 'nav_action';
    _combatDelay = rand(0.2, 0.6);
    _combatCurrentAction = 0;
  }

  // Navigate to the desired action index (Attack=0, Skills=1, Items=2, Defend=3, Flee=4)
  function combatNavAction() {
    if (!_combatGoal) { _combatPhase = 'think'; return; }
    const target = _combatGoal.action;

    if (_combatCurrentAction < target) {
      pressKey('ArrowDown');
      _combatCurrentAction++;
      _combatDelay = rand(0.08, 0.18); // Quick menu navigation
    } else if (_combatCurrentAction > target) {
      pressKey('ArrowUp');
      _combatCurrentAction--;
      _combatDelay = rand(0.08, 0.18);
    } else {
      // We're on the right action
      _combatPhase = 'confirm_action';
      _combatDelay = rand(0.1, 0.25);
    }
  }

  // Press Enter to confirm the selected action
  function combatConfirmAction() {
    pressKey('Enter');
    if (!_combatGoal) { _combatPhase = 'wait'; return; }

    if (_combatGoal.action === 0) {
      // Attack — might need target selection (handled by game), then wait
      _combatPhase = 'nav_target';
      _combatDelay = rand(0.15, 0.35);
      _combatGoal.targetIdx = pickBestTarget();
      _combatGoal._targetStep = 0;
    } else if (_combatGoal.action === 1) {
      // Skills submenu opened
      _combatPhase = 'nav_submenu';
      _combatDelay = rand(0.15, 0.3);
      _combatGoal._subStep = 0;
    } else if (_combatGoal.action === 2) {
      // Items submenu opened
      _combatPhase = 'nav_submenu';
      _combatDelay = rand(0.15, 0.3);
      _combatGoal._subStep = 0;
    } else {
      // Defend or Flee — action executes immediately
      _combatPhase = 'wait';
      _combatDelay = rand(0.4, 0.8);
    }
  }

  // Navigate within skill or item submenu
  function combatNavSubmenu() {
    if (!_combatGoal) { _combatPhase = 'think'; return; }
    const targetIdx = _combatGoal.action === 1 ? (_combatGoal.skillIdx || 0) : (_combatGoal.itemIdx || 0);

    if ((_combatGoal._subStep || 0) < targetIdx) {
      pressKey('ArrowDown');
      _combatGoal._subStep = (_combatGoal._subStep || 0) + 1;
      _combatDelay = rand(0.08, 0.18);
    } else {
      _combatPhase = 'confirm_submenu';
      _combatDelay = rand(0.1, 0.2);
    }
  }

  // Confirm skill/item selection
  function combatConfirmSubmenu() {
    pressKey('Enter');
    // Skill might need target selection, or it executes immediately
    // Items always execute immediately. We'll go to wait and let the
    // game handle the rest. If target is needed, the game enters target mode
    // and we'll detect it next frame.
    _combatPhase = 'nav_target';
    _combatDelay = rand(0.15, 0.3);
    _combatGoal.targetIdx = pickBestTarget();
    _combatGoal._targetStep = 0;
  }

  // Navigate to target enemy (if multi-enemy requires selection)
  function combatNavTarget() {
    if (!_combatGoal) { _combatPhase = 'wait'; return; }
    const targetIdx = _combatGoal.targetIdx || 0;
    const step = _combatGoal._targetStep || 0;

    if (step < targetIdx) {
      pressKey('ArrowRight');
      _combatGoal._targetStep = step + 1;
      _combatDelay = rand(0.1, 0.2);
    } else {
      _combatPhase = 'confirm_target';
      _combatDelay = rand(0.1, 0.25);
    }
  }

  // Confirm target — this may or may not be needed (single enemy = no target submenu)
  // If game already executed the action, this Enter is harmless
  function combatConfirmTarget() {
    pressKey('Enter');
    _combatPhase = 'wait';
    _combatDelay = rand(0.5, 1.0);
  }

  // Pick the best target: weakest enemy (lowest HP) for efficient kills
  function pickBestTarget() {
    if (typeof Combat === 'undefined') return 0;
    // We can't directly access Combat._enemies, but we know the game
    // initializes _selectedTarget to 0. The target with lowest HP
    // would be ideal, but since we inject keys, we'll just target 0
    // (first enemy) which is the default anyway.
    // For multi-enemy, occasionally pick a different target
    return 0;
  }

  // ================================================================
  //  DIALOGUE — simulate reading speed, navigate choices
  // ================================================================
  function botDialogue(dt) {
    _dialogueWait -= dt;
    if (_dialogueWait > 0) return;

    if (!_dialogueSkipped) {
      // First press: skip typewriter effect (like an impatient-ish player)
      pressKey('Enter');
      _dialogueSkipped = true;
      _dialogueWait = rand(0.6, 1.5); // "Read" the text
      return;
    }

    // Text is fully displayed — advance or pick choice
    pressKey('Enter');
    _dialogueSkipped = false;
    _dialogueWait = rand(0.3, 0.8);
  }

  // ================================================================
  //  INVENTORY — sometimes equip gear, then close
  // ================================================================
  function botInventory(dt) {
    // Just close — the bot plays with whatever it has
    if (_actionTimer < rand(0.4, 0.8)) return;
    _actionTimer = 0;
    pressKey('Escape');
  }

  // ================================================================
  //  MENUS (QuestLog, Pause) — close quickly
  // ================================================================
  function botCloseMenu(dt) {
    if (_actionTimer < rand(0.3, 0.6)) return;
    _actionTimer = 0;
    pressKey('Escape');
  }

  // ================================================================
  //  GAME OVER — return to title after a pause
  // ================================================================
  function botGameOver(dt) {
    if (_actionTimer < 1.5) return;
    _actionTimer = 0;
    pressKey('Enter');
    // Reset class select state for new run
    _classPhase = 'browse';
    _classBrowseCount = 0;
    _chosenName = '';
    _nameIdx = 0;
    _classPickTimer = 0;
    _titleTimer = 0;
  }

  // ================================================================
  //  VICTORY — start NG+ or return to title
  // ================================================================
  function botVictory(dt) {
    if (_actionTimer < 2.0) return;
    _actionTimer = 0;
    // Press Enter — picks NG+ by default (first option)
    pressKey('Enter');
  }

  // ================================================================
  //  CLASS SELECT — browse classes, pick one, type name naturally
  // ================================================================
  function botClassSelect(dt) {
    _classPickTimer += dt;

    switch (_classPhase) {
      case 'browse': {
        // Browse through classes for 2-4 seconds, pressing down periodically
        if (_classPickTimer < 0.6) return; // Initial pause
        if (_classBrowseCount < randInt(2, 5)) {
          if (_classPickTimer - _classBrowseCount * 0.6 > 0.5 + Math.random() * 0.4) {
            pressKey('ArrowDown');
            _classBrowseCount++;
          }
          return;
        }
        // Sometimes go back up (like reconsidering)
        if (_classBrowseCount === randInt(2, 5) && Math.random() < 0.3) {
          pressKey('ArrowUp');
          _classBrowseCount++;
          return;
        }
        _classPhase = 'pick';
        _combatDelay = rand(0.5, 1.0);
        return;
      }
      case 'pick': {
        _combatDelay -= dt;
        if (_combatDelay > 0) return;
        // Confirm class selection → enters naming mode
        pressKey('Enter');
        _chosenName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
        _nameIdx = 0;
        _classPhase = 'naming';
        _combatDelay = rand(0.3, 0.6);
        return;
      }
      case 'naming': {
        _combatDelay -= dt;
        if (_combatDelay > 0) return;
        if (_nameIdx < _chosenName.length) {
          const ch = _chosenName[_nameIdx].toUpperCase();
          if (ch === ' ') {
            pressKey('Space');
          } else {
            pressKey('Key' + ch);
          }
          _nameIdx++;
          // Variable typing speed — faster in the middle, slower at start/end
          const progress = _nameIdx / _chosenName.length;
          if (progress < 0.2 || progress > 0.8) {
            _combatDelay = rand(0.12, 0.25); // Slower at boundaries
          } else {
            _combatDelay = rand(0.06, 0.14); // Faster in middle
          }
          return;
        }
        _classPhase = 'confirm_name';
        _combatDelay = rand(0.3, 0.6);
        return;
      }
      case 'confirm_name': {
        _combatDelay -= dt;
        if (_combatDelay > 0) return;
        pressKey('Enter');
        _classPhase = 'done';
        return;
      }
    }
  }

  // ================================================================
  //  TITLE MENU — start new game after a natural pause
  // ================================================================
  function botTitleMenu(dt) {
    _titleTimer += dt;
    if (_titleTimer < rand(1.0, 1.8)) return;

    if (_actionTimer < 0.5) return;
    _actionTimer = 0;

    // "New Game" is already selected (index 0) — just confirm
    pressKey('Enter');
    _titleTimer = 0;
    _classPickTimer = 0;
    _classPhase = 'browse';
    _classBrowseCount = 0;
    _chosenName = '';
    _nameIdx = 0;
    resetCombatState();
  }

  // Init immediately
  init();

  return { activate, isActive, isUnlocked, update };
})();
