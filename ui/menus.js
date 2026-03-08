// ui/menus.js — Title screen, pause, settings, game over, class select, victory

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

  const titleOptions = ['New Game', 'Continue', 'Enter Code', 'Settings'];
  const pauseOptions = ['Resume', 'Inventory', 'Quest Log', 'Settings', 'Save Game', 'Quit to Title'];

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

    // Code entry mode
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
            if (SaveSystem.hasSave()) {
              SaveSystem.load();
              Core.setState(GameStates.PLAY);
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
          _settingsSelected = 0;
          GS.settings.showFPS = !GS.settings.showFPS;
          Core.addNotification(`FPS Display: ${GS.settings.showFPS ? 'ON' : 'OFF'}`, 2);
          break;
      }
    }
  }

  function processCode(code) {
    if (code === 'srg2') {
      _cheatActive = true;
      Core.addNotification('Code accepted! Max mode activated!', 5);
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('levelup');
    } else {
      Core.addNotification('Invalid code.', 2);
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('hit');
    }
  }

  function renderTitle() {
    const w = Renderer.getWidth();
    const h = Renderer.getHeight();

    // Background gradient
    const ctx = Renderer.getCtx();
    const grad = ctx.createRadialGradient(w / 2, h * 0.35, 0, w / 2, h * 0.35, w * 0.8);
    grad.addColorStop(0, '#12122a');
    grad.addColorStop(0.5, '#0a0a1e');
    grad.addColorStop(1, '#060610');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle vignette
    const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.9);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    // Stars (more of them, varied sizes)
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

    // Decorative particles drifting up
    for (let i = 0; i < 12; i++) {
      const px = w * 0.3 + rng() * w * 0.4;
      const py = h - (((_titleAnim * 15 + i * 50) % h));
      const a = Math.sin(_titleAnim + i) * 0.3 + 0.3;
      ctx.globalAlpha = a;
      ctx.fillStyle = '#f0c040';
      ctx.fillRect(px, py, 2, 2);
    }
    ctx.globalAlpha = 1;

    // Title with shadow
    const titleY = h * 0.22;
    const pulse = Math.sin(_titleAnim * 1.5) * 3;

    // Title shadow
    ctx.globalAlpha = 0.3;
    Renderer.drawText('REALM ENGINE', w / 2 + 2, titleY + pulse + 2, '#000', 52, 'center', true);
    ctx.globalAlpha = 1;

    // Main title
    Renderer.drawText('REALM ENGINE', w / 2, titleY + pulse, '#f0c040', 52, 'center', true);

    // Subtitle
    Renderer.drawText('A Browser RPG Adventure', w / 2, titleY + 58, '#6a6a80', 14, 'center');

    // Decorative line
    ctx.strokeStyle = '#3a3040';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 120, titleY + 78);
    ctx.lineTo(w / 2 + 120, titleY + 78);
    ctx.stroke();
    // Diamond center
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
    Renderer.drawText('Arrow Keys to navigate | Enter to select', w / 2, h - 60, '#444', 12, 'center');
    Renderer.drawText('100% Client-Side | Zero External Assets | Free Forever', w / 2, h - 40, '#333', 10, 'center');
  }

  // ======== CLASS SELECT ========
  function updateClassSelect(dt) {
    const classes = Classes.getAllClasses();

    if (_namingMode) {
      // Listen for key presses for name input
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

    // Background
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
    grad.addColorStop(0, '#0e0e22');
    grad.addColorStop(1, '#060610');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Main panel
    Renderer.drawPanel(30, 20, w - 60, h - 40, 'rgba(8,8,24,0.95)', '#2a2a40');

    // Header
    Renderer.drawText('Choose Your Class', w / 2, 42, '#f0c040', 24, 'center', true);

    // Decorative line under header
    ctx.strokeStyle = '#2a2a40';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 62);
    ctx.lineTo(w - 60, 62);
    ctx.stroke();

    if (_namingMode) {
      // Name entry panel
      Renderer.drawPanel(w / 2 - 200, h / 2 - 70, 400, 140, 'rgba(16,16,40,0.95)', '#f0c040');
      Renderer.drawText('Enter Your Name', w / 2, h / 2 - 45, '#f0c040', 20, 'center', true);
      const nameDisplay = _playerName + (Math.floor(GS.time * 2) % 2 === 0 ? '_' : ' ');
      Renderer.drawText(nameDisplay || '_', w / 2, h / 2, '#fff', 28, 'center');
      Renderer.drawText('ENTER to confirm  |  ESC to go back', w / 2, h / 2 + 40, '#6a6a80', 11, 'center');
      return;
    }

    // Scroll offset: keep selected class centered in view
    const cardH = 72;
    const listH = h - 130;
    const totalH = classes.length * cardH;
    const maxScroll = Math.max(0, totalH - listH);
    const targetScroll = Math.max(0, Math.min(maxScroll, _classSelected * cardH - listH / 2 + cardH / 2));

    // Clip area
    ctx.save();
    ctx.beginPath();
    ctx.rect(30, 70, w - 60, listH);
    ctx.clip();

    for (let i = 0; i < classes.length; i++) {
      const cls = Classes.getClass(classes[i]);
      const sel = i === _classSelected;
      const y = 75 + i * cardH - targetScroll;

      // Skip off-screen
      if (y + cardH < 70 || y > h - 55) continue;

      const cardX = 50;
      const cardW = w - 100;

      // Card background
      if (sel) {
        // Selected glow
        ctx.fillStyle = 'rgba(240,192,64,0.06)';
        ctx.fillRect(cardX - 2, y - 2, cardW + 4, cardH - 4);
        Renderer.drawPanel(cardX, y, cardW, cardH - 8, 'rgba(30,30,60,0.9)', '#f0c040');
      } else {
        Renderer.drawPanel(cardX, y, cardW, cardH - 8, 'rgba(16,16,32,0.7)', '#1e1e30');
      }

      // Portrait
      const portrait = SpriteGen.cache.portraits[classes[i]];
      if (portrait) {
        ctx.drawImage(portrait, cardX + 10, y + 8, 48, 48);
      }

      // Class name
      Renderer.drawText(cls.name, cardX + 72, y + 8, sel ? '#f0c040' : '#999', sel ? 18 : 16, 'left', sel);

      // Description
      Renderer.drawText(cls.desc, cardX + 72, y + 28, sel ? '#c0c0d0' : '#666', 11);

      // Stats bar
      const stats = cls.baseStats;
      Renderer.drawText(`HP:${stats.hp}  MP:${stats.mp}  STR:${stats.str}  DEF:${stats.def}  INT:${stats.int}  AGI:${stats.agi}  LUK:${stats.luk}`, cardX + 72, y + 44, '#4a4a60', 10);
    }

    ctx.restore();

    // Scroll indicators
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

    // Footer
    Renderer.drawText('\u2191\u2193 Select  |  ENTER Choose  |  ESC Back', w / 2, h - 38, '#4a4a60', 11, 'center');
  }

  function startNewGame(classType, name) {
    // Reset game state
    GS.quests = [];
    GS.exploredTiles = {};
    GS.entities = [];
    GS.defeatedBosses = [];
    GS.achievements = [];
    GS.gameTime = 360; // Start at 6:00 AM
    GS.playTime = 0;
    GS.notifications = [];

    // Create player
    GS.player = Classes.createPlayer(classType, name);
    GS.entities.push(GS.player);

    // Apply cheat code if active
    if (_cheatActive) {
      applyMaxMode(GS.player);
    }

    // Load starting zone
    WorldManager.loadZone('eldergrove');

    // Auto-accept main quest
    Quests.acceptQuest('main_story');

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

    // Max level and stats
    s.level = 30;
    s.xp = 0;
    s.xpToNext = 99999;
    s.gold = 99999;
    s.maxHp = 999; s.hp = 999;
    s.maxMp = 999; s.mp = 999;
    s.str = 99; s.def = 99; s.int = 99; s.agi = 99; s.luk = 99;

    // All skills for the class
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

    // Legendary equipment in every slot
    const slots = ['weapon', 'armor', 'helmet', 'boots', 'ring', 'amulet'];
    for (const slot of slots) {
      const item = Items.generateItem(30, 'legendary');
      item.slot = slot;
      player.equipment[slot] = item;
    }

    // Fill inventory with max potions + materials
    player.items = [];
    for (let i = 0; i < 5; i++) {
      player.items.push({ id: Utils.genId(), name: 'Full Elixir', type: 'consumable', effect: 'heal_both', value: 9999, rarity: 'legendary', desc: 'Fully restores HP and MP.' });
    }
    for (let i = 0; i < 3; i++) {
      player.items.push({ id: Utils.genId(), name: 'Revive Potion', type: 'consumable', effect: 'revive', value: 50, rarity: 'rare', desc: 'Revive a fallen ally at 50% HP.' });
    }
    player.items.push({ id: 'fishing_rod', name: 'Fishing Rod', type: 'consumable', effect: 'none', value: 0, rarity: 'uncommon', desc: 'Used for fishing at water spots.' });
    player.fishingUnlocked = true;

    // All pets
    if (typeof Pets !== 'undefined') {
      player.pets = [];
      for (const [id, def] of Object.entries(Pets.petDefs)) {
        const pet = {
          id, name: def.name, rarity: def.rarity, element: def.element,
          level: 10, xp: 0, xpToNext: 500,
          passive: { ...def.passive }, combatBonus: { ...def.combatBonus }
        };
        // Boost passive stats for level 10
        for (const k of Object.keys(pet.passive)) {
          pet.passive[k] = Math.floor(pet.passive[k] * 2.5);
        }
        player.pets.push(pet);
      }
      player.activePet = player.pets[player.pets.length - 1]; // Void Dragonling
    }

    // Full party
    if (typeof Allies !== 'undefined') {
      player.party = [];
      const topAllies = ['healer_willow', 'shadow_blade', 'fire_mage'];
      for (const aId of topAllies) {
        const ally = Allies.recruitAlly(aId);
        if (ally) {
          // Max ally stats
          ally.level = 30;
          ally.stats.hp = 500; ally.stats.maxHp = 500;
          ally.stats.mp = 200; ally.stats.maxMp = 200;
          ally.stats.str = 50; ally.stats.def = 40;
          ally.stats.int = 50; ally.stats.agi = 40;
        }
      }
    }

    // Mark cheat on save data
    GS.cheatActive = true;
  }

  // ======== PAUSE MENU ========
  function updatePause(dt) {
    if (Input.actionPressed(Input.Actions.UP)) {
      _pauseSelected = (_pauseSelected - 1 + pauseOptions.length) % pauseOptions.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }
    if (Input.actionPressed(Input.Actions.DOWN)) {
      _pauseSelected = (_pauseSelected + 1) % pauseOptions.length;
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
        case 'Settings':
          GS.settings.showFPS = !GS.settings.showFPS;
          Core.addNotification(`FPS: ${GS.settings.showFPS ? 'ON' : 'OFF'}`, 2);
          break;
        case 'Save Game':
          if (typeof SaveSystem !== 'undefined') {
            SaveSystem.save();
            Core.addNotification('Game saved!', 2);
          }
          break;
        case 'Quit to Title':
          Core.setState(GameStates.MENU);
          _titleSelected = 0;
          break;
      }
    }

    if (Input.actionPressed(Input.Actions.CANCEL) || Input.actionPressed(Input.Actions.MENU)) {
      Core.setState(GameStates.PLAY);
    }
  }

  function renderPause() {
    const w = Renderer.getWidth();
    const h = Renderer.getHeight();
    const ctx = Renderer.getCtx();

    // Blurred dim background
    Renderer.drawRect(0, 0, w, h, 'rgba(4,4,12,0.7)');

    // Panel
    const pw = 320, ph = pauseOptions.length * 38 + 70;
    const px = (w - pw) / 2, py = (h - ph) / 2;
    Renderer.drawPanel(px, py, pw, ph, 'rgba(8,8,24,0.95)', '#2a2a40');

    // Header
    Renderer.drawText('PAUSED', w / 2, py + 18, '#f0c040', 22, 'center', true);

    // Divider
    ctx.strokeStyle = '#2a2a40';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 20, py + 40);
    ctx.lineTo(px + pw - 20, py + 40);
    ctx.stroke();

    for (let i = 0; i < pauseOptions.length; i++) {
      const sel = i === _pauseSelected;
      const y = py + 52 + i * 36;

      if (sel) {
        // Highlight bar
        ctx.fillStyle = 'rgba(240,192,64,0.08)';
        ctx.fillRect(px + 10, y - 4, pw - 20, 28);
      }

      const color = sel ? '#f0c040' : '#7a7a90';
      const prefix = sel ? '\u25B6 ' : '   ';
      Renderer.drawText(prefix + pauseOptions[i], px + 30, y, color, sel ? 16 : 15);
    }
  }

  // ======== GAME OVER ========
  function updateGameOver(dt) {
    if (Input.actionPressed(Input.Actions.CONFIRM)) {
      Core.setState(GameStates.MENU);
      _titleSelected = 0;
    }
  }

  function renderGameOver() {
    const w = Renderer.getWidth();
    const h = Renderer.getHeight();
    const ctx = Renderer.getCtx();

    // Dark red gradient
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.6);
    grad.addColorStop(0, 'rgba(40,5,5,0.95)');
    grad.addColorStop(1, 'rgba(10,0,0,0.98)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Shadow text
    ctx.globalAlpha = 0.3;
    Renderer.drawText('GAME OVER', w / 2 + 3, h / 2 - 27, '#000', 52, 'center', true);
    ctx.globalAlpha = 1;

    Renderer.drawText('GAME OVER', w / 2, h / 2 - 30, '#e04040', 52, 'center', true);
    Renderer.drawText('The realm has fallen into darkness.', w / 2, h / 2 + 15, '#6a4040', 14, 'center');
    Renderer.drawText('Press ENTER to return to title', w / 2, h / 2 + 50, '#4a3030', 13, 'center');
  }

  // ======== VICTORY ========
  function updateVictory(dt) {
    if (Input.actionPressed(Input.Actions.CONFIRM)) {
      Core.setState(GameStates.MENU);
      _titleSelected = 0;
    }
  }

  function renderVictory() {
    const w = Renderer.getWidth();
    const h = Renderer.getHeight();
    const ctx = Renderer.getCtx();

    // Golden radial gradient
    const grad = ctx.createRadialGradient(w / 2, h * 0.3, 0, w / 2, h * 0.3, w * 0.7);
    grad.addColorStop(0, '#1a1808');
    grad.addColorStop(0.5, '#0e0c06');
    grad.addColorStop(1, '#060610');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Floating golden particles
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

    // Shadow
    ctx.globalAlpha = 0.3;
    Renderer.drawText('THE REALM IS SAVED', w / 2 + 2, h * 0.25 + pulse + 2, '#000', 44, 'center', true);
    ctx.globalAlpha = 1;

    Renderer.drawText('THE REALM IS SAVED', w / 2, h * 0.25 + pulse, '#f0c040', 44, 'center', true);

    // Decorative line
    ctx.strokeStyle = '#806020';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 140, h * 0.25 + 25);
    ctx.lineTo(w / 2 + 140, h * 0.25 + 25);
    ctx.stroke();

    Renderer.drawText('You have defeated the Crystal Dragon', w / 2, h * 0.35, '#c0c0d0', 16, 'center');
    Renderer.drawText('and cleansed the corrupted crystals.', w / 2, h * 0.35 + 24, '#c0c0d0', 16, 'center');

    // Stats panel
    if (GS.player) {
      const stats = GS.player.stats;
      const mins = Math.floor((GS.playTime || 0) / 60);
      const statY = h * 0.5;

      Renderer.drawPanel(w / 2 - 160, statY - 10, 320, 110, 'rgba(16,16,32,0.8)', '#2a2a40');
      Renderer.drawText('FINAL STATS', w / 2, statY, '#f0c040', 14, 'center', true);
      Renderer.drawText(`Level: ${stats.level}`, w / 2, statY + 25, '#c0c0d0', 14, 'center');
      Renderer.drawText(`Bosses Defeated: ${GS.defeatedBosses ? GS.defeatedBosses.length : 0}`, w / 2, statY + 45, '#c0c0d0', 14, 'center');
      Renderer.drawText(`Play Time: ${mins} minutes`, w / 2, statY + 65, '#c0c0d0', 14, 'center');
      Renderer.drawText(`Gold Earned: ${stats.gold}`, w / 2, statY + 85, '#c0c0d0', 14, 'center');
    }

    Renderer.drawText('Press ENTER to return to title', w / 2, h * 0.82, '#4a4a60', 13, 'center');
    Renderer.drawText('Thank you for playing Realm Engine!', w / 2, h * 0.87, '#3a3a50', 12, 'center');
  }

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
