// ui/quest-log.js — Quest tracker UI

const QuestLog = (() => {
  let _selectedQuest = 0;
  let _tab = 'active'; // 'active' or 'completed'

  function update(dt) {
    if (GS.state !== GameStates.QUEST_LOG) return;

    const quests = _tab === 'active' ? Quests.getActiveQuests() : Quests.getCompletedQuests();

    if (Input.actionPressed(Input.Actions.UP)) {
      _selectedQuest = Math.max(0, _selectedQuest - 1);
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }
    if (Input.actionPressed(Input.Actions.DOWN)) {
      _selectedQuest = Math.min(quests.length - 1, _selectedQuest + 1);
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    if (Input.actionPressed(Input.Actions.LEFT) || Input.actionPressed(Input.Actions.RIGHT)) {
      _tab = _tab === 'active' ? 'completed' : 'active';
      _selectedQuest = 0;
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('menu_move');
    }

    if (Input.actionPressed(Input.Actions.CANCEL) || Input.actionPressed(Input.Actions.QUEST_LOG)) {
      Core.setState(GameStates.PLAY);
    }
  }

  function render() {
    if (GS.state !== GameStates.QUEST_LOG) return;

    const w = Renderer.getWidth();
    const h = Renderer.getHeight();

    // Background
    Renderer.drawPanel(30, 30, w - 60, h - 60, 'rgba(0,0,0,0.92)', '#888');
    Renderer.drawText('QUEST LOG', w / 2, 45, '#ffcc00', 22, 'center');

    // Tabs
    const tabY = 75;
    const activeColor = _tab === 'active' ? '#ffcc00' : '#666';
    const completedColor = _tab === 'completed' ? '#ffcc00' : '#666';
    Renderer.drawText('Active', w / 2 - 80, tabY, activeColor, 16, 'center');
    Renderer.drawText('|', w / 2, tabY, '#444', 16, 'center');
    Renderer.drawText('Completed', w / 2 + 80, tabY, completedColor, 16, 'center');

    const quests = _tab === 'active' ? Quests.getActiveQuests() : Quests.getCompletedQuests();

    if (quests.length === 0) {
      Renderer.drawText('No quests.', w / 2, h / 2, '#666', 16, 'center');
      Renderer.drawText('ESC to close', w / 2, h / 2 + 30, '#444', 12, 'center');
      return;
    }

    // Quest list (left panel)
    const listX = 60;
    const listY = 110;
    const listW = 250;

    for (let i = 0; i < quests.length; i++) {
      const q = quests[i];
      const sel = i === _selectedQuest;
      const prefix = sel ? '> ' : '  ';
      const isMain = q.type === 'main';
      const color = sel ? '#ffcc00' : (isMain ? '#ff8844' : '#ccc');
      Renderer.drawText(prefix + q.name, listX, listY + i * 28, color, 14);
      if (isMain) {
        Renderer.drawText('[MAIN]', listX + listW, listY + i * 28, '#ff8844', 10, 'right');
      }
    }

    // Quest details (right panel)
    if (_selectedQuest < quests.length) {
      const quest = quests[_selectedQuest];
      const detailX = listX + listW + 40;
      const detailY = listY;
      const detailW = w - detailX - 60;

      Renderer.drawPanel(detailX - 10, detailY - 10, detailW + 20, h - detailY - 50);
      Renderer.drawText(quest.name, detailX, detailY, '#ffcc00', 18);
      Renderer.drawText(quest.desc, detailX, detailY + 28, '#bbb', 12);

      // Objectives
      Renderer.drawText('Objectives:', detailX, detailY + 60, '#aaa', 14);
      for (let i = 0; i < quest.objectives.length; i++) {
        const obj = quest.objectives[i];
        const checkmark = obj.done ? '[X]' : '[ ]';
        const color = obj.done ? '#4f4' : '#ddd';
        let text = obj.desc;
        if (obj.count !== undefined) {
          text += ` (${obj.current || 0}/${obj.count})`;
        }
        Renderer.drawText(`${checkmark} ${text}`, detailX + 10, detailY + 85 + i * 24, color, 12);
      }

      // Rewards
      if (quest.rewards && _tab === 'active') {
        const rwdY = detailY + 85 + quest.objectives.length * 24 + 20;
        Renderer.drawText('Rewards:', detailX, rwdY, '#aaa', 14);
        const parts = [];
        if (quest.rewards.xp) parts.push(`${quest.rewards.xp} XP`);
        if (quest.rewards.gold) parts.push(`${quest.rewards.gold} Gold`);
        Renderer.drawText(parts.join(', '), detailX + 10, rwdY + 22, '#ffcc00', 12);
      }
    }

    Renderer.drawText('ESC to close | LEFT/RIGHT to switch tabs', w / 2, h - 50, '#555', 11, 'center');
  }

  // Mini quest tracker for HUD
  function renderTracker() {
    if (GS.state !== GameStates.PLAY) return;

    const active = Quests.getActiveQuests();
    if (active.length === 0) return;

    const x = 10;
    let y = 180;

    // Show first active quest
    const q = active[0];
    Renderer.drawText(q.name, x, y, '#ffcc00', 11, 'left', true);
    y += 16;

    for (const obj of q.objectives) {
      if (obj.done) continue;
      let text = obj.desc;
      if (obj.count !== undefined) text += ` (${obj.current || 0}/${obj.count})`;
      Renderer.drawText('- ' + text, x + 5, y, '#aaa', 10);
      y += 14;
      if (y > 260) break;
    }
  }

  return { update, render, renderTracker };
})();
