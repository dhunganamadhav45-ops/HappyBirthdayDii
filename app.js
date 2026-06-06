/* =====================================================
   BIRTHDAY CELEBRATION — app.js
   Full interactive engine:
   - Canvas fireworks (physics, particles, trails)
   - Web Audio API sounds (boom, crackle, pop, chime)
   - Interactive cake candles
   - Gift box open
   - Confetti shower
   - Floating balloons
   ===================================================== */

'use strict';

// =====================================================
// 1. FIREWORKS ENGINE
// =====================================================
const fwCanvas = document.getElementById('fireworks-canvas');
const fwCtx    = fwCanvas.getContext('2d');
let   fwParticles = [];
let   fwAnimId    = null;

function resizeFireworksCanvas() {
  fwCanvas.width  = window.innerWidth;
  fwCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeFireworksCanvas);
resizeFireworksCanvas();

// Launch a firework at (x, y)
function launchFirework(x, y) {
  const hue     = Math.random() * 360;
  const count   = 80 + Math.floor(Math.random() * 60);
  for (let i = 0; i < count; i++) {
    const angle  = (Math.PI * 2 / count) * i;
    const speed  = 2 + Math.random() * 5;
    const life   = 0.9 + Math.random() * 0.5;
    fwParticles.push({
      x, y,
      vx:    Math.cos(angle) * speed,
      vy:    Math.sin(angle) * speed,
      alpha: 1,
      decay: 0.012 + Math.random() * 0.01,
      size:  1.5 + Math.random() * 2.5,
      hue:   hue + Math.random() * 40 - 20,
      sat:   80 + Math.random() * 20,
      lit:   55 + Math.random() * 20,
      gravity: 0.06 + Math.random() * 0.04,
      trail:  [],
      life,
    });
  }
  // sparkle centre burst
  for (let i = 0; i < 15; i++) {
    const angle = Math.random() * Math.PI * 2;
    fwParticles.push({
      x, y,
      vx:    Math.cos(angle) * (0.5 + Math.random() * 1.5),
      vy:    Math.sin(angle) * (0.5 + Math.random() * 1.5),
      alpha: 1,
      decay: 0.025,
      size:  1,
      hue:   50,
      sat:   100,
      lit:   90,
      gravity: 0.02,
      trail: [],
      life:  1,
    });
  }
  playFireworkSound();
}

function animateFireworks() {
  fwCtx.fillStyle = 'rgba(13,10,30,0.18)';
  fwCtx.fillRect(0, 0, fwCanvas.width, fwCanvas.height);

  fwParticles = fwParticles.filter(p => p.alpha > 0.01);

  for (const p of fwParticles) {
    // Store trail
    p.trail.push({ x: p.x, y: p.y, alpha: p.alpha });
    if (p.trail.length > 6) p.trail.shift();

    // Draw trail
    for (let t = 0; t < p.trail.length; t++) {
      const tp = p.trail[t];
      const a  = (tp.alpha * (t / p.trail.length)) * 0.35;
      fwCtx.beginPath();
      fwCtx.arc(tp.x, tp.y, p.size * 0.6, 0, Math.PI * 2);
      fwCtx.fillStyle = `hsla(${p.hue},${p.sat}%,${p.lit}%,${a})`;
      fwCtx.fill();
    }

    // Draw main particle
    fwCtx.beginPath();
    fwCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    fwCtx.fillStyle = `hsla(${p.hue},${p.sat}%,${p.lit}%,${p.alpha})`;
    fwCtx.shadowColor = `hsla(${p.hue},${p.sat}%,${p.lit}%,${p.alpha})`;
    fwCtx.shadowBlur  = 8;
    fwCtx.fill();
    fwCtx.shadowBlur  = 0;

    // Update
    p.x     += p.vx;
    p.y     += p.vy;
    p.vy    += p.gravity;
    p.vx    *= 0.98;
    p.alpha -= p.decay;
  }

  fwAnimId = requestAnimationFrame(animateFireworks);
}

// Auto-launch demo fireworks
function autoFireworks() {
  const cx = fwCanvas.width;
  const cy = fwCanvas.height;
  launchFirework(
    cx * (0.15 + Math.random() * 0.7),
    cy * (0.1  + Math.random() * 0.5)
  );
}

