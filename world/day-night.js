// world/day-night.js — Day/night cycle overlay

const DayNight = (() => {
  // Game time: 1 real second = 1 game minute
  // Full day = 24 game hours = 1440 game minutes = 1440 real seconds = 24 real minutes

  function getTimeOfDay() {
    const totalMinutes = GS.gameTime % 1440; // 24 * 60
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    return { hours, minutes, totalMinutes };
  }

  function getTimeName() {
    const { hours } = getTimeOfDay();
    if (hours >= 6 && hours < 12) return 'Morning';
    if (hours >= 12 && hours < 17) return 'Afternoon';
    if (hours >= 17 && hours < 20) return 'Evening';
    return 'Night';
  }

  function getDarkness() {
    const { hours, minutes } = getTimeOfDay();
    const t = hours + minutes / 60;

    // Dawn: 5-7, Dusk: 18-20
    if (t >= 7 && t <= 18) return 0;          // Full daylight
    if (t >= 20 || t <= 5) return 0.55;       // Full night
    if (t > 5 && t < 7) return 0.55 * (1 - (t - 5) / 2);  // Dawn
    if (t > 18 && t < 20) return 0.55 * ((t - 18) / 2);    // Dusk
    return 0;
  }

  function getTint() {
    const { hours, minutes } = getTimeOfDay();
    const t = hours + minutes / 60;

    if (t >= 5 && t < 7) return { r: 255, g: 180, b: 100, a: 0.15 };  // Dawn warm
    if (t >= 17 && t < 20) return { r: 255, g: 120, b: 50, a: 0.2 };  // Dusk warm
    if (t >= 20 || t < 5) return { r: 50, g: 50, b: 120, a: 0 };      // Night (handled by darkness)
    return null;
  }

  function render() {
    const zone = WorldManager.getZone();
    // Caves and dungeons are always dark
    const isDungeon = zone && (zone.id === 'shadowmere' || zone.id === 'abyss' || zone.id === 'crystal_sanctum');

    const ctx = Renderer.getCtx();
    const w = Renderer.getWidth();
    const h = Renderer.getHeight();

    if (isDungeon) {
      // Dungeon darkness with player light radius
      ctx.save();
      const px = GS.player.x * Renderer.SCALED_TILE - GS.camera.x + Renderer.SCALED_TILE / 2;
      const py = GS.player.y * Renderer.SCALED_TILE - GS.camera.y;

      // Radial gradient for torch light
      const gradient = ctx.createRadialGradient(px, py, 20, px, py, 200);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(0.6, 'rgba(0,0,0,0.4)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.75)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      // Slight warm tint from torchlight
      ctx.fillStyle = 'rgba(255,150,50,0.05)';
      ctx.fillRect(0, 0, w, h);
    } else {
      // Outdoor day/night cycle
      const darkness = getDarkness();
      if (darkness > 0) {
        ctx.fillStyle = `rgba(10,10,40,${darkness})`;
        ctx.fillRect(0, 0, w, h);

        // Player torch glow at night
        if (darkness > 0.3 && GS.player) {
          ctx.save();
          const px = GS.player.x * Renderer.SCALED_TILE - GS.camera.x + Renderer.SCALED_TILE / 2;
          const py = GS.player.y * Renderer.SCALED_TILE - GS.camera.y;
          ctx.globalCompositeOperation = 'destination-out';
          const grad = ctx.createRadialGradient(px, py, 10, px, py, 150);
          grad.addColorStop(0, `rgba(0,0,0,${darkness * 0.7})`);
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
          ctx.restore();
        }
      }

      // Color tint
      const tint = getTint();
      if (tint && tint.a > 0) {
        ctx.fillStyle = `rgba(${tint.r},${tint.g},${tint.b},${tint.a})`;
        ctx.fillRect(0, 0, w, h);
      }
    }
  }

  return { render, getTimeOfDay, getTimeName, getDarkness };
})();
