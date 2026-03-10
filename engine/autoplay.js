// engine/autoplay.js — Auto-play bot mode (activated by "srg2" cheat code)
// Injects virtual key presses so all animations, sounds, and effects trigger naturally.
// Reads Combat.getState() and Dialogue.getState() for reliable menu navigation.

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
  let _stuckTimer = 0;
  let _lastPos = { x: 0, y: 0 };
  let _zoneTimer = 0;
  let _zoneStayTime = 0;
  let _exitTarget = null;
  let _currentZoneName = '';
  let _lastZoneName = '';

  // ======== COMBAT ========
  let _wantAction = -1;     // -1 = need to decide
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

  function walkToward(tx, ty) {
    if (!GS.player) return;
    const dx = tx - GS.player.x;
    const dy = ty - GS.player.y;
    if (Math.abs(dx) > 0.4) holdKey(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
    if (Math.abs(dy) > 0.4) holdKey(dy > 0 ? 'ArrowDown' : 'ArrowUp');
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
        if (_active) { _wantAction = -1; }
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
  //  EXPLORATION — purposeful movement, enemy seeking, zone navigation
  // ================================================================
  function botExplore(dt) {
    _lastInteract += dt;
    _moveTimer -= dt;
    _zoneTimer += dt;

    // Detect zone changes
    if (GS.currentZone !== _currentZoneName) {
      _lastZoneName = _currentZoneName;
      _currentZoneName = GS.currentZone;
      _zoneTimer = 0;
      _zoneStayTime = rand(40, 80);
      _exitTarget = null;
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

    // Stuck detection — change direction when blocked
    if (GS.player) {
      const moved = Math.abs(GS.player.x - _lastPos.x) + Math.abs(GS.player.y - _lastPos.y);
      if (moved < 0.05) {
        _stuckTimer += dt;
        if (_stuckTimer > 1.2) {
          _moveDir = null;
          _moveTimer = 0;
          _exitTarget = null;
          _stuckTimer = 0;
        }
      } else {
        _stuckTimer = 0;
      }
      _lastPos.x = GS.player.x;
      _lastPos.y = GS.player.y;
    }

    // Occasional idle pause (like a real player thinking)
    if (_idleTimer <= 0 && Math.random() < 0.002) {
      _idleTimer = rand(0.6, 2.0);
    }
    if (_idleTimer > 0) {
      _idleTimer -= dt;
      return; // Stand still
    }

    const nearby = WorldManager.getEntitiesNear(GS.player.x, GS.player.y, 6);

    // Priority 1: Interact with very close NPCs/chests we're facing
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

    // Priority 3: Walk toward interesting entities
    let bestTarget = null;
    let bestScore = 0;
    for (const ent of nearby) {
      if (ent === GS.player) continue;
      const d = distTo(ent);

      if (ent.isEnemy && ent.stats && ent.stats.hp > 0 && !ent.defeated) {
        const score = 5 + (6 - d); // Enemies are highest priority
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
      walkToward(bestTarget.x, bestTarget.y);
      _moveTimer = 0.3;
      return;
    }

    // Priority 4: Navigate toward zone exit to explore new zones
    if (_zoneTimer > _zoneStayTime) {
      if (!_exitTarget) _exitTarget = pickExit();
      if (_exitTarget) {
        walkToward(_exitTarget.x + 0.5, _exitTarget.y + 0.5);
        _moveTimer = 0.3;
        return;
      }
    }

    // Default: wander naturally
    if (_moveTimer <= 0) {
      const allDirs = [
        ['ArrowUp'], ['ArrowDown'], ['ArrowLeft'], ['ArrowRight'],
        ['ArrowUp', 'ArrowRight'], ['ArrowUp', 'ArrowLeft'],
        ['ArrowDown', 'ArrowRight'], ['ArrowDown', 'ArrowLeft']
      ];
      // Bias toward keeping current direction (momentum)
      if (_moveDir && Math.random() < 0.65) {
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

  function pickExit() {
    const zone = WorldManager.getZone();
    if (!zone || !zone.exits || zone.exits.length === 0) return null;
    const usable = zone.exits.filter(e =>
      !e.requireBoss || (GS.defeatedBosses && GS.defeatedBosses.includes(e.requireBoss))
    );
    if (usable.length === 0) return null;
    // Prefer exits NOT leading back where we came from
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
        _reelTimer = rand(0.04, 0.13); // Quick but variable
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

    // Not our turn — wait
    if (!cs.isPlayerTurn) {
      _wantAction = -1;
      _combatDelay = 0.1;
      return;
    }

    // Stunned/frozen — press confirm to skip turn
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

    // Decide what to do (once per turn)
    if (_wantAction < 0) {
      const decision = decideCombatAction(cs);
      _wantAction = decision.action;
      _wantSkillIdx = decision.skillIdx || 0;
      _wantItemIdx = decision.itemIdx || 0;
      _wantTargetIdx = decision.targetIdx;
      // "Thinking" delay — longer for complex decisions, shorter for simple attack
      _combatDelay = _wantAction === 0 ? rand(0.3, 0.7) : rand(0.5, 1.2);
      // Occasional extra hesitation
      if (Math.random() < 0.1) _combatDelay += rand(0.3, 0.8);
      return;
    }

    // Navigate to desired action
    if (cs.selectedAction < _wantAction) {
      pressKey('ArrowDown');
      _combatDelay = rand(0.08, 0.18);
    } else if (cs.selectedAction > _wantAction) {
      pressKey('ArrowUp');
      _combatDelay = rand(0.08, 0.18);
    } else {
      // Confirm the action
      pressKey('Enter');
      if (_wantAction >= 3) {
        // Defend/Flee — executes immediately
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
      // Try heal item
      const items = (GS.player.items || []).filter(i => i.type === 'consumable');
      const hpItem = items.findIndex(i => i.effect === 'heal_hp' || i.effect === 'heal_both' || i.effect === 'heal_all');
      if (hpItem >= 0) return { action: 2, itemIdx: hpItem, targetIdx };
      // Defend as last resort
      return { action: 3, targetIdx };
    }

    // MODERATE HEAL (HP < 55%, 40% chance)
    if (hpPct < 0.55 && Math.random() < 0.4) {
      const healIdx = skills.findIndex(sk => sk.type === 'heal' && s.mp >= sk.mpCost);
      if (healIdx >= 0) return { action: 1, skillIdx: healIdx, targetIdx };
    }

    // BUFF (12% chance, adds variety)
    if (Math.random() < 0.12) {
      const buffIdx = skills.findIndex(sk => sk.type === 'buff' && s.mp >= sk.mpCost);
      if (buffIdx >= 0) return { action: 1, skillIdx: buffIdx, targetIdx };
    }

    // DAMAGE SKILL (MP > 20%, 55% chance)
    if (mpPct > 0.2 && Math.random() < 0.55) {
      const dmgSkills = skills.map((sk, i) => ({ sk, i }))
        .filter(({ sk }) => sk.type === 'damage' && s.mp >= sk.mpCost);
      if (dmgSkills.length > 0) {
        // Prefer AoE when multiple enemies
        if (cs.liveEnemyCount > 1) {
          const aoe = dmgSkills.find(({ sk }) => sk.aoe || sk.targetType === 'all_enemies');
          if (aoe) return { action: 1, skillIdx: aoe.i, targetIdx };
        }
        // Otherwise pick strongest (highest power * hits)
        const best = dmgSkills.reduce((a, b) =>
          (b.sk.power || 1) * (b.sk.hits || 1) > (a.sk.power || 1) * (a.sk.hits || 1) ? b : a
        );
        return { action: 1, skillIdx: best.i, targetIdx };
      }
    }

    // DEFAULT: Basic Attack
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

    // In shop mode — exit immediately
    if (ds.shopMode) {
      pressKey('Escape');
      _dialogueDelay = rand(0.5, 1.0);
      return;
    }

    // Typewriter still going — skip it
    if (!ds.typewriterDone) {
      pressKey('Enter');
      _dialogueSkippedTypewriter = true;
      _dialogueDelay = rand(0.6, 1.4); // Simulate "reading" the full text
      return;
    }

    // No choices — advance dialogue
    if (ds.choiceCount === 0) {
      pressKey('Enter');
      _dialogueSkippedTypewriter = false;
      _dialogueDelay = rand(0.3, 0.7);
      return;
    }

    // Smart choice selection
    const choices = ds.choices;
    let bestIdx = 0;

    // Priority: full_heal > accept_quest > normal dialogue > avoid shops
    const shopActions = ['open_shop', 'open_sell', 'open_crafting', 'open_enchanting', 'open_skills'];
    let foundGood = false;

    for (let i = 0; i < choices.length; i++) {
      const a = choices[i].action;
      if (a === 'full_heal') { bestIdx = i; foundGood = true; break; }
      if (a === 'accept_quest') { bestIdx = i; foundGood = true; break; }
    }

    if (!foundGood) {
      // Find a non-shop choice (prefer ones with 'next' to continue dialogue, or null to exit)
      for (let i = 0; i < choices.length; i++) {
        if (!choices[i].action || !shopActions.includes(choices[i].action)) {
          bestIdx = i;
          foundGood = true;
          break;
        }
      }
      // If all choices are shop actions, pick the last one (usually "Goodbye")
      if (!foundGood) bestIdx = choices.length - 1;
    }

    // Navigate to best choice
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
    pressKey('Enter'); // NG+ is first option
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
        if (_classTimer < 0.7) return; // Initial pause
        if (_classBrowseCount < _classBrowseTarget) {
          pressKey('ArrowDown');
          _classBrowseCount++;
          _classDelay = rand(0.35, 0.7); // "Reading" each class description
          return;
        }
        // Occasionally go back up (reconsidering)
        if (_classBrowseCount === _classBrowseTarget && Math.random() < 0.3) {
          pressKey('ArrowUp');
          _classBrowseCount++;
          _classDelay = rand(0.4, 0.8);
          return;
        }
        _classPhase = 'pick';
        _classDelay = rand(0.6, 1.2); // "Deciding" pause
        return;
      }
      case 'pick': {
        pressKey('Enter'); // Confirm class → enters naming mode
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
          // Variable typing: slower at start/end, faster in middle
          const progress = _nameIdx / _chosenName.length;
          _classDelay = (progress < 0.2 || progress > 0.8) ? rand(0.12, 0.25) : rand(0.06, 0.14);
          return;
        }
        _classPhase = 'confirm_name';
        _classDelay = rand(0.3, 0.6); // Pause before confirming
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

    pressKey('Enter'); // "New Game" is already selected
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
  }

  // Init immediately
  init();

  return { activate, isActive, isUnlocked, update };
})();
