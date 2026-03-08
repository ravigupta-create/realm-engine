// combat/enemy-ai.js — Enemy behavior patterns in combat

const EnemyAI = (() => {
  // AI patterns
  const patterns = {
    aggressive: (enemy, player) => {
      // Always attack, use strongest ability when available
      if (enemy.abilities && enemy.abilities.length > 0) {
        const usable = enemy.abilities.filter(a => enemy.stats.mp >= a.mpCost);
        if (usable.length > 0 && Math.random() > 0.3) {
          const skill = usable[Math.floor(Math.random() * usable.length)];
          return { type: 'skill', skill };
        }
      }
      return { type: 'attack' };
    },

    defensive: (enemy, player) => {
      // Heal when low HP, otherwise attack
      const hpRatio = enemy.stats.hp / enemy.stats.maxHp;
      if (hpRatio < 0.35 && enemy.stats.mp >= 15 && Math.random() > 0.3) {
        return { type: 'heal' };
      }
      if (enemy.abilities && enemy.abilities.length > 0 && Math.random() > 0.5) {
        const usable = enemy.abilities.filter(a => enemy.stats.mp >= a.mpCost);
        if (usable.length > 0) {
          return { type: 'skill', skill: usable[Math.floor(Math.random() * usable.length)] };
        }
      }
      return { type: 'attack' };
    },

    caster: (enemy, player) => {
      // Prioritize magic attacks
      if (enemy.abilities && enemy.abilities.length > 0) {
        const usable = enemy.abilities.filter(a => enemy.stats.mp >= a.mpCost);
        if (usable.length > 0 && Math.random() > 0.15) {
          // Pick highest power
          usable.sort((a, b) => (b.power || 0) - (a.power || 0));
          return { type: 'skill', skill: usable[0] };
        }
      }
      return { type: 'attack' };
    },

    boss_phase: (enemy, player) => {
      const hpRatio = enemy.stats.hp / enemy.stats.maxHp;

      // Phase 3: Below 25% - go all out
      if (hpRatio < 0.25) {
        if (enemy.abilities && enemy.abilities.length > 0) {
          const usable = enemy.abilities.filter(a => enemy.stats.mp >= a.mpCost);
          if (usable.length > 0) {
            // Use strongest
            usable.sort((a, b) => (b.power || 0) - (a.power || 0));
            return { type: 'skill', skill: usable[0] };
          }
        }
        return { type: 'attack' };
      }

      // Phase 2: Below 50% - mix of heal and attack
      if (hpRatio < 0.5) {
        if (Math.random() < 0.3 && enemy.stats.mp >= 15) {
          return { type: 'heal' };
        }
        if (enemy.abilities && enemy.abilities.length > 0) {
          const usable = enemy.abilities.filter(a => enemy.stats.mp >= a.mpCost);
          if (usable.length > 0 && Math.random() > 0.3) {
            return { type: 'skill', skill: usable[Math.floor(Math.random() * usable.length)] };
          }
        }
        return { type: 'attack' };
      }

      // Phase 1: Above 50% - normal combat
      return patterns.aggressive(enemy, player);
    }
  };

  function decide(enemy, player) {
    const patternName = enemy.isBoss ? 'boss_phase' : getPatternForType(enemy.enemyType);
    const pattern = patterns[patternName] || patterns.aggressive;
    return pattern(enemy, player);
  }

  function getPatternForType(enemyType) {
    const typePatterns = {
      slime: 'aggressive',
      bat: 'aggressive',
      wolf: 'aggressive',
      goblin: 'aggressive',
      skeleton: 'aggressive',
      scorpion: 'aggressive',
      spider: 'aggressive',
      mushroom: 'defensive',
      fire_imp: 'caster',
      sand_wurm: 'aggressive',
      frost_wolf: 'aggressive',
      harpy: 'aggressive',
      mimic: 'aggressive',
      treant: 'defensive',
      gargoyle: 'defensive',
      ghost: 'caster',
      wraith: 'caster',
      necromancer_enemy: 'caster',
      ice_elemental: 'caster',
      lava_golem: 'defensive',
      crystal_golem: 'defensive',
      shadow_assassin: 'aggressive',
      demon: 'aggressive',
      lich: 'caster',
      yeti: 'defensive',
      blood_knight: 'defensive',
      elemental_lord: 'boss_phase',
      void_horror: 'boss_phase',
      phoenix_enemy: 'caster',
      golem: 'defensive',
      dragon: 'boss_phase',
      dark_knight: 'defensive'
    };
    return typePatterns[enemyType] || 'aggressive';
  }

  return { decide, patterns };
})();
