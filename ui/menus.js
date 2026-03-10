// ui/menus.js — Title screen, pause, settings, game over, class select, victory
// + Achievements gallery, Bestiary encyclopedia, Daily Challenges tracker

const Menus = (() => {
  let _titleSelected = 0;
  let _pauseSelected = 0;
  let _classSelected = 0;
  let _settingsSelected = 0;
  let _playerName = '';
  let _namingMode = false;
  let _titleAnim = 0;
  let _codeMode = false;
  let _codeInput = '';
  let _cheatActive = false;

  // Sub-screen system for pause menu
  let _subScreen = null; // null, 'settings', 'achievements', 'bestiary', 'dailies', 'pets', 'party', 'save_slots', 'load_slots'
  let _subSelected = 0;
  let _subScroll = 0;

  const titleOptions = ['New Game', 'Continue', 'Enter Code', 'Settings'];
  const pauseOptions = ['Resume', 'Inventory', 'Quest Log', 'Achievements', 'Bestiary', 'Dailies', 'Pets', 'Party', 'Settings', 'Save Game', 'Quit to Title'];

  const settingsItems = ['Music Volume', 'SFX Volume', 'Difficulty', 'Show FPS', 'Back'];

  function update(dt) {
    switch (GS.state) {
      case GameStates.MENU: updateTitle(dt); break;
      case GameStates.CLASS_SELECT: updateClassSelect(dt); break;
      case GameStates.PAUSED: updatePause(dt); break;
      case GameStates.GAME_OVER: updateGameOver(dt); break;
      case GameStates.VICTORY: updateVictory(dt); break;
    }
  }

  // ======== TITLE SCREEN ========
  function updateTitle(dt) {
    _titleAnim += dt;

    // Handle sub-screens from title (load slots, settings)
    if (_subScreen === 'load_slots' || _subScreen === 'settings') {
      if (Input.actionPressed(Input.Actions.CANCEL)) {
        _subScreen = null;
        if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_select');
        return;
      }
      if (_subScreen === 'load_slots') updateSaveSlots('load');
      if (_subScreen === 'settings') updateSettings();
      return;
    }

    if (_codeMode) {
      for (const code of Object.keys(Input.justPressed)) {
        if (code === 'Backspace') {
          _codeInput = _codeInput.slice(0, -1);
        } else if (code === 'Enter') {
          processCode(_codeInput);
          _codeMode = false;
          _codeInput = '';
        } else if (code === 'Escape') {
          _codeMode = false;
          _codeInput = '';
        } else if (code.startsWith('Key') && _codeInput.length < 20) {
          _codeInput += code.slice(3).toLowerCase();
        } else if (code.startsWith('Digit') && _codeInput.length < 20) {
          _codeInput += code.slice(5);
        }
      }
      return;
    }

    if (Input.actionPressed(Input.Actions.UP)) {
      _titleSelected = (_titleSelected - 1 + titleOptions.length) % titleOptions.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }
    if (Input.actionPressed(Input.Actions.DOWN)) {
      _titleSelected = (_titleSelected + 1) % titleOptions.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    const titleWheel = Input.getWheelDelta();
    if (titleWheel !== 0) {
      _titleSelected = (_titleSelected + Math.sign(titleWheel) + titleOptions.length) % titleOptions.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    if (Input.actionPressed(Input.Actions.CONFIRM)) {
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_select');
      switch (titleOptions[_titleSelected]) {
        case 'New Game':
          _classSelected = 0;
          _playerName = '';
          _namingMode = false;
          Core.setState(GameStates.CLASS_SELECT);
          break;
        case 'Continue':
          if (typeof SaveSystem !== 'undefined') {
            // Check if any save exists
            let anySave = false;
            for (let s = 0; s < 3; s++) { if (SaveSystem.hasSave(s)) { anySave = true; break; } }
            if (anySave) {
              _subScreen = 'load_slots';
              _subSelected = 0;
            } else {
              Core.addNotification('No save data found!', 2);
            }
          }
          break;
        case 'Enter Code':
          _codeMode = true;
          _codeInput = '';
          break;
        case 'Settings':
          _subScreen = 'settings';
          _settingsSelected = 0;
          break;
      }
    }
  }

  function processCode(code) {
    if (code === 'srg2') {
      _cheatActive = true;
      if (typeof AutoPlay !== 'undefined') AutoPlay.activate();
      Core.addNotification('Code accepted! Max mode + Auto-Play activated!', 5);
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('levelup');
    } else {
      Core.addNotification('Invalid code.', 2);
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('hit');
    }
  }

  function renderTitle() {
    const w = Renderer.getWidth();
    const h = Renderer.getHeight();
    const ctx = Renderer.getCtx();

    // If sub-screen active (settings or load slots from title)
    if (_subScreen === 'settings') {
      renderSettings(w, h, ctx);
      return;
    }
    if (_subScreen === 'load_slots') {
      renderSaveSlots(w, h, 'load');
      return;
    }

    // Background gradient
    const grad = ctx.createRadialGradient(w / 2, h * 0.35, 0, w / 2, h * 0.35, w * 0.8);
    grad.addColorStop(0, '#12122a');
    grad.addColorStop(0.5, '#0a0a1e');
    grad.addColorStop(1, '#060610');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Vignette
    const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.9);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    // Stars
    const rng = Utils.mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const sx = rng() * w;
      const sy = rng() * h * 0.7;
      const size = rng() * 2.5 + 0.5;
      const speed = 1 + rng() * 3;
      const twinkle = Math.sin(_titleAnim * speed + i * 1.7) * 0.5 + 0.5;
      ctx.globalAlpha = twinkle * 0.7;
      ctx.fillStyle = i % 8 === 0 ? 'rgba(240,192,64,0.8)' : 'rgba(200,210,255,0.8)';
      ctx.fillRect(sx, sy, size, size);
    }
    ctx.globalAlpha = 1;

    // Floating particles
    for (let i = 0; i < 12; i++) {
      const px = w * 0.3 + rng() * w * 0.4;
      const py = h - (((_titleAnim * 15 + i * 50) % h));
      const a = Math.sin(_titleAnim + i) * 0.3 + 0.3;
      ctx.globalAlpha = a;
      ctx.fillStyle = '#f0c040';
      ctx.fillRect(px, py, 2, 2);
    }
    ctx.globalAlpha = 1;

    // Title
    const titleY = h * 0.22;
    const pulse = Math.sin(_titleAnim * 1.5) * 3;
    ctx.globalAlpha = 0.3;
    Renderer.drawText('REALM ENGINE', w / 2 + 2, titleY + pulse + 2, '#000', 52, 'center', true);
    ctx.globalAlpha = 1;
    Renderer.drawText('REALM ENGINE', w / 2, titleY + pulse, '#f0c040', 52, 'center', true);
    Renderer.drawText('A Browser RPG Adventure', w / 2, titleY + 58, '#6a6a80', 14, 'center');

    // Decorative line
    ctx.strokeStyle = '#3a3040';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 120, titleY + 78);
    ctx.lineTo(w / 2 + 120, titleY + 78);
    ctx.stroke();
    ctx.fillStyle = '#806020';
    ctx.save();
    ctx.translate(w / 2, titleY + 78);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-3, -3, 6, 6);
    ctx.restore();

    // Code entry overlay
    if (_codeMode) {
      Renderer.drawRect(0, 0, w, h, 'rgba(0,0,0,0.7)');
      Renderer.drawPanel(w / 2 - 180, h / 2 - 60, 360, 120, 'rgba(10,10,30,0.95)', '#ffcc00');
      Renderer.drawText('ENTER CODE', w / 2, h / 2 - 40, '#ffcc00', 20, 'center', true);
      const codeDisplay = _codeInput + (Math.floor(_titleAnim * 2) % 2 === 0 ? '_' : ' ');
      Renderer.drawText(codeDisplay || '_', w / 2, h / 2, '#fff', 24, 'center');
      Renderer.drawText('ENTER to submit | ESC to cancel', w / 2, h / 2 + 35, '#666', 11, 'center');
      return;
    }

    // Cheat badge
    if (_cheatActive) {
      const badgePulse = Math.sin(_titleAnim * 3) * 0.2 + 0.8;
      ctx.globalAlpha = badgePulse;
      Renderer.drawText('MAX MODE ACTIVE', w / 2, titleY + 80, '#ff4444', 14, 'center', true);
      ctx.globalAlpha = 1;
    }

    // Menu options
    const menuY = h * 0.5;
    for (let i = 0; i < titleOptions.length; i++) {
      const sel = i === _titleSelected;
      const color = sel ? '#ffcc00' : '#888';
      const size = sel ? 22 : 18;
      const prefix = sel ? '> ' : '  ';
      Renderer.drawText(prefix + titleOptions[i], w / 2, menuY + i * 40, color, size, 'center', sel);
    }

    // Footer
    Renderer.drawText('Arrow Keys / Scroll to navigate | Enter to select', w / 2, h - 60, '#444', 12, 'center');
    Renderer.drawText('100% Client-Side | Zero External Assets | Free Forever', w / 2, h - 40, '#333', 10, 'center');
  }

  // ======== CLASS SELECT ========
  function updateClassSelect(dt) {
    const classes = Classes.getAllClasses();

    if (_namingMode) {
      for (const code of Object.keys(Input.justPressed)) {
        if (code === 'Backspace') {
          _playerName = _playerName.slice(0, -1);
        } else if (code === 'Enter') {
          if (_playerName.length > 0) {
            startNewGame(classes[_classSelected], _playerName);
          }
        } else if (code === 'Escape') {
          _namingMode = false;
        } else if (code.startsWith('Key') && _playerName.length < 12) {
          _playerName += code.slice(3);
        } else if (code === 'Space' && _playerName.length < 12) {
          _playerName += ' ';
        }
      }
      return;
    }

    if (Input.actionPressed(Input.Actions.UP)) {
      _classSelected = (_classSelected - 1 + classes.length) % classes.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }
    if (Input.actionPressed(Input.Actions.DOWN)) {
      _classSelected = (_classSelected + 1) % classes.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    const classWheel = Input.getWheelDelta();
    if (classWheel !== 0) {
      _classSelected = (_classSelected + Math.sign(classWheel) + classes.length) % classes.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    if (Input.actionPressed(Input.Actions.CONFIRM)) {
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_select');
      _namingMode = true;
      _playerName = '';
    }

    if (Input.actionPressed(Input.Actions.CANCEL)) {
      Core.setState(GameStates.MENU);
    }
  }

  function renderClassSelect() {
    const w = Renderer.getWidth();
    const h = Renderer.getHeight();
    const ctx = Renderer.getCtx();
    const classes = Classes.getAllClasses();

    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
    grad.addColorStop(0, '#0e0e22');
    grad.addColorStop(1, '#060610');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    Renderer.drawPanel(30, 20, w - 60, h - 40, 'rgba(8,8,24,0.95)', '#2a2a40');
    Renderer.drawText('Choose Your Class', w / 2, 42, '#f0c040', 24, 'center', true);

    ctx.strokeStyle = '#2a2a40';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 62);
    ctx.lineTo(w - 60, 62);
    ctx.stroke();

    if (_namingMode) {
      Renderer.drawPanel(w / 2 - 200, h / 2 - 70, 400, 140, 'rgba(16,16,40,0.95)', '#f0c040');
      Renderer.drawText('Enter Your Name', w / 2, h / 2 - 45, '#f0c040', 20, 'center', true);
      const nameDisplay = _playerName + (Math.floor(GS.time * 2) % 2 === 0 ? '_' : ' ');
      Renderer.drawText(nameDisplay || '_', w / 2, h / 2, '#fff', 28, 'center');
      Renderer.drawText('ENTER to confirm  |  ESC to go back', w / 2, h / 2 + 40, '#6a6a80', 11, 'center');
      return;
    }

    const cardH = 72;
    const listH = h - 130;
    const totalH = classes.length * cardH;
    const maxScroll = Math.max(0, totalH - listH);
    const targetScroll = Math.max(0, Math.min(maxScroll, _classSelected * cardH - listH / 2 + cardH / 2));

    ctx.save();
    ctx.beginPath();
    ctx.rect(30, 70, w - 60, listH);
    ctx.clip();

    for (let i = 0; i < classes.length; i++) {
      const cls = Classes.getClass(classes[i]);
      const sel = i === _classSelected;
      const y = 75 + i * cardH - targetScroll;
      if (y + cardH < 70 || y > h - 55) continue;

      const cardX = 50;
      const cardW = w - 100;

      if (sel) {
        ctx.fillStyle = 'rgba(240,192,64,0.06)';
        ctx.fillRect(cardX - 2, y - 2, cardW + 4, cardH - 4);
        Renderer.drawPanel(cardX, y, cardW, cardH - 8, 'rgba(30,30,60,0.9)', '#f0c040');
      } else {
        Renderer.drawPanel(cardX, y, cardW, cardH - 8, 'rgba(16,16,32,0.7)', '#1e1e30');
      }

      const portrait = SpriteGen.cache.portraits[classes[i]];
      if (portrait) {
        ctx.drawImage(portrait, cardX + 10, y + 8, 48, 48);
      }

      Renderer.drawText(cls.name, cardX + 72, y + 8, sel ? '#f0c040' : '#999', sel ? 18 : 16, 'left', sel);
      Renderer.drawText(cls.desc, cardX + 72, y + 28, sel ? '#c0c0d0' : '#666', 11);

      const stats = cls.baseStats;
      Renderer.drawText(`HP:${stats.hp}  MP:${stats.mp}  STR:${stats.str}  DEF:${stats.def}  INT:${stats.int}  AGI:${stats.agi}  LUK:${stats.luk}`, cardX + 72, y + 44, '#4a4a60', 10);
    }

    ctx.restore();

    if (targetScroll > 0) {
      ctx.globalAlpha = 0.5;
      Renderer.drawText('\u25B2', w / 2, 74, '#f0c040', 14, 'center');
      ctx.globalAlpha = 1;
    }
    if (targetScroll < maxScroll) {
      ctx.globalAlpha = 0.5;
      Renderer.drawText('\u25BC', w / 2, h - 60, '#f0c040', 14, 'center');
      ctx.globalAlpha = 1;
    }

    Renderer.drawText('\u2191\u2193 / Scroll to select  |  ENTER Choose  |  ESC Back', w / 2, h - 38, '#4a4a60', 11, 'center');
  }

  // ======== NEW GAME ========
  function startNewGame(classType, name) {
    GS.quests = [];
    GS.exploredTiles = {};
    GS.entities = [];
    GS.defeatedBosses = [];
    GS.achievements = [];
    GS.gameTime = 360;
    GS.playTime = 0;
    GS.notifications = [];
    GS.ngPlus = 0;
    GS.difficulty = 'normal';
    GS.bestiary = {};
    GS.bestiaryRewards = {};
    GS.dailyChallenges = null;
    GS.achievementCounters = null;

    GS.player = Classes.createPlayer(classType, name);
    GS.entities.push(GS.player);

    if (_cheatActive) {
      applyMaxMode(GS.player);
    }

    WorldManager.loadZone('eldergrove');
    Quests.acceptQuest('main_story');

    // Init systems
    if (typeof Achievements !== 'undefined') Achievements.init();
    if (typeof Bestiary !== 'undefined') Bestiary.init();
    if (typeof DailyChallenges !== 'undefined') DailyChallenges.init();
    if (typeof NewGamePlus !== 'undefined') NewGamePlus.init();

    Core.setState(GameStates.PLAY);
    if (_cheatActive) {
      Core.addNotification(`MAX MODE: ${name} enters the Realm at full power!`, 5);
    } else {
      Core.addNotification(`Welcome to the Realm, ${name}!`, 4);
    }

    if (typeof AudioManager !== 'undefined') {
      AudioManager.playMusic('town');
    }
  }

  function applyMaxMode(player) {
    const s = player.stats;
    s.level = 30;
    s.xp = 0;
    s.xpToNext = 99999;
    s.gold = 9999999;
    player.gold = 9999999;
    s.maxHp = 999; s.hp = 999;
    s.maxMp = 999; s.mp = 999;
    s.str = 99; s.def = 99; s.int = 99; s.agi = 99; s.luk = 99;

    const cls = Classes.getClass(player.classType);
    if (cls) {
      for (const skillId of cls.skillTree) {
        const skill = Abilities.getSkill(skillId);
        if (skill && !player.learnedSkillIds.has(skillId)) {
          player.skills.push(skill);
          player.learnedSkillIds.add(skillId);
        }
      }
    }
    player.skillPoints = 10;

    const slots = ['weapon', 'armor', 'helmet', 'boots', 'ring', 'amulet'];
    for (const slot of slots) {
      const item = Items.generateItem(30, 'legendary');
      item.slot = slot;
      player.equipment[slot] = item;
    }

    player.items = [];
    for (let i = 0; i < 5; i++) {
      player.items.push({ id: Utils.genId(), name: 'Full Elixir', type: 'consumable', effect: 'heal_both', value: 9999, rarity: 'legendary', desc: 'Fully restores HP and MP.' });
    }
    for (let i = 0; i < 3; i++) {
      player.items.push({ id: Utils.genId(), name: 'Revive Potion', type: 'consumable', effect: 'revive', value: 50, rarity: 'rare', desc: 'Revive a fallen ally at 50% HP.' });
    }
    player.items.push({ id: 'fishing_rod', name: 'Fishing Rod', type: 'consumable', effect: 'none', value: 0, rarity: 'uncommon', desc: 'Used for fishing at water spots.' });
    player.fishingUnlocked = true;

    if (typeof Pets !== 'undefined') {
      player.pets = [];
      for (const [id, def] of Object.entries(Pets.petDefs)) {
        const pet = {
          id, name: def.name, rarity: def.rarity, element: def.element,
          level: 10, xp: 0, xpToNext: 500,
          passive: { ...def.passive }, combatBonus: { ...def.combatBonus }
        };
        for (const k of Object.keys(pet.passive)) {
          pet.passive[k] = Math.floor(pet.passive[k] * 2.5);
        }
        player.pets.push(pet);
      }
      player.activePet = player.pets[player.pets.length - 1];
    }

    if (typeof Allies !== 'undefined') {
      player.party = [];
      const topAllies = ['healer_willow', 'shadow_blade', 'fire_mage'];
      for (const aId of topAllies) {
        const ally = Allies.recruitAlly(aId);
        if (ally) {
          ally.level = 30;
          ally.stats.hp = 500; ally.stats.maxHp = 500;
          ally.stats.mp = 200; ally.stats.maxMp = 200;
          ally.stats.str = 50; ally.stats.def = 40;
          ally.stats.int = 50; ally.stats.agi = 40;
        }
      }
    }

    GS.cheatActive = true;
  }

  // ======== PAUSE MENU ========
  function updatePause(dt) {
    _titleAnim += dt;

    // Sub-screen handling
    if (_subScreen) {
      updateSubScreen(dt);
      return;
    }

    if (Input.actionPressed(Input.Actions.UP)) {
      _pauseSelected = (_pauseSelected - 1 + pauseOptions.length) % pauseOptions.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }
    if (Input.actionPressed(Input.Actions.DOWN)) {
      _pauseSelected = (_pauseSelected + 1) % pauseOptions.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    const pauseWheel = Input.getWheelDelta();
    if (pauseWheel !== 0) {
      _pauseSelected = (_pauseSelected + Math.sign(pauseWheel) + pauseOptions.length) % pauseOptions.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    if (Input.actionPressed(Input.Actions.CONFIRM)) {
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_select');
      switch (pauseOptions[_pauseSelected]) {
        case 'Resume':
          Core.setState(GameStates.PLAY);
          break;
        case 'Inventory':
          Core.setState(GameStates.INVENTORY);
          break;
        case 'Quest Log':
          Core.setState(GameStates.QUEST_LOG);
          break;
        case 'Achievements':
          _subScreen = 'achievements';
          _subSelected = 0;
          _subScroll = 0;
          break;
        case 'Bestiary':
          _subScreen = 'bestiary';
          _subSelected = 0;
          _subScroll = 0;
          break;
        case 'Dailies':
          _subScreen = 'dailies';
          _subSelected = 0;
          break;
        case 'Pets':
          _subScreen = 'pets';
          _subSelected = 0;
          break;
        case 'Party':
          _subScreen = 'party';
          _subSelected = 0;
          break;
        case 'Settings':
          _subScreen = 'settings';
          _settingsSelected = 0;
          break;
        case 'Save Game':
          _subScreen = 'save_slots';
          _subSelected = GS.saveSlot || 0;
          break;
        case 'Quit to Title':
          _subScreen = null;
          Core.setState(GameStates.MENU);
          _titleSelected = 0;
          break;
      }
    }

    if (Input.actionPressed(Input.Actions.CANCEL) || Input.actionPressed(Input.Actions.MENU)) {
      Core.setState(GameStates.PLAY);
    }
  }

  function updateSubScreen(dt) {
    if (Input.actionPressed(Input.Actions.CANCEL)) {
      _subScreen = null;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_select');
      return;
    }

    switch (_subScreen) {
      case 'settings': updateSettings(); break;
      case 'achievements': updateAchievements(); break;
      case 'bestiary': updateBestiary(); break;
      case 'dailies': updateDailies(); break;
      case 'pets': updatePets(); break;
      case 'party': updateParty(); break;
      case 'save_slots': updateSaveSlots('save'); break;
      case 'load_slots': updateSaveSlots('load'); break;
    }
  }

  function renderPause() {
    const w = Renderer.getWidth();
    const h = Renderer.getHeight();
    const ctx = Renderer.getCtx();

    // Sub-screen rendering
    if (_subScreen) {
      Renderer.drawRect(0, 0, w, h, 'rgba(4,4,12,0.85)');
      switch (_subScreen) {
        case 'settings': renderSettings(w, h, ctx); break;
        case 'achievements': renderAchievements(w, h, ctx); break;
        case 'bestiary': renderBestiary(w, h, ctx); break;
        case 'dailies': renderDailies(w, h, ctx); break;
        case 'pets': renderPets(w, h, ctx); break;
        case 'party': renderParty(w, h, ctx); break;
        case 'save_slots': renderSaveSlots(w, h, 'save'); break;
        case 'load_slots': renderSaveSlots(w, h, 'load'); break;
      }
      return;
    }

    Renderer.drawRect(0, 0, w, h, 'rgba(4,4,12,0.7)');

    const pw = 320, ph = pauseOptions.length * 34 + 60;
    const px = (w - pw) / 2, py = (h - ph) / 2;
    Renderer.drawPanel(px, py, pw, ph, 'rgba(8,8,24,0.95)', '#2a2a40');

    Renderer.drawText('PAUSED', w / 2, py + 18, '#f0c040', 22, 'center', true);

    ctx.strokeStyle = '#2a2a40';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 20, py + 38);
    ctx.lineTo(px + pw - 20, py + 38);
    ctx.stroke();

    for (let i = 0; i < pauseOptions.length; i++) {
      const sel = i === _pauseSelected;
      const y = py + 48 + i * 32;

      if (sel) {
        ctx.fillStyle = 'rgba(240,192,64,0.08)';
        ctx.fillRect(px + 10, y - 4, pw - 20, 26);
      }

      const color = sel ? '#f0c040' : '#7a7a90';
      const prefix = sel ? '\u25B6 ' : '   ';
      Renderer.drawText(prefix + pauseOptions[i], px + 30, y, color, sel ? 15 : 14);
    }
  }

  // ======== SETTINGS ========
  function updateSettings() {
    if (Input.actionPressed(Input.Actions.UP)) {
      _settingsSelected = (_settingsSelected - 1 + settingsItems.length) % settingsItems.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }
    if (Input.actionPressed(Input.Actions.DOWN)) {
      _settingsSelected = (_settingsSelected + 1) % settingsItems.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    const wheel = Input.getWheelDelta();
    if (wheel !== 0) {
      _settingsSelected = (_settingsSelected + Math.sign(wheel) + settingsItems.length) % settingsItems.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    const item = settingsItems[_settingsSelected];
    if (Input.actionPressed(Input.Actions.CONFIRM)) {
      if (item === 'Back') {
        _subScreen = null;
        if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_select');
      } else if (item === 'Show FPS') {
        GS.settings.showFPS = !GS.settings.showFPS;
        if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_select');
      } else if (item === 'Difficulty') {
        const diffs = ['easy', 'normal', 'hard', 'nightmare'];
        const cur = diffs.indexOf(GS.difficulty || 'normal');
        GS.difficulty = diffs[(cur + 1) % diffs.length];
        if (typeof NewGamePlus !== 'undefined') NewGamePlus.setDifficulty(GS.difficulty);
        if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_select');
      }
    }

    // LEFT/RIGHT for volume sliders
    if (Input.actionPressed(Input.Actions.LEFT) || Input.actionPressed(Input.Actions.RIGHT)) {
      const dir = Input.actionPressed(Input.Actions.RIGHT) ? 0.1 : -0.1;
      if (item === 'Music Volume') {
        GS.settings.musicVolume = Utils.clamp((GS.settings.musicVolume || 0.3) + dir, 0, 1);
        if (typeof AudioManager !== 'undefined') AudioManager.setMusicVolume(GS.settings.musicVolume);
        if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
      } else if (item === 'SFX Volume') {
        GS.settings.sfxVolume = Utils.clamp((GS.settings.sfxVolume || 0.5) + dir, 0, 1);
        if (typeof AudioManager !== 'undefined') AudioManager.setSFXVolume(GS.settings.sfxVolume);
        if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
      } else if (item === 'Difficulty') {
        const diffs = ['easy', 'normal', 'hard', 'nightmare'];
        const cur = diffs.indexOf(GS.difficulty || 'normal');
        GS.difficulty = diffs[(cur + (dir > 0 ? 1 : diffs.length - 1)) % diffs.length];
        if (typeof NewGamePlus !== 'undefined') NewGamePlus.setDifficulty(GS.difficulty);
        if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
      }
    }
  }

  function renderSettings(w, h, ctx) {
    const pw = 420, ph = 280;
    const px = (w - pw) / 2, py = (h - ph) / 2;
    Renderer.drawPanel(px, py, pw, ph, 'rgba(8,8,24,0.95)', '#2a2a40');

    Renderer.drawText('SETTINGS', w / 2, py + 18, '#f0c040', 22, 'center', true);

    ctx.strokeStyle = '#2a2a40';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 20, py + 38);
    ctx.lineTo(px + pw - 20, py + 38);
    ctx.stroke();

    for (let i = 0; i < settingsItems.length; i++) {
      const sel = i === _settingsSelected;
      const y = py + 55 + i * 40;
      const item = settingsItems[i];

      if (sel) {
        ctx.fillStyle = 'rgba(240,192,64,0.08)';
        ctx.fillRect(px + 10, y - 6, pw - 20, 32);
      }

      const color = sel ? '#f0c040' : '#7a7a90';
      Renderer.drawText(item, px + 30, y, color, 14);

      // Value display
      if (item === 'Music Volume') {
        const vol = Math.round((GS.settings.musicVolume || 0.3) * 100);
        drawSlider(ctx, px + 200, y + 2, 160, vol, sel);
      } else if (item === 'SFX Volume') {
        const vol = Math.round((GS.settings.sfxVolume || 0.5) * 100);
        drawSlider(ctx, px + 200, y + 2, 160, vol, sel);
      } else if (item === 'Difficulty') {
        const diffNames = { easy: 'Easy', normal: 'Normal', hard: 'Hard', nightmare: 'Nightmare' };
        const diffColors = { easy: '#4a4', normal: '#aaa', hard: '#f80', nightmare: '#f44' };
        const d = GS.difficulty || 'normal';
        Renderer.drawText(`< ${diffNames[d]} >`, px + pw - 40, y, diffColors[d], 14, 'right');
      } else if (item === 'Show FPS') {
        Renderer.drawText(GS.settings.showFPS ? 'ON' : 'OFF', px + pw - 40, y, GS.settings.showFPS ? '#4a4' : '#666', 14, 'right');
      } else if (item === 'Back') {
        // Just the label
      }
    }

    Renderer.drawText('\u2191\u2193 Navigate | \u2190\u2192 Adjust | ENTER Select | ESC Back', w / 2, py + ph - 18, '#4a4a60', 10, 'center');
  }

  function drawSlider(ctx, x, y, width, percent, active) {
    // Track
    ctx.fillStyle = '#1a1a30';
    ctx.fillRect(x, y, width, 10);
    // Fill
    const fillW = width * (percent / 100);
    ctx.fillStyle = active ? '#f0c040' : '#806020';
    ctx.fillRect(x, y, fillW, 10);
    // Border
    ctx.strokeStyle = active ? '#f0c040' : '#3a3a50';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, 10);
    // Value text
    Renderer.drawText(`${percent}%`, x + width + 10, y - 2, active ? '#f0c040' : '#7a7a90', 12);
  }

  // ======== ACHIEVEMENTS SCREEN ========
  function updateAchievements() {
    if (typeof Achievements === 'undefined') return;
    const all = Achievements.getAll();

    if (Input.actionPressed(Input.Actions.UP)) {
      _subSelected = (_subSelected - 1 + all.length) % all.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }
    if (Input.actionPressed(Input.Actions.DOWN)) {
      _subSelected = (_subSelected + 1) % all.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    const wheel = Input.getWheelDelta();
    if (wheel !== 0) {
      _subSelected = (_subSelected + Math.sign(wheel) + all.length) % all.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }
  }

  function renderAchievements(w, h, ctx) {
    if (typeof Achievements === 'undefined') return;

    const all = Achievements.getAll();
    const unlocked = Achievements.getUnlockedCount();
    const total = Achievements.getTotalCount();

    const pw = Math.min(w - 60, 500), ph = h - 80;
    const px = (w - pw) / 2, py = 40;
    Renderer.drawPanel(px, py, pw, ph, 'rgba(8,8,24,0.95)', '#2a2a40');

    // Header
    Renderer.drawText('ACHIEVEMENTS', w / 2, py + 18, '#f0c040', 22, 'center', true);
    Renderer.drawText(`${unlocked} / ${total} Unlocked`, w / 2, py + 40, '#888', 12, 'center');

    // Progress bar
    const barX = px + 40, barY = py + 55, barW = pw - 80;
    ctx.fillStyle = '#1a1a30';
    ctx.fillRect(barX, barY, barW, 8);
    ctx.fillStyle = '#f0c040';
    ctx.fillRect(barX, barY, barW * (unlocked / Math.max(1, total)), 8);
    ctx.strokeStyle = '#3a3a50';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, 8);

    // Achievement list
    const listY = py + 75;
    const itemH = 44;
    const maxShow = Math.floor((ph - 100) / itemH);
    const scrollOff = Math.max(0, _subSelected - maxShow + 3);

    for (let i = scrollOff; i < all.length && i < scrollOff + maxShow; i++) {
      const ach = all[i];
      const sel = i === _subSelected;
      const y = listY + (i - scrollOff) * itemH;

      if (sel) {
        ctx.fillStyle = 'rgba(240,192,64,0.06)';
        ctx.fillRect(px + 10, y - 2, pw - 20, itemH - 4);
      }

      // Icon
      const iconColor = ach.unlocked ? '#f0c040' : '#333';
      const iconText = ach.unlocked ? '\u2605' : (ach.secret && !ach.unlocked ? '?' : '\u2606');
      Renderer.drawText(iconText, px + 30, y + 4, iconColor, 18);

      // Name
      const nameColor = ach.unlocked ? (sel ? '#f0c040' : '#ddd') : (sel ? '#666' : '#444');
      const name = (ach.secret && !ach.unlocked) ? '???' : ach.name;
      Renderer.drawText(name, px + 55, y + 4, nameColor, 14, 'left', sel && ach.unlocked);

      // Description
      const desc = (ach.secret && !ach.unlocked) ? 'Secret achievement' : ach.desc;
      Renderer.drawText(desc, px + 55, y + 22, ach.unlocked ? '#888' : '#444', 11);

      // Status
      if (ach.unlocked) {
        Renderer.drawText('\u2713', px + pw - 30, y + 10, '#4a4', 16);
      }
    }

    Renderer.drawText('ESC to go back', w / 2, py + ph - 16, '#4a4a60', 10, 'center');
  }

  // ======== BESTIARY SCREEN ========
  function updateBestiary() {
    if (typeof Bestiary === 'undefined') return;
    const entries = getBestiaryEntries();

    if (entries.length === 0) return;

    if (Input.actionPressed(Input.Actions.UP)) {
      _subSelected = (_subSelected - 1 + entries.length) % entries.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }
    if (Input.actionPressed(Input.Actions.DOWN)) {
      _subSelected = (_subSelected + 1) % entries.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    const wheel = Input.getWheelDelta();
    if (wheel !== 0) {
      _subSelected = (_subSelected + Math.sign(wheel) + entries.length) % entries.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }
  }

  function getBestiaryEntries() {
    if (typeof Enemies === 'undefined') return [];
    const allEnemies = Enemies.getAllEnemies ? Enemies.getAllEnemies() : [];
    const bestiary = GS.bestiary || {};

    return allEnemies.map(e => ({
      ...e,
      discovered: !!bestiary[e.type],
      killCount: bestiary[e.type]?.kills || 0
    }));
  }

  function renderBestiary(w, h, ctx) {
    const entries = getBestiaryEntries();
    const discovered = entries.filter(e => e.discovered).length;

    const pw = Math.min(w - 60, 520), ph = h - 80;
    const px = (w - pw) / 2, py = 40;
    Renderer.drawPanel(px, py, pw, ph, 'rgba(8,8,24,0.95)', '#2a2a40');

    Renderer.drawText('BESTIARY', w / 2, py + 18, '#f0c040', 22, 'center', true);
    Renderer.drawText(`${discovered} / ${entries.length} Discovered`, w / 2, py + 40, '#888', 12, 'center');

    // Progress bar
    const barX = px + 40, barY = py + 55, barW = pw - 80;
    ctx.fillStyle = '#1a1a30';
    ctx.fillRect(barX, barY, barW, 8);
    ctx.fillStyle = '#f44';
    ctx.fillRect(barX, barY, barW * (discovered / Math.max(1, entries.length)), 8);

    if (entries.length === 0) {
      Renderer.drawText('No enemies encountered yet.', w / 2, h / 2, '#666', 14, 'center');
      Renderer.drawText('ESC to go back', w / 2, py + ph - 16, '#4a4a60', 10, 'center');
      return;
    }

    // Enemy list (left) + details (right)
    const listY = py + 75;
    const itemH = 28;
    const maxShow = Math.floor((ph - 160) / itemH);
    const scrollOff = Math.max(0, _subSelected - maxShow + 3);
    const splitX = px + pw * 0.45;

    // List
    for (let i = scrollOff; i < entries.length && i < scrollOff + maxShow; i++) {
      const entry = entries[i];
      const sel = i === _subSelected;
      const y = listY + (i - scrollOff) * itemH;

      if (sel) {
        ctx.fillStyle = 'rgba(240,192,64,0.06)';
        ctx.fillRect(px + 10, y - 2, splitX - px - 20, itemH - 2);
      }

      const name = entry.discovered ? entry.name : '???';
      const color = sel ? '#f0c040' : (entry.discovered ? '#bbb' : '#444');
      Renderer.drawText(name, px + 25, y + 2, color, 12);

      if (entry.discovered) {
        Renderer.drawText(`x${entry.killCount}`, splitX - 35, y + 2, '#666', 10, 'right');
      }
    }

    // Details panel
    ctx.strokeStyle = '#2a2a40';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(splitX, listY - 5);
    ctx.lineTo(splitX, py + ph - 35);
    ctx.stroke();

    if (_subSelected < entries.length) {
      const entry = entries[_subSelected];
      const dx = splitX + 15;

      if (entry.discovered) {
        Renderer.drawText(entry.name, dx, listY, '#f0c040', 16, 'left', true);
        Renderer.drawText(`Level: ${entry.level || '?'}`, dx, listY + 24, '#aaa', 12);
        Renderer.drawText(`Kills: ${entry.killCount}`, dx, listY + 42, '#aaa', 12);

        if (entry.element) Renderer.drawText(`Element: ${entry.element}`, dx, listY + 60, '#88f', 11);
        if (entry.weakness) Renderer.drawText(`Weak to: ${entry.weakness}`, dx, listY + 76, '#f88', 11);
        if (entry.resistance) Renderer.drawText(`Resists: ${entry.resistance}`, dx, listY + 92, '#8f8', 11);

        // Stats preview
        let sy = listY + 114;
        if (entry.stats) {
          const st = entry.stats;
          Renderer.drawText(`HP: ${st.maxHp || '?'}  STR: ${st.str || '?'}`, dx, sy, '#777', 10);
          Renderer.drawText(`DEF: ${st.def || '?'}  AGI: ${st.agi || '?'}`, dx, sy + 16, '#777', 10);
        }

        // Loot hints
        if (entry.lootTable && entry.lootTable.length > 0) {
          Renderer.drawText('Drops:', dx, sy + 38, '#888', 11);
          for (let l = 0; l < Math.min(3, entry.lootTable.length); l++) {
            const drop = entry.lootTable[l];
            const rColor = Items.getRarityColor(drop.rarity);
            Renderer.drawText(`${drop.rarity} gear (${Math.round(drop.chance * 100)}%)`, dx + 10, sy + 54 + l * 14, rColor, 10);
          }
        }
      } else {
        Renderer.drawText('???', dx, listY, '#444', 16);
        Renderer.drawText('Not yet encountered.', dx, listY + 24, '#444', 12);
        Renderer.drawText('Defeat this enemy to', dx, listY + 42, '#444', 11);
        Renderer.drawText('discover its secrets.', dx, listY + 56, '#444', 11);
      }
    }

    Renderer.drawText('ESC to go back', w / 2, py + ph - 16, '#4a4a60', 10, 'center');
  }

  // ======== DAILY CHALLENGES SCREEN ========
  function updateDailies() {
    if (typeof DailyChallenges === 'undefined') return;
    const challenges = GS.dailyChallenges?.challenges || [];

    if (challenges.length === 0) return;

    if (Input.actionPressed(Input.Actions.UP)) {
      _subSelected = (_subSelected - 1 + challenges.length) % challenges.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }
    if (Input.actionPressed(Input.Actions.DOWN)) {
      _subSelected = (_subSelected + 1) % challenges.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    const wheel = Input.getWheelDelta();
    if (wheel !== 0) {
      _subSelected = (_subSelected + Math.sign(wheel) + challenges.length) % challenges.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    // Claim reward
    if (Input.actionPressed(Input.Actions.CONFIRM)) {
      const ch = challenges[_subSelected];
      if (ch && ch.progress >= ch.target && !ch.claimed) {
        if (typeof DailyChallenges !== 'undefined') {
          DailyChallenges.claimReward(_subSelected);
          if (typeof AudioManager !== 'undefined') AudioManager.playSFX('coin');
        }
      }
    }
  }

  function renderDailies(w, h, ctx) {
    const pw = Math.min(w - 60, 460), ph = 360;
    const px = (w - pw) / 2, py = (h - ph) / 2;
    Renderer.drawPanel(px, py, pw, ph, 'rgba(8,8,24,0.95)', '#2a2a40');

    const streak = GS.dailyChallenges?.streak || 0;
    const totalDone = GS.dailyChallenges?.totalCompleted || 0;
    Renderer.drawText('DAILY CHALLENGES', w / 2, py + 18, '#f0c040', 22, 'center', true);
    // Reset timer
    const resetTime = DailyChallenges.getTimeUntilReset();
    Renderer.drawText(`Streak: ${streak} days | Total: ${totalDone} | Resets in ${resetTime.hours}h ${resetTime.minutes}m`, w / 2, py + 40, '#888', 11, 'center');

    const challenges = GS.dailyChallenges?.challenges || [];

    if (challenges.length === 0) {
      Renderer.drawText('No challenges active.', w / 2, py + ph / 2, '#666', 14, 'center');
      Renderer.drawText('Challenges refresh daily.', w / 2, py + ph / 2 + 20, '#444', 12, 'center');
      Renderer.drawText('ESC to go back', w / 2, py + ph - 16, '#4a4a60', 10, 'center');
      return;
    }

    const startY = py + 65;
    const cardH = 70;

    for (let i = 0; i < challenges.length; i++) {
      const ch = challenges[i];
      const sel = i === _subSelected;
      const y = startY + i * cardH;
      const complete = ch.progress >= ch.target;

      // Card
      if (sel) {
        ctx.fillStyle = 'rgba(240,192,64,0.06)';
        ctx.fillRect(px + 10, y, pw - 20, cardH - 6);
      }
      Renderer.drawPanel(px + 15, y, pw - 30, cardH - 8, complete ? 'rgba(20,40,20,0.8)' : 'rgba(16,16,32,0.7)', sel ? '#f0c040' : '#1e1e30');

      // Description
      const desc = ch.desc || 'Challenge';
      const nameColor = sel ? '#f0c040' : (complete ? '#4a4' : '#ccc');
      Renderer.drawText(desc, px + 30, y + 8, nameColor, 13);

      // Progress bar
      const barX = px + 30, barY2 = y + 28, barW = pw - 120;
      const pct = Math.min(1, ch.progress / Math.max(1, ch.target));
      ctx.fillStyle = '#1a1a30';
      ctx.fillRect(barX, barY2, barW, 10);
      ctx.fillStyle = complete ? '#4a4' : '#f0c040';
      ctx.fillRect(barX, barY2, barW * pct, 10);
      ctx.strokeStyle = '#3a3a50';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY2, barW, 10);

      // Progress text
      Renderer.drawText(`${ch.progress}/${ch.target}`, barX + barW + 8, barY2 - 2, '#aaa', 11);

      // Reward
      const reward = ch.reward || {};
      let rewardText = '';
      if (reward.gold) rewardText += `${reward.gold}g `;
      if (reward.xp) rewardText += `${reward.xp}xp`;
      Renderer.drawText(rewardText, px + pw - 30, y + 8, '#888', 10, 'right');

      // Claim button
      if (complete && !ch.claimed) {
        const btnColor = sel ? '#f0c040' : '#806020';
        Renderer.drawText('[CLAIM]', px + pw - 30, barY2 - 2, btnColor, 11, 'right');
      } else if (ch.claimed) {
        Renderer.drawText('CLAIMED', px + pw - 30, barY2 - 2, '#4a4', 10, 'right');
      }
    }

    Renderer.drawText('ENTER to claim | ESC to go back', w / 2, py + ph - 16, '#4a4a60', 10, 'center');
  }

  // ======== PETS SCREEN ========
  function updatePets() {
    const pets = GS.player?.pets || [];
    if (pets.length === 0) return;

    if (Input.actionPressed(Input.Actions.UP)) {
      _subSelected = (_subSelected - 1 + pets.length) % pets.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }
    if (Input.actionPressed(Input.Actions.DOWN)) {
      _subSelected = (_subSelected + 1) % pets.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    const wheel = Input.getWheelDelta();
    if (wheel !== 0) {
      _subSelected = (_subSelected + Math.sign(wheel) + pets.length) % pets.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    if (Input.actionPressed(Input.Actions.CONFIRM)) {
      const pet = pets[_subSelected];
      if (pet && typeof Pets !== 'undefined') {
        Pets.setActivePet(pet.id);
        if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_select');
      }
    }
  }

  function renderPets(w, h, ctx) {
    const pets = GS.player?.pets || [];
    const activePet = GS.player?.activePet;

    const pw = Math.min(w - 60, 480), ph = h - 80;
    const px = (w - pw) / 2, py = 40;
    Renderer.drawPanel(px, py, pw, ph, 'rgba(8,8,24,0.95)', '#2a2a40');

    Renderer.drawText('PET COMPANIONS', w / 2, py + 18, '#f0c040', 22, 'center', true);
    Renderer.drawText(`${pets.length} Collected | Active: ${activePet ? activePet.name : 'None'}`, w / 2, py + 40, '#888', 12, 'center');

    if (pets.length === 0) {
      Renderer.drawText('No pets collected yet.', w / 2, h / 2 - 10, '#666', 14, 'center');
      Renderer.drawText('Defeat enemies for a chance', w / 2, h / 2 + 10, '#444', 12, 'center');
      Renderer.drawText('to capture pet companions!', w / 2, h / 2 + 26, '#444', 12, 'center');
      Renderer.drawText('ESC to go back', w / 2, py + ph - 16, '#4a4a60', 10, 'center');
      return;
    }

    const listY = py + 60;
    const splitX = px + pw * 0.45;
    const itemH = 32;
    const maxShow = Math.floor((ph - 100) / itemH);
    const scrollOff = Math.max(0, _subSelected - maxShow + 3);

    // Pet list
    for (let i = scrollOff; i < pets.length && i < scrollOff + maxShow; i++) {
      const pet = pets[i];
      const sel = i === _subSelected;
      const y = listY + (i - scrollOff) * itemH;
      const isActive = activePet && activePet.id === pet.id;

      if (sel) {
        ctx.fillStyle = 'rgba(240,192,64,0.06)';
        ctx.fillRect(px + 10, y - 2, splitX - px - 20, itemH - 2);
      }

      const rarityColors = { common: '#aaa', uncommon: '#5c5', rare: '#55f', epic: '#a5f', legendary: '#fa0' };
      const color = sel ? '#f0c040' : (rarityColors[pet.rarity] || '#aaa');
      const prefix = isActive ? '\u2605 ' : '  ';
      Renderer.drawText(prefix + pet.name, px + 20, y + 2, color, 13);
      Renderer.drawText(`Lv.${pet.level}`, splitX - 30, y + 2, '#666', 10, 'right');
    }

    // Details
    ctx.strokeStyle = '#2a2a40';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(splitX, listY - 5);
    ctx.lineTo(splitX, py + ph - 35);
    ctx.stroke();

    if (_subSelected < pets.length) {
      const pet = pets[_subSelected];
      const dx = splitX + 15;
      const isActive = activePet && activePet.id === pet.id;

      const rarityColors = { common: '#aaa', uncommon: '#5c5', rare: '#55f', epic: '#a5f', legendary: '#fa0' };
      Renderer.drawText(pet.name, dx, listY, '#f0c040', 16, 'left', true);
      Renderer.drawText(`${pet.rarity.toUpperCase()} | ${pet.element}`, dx, listY + 22, rarityColors[pet.rarity] || '#aaa', 11);
      Renderer.drawText(`Level ${pet.level}  (${pet.xp}/${pet.xpToNext} XP)`, dx, listY + 40, '#aaa', 11);

      // XP bar
      const xpPct = pet.xp / Math.max(1, pet.xpToNext);
      ctx.fillStyle = '#1a1a30';
      ctx.fillRect(dx, listY + 55, 120, 6);
      ctx.fillStyle = '#f0c040';
      ctx.fillRect(dx, listY + 55, 120 * xpPct, 6);

      // Passive bonuses
      Renderer.drawText('Passive Bonuses:', dx, listY + 72, '#888', 11);
      let py2 = listY + 88;
      if (pet.passive) {
        for (const [stat, val] of Object.entries(pet.passive)) {
          Renderer.drawText(`${stat.toUpperCase()}: +${val}`, dx + 10, py2, '#6a6', 11);
          py2 += 14;
        }
      }

      // Combat bonus — user-friendly descriptions
      if (pet.combatBonus) {
        Renderer.drawText('Combat Bonus:', dx, py2 + 4, '#888', 11);
        const cb = pet.combatBonus;
        const cbDescs = {
          bonus_damage: `+${cb.amount || 5} bonus damage per hit`,
          dot: `${Math.round((cb.chance || 0.1) * 100)}% chance to inflict ${cb.element || 'poison'} (${cb.damage || 3} dmg/turn)`,
          crit_boost: `+${Math.round((cb.amount || 0.1) * 100)}% crit chance`,
          gold_bonus: `${Math.round((cb.multiplier || 1.2) * 100 - 100)}% bonus gold from battles`,
          mp_regen: `+${cb.amount || 3} MP per turn`,
          revive: `Auto-revive at ${Math.round((cb.healPercent || 0.3) * 100)}% HP (once/battle)`
        };
        Renderer.drawText(cbDescs[cb.type] || cb.type, dx + 10, py2 + 18, '#88f', 10);
      }

      // Active indicator
      if (isActive) {
        Renderer.drawText('\u2605 ACTIVE PET', dx, py2 + 40, '#f0c040', 12);
      } else {
        Renderer.drawText('ENTER to set active', dx, py2 + 40, '#666', 11);
      }
    }

    Renderer.drawText('ENTER set active | ESC to go back', w / 2, py + ph - 16, '#4a4a60', 10, 'center');
  }

  // ======== SAVE SLOT SELECTION ========
  function updateSaveSlots(mode) {
    if (Input.actionPressed(Input.Actions.UP)) {
      _subSelected = (_subSelected - 1 + 3) % 3;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }
    if (Input.actionPressed(Input.Actions.DOWN)) {
      _subSelected = (_subSelected + 1) % 3;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    if (Input.actionPressed(Input.Actions.CONFIRM)) {
      if (typeof SaveSystem !== 'undefined') {
        if (mode === 'save') {
          GS.saveSlot = _subSelected;
          SaveSystem.save(_subSelected);
          Core.addNotification(`Saved to Slot ${_subSelected + 1}!`, 2);
          if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_select');
          _subScreen = null;
        } else {
          if (SaveSystem.hasSave(_subSelected)) {
            GS.saveSlot = _subSelected;
            SaveSystem.load(_subSelected);
            _subScreen = null;
          } else {
            Core.addNotification('Empty slot!', 2);
          }
        }
      }
    }
  }

  function renderSaveSlots(w, h, mode) {
    const pw = 320, ph = 220;
    const px = (w - pw) / 2, py = (h - ph) / 2;
    Renderer.drawPanel(px, py, pw, ph, 'rgba(8,8,24,0.95)', '#2a2a40');
    Renderer.drawText(mode === 'save' ? 'SAVE GAME' : 'LOAD GAME', w / 2, py + 18, '#f0c040', 20, 'center', true);

    for (let i = 0; i < 3; i++) {
      const sel = i === _subSelected;
      const y = py + 50 + i * 50;
      const info = typeof SaveSystem !== 'undefined' ? SaveSystem.getSaveInfo(i) : null;

      if (sel) {
        const ctx = Renderer.getCtx();
        ctx.fillStyle = 'rgba(240,192,64,0.06)';
        ctx.fillRect(px + 10, y - 4, pw - 20, 44);
      }

      const color = sel ? '#f0c040' : '#aaa';
      if (info) {
        Renderer.drawText(`Slot ${i + 1}: ${info.name} Lv.${info.level}`, px + 20, y, color, 14);
        const time = info.playTime ? `${Math.floor(info.playTime / 60)}m` : '';
        Renderer.drawText(`${info.classType} | ${info.zone} | ${time}`, px + 20, y + 18, '#666', 10);
      } else {
        Renderer.drawText(`Slot ${i + 1}: Empty`, px + 20, y, sel ? '#888' : '#555', 14);
      }
    }

    Renderer.drawText('ENTER to select | ESC to go back', w / 2, py + ph - 16, '#4a4a60', 10, 'center');
  }

  // ======== PARTY MANAGEMENT ========
  function updateParty() {
    const party = GS.player?.party || [];
    if (party.length === 0) return;

    if (Input.actionPressed(Input.Actions.UP)) {
      _subSelected = (_subSelected - 1 + party.length) % party.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }
    if (Input.actionPressed(Input.Actions.DOWN)) {
      _subSelected = (_subSelected + 1) % party.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    const wheel = Input.getWheelDelta();
    if (wheel !== 0) {
      _subSelected = (_subSelected + Math.sign(wheel) + party.length) % party.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    // CONFIRM to dismiss ally
    if (Input.actionPressed(Input.Actions.CONFIRM)) {
      const ally = party[_subSelected];
      if (ally && typeof Allies !== 'undefined') {
        Allies.dismissAlly(ally.id);
        Core.addNotification(`${ally.name} left the party.`, 3);
        if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_select');
        if (_subSelected >= (GS.player.party || []).length) {
          _subSelected = Math.max(0, (GS.player.party || []).length - 1);
        }
      }
    }
  }

  function renderParty(w, h, ctx) {
    const party = GS.player?.party || [];

    const pw = Math.min(w - 60, 480), ph = h - 80;
    const px = (w - pw) / 2, py = 40;
    Renderer.drawPanel(px, py, pw, ph, 'rgba(8,8,24,0.95)', '#2a2a40');

    Renderer.drawText('PARTY ALLIES', w / 2, py + 18, '#f0c040', 22, 'center', true);
    Renderer.drawText(`${party.length}/3 Members`, w / 2, py + 40, '#888', 12, 'center');

    if (party.length === 0) {
      Renderer.drawText('No allies in party.', w / 2, h / 2 - 10, '#666', 14, 'center');
      Renderer.drawText('Talk to NPCs to recruit allies!', w / 2, h / 2 + 10, '#444', 12, 'center');
      Renderer.drawText('ESC to go back', w / 2, py + ph - 16, '#4a4a60', 10, 'center');
      return;
    }

    const listY = py + 60;
    const itemH = 44;

    for (let i = 0; i < party.length; i++) {
      const ally = party[i];
      const sel = i === _subSelected;
      const y = listY + i * itemH;

      if (sel) {
        ctx.fillStyle = 'rgba(240,192,64,0.06)';
        ctx.fillRect(px + 10, y - 2, pw - 20, itemH - 4);
      }

      const roleColors = { tank: '#48f', dps: '#f44', healer: '#4f4', support: '#ff0' };
      const color = sel ? '#f0c040' : '#ccc';
      Renderer.drawText(ally.name, px + 20, y + 2, color, 14);
      Renderer.drawText(`Lv.${ally.level} ${ally.role || ''}`, px + 20, y + 18, roleColors[ally.role] || '#888', 10);

      // HP/MP
      const hpPct = ally.stats.hp / Math.max(1, ally.stats.maxHp);
      Renderer.drawBar(px + pw - 180, y + 4, 80, 8, hpPct, '#c00', '#400');
      Renderer.drawText(`${ally.stats.hp}/${ally.stats.maxHp}`, px + pw - 90, y + 2, '#aaa', 9);

      const mpPct = ally.stats.mp / Math.max(1, ally.stats.maxMp);
      Renderer.drawBar(px + pw - 180, y + 18, 80, 6, mpPct, '#06a', '#024');
      Renderer.drawText(`${ally.stats.mp}/${ally.stats.maxMp}`, px + pw - 90, y + 16, '#88a', 9);
    }

    // Selected ally details
    if (_subSelected < party.length) {
      const ally = party[_subSelected];
      const detY = listY + party.length * itemH + 10;
      Renderer.drawText('Stats:', px + 20, detY, '#888', 11);
      Renderer.drawText(`STR:${ally.stats.str} DEF:${ally.stats.def} INT:${ally.stats.int} AGI:${ally.stats.agi} LUK:${ally.stats.luk}`,
        px + 20, detY + 16, '#aaa', 10);
      if (ally.abilities) {
        Renderer.drawText('Skills: ' + ally.abilities.map(a => a.name).join(', '), px + 20, detY + 32, '#88a', 10);
      }
    }

    Renderer.drawText('ENTER to dismiss | ESC to go back', w / 2, py + ph - 16, '#4a4a60', 10, 'center');
  }

  // ======== GAME OVER ========
  function updateGameOver(dt) {
    _titleAnim += dt;
    if (Input.actionPressed(Input.Actions.CONFIRM)) {
      Core.setState(GameStates.MENU);
      _titleSelected = 0;
    }
  }

  function renderGameOver() {
    const w = Renderer.getWidth();
    const h = Renderer.getHeight();
    const ctx = Renderer.getCtx();

    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.6);
    grad.addColorStop(0, 'rgba(40,5,5,0.95)');
    grad.addColorStop(1, 'rgba(10,0,0,0.98)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.globalAlpha = 0.3;
    Renderer.drawText('GAME OVER', w / 2 + 3, h / 2 - 27, '#000', 52, 'center', true);
    ctx.globalAlpha = 1;

    Renderer.drawText('GAME OVER', w / 2, h / 2 - 30, '#e04040', 52, 'center', true);
    Renderer.drawText('The realm has fallen into darkness.', w / 2, h / 2 + 15, '#6a4040', 14, 'center');
    Renderer.drawText('Press ENTER to return to title', w / 2, h / 2 + 50, '#4a3030', 13, 'center');
  }

  // ======== VICTORY ========
  function updateVictory(dt) {
    _titleAnim += dt;

    if (Input.actionPressed(Input.Actions.UP)) {
      _subSelected = Math.max(0, _subSelected - 1);
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }
    if (Input.actionPressed(Input.Actions.DOWN)) {
      _subSelected = Math.min(1, _subSelected + 1);
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    if (Input.actionPressed(Input.Actions.CONFIRM)) {
      if (_subSelected === 0 && typeof NewGamePlus !== 'undefined') {
        // Start NG+
        NewGamePlus.startNewGamePlus();
        Core.setState(GameStates.PLAY);
        _subSelected = 0;
      } else {
        Core.setState(GameStates.MENU);
        _titleSelected = 0;
        _subSelected = 0;
      }
    }
  }

  function renderVictory() {
    const w = Renderer.getWidth();
    const h = Renderer.getHeight();
    const ctx = Renderer.getCtx();

    const grad = ctx.createRadialGradient(w / 2, h * 0.3, 0, w / 2, h * 0.3, w * 0.7);
    grad.addColorStop(0, '#1a1808');
    grad.addColorStop(0.5, '#0e0c06');
    grad.addColorStop(1, '#060610');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Floating particles
    const rng = Utils.mulberry32(77);
    for (let i = 0; i < 30; i++) {
      const px = rng() * w;
      const py = h - (((_titleAnim * 20 + i * 35) % h));
      const a = Math.sin(_titleAnim * 1.5 + i) * 0.3 + 0.4;
      ctx.globalAlpha = a;
      ctx.fillStyle = '#f0c040';
      ctx.fillRect(px, py, 2, 2);
    }
    ctx.globalAlpha = 1;

    const pulse = Math.sin(GS.time * 2) * 3;

    ctx.globalAlpha = 0.3;
    Renderer.drawText('THE REALM IS SAVED', w / 2 + 2, h * 0.2 + pulse + 2, '#000', 44, 'center', true);
    ctx.globalAlpha = 1;

    Renderer.drawText('THE REALM IS SAVED', w / 2, h * 0.2 + pulse, '#f0c040', 44, 'center', true);

    ctx.strokeStyle = '#806020';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 140, h * 0.2 + 25);
    ctx.lineTo(w / 2 + 140, h * 0.2 + 25);
    ctx.stroke();

    Renderer.drawText('You have defeated the Crystal Dragon', w / 2, h * 0.3, '#c0c0d0', 16, 'center');
    Renderer.drawText('and cleansed the corrupted crystals.', w / 2, h * 0.3 + 24, '#c0c0d0', 16, 'center');

    // Stats
    if (GS.player) {
      const stats = GS.player.stats;
      const mins = Math.floor((GS.playTime || 0) / 60);
      const achCount = GS.achievements ? GS.achievements.length : 0;
      const statY = h * 0.42;

      Renderer.drawPanel(w / 2 - 160, statY - 10, 320, 130, 'rgba(16,16,32,0.8)', '#2a2a40');
      Renderer.drawText('FINAL STATS', w / 2, statY, '#f0c040', 14, 'center', true);
      Renderer.drawText(`Level: ${stats.level}`, w / 2, statY + 22, '#c0c0d0', 14, 'center');
      Renderer.drawText(`Bosses Defeated: ${GS.defeatedBosses ? GS.defeatedBosses.length : 0}`, w / 2, statY + 40, '#c0c0d0', 14, 'center');
      Renderer.drawText(`Achievements: ${achCount}`, w / 2, statY + 58, '#c0c0d0', 14, 'center');
      Renderer.drawText(`Play Time: ${mins} minutes`, w / 2, statY + 76, '#c0c0d0', 14, 'center');
      Renderer.drawText(`Gold: ${GS.player.gold || 0}`, w / 2, statY + 94, '#c0c0d0', 14, 'center');
    }

    // NG+ option
    const optY = h * 0.78;
    const opts = ['Start New Game+', 'Return to Title'];
    for (let i = 0; i < opts.length; i++) {
      const sel = i === _subSelected;
      Renderer.drawText((sel ? '> ' : '  ') + opts[i], w / 2, optY + i * 30, sel ? '#f0c040' : '#888', sel ? 18 : 16, 'center', sel);
    }

    Renderer.drawText('Thank you for playing Realm Engine!', w / 2, h * 0.93, '#3a3a50', 12, 'center');
  }

  // ======== RENDER ========
  function render() {
    switch (GS.state) {
      case GameStates.MENU: renderTitle(); break;
      case GameStates.CLASS_SELECT: renderClassSelect(); break;
      case GameStates.PAUSED: renderPause(); break;
      case GameStates.GAME_OVER: renderGameOver(); break;
      case GameStates.VICTORY: renderVictory(); break;
    }
  }

  return { update, render };
})();
