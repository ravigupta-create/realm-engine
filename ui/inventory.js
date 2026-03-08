// ui/inventory.js — Inventory + equipment screen

const Inventory = (() => {
  let _selectedSlot = 0;
  let _tab = 'items'; // 'items', 'equipment', 'stats'

  function update(dt) {
    if (GS.state !== GameStates.INVENTORY) return;
    if (!GS.player) return;

    // Tab switching
    if (Input.actionPressed(Input.Actions.LEFT) || Input.actionPressed(Input.Actions.RIGHT)) {
      const tabs = ['items', 'equipment', 'stats'];
      const idx = tabs.indexOf(_tab);
      if (Input.actionPressed(Input.Actions.LEFT)) {
        _tab = tabs[(idx - 1 + tabs.length) % tabs.length];
      } else {
        _tab = tabs[(idx + 1) % tabs.length];
      }
      _selectedSlot = 0;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    if (_tab === 'items') {
      handleItemsInput();
    } else if (_tab === 'equipment') {
      handleEquipmentInput();
    }

    if (Input.actionPressed(Input.Actions.CANCEL) || Input.actionPressed(Input.Actions.INVENTORY)) {
      Core.setState(GameStates.PLAY);
    }
  }

  function handleItemsInput() {
    const items = GS.player.items;
    if (items.length === 0) return;

    if (Input.actionPressed(Input.Actions.UP)) {
      _selectedSlot = Math.max(0, _selectedSlot - 1);
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }
    if (Input.actionPressed(Input.Actions.DOWN)) {
      _selectedSlot = Math.min(items.length - 1, _selectedSlot + 1);
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    // Mouse wheel scroll
    const wheel = Input.getWheelDelta();
    if (wheel !== 0) {
      _selectedSlot = Math.max(0, Math.min(items.length - 1, _selectedSlot + Math.sign(wheel)));
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    if (Input.actionPressed(Input.Actions.CONFIRM)) {
      const item = items[_selectedSlot];
      if (item.type === 'equipment') {
        // Equip item
        equipItem(item);
        if (typeof AudioManager !== 'undefined') AudioManager.playSFX('equip');
      } else if (item.type === 'consumable') {
        // Use consumable
        useItem(item);
        if (typeof AudioManager !== 'undefined') AudioManager.playSFX('item');
      }
    }
  }

  function handleEquipmentInput() {
    const slots = Items.slotTypes;
    if (Input.actionPressed(Input.Actions.UP)) {
      _selectedSlot = Math.max(0, _selectedSlot - 1);
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }
    if (Input.actionPressed(Input.Actions.DOWN)) {
      _selectedSlot = Math.min(slots.length - 1, _selectedSlot + 1);
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    // Mouse wheel scroll
    const wheel = Input.getWheelDelta();
    if (wheel !== 0) {
      _selectedSlot = Math.max(0, Math.min(slots.length - 1, _selectedSlot + Math.sign(wheel)));
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    if (Input.actionPressed(Input.Actions.CONFIRM)) {
      // Unequip
      const slot = slots[_selectedSlot];
      const equipped = GS.player.equipment[slot];
      if (equipped) {
        unequipItem(slot);
        if (typeof AudioManager !== 'undefined') AudioManager.playSFX('equip');
      }
    }
  }

  function equipItem(item) {
    if (item.type !== 'equipment') return;
    const slot = item.slot;

    // Unequip current
    if (GS.player.equipment[slot]) {
      GS.player.items.push(GS.player.equipment[slot]);
    }

    // Remove from inventory and equip
    const idx = GS.player.items.indexOf(item);
    if (idx >= 0) GS.player.items.splice(idx, 1);
    GS.player.equipment[slot] = item;

    recalcStats();
    Core.addNotification(`Equipped: ${item.name}`, 2);
  }

  function unequipItem(slot) {
    const item = GS.player.equipment[slot];
    if (!item) return;
    GS.player.items.push(item);
    GS.player.equipment[slot] = null;
    recalcStats();
    Core.addNotification(`Unequipped: ${item.name}`, 2);
  }

  function useItem(item) {
    if (item.effect === 'heal_hp') {
      GS.player.stats.hp = Math.min(GS.player.stats.maxHp, GS.player.stats.hp + item.value);
      Core.addNotification(`+${item.value} HP`, 2);
    } else if (item.effect === 'heal_mp') {
      GS.player.stats.mp = Math.min(GS.player.stats.maxMp, GS.player.stats.mp + item.value);
      Core.addNotification(`+${item.value} MP`, 2);
    } else if (item.effect === 'heal_both') {
      GS.player.stats.hp = Math.min(GS.player.stats.maxHp, GS.player.stats.hp + item.value);
      GS.player.stats.mp = Math.min(GS.player.stats.maxMp, GS.player.stats.mp + item.value);
      Core.addNotification(`+${item.value} HP & MP`, 2);
    } else if (item.effect === 'revive' && GS.player.party) {
      const dead = GS.player.party.find(a => a.stats && a.stats.hp <= 0);
      if (dead) {
        dead.stats.hp = Math.floor(dead.stats.maxHp * 0.5);
        Core.addNotification(`Revived ${dead.name}!`, 2);
      } else {
        Core.addNotification('No fallen allies to revive.', 2);
        return; // Don't consume item
      }
    } else if (item.effect === 'cure_poison') {
      Core.addNotification('Poison cured!', 2);
    } else if (item.effect === 'buff_str') {
      Core.addNotification(`+${item.value} STR (use in combat)`, 2);
      return; // Don't consume outside combat
    } else if (item.effect === 'none') {
      return; // Tools like fishing rod - don't consume
    }
    const idx = GS.player.items.indexOf(item);
    if (idx >= 0) GS.player.items.splice(idx, 1);
    if (_selectedSlot >= GS.player.items.length) {
      _selectedSlot = Math.max(0, GS.player.items.length - 1);
    }
  }

  function recalcStats() {
    // Base stats from class
    const cls = Classes.getClass(GS.player.classType);
    if (!cls) return;

    const level = GS.player.stats.level;
    const growth = cls.growth;

    // Base + level growth
    const base = { ...cls.baseStats };
    for (let i = 1; i < level; i++) {
      base.maxHp += growth.hp;
      base.maxMp += growth.mp;
      base.str += growth.str;
      base.def += growth.def;
      base.int += growth.int;
      base.agi += growth.agi;
      base.luk += growth.luk;
    }

    // Equipment bonuses
    const bonus = Items.getEquipmentBonus(GS.player.equipment);

    GS.player.stats.maxHp = base.maxHp + (bonus.hp || 0);
    GS.player.stats.maxMp = base.maxMp + (bonus.mp || 0);
    GS.player.stats.str = base.str + (bonus.str || 0);
    GS.player.stats.def = base.def + (bonus.def || 0);
    GS.player.stats.int = base.int + (bonus.int || 0);
    GS.player.stats.agi = base.agi + (bonus.agi || 0);
    GS.player.stats.luk = base.luk + (bonus.luk || 0);

    // Clamp HP/MP
    GS.player.stats.hp = Math.min(GS.player.stats.hp, GS.player.stats.maxHp);
    GS.player.stats.mp = Math.min(GS.player.stats.mp, GS.player.stats.maxMp);
  }

  function render() {
    if (GS.state !== GameStates.INVENTORY) return;

    const w = Renderer.getWidth();
    const h = Renderer.getHeight();

    Renderer.drawPanel(30, 30, w - 60, h - 60, 'rgba(0,0,0,0.92)', '#888');
    Renderer.drawText('INVENTORY', w / 2, 45, '#ffcc00', 22, 'center');

    // Tabs
    const tabs = ['items', 'equipment', 'stats'];
    const tabLabels = ['Items', 'Equipment', 'Stats'];
    for (let i = 0; i < tabs.length; i++) {
      const color = _tab === tabs[i] ? '#ffcc00' : '#666';
      Renderer.drawText(tabLabels[i], w / 2 + (i - 1) * 120, 75, color, 16, 'center');
    }

    if (_tab === 'items') renderItems(w, h);
    else if (_tab === 'equipment') renderEquipment(w, h);
    else if (_tab === 'stats') renderStats(w, h);

    Renderer.drawText('ESC to close | LEFT/RIGHT tabs | Scroll / Arrows + ENTER', w / 2, h - 50, '#555', 11, 'center');
  }

  function renderItems(w, h) {
    const items = GS.player.items;
    const startY = 105;

    if (items.length === 0) {
      Renderer.drawText('No items.', w / 2, h / 2, '#666', 16, 'center');
      return;
    }

    const maxShow = Math.floor((h - 220) / 26);
    const scrollOffset = Math.max(0, _selectedSlot - maxShow + 3);

    for (let i = scrollOffset; i < items.length && i < scrollOffset + maxShow; i++) {
      const item = items[i];
      const sel = i === _selectedSlot;
      const y = startY + (i - scrollOffset) * 26;
      const prefix = sel ? '> ' : '  ';
      const rarityColor = Items.getRarityColor(item.rarity || 'common');
      const color = sel ? '#fff' : rarityColor;
      Renderer.drawText(`${prefix}${item.name}`, 60, y, color, 13);

      if (item.type === 'equipment') {
        Renderer.drawText(`[${item.slot}]`, w - 150, y, '#888', 11, 'right');
      } else if (item.type === 'consumable') {
        Renderer.drawText('[Use]', w - 150, y, '#888', 11, 'right');
      } else if (item.type === 'material') {
        Renderer.drawText('[Material]', w - 150, y, '#888', 11, 'right');
      }
    }

    // Item details
    if (_selectedSlot < items.length) {
      const item = items[_selectedSlot];
      const detailY = h - 120;
      Renderer.drawPanel(50, detailY, w - 100, 55);
      Renderer.drawText(item.name, 70, detailY + 8, Items.getRarityColor(item.rarity || 'common'), 14);
      Renderer.drawText(item.desc || '', 70, detailY + 28, '#bbb', 11);
    }
  }

  function renderEquipment(w, h) {
    const slots = Items.slotTypes;
    const startY = 105;

    Renderer.drawText('Equipped Gear (ENTER to unequip)', w / 2, startY - 5, '#888', 12, 'center');

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const item = GS.player.equipment[slot];
      const sel = i === _selectedSlot;
      const y = startY + 20 + i * 35;
      const prefix = sel ? '> ' : '  ';

      Renderer.drawText(`${prefix}${slot.charAt(0).toUpperCase() + slot.slice(1)}:`, 60, y, '#aaa', 14);

      if (item) {
        const color = sel ? '#fff' : Items.getRarityColor(item.rarity);
        Renderer.drawText(item.name, 180, y, color, 14);

        // Stats
        const statText = Object.entries(item.stats || {})
          .filter(([, v]) => v !== 0)
          .map(([k, v]) => `${k.toUpperCase()}${v > 0 ? '+' : ''}${v}`)
          .join(' ');
        Renderer.drawText(statText, 180, y + 16, '#888', 10);
      } else {
        Renderer.drawText('Empty', 180, y, '#555', 14);
      }
    }

    // Total equipment bonuses
    const bonus = Items.getEquipmentBonus(GS.player.equipment);
    const bonusY = startY + 20 + slots.length * 35 + 20;
    Renderer.drawText('Equipment Bonuses:', 60, bonusY, '#aaa', 13);
    const bonusText = Object.entries(bonus)
      .filter(([, v]) => v !== 0)
      .map(([k, v]) => `${k.toUpperCase()}${v > 0 ? '+' : ''}${v}`)
      .join('  ');
    Renderer.drawText(bonusText, 70, bonusY + 20, '#4f4', 12);
  }

  function renderStats(w, h) {
    const s = GS.player.stats;
    const startY = 105;
    const col1 = 100, col2 = 300;

    // Portrait
    const portrait = SpriteGen.cache.portraits[GS.player.classType];
    if (portrait) {
      const ctx = Renderer.getCtx();
      ctx.drawImage(portrait, 60, startY, 64, 64);
    }

    Renderer.drawText(`${GS.player.name}`, 140, startY, '#ffcc00', 18);
    Renderer.drawText(`${GS.player.classType.charAt(0).toUpperCase() + GS.player.classType.slice(1)} - Level ${s.level}`, 140, startY + 24, '#aaa', 13);
    Renderer.drawText(`XP: ${s.xp}/${s.xpToNext}`, 140, startY + 44, '#aa0', 12);

    const y2 = startY + 80;
    Renderer.drawText('Stats', col1, y2, '#ffcc00', 16);

    const stats = [
      ['HP', `${s.hp}/${s.maxHp}`, '#c00'],
      ['MP', `${s.mp}/${s.maxMp}`, '#06a'],
      ['STR', s.str, '#f84'],
      ['DEF', s.def, '#48f'],
      ['INT', s.int, '#a4f'],
      ['AGI', s.agi, '#4f4'],
      ['LUK', s.luk, '#ff4']
    ];

    for (let i = 0; i < stats.length; i++) {
      const [label, val, color] = stats[i];
      const y = y2 + 25 + i * 28;
      Renderer.drawText(label, col1 + 10, y, '#aaa', 14);
      Renderer.drawText(String(val), col1 + 80, y, color, 14);
    }

    // Skills
    Renderer.drawText('Skills', col2, y2, '#ffcc00', 16);
    const skills = GS.player.skills || [];
    for (let i = 0; i < skills.length; i++) {
      Renderer.drawText(`${skills[i].name} (${skills[i].mpCost} MP)`, col2 + 10, y2 + 25 + i * 22, '#ccc', 12);
    }
    if (GS.player.skillPoints > 0) {
      Renderer.drawText(`${GS.player.skillPoints} skill point(s) available!`, col2 + 10, y2 + 25 + skills.length * 22 + 10, '#ffcc00', 12);
    }

    // Gold and play time
    Renderer.drawText(`Gold: ${GS.player.gold || 0}`, col1, h - 110, '#ffcc00', 14);
    const mins = Math.floor(GS.playTime / 60);
    const secs = Math.floor(GS.playTime % 60);
    Renderer.drawText(`Play Time: ${mins}m ${secs}s`, col1, h - 88, '#888', 12);
  }

  return { update, render, recalcStats, equipItem, unequipItem };
})();
