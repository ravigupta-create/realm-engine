// sprites/animations.js — Animation frame definitions and controller

const Animations = (() => {
  const defs = {
    idle: { frames: [0], speed: 0 },
    walk: { frames: [0, 1, 2, 3], speed: 8 },
    attack: { frames: [0, 1, 2, 1], speed: 12, oneShot: true },
    hurt: { frames: [0, 1, 0], speed: 10, oneShot: true },
    death: { frames: [0, 1, 2, 3], speed: 6, oneShot: true },
    cast: { frames: [0, 1, 2, 1, 0], speed: 10, oneShot: true },
    dodge: { frames: [0, 1, 0], speed: 12, oneShot: true },
    block: { frames: [0, 1, 1, 0], speed: 8, oneShot: true }
  };

  function createAnimState(animName) {
    return {
      name: animName || 'idle',
      frame: 0,
      timer: 0,
      done: false
    };
  }

  function update(animState, dt) {
    const def = defs[animState.name];
    if (!def || def.speed === 0) return;
    if (animState.done) return;

    animState.timer += dt * def.speed;
    if (animState.timer >= 1) {
      animState.timer -= 1;
      animState.frame++;
      if (animState.frame >= def.frames.length) {
        if (def.oneShot) {
          animState.frame = def.frames.length - 1;
          animState.done = true;
        } else {
          animState.frame = 0;
        }
      }
    }
  }

  function getFrame(animState) {
    const def = defs[animState.name];
    if (!def) return 0;
    return def.frames[animState.frame] || 0;
  }

  function play(animState, animName) {
    if (animState.name === animName && !animState.done) return;
    animState.name = animName;
    animState.frame = 0;
    animState.timer = 0;
    animState.done = false;
  }

  return { defs, createAnimState, update, getFrame, play };
})();
