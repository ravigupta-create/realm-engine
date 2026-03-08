// engine/core.js — Game loop, global state, delta time

const GameStates = {
  LOADING: 'LOADING',
  MENU: 'MENU',
  PLAY: 'PLAY',
  COMBAT: 'COMBAT',
  DIALOGUE: 'DIALOGUE',
  INVENTORY: 'INVENTORY',
  QUEST_LOG: 'QUEST_LOG',
  GAME_OVER: 'GAME_OVER',
  VICTORY: 'VICTORY',
  PAUSED: 'PAUSED',
  CLASS_SELECT: 'CLASS_SELECT'
};

// Global State — single source of truth
const GS = {
  state: GameStates.LOADING,
  prevState: null,
  dt: 0,
  time: 0,
  fps: 0,
  frameCount: 0,

  // Player
  player: null,

  // World
  currentZone: null,
  zones: {},
  exploredTiles: {},

  // Camera
  camera: { x: 0, y: 0, targetX: 0, targetY: 0, zoom: 1 },

  // Combat
  combat: null,

  // UI
  dialogue: null,
  notifications: [],
  selectedMenuItem: 0,

  // Settings
  settings: {
    musicVolume: 0.3,
    sfxVolume: 0.5,
    showFPS: false,
    touchControls: true
  },

  // Game progress
  quests: [],
  achievements: [],
  defeatedBosses: [],
  gameTime: 0,      // in-game seconds
  playTime: 0,      // real seconds played
  saveSlot: 0,
  ngPlus: 0,
  difficulty: 'normal',

  // Entity system
  entities: [],
  nextEntityId: 1
};

const Core = (() => {
  let _lastTime = 0;
  let _running = false;
  let _fpsTimer = 0;
  let _fpsCount = 0;
  let _initCallbacks = [];
  let _updateCallbacks = [];
  let _renderCallbacks = [];

  function onInit(fn) { _initCallbacks.push(fn); }
  function onUpdate(fn) { _updateCallbacks.push(fn); }
  function onRender(fn) { _renderCallbacks.push(fn); }

  function setState(newState) {
    GS.prevState = GS.state;
    GS.state = newState;
  }

  function revertState() {
    if (GS.prevState) {
      GS.state = GS.prevState;
      GS.prevState = null;
    }
  }

  function loop(timestamp) {
    if (!_running) return;

    const dt = Math.min((timestamp - _lastTime) / 1000, 0.05); // cap at 50ms
    _lastTime = timestamp;
    GS.dt = dt;
    GS.time = timestamp / 1000;
    GS.frameCount++;

    // FPS counter
    _fpsTimer += dt;
    _fpsCount++;
    if (_fpsTimer >= 1) {
      GS.fps = _fpsCount;
      _fpsCount = 0;
      _fpsTimer -= 1;
    }

    // Track play time
    if (GS.state === GameStates.PLAY || GS.state === GameStates.COMBAT) {
      GS.playTime += dt;
      GS.gameTime += dt * 60; // 1 real second = 1 game minute

      // Periodic time-based achievement checks (every ~60 frames)
      if (GS.frameCount % 60 === 0 && typeof Achievements !== 'undefined') {
        if (GS.playTime >= 3600) Achievements.unlock('play_1hr');
        if (GS.playTime >= 18000) Achievements.unlock('play_5hr');
      }
    }

    // Update
    try {
      for (const fn of _updateCallbacks) fn(dt);
    } catch (e) {
      console.error('Update error:', e);
    }

    // Render
    try {
      for (const fn of _renderCallbacks) fn(dt);
    } catch (e) {
      console.error('Render error:', e);
    }

    requestAnimationFrame(loop);
  }

  async function init() {
    for (const fn of _initCallbacks) await fn();
    _running = true;
    _lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function stop() {
    _running = false;
  }

  function addNotification(text, duration) {
    GS.notifications.push({
      text,
      timer: duration || 3,
      alpha: 1
    });
  }

  return { init, stop, setState, revertState, onInit, onUpdate, onRender, addNotification };
})();
