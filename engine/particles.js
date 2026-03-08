// engine/particles.js — Object-pooled particle system

const Particles = (() => {
  const POOL_SIZE = 500;
  const pool = [];
  let _activeCount = 0;

  // Pre-allocate pool
  function init() {
    for (let i = 0; i < POOL_SIZE; i++) {
      pool.push({
        active: false,
        x: 0, y: 0, vx: 0, vy: 0,
        life: 0, maxLife: 0,
        size: 2, color: '#fff',
        alpha: 1, gravity: 0,
        shrink: false
      });
    }
  }

  function getParticle() {
    for (let i = 0; i < POOL_SIZE; i++) {
      if (!pool[i].active) return pool[i];
    }
    return null; // Pool exhausted
  }

  function emit(type, x, y, count) {
    const config = emitterConfigs[type] || emitterConfigs.hit;
    count = count || config.count || 10;

    for (let i = 0; i < count; i++) {
      const p = getParticle();
      if (!p) return;

      p.active = true;
      p.x = x + (Math.random() - 0.5) * (config.spread || 20);
      p.y = y + (Math.random() - 0.5) * (config.spread || 20);

      const angle = config.angle !== undefined
        ? config.angle + (Math.random() - 0.5) * (config.angleSpread || Math.PI)
        : Math.random() * Math.PI * 2;
      const speed = (config.speed || 100) * (0.5 + Math.random() * 0.5);

      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.life = (config.life || 0.5) * (0.5 + Math.random() * 0.5);
      p.maxLife = p.life;
      p.size = (config.size || 3) * (0.5 + Math.random() * 0.5);
      p.gravity = config.gravity || 0;
      p.shrink = config.shrink !== false;

      // Color
      if (Array.isArray(config.colors)) {
        p.color = config.colors[Math.floor(Math.random() * config.colors.length)];
      } else {
        p.color = config.color || '#fff';
      }

      _activeCount++;
    }
  }

  // Emitter presets
  const emitterConfigs = {
    hit: {
      count: 8, spread: 10, speed: 150, life: 0.3,
      size: 3, gravity: 200, shrink: true,
      colors: ['#fff', '#ff0', '#f80']
    },
    magic: {
      count: 15, spread: 15, speed: 80, life: 0.6,
      size: 4, gravity: -20, shrink: true,
      colors: ['#88f', '#aaf', '#ccf', '#fff']
    },
    fire: {
      count: 12, spread: 10, speed: 120, life: 0.5,
      size: 4, gravity: -100, shrink: true,
      colors: ['#f00', '#f80', '#ff0', '#fa0']
    },
    ice: {
      count: 12, spread: 20, speed: 60, life: 0.7,
      size: 3, gravity: 30, shrink: true,
      colors: ['#8cf', '#adf', '#cef', '#fff']
    },
    heal: {
      count: 15, spread: 20, speed: 50, life: 0.8,
      size: 4, gravity: -60, shrink: false,
      angle: -Math.PI / 2, angleSpread: 0.5,
      colors: ['#0f0', '#4f4', '#8f8', '#cfc']
    },
    levelup: {
      count: 30, spread: 5, speed: 200, life: 1.0,
      size: 4, gravity: -50, shrink: true,
      colors: ['#fc0', '#ff0', '#ffa', '#fff']
    },
    death: {
      count: 20, spread: 10, speed: 100, life: 0.5,
      size: 3, gravity: 150, shrink: true,
      colors: ['#666', '#888', '#aaa', '#444']
    },
    // Ambient particles
    rain: {
      count: 1, spread: 0, speed: 400, life: 1.0,
      size: 1, gravity: 0, shrink: false,
      angle: Math.PI / 2 + 0.2, angleSpread: 0.1,
      color: 'rgba(150,180,255,0.4)'
    },
    snow: {
      count: 1, spread: 0, speed: 30, life: 3.0,
      size: 2, gravity: 10, shrink: false,
      angle: Math.PI / 2, angleSpread: 0.5,
      colors: ['#fff', '#eef', '#ddf']
    },
    firefly: {
      count: 1, spread: 0, speed: 15, life: 2.0,
      size: 2, gravity: -5, shrink: false,
      colors: ['#ff8', '#ffa', '#ff0']
    },
    dust: {
      count: 1, spread: 0, speed: 10, life: 2.0,
      size: 1, gravity: -2, shrink: false,
      colors: ['rgba(200,180,140,0.3)', 'rgba(180,160,120,0.3)']
    },
    // Element particles
    lightning: {
      count: 10, spread: 30, speed: 250, life: 0.2,
      size: 2, gravity: 0, shrink: false,
      colors: ['#ff0', '#ffa', '#fff', '#ee0']
    },
    poison: {
      count: 10, spread: 15, speed: 40, life: 1.0,
      size: 3, gravity: -30, shrink: true,
      colors: ['#0a0', '#4c0', '#080', '#2f2']
    },
    dark: {
      count: 15, spread: 20, speed: 60, life: 0.6,
      size: 4, gravity: 20, shrink: true,
      colors: ['#408', '#606', '#303', '#202']
    },
    holy: {
      count: 15, spread: 15, speed: 70, life: 0.8,
      size: 4, gravity: -40, shrink: false,
      angle: -Math.PI / 2, angleSpread: 0.8,
      colors: ['#ff8', '#ffa', '#fff', '#ffc']
    },
    earth: {
      count: 12, spread: 25, speed: 100, life: 0.5,
      size: 4, gravity: 300, shrink: true,
      colors: ['#864', '#a86', '#642', '#ca8']
    },
    arcane: {
      count: 15, spread: 20, speed: 80, life: 0.7,
      size: 3, gravity: -20, shrink: false,
      colors: ['#a4f', '#c6f', '#84f', '#f4f', '#fff']
    },
    critical: {
      count: 20, spread: 10, speed: 200, life: 0.4,
      size: 4, gravity: 0, shrink: true,
      colors: ['#f00', '#ff0', '#f80', '#fff']
    },
    buff: {
      count: 12, spread: 15, speed: 40, life: 0.8,
      size: 3, gravity: -40, shrink: false,
      angle: -Math.PI / 2, angleSpread: 0.6,
      colors: ['#4af', '#8cf', '#aef', '#fff']
    },
    stun: {
      count: 6, spread: 10, speed: 30, life: 0.6,
      size: 3, gravity: -10, shrink: false,
      colors: ['#ff0', '#ffa', '#ee0']
    }
  };

  function update(dt) {
    _activeCount = 0;
    for (let i = 0; i < POOL_SIZE; i++) {
      const p = pool[i];
      if (!p.active) continue;

      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }

      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = p.life / p.maxLife;
      if (p.shrink) {
        p.size *= (1 - dt * 2);
        if (p.size < 0.5) {
          p.active = false;
          continue;
        }
      }
      _activeCount++;
    }
  }

  function render() {
    const ctx = Renderer.getCtx();

    for (let i = 0; i < POOL_SIZE; i++) {
      const p = pool[i];
      if (!p.active) continue;

      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  // Ambient particle spawning (called each frame for weather effects)
  function spawnAmbient(type, dt) {
    const w = Renderer.getWidth();
    const h = Renderer.getHeight();

    // Spawn rate
    const rates = { rain: 5, snow: 0.5, firefly: 0.1, dust: 0.2 };
    const rate = rates[type] || 0.1;

    if (Math.random() < rate * dt * 60) {
      const x = Math.random() * w;
      const y = type === 'rain' || type === 'snow' ? -10 : Math.random() * h;
      emit(type, x, y, 1);
    }
  }

  return { init, emit, update, render, spawnAmbient, get activeCount() { return _activeCount; } };
})();
