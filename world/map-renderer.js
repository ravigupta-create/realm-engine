// world/map-renderer.js — Tile rendering with viewport culling

const MapRenderer = (() => {
  function render() {
    const zone = WorldManager.getZone();
    if (!zone) return;

    const { startCol, startRow, endCol, endRow } = Renderer.getVisibleTiles();

    // Ground layer
    for (let y = startRow; y <= endRow; y++) {
      for (let x = startCol; x <= endCol; x++) {
        if (y < 0 || y >= zone.height || x < 0 || x >= zone.width) continue;

        const groundTile = zone.ground[y][x];
        const objTile = zone.objects[y][x];

        // Draw ground
        const groundSprite = Tileset.getSprite(groundTile);
        if (groundSprite) {
          Renderer.drawTile(groundSprite, x, y);
        }

        // Draw non-tall objects on ground pass
        if (Tileset.isObjectTile(objTile)) {
          // Draw ground under objects
          const under = Tileset.getGroundUnder(objTile, zone.id);
          const underSprite = Tileset.getSprite(under);
          if (underSprite) {
            Renderer.drawTile(underSprite, x, y);
          }
        } else if (objTile !== 0) {
          // Wall-type tiles
          const objSprite = Tileset.getSprite(objTile);
          if (objSprite) {
            Renderer.drawTile(objSprite, x, y);
          }
        }
      }
    }

    // Object layer (tall sprites like trees, rendered sorted by Y for depth)
    const objects = [];
    for (let y = startRow; y <= endRow; y++) {
      for (let x = startCol; x <= endCol; x++) {
        if (y < 0 || y >= zone.height || x < 0 || x >= zone.width) continue;
        const objTile = zone.objects[y][x];
        if (Tileset.isObjectTile(objTile)) {
          objects.push({ x, y, tile: objTile });
        }
      }
    }

    // Sort by Y for depth ordering
    objects.sort((a, b) => a.y - b.y);

    for (const obj of objects) {
      const sprite = Tileset.getObjectSprite(obj.tile);
      if (sprite) {
        Renderer.drawSprite(sprite, obj.x, obj.y, sprite.width, sprite.height);
      }
    }
  }

  // Render zone exits as subtle indicators
  function renderExits() {
    const zone = WorldManager.getZone();
    if (!zone) return;

    const ctx = Renderer.getCtx();
    const pulse = Math.sin(GS.time * 3) * 0.3 + 0.5;

    for (const exit of zone.exits) {
      if (!Renderer.isOnScreen(exit.x, exit.y)) continue;

      // Skip boss-gated exits unless defeated
      if (exit.requireBoss && (!GS.defeatedBosses || !GS.defeatedBosses.includes(exit.requireBoss))) {
        continue;
      }

      const s = Renderer.worldToScreen(exit.x, exit.y);
      ctx.fillStyle = `rgba(100,200,255,${pulse * 0.3})`;
      ctx.fillRect(s.x, s.y, Renderer.SCALED_TILE, Renderer.SCALED_TILE);
    }
  }

  return { render, renderExits };
})();
