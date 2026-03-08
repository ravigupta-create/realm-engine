// ui/hud.js — Health/mana bars, level, gold, minimap, quickslots

const HUD = (() => {
  function render() {
    if (GS.state !== GameStates.PLAY) return;
    if (!GS.player) return;

    const w = Renderer.getWidth();
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

    // ======== Quickslots ========
    const slotSize = 36;
    const slotY = Renderer.getHeight() - slotSize - 10;
    const slotStartX = w / 2 - (slotSize * 4 + 12) / 2;

    for (let i = 0; i < 4; i++) {
      const x = slotStartX + i * (slotSize + 4);
      Renderer.drawPanel(x, slotY, slotSize, slotSize, 'rgba(0,0,0,0.6)', '#555');
      Renderer.drawText(`${i + 1}`, x + 3, slotY + 2, '#666', 10);

      // Show skill name if assigned
      if (GS.player.skills && GS.player.skills[i]) {
        const skill = GS.player.skills[i];
        Renderer.drawText(skill.name.substring(0, 4), x + slotSize / 2, slotY + slotSize / 2 - 5, '#aaa', 9, 'center');
      }
    }

    // ======== Time of day ========
    if (typeof DayNight !== 'undefined') {
      const time = DayNight.getTimeOfDay();
      const timeStr = `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}`;
      Renderer.drawText(`${timeStr} ${DayNight.getTimeName()}`, w - 160, Renderer.getHeight() - 20, '#888', 11, 'left');
    }

    // ======== FPS ========
    if (GS.settings.showFPS) {
      Renderer.drawText(`FPS: ${GS.fps}`, w - 80, Renderer.getHeight() - 20, '#0f0', 11);
    }

    // ======== Controls hint ========
    Renderer.drawText('I:Inventory  Q:Quests  E:Interact  P:Pause', w / 2, Renderer.getHeight() - 8, '#444', 9, 'center');

    // ======== Minimap ========
    Minimap.render();

    // ======== Quest tracker ========
    QuestLog.renderTracker();
  }

  return { render };
})();
