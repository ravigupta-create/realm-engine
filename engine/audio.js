// engine/audio.js — Web Audio API procedural SFX + music

const AudioManager = (() => {
  let _ctx = null;
  let _masterGain = null;
  let _sfxGain = null;
  let _musicGain = null;
  let _currentMusic = null;
  let _musicNodes = [];
  let _initialized = false;

  function init() {
    // Defer AudioContext creation to first user interaction
    document.addEventListener('click', _initAudio, { once: true });
    document.addEventListener('keydown', _initAudio, { once: true });
  }

  function _initAudio() {
    if (_initialized) return;
    try {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
      _masterGain = _ctx.createGain();
      _masterGain.gain.value = 0.5;
      _masterGain.connect(_ctx.destination);

      _sfxGain = _ctx.createGain();
      _sfxGain.gain.value = GS.settings.sfxVolume;
      _sfxGain.connect(_masterGain);

      _musicGain = _ctx.createGain();
      _musicGain.gain.value = GS.settings.musicVolume;
      _musicGain.connect(_masterGain);

      _initialized = true;
    } catch (e) {
      // Audio not available
    }
  }

  function ensureContext() {
    if (!_initialized) _initAudio();
    if (_ctx && _ctx.state === 'suspended') _ctx.resume();
    return _initialized;
  }

  // ======== SFX ========

  function playSFX(type) {
    if (!ensureContext()) return;

    switch (type) {
      case 'hit': sfxHit(); break;
      case 'slash': sfxSlash(); break;
      case 'magic': sfxMagic(); break;
      case 'heal': sfxHeal(); break;
      case 'menu_move': sfxClick(800, 0.05); break;
      case 'menu_select': sfxClick(1200, 0.08); break;
      case 'coin': sfxCoin(); break;
      case 'chest': sfxChest(); break;
      case 'levelup': sfxLevelUp(); break;
      case 'combat_start': sfxCombatStart(); break;
      case 'defend': sfxClick(400, 0.1); break;
      case 'item': sfxClick(600, 0.08); break;
      case 'buff': sfxBuff(); break;
      case 'equip': sfxClick(500, 0.06); break;
      case 'quest': sfxQuest(); break;
      case 'quest_complete': sfxQuestComplete(); break;
      case 'fire': sfxFire(); break;
      case 'ice': sfxIce(); break;
      case 'lightning': sfxLightning(); break;
      case 'dark': sfxDark(); break;
      case 'holy': sfxHoly(); break;
      case 'earth': sfxEarth(); break;
      case 'poison': sfxPoison(); break;
      case 'victory': sfxVictory(); break;
      case 'defeat': sfxDefeat(); break;
      case 'critical': sfxCritical(); break;
      case 'dodge': sfxDodge(); break;
      case 'death': sfxDeath(); break;
      case 'arcane': sfxArcane(); break;
    }
  }

  function sfxHit() {
    // Noise burst + pitch sweep
    const dur = 0.15;
    const bufSize = Math.floor(_ctx.sampleRate * dur);
    const buf = _ctx.createBuffer(1, bufSize, _ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const t = i / bufSize;
      data[i] = (Math.random() * 2 - 1) * (1 - t) * 0.6;
    }
    const src = _ctx.createBufferSource();
    src.buffer = buf;
    src.connect(_sfxGain);
    src.start();
  }

  function sfxSlash() {
    const dur = 0.2;
    const bufSize = Math.floor(_ctx.sampleRate * dur);
    const buf = _ctx.createBuffer(1, bufSize, _ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const t = i / bufSize;
      const freq = 200 + (1 - t) * 800;
      data[i] = Math.sin(i * freq / _ctx.sampleRate * Math.PI * 2) * (1 - t) * 0.3
        + (Math.random() * 2 - 1) * (1 - t) * 0.2;
    }
    const src = _ctx.createBufferSource();
    src.buffer = buf;
    src.connect(_sfxGain);
    src.start();
  }

  function sfxMagic() {
    // Oscillator sweep + reverb
    const osc = _ctx.createOscillator();
    const gain = _ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, _ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, _ctx.currentTime + 0.2);
    osc.frequency.exponentialRampToValueAtTime(400, _ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.3, _ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, _ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(_sfxGain);
    osc.start();
    osc.stop(_ctx.currentTime + 0.5);

    // Shimmer
    const osc2 = _ctx.createOscillator();
    const gain2 = _ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(800, _ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(2000, _ctx.currentTime + 0.3);
    gain2.gain.setValueAtTime(0.1, _ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.01, _ctx.currentTime + 0.4);
    osc2.connect(gain2);
    gain2.connect(_sfxGain);
    osc2.start();
    osc2.stop(_ctx.currentTime + 0.4);
  }

  function sfxHeal() {
    const notes = [523, 659, 784]; // C5, E5, G5 arpeggio
    notes.forEach((freq, i) => {
      const osc = _ctx.createOscillator();
      const gain = _ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, _ctx.currentTime + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.2, _ctx.currentTime + i * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, _ctx.currentTime + i * 0.1 + 0.4);
      osc.connect(gain);
      gain.connect(_sfxGain);
      osc.start(_ctx.currentTime + i * 0.1);
      osc.stop(_ctx.currentTime + i * 0.1 + 0.4);
    });
  }

  function sfxClick(freq, dur) {
    const osc = _ctx.createOscillator();
    const gain = _ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq || 800;
    gain.gain.setValueAtTime(0.15, _ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, _ctx.currentTime + (dur || 0.05));
    osc.connect(gain);
    gain.connect(_sfxGain);
    osc.start();
    osc.stop(_ctx.currentTime + (dur || 0.05));
  }

  function sfxCoin() {
    [1200, 1600].forEach((freq, i) => {
      const osc = _ctx.createOscillator();
      const gain = _ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, _ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, _ctx.currentTime + i * 0.08 + 0.15);
      osc.connect(gain);
      gain.connect(_sfxGain);
      osc.start(_ctx.currentTime + i * 0.08);
      osc.stop(_ctx.currentTime + i * 0.08 + 0.15);
    });
  }

  function sfxChest() {
    sfxClick(300, 0.1);
    setTimeout(() => sfxCoin(), 200);
  }

  function sfxLevelUp() {
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = _ctx.createOscillator();
      const gain = _ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, _ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.2, _ctx.currentTime + i * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, _ctx.currentTime + i * 0.12 + 0.5);
      osc.connect(gain);
      gain.connect(_sfxGain);
      osc.start(_ctx.currentTime + i * 0.12);
      osc.stop(_ctx.currentTime + i * 0.12 + 0.5);
    });
  }

  function sfxCombatStart() {
    const osc = _ctx.createOscillator();
    const gain = _ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, _ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, _ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.15, _ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, _ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(_sfxGain);
    osc.start();
    osc.stop(_ctx.currentTime + 0.4);
  }

  function sfxBuff() {
    [400, 500, 600, 800].forEach((freq, i) => {
      const osc = _ctx.createOscillator();
      const gain = _ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, _ctx.currentTime + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, _ctx.currentTime + i * 0.06 + 0.2);
      osc.connect(gain);
      gain.connect(_sfxGain);
      osc.start(_ctx.currentTime + i * 0.06);
      osc.stop(_ctx.currentTime + i * 0.06 + 0.2);
    });
  }

  function sfxQuest() {
    sfxClick(600, 0.1);
    setTimeout(() => sfxClick(800, 0.1), 100);
  }

  function sfxQuestComplete() {
    sfxLevelUp();
    setTimeout(() => sfxCoin(), 500);
  }

  // ======== Element SFX ========

  function sfxFire() {
    // Crackling noise + rising pitch
    const dur = 0.4;
    const bufSize = Math.floor(_ctx.sampleRate * dur);
    const buf = _ctx.createBuffer(1, bufSize, _ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const t = i / bufSize;
      const crackle = Math.random() > 0.85 ? (Math.random() * 2 - 1) * 0.5 : 0;
      data[i] = (Math.sin(i * (200 + t * 600) / _ctx.sampleRate * Math.PI * 2) * 0.2 + crackle) * (1 - t * 0.7);
    }
    const src = _ctx.createBufferSource();
    src.buffer = buf;
    src.connect(_sfxGain);
    src.start();
  }

  function sfxIce() {
    // Shimmering high-frequency sweep
    const osc = _ctx.createOscillator();
    const gain = _ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, _ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(500, _ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, _ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, _ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(_sfxGain);
    osc.start();
    osc.stop(_ctx.currentTime + 0.4);
    // Crystal shimmer
    const osc2 = _ctx.createOscillator();
    const gain2 = _ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(3000, _ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(1000, _ctx.currentTime + 0.25);
    gain2.gain.setValueAtTime(0.08, _ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.01, _ctx.currentTime + 0.3);
    osc2.connect(gain2);
    gain2.connect(_sfxGain);
    osc2.start();
    osc2.stop(_ctx.currentTime + 0.3);
  }

  function sfxLightning() {
    // Sharp crack + rumble
    const dur = 0.3;
    const bufSize = Math.floor(_ctx.sampleRate * dur);
    const buf = _ctx.createBuffer(1, bufSize, _ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const t = i / bufSize;
      const crack = t < 0.05 ? (Math.random() * 2 - 1) * 0.8 : 0;
      const rumble = Math.sin(i * 60 / _ctx.sampleRate * Math.PI * 2) * (1 - t) * 0.15;
      data[i] = crack + rumble + (Math.random() * 2 - 1) * Math.max(0, 0.3 - t) * 0.4;
    }
    const src = _ctx.createBufferSource();
    src.buffer = buf;
    src.connect(_sfxGain);
    src.start();
  }

  function sfxDark() {
    // Deep ominous drone + descending sweep
    const osc = _ctx.createOscillator();
    const gain = _ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, _ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, _ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.15, _ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, _ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(_sfxGain);
    osc.start();
    osc.stop(_ctx.currentTime + 0.5);
  }

  function sfxHoly() {
    // Angelic chord (major triad rising)
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = _ctx.createOscillator();
      const gain = _ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, _ctx.currentTime + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.12, _ctx.currentTime + i * 0.05 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, _ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(_sfxGain);
      osc.start(_ctx.currentTime + i * 0.05);
      osc.stop(_ctx.currentTime + 0.6);
    });
  }

  function sfxEarth() {
    // Low rumble + impact
    const dur = 0.35;
    const bufSize = Math.floor(_ctx.sampleRate * dur);
    const buf = _ctx.createBuffer(1, bufSize, _ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const t = i / bufSize;
      data[i] = Math.sin(i * 80 / _ctx.sampleRate * Math.PI * 2) * (1 - t) * 0.3
        + (Math.random() * 2 - 1) * Math.max(0, 0.15 - t) * 0.6;
    }
    const src = _ctx.createBufferSource();
    src.buffer = buf;
    src.connect(_sfxGain);
    src.start();
  }

  function sfxPoison() {
    // Bubbly, wet sound
    [300, 350, 280, 320].forEach((freq, i) => {
      const osc = _ctx.createOscillator();
      const gain = _ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, _ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, _ctx.currentTime + i * 0.08 + 0.1);
      osc.connect(gain);
      gain.connect(_sfxGain);
      osc.start(_ctx.currentTime + i * 0.08);
      osc.stop(_ctx.currentTime + i * 0.08 + 0.1);
    });
  }

  function sfxVictory() {
    // Triumphant fanfare: C E G C (ascending major)
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((freq, i) => {
      const osc = _ctx.createOscillator();
      const gain = _ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, _ctx.currentTime + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.2, _ctx.currentTime + i * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, _ctx.currentTime + i * 0.15 + 0.6);
      osc.connect(gain);
      gain.connect(_sfxGain);
      osc.start(_ctx.currentTime + i * 0.15);
      osc.stop(_ctx.currentTime + i * 0.15 + 0.6);
    });
    // Harmony layer
    [659, 784, 1047, 1319, 1568].forEach((freq, i) => {
      const osc = _ctx.createOscillator();
      const gain = _ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, _ctx.currentTime + i * 0.15 + 0.02);
      gain.gain.linearRampToValueAtTime(0.08, _ctx.currentTime + i * 0.15 + 0.07);
      gain.gain.exponentialRampToValueAtTime(0.01, _ctx.currentTime + i * 0.15 + 0.5);
      osc.connect(gain);
      gain.connect(_sfxGain);
      osc.start(_ctx.currentTime + i * 0.15 + 0.02);
      osc.stop(_ctx.currentTime + i * 0.15 + 0.5);
    });
  }

  function sfxDefeat() {
    // Sad descending minor
    const notes = [440, 392, 330, 262, 196];
    notes.forEach((freq, i) => {
      const osc = _ctx.createOscillator();
      const gain = _ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, _ctx.currentTime + i * 0.25);
      gain.gain.linearRampToValueAtTime(0.12, _ctx.currentTime + i * 0.25 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, _ctx.currentTime + i * 0.25 + 0.5);
      osc.connect(gain);
      gain.connect(_sfxGain);
      osc.start(_ctx.currentTime + i * 0.25);
      osc.stop(_ctx.currentTime + i * 0.25 + 0.5);
    });
  }

  function sfxCritical() {
    sfxSlash();
    // Extra impact
    setTimeout(() => {
      sfxClick(1500, 0.08);
      sfxClick(200, 0.15);
    }, 50);
  }

  function sfxDodge() {
    // Quick whoosh
    const dur = 0.15;
    const bufSize = Math.floor(_ctx.sampleRate * dur);
    const buf = _ctx.createBuffer(1, bufSize, _ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const t = i / bufSize;
      data[i] = (Math.random() * 2 - 1) * Math.sin(t * Math.PI) * 0.15;
    }
    const src = _ctx.createBufferSource();
    src.buffer = buf;
    src.connect(_sfxGain);
    src.start();
  }

  function sfxDeath() {
    // Low thud + fade
    const osc = _ctx.createOscillator();
    const gain = _ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, _ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, _ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.25, _ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, _ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(_sfxGain);
    osc.start();
    osc.stop(_ctx.currentTime + 0.5);
  }

  function sfxArcane() {
    // Ethereal warping sound — dual oscillators with phase modulation
    const osc = _ctx.createOscillator();
    const osc2 = _ctx.createOscillator();
    const gain = _ctx.createGain();
    const gain2 = _ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, _ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1800, _ctx.currentTime + 0.15);
    osc.frequency.exponentialRampToValueAtTime(300, _ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.2, _ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, _ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(_sfxGain);
    osc.start();
    osc.stop(_ctx.currentTime + 0.45);
    // Shimmer layer
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1200, _ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(400, _ctx.currentTime + 0.35);
    gain2.gain.setValueAtTime(0.1, _ctx.currentTime + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.01, _ctx.currentTime + 0.4);
    osc2.connect(gain2);
    gain2.connect(_sfxGain);
    osc2.start(_ctx.currentTime + 0.05);
    osc2.stop(_ctx.currentTime + 0.4);
  }

  // ======== MUSIC ========

  function playMusic(type) {
    if (!ensureContext()) return;
    stopMusic();
    _currentMusic = type;

    // Pentatonic scale notes for procedural melodies
    const pentatonic = {
      town: [262, 294, 330, 392, 440, 524],     // C D E G A C (major pentatonic)
      forest: [220, 262, 294, 330, 392, 440],    // A C D E G A (minor-ish)
      cave: [147, 165, 196, 220, 262, 294],      // D E G A C D (low, dark)
      desert: [294, 330, 370, 440, 494, 588],     // D E F# A B D
      mountain: [196, 220, 262, 294, 392, 440],   // G A C D G A
      dungeon: [131, 147, 165, 196, 220, 262],    // C D E G A C (low)
      combat: [330, 392, 440, 494, 588, 660],      // E G A B D E (intense)
      boss: [220, 262, 294, 330, 392, 440],        // A C D E G A
      final: [262, 330, 392, 440, 524, 660]        // C E G A C E
    };

    const notes = pentatonic[type] || pentatonic.town;
    const tempo = type === 'combat' || type === 'boss' ? 0.2 : 0.4;
    const waveType = type === 'dungeon' || type === 'boss' ? 'sawtooth' : 'triangle';

    // Simple looping melody
    let noteIndex = 0;
    const rng = Utils.mulberry32(type.length * 7 + 42);

    function playNote() {
      if (_currentMusic !== type || !_ctx) return;

      const freq = notes[noteIndex % notes.length];
      const osc = _ctx.createOscillator();
      const gain = _ctx.createGain();

      osc.type = waveType;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, _ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, _ctx.currentTime + tempo * 0.9);

      osc.connect(gain);
      gain.connect(_musicGain);
      osc.start();
      osc.stop(_ctx.currentTime + tempo);

      _musicNodes.push({ osc, gain });

      // Occasional harmony
      if (rng() > 0.6) {
        const harmonyFreq = freq * (rng() > 0.5 ? 1.5 : 1.25);
        const osc2 = _ctx.createOscillator();
        const gain2 = _ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.value = harmonyFreq;
        gain2.gain.setValueAtTime(0.04, _ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, _ctx.currentTime + tempo * 0.8);
        osc2.connect(gain2);
        gain2.connect(_musicGain);
        osc2.start();
        osc2.stop(_ctx.currentTime + tempo);
        _musicNodes.push({ osc: osc2, gain: gain2 });
      }

      // Semi-random melody pattern
      if (rng() > 0.3) {
        noteIndex++;
      } else {
        noteIndex = Math.floor(rng() * notes.length);
      }

      // Schedule next note
      _musicTimeout = setTimeout(playNote, tempo * 1000);
    }

    playNote();
  }

  let _musicTimeout = null;

  function stopMusic() {
    _currentMusic = null;
    if (_musicTimeout) clearTimeout(_musicTimeout);
    for (const node of _musicNodes) {
      try { node.osc.stop(); } catch (e) {}
    }
    _musicNodes = [];
  }

  function setVolume(sfx, music) {
    if (sfx !== undefined && _sfxGain) _sfxGain.gain.value = sfx;
    if (music !== undefined && _musicGain) _musicGain.gain.value = music;
  }

  function setMusicVolume(v) { if (_musicGain) _musicGain.gain.value = v; }
  function setSFXVolume(v) { if (_sfxGain) _sfxGain.gain.value = v; }

  return { init, playSFX, playMusic, stopMusic, setVolume, setMusicVolume, setSFXVolume };
})();
