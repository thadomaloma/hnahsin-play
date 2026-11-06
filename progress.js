// Hnahsin Progress Tracking & Spaced Repetition
// Single unified progress system for all 4 games
// Uses SM-2 algorithm for spaced repetition
// localStorage key: 'hn-progress'

(() => {
  'use strict';

  const STORAGE_KEY = 'hn-progress';
  const SCHEMA_VERSION = 2;
  const SAVE_DEBOUNCE_MS = 100;
  const MAX_INTERVAL_DAYS = 30; // Cap for children

  // --- Default empty state ---
  function freshState() {
    const now = Date.now();
    return {
      version: SCHEMA_VERSION,
      updated: now,
      user: {
        id: 'local-user',
        started: now,
        settings: { sound: true, lang: 'en', reducedMotion: false }
      },
      stats: {
        total_encounters: 0,
        total_correct: 0,
        streak_days: 0,
        last_active: now,
        time_spent_ms: 0
      },
      words: {},
      games: {
        journey: { band: 1, level: 1, coins: 0, unlocked: [] },
        playground: { unlocked: [], scores: {} },
        things: { scenes: {}, stars: 0 },
        ride: { route: 'dawrpui', rank: 0, wallet: 0, garage: {}, badges: [], missions: {} }
      },
      daily: { date: utcDateString(now), completed: [], bonus: 0 }
    };
  }

  // --- Utility functions ---
  function utcDateString(ts = Date.now()) {
    return new Date(ts).toISOString().split('T')[0];
  }

  function yesterdayString(ts = Date.now()) {
    return new Date(ts - 86400000).toISOString().split('T')[0];
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // --- Event emitter ---
  const EventEmitter = {
    _handlers: new Map(),
    on(event, handler) {
      if (!this._handlers.has(event)) this._handlers.set(event, new Set());
      this._handlers.get(event).add(handler);
      return () => this.off(event, handler);
    },
    off(event, handler) {
      if (this._handlers.has(event)) this._handlers.get(event).delete(handler);
    },
    emit(event, ...args) {
      if (this._handlers.has(event)) {
        this._handlers.get(event).forEach(h => {
          try { h(...args); } catch (e) { console.warn('Progress event error:', e); }
        });
      }
    }
  };

  // --- SM-2 Algorithm ---
  // quality: 0 (complete blackout) to 5 (perfect response)
  function sm2(word, quality) {
    const w = { ...word }; // clone
    if (quality >= 3) {
      if (w.reps === 0) w.interval = 1;
      else if (w.reps === 1) w.interval = 6;
      else w.interval = Math.round(w.interval * w.ease);
      // Cap interval for children
      if (w.interval > MAX_INTERVAL_DAYS) w.interval = MAX_INTERVAL_DAYS;
      w.reps += 1;
      w.ease = w.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (w.ease < 1.3) w.ease = 1.3;
    } else {
      w.reps = 0;
      w.interval = 1;
      w.lapses += 1;
    }
    w.due = Date.now() + w.interval * 86400000;
    w.mastery = Math.min(100, w.reps * 10 + Math.round((w.ease - 1.3) * 20));
    return w;
  }

  // --- Progress Core ---
  const Progress = {
    _state: null,
    _saveTimer: null,
    _initialized: false,
    _sessionStart: Date.now(),
    _visibilityHandler: null,

    // Initialize: load from localStorage, migrate old data, start auto-save
    async init() {
      if (this._initialized) return this;
      this._initialized = true;

      // Load saved state
      let raw = null;
      try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) {}
      let state = raw ? JSON.parse(raw) : null;

      // Migrate if needed
      if (!state || state.version !== SCHEMA_VERSION) {
        state = this._migrate(state);
      }

      this._state = state;

      // Check daily reset
      this._checkDailyReset();

      // Auto-save on changes (debounced)
      this._scheduleSave();

      // Cross-tab sync
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            const incoming = JSON.parse(e.newValue);
            if (incoming.version === SCHEMA_VERSION && incoming.updated > this._state.updated) {
              this._state = incoming;
              EventEmitter.emit('sync', this._state);
            }
          } catch (e) {}
        }
      });

      // Track session time on visibility change
      this._visibilityHandler = () => {
        if (document.hidden) {
          this._state.stats.time_spent_ms += Date.now() - this._sessionStart;
          this._scheduleSave();
        } else {
          this._sessionStart = Date.now();
          this._checkDailyReset();
        }
      };
      document.addEventListener('visibilitychange', this._visibilityHandler);

      // Update last_active periodically
      setInterval(() => {
        this._state.stats.last_active = Date.now();
        this._scheduleSave();
      }, 30000);

      return this;
    },

    // --- Migration from old localStorage keys ---
    _migrate(oldState) {
      const now = Date.now();
      const state = freshState();
      state.updated = now;

      // If we have a valid new-state already, keep it
      if (oldState && oldState.version === SCHEMA_VERSION) return oldState;

      // --- Migrate Ride (hn-ride-save) ---
      try {
        const rideRaw = localStorage.getItem('hn-ride-save');
        if (rideRaw) {
          const S = JSON.parse(rideRaw);
          // Game state
          state.games.ride = {
            route: S.route || 'dawrpui',
            rank: S.rank || 0,
            wallet: S.wallet || 0,
            garage: S.garage || { helmet: 'h-basic', jacket: 'j-basic', box: 'b-basic' },
            badges: S.badges || [],
            missions: S.missions || {}
          };
          // Vocabulary progress from quizKnown and words
          const vocabMap = Progress._vocabMap || {}; // Will be populated at build time
          const toVocabId = (mizo) => vocabMap[mizo.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')];

          // quizKnown -> high mastery
          (S.quizKnown || []).forEach(mizo => {
            const vid = toVocabId(mizo);
            if (vid) {
              state.words[vid] = {
                vocab_id: vid, game: 'ride', encounters: 3, correct: 3, incorrect: 0,
                last_seen: now, due: now + 86400000 * 30,
                interval: 30, ease: 2.5, reps: 3, lapses: 0, mastery: 80
              };
            }
          });
          // words (SCENE_WORDS encountered) -> exposures
          (S.words || []).forEach(mizo => {
            const vid = toVocabId(mizo);
            if (vid && !state.words[vid]) {
              state.words[vid] = {
                vocab_id: vid, game: 'ride', encounters: 1, correct: 0, incorrect: 0,
                last_seen: now, due: now + 86400000,
                interval: 1, ease: 2.5, reps: 0, lapses: 0, mastery: 0
              };
            }
          });
          // Stats
          state.stats.total_encounters += (S.quizAsked || 0);
          state.stats.total_correct += (S.quizRight || 0);
          // User settings
          if (typeof S.sound === 'boolean') state.user.settings.sound = S.sound;
          if (S.lang) state.user.settings.lang = S.lang;
          // Clean up old key
          // localStorage.removeItem('hn-ride-save'); // Keep for safety during transition
        }
      } catch (e) { console.warn('Ride migration failed:', e); }

      // --- Migrate Journey (hn-journey-*) ---
      try {
        const journeyKeys = Object.keys(localStorage).filter(k => k.startsWith('hn-journey-'));
        if (journeyKeys.length) {
          // The journey game uses multiple keys, but we can try to reconstruct
          // For now, just note that migration happened
          console.log('Journey keys found:', journeyKeys.length);
        }
      } catch (e) { console.warn('Journey migration failed:', e); }

      // --- Migrate Playground (hn-playground-*) ---
      try {
        const pgKeys = Object.keys(localStorage).filter(k => k.startsWith('hn-playground-'));
        if (pgKeys.length) {
          console.log('Playground keys found:', pgKeys.length);
        }
      } catch (e) { console.warn('Playground migration failed:', e); }

      // --- Migrate Things (hn-things-stars) ---
      try {
        const starsRaw = localStorage.getItem('hn-things-stars');
        if (starsRaw) {
          const stars = parseInt(starsRaw, 10) || 0;
          state.games.things.stars = stars;
          // localStorage.removeItem('hn-things-stars');
        }
      } catch (e) { console.warn('Things migration failed:', e); }

      // Save migrated state
      this._saveNow(state);
      return state;
    },

    // --- Daily reset check ---
    _checkDailyReset() {
      const today = utcDateString();
      const state = this._state;
      if (state.user.lastActiveDate !== today) {
        state.user.lastActiveDate = today;
        const yesterday = yesterdayString();
        // Streak: increment if active yesterday, else reset to 1
        state.stats.streak_days = (state.daily.date === yesterday) ? state.stats.streak_days + 1 : 1;
        // Reset daily missions
        state.daily = { date: today, completed: [], bonus: 0 };
        this._scheduleSave();
        EventEmitter.emit('streak-changed', state.stats.streak_days);
      }
    },

    // --- Debounced save ---
    _scheduleSave() {
      if (this._saveTimer) clearTimeout(this._saveTimer);
      this._saveTimer = setTimeout(() => this._saveNow(this._state), SAVE_DEBOUNCE_MS);
    },

    _saveNow(state) {
      state.updated = Date.now();
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
      EventEmitter.emit('save', state);
    },

    // --- Core word-level operations ---
    recordEncounter(vocabId, game, correct) {
      if (!vocabId || !this._state) return;
      const now = Date.now();
      const w = this._state.words[vocabId] || {
        vocab_id: vocabId,
        game: game,
        encounters: 0,
        correct: 0,
        incorrect: 0,
        last_seen: now,
        due: now,
        interval: 0,
        ease: 2.5,
        reps: 0,
        lapses: 0,
        mastery: 0
      };

      w.encounters += 1;
      w.last_seen = now;
      w.game = game; // Track most recent game

      if (correct) {
        w.correct += 1;
        this._state.stats.total_correct += 1;
        // SM-2 update with quality based on game context
        // Journey/Playground/Ride quiz: quality 5 (explicit correct)
        // Things tap / Ride signage: quality 3 (exposure)
        const quality = (game === 'things' || game === 'ride-signage') ? 3 : 5;
        const updated = sm2(w, quality);
        Object.assign(w, updated);
      } else {
        w.incorrect += 1;
        // SM-2 with quality 0 (forgot)
        const updated = sm2(w, 0);
        Object.assign(w, updated);
      }

      this._state.stats.total_encounters += 1;
      this._state.words[vocabId] = w;
      this._scheduleSave();
      EventEmitter.emit('word-updated', vocabId, w);
    },

    getWordProgress(vocabId) {
      return this._state?.words[vocabId] || null;
    },

    getDueWords(limit = 20) {
      if (!this._state) return [];
      const now = Date.now();
      return Object.values(this._state.words)
        .filter(w => w.due <= now && w.mastery < 100)
        .sort((a, b) => a.due - b.due)
        .slice(0, limit);
    },

    getReviewWords(limit = 20) {
      // Same as getDueWords for now
      return this.getDueWords(limit);
    },

    getNextWords(count = 10) {
      // Words with low mastery that aren't due yet (new words to learn)
      if (!this._state) return [];
      const now = Date.now();
      return Object.values(this._state.words)
        .filter(w => w.due > now && w.mastery < 30)
        .sort((a, b) => a.mastery - b.mastery)
        .slice(0, count);
    },

    // --- Game state ---
    getGameState(game) {
      return this._state?.games[game] ? deepClone(this._state.games[game]) : null;
    },

    setGameState(game, patch) {
      if (!this._state || !this._state.games[game]) return;
      Object.assign(this._state.games[game], patch);
      this._scheduleSave();
      EventEmitter.emit('game-updated', game, this._state.games[game]);
    },

    // --- Statistics ---
    getStats() {
      if (!this._state) return null;
      const s = this._state.stats;
      const totalWords = Object.keys(this._state.words).length;
      const masteredWords = Object.values(this._state.words).filter(w => w.mastery >= 80).length;
      const learningWords = Object.values(this._state.words).filter(w => w.mastery > 0 && w.mastery < 80).length;
      return {
        ...s,
        total_words: totalWords,
        mastered_words: masteredWords,
        learning_words: learningWords,
        mastery_percent: totalWords ? Math.round((masteredWords / totalWords) * 100) : 0,
        accuracy: s.total_encounters ? Math.round((s.total_correct / s.total_encounters) * 100) : 0
      };
    },

    getMasteryDistribution() {
      if (!this._state) return { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      const dist = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }; // 0, 1-20, 21-40, 41-60, 61-80, 81-100
      Object.values(this._state.words).forEach(w => {
        if (w.mastery === 0) dist[0]++;
        else if (w.mastery <= 20) dist[1]++;
        else if (w.mastery <= 40) dist[2]++;
        else if (w.mastery <= 60) dist[3]++;
        else if (w.mastery <= 80) dist[4]++;
        else dist[5]++;
      });
      return dist;
    },

    getTopicProgress(vocabByTopic) {
      // vocabByTopic: { topic: [vocabId, ...] } - passed from vocabulary data
      if (!this._state || !vocabByTopic) return {};
      const result = {};
      Object.entries(vocabByTopic).forEach(([topic, ids]) => {
        const words = ids.map(id => this._state.words[id]).filter(Boolean);
        if (!words.length) return;
        const total = words.length;
        const mastered = words.filter(w => w.mastery >= 80).length;
        const learning = words.filter(w => w.mastery > 0 && w.mastery < 80).length;
        result[topic] = { total, mastered, learning, percent: Math.round((mastered / total) * 100) };
      });
      return result;
    },

    getStreak() {
      return this._state?.stats.streak_days || 0;
    },

    // --- Export / Import ---
    export() {
      if (!this._state) return null;
      const data = deepClone(this._state);
      data.exported = Date.now();
      return JSON.stringify(data, null, 2);
    },

    import(jsonStr) {
      try {
        const data = JSON.parse(jsonStr);
        if (data.version === SCHEMA_VERSION) {
          this._state = data;
          this._saveNow(data);
          EventEmitter.emit('imported', data);
          return true;
        }
      } catch (e) { console.error('Import failed:', e); }
      return false;
    },

    // --- Event binding ---
    on(event, handler) { return EventEmitter.on(event, handler); },
    off(event, handler) { EventEmitter.off(event, handler); },

    // --- Vocabulary ID mapping (populated at build time) ---
    _vocabMap: {},

    // --- Cleanup ---
    destroy() {
      if (this._saveTimer) clearTimeout(this._saveTimer);
      if (this._visibilityHandler) document.removeEventListener('visibilitychange', this._visibilityHandler);
      this._initialized = false;
    }
  };

  // Expose globally
  window.Progress = Progress;

  // Auto-init on first user gesture (like Audio)
  let _initPromise = null;
  function _autoInit() {
    if (!_initPromise) _initPromise = Progress.init();
    return _initPromise;
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, _autoInit, { once: true, passive: true });
  });

})();