animateFireworks();
let autoFwInterval = setInterval(autoFireworks, 1400);

// Click anywhere on intro to launch fireworks
document.getElementById('intro-screen').addEventListener('click', e => {
  if (e.target.id === 'reveal-btn') return;
  launchFirework(e.clientX, e.clientY);
});

// =====================================================
// 2. AUDIO ENGINE (Web Audio API — no external files)
// =====================================================
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playFireworkSound() {
  try {
    const ctx    = getAudioCtx();
    const osc    = ctx.createOscillator();
    const gain   = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type      = 'bandpass';
    filter.frequency.value = 200 + Math.random() * 600;
    filter.Q.value   = 0.5;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80 + Math.random() * 120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.25 + Math.random() * 0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } catch(e) {}
}

function playCandleBlowSound() {
  try {
    const ctx  = getAudioCtx();
    const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src   = ctx.createBufferSource();
    const gain  = ctx.createGain();
    const filt  = ctx.createBiquadFilter();
    filt.type   = 'bandpass';
    filt.frequency.value = 1000;
    filt.Q.value = 1.5;
    src.buffer  = buf;
    src.connect(filt);
    filt.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    src.start();
  } catch(e) {}
}

function playGiftPopSound() {
  try {
    const ctx  = getAudioCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } catch(e) {}
}

// =====================================================
// ENERGETIC HAPPY BIRTHDAY — Full arrangement
// Piano-style lead + harmony + bass + bright attack
// BPM ~120, plays the full song then loops
// =====================================================
let musicPlaying = false;
let musicScheduled = [];
let musicStartTime = 0;
let musicLoopTimer = null;

// Full "Happy Birthday" notes: [freq, duration_beats]
// 0 = rest. Beat = 0.5s at 120 BPM
const HB_SONG = [
  // "Hap-py birth-day to you"
  [392.0,0.75],[392.0,0.25],[440.0,1],[392.0,1],[523.3,1],[493.9,2],
  // "Hap-py birth-day to you"
  [392.0,0.75],[392.0,0.25],[440.0,1],[392.0,1],[587.3,1],[523.3,2],
  // "Hap-py birth-day dear Sus-mi Dii"
  [392.0,0.75],[392.0,0.25],[784.0,1],[659.3,1],[523.3,1],[493.9,1],[440.0,2],
  [698.5,0.75],[698.5,0.25],[659.3,1],[523.3,1],[587.3,1],[523.3,2],
  // "Hap-py birth-day to you!"
  [0,0.5]
];

const BEAT = 0.48; // seconds per beat (125 BPM — fast & energetic)

function playNote(ctx, freq, startT, dur, vol) {
  if (freq === 0) return;
  try {
    // --- Piano-like lead (sawtooth + lowpass = brighter piano)
    const osc   = ctx.createOscillator();
    const filt  = ctx.createBiquadFilter();
    const gain  = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, startT);

    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(3200, startT);
    filt.Q.value = 1.2;

    osc.connect(filt);
    filt.connect(gain);
    gain.connect(ctx.destination);

    // Sharp attack, medium decay, sustain, quick release
    gain.gain.setValueAtTime(0, startT);
    gain.gain.linearRampToValueAtTime(vol, startT + 0.02);       // attack
    gain.gain.setValueAtTime(vol * 0.72, startT + 0.06);        // decay
    gain.gain.setValueAtTime(vol * 0.6,  startT + dur * BEAT - 0.06); // sustain
    gain.gain.exponentialRampToValueAtTime(0.001, startT + dur * BEAT); // release

    osc.start(startT);
    osc.stop(startT + dur * BEAT + 0.05);

    // --- Harmony layer (sine, one octave down, softer)
    const osc2  = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq / 2, startT);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    gain2.gain.setValueAtTime(0, startT);
    gain2.gain.linearRampToValueAtTime(vol * 0.3, startT + 0.03);
    gain2.gain.exponentialRampToValueAtTime(0.001, startT + dur * BEAT);
    osc2.start(startT);
    osc2.stop(startT + dur * BEAT + 0.05);

    // --- Bright overtone (triangle, 2x freq)
    const osc3  = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(freq * 2, startT);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    gain3.gain.setValueAtTime(0, startT);
    gain3.gain.linearRampToValueAtTime(vol * 0.12, startT + 0.02);
    gain3.gain.exponentialRampToValueAtTime(0.001, startT + dur * BEAT * 0.5);
    osc3.start(startT);
    osc3.stop(startT + dur * BEAT * 0.55);
  } catch(e) {}
}

