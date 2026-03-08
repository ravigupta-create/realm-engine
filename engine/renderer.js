// engine/renderer.js — Layered canvas pipeline, camera, culling

const Renderer = (() => {
  let _canvas, _ctx;
  let _width, _height;
  const TILE = 16;
  const SCALE = 3; // Pixel art scale
  const SCALED_TILE = TILE * SCALE;

  // Offscreen layers
  let _groundLayer, _groundCtx;
  let _groundDirty = true;

  function init(canvas) {
    _canvas = canvas;
    _ctx = canvas.getContext('2d');
    _ctx.imageSmoothingEnabled = false;

    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    _width = window.innerWidth;
    _height = window.innerHeight;
    _canvas.width = _width;
    _canvas.height = _height;
    _ctx.imageSmoothingEnabled = false;

    // Recreate ground layer
    _groundLayer = document.createElement('canvas');
    _groundLayer.width = _width + SCALED_TILE * 2;
    _groundLayer.height = _height + SCALED_TILE * 2;
    _groundCtx = _groundLayer.getContext('2d');
    _groundCtx.imageSmoothingEnabled = false;
    _groundDirty = true;
  }

  function markGroundDirty() {
    _groundDirty = true;
  }

  // Camera
  function updateCamera(targetX, targetY, dt) {
    const cam = GS.camera;
    cam.targetX = targetX * SCALED_TILE - _width / 2 + SCALED_TILE / 2;
    cam.targetY = targetY * SCALED_TILE - _height / 2 + SCALED_TILE / 2;
    cam.x = Utils.lerp(cam.x, cam.targetX, 1 - Math.pow(0.001, dt));
    cam.y = Utils.lerp(cam.y, cam.targetY, 1 - Math.pow(0.001, dt));
  }

  function getVisibleTiles() {
    const cam = GS.camera;
    const startCol = Math.floor(cam.x / SCALED_TILE) - 1;
    const startRow = Math.floor(cam.y / SCALED_TILE) - 1;
    const endCol = startCol + Math.ceil(_width / SCALED_TILE) + 2;
    const endRow = startRow + Math.ceil(_height / SCALED_TILE) + 2;
    return { startCol, startRow, endCol, endRow };
  }

  function worldToScreen(wx, wy) {
    return {
      x: wx * SCALED_TILE - GS.camera.x,
      y: wy * SCALED_TILE - GS.camera.y
    };
  }

  function screenToWorld(sx, sy) {
    return {
      x: (sx + GS.camera.x) / SCALED_TILE,
      y: (sy + GS.camera.y) / SCALED_TILE
    };
  }

  function isOnScreen(wx, wy, margin) {
    margin = margin || 1;
    const s = worldToScreen(wx, wy);
    return s.x > -SCALED_TILE * margin && s.x < _width + SCALED_TILE * margin &&
           s.y > -SCALED_TILE * margin && s.y < _height + SCALED_TILE * margin;
  }

  // Drawing helpers
  function clear() {
    _ctx.fillStyle = '#111';
    _ctx.fillRect(0, 0, _width, _height);
  }

  function drawTile(sprite, worldX, worldY) {
    const s = worldToScreen(worldX, worldY);
    _ctx.drawImage(sprite, s.x, s.y, SCALED_TILE, SCALED_TILE);
  }

  function drawSprite(sprite, worldX, worldY, spriteW, spriteH) {
    const s = worldToScreen(worldX, worldY);
    const sw = (spriteW || TILE) * SCALE;
    const sh = (spriteH || TILE) * SCALE;
    _ctx.drawImage(sprite, s.x, s.y - (sh - SCALED_TILE), sw, sh);
  }

  function drawSpriteEx(sprite, worldX, worldY, spriteW, spriteH, alpha, flipX) {
    const s = worldToScreen(worldX, worldY);
    const sw = (spriteW || TILE) * SCALE;
    const sh = (spriteH || TILE) * SCALE;

    _ctx.save();
    if (alpha !== undefined) _ctx.globalAlpha = alpha;
    if (flipX) {
      _ctx.translate(s.x + sw, s.y - (sh - SCALED_TILE));
      _ctx.scale(-1, 1);
      _ctx.drawImage(sprite, 0, 0, sw, sh);
    } else {
      _ctx.drawImage(sprite, s.x, s.y - (sh - SCALED_TILE), sw, sh);
    }
    _ctx.restore();
  }

  // Screen-space drawing (for UI)
  function drawRect(x, y, w, h, color) {
    _ctx.fillStyle = color;
    _ctx.fillRect(x, y, w, h);
  }

  function drawRectOutline(x, y, w, h, color, lineWidth) {
    _ctx.strokeStyle = color;
    _ctx.lineWidth = lineWidth || 1;
    _ctx.strokeRect(x, y, w, h);
  }

  function drawText(text, x, y, color, size, align, shadow) {
    _ctx.font = `${size || 14}px monospace`;
    _ctx.textAlign = align || 'left';
    _ctx.textBaseline = 'top';
    if (shadow) {
      _ctx.fillStyle = '#000';
      _ctx.fillText(text, x + 1, y + 1);
    }
    _ctx.fillStyle = color || '#fff';
    _ctx.fillText(text, x, y);
  }

  function drawBar(x, y, w, h, ratio, fgColor, bgColor) {
    _ctx.fillStyle = bgColor || '#333';
    _ctx.fillRect(x, y, w, h);
    _ctx.fillStyle = fgColor || '#0f0';
    _ctx.fillRect(x, y, w * Utils.clamp(ratio, 0, 1), h);
    _ctx.strokeStyle = '#000';
    _ctx.lineWidth = 1;
    _ctx.strokeRect(x, y, w, h);
  }

  function drawPanel(x, y, w, h, bgColor, borderColor) {
    _ctx.fillStyle = bgColor || 'rgba(0,0,0,0.85)';
    _ctx.fillRect(x, y, w, h);
    _ctx.strokeStyle = borderColor || '#666';
    _ctx.lineWidth = 2;
    _ctx.strokeRect(x, y, w, h);
  }

  function getCtx() { return _ctx; }
  function getWidth() { return _width; }
  function getHeight() { return _height; }

  return {
    init, resize, clear, markGroundDirty,
    updateCamera, getVisibleTiles, worldToScreen, screenToWorld, isOnScreen,
    drawTile, drawSprite, drawSpriteEx,
    drawRect, drawRectOutline, drawText, drawBar, drawPanel,
    getCtx, getWidth, getHeight,
    TILE, SCALE, SCALED_TILE,
    get groundDirty() { return _groundDirty; },
    set groundDirty(v) { _groundDirty = v; }
  };
})();
