// engine/input.js — Keyboard, mouse, touch input manager

const Input = (() => {
  const keys = {};
  const justPressed = {};
  const justReleased = {};
  const mouse = { x: 0, y: 0, clicked: false, down: false };
  const touch = { active: false, x: 0, y: 0, dx: 0, dy: 0 };

  // Virtual D-pad for touch
  let _touchStartX = 0, _touchStartY = 0;
  let _canvas = null;

  const Actions = {
    UP: 'UP', DOWN: 'DOWN', LEFT: 'LEFT', RIGHT: 'RIGHT',
    CONFIRM: 'CONFIRM', CANCEL: 'CANCEL', MENU: 'MENU',
    INVENTORY: 'INVENTORY', MAP: 'MAP', INTERACT: 'INTERACT',
    QUEST_LOG: 'QUEST_LOG',
    SLOT1: 'SLOT1', SLOT2: 'SLOT2', SLOT3: 'SLOT3', SLOT4: 'SLOT4'
  };

  const keyBindings = {
    'ArrowUp': Actions.UP, 'KeyW': Actions.UP,
    'ArrowDown': Actions.DOWN, 'KeyS': Actions.DOWN,
    'ArrowLeft': Actions.LEFT, 'KeyA': Actions.LEFT,
    'ArrowRight': Actions.RIGHT, 'KeyD': Actions.RIGHT,
    'Enter': Actions.CONFIRM, 'Space': Actions.CONFIRM,
    'Escape': Actions.CANCEL, 'Backspace': Actions.CANCEL,
    'KeyP': Actions.MENU,
    'KeyI': Actions.INVENTORY,
    'KeyM': Actions.MAP,
    'KeyE': Actions.INTERACT,
    'KeyQ': Actions.QUEST_LOG,
    'Digit1': Actions.SLOT1, 'Digit2': Actions.SLOT2,
    'Digit3': Actions.SLOT3, 'Digit4': Actions.SLOT4
  };

  function actionHeld(action) {
    for (const [code, act] of Object.entries(keyBindings)) {
      if (act === action && keys[code]) return true;
    }
    // Touch virtual D-pad
    if (touch.active) {
      const threshold = 20;
      if (action === Actions.UP && touch.dy < -threshold) return true;
      if (action === Actions.DOWN && touch.dy > threshold) return true;
      if (action === Actions.LEFT && touch.dx < -threshold) return true;
      if (action === Actions.RIGHT && touch.dx > threshold) return true;
    }
    return false;
  }

  function actionPressed(action) {
    for (const [code, act] of Object.entries(keyBindings)) {
      if (act === action && justPressed[code]) return true;
    }
    return false;
  }

  function anyActionPressed() {
    return Object.keys(justPressed).length > 0 || mouse.clicked;
  }

  function getMovement() {
    let dx = 0, dy = 0;
    if (actionHeld(Actions.LEFT)) dx -= 1;
    if (actionHeld(Actions.RIGHT)) dx += 1;
    if (actionHeld(Actions.UP)) dy -= 1;
    if (actionHeld(Actions.DOWN)) dy += 1;
    // Normalize diagonal
    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }
    return { x: dx, y: dy };
  }

  function init(canvas) {
    _canvas = canvas;

    window.addEventListener('keydown', (e) => {
      if (!keys[e.code]) {
        justPressed[e.code] = true;
      }
      keys[e.code] = true;
      // Prevent scrolling with arrow keys/space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      keys[e.code] = false;
      justReleased[e.code] = true;
    });

    // Mouse
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
      mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
    });

    canvas.addEventListener('mousedown', (e) => {
      mouse.down = true;
      mouse.clicked = true;
    });

    canvas.addEventListener('mouseup', () => {
      mouse.down = false;
    });

    // Touch
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      _touchStartX = t.clientX;
      _touchStartY = t.clientY;
      touch.active = true;
      touch.dx = 0;
      touch.dy = 0;
      mouse.x = (t.clientX - rect.left) * (canvas.width / rect.width);
      mouse.y = (t.clientY - rect.top) * (canvas.height / rect.height);
      mouse.clicked = true;
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      touch.dx = t.clientX - _touchStartX;
      touch.dy = t.clientY - _touchStartY;
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      touch.active = false;
      touch.dx = 0;
      touch.dy = 0;
    }, { passive: false });
  }

  // Call at end of frame to clear one-shot flags
  function endFrame() {
    for (const k in justPressed) delete justPressed[k];
    for (const k in justReleased) delete justReleased[k];
    mouse.clicked = false;
  }

  return {
    init, endFrame, keys, justPressed, mouse, touch,
    Actions, actionHeld, actionPressed, anyActionPressed, getMovement
  };
})();
