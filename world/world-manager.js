// world/world-manager.js — Zone loading, transitions, spatial grid, collision

const WorldManager = (() => {
  let _currentZone = null;
  let _spatialGrid = {};
  const GRID_SIZE = 4; // Spatial grid cell size in tiles

  function loadZone(zoneId, spawnX, spawnY) {
    const zone = Zones.getZone(zoneId);
    if (!zone) return;

    _currentZone = zone;
    GS.currentZone = zone;

    // Initialize explored tiles for this zone
    if (!GS.exploredTiles[zoneId]) {
      GS.exploredTiles[zoneId] = {};
    }

    // Clear existing entities (keep player)
    GS.entities = GS.entities.filter(e => e.isPlayer);

    // Spawn entities from zone data
    for (const spawn of zone.spawns) {
      spawnEntity(spawn);
    }

    // Set player position
    if (GS.player) {
      GS.player.x = spawnX !== undefined ? spawnX : zone.playerStart.x;
      GS.player.y = spawnY !== undefined ? spawnY : zone.playerStart.y;
      GS.camera.x = GS.player.x * Renderer.SCALED_TILE - Renderer.getWidth() / 2;
      GS.camera.y = GS.player.y * Renderer.SCALED_TILE - Renderer.getHeight() / 2;
    }

    // Rebuild spatial grid
    rebuildSpatialGrid();

    // Mark ground layer dirty
    Renderer.markGroundDirty();

    // Play zone music
    if (typeof AudioManager !== 'undefined' && AudioManager.playMusic) {
      AudioManager.playMusic(zone.music);
    }

    // Zone event hooks
    if (typeof Quests !== 'undefined') Quests.onZoneEntered(zoneId);
    if (typeof DailyChallenges !== 'undefined') DailyChallenges.onZoneVisited();
    if (typeof Achievements !== 'undefined') Achievements.onZoneVisited(zoneId);

    // Auto-save on zone transition
    if (typeof SaveSystem !== 'undefined' && SaveSystem.autoSave && GS.state === GameStates.PLAY) {
      SaveSystem.autoSave();
    }

    Core.addNotification(zone.name, 3);
  }

  function spawnEntity(spawn) {
    if (typeof ECS === 'undefined') return;

    const entity = ECS.createEntity();
    entity.x = spawn.x;
    entity.y = spawn.y;
    entity.spawnX = spawn.x;
    entity.spawnY = spawn.y;

    if (spawn.type === 'enemy' || spawn.type === 'boss') {
      entity.isEnemy = true;
      entity.isBoss = spawn.type === 'boss';
      entity.isFinalBoss = spawn.isFinalBoss || false;
      entity.enemyType = spawn.enemyType;
      entity.name = spawn.name || spawn.enemyType;
      entity.level = spawn.level || 1;
      entity.alive = true;
      entity.defeated = false;

      // Check if already defeated (for bosses)
      if (entity.isBoss && GS.defeatedBosses && GS.defeatedBosses.includes(entity.name)) {
        entity.alive = false;
        entity.defeated = true;
        return;
      }

      // AI state
      entity.aiState = 'patrol';
      entity.aiTimer = 0;
      entity.patrolDir = { x: 0, y: 0 };
      entity.aggroRange = entity.isBoss ? 5 : 4;
      entity.speed = 1.5;

      // Stats from enemy data
      if (typeof Enemies !== 'undefined') {
        const data = Enemies.get(spawn.enemyType);
        if (data) {
          entity.stats = Enemies.getScaledStats(spawn.enemyType, spawn.level);
          entity.speed = data.speed || 1.5;
          entity.aggroRange = data.aggroRange || (entity.isBoss ? 5 : 4);
        }
      }

      ECS.addComponent(entity, 'enemy');
    } else if (spawn.type === 'npc') {
      entity.isNPC = true;
      entity.npcType = spawn.npcType;
      entity.name = spawn.name || spawn.npcType;
      entity.interactable = true;
      ECS.addComponent(entity, 'npc');
    } else if (spawn.type === 'chest') {
      entity.isChest = true;
      entity.opened = false;
      entity.loot = spawn.loot;
      entity.level = spawn.level || 1;
      entity.interactable = true;
      ECS.addComponent(entity, 'chest');
    }

    GS.entities.push(entity);
  }

  // Spatial hash grid for O(1) collision
  function getSpatialKey(x, y) {
    const gx = Math.floor(x / GRID_SIZE);
    const gy = Math.floor(y / GRID_SIZE);
    return `${gx},${gy}`;
  }

  function rebuildSpatialGrid() {
    _spatialGrid = {};
    for (const entity of GS.entities) {
      addToGrid(entity);
    }
  }

  function addToGrid(entity) {
    const key = getSpatialKey(entity.x, entity.y);
    if (!_spatialGrid[key]) _spatialGrid[key] = [];
    _spatialGrid[key].push(entity);
  }

  function removeFromGrid(entity) {
    const key = getSpatialKey(entity.x, entity.y);
    if (_spatialGrid[key]) {
      _spatialGrid[key] = _spatialGrid[key].filter(e => e !== entity);
    }
  }

  function updateEntityGrid(entity, oldX, oldY) {
    const oldKey = getSpatialKey(oldX, oldY);
    const newKey = getSpatialKey(entity.x, entity.y);
    if (oldKey !== newKey) {
      if (_spatialGrid[oldKey]) {
        _spatialGrid[oldKey] = _spatialGrid[oldKey].filter(e => e !== entity);
      }
      if (!_spatialGrid[newKey]) _spatialGrid[newKey] = [];
      _spatialGrid[newKey].push(entity);
    }
  }

  function getEntitiesNear(x, y, range) {
    const results = [];
    const r = Math.ceil(range / GRID_SIZE);
    const gx = Math.floor(x / GRID_SIZE);
    const gy = Math.floor(y / GRID_SIZE);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const key = `${gx + dx},${gy + dy}`;
        if (_spatialGrid[key]) {
          for (const e of _spatialGrid[key]) {
            const d = Utils.distance(x, y, e.x, e.y);
            if (d <= range) results.push(e);
          }
        }
      }
    }
    return results;
  }

  // Tile collision
  function isTileBlocked(x, y) {
    if (!_currentZone) return true;
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    if (tx < 0 || ty < 0 || tx >= _currentZone.width || ty >= _currentZone.height) return true;
    if (Tileset.isSolid(_currentZone.ground[ty][tx])) return true;
    if (Tileset.isSolid(_currentZone.objects[ty][tx])) return true;
    return false;
  }

  // Movement collision check
  function canMoveTo(x, y, entity) {
    // Check tile collision at corners of hitbox (0.3 tile radius)
    const r = 0.3;
    if (isTileBlocked(x - r, y - r)) return false;
    if (isTileBlocked(x + r, y - r)) return false;
    if (isTileBlocked(x - r, y + r)) return false;
    if (isTileBlocked(x + r, y + r)) return false;
    return true;
  }

  // Zone exit check
  function checkZoneExit(x, y) {
    if (!_currentZone) return null;
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    for (const exit of _currentZone.exits) {
      if (exit.x === tx && exit.y === ty) {
        // Check boss requirement
        if (exit.requireBoss) {
          if (!GS.defeatedBosses || !GS.defeatedBosses.includes(exit.requireBoss)) {
            return null;
          }
        }
        return exit;
      }
    }
    return null;
  }

  // Explore tiles around player
  function exploreTiles(x, y, radius) {
    if (!_currentZone) return;
    const explored = GS.exploredTiles[_currentZone.id];
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const key = `${tx + dx},${ty + dy}`;
        explored[key] = true;
      }
    }
  }

  function getZone() { return _currentZone; }

  function update(dt) {
    if (!_currentZone || !GS.player) return;

    // Explore around player
    exploreTiles(GS.player.x, GS.player.y, 5);

    // Check zone exits
    const exit = checkZoneExit(GS.player.x, GS.player.y);
    if (exit) {
      loadZone(exit.target, exit.spawnX, exit.spawnY);
    }
  }

  return {
    loadZone, getZone, update,
    isTileBlocked, canMoveTo, checkZoneExit,
    getEntitiesNear, rebuildSpatialGrid, updateEntityGrid,
    exploreTiles
  };
})();
