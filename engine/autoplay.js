// engine/autoplay.js — Auto-play bot mode (activated by "srg2" cheat code)
// Injects virtual key presses so all animations, sounds, and effects trigger naturally.

const AutoPlay = (() => {
  let _unlocked = false;   // Code entered (resets on reload)
  let _active = false;     // Currently auto-playing
  let _actionTimer = 0;    // Pace actions naturally
  let _moveTimer = 0;      // Change direction periodically
  let _moveDir = null;     // Current wandering direction
  let _namingDone = false;  // Track if we've typed a name
  let _nameIdx = 0;         // Current char index for typing name
  let _classPickTimer = 0;  // Delay before picking class
  let _titleTimer = 0;      // Delay on title screen

  const BOT_NAMES = ['Zephyr', 'Astra', 'Bolt', 'Nova', 'Rex', 'Luna', 'Kai', 'Vex', 'Orion', 'Blaze'];
  let _chosenName = '';

  function activate() {
    _unlocked = true;
    _active = true;
  }

  function isActive() { return _unlocked && _active; }
  function isUnlocked() { return _unlocked; }

  // Register spacebar toggle listener (capture phase, before Input.js)
  function init() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && _unlocked) {
        _active = !_active;
        Core.addNotification(_active ? 'Auto-Play ON' : 'Auto-Play OFF', 2);
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    }, true); // capture phase — fires before Input.js
  }

  // Helper: inject a virtual key press (one-shot)
  function pressKey(code) {
    Input.justPressed[code] = true;
    Input.keys[code] = true;
  }

  // Helper: hold a key down (continuous)
  function holdKey(code) {
    Input.keys[code] = true;
  }

  function update(dt) {
    if (!_active) return;
    _actionTimer += dt;

    switch (GS.state) {
      case GameStates.PLAY:         botExplore(dt); break;
      case GameStates.COMBAT:       botCombat(dt); break;
      case GameStates.DIALOGUE:     botDialogue(dt); break;
      case GameStates.INVENTORY:    botMenu(); break;
      case GameStates.QUEST_LOG:    botMenu(); break;
      case GameStates.PAUSED:       botMenu(); break;
      case GameStates.GAME_OVER:    botGameOver(); break;
      case GameStates.CLASS_SELECT: botClassSelect(dt); break;
      case GameStates.MENU:         botTitleMenu(dt); break;
      case GameStates.VICTORY:      botVictory(); break;
    }
  }

  // ======== EXPLORE (PLAY state) ========
  function botExplore(dt) {
    _moveTimer -= dt;

    // Auto-heal if HP < 50% and we have a heal skill
    if (GS.player && GS.player.stats) {
      const s = GS.player.stats;
      if (s.hp < s.maxHp * 0.5 && GS.player.skills) {
        for (let i = 0; i < GS.player.skills.length; i++) {
          const skill = GS.player.skills[i];
          if (skill.type === 'heal' && s.mp >= skill.mpCost) {
            const slotKeys = ['Digit1', 'Digit2', 'Digit3', 'Digit4'];
            pressKey(slotKeys[i]);
            return;
          }
        }
      }
    }

    // Check fishing state
    const fishState = typeof Fishing !== 'undefined' ? Fishing.getState() : { active: false };
    if (fishState.active) {
      botFishing(fishState);
      return;
    }

    // Try to interact with nearby NPCs/chests (press E)
    if (_actionTimer > 1.5) {
      const nearby = WorldManager.getEntitiesNear(GS.player.x, GS.player.y, 2);
      for (const ent of nearby) {
        if (ent === GS.player) continue;
        if (ent.type === 'npc' || ent.type === 'chest') {
          pressKey('KeyE');
          _actionTimer = 0;
          return;
        }
      }
      // Try fishing if facing water
      if (WorldManager.isFacingWater(GS.player)) {
        pressKey('KeyE');
        _actionTimer = 0;
        return;
      }
    }

    // Wander: change direction every 2-4 seconds
    if (_moveTimer <= 0) {
      const dirs = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      // Occasionally go diagonal
      if (Math.random() < 0.3) {
        const hDirs = ['ArrowLeft', 'ArrowRight'];
        const vDirs = ['ArrowUp', 'ArrowDown'];
        _moveDir = [hDirs[Math.floor(Math.random() * 2)], vDirs[Math.floor(Math.random() * 2)]];
      } else {
        _moveDir = [dirs[Math.floor(Math.random() * dirs.length)]];
      }
      _moveTimer = 2 + Math.random() * 2;
    }

    // Hold movement keys
    if (_moveDir) {
      for (const k of _moveDir) holdKey(k);
    }
  }

  // ======== FISHING ========
  function botFishing(fishState) {
    if (fishState.phase === 'bite') {
      // Rapidly press confirm to reel in
      pressKey('Space');
    }
    // Other phases (casting, waiting, caught, failed) — just wait
  }

  // ======== COMBAT ========
  function botCombat(dt) {
    if (_actionTimer < 0.3) return; // Pace actions so it looks natural
    _actionTimer = 0;

    if (!GS.player || !GS.player.stats) return;
    const s = GS.player.stats;

    // If HP < 40% and we have a heal skill, use it
    if (s.hp < s.maxHp * 0.4 && GS.player.skills) {
      const healIdx = GS.player.skills.findIndex(sk => sk.type === 'heal' && s.mp >= sk.mpCost);
      if (healIdx >= 0) {
        // Navigate to Skills action (index 1)
        pressKey('ArrowDown'); // We'll navigate next frame
        // Simple approach: just press keys to get to Skills and use heal
        botCombatUseSkill(healIdx);
        return;
      }
    }

    // If MP > 30% of max, try strongest damage skill
    if (s.mp > s.maxMp * 0.3 && GS.player.skills) {
      const dmgIdx = GS.player.skills.findIndex(sk => sk.type === 'damage' && s.mp >= sk.mpCost);
      if (dmgIdx >= 0 && Math.random() < 0.5) {
        botCombatUseSkill(dmgIdx);
        return;
      }
    }

    // Default: just Attack (press confirm — attack is default first action)
    pressKey('Enter');
  }

  function botCombatUseSkill(skillIdx) {
    // Since combat uses justPressed for navigation, we inject the right keys.
    // The combat system reads _selectedAction and _subMenu.
    // Simplest: just press confirm (Attack), which works because Attack is index 0.
    // For skills, we'd need multiple frames. So just attack for reliability.
    pressKey('Enter');
  }

  // ======== DIALOGUE ========
  function botDialogue(dt) {
    if (_actionTimer < 0.4) return;
    _actionTimer = 0;
    // Advance dialogue / pick first choice
    pressKey('Enter');
  }

  // ======== MENUS (Inventory, QuestLog, Paused) ========
  function botMenu() {
    if (_actionTimer < 0.3) return;
    _actionTimer = 0;
    // Close the menu
    pressKey('Escape');
  }

  // ======== GAME OVER ========
  function botGameOver() {
    if (_actionTimer < 1.0) return;
    _actionTimer = 0;
    pressKey('Enter');
  }

  // ======== VICTORY ========
  function botVictory() {
    if (_actionTimer < 1.0) return;
    _actionTimer = 0;
    pressKey('Enter');
  }

  // ======== CLASS SELECT ========
  function botClassSelect(dt) {
    _classPickTimer += dt;

    // Wait a moment before acting
    if (_classPickTimer < 0.8) return;

    if (!_namingDone) {
      if (!_chosenName) {
        // First: pick a random class (press down a few times, then confirm)
        if (_classPickTimer < 1.5) {
          // Navigate down to pick a random class
          if (Math.random() < 0.3) pressKey('ArrowDown');
          return;
        }
        // Confirm class selection — enters naming mode
        pressKey('Enter');
        _chosenName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
        _nameIdx = 0;
        _actionTimer = 0;
        return;
      }

      // Type the name one character at a time
      if (_actionTimer < 0.1) return;
      _actionTimer = 0;

      if (_nameIdx < _chosenName.length) {
        const ch = _chosenName[_nameIdx].toUpperCase();
        pressKey('Key' + ch);
        _nameIdx++;
        return;
      }

      // Name fully typed — confirm
      pressKey('Enter');
      _namingDone = true;
      return;
    }
  }

  // ======== TITLE MENU ========
  function botTitleMenu(dt) {
    _titleTimer += dt;

    // Wait a moment on title screen
    if (_titleTimer < 1.0) return;

    if (_actionTimer < 0.5) return;
    _actionTimer = 0;

    // Press confirm — "New Game" is the first option
    pressKey('Enter');
    _titleTimer = 0;
    _classPickTimer = 0;
    _namingDone = false;
    _chosenName = '';
    _nameIdx = 0;
  }

  // Init immediately
  init();

  return { activate, isActive, isUnlocked, update };
})();