function scheduleFullSong() {
  if (!musicPlaying) return;
  try {
    const ctx = getAudioCtx();
    let t = ctx.currentTime + 0.08;
    musicStartTime = t;
    let totalDur = 0;
    for (const [freq, beats] of HB_SONG) totalDur += beats;

    for (const [freq, beats] of HB_SONG) {
      playNote(ctx, freq, t, beats, 0.28);
      t += beats * BEAT;
    }
    // Loop after the song ends + a short pause
    const loopDelay = (totalDur * BEAT + 0.6) * 1000;
    musicLoopTimer = setTimeout(() => {
      if (musicPlaying) scheduleFullSong();
    }, loopDelay);
  } catch(e) {}
}

function startMusic() {
  musicPlaying = true;
  if (musicLoopTimer) clearTimeout(musicLoopTimer);
  scheduleFullSong();
  document.getElementById('music-toggle').classList.add('playing');
  document.getElementById('music-icon').textContent = '🎵';
  document.getElementById('music-label').textContent = 'Now Playing ♪';
}

function stopMusic() {
  musicPlaying = false;
  if (musicLoopTimer) clearTimeout(musicLoopTimer);
  musicLoopTimer = null;
  document.getElementById('music-toggle').classList.remove('playing');
  document.getElementById('music-icon').textContent = '🔇';
  document.getElementById('music-label').textContent = 'Birthday Song';
}

function toggleMusic() {
  if (musicPlaying) stopMusic(); else startMusic();
}

// =====================================================
// 3. SCREEN TRANSITION
// =====================================================
function revealCelebration() {
  clearInterval(autoFwInterval);
  // Extra burst
  for (let i = 0; i < 8; i++) {
    setTimeout(() => launchFirework(
      fwCanvas.width  * (0.1 + Math.random() * 0.8),
      fwCanvas.height * (0.05 + Math.random() * 0.5)
    ), i * 120);
  }

  setTimeout(() => {
    const intro = document.getElementById('intro-screen');
    intro.classList.add('fade-out');
    setTimeout(() => {
      intro.classList.add('hidden');
      cancelAnimationFrame(fwAnimId);
    }, 900);

    const celeb = document.getElementById('celebration-screen');
    celeb.classList.remove('hidden');
    
    // Explicitly play the background video in case browser policy paused it while hidden
    const bgVideo = document.getElementById('cake-bg-video');
    if (bgVideo) {
      bgVideo.play().catch(e => console.log("Video autoplay blocked or loaded: ", e));
    }

    startConfetti();
    spawnBalloons();
    startMusic();
    document.getElementById('current-year').textContent = new Date().getFullYear();
    // photo grid is static HTML — no JS build needed
  }, 600);
}

// =====================================================
// 4. CONFETTI ENGINE
// =====================================================
const cfCanvas = document.getElementById('confetti-canvas');
const cfCtx    = cfCanvas.getContext('2d');
let   cfParticles = [];
let   cfAnimId    = null;
let   cfActive    = false;

function resizeConfetti() {
  cfCanvas.width  = window.innerWidth;
  cfCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeConfetti);
resizeConfetti();

const CF_COLORS = ['#f5c842','#e8617a','#c77dff','#a8edea','#f7a8b8','#fff176','#80cbc4'];

function spawnConfettiParticle() {
  cfParticles.push({
    x:      Math.random() * cfCanvas.width,
    y:      -12,
    w:      6 + Math.random() * 8,
    h:      3 + Math.random() * 5,
    color:  CF_COLORS[Math.floor(Math.random() * CF_COLORS.length)],
    rot:    Math.random() * Math.PI * 2,
    rotV:   (Math.random() - 0.5) * 0.15,
    vx:     (Math.random() - 0.5) * 3,
    vy:     2 + Math.random() * 3.5,
    alpha:  1,
  });
}

