// ecs/systems.js — Movement, collision, AI, combat trigger, render systems

const Systems = (() => {

  // ======== PLAYER MOVEMENT ========
  const PlayerMovement = {
    update(dt) {
      if (GS.state !== GameStates.PLAY || !GS.player) return;

      const p = GS.player;
      const move = Input.getMovement();
      const speed = p.speed || 3;

      if (move.x !== 0 || move.y !== 0) {
        const newX = p.x + move.x * speed * dt;
        const newY = p.y + move.y * speed * dt;

        // Try full movement
        if (WorldManager.canMoveTo(newX, newY, p)) {
          const oldX = p.x, oldY = p.y;
          p.x = newX;
          p.y = newY;
          WorldManager.updateEntityGrid(p, oldX, oldY);
        } else if (WorldManager.canMoveTo(newX, p.y, p)) {
          const oldX = p.x;
          p.x = newX;
          WorldManager.updateEntityGrid(p, oldX, p.y);
        } else if (WorldManager.canMoveTo(p.x, newY, p)) {
          const oldY = p.y;
          p.y = newY;
          WorldManager.updateEntityGrid(p, p.x, oldY);
        }

        // Direction
        if (Math.abs(move.x) > Math.abs(move.y)) {
          p.dir = move.x > 0 ? 'right' : 'left';
        } else {
          p.dir = move.y > 0 ? 'down' : 'up';
        }
        Animations.play(p.animState, 'walk');
      } else {
        Animations.play(p.animState, 'idle');
      }

      Animations.update(p.animState, dt);

      // Camera follow
      Renderer.updateCamera(p.x, p.y, dt);
    }
  };

  // ======== AI SYSTEM ========
  const AISystem = {
    update(dt) {
      if (GS.state !== GameStates.PLAY || !GS.player) return;

      for (const e of GS.entities) {
        if (!e.isEnemy || !e.alive) continue;

        const dist = Utils.distance(e.x, e.y, GS.player.x, GS.player.y);

        e.aiTimer -= dt;

        switch (e.aiState) {
          case 'patrol':
            // Wander randomly
            if (e.aiTimer <= 0) {
              e.aiTimer = 2 + Math.random() * 3;
              const angle = Math.random() * Math.PI * 2;
              e.patrolDir = { x: Math.cos(angle), y: Math.sin(angle) };
              if (Math.random() > 0.6) e.patrolDir = { x: 0, y: 0 }; // Sometimes idle
            }

            // Move
            if (e.patrolDir.x !== 0 || e.patrolDir.y !== 0) {
              const spd = (e.speed || 1) * dt;
              const nx = e.x + e.patrolDir.x * spd;
              const ny = e.y + e.patrolDir.y * spd;

              // Stay near spawn
              const fromSpawn = Utils.distance(nx, ny, e.spawnX, e.spawnY);
              if (fromSpawn < 6 && WorldManager.canMoveTo(nx, ny, e)) {
                const oldX = e.x, oldY = e.y;
                e.x = nx;
                e.y = ny;
                WorldManager.updateEntityGrid(e, oldX, oldY);
              } else {
                e.patrolDir = { x: 0, y: 0 };
              }

              if (e.patrolDir.x !== 0 || e.patrolDir.y !== 0) {
                if (Math.abs(e.patrolDir.x) > Math.abs(e.patrolDir.y)) {
                  e.dir = e.patrolDir.x > 0 ? 'right' : 'left';
                } else {
                  e.dir = e.patrolDir.y > 0 ? 'down' : 'up';
                }
                Animations.play(e.animState, 'walk');
              }
            } else {
              Animations.play(e.animState, 'idle');
            }

            // Aggro
            if (dist < (e.aggroRange || 4)) {
              e.aiState = 'chase';
            }
            break;

          case 'chase':
            // Move toward player
            const dx = GS.player.x - e.x;
            const dy = GS.player.y - e.y;
            const norm = Utils.normalize(dx, dy);
            const chaseSpeed = (e.speed || 1.5) * 1.3 * dt;
            const nx2 = e.x + norm.x * chaseSpeed;
            const ny2 = e.y + norm.y * chaseSpeed;

            if (WorldManager.canMoveTo(nx2, ny2, e)) {
              const oldX = e.x, oldY = e.y;
              e.x = nx2;
              e.y = ny2;
              WorldManager.updateEntityGrid(e, oldX, oldY);
            }

            if (Math.abs(dx) > Math.abs(dy)) {
              e.dir = dx > 0 ? 'right' : 'left';
            } else {
              e.dir = dy > 0 ? 'down' : 'up';
            }
            Animations.play(e.animState, 'walk');

            // Contact = start combat
            if (dist < 0.8) {
              if (typeof Combat !== 'undefined') {
                Combat.startCombat(e);
              }
              return; // Exit to prevent further processing
            }

            // Deaggro
            if (dist > (e.aggroRange || 4) * 2) {
              e.aiState = 'patrol';
              e.aiTimer = 0;
            }
            break;
        }

        Animations.update(e.animState, dt);
      }
    }
  };

  // ======== INTERACTION SYSTEM ========
  const InteractionSystem = {
    update(dt) {
      if (GS.state !== GameStates.PLAY || !GS.player) return;

      if (Input.actionPressed(Input.Actions.INTERACT) || Input.actionPressed(Input.Actions.CONFIRM)) {
        // Find nearest interactable entity
        const nearEntities = WorldManager.getEntitiesNear(GS.player.x, GS.player.y, 2);

        let closest = null;
        let closestDist = Infinity;

        for (const e of nearEntities) {
          if (e.isPlayer) continue;
          if (!e.interactable) continue;
          const d = Utils.distance(GS.player.x, GS.player.y, e.x, e.y);

          // Check if entity is in the direction player faces
          const dx = e.x - GS.player.x;
          const dy = e.y - GS.player.y;
          let facing = false;
          switch (GS.player.dir) {
            case 'up': facing = dy < 0; break;
            case 'down': facing = dy > 0; break;
            case 'left': facing = dx < 0; break;
            case 'right': facing = dx > 0; break;
          }

          if (d < closestDist && (facing || d < 1.2)) {
            closest = e;
            closestDist = d;
          }
        }

        if (closest && closestDist < 2) {
          interact(closest);
        }
      }
    }
  };

  function interact(entity) {
    if (entity.isNPC) {
      if (typeof Dialogue !== 'undefined') {
        Dialogue.startDialogue(entity);
      }
    } else if (entity.isChest && !entity.opened) {
      entity.opened = true;
      // Generate loot
      if (typeof Items !== 'undefined') {
        const item = Items.generateItem(entity.level, entity.loot === 'legendary' ? 'legendary' : null);
        if (item) {
          GS.player.items.push(item);
          Core.addNotification(`Found: ${item.name}!`, 3);
        }
      }
      const gold = Utils.randomInt(10 * entity.level, 30 * entity.level);
      GS.player.gold = (GS.player.gold || 0) + gold;
      GS.player.stats.gold = GS.player.gold;
      Core.addNotification(`+${gold} Gold`, 2);

      if (typeof AudioManager !== 'undefined') {
        AudioManager.playSFX('chest');
      }
      if (typeof Quests !== 'undefined') Quests.onChestOpened();
    }
  }

  // ======== RENDER SYSTEM ========
  const EntityRenderSystem = {
    update(dt) {
      if (!GS.player) return;

      // Collect all renderable entities
      const renderList = [];

      for (const e of GS.entities) {
        if (!Renderer.isOnScreen(e.x, e.y, 2)) continue;
        if (e.isEnemy && !e.alive) continue;
        if (e.isChest && e.opened) {
          // Draw open chest
          Renderer.drawSprite(SpriteGen.cache.chest_open, e.x, e.y);
          continue;
        }
        if (e.isChest && !e.opened) {
          Renderer.drawSprite(SpriteGen.cache.chest_closed, e.x, e.y);
          continue;
        }
        renderList.push(e);
      }

      // Add player (if not already in list from entities loop)
      if (!renderList.includes(GS.player)) {
        renderList.push(GS.player);
      }

      // Sort by Y for depth ordering
      renderList.sort((a, b) => a.y - b.y);

      for (const e of renderList) {
        let sprite;

        if (e.isPlayer) {
          const cls = e.classType || 'warrior';
          const frame = Animations.getFrame(e.animState);
          sprite = SpriteGen.cache.player[cls][e.dir][frame];
        } else if (e.isEnemy) {
          sprite = SpriteGen.cache.enemies[e.enemyType];
        } else if (e.isNPC) {
          sprite = SpriteGen.cache.npcs[e.npcType];
        }

        if (sprite) {
          Renderer.drawSprite(sprite, e.x, e.y, sprite.width, sprite.height);

          // Name tag for NPCs and bosses
          if ((e.isNPC || e.isBoss) && e.name) {
            const s = Renderer.worldToScreen(e.x, e.y);
            const nameX = s.x + Renderer.SCALED_TILE / 2;
            const nameY = s.y - sprite.height * Renderer.SCALE + Renderer.SCALED_TILE - 4;
            Renderer.drawText(e.name, nameX, nameY, e.isBoss ? '#ff4444' : '#ffcc00', 11, 'center', true);
          }

          // HP bar for enemies
          if (e.isEnemy && e.stats && e.stats.hp < e.stats.maxHp) {
            const s = Renderer.worldToScreen(e.x, e.y);
            const barX = s.x + 4;
            const barY = s.y - sprite.height * Renderer.SCALE + Renderer.SCALED_TILE + 6;
            Renderer.drawBar(barX, barY, Renderer.SCALED_TILE - 8, 4, e.stats.hp / e.stats.maxHp, '#c00', '#400');
          }
        }
      }

      // Interaction prompt
      if (GS.state === GameStates.PLAY) {
        const nearEntities = WorldManager.getEntitiesNear(GS.player.x, GS.player.y, 2);
        for (const e of nearEntities) {
          if (e.isPlayer || !e.interactable) continue;
          if (e.isChest && e.opened) continue;
          const d = Utils.distance(GS.player.x, GS.player.y, e.x, e.y);
          if (d < 2) {
            const s = Renderer.worldToScreen(e.x, e.y);
            Renderer.drawText('[E] Interact', s.x + Renderer.SCALED_TILE / 2, s.y - 20, '#fff', 12, 'center', true);
            break;
          }
        }
      }
    }
  };

  // ======== NOTIFICATION SYSTEM ========
  const NotificationSystem = {
    update(dt) {
      const w = Renderer.getWidth();
      let y = 80;

      for (let i = GS.notifications.length - 1; i >= 0; i--) {
        const n = GS.notifications[i];
        n.timer -= dt;
        if (n.timer <= 0) {
          GS.notifications.splice(i, 1);
          continue;
        }
        n.alpha = Math.min(1, n.timer);
        const ctx = Renderer.getCtx();
        ctx.globalAlpha = n.alpha;
        Renderer.drawText(n.text, w / 2, y, '#ffcc00', 16, 'center', true);
        ctx.globalAlpha = 1;
        y += 24;
      }
    }
  };

  function registerAll() {
    ECS.registerSystem(PlayerMovement);
    ECS.registerSystem(AISystem);
    ECS.registerSystem(InteractionSystem);
  }

  return {
    PlayerMovement, AISystem, InteractionSystem, EntityRenderSystem, NotificationSystem,
    registerAll
  };
})();
