/**
 * Hnahsin Audio Infrastructure
 * Lightweight sound system with the Web Audio API: tones, noise and sound files. Nothing is said aloud.
 * Respects prefers-reduced-motion, save-data, visibility, and autoplay policy
 */
(function (global) {
  'use strict';

  const Audio = {
    // State
    _ctx: null,
    _enabled: true,
    _volume: 0.6,
    _unlocked: false,
    _sfxCache: new Map(),

    // Initialize AudioContext on first user gesture
    async init() {
      if (this._unlocked) return;
      try {
        this._ctx = new (global.AudioContext || global.webkitAudioContext)();
        // Resume if suspended (autoplay policy)
        if (this._ctx.state === 'suspended') {
          await this._ctx.resume();
        }
        this._unlocked = true;
        this._loadSettings();
      } catch (e) {
        console.warn('Audio: Web Audio API unavailable', e);
      }
    },

    // Load settings from localStorage
    _loadSettings() {
      try {
        const stored = JSON.parse(localStorage.getItem('hnahsin-audio') || '{}');
        this._enabled = stored.enabled ?? true;
        this._volume = stored.volume ?? 0.6;
      } catch (e) {
        // ignore
      }
    },

    // Save settings to localStorage
    _saveSettings() {
      try {
        localStorage.setItem('hnahsin-audio', JSON.stringify({
          enabled: this._enabled,
          volume: this._volume,
        }));
      } catch (e) {
        // ignore
      }
    },

    // Check if audio should play (respects reduced motion, save data, visibility)
    _shouldPlay() {
      if (!this._enabled) return false;
      if (global.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
      if (global.navigator?.connection?.saveData) return false;
      if (global.document?.hidden) return false;
      return true;
    },

    // Ensure AudioContext is initialized
    async _ensureCtx() {
      if (!this._unlocked) await this.init();
      return this._ctx;
    },

    // Play a recorded audio asset (cached)
    async playAsset(path) {
      if (!this._shouldPlay()) return;
      await this._ensureCtx();
      if (!this._ctx) return;

      // Check cache
      let buffer = this._sfxCache.get(path);
      if (!buffer) {
        try {
          const res = await fetch(path);
          if (!res.ok) throw new Error(`Failed to load ${path}`);
          const data = await res.arrayBuffer();
          buffer = await this._ctx.decodeAudioData(data);
          this._sfxCache.set(path, buffer);
        } catch (e) {
          console.warn('Audio: failed to load asset', path, e);
          return;
        }
      }

      const src = this._ctx.createBufferSource();
      src.buffer = buffer;
      const gain = this._ctx.createGain();
      gain.gain.value = this._volume;
      src.connect(gain).connect(this._ctx.destination);
      src.start(0);
    },

    // Play a simple tone (generated programmatically, no asset needed)
    playTone({ frequency = 440, duration = 0.1, type = 'sine', volume = 1.0 } = {}) {
      if (!this._shouldPlay()) return;
      if (!this._ctx) return;

      const ctx = this._ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = frequency;
      gain.gain.value = this._volume * volume;
      osc.connect(gain).connect(ctx.destination);
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(this._volume * volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.start(now);
      osc.stop(now + duration);
    },

    // Play noise burst (for pops, taps)
    playNoise({ duration = 0.05, volume = 1.0 } = {}) {
      if (!this._shouldPlay()) return;
      if (!this._ctx) return;

      const ctx = this._ctx;
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.1;
      }
      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      src.buffer = buffer;
      gain.gain.value = this._volume * volume;
      src.connect(gain).connect(ctx.destination);
      src.start(0);
    },

    // Settings
    setEnabled(enabled) {
      this._enabled = !!enabled;
      this._saveSettings();
    },

    setVolume(volume) {
      this._volume = Math.max(0, Math.min(1, volume));
      this._saveSettings();
    },

    // State getters
    get enabled() { return this._enabled; },
    get volume() { return this._volume; },
  };

  // Initialize on first user gesture
  const unlock = () => {
    Audio.init();
    document.removeEventListener('pointerdown', unlock);
    document.removeEventListener('keydown', unlock);
    document.removeEventListener('touchstart', unlock);
  };
  document.addEventListener('pointerdown', unlock, { once: true, passive: true });
  document.addEventListener('keydown', unlock, { once: true, passive: true });
  document.addEventListener('touchstart', unlock, { once: true, passive: true });

  // Expose globally
  global.Audio = Audio;

})(typeof window !== 'undefined' ? window : globalThis);