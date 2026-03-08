// ui/menus.js — Title screen, pause, settings, game over, class select, victory

const Menus = (() => {
  let _titleSelected = 0;
  let _pauseSelected = 0;
  let _classSelected = 0;
  let _settingsSelected = 0;
  let _playerName = '';
  let _namingMode = false;
  let _titleAnim = 0;

  const titleOptions = ['New Game', 'Continue', 'Settings'];
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
        case 'Settings':
          _settingsSelected = 0;
          // Inline settings for title
          GS.settings.showFPS = !GS.settings.showFPS;
          Core.addNotification(`FPS Display: ${GS.settings.showFPS ? 'ON' : 'OFF'}`, 2);
          break;
      }
    }
  }

  function renderTitle() {
    const w = Renderer.getWidth();
    const h = Renderer.getHeight();

    // Background
    const ctx = Renderer.getCtx();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0a0a1e');
    grad.addColorStop(0.5, '#1a1a3e');
    grad.addColorStop(1, '#0a0a1e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Stars
    const rng = Utils.mulberry32(42);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 60; i++) {
      const sx = rng() * w;
      const sy = rng() * h * 0.6;
      const size = rng() * 2;
      const twinkle = Math.sin(_titleAnim * 2 + i) * 0.5 + 0.5;
      ctx.globalAlpha = twinkle * 0.8;
      ctx.fillRect(sx, sy, size, size);
    }
    ctx.globalAlpha = 1;

    // Title
    const titleY = h * 0.25;
    const pulse = Math.sin(_titleAnim * 1.5) * 5;
    Renderer.drawText('REALM ENGINE', w / 2, titleY + pulse, '#ffcc00', 48, 'center', true);
    Renderer.drawText('A Browser RPG Adventure', w / 2, titleY + 55, '#888', 16, 'center');

    // Menu options
    const menuY = h * 0.55;
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
    const classes = Classes.getAllClasses();

    Renderer.drawPanel(40, 40, w - 80, h - 80, 'rgba(0,0,0,0.92)', '#888');
    Renderer.drawText('Choose Your Class', w / 2, 60, '#ffcc00', 24, 'center');

    if (_namingMode) {
      Renderer.drawText('Enter your name:', w / 2, h / 2 - 30, '#fff', 18, 'center');
      const nameDisplay = _playerName + (Math.floor(GS.time * 2) % 2 === 0 ? '_' : ' ');
      Renderer.drawText(nameDisplay, w / 2, h / 2 + 10, '#ffcc00', 24, 'center');
      Renderer.drawText('ENTER to confirm | ESC to go back', w / 2, h / 2 + 50, '#666', 12, 'center');
      return;
    }

    for (let i = 0; i < classes.length; i++) {
      const cls = Classes.getClass(classes[i]);
      const sel = i === _classSelected;
      const y = 120 + i * 140;

      // Card
      if (sel) {
        Renderer.drawPanel(60, y - 5, w - 120, 130, 'rgba(50,50,80,0.8)', '#ffcc00');
      } else {
        Renderer.drawPanel(60, y - 5, w - 120, 130, 'rgba(30,30,40,0.6)', '#555');
      }

      // Portrait
      const portrait = SpriteGen.cache.portraits[classes[i]];
      if (portrait) {
        Renderer.getCtx().drawImage(portrait, 80, y + 10, 64, 64);
      }

      // Info
      const color = sel ? '#fff' : '#aaa';
      Renderer.drawText(cls.name, 170, y + 10, sel ? '#ffcc00' : '#ccc', 20);
      Renderer.drawText(cls.desc, 170, y + 35, color, 12);

      // Base stats
      const stats = cls.baseStats;
      Renderer.drawText(`HP:${stats.hp}  MP:${stats.mp}  STR:${stats.str}  DEF:${stats.def}  INT:${stats.int}  AGI:${stats.agi}  LUK:${stats.luk}`, 170, y + 58, '#888', 11);

      // Starting skills
      const skillNames = cls.startSkills.map(id => {
        const s = Abilities.getSkill(id);
        return s ? s.name : id;
      }).join(', ');
      Renderer.drawText(`Starting Skills: ${skillNames}`, 170, y + 78, '#888', 11);
    }

    Renderer.drawText('UP/DOWN to select | ENTER to choose | ESC to go back', w / 2, h - 60, '#555', 12, 'center');
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

    // Load starting zone
    WorldManager.loadZone('eldergrove');

    // Auto-accept main quest
    Quests.acceptQuest('main_story');

    Core.setState(GameStates.PLAY);
    Core.addNotification(`Welcome to the Realm, ${name}!`, 4);

    if (typeof AudioManager !== 'undefined') {
      AudioManager.playMusic('town');
    }
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

    // Dim background
    Renderer.drawRect(0, 0, w, h, 'rgba(0,0,0,0.6)');

    // Panel
    const pw = 300, ph = pauseOptions.length * 40 + 60;
    const px = (w - pw) / 2, py = (h - ph) / 2;
    Renderer.drawPanel(px, py, pw, ph, 'rgba(0,0,0,0.9)', '#888');
    Renderer.drawText('PAUSED', w / 2, py + 15, '#ffcc00', 22, 'center');

    for (let i = 0; i < pauseOptions.length; i++) {
      const sel = i === _pauseSelected;
      const color = sel ? '#ffcc00' : '#aaa';
      const prefix = sel ? '> ' : '  ';
      Renderer.drawText(prefix + pauseOptions[i], px + 30, py + 50 + i * 36, color, 16);
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
    Renderer.drawRect(0, 0, w, h, 'rgba(20,0,0,0.9)');
    Renderer.drawText('GAME OVER', w / 2, h / 2 - 30, '#ff4444', 48, 'center', true);
    Renderer.drawText('Press ENTER to return to title', w / 2, h / 2 + 30, '#888', 16, 'center');
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
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1a1a0a');
    grad.addColorStop(0.5, '#2a2a1a');
    grad.addColorStop(1, '#1a1a0a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const pulse = Math.sin(GS.time * 2) * 5;
    Renderer.drawText('THE REALM IS SAVED!', w / 2, h * 0.3 + pulse, '#ffcc00', 42, 'center', true);
    Renderer.drawText('You have defeated the Crystal Dragon', w / 2, h * 0.3 + 50, '#fff', 18, 'center');
    Renderer.drawText('and cleansed the corrupted crystals.', w / 2, h * 0.3 + 75, '#fff', 18, 'center');

    // Stats
    if (GS.player) {
      const stats = GS.player.stats;
      const mins = Math.floor(GS.playTime / 60);
      Renderer.drawText(`Final Level: ${stats.level}`, w / 2, h * 0.55, '#aaa', 16, 'center');
      Renderer.drawText(`Enemies Defeated: ${GS.defeatedBosses ? GS.defeatedBosses.length : 0} bosses`, w / 2, h * 0.55 + 30, '#aaa', 16, 'center');
      Renderer.drawText(`Play Time: ${mins} minutes`, w / 2, h * 0.55 + 60, '#aaa', 16, 'center');
    }

    Renderer.drawText('Press ENTER to return to title', w / 2, h * 0.8, '#666', 14, 'center');
    Renderer.drawText('Thank you for playing Realm Engine!', w / 2, h * 0.85, '#555', 12, 'center');
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
