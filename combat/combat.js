// combat/combat.js — Turn-based combat engine

const Combat = (() => {
  // Combat state
  let _enemy = null;
  let _turnOrder = [];
  let _currentTurn = 0;
  let _combatLog = [];
  let _animating = false;
  let _animTimer = 0;
  let _selectedAction = 0;
  let _selectedSkill = 0;
  let _selectedItem = 0;
  let _subMenu = null;  // null, 'skills', 'items'
  let _playerEffects = [];
  let _enemyEffects = [];
  let _shakeTimer = 0;
  let _flashTimer = 0;
  let _flashColor = '';
  let _combatResult = null; // null, 'victory', 'defeat', 'fled'
  let _resultTimer = 0;

  const actions = ['Attack', 'Skills', 'Items', 'Defend', 'Flee'];

  function startCombat(enemy) {
    _enemy = enemy;
    _combatLog = [];
    _animating = false;
    _selectedAction = 0;
    _subMenu = null;
    _playerEffects = [];
    _enemyEffects = [];
    _combatResult = null;
    _resultTimer = 0;
    _shakeTimer = 0;

    // Initialize enemy stats if needed
    if (!enemy.stats && typeof Enemies !== 'undefined') {
      enemy.stats = Enemies.getScaledStats(enemy.enemyType, enemy.level);
    }
    if (!enemy.stats) {
      enemy.stats = {
        hp: 50 + enemy.level * 20,
        maxHp: 50 + enemy.level * 20,
        mp: 20 + enemy.level * 10,
        maxMp: 20 + enemy.level * 10,
        str: 8 + enemy.level * 2,
        def: 5 + enemy.level * 2,
        int: 5 + enemy.level * 2,
        agi: 5 + enemy.level * 2,
        luk: 5 + enemy.level
      };
    }

    // Turn order by AGI
    _turnOrder = ['player', 'enemy'];
    if (_enemy.stats.agi > GS.player.stats.agi) {
      _turnOrder = ['enemy', 'player'];
    }
    _currentTurn = 0;

    addLog(`A ${enemy.name} appears!`);
    if (enemy.isBoss) addLog('** BOSS BATTLE **');

    Core.setState(GameStates.COMBAT);

    if (typeof AudioManager !== 'undefined') {
      AudioManager.playSFX('combat_start');
      AudioManager.playMusic(enemy.isBoss ? 'boss' : 'combat');
    }

    // If enemy goes first
    if (_turnOrder[0] === 'enemy') {
      _animating = true;
      _animTimer = 1;
    }
  }

  function addLog(text) {
    _combatLog.push(text);
    if (_combatLog.length > 6) _combatLog.shift();
  }

  // Damage formula: dmg = ATK * (1 + STR/50) * (1 - DEF/(DEF+100)) * random(0.85,1.15)
  function calcDamage(attacker, defender, isPhysical, skillPower) {
    const base = isPhysical ? attacker.str : attacker.int;
    const power = skillPower || 1;
    const atk = base * power * (1 + base / 50);
    const defStat = isPhysical ? defender.def : Math.floor(defender.def * 0.5);
    const reduction = 1 - defStat / (defStat + 100);
    const variance = 0.85 + Math.random() * 0.3;
    let dmg = Math.floor(atk * reduction * variance);

    // Critical hit
    const critChance = Utils.clamp(attacker.luk / 200, 0.02, 0.25);
    let crit = false;
    if (Math.random() < critChance) {
      dmg = Math.floor(dmg * 1.5);
      crit = true;
    }

    return { dmg: Math.max(1, dmg), crit };
  }

  function applyDamage(target, dmg) {
    target.hp = Math.max(0, target.hp - dmg);
  }

  function applyHeal(target, amount) {
    target.hp = Math.min(target.maxHp, target.hp + amount);
  }

  // ======== PLAYER ACTIONS ========

  function playerAttack() {
    const { dmg, crit } = calcDamage(GS.player.stats, _enemy.stats, true);
    applyDamage(_enemy.stats, dmg);
    addLog(`You attack for ${dmg} damage!${crit ? ' CRITICAL!' : ''}`);
    _shakeTimer = 0.3;
    if (typeof AudioManager !== 'undefined') AudioManager.playSFX('hit');
    if (typeof Particles !== 'undefined') Particles.emit('hit', Renderer.getWidth() * 0.7, Renderer.getHeight() * 0.4, 10);
    checkCombatEnd();
  }

  function playerDefend() {
    // Buff defense for one turn
    _playerEffects.push({ type: 'defend', turns: 1, defBonus: Math.floor(GS.player.stats.def * 0.5) });
    GS.player.stats.def += Math.floor(GS.player.stats.def * 0.5);
    addLog('You take a defensive stance!');
    if (typeof AudioManager !== 'undefined') AudioManager.playSFX('defend');
  }

  function playerFlee() {
    const chance = 0.4 + (GS.player.stats.agi - _enemy.stats.agi) * 0.05;
    if (Math.random() < chance && !_enemy.isBoss) {
      addLog('You fled successfully!');
      _combatResult = 'fled';
      _resultTimer = 1.5;
    } else {
      addLog(_enemy.isBoss ? 'Cannot flee from a boss!' : 'Failed to flee!');
    }
  }

  function playerUseSkill(skill) {
    if (GS.player.stats.mp < skill.mpCost) {
      addLog('Not enough MP!');
      return false;
    }
    GS.player.stats.mp -= skill.mpCost;

    if (skill.type === 'heal') {
      const healAmt = Math.floor(GS.player.stats.int * skill.power * 0.8);
      applyHeal(GS.player.stats, healAmt);
      addLog(`${skill.name}: Healed ${healAmt} HP!`);
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('heal');
      if (typeof Particles !== 'undefined') Particles.emit('heal', Renderer.getWidth() * 0.3, Renderer.getHeight() * 0.5, 15);
    } else if (skill.type === 'buff') {
      _playerEffects.push({ type: skill.effect, turns: skill.duration || 3, ...skill.buffData });
      addLog(`${skill.name}: Buff applied!`);
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('buff');
    } else {
      // Damage skill
      const isPhysical = skill.damageType === 'physical';
      const { dmg, crit } = calcDamage(GS.player.stats, _enemy.stats, isPhysical, skill.power);
      applyDamage(_enemy.stats, dmg);
      addLog(`${skill.name}: ${dmg} damage!${crit ? ' CRITICAL!' : ''}`);
      _shakeTimer = 0.4;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX(skill.sfx || 'magic');
      if (typeof Particles !== 'undefined') Particles.emit(skill.particleType || 'magic', Renderer.getWidth() * 0.7, Renderer.getHeight() * 0.4, 20);

      // Status effect
      if (skill.statusEffect && Math.random() < (skill.statusChance || 0.3)) {
        _enemyEffects.push({
          type: skill.statusEffect,
          turns: skill.statusDuration || 3,
          damage: skill.statusDamage || 0
        });
        addLog(`${_enemy.name} is ${skill.statusEffect}!`);
      }
    }
    checkCombatEnd();
    return true;
  }

  function playerUseItem(item) {
    if (item.type === 'consumable') {
      if (item.effect === 'heal_hp') {
        applyHeal(GS.player.stats, item.value);
        addLog(`Used ${item.name}: +${item.value} HP`);
      } else if (item.effect === 'heal_mp') {
        GS.player.stats.mp = Math.min(GS.player.stats.maxMp, GS.player.stats.mp + item.value);
        addLog(`Used ${item.name}: +${item.value} MP`);
      }
      // Remove item from inventory
      const idx = GS.player.items.indexOf(item);
      if (idx >= 0) GS.player.items.splice(idx, 1);
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('item');
      return true;
    }
    return false;
  }

  // ======== ENEMY TURN ========

  function enemyTurn() {
    if (!_enemy || _enemy.stats.hp <= 0) return;

    // Process status effects on enemy
    processEffects(_enemyEffects, _enemy.stats, _enemy.name);

    if (_enemy.stats.hp <= 0) {
      checkCombatEnd();
      return;
    }

    // Enemy AI decides action
    let action;
    if (typeof EnemyAI !== 'undefined') {
      action = EnemyAI.decide(_enemy, GS.player);
    }

    if (action && action.type === 'skill') {
      // Enemy uses skill
      const isPhysical = action.skill.damageType === 'physical';
      const { dmg, crit } = calcDamage(_enemy.stats, GS.player.stats, isPhysical, action.skill.power);
      applyDamage(GS.player.stats, dmg);
      addLog(`${_enemy.name} uses ${action.skill.name}: ${dmg} damage!${crit ? ' CRITICAL!' : ''}`);
      _flashTimer = 0.3;
      _flashColor = 'rgba(255,0,0,0.3)';
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX(action.skill.sfx || 'hit');
      if (typeof Particles !== 'undefined') Particles.emit('hit', Renderer.getWidth() * 0.3, Renderer.getHeight() * 0.5, 10);

      if (action.skill.statusEffect && Math.random() < (action.skill.statusChance || 0.3)) {
        _playerEffects.push({
          type: action.skill.statusEffect,
          turns: action.skill.statusDuration || 3,
          damage: action.skill.statusDamage || 0
        });
        addLog(`You are ${action.skill.statusEffect}!`);
      }
    } else if (action && action.type === 'heal') {
      const healAmt = Math.floor(_enemy.stats.maxHp * 0.2);
      applyHeal(_enemy.stats, healAmt);
      addLog(`${_enemy.name} heals for ${healAmt}!`);
    } else {
      // Basic attack
      const { dmg, crit } = calcDamage(_enemy.stats, GS.player.stats, true);
      applyDamage(GS.player.stats, dmg);
      addLog(`${_enemy.name} attacks for ${dmg}!${crit ? ' CRITICAL!' : ''}`);
      _flashTimer = 0.3;
      _flashColor = 'rgba(255,0,0,0.3)';
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('hit');
      if (typeof Particles !== 'undefined') Particles.emit('hit', Renderer.getWidth() * 0.3, Renderer.getHeight() * 0.5, 8);
    }

    // Process status effects on player
    processEffects(_playerEffects, GS.player.stats, 'You');

    // Remove expired defend buff
    for (let i = _playerEffects.length - 1; i >= 0; i--) {
      if (_playerEffects[i].type === 'defend') {
        GS.player.stats.def -= _playerEffects[i].defBonus;
        _playerEffects.splice(i, 1);
      }
    }

    checkCombatEnd();
  }

  function processEffects(effects, stats, name) {
    for (let i = effects.length - 1; i >= 0; i--) {
      const eff = effects[i];

      if (eff.type === 'poison' || eff.type === 'burn') {
        const dmg = eff.damage || Math.floor(stats.maxHp * 0.05);
        stats.hp = Math.max(0, stats.hp - dmg);
        addLog(`${name} takes ${dmg} ${eff.type} damage!`);
      } else if (eff.type === 'regen') {
        const heal = eff.damage || Math.floor(stats.maxHp * 0.05);
        stats.hp = Math.min(stats.maxHp, stats.hp + heal);
        addLog(`${name} regenerates ${heal} HP!`);
      }

      eff.turns--;
      if (eff.turns <= 0) {
        effects.splice(i, 1);
        if (eff.type === 'freeze') addLog(`${name} thaws out!`);
        else if (eff.type === 'stun') addLog(`${name} recovers from stun!`);
      }
    }
  }

  // ======== COMBAT END ========

  function checkCombatEnd() {
    if (_enemy.stats.hp <= 0) {
      _combatResult = 'victory';
      _resultTimer = 2;
    } else if (GS.player.stats.hp <= 0) {
      _combatResult = 'defeat';
      _resultTimer = 2;
    }
  }

  function handleVictory() {
    const xpBase = typeof Enemies !== 'undefined' ? (Enemies.get(_enemy.enemyType)?.xpReward || 25) : 25;
    const xp = Math.floor(xpBase * _enemy.level * (_enemy.isBoss ? 3 : 1));
    const gold = Utils.randomInt(5 * _enemy.level, 15 * _enemy.level) * (_enemy.isBoss ? 3 : 1);

    GS.player.stats.xp += xp;
    GS.player.stats.gold = (GS.player.stats.gold || 0) + gold;
    GS.player.gold = (GS.player.gold || 0) + gold;
    addLog(`Victory! +${xp} XP, +${gold} Gold`);

    // Loot drops
    if (typeof Items !== 'undefined' && typeof Enemies !== 'undefined') {
      const data = Enemies.get(_enemy.enemyType);
      if (data && data.lootTable) {
        for (const drop of data.lootTable) {
          if (Math.random() < drop.chance) {
            const item = Items.generateItem(_enemy.level, drop.rarity);
            if (item) {
              GS.player.items.push(item);
              addLog(`Dropped: ${item.name}`);
            }
          }
        }
      }
    }

    // Level up check
    checkLevelUp();

    // Mark enemy as defeated
    _enemy.alive = false;
    _enemy.defeated = true;
    if (_enemy.isBoss) {
      if (!GS.defeatedBosses) GS.defeatedBosses = [];
      if (!GS.defeatedBosses.includes(_enemy.name)) {
        GS.defeatedBosses.push(_enemy.name);
      }

      if (_enemy.isFinalBoss) {
        // Game won!
        _combatResult = 'final_victory';
        _resultTimer = 4;
        return;
      }
    }

    // Update quest progress
    if (typeof Quests !== 'undefined') {
      Quests.onEnemyKilled(_enemy.enemyType, _enemy.name);
    }
  }

  function checkLevelUp() {
    const stats = GS.player.stats;
    while (stats.xp >= stats.xpToNext) {
      stats.xp -= stats.xpToNext;
      stats.level++;
      stats.xpToNext = Math.floor(100 * Math.pow(1.5, stats.level - 1));

      // Stat growth based on class
      if (typeof Classes !== 'undefined') {
        Classes.applyLevelUp(GS.player.classType, stats);
      } else {
        stats.maxHp += 10;
        stats.maxMp += 5;
        stats.str += 2;
        stats.def += 2;
        stats.int += 2;
        stats.agi += 1;
        stats.luk += 1;
      }

      // Full heal on level up
      stats.hp = stats.maxHp;
      stats.mp = stats.maxMp;

      GS.player.skillPoints = (GS.player.skillPoints || 0) + 1;

      addLog(`** LEVEL UP! Now level ${stats.level}! **`);
      Core.addNotification(`Level Up! Lv.${stats.level}`, 4);
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('levelup');
      if (typeof Particles !== 'undefined') Particles.emit('levelup', Renderer.getWidth() / 2, Renderer.getHeight() / 2, 30);
    }
  }

  function handleDefeat() {
    addLog('You have been defeated...');
    // Lose some gold, respawn at town
    GS.player.stats.gold = Math.floor((GS.player.stats.gold || 0) * 0.7);
    GS.player.gold = GS.player.stats.gold;
    GS.player.stats.hp = Math.floor(GS.player.stats.maxHp * 0.5);
    GS.player.stats.mp = Math.floor(GS.player.stats.maxMp * 0.5);
  }

  function endCombat() {
    if (_combatResult === 'victory') {
      handleVictory();
    } else if (_combatResult === 'defeat') {
      handleDefeat();
    } else if (_combatResult === 'final_victory') {
      handleVictory();
      Core.setState(GameStates.VICTORY);
      return;
    }

    Core.setState(GameStates.PLAY);

    if (_combatResult === 'defeat') {
      // Respawn in town
      WorldManager.loadZone('eldergrove');
    }

    // Restore zone music
    const zone = WorldManager.getZone();
    if (zone && typeof AudioManager !== 'undefined') {
      AudioManager.playMusic(zone.music);
    }

    _enemy = null;
  }

  // ======== UPDATE (Handles input) ========

  function update(dt) {
    if (GS.state !== GameStates.COMBAT) return;

    // Screen effects
    if (_shakeTimer > 0) _shakeTimer -= dt;
    if (_flashTimer > 0) _flashTimer -= dt;

    // Result delay
    if (_combatResult) {
      _resultTimer -= dt;
      if (_resultTimer <= 0) {
        endCombat();
      }
      return;
    }

    // Animation delay
    if (_animating) {
      _animTimer -= dt;
      if (_animTimer <= 0) {
        _animating = false;
        if (_turnOrder[_currentTurn] === 'enemy') {
          enemyTurn();
          _currentTurn = (_currentTurn + 1) % _turnOrder.length;
          if (!_combatResult) {
            _selectedAction = 0;
            _subMenu = null;
          }
        }
      }
      return;
    }

    // Player turn input
    if (_turnOrder[_currentTurn] === 'player') {
      handlePlayerInput();
    }
  }

  function handlePlayerInput() {
    // Check for frozen/stunned
    const stunned = _playerEffects.some(e => e.type === 'stun' || e.type === 'freeze');
    if (stunned) {
      if (Input.actionPressed(Input.Actions.CONFIRM)) {
        addLog('You are stunned and cannot act!');
        endPlayerTurn();
      }
      return;
    }

    if (_subMenu === 'skills') {
      handleSkillMenu();
      return;
    }
    if (_subMenu === 'items') {
      handleItemMenu();
      return;
    }

    // Main action menu
    if (Input.actionPressed(Input.Actions.UP)) {
      _selectedAction = (_selectedAction - 1 + actions.length) % actions.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }
    if (Input.actionPressed(Input.Actions.DOWN)) {
      _selectedAction = (_selectedAction + 1) % actions.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    if (Input.actionPressed(Input.Actions.CONFIRM)) {
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_select');
      switch (actions[_selectedAction]) {
        case 'Attack':
          playerAttack();
          if (!_combatResult) endPlayerTurn();
          break;
        case 'Skills':
          if (GS.player.skills && GS.player.skills.length > 0) {
            _subMenu = 'skills';
            _selectedSkill = 0;
          } else {
            addLog('No skills learned yet!');
          }
          break;
        case 'Items':
          const usableItems = GS.player.items.filter(i => i.type === 'consumable');
          if (usableItems.length > 0) {
            _subMenu = 'items';
            _selectedItem = 0;
          } else {
            addLog('No usable items!');
          }
          break;
        case 'Defend':
          playerDefend();
          endPlayerTurn();
          break;
        case 'Flee':
          playerFlee();
          if (!_combatResult) endPlayerTurn();
          break;
      }
    }
  }

  function handleSkillMenu() {
    const skills = GS.player.skills || [];
    if (Input.actionPressed(Input.Actions.UP)) {
      _selectedSkill = (_selectedSkill - 1 + skills.length) % skills.length;
    }
    if (Input.actionPressed(Input.Actions.DOWN)) {
      _selectedSkill = (_selectedSkill + 1) % skills.length;
    }
    if (Input.actionPressed(Input.Actions.CONFIRM)) {
      if (playerUseSkill(skills[_selectedSkill])) {
        if (!_combatResult) endPlayerTurn();
      }
    }
    if (Input.actionPressed(Input.Actions.CANCEL)) {
      _subMenu = null;
    }
  }

  function handleItemMenu() {
    const items = GS.player.items.filter(i => i.type === 'consumable');
    if (items.length === 0) { _subMenu = null; return; }
    if (Input.actionPressed(Input.Actions.UP)) {
      _selectedItem = (_selectedItem - 1 + items.length) % items.length;
    }
    if (Input.actionPressed(Input.Actions.DOWN)) {
      _selectedItem = (_selectedItem + 1) % items.length;
    }
    if (Input.actionPressed(Input.Actions.CONFIRM)) {
      if (playerUseItem(items[_selectedItem])) {
        endPlayerTurn();
      }
    }
    if (Input.actionPressed(Input.Actions.CANCEL)) {
      _subMenu = null;
    }
  }

  function endPlayerTurn() {
    _currentTurn = (_currentTurn + 1) % _turnOrder.length;
    _animating = true;
    _animTimer = 0.6;
  }

  // ======== RENDER ========

  function render() {
    if (GS.state !== GameStates.COMBAT) return;

    const ctx = Renderer.getCtx();
    const w = Renderer.getWidth();
    const h = Renderer.getHeight();

    // Background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, w, h);

    // Combat arena background
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Ground line
    ctx.fillStyle = '#2a2a4a';
    ctx.fillRect(0, h * 0.65, w, h * 0.35);

    // Screen shake
    if (_shakeTimer > 0) {
      ctx.save();
      ctx.translate(
        (Math.random() - 0.5) * 8 * _shakeTimer,
        (Math.random() - 0.5) * 8 * _shakeTimer
      );
    }

    // Draw enemy sprite (right side)
    if (_enemy) {
      const enemySprite = SpriteGen.cache.enemies[_enemy.enemyType];
      if (enemySprite) {
        const scale = _enemy.isBoss ? 5 : 4;
        const ex = w * 0.65 - (enemySprite.width * scale) / 2;
        const ey = h * 0.35 - (enemySprite.height * scale) / 2;
        if (_enemy.stats.hp > 0) {
          ctx.drawImage(enemySprite, ex, ey, enemySprite.width * scale, enemySprite.height * scale);
        } else {
          ctx.globalAlpha = 0.5;
          ctx.drawImage(enemySprite, ex, ey, enemySprite.width * scale, enemySprite.height * scale);
          ctx.globalAlpha = 1;
        }
      }

      // Enemy name & HP
      Renderer.drawText(_enemy.name + ` Lv.${_enemy.level}`, w * 0.55, 20, _enemy.isBoss ? '#ff4444' : '#fff', 18, 'left', true);
      Renderer.drawBar(w * 0.55, 45, 250, 16, _enemy.stats.hp / _enemy.stats.maxHp, '#c00', '#400');
      Renderer.drawText(`${_enemy.stats.hp}/${_enemy.stats.maxHp}`, w * 0.55 + 125, 47, '#fff', 11, 'center');

      // Enemy status effects
      let seX = w * 0.55;
      for (const eff of _enemyEffects) {
        const colors = { poison: '#a0f', burn: '#f80', freeze: '#08f', stun: '#ff0', regen: '#0f0' };
        Renderer.drawText(eff.type, seX, 68, colors[eff.type] || '#fff', 10, 'left');
        seX += 50;
      }
    }

    // Draw player sprite (left side)
    const cls = GS.player.classType || 'warrior';
    const pSprite = SpriteGen.cache.player[cls].right[0];
    if (pSprite) {
      ctx.drawImage(pSprite, w * 0.15, h * 0.3, pSprite.width * 4, pSprite.height * 4);
    }

    if (_shakeTimer > 0) ctx.restore();

    // Flash overlay
    if (_flashTimer > 0) {
      ctx.fillStyle = _flashColor;
      ctx.fillRect(0, 0, w, h);
    }

    // Player stats panel
    Renderer.drawPanel(10, h - 170, 300, 160);
    const ps = GS.player.stats;
    Renderer.drawText(`${GS.player.name || GS.player.classType} Lv.${ps.level}`, 20, h - 160, '#fff', 16);
    Renderer.drawBar(20, h - 138, 200, 14, ps.hp / ps.maxHp, '#0a0', '#040');
    Renderer.drawText(`HP: ${ps.hp}/${ps.maxHp}`, 230, h - 137, '#fff', 11);
    Renderer.drawBar(20, h - 118, 200, 14, ps.mp / ps.maxMp, '#06a', '#024');
    Renderer.drawText(`MP: ${ps.mp}/${ps.maxMp}`, 230, h - 117, '#fff', 11);

    // Player status effects
    let peX = 20;
    for (const eff of _playerEffects) {
      const colors = { poison: '#a0f', burn: '#f80', freeze: '#08f', stun: '#ff0', defend: '#88f', regen: '#0f0' };
      Renderer.drawText(eff.type, peX, h - 96, colors[eff.type] || '#fff', 10);
      peX += 50;
    }

    // Action menu
    if (!_combatResult && _turnOrder[_currentTurn] === 'player' && !_animating) {
      if (_subMenu === 'skills') {
        renderSkillMenu(w, h);
      } else if (_subMenu === 'items') {
        renderItemMenu(w, h);
      } else {
        Renderer.drawPanel(w - 200, h - 200, 180, 190);
        for (let i = 0; i < actions.length; i++) {
          const sel = i === _selectedAction;
          const color = sel ? '#ffcc00' : '#aaa';
          const prefix = sel ? '> ' : '  ';
          Renderer.drawText(prefix + actions[i], w - 185, h - 188 + i * 34, color, 16);
        }
      }
    }

    // Turn indicator
    if (!_combatResult) {
      const turnText = _turnOrder[_currentTurn] === 'player' ? 'YOUR TURN' : 'ENEMY TURN';
      const turnColor = _turnOrder[_currentTurn] === 'player' ? '#4f4' : '#f44';
      Renderer.drawText(turnText, w / 2, h * 0.62, turnColor, 14, 'center', true);
    }

    // Combat log
    Renderer.drawPanel(10, h - 340, 400, 160);
    for (let i = 0; i < _combatLog.length; i++) {
      Renderer.drawText(_combatLog[i], 20, h - 330 + i * 22, '#ddd', 12);
    }

    // Result text
    if (_combatResult) {
      const texts = {
        victory: 'VICTORY!',
        defeat: 'DEFEATED...',
        fled: 'ESCAPED!',
        final_victory: 'THE REALM IS SAVED!'
      };
      const colors = {
        victory: '#ffcc00',
        defeat: '#ff4444',
        fled: '#aaaaaa',
        final_victory: '#ffcc00'
      };
      Renderer.drawText(texts[_combatResult], w / 2, h * 0.3, colors[_combatResult], 36, 'center', true);
    }
  }

  function renderSkillMenu(w, h) {
    const skills = GS.player.skills || [];
    Renderer.drawPanel(w - 280, h - 200, 260, 190);
    Renderer.drawText('Skills (ESC to back)', w - 270, h - 195, '#aaa', 12);

    for (let i = 0; i < skills.length && i < 6; i++) {
      const sel = i === _selectedSkill;
      const skill = skills[i];
      const canUse = GS.player.stats.mp >= skill.mpCost;
      const color = sel ? '#ffcc00' : (canUse ? '#aaa' : '#555');
      const prefix = sel ? '> ' : '  ';
      Renderer.drawText(`${prefix}${skill.name} (${skill.mpCost} MP)`, w - 270, h - 175 + i * 28, color, 13);
    }
  }

  function renderItemMenu(w, h) {
    const items = GS.player.items.filter(i => i.type === 'consumable');
    Renderer.drawPanel(w - 280, h - 200, 260, 190);
    Renderer.drawText('Items (ESC to back)', w - 270, h - 195, '#aaa', 12);

    for (let i = 0; i < items.length && i < 6; i++) {
      const sel = i === _selectedItem;
      const color = sel ? '#ffcc00' : '#aaa';
      const prefix = sel ? '> ' : '  ';
      Renderer.drawText(`${prefix}${items[i].name}`, w - 270, h - 175 + i * 28, color, 13);
    }
  }

  return { startCombat, update, render, checkLevelUp };
})();
