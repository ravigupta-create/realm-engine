// world/minimap.js — Corner minimap showing explored tiles

const Minimap = (() => {
  const SIZE = 140;
  const MARGIN = 10;
  let _canvas, _ctx;

  function init() {
    _canvas = document.createElement('canvas');
    _canvas.width = SIZE;
    _canvas.height = SIZE;
    _ctx = _canvas.getContext('2d');
    _ctx.imageSmoothingEnabled = false;
  }

  function render() {
    const zone = WorldManager.getZone();
    if (!zone || !GS.player) return;

    const explored = GS.exploredTiles[zone.id] || {};
    const scale = Math.min(SIZE / zone.width, SIZE / zone.height);
    const offsetX = (SIZE - zone.width * scale) / 2;
    const offsetY = (SIZE - zone.height * scale) / 2;

    // Clear
    _ctx.fillStyle = 'rgba(0,0,0,0.8)';
    _ctx.fillRect(0, 0, SIZE, SIZE);

    // Draw explored tiles
    for (let y = 0; y < zone.height; y++) {
      for (let x = 0; x < zone.width; x++) {
        const key = `${x},${y}`;
        if (!explored[key]) continue;

        const ground = zone.ground[y][x];
        const obj = zone.objects[y][x];

        // Color by tile type
        if (Tileset.isSolid(obj)) {
          _ctx.fillStyle = '#444';
        } else if (ground === Tileset.T.WATER) {
          _ctx.fillStyle = '#2255aa';
        } else if (ground === Tileset.T.LAVA) {
          _ctx.fillStyle = '#cc3300';
        } else if (ground === Tileset.T.SAND) {
          _ctx.fillStyle = '#d4b545';
        } else if (ground === Tileset.T.SNOW || ground === Tileset.T.ICE) {
          _ctx.fillStyle = '#dde';
        } else if (ground === Tileset.T.STONE) {
          _ctx.fillStyle = '#666';
        } else if (ground === Tileset.T.PATH || ground === Tileset.T.DIRT) {
          _ctx.fillStyle = '#8B6914';
        } else if (ground === Tileset.T.CRYSTAL) {
          _ctx.fillStyle = '#7b2ff7';
        } else if (ground === Tileset.T.VOID) {
          _ctx.fillStyle = '#111';
        } else {
          _ctx.fillStyle = '#3a7d32';
        }

        _ctx.fillRect(
          offsetX + x * scale,
          offsetY + y * scale,
          Math.ceil(scale),
          Math.ceil(scale)
        );
      }
    }

    // Draw entities
    for (const e of GS.entities) {
      if (!e.alive && e.isEnemy) continue;
      const key = `${Math.floor(e.x)},${Math.floor(e.y)}`;
      if (!explored[key]) continue;

      if (e.isEnemy) {
        _ctx.fillStyle = e.isBoss ? '#ff0' : '#f44';
      } else if (e.isNPC) {
        _ctx.fillStyle = '#4f4';
      } else if (e.isChest && !e.opened) {
        _ctx.fillStyle = '#fc0';
      } else {
        continue;
      }
      _ctx.fillRect(
        offsetX + e.x * scale - 1,
        offsetY + e.y * scale - 1,
        Math.max(2, scale),
        Math.max(2, scale)
      );
    }

    // Draw player
    _ctx.fillStyle = '#fff';
    _ctx.fillRect(
      offsetX + GS.player.x * scale - 1,
      offsetY + GS.player.y * scale - 1,
      3, 3
    );

    // Draw to main canvas
    const ctx = Renderer.getCtx();
    const dx = Renderer.getWidth() - SIZE - MARGIN;
    const dy = MARGIN;

    ctx.drawImage(_canvas, dx, dy);

    // Border
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.strokeRect(dx, dy, SIZE, SIZE);

    // Zone name
    Renderer.drawText(zone.name, dx + SIZE / 2, dy + SIZE + 4, '#aaa', 10, 'center');
  }

  return { init, render };
})();
