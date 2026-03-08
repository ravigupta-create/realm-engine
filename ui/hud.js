// ui/hud.js — Health/mana bars, level, gold, minimap, quickslots, party, pets

const HUD = (() => {
  function render() {
    if (GS.state !== GameStates.PLAY) return;
    if (!GS.player) return;

    const w = Renderer.getWidth();
    const h = Renderer.getHeight();
    const stats = GS.player.stats;

    // ======== HP Bar ========
    const hpX = 10, hpY = 10, hpW = 200, hpH = 18;
    Renderer.drawBar(hpX, hpY, hpW, hpH, stats.hp / stats.maxHp, '#c00', '#400');
    Renderer.drawText(`HP: ${stats.hp}/${stats.maxHp}`, hpX + hpW / 2, hpY + 2, '#fff', 12, 'center');

    // ======== MP Bar ========
    const mpY = hpY + hpH + 4;
    Renderer.drawBar(hpX, mpY, hpW, hpH, stats.mp / stats.maxMp, '#06a', '#024');
    Renderer.drawText(`MP: ${stats.mp}/${stats.maxMp}`, hpX + hpW / 2, mpY + 2, '#fff', 12, 'center');

    // ======== XP Bar ========
    const xpY = mpY + hpH + 4;
    Renderer.drawBar(hpX, xpY, hpW, 8, stats.xp / stats.xpToNext, '#aa0', '#440');

    // ======== Level & Gold ========
    Renderer.drawText(`Lv.${stats.level}`, hpX, xpY + 14, '#fff', 14, 'left', true);
    Renderer.drawText(`${GS.player.gold || 0}g`, hpX + 60, xpY + 14, '#ffcc00', 14, 'left', true);

    // ======== Party HP Bars ========
    let partyY = xpY + 32;
    const party = GS.player.party || [];
    if (party.length > 0) {
      for (const ally of party) {
        const hpPct = ally.stats.hp / Math.max(1, ally.stats.maxHp);
        const allyColor = ally.stats.hp > 0 ? '#4a4' : '#600';
        Renderer.drawBar(hpX, partyY, 120, 10, hpPct, allyColor, '#222');
        Renderer.drawText(ally.name, hpX + 125, partyY - 1, ally.stats.hp > 0 ? '#8c8' : '#644', 9);
        partyY += 16;
      }
    }

    // ======== Active Pet ========
    if (GS.player.activePet) {
      const pet = GS.player.activePet;
      const petY = partyY + 2;
      const rarityColors = { common: '#aaa', uncommon: '#5c5', rare: '#55f', epic: '#a5f', legendary: '#fa0' };
      const pColor = rarityColors[pet.rarity] || '#aaa';
      Renderer.drawText(`\u2605 ${pet.name} Lv.${pet.level}`, hpX, petY, pColor, 10);
      // Pet XP bar
      const petXpPct = pet.xp / Math.max(1, pet.xpToNext);
      Renderer.drawBar(hpX, petY + 14, 80, 4, petXpPct, '#f0c040', '#332');
    }

    // ======== Quickslots ========
    const slotSize = 36;
    const slotY = h - slotSize - 10;
    const slotStartX = w / 2 - (slotSize * 4 + 12) / 2;

    for (let i = 0; i < 4; i++) {
      const x = slotStartX + i * (slotSize + 4);
      Renderer.drawPanel(x, slotY, slotSize, slotSize, 'rgba(0,0,0,0.6)', '#555');
      Renderer.drawText(`${i + 1}`, x + 3, slotY + 2, '#666', 10);

      if (GS.player.skills && GS.player.skills[i]) {
        const skill = GS.player.skills[i];
        const canUse = stats.mp >= skill.mpCost;
        Renderer.drawText(skill.name.substring(0, 4), x + slotSize / 2, slotY + slotSize / 2 - 5, canUse ? '#aaa' : '#555', 9, 'center');
        Renderer.drawText(`${skill.mpCost}`, x + slotSize / 2, slotY + slotSize - 10, canUse ? '#68a' : '#334', 7, 'center');
      }
    }

    // ======== Difficulty + NG+ indicator ========
    if (GS.ngPlus > 0 || (GS.difficulty && GS.difficulty !== 'normal')) {
      let badge = '';
      if (GS.ngPlus > 0) badge += `NG+${GS.ngPlus} `;
      if (GS.difficulty && GS.difficulty !== 'normal') {
        badge += GS.difficulty.charAt(0).toUpperCase() + GS.difficulty.slice(1);
      }
      const diffColors = { easy: '#4a4', normal: '#aaa', hard: '#f80', nightmare: '#f44' };
      Renderer.drawText(badge.trim(), w - 160, 10, diffColors[GS.difficulty] || '#aaa', 10, 'left');
    }

    // ======== Time of day ========
    if (typeof DayNight !== 'undefined') {
      const time = DayNight.getTimeOfDay();
      const timeStr = `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}`;
      Renderer.drawText(`${timeStr} ${DayNight.getTimeName()}`, w - 160, h - 20, '#888', 11, 'left');
    }

    // ======== FPS ========
    if (GS.settings.showFPS) {
      Renderer.drawText(`FPS: ${GS.fps}`, w - 80, h - 20, '#0f0', 11);
    }

    // ======== Controls hint ========
    Renderer.drawText('I:Inventory  Q:Quests  E:Interact  P:Pause', w / 2, h - 8, '#444', 9, 'center');

    // ======== Minimap ========
    Minimap.render();

    // ======== Quest tracker ========
    QuestLog.renderTracker();

    // ======== Notifications ========
    renderNotifications(w, h);
  }

  function renderNotifications(w, h) {
    const notifs = GS.notifications;
    for (let i = notifs.length - 1; i >= 0; i--) {
      const n = notifs[i];
      n.timer -= GS.dt;
      if (n.timer <= 0) {
        n.alpha -= GS.dt * 2;
        if (n.alpha <= 0) {
          notifs.splice(i, 1);
          continue;
        }
      }
      const ny = h * 0.2 + (notifs.length - 1 - i) * 24;
      const ctx = Renderer.getCtx();
      ctx.globalAlpha = Math.min(1, n.alpha);
      Renderer.drawText(n.text, w / 2, ny, '#f0c040', 14, 'center', true);
      ctx.globalAlpha = 1;
    }
  }

  return { render };
})();
