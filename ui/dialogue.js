// ui/dialogue.js — NPC dialogue system with typewriter effect

const Dialogue = (() => {
  let _active = false;
  let _npcEntity = null;
  let _tree = null;
  let _currentNode = null;
  let _selectedChoice = 0;
  let _typewriterText = '';
  let _typewriterIndex = 0;
  let _typewriterTimer = 0;
  const TYPEWRITER_SPEED = 30; // characters per second

  // Shop state
  let _shopMode = null; // null, 'buy', 'sell', 'crafting', 'skills', 'enchanting'
  let _shopSelected = 0;
  let _shopItems = [];

  function startDialogue(entity) {
    const npcData = typeof NPCs !== 'undefined' ? NPCs.get(entity.name) : null;
    if (!npcData) {
      // Generic dialogue
      _tree = {
        start: {
          text: `${entity.name}: "Hello, adventurer!"`,
          choices: [{ text: 'Goodbye.', next: null }]
        }
      };
    } else {
      _tree = npcData.dialogueTree;
    }

    _npcEntity = entity;
    _active = true;
    _shopMode = null;
    setNode('start');
    Core.setState(GameStates.DIALOGUE);
    if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_select');
  }

  function setNode(nodeId) {
    _currentNode = _tree[nodeId];
    if (!_currentNode) {
      endDialogue();
      return;
    }
    _selectedChoice = 0;
    _typewriterText = _currentNode.text;
    _typewriterIndex = 0;
    _typewriterTimer = 0;
  }

  function endDialogue() {
    _active = false;
    _npcEntity = null;
    _tree = null;
    _currentNode = null;
    _shopMode = null;
    Core.setState(GameStates.PLAY);
  }

  function update(dt) {
    if (GS.state !== GameStates.DIALOGUE || !_active) return;

    // Typewriter effect
    if (_typewriterIndex < _typewriterText.length) {
      _typewriterTimer += dt * TYPEWRITER_SPEED;
      while (_typewriterTimer >= 1 && _typewriterIndex < _typewriterText.length) {
        _typewriterIndex++;
        _typewriterTimer -= 1;
      }

      // Skip typewriter on confirm
      if (Input.actionPressed(Input.Actions.CONFIRM)) {
        _typewriterIndex = _typewriterText.length;
        return;
      }
      return;
    }

    if (_shopMode) {
      handleShopInput(dt);
      return;
    }

    // Dialogue choices
    const choices = _currentNode.choices || [];
    if (choices.length === 0) {
      if (Input.actionPressed(Input.Actions.CONFIRM) || Input.actionPressed(Input.Actions.CANCEL)) {
        endDialogue();
      }
      return;
    }

    if (Input.actionPressed(Input.Actions.UP)) {
      _selectedChoice = (_selectedChoice - 1 + choices.length) % choices.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }
    if (Input.actionPressed(Input.Actions.DOWN)) {
      _selectedChoice = (_selectedChoice + 1) % choices.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    // Mouse wheel scroll
    const choiceWheel = Input.getWheelDelta();
    if (choiceWheel !== 0) {
      _selectedChoice = (_selectedChoice + Math.sign(choiceWheel) + choices.length) % choices.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    if (Input.actionPressed(Input.Actions.CONFIRM)) {
      const choice = choices[_selectedChoice];
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_select');

      // Handle actions
      if (choice.action) {
        handleAction(choice.action, choice);
      }

      if (choice.next) {
        setNode(choice.next);
      } else if (!choice.action || choice.action === 'accept_quest') {
        endDialogue();
      }
    }

    if (Input.actionPressed(Input.Actions.CANCEL)) {
      endDialogue();
    }
  }

  function handleAction(action, choice) {
    switch (action) {
      case 'accept_quest':
        if (typeof Quests !== 'undefined' && choice.questId) {
          Quests.acceptQuest(choice.questId);
        }
        break;
      case 'open_shop':
        openShop('buy');
        break;
      case 'open_sell':
        openShop('sell');
        break;
      case 'open_crafting':
        openCrafting();
        break;
      case 'open_skills':
        openSkillTrainer();
        break;
      case 'open_enchanting':
        openEnchanting();
        break;
      case 'full_heal':
        if (GS.player) {
          GS.player.stats.hp = GS.player.stats.maxHp;
          GS.player.stats.mp = GS.player.stats.maxMp;
          Core.addNotification('Fully healed!', 2);
          if (typeof AudioManager !== 'undefined') AudioManager.playSFX('heal');
        }
        break;
    }
  }

  function openShop(mode) {
    _shopMode = mode;
    _shopSelected = 0;
    if (mode === 'buy') {
      const npcData = typeof NPCs !== 'undefined' ? NPCs.get(_npcEntity.name) : null;
      _shopItems = npcData?.shopItems || [];
    } else {
      _shopItems = GS.player.items.filter(i => i.type !== 'material' || i.sellValue);
    }
  }

  function openCrafting() {
    _shopMode = 'crafting';
    _shopSelected = 0;
    _shopItems = typeof Crafting !== 'undefined' ? Crafting.getAvailableRecipes(GS.player) : [];
  }

  function openSkillTrainer() {
    _shopMode = 'skills';
    _shopSelected = 0;
    _shopItems = typeof Classes !== 'undefined' ? Classes.getAvailableSkillUpgrades(GS.player) : [];
  }

  function openEnchanting() {
    _shopMode = 'enchanting';
    _shopSelected = 0;
    if (typeof Enchanting !== 'undefined') {
      // List all enchants with availability status
      _shopItems = Enchanting.getAllEnchants().map(e => {
        const slotMap = { weapon: ['weapon'], armor: ['armor', 'helmet', 'boots'], accessory: ['ring', 'amulet'] };
        const validSlots = slotMap[e.slot] || [];
        const targetItem = validSlots.map(s => GS.player.equipment[s]).find(i => i && !i.enchant);
        const check = targetItem ? Enchanting.canEnchant(targetItem, e.id) : { ok: false, reason: 'No unenchanted ' + e.slot };
        return { ...e, canApply: check.ok, reason: check.reason, targetItem };
      });
    } else {
      _shopItems = [];
    }
  }

  function handleShopInput(dt) {
    if (_shopItems.length === 0) {
      if (Input.actionPressed(Input.Actions.CANCEL) || Input.actionPressed(Input.Actions.CONFIRM)) {
        _shopMode = null;
        endDialogue();
      }
      return;
    }

    if (Input.actionPressed(Input.Actions.UP)) {
      _shopSelected = (_shopSelected - 1 + _shopItems.length) % _shopItems.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }
    if (Input.actionPressed(Input.Actions.DOWN)) {
      _shopSelected = (_shopSelected + 1) % _shopItems.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    // Mouse wheel scroll
    const shopWheel = Input.getWheelDelta();
    if (shopWheel !== 0) {
      _shopSelected = (_shopSelected + Math.sign(shopWheel) + _shopItems.length) % _shopItems.length;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    if (Input.actionPressed(Input.Actions.CONFIRM)) {
      if (_shopMode === 'buy') {
        const item = _shopItems[_shopSelected];
        const cost = item.cost || item.buyValue || 10;
        const canAfford = GS.cheatActive || (GS.player.gold || 0) >= cost;
        if (canAfford) {
          if (!GS.cheatActive) {
            GS.player.gold -= cost;
            GS.player.stats.gold = GS.player.gold;
          }
          GS.player.items.push({ ...item, id: Utils.genId() });
          Core.addNotification(`Bought ${item.name}!`, 2);
          if (typeof AudioManager !== 'undefined') AudioManager.playSFX('coin');
          if (typeof DailyChallenges !== 'undefined') DailyChallenges.onGoldSpent(cost);
        } else {
          Core.addNotification('Not enough gold!', 2);
          if (typeof AudioManager !== 'undefined') AudioManager.playSFX('hit');
        }
      } else if (_shopMode === 'sell') {
        const item = _shopItems[_shopSelected];
        const value = item.sellValue || 5;
        GS.player.gold = (GS.player.gold || 0) + value;
        GS.player.stats.gold = GS.player.gold;
        const idx = GS.player.items.indexOf(item);
        if (idx >= 0) GS.player.items.splice(idx, 1);
        _shopItems = GS.player.items.filter(i => i.type !== 'material' || i.sellValue);
        if (_shopSelected >= _shopItems.length) _shopSelected = Math.max(0, _shopItems.length - 1);
        Core.addNotification(`Sold for ${value} gold!`, 2);
        if (typeof AudioManager !== 'undefined') AudioManager.playSFX('coin');
      } else if (_shopMode === 'crafting') {
        const recipe = _shopItems[_shopSelected];
        if (recipe.canCraft && typeof Crafting !== 'undefined') {
          const result = Crafting.craft(recipe, GS.player);
          if (result) {
            Core.addNotification(`Crafted ${result.name}!`, 3);
            if (typeof AudioManager !== 'undefined') AudioManager.playSFX('levelup');
            if (typeof Particles !== 'undefined') Particles.emit('buff', Renderer.getWidth() / 2, Renderer.getHeight() / 2, 12);
            if (typeof Quests !== 'undefined') Quests.onItemCrafted();
            _shopItems = Crafting.getAvailableRecipes(GS.player);
          }
        } else {
          Core.addNotification('Missing materials!', 2);
          if (typeof AudioManager !== 'undefined') AudioManager.playSFX('hit');
        }
      } else if (_shopMode === 'skills') {
        const skill = _shopItems[_shopSelected];
        if (GS.player.skillPoints > 0) {
          if (typeof Classes !== 'undefined' && Classes.learnSkill(GS.player, skill.id)) {
            Core.addNotification(`Learned ${skill.name}!`, 3);
            if (typeof AudioManager !== 'undefined') AudioManager.playSFX('levelup');
            if (typeof Particles !== 'undefined') Particles.emit('levelup', Renderer.getWidth() / 2, Renderer.getHeight() / 2, 12);
            _shopItems = Classes.getAvailableSkillUpgrades(GS.player);
            if (_shopSelected >= _shopItems.length) _shopSelected = Math.max(0, _shopItems.length - 1);
          }
        } else {
          Core.addNotification('No skill points!', 2);
          if (typeof AudioManager !== 'undefined') AudioManager.playSFX('hit');
        }
      } else if (_shopMode === 'enchanting') {
        const enchant = _shopItems[_shopSelected];
        if (enchant && enchant.canApply && enchant.targetItem) {
          const result = typeof Enchanting !== 'undefined' ? Enchanting.enchantItem(enchant.targetItem, enchant.id) : { ok: false };
          if (result.ok) {
            if (typeof Particles !== 'undefined') Particles.emit('buff', Renderer.getWidth() / 2, Renderer.getHeight() / 2, 15);
            if (typeof AudioManager !== 'undefined') AudioManager.playSFX('levelup');
            openEnchanting(); // Refresh list
            if (_shopSelected >= _shopItems.length) _shopSelected = Math.max(0, _shopItems.length - 1);
          }
        } else {
          Core.addNotification(enchant.reason || 'Missing materials or equipment!', 2);
        }
      }
    }

    if (Input.actionPressed(Input.Actions.CANCEL)) {
      _shopMode = null;
      endDialogue();
    }
  }

  // ======== RENDER ========

  function render() {
    if (GS.state !== GameStates.DIALOGUE || !_active) return;

    const w = Renderer.getWidth();
    const h = Renderer.getHeight();

    if (_shopMode) {
      renderShop(w, h);
      return;
    }

    // Dialogue box at bottom
    const boxH = 180;
    const boxY = h - boxH - 20;
    Renderer.drawPanel(20, boxY, w - 40, boxH, 'rgba(0,0,0,0.9)', '#aaa');

    // NPC name
    if (_npcEntity) {
      Renderer.drawText(_npcEntity.name, 40, boxY + 10, '#ffcc00', 16);
    }

    // Text with typewriter
    const displayText = _typewriterText.substring(0, _typewriterIndex);
    // Word wrap
    const maxWidth = w - 100;
    const lines = wrapText(displayText, maxWidth, 14);
    for (let i = 0; i < lines.length && i < 4; i++) {
      Renderer.drawText(lines[i], 40, boxY + 35 + i * 22, '#eee', 14);
    }

    // Choices (only show when typewriter is done)
    if (_typewriterIndex >= _typewriterText.length && _currentNode.choices) {
      const choiceY = boxY + 100;
      for (let i = 0; i < _currentNode.choices.length; i++) {
        const sel = i === _selectedChoice;
        const prefix = sel ? '> ' : '  ';
        const color = sel ? '#ffcc00' : '#aaa';
        Renderer.drawText(prefix + _currentNode.choices[i].text, 60, choiceY + i * 22, color, 13);
      }
    }
  }

  function renderShop(w, h) {
    // Full panel
    Renderer.drawPanel(40, 40, w - 80, h - 80, 'rgba(0,0,0,0.92)', '#aaa');

    let title;
    if (_shopMode === 'buy') title = 'SHOP - Buy';
    else if (_shopMode === 'sell') title = 'SHOP - Sell';
    else if (_shopMode === 'crafting') title = 'CRAFTING';
    else if (_shopMode === 'skills') title = `SKILLS (${GS.player.skillPoints || 0} points)`;
    else if (_shopMode === 'enchanting') title = 'ENCHANTING';

    Renderer.drawText(title, w / 2, 55, '#ffcc00', 20, 'center');
    Renderer.drawText(`Gold: ${GS.player.gold || 0}`, w - 100, 55, '#ffcc00', 14, 'right');
    Renderer.drawText('ESC to go back', w / 2, 80, '#666', 11, 'center');

    if (_shopItems.length === 0) {
      Renderer.drawText('Nothing available.', w / 2, h / 2, '#aaa', 16, 'center');
      return;
    }

    const startY = 110;
    const maxShow = Math.min(_shopItems.length, Math.floor((h - 200) / 30));
    const scrollOffset = Math.max(0, _shopSelected - maxShow + 3);

    for (let i = scrollOffset; i < _shopItems.length && i < scrollOffset + maxShow; i++) {
      const item = _shopItems[i];
      const sel = i === _shopSelected;
      const y = startY + (i - scrollOffset) * 30;
      const prefix = sel ? '> ' : '  ';

      if (_shopMode === 'buy') {
        const color = sel ? '#ffcc00' : '#ddd';
        const cost = item.cost || item.buyValue || 10;
        const canAfford = (GS.player.gold || 0) >= cost;
        Renderer.drawText(`${prefix}${item.name}`, 70, y, canAfford ? color : '#666', 14);
        Renderer.drawText(`${cost}g`, w - 120, y, canAfford ? '#ffcc00' : '#666', 14, 'right');
      } else if (_shopMode === 'sell') {
        const color = sel ? '#ffcc00' : '#ddd';
        Renderer.drawText(`${prefix}${item.name}`, 70, y, color, 14);
        Renderer.drawText(`${item.sellValue || 5}g`, w - 120, y, '#ffcc00', 14, 'right');
      } else if (_shopMode === 'crafting') {
        const color = sel ? '#ffcc00' : (item.canCraft ? '#ddd' : '#666');
        Renderer.drawText(`${prefix}${item.name}`, 70, y, color, 14);
        const matText = item.materials.map(m => `${m.name} x${m.count}`).join(', ');
        Renderer.drawText(matText, 70, y + 14, '#888', 10);
      } else if (_shopMode === 'skills') {
        const color = sel ? '#ffcc00' : '#ddd';
        Renderer.drawText(`${prefix}${item.name} (Lv.${item.levelReq})`, 70, y, color, 14);
        Renderer.drawText(`${item.mpCost} MP - ${item.desc}`, 70, y + 14, '#888', 10);
      } else if (_shopMode === 'enchanting') {
        const color = sel ? '#ffcc00' : (item.canApply ? '#ddd' : '#666');
        const targetName = item.targetItem ? ` → ${item.targetItem.name}` : '';
        Renderer.drawText(`${prefix}${item.name} [T${item.tier || 1}]${targetName}`, 70, y, color, 14);
        const goldCost = item.cost ? `${item.cost.gold}g` : '';
        Renderer.drawText(`${goldCost} | ${item.desc || ''}`, 70, y + 14, item.canApply ? '#888' : '#555', 10);
      }
    }

    // Item details for selected
    if (_shopSelected < _shopItems.length) {
      const item = _shopItems[_shopSelected];
      const detailY = h - 100;
      Renderer.drawPanel(60, detailY, w - 120, 40);
      const desc = item.desc || '';
      Renderer.drawText(desc, 80, detailY + 12, '#ccc', 12);
    }
  }

  function wrapText(text, maxWidth, fontSize) {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    const charWidth = fontSize * 0.6;
    const maxChars = Math.floor(maxWidth / charWidth);

    for (const word of words) {
      if ((current + ' ' + word).length > maxChars) {
        if (current) lines.push(current);
        current = word;
      } else {
        current = current ? current + ' ' + word : word;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  return { startDialogue, update, render, get active() { return _active; } };
})();