function animateConfetti() {
  cfCtx.clearRect(0, 0, cfCanvas.width, cfCanvas.height);

  cfParticles = cfParticles.filter(p => p.y < cfCanvas.height + 20 && p.alpha > 0.05);

  for (const p of cfParticles) {
    cfCtx.save();
    cfCtx.translate(p.x, p.y);
    cfCtx.rotate(p.rot);
    cfCtx.globalAlpha = p.alpha;
    cfCtx.fillStyle   = p.color;
    cfCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    cfCtx.restore();
    p.x   += p.vx;
    p.y   += p.vy;
    p.rot += p.rotV;
    if (p.y > cfCanvas.height * 0.7) p.alpha -= 0.015;
  }

  cfAnimId = requestAnimationFrame(animateConfetti);
}

function startConfetti() {
  cfActive = true;
  animateConfetti();
  let spawnCount = 0;
  const spawnInterval = setInterval(() => {
    for (let i = 0; i < 6; i++) spawnConfettiParticle();
    spawnCount++;
    if (spawnCount > 120) clearInterval(spawnInterval);
  }, 60);
}

function burstConfetti() {
  for (let i = 0; i < 200; i++) {
    setTimeout(() => spawnConfettiParticle(), Math.random() * 800);
  }
}

// =====================================================
// 5. BALLOONS
// =====================================================
const BALLOON_COLORS = [
  'linear-gradient(135deg,#f48fb1,#e91e63)',
  'linear-gradient(135deg,#f5c842,#ff8f00)',
  'linear-gradient(135deg,#c77dff,#6a0dad)',
  'linear-gradient(135deg,#80cbc4,#00796b)',
  'linear-gradient(135deg,#90caf9,#1565c0)',
  'linear-gradient(135deg,#ff8a65,#bf360c)',
];

function spawnBalloons() {
  const container = document.getElementById('balloons-container');
  for (let i = 0; i < 14; i++) {
    setTimeout(() => {
      const b = document.createElement('div');
      b.className = 'balloon';
      const color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
      const duration = 10 + Math.random() * 14;
      const left     = 3 + Math.random() * 94;
      const delay    = Math.random() * 3;
      b.style.cssText = `
        background: ${color};
        left: ${left}%;
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
        width: ${50 + Math.random() * 20}px;
        height: ${65 + Math.random() * 20}px;
      `;
      container.appendChild(b);
      b.addEventListener('animationend', () => {
        b.remove();
        // Respawn
        setTimeout(() => spawnBalloons(), Math.random() * 3000);
      });
    }, i * 600);
  }
}

// =====================================================
// 6. CANDLE INTERACTION
// =====================================================
const TOTAL_CANDLES = 5;
let blownCandles    = 0;

function blowCandle(idx) {
  const candle = document.getElementById(`candle-${idx}`);
  if (candle.classList.contains('blown')) return;

  candle.classList.add('blown');
  playCandleBlowSound();

  const smoke = document.getElementById(`smoke-${idx}`);
  smoke.classList.remove('hidden');
  setTimeout(() => smoke.classList.add('hidden'), 1400);

  blownCandles++;
  if (blownCandles === TOTAL_CANDLES) {
    setTimeout(wishGranted, 600);
  }
}

function wishGranted() {
  document.getElementById('cake-hint').textContent = '🎉 Wish granted!';
  document.getElementById('wish-granted').classList.remove('hidden');
  burstConfetti();

  // Play a little celebration jingle
  try {
    const ctx = getAudioCtx();
    const jingle = [523.3, 659.3, 783.9, 1046.5];
    jingle.forEach((f, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.18);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.18 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.4);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.4);
    });
  } catch(e) {}
}

// =====================================================
// 7. GIFT BOX INTERACTION
// =====================================================
let giftOpened = false;

function openGift() {
  if (giftOpened) return;
  giftOpened = true;

  const container = document.getElementById('gift-box-container');
  container.classList.add('opened');
  playGiftPopSound();
  burstConfetti();

  setTimeout(() => {
    document.getElementById('gift-message').classList.remove('hidden');
  }, 700);
}

// =====================================================
// 8. PHOTO GALLERY — click interaction
// =====================================================
function celebratePhoto(card) {
  // remove then re-add class to re-trigger animation
  card.classList.remove('pop');
  void card.offsetWidth; // reflow
  card.classList.add('pop');
  burstConfetti();
  playGiftPopSound();
  setTimeout(() => card.classList.remove('pop'), 500);
}
