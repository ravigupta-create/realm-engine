// engine/utils.js — PRNG, math helpers, ID generator

const Utils = (() => {
  // Mulberry32 PRNG — fast, seedable, reproducible
  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  let _rng = mulberry32(42);

  function seedRNG(seed) {
    _rng = mulberry32(seed);
  }

  function random() {
    return _rng();
  }

  function randomInt(min, max) {
    return Math.floor(random() * (max - min + 1)) + min;
  }

  function randomFloat(min, max) {
    return random() * (max - min) + min;
  }

  function pick(arr) {
    return arr[Math.floor(random() * arr.length)];
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function distance(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function manhattanDist(x1, y1, x2, y2) {
    return Math.abs(x2 - x1) + Math.abs(y2 - y1);
  }

  function normalize(x, y) {
    const len = Math.sqrt(x * x + y * y);
    if (len === 0) return { x: 0, y: 0 };
    return { x: x / len, y: y / len };
  }

  let _nextId = 1;
  function genId() {
    return _nextId++;
  }

  function resetIdCounter(val) {
    _nextId = val || 1;
  }

  // Color helpers
  function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  function rgbStr(r, g, b, a) {
    if (a !== undefined) return `rgba(${r},${g},${b},${a})`;
    return `rgb(${r},${g},${b})`;
  }

  function hslStr(h, s, l, a) {
    if (a !== undefined) return `hsla(${h},${s}%,${l}%,${a})`;
    return `hsl(${h},${s}%,${l}%)`;
  }

  // Deep clone for save data
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // SHA-256 checksum (async, uses SubtleCrypto)
  async function sha256(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  return {
    mulberry32, seedRNG, random, randomInt, randomFloat, pick, shuffle,
    clamp, lerp, distance, manhattanDist, normalize,
    genId, resetIdCounter,
    hslToRgb, rgbStr, hslStr,
    deepClone, sha256
  };
})();
