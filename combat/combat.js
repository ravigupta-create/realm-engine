// combat/combat.js — Turn-based combat engine with multi-enemy + ally party support

const Combat = (() => {
  let _enemies = [];
  let _allies = [];  // Party members fighting alongside player
  let _turnOrder = [];
  let _currentTurnIdx = 0;
  let _combatLog = [];
  let _animating = false;
  let _animTimer = 0;
  let _selectedAction = 0;
  let _selectedSkill = 0;
  let _selectedItem = 0;
  let _selectedTarget = 0;
  let _subMenu = null;  // null, 'skills', 'items', 'target_enemy', 'target_ally'
  let _pendingAction = null;
  let _statusEffectsPlayer = [];
  let _statusEffectsMap = {};  // entityId → [{type, turns, damage}]
  let _shakeTimer = 0;
  let _flashTimer = 0;
  let _flashColor = '';
  let _combatResult = null;
  let _resultTimer = 0;
  let _turnCounter = 0;
  let _comboCounter = 0;
  let _lastDamageType = null;
  let _playerDamageTaken = 0;

  // Floating damage numbers
  const _floatingNumbers = [];
  function addFloatingNumber(x, y, text, color, size) {
    _floatingNumbers.push({ x, y, text: String(text), color: color || '#fff', size: size || 18, life: 1.2, maxLife: 1.2 });
  }
  function updateFloatingNumbers(dt) {
    for (let i = _floatingNumbers.length - 1; i >= 0; i--) {
      const fn = _floatingNumbers[i];
      fn.life -= dt;
      fn.y -= 40 * dt;
      if (fn.life <= 0) _floatingNumbers.splice(i, 1);
    }
  }
  function renderFloatingNumbers() {
    const ctx = Renderer.getCtx();
    for (const fn of _floatingNumbers) {
      const alpha = Math.min(1, fn.life / (fn.maxLife * 0.3));
      const scale = fn.life > fn.maxLife * 0.8 ? 1 + (fn.life - fn.maxLife * 0.8) / (fn.maxLife * 0.2) * 0.3 : 1;
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${Math.floor(fn.size * scale)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000';
      ctx.fillText(fn.text, fn.x + 1, fn.y + 1);
      ctx.fillStyle = fn.color;
      ctx.fillText(fn.text, fn.x, fn.y);
    }
    ctx.globalAlpha = 1;
  }

  const actions = ['Attack', 'Skills', 'Items', 'Defend', 'Flee'];

  function startCombat(enemyOrEnemies) {
    // Support single enemy or array
    if (Array.isArray(enemyOrEnemies)) {
      _enemies = enemyOrEnemies.filter(e => e && e.alive !== false);
    } else {
      _enemies = [enemyOrEnemies];
    }

    // Initialize enemy stats
    for (const enemy of _enemies) {
      if (!enemy.stats && typeof Enemies !== 'undefined') {
        enemy.stats = Enemies.getScaledStats(enemy.enemyType, enemy.level);
      }
      if (!enemy.stats) {
        enemy.stats = {
          hp: 50 + enemy.level * 20, maxHp: 50 + enemy.level * 20,
          mp: 20 + enemy.level * 10, maxMp: 20 + enemy.level * 10,
          str: 8 + enemy.level * 2, def: 5 + enemy.level * 2,
          int: 5 + enemy.level * 2, agi: 5 + enemy.level * 2,
          luk: 5 + enemy.level
        };
      }
      if (!enemy.abilities) {
        const data = typeof Enemies !== 'undefined' ? Enemies.get(enemy.enemyType) : null;
        enemy.abilities = data ? data.abilities || [] : [];
      }
      _statusEffectsMap[enemy.id || enemy.name] = [];
    }

    // Gather allies from party
    _allies = [];
    if (typeof Allies !== 'undefined' && GS.player.party) {
      for (const allyData of GS.player.party) {
        if (allyData.alive !== false) {
          _allies.push(allyData);
          _statusEffectsMap[allyData.id] = [];
        }
      }
    }

    _combatLog = [];
    _animating = false;
    _selectedAction = 0;
    _subMenu = null;
    _pendingAction = null;
    _statusEffectsPlayer = [];
    _combatResult = null;
    _resultTimer = 0;
    _shakeTimer = 0;
    _turnCounter = 0;
    _comboCounter = 0;
    _lastDamageType = null;
    _playerDamageTaken = 0;
    _floatingNumbers.length = 0;

    // Reset pet revive flag
    if (GS.player.activePet) GS.player.activePet._reviveUsed = false;

    // Build turn order by AGI (all combatants)
    buildTurnOrder();

    const names = _enemies.map(e => e.name).join(', ');
    addLog(`${names} appeared!`);
    if (_enemies.some(e => e.isBoss)) addLog('** BOSS BATTLE **');
    if (_enemies.length > 1) addLog(`${_enemies.length} enemies!`);
    if (_allies.length > 0) addLog(`Allies: ${_allies.map(a => a.name).join(', ')}`);

    Core.setState(GameStates.COMBAT);
    if (typeof AudioManager !== 'undefined') {
      AudioManager.playSFX('combat_start');
      AudioManager.playMusic(_enemies.some(e => e.isBoss) ? 'boss' : 'combat');
    }

    // If first turn is not player, auto-advance
    if (getCurrentTurnEntity().type !== 'player') {
      _animating = true;
      _animTimer = 0.8;
    }
  }

  function buildTurnOrder() {
    _turnOrder = [];
    // Player
    _turnOrder.push({ type: 'player', entity: GS.player, agi: GS.player.stats.agi });
    // Allies
    for (const ally of _allies) {
      _turnOrder.push({ type: 'ally', entity: ally, agi: ally.stats.agi });
    }
    // Enemies
    for (const enemy of _enemies) {
      _turnOrder.push({ type: 'enemy', entity: enemy, agi: enemy.stats.agi });
    }
    // Sort by AGI descending
    _turnOrder.sort((a, b) => b.agi - a.agi);
    _currentTurnIdx = 0;
  }

  function getCurrentTurnEntity() {
    if (_turnOrder.length === 0) return { type: 'player', entity: GS.player };
    return _turnOrder[_currentTurnIdx % _turnOrder.length];
  }

  function advanceTurn() {
    _turnCounter++;
    // Remove dead entities from turn order
    _turnOrder = _turnOrder.filter(t => {
      if (t.type === 'enemy') return t.entity.stats.hp > 0;
      if (t.type === 'ally') return t.entity.stats.hp > 0;
      return true;
    });
    if (_turnOrder.length === 0) return;
    _currentTurnIdx = (_currentTurnIdx + 1) % _turnOrder.length;
  }

  function addLog(text) {
    _combatLog.push(text);
    if (_combatLog.length > 8) _combatLog.shift();
  }

  // ======== DAMAGE SYSTEM ========

  function calcDamage(attacker, defender, isPhysical, skillPower, element) {
    const base = isPhysical ? attacker.str : attacker.int;
    const power = skillPower || 1;
    const atk = base * power * (1 + base / 50);
    const defStat = isPhysical ? defender.def : Math.floor(defender.def * 0.5);
    const reduction = 1 - defStat / (defStat + 100);
    const variance = 0.85 + Math.random() * 0.3;
    let dmg = Math.floor(atk * reduction * variance);

    // Elemental multiplier (supports both flat format and array format)
    if (element) {
      if (defender.elements) {
        if (defender.elements.weak && defender.elements.weak.includes(element)) dmg = Math.floor(dmg * 1.5);
        if (defender.elements.resist && defender.elements.resist.includes(element)) dmg = Math.floor(dmg * 0.5);
        if (defender.elements.immune && defender.elements.immune.includes(element)) dmg = 0;
      } else {
        if (defender.weakness === element) dmg = Math.floor(dmg * 1.5);
        if (defender.resistance === element) dmg = Math.floor(dmg * 0.5);
      }
    }

    // Day/night element bonuses
    if (typeof DayNight !== 'undefined') {
      const mods = DayNight.getCombatModifiers();
      if (element === 'dark' && mods.darkElementBonus) dmg = Math.floor(dmg * (1 + mods.darkElementBonus));
      if ((element === 'light' || element === 'holy') && mods.lightElementBonus) dmg = Math.floor(dmg * (1 + mods.lightElementBonus));
    }

    // Combo bonus
    if (_lastDamageType === element && element) {
      _comboCounter++;
      dmg = Math.floor(dmg * (1 + _comboCounter * 0.1));
    } else {
      _comboCounter = 0;
    }
    _lastDamageType = element;

    // Critical hit (pet crit boost)
    let critBoost = 0;
    if (attacker === GS.player.stats && GS.player.activePet && GS.player.activePet.combatBonus && GS.player.activePet.combatBonus.type === 'crit_boost') {
      critBoost = GS.player.activePet.combatBonus.amount || 0;
    }
    const critChance = Utils.clamp(attacker.luk / 200 + critBoost, 0.02, 0.5);
    let crit = false;
    if (Math.random() < critChance) {
      dmg = Math.floor(dmg * (1.5 + (attacker.luk / 100)));
      crit = true;
    }

    // Difficulty/NG+ scaling
    if (typeof NewGamePlus !== 'undefined' && GS.ngPlus) {
      // NG+ enemies deal more damage
    }

    return { dmg: Math.max(1, dmg), crit, element };
  }

  function applyDamage(target, dmg) {
    const wasDead = target.hp <= 0;
    target.hp = Math.max(0, target.hp - dmg);
    if (target === GS.player.stats) _playerDamageTaken += dmg;
    if (!wasDead && target.hp <= 0) {
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('death');
      if (typeof Particles !== 'undefined') {
        const w = Renderer.getWidth();
        const h = Renderer.getHeight();
        const isEnemy = target !== GS.player.stats;
        Particles.emit('death', isEnemy ? w * 0.65 : w * 0.15, h * 0.4, 20);
      }
    }
  }

  function applyHeal(target, amount) {
    target.hp = Math.min(target.maxHp, target.hp + amount);
  }

  // Get a live enemy for targeting
  function getLiveEnemies() {
    return _enemies.filter(e => e.stats.hp > 0);
  }

  function getLiveAllies() {
    return _allies.filter(a => a.stats.hp > 0);
  }

  function getTargetEnemy() {
    const live = getLiveEnemies();
    if (live.length === 0) return null;
    return live[Utils.clamp(_selectedTarget, 0, live.length - 1)];
  }

  // ======== PLAYER ACTIONS ========

  // Enchant special effects (lifesteal, thorns, mp_regen, etc.)
  function applyEnchantEffects(dmgDealt) {
    const eq = GS.player.equipment;
    if (!eq) return;
    for (const slot of ['weapon', 'armor', 'helmet', 'boots', 'ring', 'amulet']) {
      const item = eq[slot];
      if (!item || !item.enchant || !item.enchant.special) continue;
      const sp = item.enchant.special;
      if (sp === 'lifesteal' && dmgDealt > 0) {
        const heal = Math.floor(dmgDealt * 0.15);
        applyHeal(GS.player.stats, heal);
        addFloatingNumber(Renderer.getWidth() * 0.15, Renderer.getHeight() * 0.35, `+${heal}`, '#0f0', 14);
      } else if (sp === 'mp_on_hit' && dmgDealt > 0) {
        const mp = Math.min(5, GS.player.stats.maxMp - GS.player.stats.mp);
        GS.player.stats.mp += mp;
        if (mp > 0) addFloatingNumber(Renderer.getWidth() * 0.15, Renderer.getHeight() * 0.4, `+${mp} MP`, '#88f', 12);
      }
    }
  }

  function applyThornsEffect(attacker) {
    const eq = GS.player.equipment;
    if (!eq) return;
    for (const slot of ['weapon', 'armor', 'helmet', 'boots', 'ring', 'amulet']) {
      const item = eq[slot];
      if (!item || !item.enchant || !item.enchant.special) continue;
      if (item.enchant.special === 'thorns') {
        const thornDmg = Math.floor(GS.player.stats.def * 0.2);
        applyDamage(attacker.stats, thornDmg);
        addLog(`Thorns reflect ${thornDmg} damage!`);
        addFloatingNumber(Renderer.getWidth() * 0.65, Renderer.getHeight() * 0.35, thornDmg, '#a86', 14);
      }
    }
  }

  // Pet combat bonus
  function applyPetCombatBonus(dmgDealt, target) {
    const pet = GS.player.activePet;
    if (!pet || !pet.combatBonus) return;
    const cb = pet.combatBonus;
    if (cb.type === 'bonus_damage' && dmgDealt > 0) {
      const bonus = cb.amount || 5;
      applyDamage(target.stats, bonus);
      addFloatingNumber(Renderer.getWidth() * 0.65, Renderer.getHeight() * 0.3, `+${bonus}`, '#f80', 12);
    } else if (cb.type === 'dot' && Math.random() < (cb.chance || 0.1)) {
      const effType = cb.element === 'freeze' ? 'freeze' : 'poison';
      addStatusEffect(target, effType, 2, cb.damage || 3);
      addLog(`${pet.name} inflicts ${effType}!`);
    } else if (cb.type === 'crit_boost') {
      // Handled in calcDamage
    } else if (cb.type === 'mp_regen') {
      const mp = Math.min(cb.amount || 3, GS.player.stats.maxMp - GS.player.stats.mp);
      GS.player.stats.mp += mp;
    }
  }

  function playerAttack() {
    const target = getTargetEnemy();
    if (!target) return;
    const { dmg, crit } = calcDamage(GS.player.stats, target.stats, true);
    applyDamage(target.stats, dmg);
    addLog(`You attack ${target.name} for ${dmg}!${crit ? ' CRIT!' : ''}`);
    _shakeTimer = 0.3;
    if (typeof AudioManager !== 'undefined') AudioManager.playSFX(crit ? 'critical' : 'hit');
    const ex = getEnemyScreenX(getLiveEnemies().indexOf(target));
    const ey = Renderer.getHeight() * 0.35;
    addFloatingNumber(ex, ey, crit ? `${dmg} CRIT!` : dmg, crit ? '#ff0' : '#fff', crit ? 24 : 18);
    if (typeof Particles !== 'undefined') {
      Particles.emit(crit ? 'critical' : 'hit', ex, Renderer.getHeight() * 0.4, crit ? 20 : 10);
    }
    applyEnchantEffects(dmg);
    applyPetCombatBonus(dmg, target);
    checkCombatEnd();
  }

  function playerDefend() {
    _statusEffectsPlayer.push({ type: 'defend', turns: 1, defBonus: Math.floor(GS.player.stats.def * 0.5) });
    GS.player.stats.def += Math.floor(GS.player.stats.def * 0.5);
    addLog('You take a defensive stance!');
    if (typeof AudioManager !== 'undefined') AudioManager.playSFX('defend');
  }

  function playerFlee() {
    if (_enemies.some(e => e.isBoss)) {
      addLog('Cannot flee from a boss!');
      return;
    }
    const avgEagi = _enemies.reduce((s, e) => s + e.stats.agi, 0) / _enemies.length;
    const chance = 0.4 + (GS.player.stats.agi - avgEagi) * 0.05;
    if (Math.random() < chance) {
      addLog('You fled!');
      _combatResult = 'fled';
      _resultTimer = 1.5;
    } else {
      addLog('Failed to flee!');
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
      if (skill.targetType === 'all_allies') {
        applyHeal(GS.player.stats, healAmt);
        addLog(`${skill.name}: You heal ${healAmt} HP!`);
        addFloatingNumber(Renderer.getWidth() * 0.15, Renderer.getHeight() * 0.35, `+${healAmt}`, '#0f0', 20);
        for (const ally of getLiveAllies()) {
          applyHeal(ally.stats, Math.floor(healAmt * 0.7));
          addLog(`${ally.name} heals ${Math.floor(healAmt * 0.7)} HP!`);
        }
      } else {
        applyHeal(GS.player.stats, healAmt);
        addLog(`${skill.name}: Healed ${healAmt} HP!`);
        addFloatingNumber(Renderer.getWidth() * 0.15, Renderer.getHeight() * 0.35, `+${healAmt}`, '#0f0', 20);
      }
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('heal');
      if (typeof Particles !== 'undefined') Particles.emit('heal', Renderer.getWidth() * 0.25, Renderer.getHeight() * 0.5, 15);
    } else if (skill.type === 'buff') {
      const buff = { type: skill.effect, turns: skill.duration || 3, ...skill.buffData };
      // Apply stat bonuses immediately
      if (buff.strBonus) GS.player.stats.str += buff.strBonus;
      if (buff.defBonus) GS.player.stats.def += buff.defBonus;
      if (buff.agiBonus) GS.player.stats.agi += buff.agiBonus;
      if (buff.intBonus) GS.player.stats.int += buff.intBonus;
      if (buff.hpBonus) { GS.player.stats.maxHp += buff.hpBonus; GS.player.stats.hp += buff.hpBonus; }
      _statusEffectsPlayer.push(buff);
      addLog(`${skill.name}: Buff applied!`);
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('buff');
      if (typeof Particles !== 'undefined') Particles.emit('buff', Renderer.getWidth() * 0.15, Renderer.getHeight() * 0.4, 12);
    } else if (skill.type === 'summon' && typeof Allies !== 'undefined') {
      const summon = Allies.createSummon(skill.summonType, GS.player.stats.level);
      if (summon) {
        _allies.push(summon);
        _turnOrder.push({ type: 'ally', entity: summon, agi: summon.stats.agi });
        _statusEffectsMap[summon.id] = [];
        addLog(`${skill.name}: ${summon.name} appears!`);
      }
    } else {
      // Damage skill — AoE or single target
      const isPhysical = skill.damageType === 'physical';
      const element = skill.element || null;
      const elementColors = { fire: '#f80', ice: '#8cf', lightning: '#ff0', dark: '#a0f', light: '#ffa', earth: '#a86', arcane: '#c6f', poison: '#0a0' };
      const dmgColor = elementColors[element] || (crit => crit ? '#ff0' : '#fff');

      if (skill.targetType === 'all_enemies' || skill.aoe) {
        const live = getLiveEnemies();
        for (let ei = 0; ei < live.length; ei++) {
          const enemy = live[ei];
          const { dmg, crit } = calcDamage(GS.player.stats, enemy.stats, isPhysical, skill.power, element);
          applyDamage(enemy.stats, dmg);
          addLog(`${skill.name} → ${enemy.name}: ${dmg}${crit ? ' CRIT!' : ''}`);
          const esx = getEnemyScreenX(ei);
          const c = typeof dmgColor === 'function' ? dmgColor(crit) : dmgColor;
          addFloatingNumber(esx + (Math.random() - 0.5) * 30, Renderer.getHeight() * 0.3, crit ? `${dmg}!` : dmg, c, crit ? 22 : 16);
          if (skill.statusEffect && Math.random() < (skill.statusChance || 0.3)) {
            addStatusEffect(enemy, skill.statusEffect, skill.statusDuration || 3, skill.statusDamage || 0);
          }
        }
      } else {
        const target = getTargetEnemy();
        if (!target) return false;
        const hitCount = skill.hits || 1;
        let totalDmg = 0;
        for (let hit = 0; hit < hitCount; hit++) {
          if (target.stats.hp <= 0) break;
          const { dmg, crit } = calcDamage(GS.player.stats, target.stats, isPhysical, skill.power, element);
          applyDamage(target.stats, dmg);
          totalDmg += dmg;
          const esx = getEnemyScreenX(getLiveEnemies().indexOf(target));
          const c = typeof dmgColor === 'function' ? dmgColor(crit) : dmgColor;
          addFloatingNumber(esx + (hit * 15), Renderer.getHeight() * 0.3 - (hit * 15), crit ? `${dmg}!` : dmg, c, crit ? 24 : 18);
          if (hitCount > 1) addLog(`${skill.name} hit ${hit + 1} → ${target.name}: ${dmg}${crit ? ' CRIT!' : ''}`);
        }
        if (hitCount === 1) addLog(`${skill.name} → ${target.name}: ${totalDmg}${''}`);
        if (skill.statusEffect && Math.random() < (skill.statusChance || 0.3)) {
          addStatusEffect(target, skill.statusEffect, skill.statusDuration || 3, skill.statusDamage || 0);
          addLog(`${target.name} is ${skill.statusEffect}!`);
        }
      }
      // Special effects
      if (skill.special === 'lifesteal') {
        const totalDmg = (skill.targetType === 'all_enemies' || skill.aoe) ?
          getLiveEnemies().reduce((s, e) => s + Math.floor(GS.player.stats.int * skill.power * 0.3), 0) :
          Math.floor(GS.player.stats.int * skill.power * 0.3);
        const healAmt = Math.floor(totalDmg * 0.3);
        applyHeal(GS.player.stats, healAmt);
        addLog(`Drained ${healAmt} HP!`);
        addFloatingNumber(Renderer.getWidth() * 0.15, Renderer.getHeight() * 0.35, `+${healAmt}`, '#0f0', 16);
      }
      if (skill.special === 'steal_gold') {
        const stolen = Utils.randomInt(5, 20);
        GS.player.gold = (GS.player.gold || 0) + stolen;
        GS.player.stats.gold = GS.player.gold;
        addLog(`Stole ${stolen} gold!`);
        addFloatingNumber(Renderer.getWidth() * 0.15, Renderer.getHeight() * 0.4, `+${stolen}g`, '#fc0', 16);
      }
      _shakeTimer = 0.4;
      // Element-specific SFX
      const sfxMap = { fire: 'fire', ice: 'ice', lightning: 'lightning', dark: 'dark', light: 'holy', holy: 'holy', earth: 'earth', poison: 'poison', arcane: 'arcane' };
      const elementSfx = (element && sfxMap[element]) || skill.sfx || 'magic';
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX(elementSfx);
      if (typeof Particles !== 'undefined') {
        const pTypeMap = { light: 'holy', arcane: 'arcane' };
        const pType = pTypeMap[element] || element || skill.particleType || 'magic';
        Particles.emit(pType, Renderer.getWidth() * 0.65, Renderer.getHeight() * 0.4, 20);
      }
    }
    if (typeof DailyChallenges !== 'undefined') DailyChallenges.onSkillUsed();
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
      } else if (item.effect === 'heal_all') {
        applyHeal(GS.player.stats, item.value);
        for (const ally of getLiveAllies()) applyHeal(ally.stats, item.value);
        addLog(`Used ${item.name}: All healed ${item.value} HP`);
      } else if (item.effect === 'cure_poison') {
        _statusEffectsPlayer = _statusEffectsPlayer.filter(e => e.type !== 'poison');
        addLog(`Used ${item.name}: Cured!`);
      } else if (item.effect === 'heal_both') {
        applyHeal(GS.player.stats, item.value);
        GS.player.stats.mp = Math.min(GS.player.stats.maxMp, GS.player.stats.mp + item.value);
        addLog(`Used ${item.name}: +${item.value} HP & MP`);
      } else if (item.effect === 'revive') {
        // Revive first dead ally
        const dead = _allies.find(a => a.stats.hp <= 0);
        if (dead) {
          dead.stats.hp = Math.floor(dead.stats.maxHp * 0.5);
          addLog(`Revived ${dead.name}!`);
        }
      } else if (item.effect === 'buff_str') {
        _statusEffectsPlayer.push({ type: 'berserk', turns: 5, strBonus: item.value });
        GS.player.stats.str += item.value;
        addLog(`Used ${item.name}: +${item.value} STR`);
      } else if (item.effect === 'buff_def') {
        _statusEffectsPlayer.push({ type: 'iron_wall', turns: 5, defBonus: item.value });
        GS.player.stats.def += item.value;
        addLog(`Used ${item.name}: +${item.value} DEF`);
      } else if (item.effect === 'buff_agi') {
        _statusEffectsPlayer.push({ type: 'stealth', turns: 5, agiBonus: item.value });
        GS.player.stats.agi += item.value;
        addLog(`Used ${item.name}: +${item.value} AGI`);
      }
      const idx = GS.player.items.indexOf(item);
      if (idx >= 0) GS.player.items.splice(idx, 1);
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('item');
      return true;
    }
    return false;
  }

  function addStatusEffect(entity, type, turns, damage) {
    const id = entity.id || entity.name;
    if (!_statusEffectsMap[id]) _statusEffectsMap[id] = [];
    // Boss immunity to stun/freeze
    if (entity.isBoss && (type === 'stun' || type === 'freeze')) {
      if (Math.random() < 0.7) {
        addLog(`${entity.name} resists ${type}!`);
        return;
      }
    }
    _statusEffectsMap[id].push({ type, turns, damage });
  }

  // ======== ALLY TURN ========

  function allyTurn(ally) {
    if (ally.stats.hp <= 0) return;

    // Process status effects
    processEntityEffects(ally);
    if (ally.stats.hp <= 0) { addLog(`${ally.name} fell!`); return; }

    // Simple ally AI
    const hpRatio = ally.stats.hp / ally.stats.maxHp;

    // Heal player if low
    if (hpRatio > 0.5 && GS.player.stats.hp / GS.player.stats.maxHp < 0.3 && ally.stats.mp >= 10) {
      if (ally.role === 'healer' || ally.role === 'support') {
        const heal = Math.floor(ally.stats.int * 0.8);
        applyHeal(GS.player.stats, heal);
        ally.stats.mp -= 10;
        addLog(`${ally.name} heals you for ${heal}!`);
        if (typeof AudioManager !== 'undefined') AudioManager.playSFX('heal');
        return;
      }
    }

    // Attack weakest enemy
    const liveEnemies = getLiveEnemies();
    if (liveEnemies.length === 0) return;
    const target = liveEnemies.reduce((a, b) => a.stats.hp < b.stats.hp ? a : b);

    // Use skill if available
    if (ally.abilities && ally.abilities.length > 0 && ally.stats.mp >= 5 && Math.random() > 0.4) {
      const usable = ally.abilities.filter(a => ally.stats.mp >= (a.mpCost || 0));
      if (usable.length > 0) {
        const skill = usable[Math.floor(Math.random() * usable.length)];
        ally.stats.mp -= skill.mpCost || 0;
        const isPhys = skill.damageType === 'physical';
        const { dmg, crit } = calcDamage(ally.stats, target.stats, isPhys, skill.power || 1);
        applyDamage(target.stats, dmg);
        addLog(`${ally.name}: ${skill.name} → ${target.name} ${dmg}${crit ? ' CRIT!' : ''}`);
        if (typeof AudioManager !== 'undefined') AudioManager.playSFX(skill.sfx || 'hit');
        checkCombatEnd();
        return;
      }
    }

    // Basic attack
    const { dmg, crit } = calcDamage(ally.stats, target.stats, true);
    applyDamage(target.stats, dmg);
    addLog(`${ally.name} attacks ${target.name}: ${dmg}${crit ? ' CRIT!' : ''}`);
    if (typeof AudioManager !== 'undefined') AudioManager.playSFX('hit');
    checkCombatEnd();
  }

  // ======== ENEMY TURN ========

  function enemyTurn(enemy) {
    if (enemy.stats.hp <= 0) return;

    // Process status effects
    processEntityEffects(enemy);
    if (enemy.stats.hp <= 0) { checkCombatEnd(); return; }

    // Check stunned/frozen
    const effects = _statusEffectsMap[enemy.id || enemy.name] || [];
    if (effects.some(e => e.type === 'stun' || e.type === 'freeze')) {
      addLog(`${enemy.name} is ${effects.find(e => e.type === 'stun' || e.type === 'freeze').type}!`);
      return;
    }

    // Enemy AI
    let action;
    if (typeof EnemyAI !== 'undefined') {
      action = EnemyAI.decide(enemy, GS.player);
    }

    // Choose target (player or weakest ally)
    let targetStats = GS.player.stats;
    let targetName = GS.player.name || 'You';
    const liveAllies = getLiveAllies();
    if (liveAllies.length > 0 && Math.random() < 0.3) {
      const allyTarget = liveAllies[Math.floor(Math.random() * liveAllies.length)];
      targetStats = allyTarget.stats;
      targetName = allyTarget.name;
    }

    if (action && action.type === 'skill') {
      const isPhys = action.skill.damageType === 'physical';
      const element = action.skill.element || null;

      if (action.skill.targetType === 'all_enemies' || action.skill.aoe) {
        // AoE against player + allies
        const { dmg: pdmg } = calcDamage(enemy.stats, GS.player.stats, isPhys, action.skill.power, element);
        applyDamage(GS.player.stats, pdmg);
        addLog(`${enemy.name}: ${action.skill.name} → You ${pdmg}!`);
        addFloatingNumber(Renderer.getWidth() * 0.15, Renderer.getHeight() * 0.3, pdmg, '#f44', 20);
        for (const ally of getLiveAllies()) {
          const { dmg: admg } = calcDamage(enemy.stats, ally.stats, isPhys, action.skill.power * 0.7, element);
          applyDamage(ally.stats, admg);
        }
      } else {
        const { dmg, crit } = calcDamage(enemy.stats, targetStats, isPhys, action.skill.power, element);
        applyDamage(targetStats, dmg);
        addLog(`${enemy.name}: ${action.skill.name} → ${targetName} ${dmg}!${crit ? ' CRIT!' : ''}`);
        const fX = targetStats === GS.player.stats ? Renderer.getWidth() * 0.15 : Renderer.getWidth() * 0.25;
        addFloatingNumber(fX, Renderer.getHeight() * 0.3, crit ? `${dmg}!` : dmg, crit ? '#f44' : '#fa0', crit ? 22 : 18);
        if (action.skill.statusEffect && Math.random() < (action.skill.statusChance || 0.3)) {
          if (targetStats === GS.player.stats) {
            _statusEffectsPlayer.push({ type: action.skill.statusEffect, turns: action.skill.statusDuration || 3, damage: action.skill.statusDamage || 0 });
            addLog(`You are ${action.skill.statusEffect}!`);
          }
        }
      }
      const eSfxMap = { fire: 'fire', ice: 'ice', lightning: 'lightning', dark: 'dark', light: 'holy', holy: 'holy', earth: 'earth', poison: 'poison', arcane: 'arcane' };
      const elemSfx = (action.skill.element && eSfxMap[action.skill.element]) || action.skill.sfx || 'hit';
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX(elemSfx);
    } else if (action && action.type === 'heal') {
      const healAmt = Math.floor(enemy.stats.maxHp * 0.2);
      applyHeal(enemy.stats, healAmt);
      addLog(`${enemy.name} heals ${healAmt}!`);
      const eidx = getLiveEnemies().indexOf(enemy);
      addFloatingNumber(getEnemyScreenX(eidx >= 0 ? eidx : 0), Renderer.getHeight() * 0.3, `+${healAmt}`, '#0f0', 16);
    } else {
      const { dmg, crit } = calcDamage(enemy.stats, targetStats, true);
      applyDamage(targetStats, dmg);
      addLog(`${enemy.name} → ${targetName}: ${dmg}${crit ? ' CRIT!' : ''}`);
      const fX = targetStats === GS.player.stats ? Renderer.getWidth() * 0.15 : Renderer.getWidth() * 0.25;
      addFloatingNumber(fX, Renderer.getHeight() * 0.3, crit ? `${dmg}!` : dmg, crit ? '#f44' : '#fa0', crit ? 22 : 18);
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX(crit ? 'critical' : 'hit');
    }

    _flashTimer = 0.3;
    _flashColor = 'rgba(255,0,0,0.3)';

    // Thorns effect when player is hit
    applyThornsEffect(enemy);

    // Process player status effects at end of enemy turns
    processPlayerEffects();
    checkCombatEnd();
  }

  function processEntityEffects(entity) {
    const id = entity.id || entity.name;
    const effects = _statusEffectsMap[id] || [];
    for (let i = effects.length - 1; i >= 0; i--) {
      const eff = effects[i];
      if (eff.type === 'poison' || eff.type === 'burn') {
        const dmg = eff.damage || Math.floor(entity.stats.maxHp * 0.05);
        entity.stats.hp = Math.max(0, entity.stats.hp - dmg);
        addLog(`${entity.name}: ${dmg} ${eff.type} dmg`);
        // Tick particles
        if (typeof Particles !== 'undefined') {
          const eidx = getLiveEnemies().indexOf(entity);
          const px = eidx >= 0 ? getEnemyScreenX(eidx) : Renderer.getWidth() * 0.65;
          Particles.emit(eff.type === 'burn' ? 'fire' : 'poison', px, Renderer.getHeight() * 0.4, 6);
        }
        addFloatingNumber(Renderer.getWidth() * 0.65, Renderer.getHeight() * 0.35, dmg, eff.type === 'burn' ? '#f80' : '#0a0', 14);
      } else if (eff.type === 'regen') {
        const heal = eff.damage || Math.floor(entity.stats.maxHp * 0.05);
        entity.stats.hp = Math.min(entity.stats.maxHp, entity.stats.hp + heal);
      }
      eff.turns--;
      if (eff.turns <= 0) effects.splice(i, 1);
    }
  }

  function processPlayerEffects() {
    for (let i = _statusEffectsPlayer.length - 1; i >= 0; i--) {
      const eff = _statusEffectsPlayer[i];
      if (eff.type === 'poison' || eff.type === 'burn') {
        const dmg = eff.damage || Math.floor(GS.player.stats.maxHp * 0.05);
        GS.player.stats.hp = Math.max(0, GS.player.stats.hp - dmg);
        addLog(`You take ${dmg} ${eff.type} dmg`);
        if (typeof Particles !== 'undefined') {
          Particles.emit(eff.type === 'burn' ? 'fire' : 'poison', Renderer.getWidth() * 0.15, Renderer.getHeight() * 0.4, 6);
        }
        addFloatingNumber(Renderer.getWidth() * 0.15, Renderer.getHeight() * 0.35, dmg, eff.type === 'burn' ? '#f80' : '#0a0', 14);
      } else if (eff.type === 'regen') {
        const heal = eff.damage || Math.floor(GS.player.stats.maxHp * 0.05);
        applyHeal(GS.player.stats, heal);
        addFloatingNumber(Renderer.getWidth() * 0.15, Renderer.getHeight() * 0.35, `+${heal}`, '#0f0', 14);
      }
      eff.turns--;
      if (eff.turns <= 0) {
        // Remove stat bonuses when buff expires
        if (eff.strBonus) GS.player.stats.str -= eff.strBonus;
        if (eff.defBonus) GS.player.stats.def -= eff.defBonus;
        if (eff.agiBonus) GS.player.stats.agi -= eff.agiBonus;
        if (eff.intBonus) GS.player.stats.int -= eff.intBonus;
        if (eff.hpBonus) { GS.player.stats.maxHp -= eff.hpBonus; GS.player.stats.hp = Math.min(GS.player.stats.hp, GS.player.stats.maxHp); }
        _statusEffectsPlayer.splice(i, 1);
      }
    }
  }

  // ======== COMBAT END ========

  function checkCombatEnd() {
    if (getLiveEnemies().length === 0) {
      _combatResult = 'victory';
      _resultTimer = 2;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('victory');
    } else if (GS.player.stats.hp <= 0) {
      // Pet auto-revive check
      const pet = GS.player.activePet;
      if (pet && pet.combatBonus && pet.combatBonus.type === 'revive' && !pet._reviveUsed) {
        const healPct = pet.combatBonus.healPercent || 0.3;
        GS.player.stats.hp = Math.floor(GS.player.stats.maxHp * healPct);
        pet._reviveUsed = true;
        addLog(`${pet.name} revives you!`);
        Core.addNotification(`${pet.name} saved you from defeat!`, 3);
        if (typeof AudioManager !== 'undefined') AudioManager.playSFX('heal');
        if (typeof Particles !== 'undefined') Particles.emit('holy', Renderer.getWidth() * 0.15, Renderer.getHeight() * 0.4, 20);
        return;
      }
      _combatResult = 'defeat';
      _resultTimer = 2;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('defeat');
    }
  }

  function handleVictory() {
    let totalXp = 0, totalGold = 0;

    for (const enemy of _enemies) {
      const xpBase = typeof Enemies !== 'undefined' ? (Enemies.get(enemy.enemyType)?.xpReward || 25) : 25;
      const xp = Math.floor(xpBase * enemy.level * (enemy.isBoss ? 3 : 1));
      const gold = Utils.randomInt(5 * enemy.level, 15 * enemy.level) * (enemy.isBoss ? 3 : 1);
      totalXp += xp;
      totalGold += gold;

      // Loot drops
      if (typeof Items !== 'undefined' && typeof Enemies !== 'undefined') {
        const data = Enemies.get(enemy.enemyType);
        if (data && data.lootTable) {
          for (const drop of data.lootTable) {
            if (Math.random() < drop.chance) {
              const item = Items.generateItem(enemy.level, drop.rarity);
              if (item) {
                GS.player.items.push(item);
                addLog(`Loot: ${item.name}`);
              }
            }
          }
          // Material drops
          if (data.materialDrops) {
            for (const md of data.materialDrops) {
              if (Math.random() < md.chance) {
                const mat = { id: Utils.genId(), name: md.item, type: 'material', rarity: 'common', desc: md.item };
                GS.player.items.push(mat);
                if (typeof Quests !== 'undefined') Quests.onMaterialCollected();
              }
            }
          }
        }
      }

      // Mark defeated
      enemy.alive = false;
      enemy.defeated = true;
      if (enemy.isBoss) {
        if (!GS.defeatedBosses) GS.defeatedBosses = [];
        if (!GS.defeatedBosses.includes(enemy.name)) {
          GS.defeatedBosses.push(enemy.name);
        }
        if (enemy.isFinalBoss) {
          _combatResult = 'final_victory';
          _resultTimer = 4;
          GS.mainQuestComplete = true;
        }
      }

      if (typeof Quests !== 'undefined') Quests.onEnemyKilled(enemy.enemyType, enemy.name);
      if (typeof Bestiary !== 'undefined') Bestiary.recordKill(enemy.enemyType, enemy);
      if (typeof Achievements !== 'undefined') Achievements.onEnemyKilled(enemy.enemyType, enemy.isBoss);
      if (typeof DailyChallenges !== 'undefined') {
        DailyChallenges.onEnemyKilled(enemy.enemyType);
        if (enemy.isBoss) DailyChallenges.onBossKilled();
      }
      // Pet capture
      if (typeof Pets !== 'undefined') {
        const captured = Pets.tryCapture(enemy.enemyType);
        for (const petId of captured) {
          Pets.collectPet(petId);
          if (typeof Quests !== 'undefined') Quests.onPetCollected();
        }
      }
    }

    // NG+ multiplier
    const ngMult = GS.ngPlus ? (1 + GS.ngPlus * 0.5) : 1;
    totalXp = Math.floor(totalXp * ngMult);
    totalGold = Math.floor(totalGold * ngMult);

    // Pet gold bonus
    if (GS.player.activePet && GS.player.activePet.combatBonus && GS.player.activePet.combatBonus.type === 'gold_bonus') {
      totalGold = Math.floor(totalGold * (GS.player.activePet.combatBonus.multiplier || 1));
    }

    // Night XP bonus
    if (typeof DayNight !== 'undefined') {
      const mods = DayNight.getCombatModifiers();
      totalXp = Math.floor(totalXp * mods.xpMultiplier);
      if (mods.isNight) addLog('Night bonus: +25% XP!');
    }

    GS.player.stats.xp += totalXp;
    GS.player.gold = (GS.player.gold || 0) + totalGold;
    GS.player.stats.gold = GS.player.gold;
    addLog(`Victory! +${totalXp} XP, +${totalGold} Gold`);

    // Gold & combo tracking
    if (typeof Achievements !== 'undefined') Achievements.onGoldEarned(totalGold);
    if (typeof DailyChallenges !== 'undefined') {
      DailyChallenges.onGoldEarned(totalGold);
      if (_comboCounter > 1) DailyChallenges.onCombo(_comboCounter);
    }

    // Ally XP
    for (const ally of _allies) {
      if (ally.stats.hp > 0) {
        ally.xp = (ally.xp || 0) + Math.floor(totalXp * 0.5);
        if (typeof Allies !== 'undefined') Allies.checkAllyLevelUp(ally);
      }
    }

    // Pet XP
    if (GS.player.activePet && typeof Pets !== 'undefined') {
      Pets.addXP(GS.player.activePet, Math.floor(totalXp * 0.3));
    }

    checkLevelUp();
    if (typeof Achievements !== 'undefined') {
      Achievements.checkCombat(_turnCounter, _enemies.length);
      // No damage boss achievement
      if (_enemies.some(e => e.isBoss) && _playerDamageTaken === 0) {
        Achievements.unlock('no_damage_boss');
      }
      // No damage battle (for daily challenges too)
      if (_playerDamageTaken === 0 && typeof DailyChallenges !== 'undefined') {
        DailyChallenges.onNoDamageBattle();
      }
      // Combo achievement
      if (_comboCounter >= 5) {
        Achievements.unlock('max_combo');
      }
      // Boss-specific achievements
      for (const enemy of _enemies) {
        if (enemy.isBoss) {
          const bossMap = {
            'Stone Guardian': 'boss_slayer_1',
            'Sand Wyrm': 'boss_slayer_2',
            'Frost Titan': 'boss_slayer_3',
            'Abyssal Lord': 'boss_slayer_4',
            'Crystal Dragon': 'boss_slayer_5'
          };
          const achId = bossMap[enemy.name];
          if (achId) Achievements.unlock(achId);
        }
      }
    }
  }

  function checkLevelUp() {
    const stats = GS.player.stats;
    while (stats.xp >= stats.xpToNext) {
      stats.xp -= stats.xpToNext;
      stats.level++;
      stats.xpToNext = Math.floor(100 * Math.pow(1.5, stats.level - 1));

      if (typeof Classes !== 'undefined') {
        Classes.applyLevelUp(GS.player.classType, stats);
      } else {
        stats.maxHp += 10; stats.maxMp += 5;
        stats.str += 2; stats.def += 2; stats.int += 2; stats.agi += 1; stats.luk += 1;
      }

      stats.hp = stats.maxHp;
      stats.mp = stats.maxMp;
      GS.player.skillPoints = (GS.player.skillPoints || 0) + 1;

      addLog(`** LEVEL UP! Lv.${stats.level}! **`);
      Core.addNotification(`Level Up! Lv.${stats.level}`, 4);
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('levelup');
      if (typeof Particles !== 'undefined') Particles.emit('levelup', Renderer.getWidth() / 2, Renderer.getHeight() / 2, 30);
      if (typeof Achievements !== 'undefined') Achievements.onLevelUp(stats.level);
    }
  }

  function handleDefeat() {
    addLog('You have been defeated...');
    GS.player.stats.gold = Math.floor((GS.player.stats.gold || 0) * 0.7);
    GS.player.gold = GS.player.stats.gold;
    GS.player.stats.hp = Math.floor(GS.player.stats.maxHp * 0.5);
    GS.player.stats.mp = Math.floor(GS.player.stats.maxMp * 0.5);
    // Revive allies at half HP
    for (const ally of _allies) {
      ally.stats.hp = Math.floor(ally.stats.maxHp * 0.5);
    }
  }

  function endCombat() {
    if (_combatResult === 'victory') handleVictory();
    else if (_combatResult === 'defeat') handleDefeat();
    else if (_combatResult === 'final_victory') {
      handleVictory();
      // Remove remaining combat buffs before transitioning
      removeCombatBuffs();
      Core.setState(GameStates.VICTORY);
      return;
    }

    // Remove remaining combat buffs so stats don't stay inflated
    removeCombatBuffs();

    Core.setState(GameStates.PLAY);
    if (_combatResult === 'defeat') WorldManager.loadZone('eldergrove');

    // Recalc stats to clean baseline
    if (typeof Inventory !== 'undefined') Inventory.recalcStats();

    const zone = WorldManager.getZone();
    if (zone && typeof AudioManager !== 'undefined') AudioManager.playMusic(zone.music);
    _enemies = [];
    _allies = [];
  }

  function removeCombatBuffs() {
    for (const eff of _statusEffectsPlayer) {
      if (eff.strBonus) GS.player.stats.str -= eff.strBonus;
      if (eff.defBonus) GS.player.stats.def -= eff.defBonus;
      if (eff.agiBonus) GS.player.stats.agi -= eff.agiBonus;
      if (eff.intBonus) GS.player.stats.int -= eff.intBonus;
      if (eff.hpBonus) { GS.player.stats.maxHp -= eff.hpBonus; GS.player.stats.hp = Math.min(GS.player.stats.hp, GS.player.stats.maxHp); }
    }
    _statusEffectsPlayer = [];
  }

  // ======== UPDATE ========

  function update(dt) {
    if (GS.state !== GameStates.COMBAT) return;

    if (_shakeTimer > 0) _shakeTimer -= dt;
    if (_flashTimer > 0) _flashTimer -= dt;
    updateFloatingNumbers(dt);

    if (_combatResult) {
      _resultTimer -= dt;
      if (_resultTimer <= 0) endCombat();
      return;
    }

    if (_animating) {
      _animTimer -= dt;
      if (_animTimer <= 0) {
        _animating = false;
        const turn = getCurrentTurnEntity();
        if (turn.type === 'enemy') {
          enemyTurn(turn.entity);
          advanceTurn();
          if (!_combatResult) scheduleNextNonPlayerTurn();
        } else if (turn.type === 'ally') {
          allyTurn(turn.entity);
          advanceTurn();
          if (!_combatResult) scheduleNextNonPlayerTurn();
        }
      }
      return;
    }

    const turn = getCurrentTurnEntity();
    if (turn.type === 'player') {
      handlePlayerInput();
    }
  }

  function scheduleNextNonPlayerTurn() {
    const next = getCurrentTurnEntity();
    if (next.type !== 'player') {
      _animating = true;
      _animTimer = 0.5;
    } else {
      _selectedAction = 0;
      _subMenu = null;
      _selectedTarget = 0;
    }
  }

  function handlePlayerInput() {
    const stunned = _statusEffectsPlayer.some(e => e.type === 'stun' || e.type === 'freeze');
    if (stunned) {
      if (Input.actionPressed(Input.Actions.CONFIRM)) {
        addLog('You are stunned!');
        advanceTurn();
        scheduleNextNonPlayerTurn();
      }
      return;
    }

    if (_subMenu === 'skills') { handleSkillMenu(); return; }
    if (_subMenu === 'items') { handleItemMenu(); return; }
    if (_subMenu === 'target_enemy') { handleTargetMenu(); return; }

    if (Input.actionPressed(Input.Actions.UP)) {
      _selectedAction = (_selectedAction - 1 + actions.length) % actions.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }
    if (Input.actionPressed(Input.Actions.DOWN)) {
      _selectedAction = (_selectedAction + 1) % actions.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }
    const actionWheel = Input.getWheelDelta();
    if (actionWheel !== 0) {
      _selectedAction = (_selectedAction + Math.sign(actionWheel) + actions.length) % actions.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    if (Input.actionPressed(Input.Actions.CONFIRM)) {
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_select');
      switch (actions[_selectedAction]) {
        case 'Attack':
          if (getLiveEnemies().length > 1) {
            _subMenu = 'target_enemy';
            _pendingAction = { type: 'attack' };
            _selectedTarget = 0;
          } else {
            _selectedTarget = 0;
            playerAttack();
            if (!_combatResult) { advanceTurn(); scheduleNextNonPlayerTurn(); }
          }
          break;
        case 'Skills':
          if (GS.player.skills && GS.player.skills.length > 0) {
            _subMenu = 'skills';
            _selectedSkill = 0;
          } else addLog('No skills!');
          break;
        case 'Items':
          if (GS.player.items.filter(i => i.type === 'consumable').length > 0) {
            _subMenu = 'items';
            _selectedItem = 0;
          } else addLog('No items!');
          break;
        case 'Defend':
          playerDefend();
          advanceTurn();
          scheduleNextNonPlayerTurn();
          break;
        case 'Flee':
          playerFlee();
          if (!_combatResult) { advanceTurn(); scheduleNextNonPlayerTurn(); }
          break;
      }
    }
  }

  function handleTargetMenu() {
    const live = getLiveEnemies();
    if (Input.actionPressed(Input.Actions.LEFT)) _selectedTarget = (_selectedTarget - 1 + live.length) % live.length;
    if (Input.actionPressed(Input.Actions.RIGHT)) _selectedTarget = (_selectedTarget + 1) % live.length;
    if (Input.actionPressed(Input.Actions.UP)) _selectedTarget = (_selectedTarget - 1 + live.length) % live.length;
    if (Input.actionPressed(Input.Actions.DOWN)) _selectedTarget = (_selectedTarget + 1) % live.length;
    const targetWheel = Input.getWheelDelta();
    if (targetWheel !== 0) _selectedTarget = (_selectedTarget + Math.sign(targetWheel) + live.length) % live.length;

    if (Input.actionPressed(Input.Actions.CONFIRM)) {
      if (_pendingAction.type === 'attack') {
        playerAttack();
      } else if (_pendingAction.type === 'skill') {
        playerUseSkill(_pendingAction.skill);
      }
      _subMenu = null;
      _pendingAction = null;
      if (!_combatResult) { advanceTurn(); scheduleNextNonPlayerTurn(); }
    }
    if (Input.actionPressed(Input.Actions.CANCEL)) { _subMenu = null; _pendingAction = null; }
  }

  function handleSkillMenu() {
    const skills = GS.player.skills || [];
    if (Input.actionPressed(Input.Actions.UP)) _selectedSkill = (_selectedSkill - 1 + skills.length) % skills.length;
    if (Input.actionPressed(Input.Actions.DOWN)) _selectedSkill = (_selectedSkill + 1) % skills.length;
    const skillWheel = Input.getWheelDelta();
    if (skillWheel !== 0) _selectedSkill = (_selectedSkill + Math.sign(skillWheel) + skills.length) % skills.length;
    if (Input.actionPressed(Input.Actions.CONFIRM)) {
      const skill = skills[_selectedSkill];
      if (skill.type === 'damage' && getLiveEnemies().length > 1 && skill.targetType !== 'all_enemies' && !skill.aoe) {
        _subMenu = 'target_enemy';
        _pendingAction = { type: 'skill', skill };
        _selectedTarget = 0;
      } else {
        if (playerUseSkill(skill)) {
          _subMenu = null;
          if (!_combatResult) { advanceTurn(); scheduleNextNonPlayerTurn(); }
        }
      }
    }
    if (Input.actionPressed(Input.Actions.CANCEL)) _subMenu = null;
  }

  function handleItemMenu() {
    const items = GS.player.items.filter(i => i.type === 'consumable');
    if (items.length === 0) { _subMenu = null; return; }
    if (Input.actionPressed(Input.Actions.UP)) _selectedItem = (_selectedItem - 1 + items.length) % items.length;
    if (Input.actionPressed(Input.Actions.DOWN)) _selectedItem = (_selectedItem + 1) % items.length;
    const itemWheel = Input.getWheelDelta();
    if (itemWheel !== 0) _selectedItem = (_selectedItem + Math.sign(itemWheel) + items.length) % items.length;
    if (Input.actionPressed(Input.Actions.CONFIRM)) {
      if (playerUseItem(items[_selectedItem])) {
        _subMenu = null;
        advanceTurn();
        scheduleNextNonPlayerTurn();
      }
    }
    if (Input.actionPressed(Input.Actions.CANCEL)) _subMenu = null;
  }

  // ======== RENDER ========

  function getEnemyScreenX(idx) {
    const w = Renderer.getWidth();
    const count = getLiveEnemies().length;
    const spacing = Math.min(180, (w * 0.45) / Math.max(count, 1));
    const startX = w * 0.55;
    return startX + idx * spacing;
  }

  function render() {
    if (GS.state !== GameStates.COMBAT) return;
    const ctx = Renderer.getCtx();
    const w = Renderer.getWidth();
    const h = Renderer.getHeight();

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(1, '#16213e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2a2a4a';
    ctx.fillRect(0, h * 0.65, w, h * 0.35);

    if (_shakeTimer > 0) {
      ctx.save();
      ctx.translate((Math.random() - 0.5) * 8 * _shakeTimer, (Math.random() - 0.5) * 8 * _shakeTimer);
    }

    // Draw enemies
    const liveEnemies = getLiveEnemies();
    for (let i = 0; i < liveEnemies.length; i++) {
      const enemy = liveEnemies[i];
      const sprite = SpriteGen.cache.enemies[enemy.enemyType];
      if (sprite) {
        const scale = enemy.isBoss ? 5 : 3.5;
        const ex = getEnemyScreenX(i) - (sprite.width * scale) / 2;
        const ey = h * 0.35 - (sprite.height * scale) / 2 + (i % 2) * 20;
        const alpha = enemy.stats.hp <= 0 ? 0.3 : 1;
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, ex, ey, sprite.width * scale, sprite.height * scale);
        ctx.globalAlpha = 1;

        // Target indicator
        if (_subMenu === 'target_enemy' && i === _selectedTarget) {
          ctx.fillStyle = '#ffcc00';
          ctx.fillRect(ex + sprite.width * scale / 2 - 5, ey - 15, 10, 10);
        }

        // Name + HP
        const nameX = ex + sprite.width * scale / 2;
        Renderer.drawText(`${enemy.name} Lv${enemy.level}`, nameX, ey - 28, enemy.isBoss ? '#f44' : '#fff', 11, 'center', true);
        Renderer.drawBar(ex, ey + sprite.height * scale + 5, sprite.width * scale, 8, enemy.stats.hp / enemy.stats.maxHp, '#c00', '#400');

        // Status effects
        const effects = _statusEffectsMap[enemy.id || enemy.name] || [];
        let seX = ex;
        for (const eff of effects) {
          const c = { poison: '#a0f', burn: '#f80', freeze: '#08f', stun: '#ff0' }[eff.type] || '#fff';
          ctx.fillStyle = c;
          ctx.fillRect(seX, ey + sprite.height * scale + 16, 6, 6);
          seX += 8;
        }
      }
    }

    // Draw player + allies (left side)
    const cls = GS.player.classType || 'warrior';
    const pSprite = SpriteGen.cache.player[cls] ? SpriteGen.cache.player[cls].right[0] : null;
    if (pSprite) {
      ctx.drawImage(pSprite, w * 0.08, h * 0.32, pSprite.width * 3.5, pSprite.height * 3.5);
    }

    // Draw allies
    for (let i = 0; i < _allies.length; i++) {
      const ally = _allies[i];
      const aSprite = SpriteGen.cache.npcs[ally.spriteType || 'guard'];
      if (aSprite && ally.stats.hp > 0) {
        const ax = w * 0.08 + (i + 1) * 60;
        const ay = h * 0.35 + (i % 2) * 20;
        ctx.drawImage(aSprite, ax, ay, aSprite.width * 2.5, aSprite.height * 2.5);
        Renderer.drawText(ally.name, ax + 12, ay - 10, '#4f4', 10, 'center', true);
        Renderer.drawBar(ax - 5, ay + aSprite.height * 2.5 + 2, 40, 4, ally.stats.hp / ally.stats.maxHp, '#0a0', '#040');
      }
    }

    if (_shakeTimer > 0) ctx.restore();
    if (_flashTimer > 0) { ctx.fillStyle = _flashColor; ctx.fillRect(0, 0, w, h); }

    // Player stats panel
    Renderer.drawPanel(10, h - 180, 260, 170);
    const ps = GS.player.stats;
    Renderer.drawText(`${GS.player.name || cls} Lv.${ps.level}`, 20, h - 172, '#fff', 14);
    Renderer.drawBar(20, h - 152, 170, 12, ps.hp / ps.maxHp, '#0a0', '#040');
    Renderer.drawText(`HP ${ps.hp}/${ps.maxHp}`, 200, h - 152, '#fff', 9, 'left');
    Renderer.drawBar(20, h - 136, 170, 12, ps.mp / ps.maxMp, '#06a', '#024');
    Renderer.drawText(`MP ${ps.mp}/${ps.maxMp}`, 200, h - 136, '#fff', 9, 'left');

    // Ally HP bars
    let allyY = h - 118;
    for (const ally of _allies) {
      Renderer.drawText(ally.name, 20, allyY, ally.stats.hp > 0 ? '#4f4' : '#666', 10);
      Renderer.drawBar(80, allyY, 100, 8, ally.stats.hp / ally.stats.maxHp, '#0a0', '#040');
      allyY += 14;
    }

    // Status effects on player
    let peX = 20;
    const peY = h - 118 + _allies.length * 14 + 4;
    for (const eff of _statusEffectsPlayer) {
      const c = { poison: '#a0f', burn: '#f80', freeze: '#08f', stun: '#ff0', defend: '#88f', regen: '#0f0', berserk: '#f44' }[eff.type] || '#fff';
      Renderer.drawText(eff.type, peX, peY, c, 9);
      peX += 45;
    }

    // Combo counter
    if (_comboCounter > 1) {
      Renderer.drawText(`${_comboCounter}x COMBO!`, w / 2, h * 0.15, '#ffcc00', 20, 'center', true);
    }

    // Turn indicator
    if (!_combatResult) {
      const turn = getCurrentTurnEntity();
      const tText = turn.type === 'player' ? 'YOUR TURN' : turn.type === 'ally' ? `${turn.entity.name}'s TURN` : `${turn.entity.name}'s TURN`;
      const tColor = turn.type === 'player' ? '#4f4' : turn.type === 'ally' ? '#4ff' : '#f44';
      Renderer.drawText(tText, w / 2, h * 0.62, tColor, 13, 'center', true);
    }

    // Action menu
    if (!_combatResult && getCurrentTurnEntity().type === 'player' && !_animating) {
      if (_subMenu === 'skills') renderSkillMenu(w, h);
      else if (_subMenu === 'items') renderItemMenu(w, h);
      else if (_subMenu === 'target_enemy') {
        Renderer.drawPanel(w - 200, h - 60, 180, 50);
        Renderer.drawText('Choose target (LEFT/RIGHT)', w - 110, h - 50, '#ffcc00', 11, 'center');
        const t = getLiveEnemies()[_selectedTarget];
        if (t) Renderer.drawText(t.name, w - 110, h - 34, '#fff', 13, 'center');
      } else {
        Renderer.drawPanel(w - 180, h - 210, 160, actions.length * 32 + 20);
        for (let i = 0; i < actions.length; i++) {
          const sel = i === _selectedAction;
          Renderer.drawText((sel ? '> ' : '  ') + actions[i], w - 168, h - 200 + i * 32, sel ? '#ffcc00' : '#aaa', 15);
        }
      }
    }

    // Combat log
    Renderer.drawPanel(280, h - 180, w - 480, Math.min(170, _combatLog.length * 18 + 10));
    for (let i = 0; i < _combatLog.length; i++) {
      Renderer.drawText(_combatLog[i], 290, h - 172 + i * 18, '#ddd', 11);
    }

    // Result
    if (_combatResult) {
      const texts = { victory: 'VICTORY!', defeat: 'DEFEATED...', fled: 'ESCAPED!', final_victory: 'THE REALM IS SAVED!' };
      const colors = { victory: '#ffcc00', defeat: '#ff4444', fled: '#aaa', final_victory: '#ffcc00' };
      Renderer.drawText(texts[_combatResult], w / 2, h * 0.3, colors[_combatResult], 36, 'center', true);
    }

    // Floating damage numbers
    renderFloatingNumbers();
  }

  function renderSkillMenu(w, h) {
    const skills = GS.player.skills || [];
    const panelH = Math.min(220, skills.length * 26 + 30);
    Renderer.drawPanel(w - 280, h - panelH - 10, 260, panelH);
    Renderer.drawText('Skills (ESC back)', w - 270, h - panelH - 2, '#aaa', 10);
    for (let i = 0; i < skills.length && i < 8; i++) {
      const sel = i === _selectedSkill;
      const skill = skills[i];
      const canUse = GS.player.stats.mp >= skill.mpCost;
      const color = sel ? '#ffcc00' : (canUse ? '#aaa' : '#555');
      const element = skill.element ? ` [${skill.element}]` : '';
      Renderer.drawText((sel ? '> ' : '  ') + skill.name + ` ${skill.mpCost}MP${element}`, w - 270, h - panelH + 18 + i * 24, color, 12);
    }
  }

  function renderItemMenu(w, h) {
    const items = GS.player.items.filter(i => i.type === 'consumable');
    Renderer.drawPanel(w - 250, h - 180, 230, 170);
    Renderer.drawText('Items (ESC back)', w - 240, h - 175, '#aaa', 10);
    for (let i = 0; i < items.length && i < 6; i++) {
      const sel = i === _selectedItem;
      Renderer.drawText((sel ? '> ' : '  ') + items[i].name, w - 240, h - 155 + i * 24, sel ? '#ffcc00' : '#aaa', 12);
    }
  }

  return { startCombat, update, render, checkLevelUp };
})();
