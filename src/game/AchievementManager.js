/**
 * Krazy Kart Racing - Achievement & Milestones System
 * Tracks milestones ('Under 30s Lap', 'Perfect Drifter', 'Grand Slam', etc.),
 * persists unlocks to localStorage, plays celebratory WebAudio chimes,
 * and renders high-impact animated 'Achievement Unlocked' toast notifications.
 */

export const ACHIEVEMENTS = [
  {
    id: 'under_30s',
    title: 'Under 30s Lap',
    subtitle: 'Lightning Pace',
    icon: '⏱️',
    rarity: 'GOLD',
    badgeColor: '#ffd27d',
    points: 100,
    desc: 'Complete any single circuit lap in under 30.00 seconds.',
    howTo: 'Drive aggressively in manual mode or take optimal inside lines.',
  },
  {
    id: 'perfect_drifter',
    title: 'Perfect Drifter',
    subtitle: 'Tire Smoke Master',
    icon: '🔥',
    rarity: 'DIAMOND',
    badgeColor: '#00e5ff',
    points: 150,
    desc: 'Sustain continuous tire drift sparks for over 2.4 seconds without hitting guardrails.',
    howTo: 'Initiate a drift in Cat Helix or Corkscrew and hold counter-steer without clipping the rail.',
  },
  {
    id: 'grand_slam',
    title: 'Grand Slam',
    subtitle: 'Circuit Champion',
    icon: '🏆',
    rarity: 'LEGENDARY',
    badgeColor: '#ffd700',
    points: 250,
    desc: 'Conquer all circuits! Finish official 3-lap races on both Desktop Circuit & Grand Prix Outdoor Raceway.',
    howTo: 'Complete 3 laps on Desktop Circuit, then switch to Outdoor Raceway and complete 3 laps.',
  },
  {
    id: 'sub_20s',
    title: 'Speed Demon',
    subtitle: 'Track Record Smasher',
    icon: '⚡',
    rarity: 'DIAMOND',
    badgeColor: '#b388ff',
    points: 200,
    desc: 'Set an unbelievable lap time under 20.00 seconds!',
    howTo: 'Chain turbo boosts, execute clean apex exits, and use speed-tuned racers like Shadow or Blaze.',
  },
  {
    id: 'clean_apex',
    title: 'Clean Apex Surge',
    subtitle: 'Precision Line',
    icon: '🎯',
    rarity: 'SILVER',
    badgeColor: '#00ffaa',
    points: 100,
    desc: 'Carve cleanly through a tight curve and trigger an Apex Exit Boost.',
    howTo: 'Steer smoothly around a curved sector without grazing the outer guardrail.',
  },
  {
    id: 'first_victory',
    title: 'Chequered Flag',
    subtitle: 'First Official Finish',
    icon: '🏁',
    rarity: 'GOLD',
    badgeColor: '#ffd27d',
    points: 100,
    desc: 'Complete all 3 laps of an official Grand Prix race.',
    howTo: 'Drive past the start/finish gantry on Lap 3 to trigger the victory chequered flag.',
  },
  {
    id: 'speed_60mph',
    title: 'Supersonic 60 MPH',
    subtitle: 'Need for Speed',
    icon: '💨',
    rarity: 'SILVER',
    badgeColor: '#00e5ff',
    points: 100,
    desc: 'Blast your micro-kart past 60 MPH down the main straightaway!',
    howTo: 'Fire a turbo boost or catch full speed along the Sector 6 keyboard straight.',
  },
  {
    id: 'gamepad_pro',
    title: 'Gamepad Pilot',
    subtitle: 'Controller Mastery',
    icon: '🎮',
    rarity: 'BRONZE',
    badgeColor: '#93c5fd',
    points: 50,
    desc: 'Connect and pilot your kart using an analog gamepad controller.',
    howTo: 'Plug in or connect any Bluetooth/USB gamepad and steer with the thumbstick.',
  },
];

const STORAGE_KEY = 'krazy_kart_achievements_v1';
const CIRCUITS_COMPLETED_KEY = 'krazy_kart_circuits_completed_v1';

class AchievementManager {
  constructor() {
    this.unlockedMap = this.loadStorage();
    this.circuitsCompleted = this.loadCircuitsCompleted();
    this.toastContainer = null;
    this.toastQueue = [];
    this.isShowingToast = false;
    this.audioCtx = null;
    this.continuousDriftTimer = 0.0;
  }

  loadStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (_e) {
      return {};
    }
  }

  saveStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.unlockedMap));
    } catch (_e) {
      // Ignore localStorage quotas
    }
  }

  loadCircuitsCompleted() {
    try {
      const data = localStorage.getItem(CIRCUITS_COMPLETED_KEY);
      return data ? JSON.parse(data) : {};
    } catch (_e) {
      return {};
    }
  }

  saveCircuitsCompleted() {
    try {
      localStorage.setItem(CIRCUITS_COMPLETED_KEY, JSON.stringify(this.circuitsCompleted));
    } catch (_e) {
      // Ignore localStorage quotas
    }
  }

  init() {
    this.toastContainer = document.getElementById('achievement-toast-container');
    this.updateHUDCounter();
    this.bindModalEvents();
  }

  isUnlocked(id) {
    return Boolean(this.unlockedMap[id]);
  }

  getUnlockedCount() {
    return Object.keys(this.unlockedMap).length;
  }

  getTotalPoints() {
    let pts = 0;
    for (const ach of ACHIEVEMENTS) {
      if (this.unlockedMap[ach.id]) {
        pts += ach.points;
      }
    }
    return pts;
  }

  unlock(id) {
    const ach = ACHIEVEMENTS.find((a) => a.id === id);
    if (!ach) return;

    if (this.unlockedMap[id]) {
      return; // Already unlocked
    }

    const unlockRecord = {
      unlockedAt: Date.now(),
      dateStr: new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    this.unlockedMap[id] = unlockRecord;
    this.saveStorage();
    this.updateHUDCounter();
    this.playCelebratoryFanfare();
    this.queueToast(ach);
    this.renderModalContent();
  }

  playCelebratoryFanfare() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const masterGain = this.audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.24, now);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
      masterGain.connect(this.audioCtx.destination);

      // Triumphant 4-note ascending fanfare: C5, E5, G5, C6 with warm chorus chime
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const noteStart = now + idx * 0.11;
        const osc = this.audioCtx.createOscillator();
        const noteGain = this.audioCtx.createGain();

        osc.type = idx === 3 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        noteGain.gain.setValueAtTime(0.001, noteStart);
        noteGain.gain.linearRampToValueAtTime(0.85, noteStart + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.001, noteStart + (idx === 3 ? 0.95 : 0.45));

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(noteStart);
        osc.stop(noteStart + 1.0);
      });
    } catch (_e) {
      // Audio autoplay restrictions
    }
  }

  queueToast(ach) {
    this.toastQueue.push(ach);
    if (!this.isShowingToast) {
      this.processToastQueue();
    }
  }

  processToastQueue() {
    if (this.toastQueue.length === 0) {
      this.isShowingToast = false;
      return;
    }

    this.isShowingToast = true;
    const ach = this.toastQueue.shift();

    if (!this.toastContainer) {
      this.toastContainer = document.getElementById('achievement-toast-container');
    }
    if (!this.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `achievement-toast-card achievement-theme-${ach.badgeTheme || 'gold'}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <div class="achievement-toast-glow"></div>
      <div class="achievement-toast-left">
        <div class="achievement-badge-orb" style="--orb-color: ${ach.badgeColor};">
          <span class="achievement-badge-icon">${ach.icon}</span>
        </div>
      </div>
      <div class="achievement-toast-center">
        <div class="achievement-toast-eyebrow">
          <span class="achievement-trophy-sparkle">★</span>
          <span>ACHIEVEMENT UNLOCKED</span>
          <span class="achievement-points-pill">+${ach.points} PTS</span>
        </div>
        <div class="achievement-toast-title">${ach.title}</div>
        <div class="achievement-toast-desc">${ach.desc}</div>
      </div>
      <button class="achievement-toast-close" type="button" aria-label="Dismiss">&times;</button>
    `;

    const closeBtn = toast.querySelector('.achievement-toast-close');
    const dismiss = () => {
      if (toast.classList.contains('is-dismissing')) return;
      toast.classList.add('is-dismissing');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
        setTimeout(() => this.processToastQueue(), 120);
      }, 340);
    };

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dismiss();
      });
    }

    toast.addEventListener('click', () => {
      this.openModal();
      dismiss();
    });

    this.toastContainer.appendChild(toast);

    // Auto-dismiss after 4.8 seconds
    setTimeout(dismiss, 4800);
  }

  updateHUDCounter() {
    const countEl = document.getElementById('achievements-badge-count');
    const textEl = document.getElementById('achievements-badge-text');
    const unlocked = this.getUnlockedCount();
    const total = ACHIEVEMENTS.length;
    if (countEl) countEl.textContent = `${unlocked}/${total}`;
    if (textEl) {
      textEl.textContent = unlocked === total ? 'ALL ACHIEVED' : 'ACHIEVEMENTS';
    }

    const badgeBtn = document.getElementById('btn-achievements-badge');
    if (badgeBtn) {
      badgeBtn.classList.toggle('has-unlocked', unlocked > 0);
    }
  }

  bindModalEvents() {
    const btnBadge = document.getElementById('btn-achievements-badge');
    const btnOpenModal = document.getElementById('btn-open-achievements-modal');
    const btnCloseModal = document.getElementById('btn-close-achievements-modal');
    const modal = document.getElementById('modal-achievements');
    const btnReset = document.getElementById('btn-reset-achievements');

    if (btnBadge) {
      btnBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openModal();
      });
    }
    if (btnOpenModal) {
      btnOpenModal.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openModal();
      });
    }
    if (btnCloseModal) {
      btnCloseModal.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeModal();
      });
    }
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });
    }
    if (btnReset) {
      btnReset.addEventListener('click', (e) => {
        e.stopPropagation();
        this.resetAll();
      });
    }
  }

  openModal() {
    const modal = document.getElementById('modal-achievements');
    if (modal) {
      this.renderModalContent();
      modal.classList.remove('hidden');
    }
  }

  closeModal() {
    const modal = document.getElementById('modal-achievements');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  renderModalContent() {
    const grid = document.getElementById('achievements-grid-container');
    const summaryCount = document.getElementById('achievements-summary-count');
    const summaryPoints = document.getElementById('achievements-summary-points');
    const progressFill = document.getElementById('achievements-progress-fill');

    const unlockedCount = this.getUnlockedCount();
    const totalCount = ACHIEVEMENTS.length;
    const totalPoints = this.getTotalPoints();
    const maxPoints = ACHIEVEMENTS.reduce((sum, a) => sum + a.points, 0);

    if (summaryCount) summaryCount.textContent = `${unlockedCount} / ${totalCount} Unlocked`;
    if (summaryPoints) summaryPoints.textContent = `${totalPoints} / ${maxPoints} PTS`;
    if (progressFill) {
      const pct = Math.round((unlockedCount / totalCount) * 100);
      progressFill.style.width = `${pct}%`;
    }

    if (!grid) return;

    grid.innerHTML = ACHIEVEMENTS.map((ach) => {
      const record = this.unlockedMap[ach.id];
      const isDone = Boolean(record);
      return `
        <div class="achievement-card ${isDone ? 'is-unlocked' : 'is-locked'}">
          <div class="ach-card-glow"></div>
          <div class="ach-card-header">
            <div class="ach-card-orb" style="--orb-color: ${ach.badgeColor};">
              <span class="ach-card-icon">${isDone ? ach.icon : '🔒'}</span>
            </div>
            <div class="ach-card-info">
              <div class="ach-card-rarity" style="color: ${ach.badgeColor};">${ach.rarity} · ${ach.points} PTS</div>
              <div class="ach-card-title">${ach.title}</div>
            </div>
          </div>
          <div class="ach-card-desc">${ach.desc}</div>
          <div class="ach-card-footer">
            ${
              isDone
                ? `<span class="ach-card-status is-done">✓ UNLOCKED ${record.dateStr ? '· ' + record.dateStr : ''}</span>`
                : `<span class="ach-card-status is-locked">LOCKED · ${ach.howTo}</span>`
            }
          </div>
        </div>
      `;
    }).join('');
  }

  resetAll() {
    this.unlockedMap = {};
    this.circuitsCompleted = {};
    this.saveStorage();
    this.saveCircuitsCompleted();
    this.updateHUDCounter();
    this.renderModalContent();
  }

  // ---------------------------------------------------------------------------
  // Milestone Checkers
  // ---------------------------------------------------------------------------

  checkLapTime(lapTime) {
    if (typeof lapTime !== 'number' || lapTime <= 0) return;
    if (lapTime < 30.0) {
      this.unlock('under_30s');
    }
    if (lapTime < 20.0) {
      this.unlock('sub_20s');
    }
  }

  checkDriftFrame(dt, isDrifting, railHit, driftIntensity) {
    if (isDrifting && !railHit && driftIntensity > 0.15) {
      this.continuousDriftTimer += dt;
      if (this.continuousDriftTimer >= 2.4) {
        this.unlock('perfect_drifter');
      }
    } else if (railHit) {
      this.continuousDriftTimer = 0.0;
    } else {
      this.continuousDriftTimer = Math.max(0.0, this.continuousDriftTimer - dt * 0.7);
    }
  }

  checkApexBoost() {
    this.unlock('clean_apex');
  }

  checkRaceFinish(trackId, isAutopilot) {
    if (!isAutopilot) {
      this.unlock('first_victory');
    }

    if (trackId) {
      this.circuitsCompleted[trackId] = true;
      this.saveCircuitsCompleted();

      if (this.circuitsCompleted['desk'] && this.circuitsCompleted['outdoor']) {
        this.unlock('grand_slam');
      }
    }
  }

  checkSpeedMph(speedMph) {
    if (speedMph >= 60) {
      this.unlock('speed_60mph');
    }
  }

  checkGamepadActive() {
    this.unlock('gamepad_pro');
  }
}

export const achievementManager = new AchievementManager();
