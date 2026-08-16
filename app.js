/**
 * Birthday Website Interactive Scripts - Symmetrical Scrapbook Collage SPA
 * Pure ES6 JavaScript - Zero Emojis
 */

// -------------------------------------------------------------
// 1. Configuration
// -------------------------------------------------------------
const CONFIG = {
  name: "Fian",              // Recipient name
  date: "11 · 08 · 26",      // Birthday date
  runnerSpeed: 1.5,          // Hero runner speed
};

// Populate config text in DOM
document.querySelectorAll('.recipient-name').forEach(el => el.textContent = CONFIG.name);
document.querySelectorAll('.date-display').forEach(el => el.textContent = CONFIG.date);


// -------------------------------------------------------------
// 2. Opening / Landing Section Sequence
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const heroRunner = document.querySelector("#hero-runner-wrap");
  const heroRunnerSprite = heroRunner.querySelector(".runner-sprite");
  const landingContent = document.querySelector(".landing-content");
  
  let posX = -50;
  const targetX = window.innerWidth + 80;
  let speed = 6;
  
  function animateHeroRunner() {
    if (posX < targetX) {
      const distance = targetX - posX;
      if (distance < 200) {
        speed = Math.max(3, distance * 0.05);
      }
      
      posX += speed * CONFIG.runnerSpeed;
      heroRunner.style.left = `${posX}px`;
      
      const relativeProgress = Math.min(1, (posX + 50) / (targetX + 50));
      const posY = Math.sin(relativeProgress * Math.PI) * -30;
      heroRunner.style.transform = `translate(-50%, calc(-50% + ${posY}px))`;
      
      requestAnimationFrame(animateHeroRunner);
    } else {
      heroRunner.style.display = "none";
      landingContent.classList.add("visible");
    }
  }
  
  setTimeout(animateHeroRunner, 600);
});

// START Button Handler
const btnStart = document.getElementById("btn-start");
const mainContent = document.getElementById("main-content");
const slideLanding = document.getElementById("slide-landing");
const bottomTrackNav = document.getElementById("bottom-track-nav");

btnStart.addEventListener("click", () => {
  slideLanding.style.transition = "opacity 1s ease, transform 1s ease";
  slideLanding.style.opacity = "0";
  slideLanding.style.transform = "scale(0.95)";
  
  setTimeout(() => {
    slideLanding.classList.remove("active");
    slideLanding.classList.add("hidden");
    
    mainContent.classList.remove("hidden");
    bottomTrackNav.classList.remove("hidden");
    
    // Initialize Systems
    initSlideSystem();
    initRouteDrawingCanvas();
    initMemoryDeckGame();
    initEnvelopeSystem();
  }, 1000);
});


// -------------------------------------------------------------
// 3. Slide Management System
// -------------------------------------------------------------
let activeSlideIndex = 0;
let slides = [];
let dots = [];
let isTransitioning = false;
let routeUnlocked = false; // Lock navigation dots until canvas route drawn
const transitionCooldown = 1000;

function initSlideSystem() {
  slides = Array.from(document.querySelectorAll("main > .slide"));
  dots = Array.from(document.querySelectorAll(".track-dot"));
  
  updateSlideStates();
  
  // 1. Wheel Navigation (Throttled)
  window.addEventListener("wheel", (e) => {
    if (isTransitioning || !routeUnlocked) return;
    if (e.deltaY > 15) {
      navigateSlide(1);
    } else if (e.deltaY < -15) {
      navigateSlide(-1);
    }
  });
  
  // 2. Keyboard Navigation
  window.addEventListener("keydown", (e) => {
    if (isTransitioning || !routeUnlocked) return;
    if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === "ArrowRight") {
      navigateSlide(1);
    } else if (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "ArrowLeft") {
      navigateSlide(-1);
    }
  });
  
  // 3. Swipe Navigation (Touch)
  let touchStartY = 0;
  let touchStartX = 0;
  
  window.addEventListener("touchstart", (e) => {
    // Avoid triggering slide swipe transition when dragging puzzle pieces, hidden objects, records, sliders
    if (e.target.closest('.puzzle-piece') || 
        e.target.closest('.hidden-object') || 
        e.target.closest('input[type="range"]') || 
        e.target.closest('#btn-vinyl-disc') || 
        e.target.closest('#vinyl-tonearm') ||
        e.target.closest('#puzzle-target') ||
        e.target.closest('.puzzle-polaroid-container') ||
        e.target.closest('.tv-btn') ||
        e.target.closest('#tv-dial') ||
        e.target.closest('.tv-set') ||
        e.target.closest('.envelope-letter') ||
        e.target.closest('button')) {
      touchStartX = 0;
      touchStartY = 0;
      return;
    }
    touchStartY = e.touches[0].pageY;
    touchStartX = e.touches[0].pageX;
  }, { passive: true });
  
  window.addEventListener("touchend", (e) => {
    if (isTransitioning || !routeUnlocked) return;
    if (touchStartX === 0 && touchStartY === 0) return; // Ignore drag interaction touch liftoff
    
    const touchEndY = e.changedTouches[0].pageY;
    const touchEndX = e.changedTouches[0].pageX;
    const deltaY = touchEndY - touchStartY;
    const deltaX = touchEndX - touchStartX;
    
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      if (deltaY < -45) navigateSlide(1);
      else if (deltaY > 45) navigateSlide(-1);
    } else {
      if (deltaX < -50) navigateSlide(1);
      else if (deltaX > 50) navigateSlide(-1);
    }
  }, { passive: true });
  
  // 4. Dot Navigation Click
  dots.forEach(dot => {
    dot.addEventListener("click", () => {
      if (isTransitioning) return;
      
      const targetIndex = parseInt(dot.getAttribute("data-index"));
      if (!routeUnlocked && targetIndex > 0) return;
      
      if (targetIndex !== activeSlideIndex) {
        goToSlide(targetIndex);
      }
    });
  });
  
  setTimeout(updateNavRunner, 100);
}

function navigateSlide(direction) {
  const targetIndex = activeSlideIndex + direction;
  if (targetIndex >= 0 && targetIndex < slides.length) {
    goToSlide(targetIndex);
  }
}

function goToSlide(index) {
  isTransitioning = true;
  
  const navRunnerSprite = document.querySelector("#nav-runner .runner-sprite");
  if (index > activeSlideIndex) {
    navRunnerSprite.style.transform = "scale(0.45) scaleX(1)";
  } else {
    navRunnerSprite.style.transform = "scale(0.45) scaleX(-1)";
  }
  
  navRunnerSprite.classList.remove("paused");
  
  activeSlideIndex = index;
  updateSlideStates();
  updateNavRunner();
  triggerSlideEntrances(index);
  
  setTimeout(() => {
    navRunnerSprite.classList.add("paused");
    isTransitioning = false;
  }, transitionCooldown);
}

function updateSlideStates() {
  slides.forEach((slide, idx) => {
    slide.classList.remove("active", "prev-slide", "next-slide");
    if (idx < activeSlideIndex) {
      slide.classList.add("prev-slide");
    } else if (idx === activeSlideIndex) {
      slide.classList.add("active");
    } else {
      slide.classList.add("next-slide");
    }
  });
  
  dots.forEach((dot, idx) => {
    if (idx === activeSlideIndex) dot.classList.add("active");
    else dot.classList.remove("active");
  });
}

function updateNavRunner() {
  const activeDot = dots[activeSlideIndex];
  const navContainer = document.getElementById("bottom-track-nav");
  const navRunner = document.getElementById("nav-runner");
  
  if (!activeDot || !navContainer || !navRunner) return;
  
  const rectContainer = navContainer.getBoundingClientRect();
  const rectDot = activeDot.getBoundingClientRect();
  
  const centerDot = (rectDot.left + rectDot.width / 2) - rectContainer.left;
  const pct = (centerDot / rectContainer.width) * 100;
  
  navRunner.style.left = `${pct}%`;
}

window.addEventListener("resize", () => {
  if (bottomTrackNav && !bottomTrackNav.classList.contains("hidden")) {
    updateNavRunner();
  }
});


// -------------------------------------------------------------
// -------------------------------------------------------------
// 4. "Draw Your Route" Canvas (Slide 2 - Retro Camera Viewfinder)
// -------------------------------------------------------------
function initRouteDrawingCanvas() {
  const slider = document.getElementById("camera-focus-slider");
  const vfLeft = document.querySelector(".vf-left");
  const vfRight = document.querySelector(".vf-right");
  const shutterBtn = document.getElementById("btn-camera-shutter");
  const polaroidOutput = document.getElementById("polaroid-photo-output");
  const ageNumber = document.getElementById("develop-age-number");
  const guideText = document.getElementById("canvas-instructions-text");
  
  slider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value); // 5 to 95, target is 50
    const target = 50;
    const diff = Math.abs(val - target);
    
    // Position offset mapping
    const offsetX = (val - target) * 0.45;
    vfLeft.style.transform = `translate(calc(-50% + ${offsetX}px), -50%)`;
    vfRight.style.transform = `translate(calc(-50% - ${offsetX}px), -50%)`;
    
    // Adjust blurs based on distance
    const blurVal = Math.min(5, diff * 0.12);
    vfLeft.style.filter = `blur(${blurVal}px)`;
    vfRight.style.filter = `blur(${blurVal}px)`;
    
    if (diff <= 3) {
      shutterBtn.removeAttribute("disabled");
      shutterBtn.classList.add("focused-active");
      
      // Lock focus details
      vfLeft.style.color = "var(--accent-warm)";
      vfRight.style.color = "var(--accent)";
      vfLeft.style.filter = "none";
      vfRight.style.filter = "none";
      vfLeft.style.transform = "translate(-50%, -50%)";
      vfRight.style.transform = "translate(-50%, -50%)";
    } else {
      shutterBtn.setAttribute("disabled", "true");
      shutterBtn.classList.remove("focused-active");
      vfLeft.style.color = "rgba(198, 137, 105, 0.6)";
      vfRight.style.color = "rgba(203, 176, 140, 0.6)";
    }
  });
  
  shutterBtn.addEventListener("click", () => {
    shutterBtn.classList.add("clicked");
    
    // Trigger audio snap sound
    playShutterChime();
    
    // Trigger screen flash overlay
    const flash = document.createElement("div");
    flash.className = "camera-flash-overlay active";
    document.body.appendChild(flash);
    
    setTimeout(() => {
      flash.classList.remove("active");
      setTimeout(() => flash.remove(), 250);
    }, 40);
    
    // Eject photograph filmstrip
    polaroidOutput.classList.add("photo-ejected");
    
    // Unlock SPA slides
    routeUnlocked = true;
    document.getElementById("slide-intro").classList.add("slide-intro-unlocked");
    document.getElementById("bottom-track-nav").classList.remove("locks-navigator");
    
    guideText.textContent = "eh buset! scroll dong abang ganteng";
    guideText.style.color = "var(--accent-warm)";
    
    ageNumber.style.opacity = "1";
    ageNumber.style.transform = "scale(1)";
  });
  
  function playShutterChime() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Synthesize quick shutter focus snap chimes
      const osc = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(660, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.08);
      
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.12);
      
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      
      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc2.start();
      
      osc.stop(audioCtx.currentTime + 0.12);
      osc2.stop(audioCtx.currentTime + 0.12);
    } catch(e) {}
  }
}


// -------------------------------------------------------------
// 5. Draggable Polaroid Stack (Slide 4)
// -------------------------------------------------------------
function initDraggablePolaroids() {
  const container = document.querySelector(".polaroid-stack-container");
  if (!container) return;
  const stack = document.querySelector(".polaroid-stack");
  const cards = Array.from(document.querySelectorAll(".polaroid-card"));
  const btnRestack = document.getElementById("btn-restack");
  
  let dragCard = null;
  let startX = 0, startY = 0;
  let activeCardIndex = 0;
  
  function setupDraggableCard(card) {
    card.addEventListener("mousedown", dragStart);
    card.addEventListener("touchstart", dragStart, { passive: true });
  }
  
  function dragStart(e) {
    if (this !== cards[cards.length - 1 - activeCardIndex]) return;
    
    dragCard = this;
    dragCard.style.transition = "none";
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    startX = clientX;
    startY = clientY;
    
    document.addEventListener("mousemove", dragMove);
    document.addEventListener("touchmove", dragMove, { passive: false });
    
    document.addEventListener("mouseup", dragEnd);
    document.addEventListener("touchend", dragEnd);
  }
  
  function dragMove(e) {
    if (!dragCard) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const dx = clientX - startX;
    const dy = clientY - startY;
    
    const rot = dx * 0.08;
    
    dragCard.style.transform = `translate3d(${dx}px, ${dy}px, 0) rotate(${rot}deg)`;
  }
  
  function dragEnd(e) {
    if (!dragCard) return;
    
    document.removeEventListener("mousemove", dragMove);
    document.removeEventListener("touchmove", dragMove);
    document.removeEventListener("mouseup", dragEnd);
    document.removeEventListener("touchend", dragEnd);
    
    const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const dx = endX - startX;
    
    if (Math.abs(dx) > 110) {
      throwCard(dx > 0 ? 1 : -1);
    } else {
      dragCard.style.transition = "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
      dragCard.style.transform = "translate3d(0, 0, 0) scale(1) rotate(1deg)";
      dragCard = null;
    }
  }
  
  function throwCard(direction) {
    const card = dragCard;
    dragCard = null;
    activeCardIndex++;
    
    card.style.transition = "transform 0.5s ease-out, opacity 0.5s ease-out";
    card.style.transform = `translate3d(${direction * window.innerWidth}px, 100px, 0) rotate(${direction * 45}deg)`;
    card.style.opacity = "0";
    card.style.pointerEvents = "none";
    
    if (activeCardIndex >= cards.length) {
      setTimeout(() => {
        btnRestack.classList.remove("hidden");
      }, 500);
    }
  }
  
  cards.forEach(setupDraggableCard);
  
  btnRestack.addEventListener("click", () => {
    activeCardIndex = 0;
    btnRestack.classList.add("hidden");
    
    cards.forEach((card, idx) => {
      card.style.transition = "transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.2); opacity 0.6s ease";
      card.style.opacity = "1";
      card.style.pointerEvents = "auto";
      
      const stackOrder = cards.length - 1 - idx;
      let ty = 0, scale = 1, zIndex = 0, tz = 0;
      if (stackOrder === 3) { ty = 9; scale = 0.91; tz = -27; }
      else if (stackOrder === 2) { ty = 6; scale = 0.94; tz = -18; }
      else if (stackOrder === 1) { ty = 3; scale = 0.97; tz = -9; }
      else if (stackOrder === 0) { ty = 0; scale = 1; tz = 0; zIndex = 5; }
      
      card.style.transform = `translate3d(0, ${ty}px, ${tz}px) scale(${scale})`;
      card.style.zIndex = zIndex;
    });
  });
}


// -------------------------------------------------------------
// 6. Global Pace Controller & Particles Trail System (Slide 6)
// -------------------------------------------------------------
let globalPaceFactor = 1.0;
let particleSpawnInterval = null;

function initPaceController() {
  const slider = document.getElementById("pace-slider");
  if (!slider) return;
  const valueDisplay = document.getElementById("pace-value-display");
  const pinBtn = document.getElementById("btn-pin-slider");
  let isPinned = false;
  
  const paceSettings = {
    1: { label: "Jog", speed: "0.8s", globalPace: 0.8 },
    2: { label: "Run", speed: "0.5s", globalPace: 1.0 },
    3: { label: "Sprint", speed: "0.3s", globalPace: 1.5 },
    4: { label: "Warp", speed: "0.15s", globalPace: 2.2 }
  };
  
  pinBtn.addEventListener("click", () => {
    isPinned = !isPinned;
    if (isPinned) {
      pinBtn.classList.add("pinned");
      pinBtn.querySelector("span").textContent = "Pinned";
    } else {
      pinBtn.classList.remove("pinned");
      pinBtn.querySelector("span").textContent = "Pin";
    }
  });
  
  slider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    updatePace(val);
  });
  
  function updatePace(val) {
    const setting = paceSettings[val];
    valueDisplay.textContent = setting.label;
    globalPaceFactor = setting.globalPace;
    document.documentElement.style.setProperty('--run-cycle-speed', setting.speed);
    toggleParticlesTrail(val);
  }
  
  // Slippery Drift: decrement slider value back to Jog (1) unless pinned
  setInterval(() => {
    if (isPinned) return;
    const currentVal = parseInt(slider.value);
    if (currentVal > 1) {
      const newVal = currentVal - 1;
      slider.value = newVal;
      updatePace(newVal);
    }
  }, 1600);
  
  toggleParticlesTrail(2);
}

function toggleParticlesTrail(paceLevel) {
  clearInterval(particleSpawnInterval);
  if (paceLevel <= 1) return;
  
  const rate = paceLevel === 2 ? 100 : (paceLevel === 3 ? 50 : 25);
  
  particleSpawnInterval = setInterval(() => {
    const runners = document.querySelectorAll(".runner-wrap:not(.hidden)");
    runners.forEach(runner => {
      const parentSlide = runner.closest(".slide");
      if (parentSlide && !parentSlide.classList.contains("active") && runner.id !== "nav-runner") return;
      
      const runnerSprite = runner.querySelector(".runner-sprite");
      if (runnerSprite && runnerSprite.classList.contains("paused")) return;
      
      const rect = runner.getBoundingClientRect();
      createDustParticle(rect.left + rect.width / 2, rect.top + rect.height - 5);
    });
  }, rate);
}

function createDustParticle(x, y) {
  const p = document.createElement("div");
  p.classList.add("particle-trail");
  p.style.left = `${x + (Math.random() * 8 - 4) + window.scrollX}px`;
  p.style.top = `${y + (Math.random() * 4 - 2) + window.scrollY}px`;
  document.body.appendChild(p);
  
  setTimeout(() => {
    p.remove();
  }, 800);
}


// -------------------------------------------------------------
// 7. Slide Specific Entrance Actions
// -------------------------------------------------------------
function triggerSlideEntrances(index) {
  if (index === 0) {
    const ageCardContainer = document.querySelector(".age-badge-container");
    if (routeUnlocked) {
      setTimeout(() => {
        ageCardContainer.classList.add("visible");
      }, 200);
    }
  }
  
  if (index === 4 && !endingTriggered) {
    endingTriggered = true;
    setTimeout(triggerEndingSequence, 800);
  }
}


// -------------------------------------------------------------
// 8. Reasons Section Retro CRT TV Switcher
// -------------------------------------------------------------
const TV_CHANNELS = [
  {
    image: "assets/photos/atu.jpg",
    title: "chapter 1",
    text: "hei hei, makasii udaa ada yaa ucen, ko km baik bgt si kan aku jadi arghh gitu..."
  },
  {
    image: "assets/photos/ua.jpg",
    title: "chapter 2",
    text: "truss truss aku mo bilang makasi jugaa buat semuwa hal yang udah km lakuin buatku, semoga bisa terus bareng yaa ucen emmm, aamin"
  },
  {
    image: "assets/photos/iga.jpg",
    title: "chapter 3",
    text: "liat deh muka kita wkwk, kok kaya emmmm..."
  },
  {
    image: "assets/photos/empat.jpg",
    title: "chapter 4",
    text: "aww kok ada lop' gitu emang boleh? sukakk kalo sm' bahagia gini, km jangan cedii' yaa ucenn"
  },
  {
    image: "assets/photos/ima.jpg",
    title: "chapter 5",
    text: "eh disini senyumnya lebar bgt sukakk, ah semua sukakkk, lop ucen cemangatd yaa semoga semuwa yg km cita-citain bisa tercapai aamin, jangan cape dulu kan ada pida hehe, meskipun gangaruh si"
  },
  {
    image: "assets/photos/enam.jpg",
    title: "chapter 6",
    text: "km jangan lupa jaga kesehatan yaa ucen, lop u semoga semuwa hal yg km lakuin buatku bisa buat km seneng jugaa"
  }
];

function initMemoryDeckGame() {
  const photo = document.getElementById("tv-photo");
  const dial = document.getElementById("tv-dial");
  const btnNext = document.getElementById("tv-btn-next");
  const btnPrev = document.getElementById("tv-btn-prev");
  const canvas = document.getElementById("tv-static-canvas");
  
  const noteTitle = document.getElementById("notepad-title");
  const noteText = document.getElementById("notepad-text");
  
  if (!photo || !btnNext || !btnPrev || !canvas || !noteTitle || !noteText) return;
  
  // Set canvas scale resolution
  canvas.width = 120;
  canvas.height = 90;
  const ctx = canvas.getContext("2d");
  
  let currentIndex = 0;
  let isSwitching = false;
  let dialAngle = 0;
  let staticAnimId = null;

  function renderNoise() {
    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;
    
    // Fill with random black/white pixels for screen fuzz
    for (let i = 0; i < data.length; i += 4) {
      let val = Math.floor(Math.random() * 255);
      data[i] = val;     // R
      data[i+1] = val;   // G
      data[i+2] = val;   // B
      data[i+3] = 255;   // A
    }
    
    ctx.putImageData(imgData, 0, 0);
    if (canvas.classList.contains("active")) {
      staticAnimId = requestAnimationFrame(renderNoise);
    }
  }

  function switchChannel(direction) {
    if (isSwitching) return;
    isSwitching = true;
    
    // Play hardware sounds
    playDialClickSound();
    playStaticHumSound();

    // 1. Turn on static canvas
    canvas.classList.add("active");
    renderNoise();
    
    // 2. Rotate dial
    if (direction === "next") {
      currentIndex = (currentIndex + 1) % TV_CHANNELS.length;
      dialAngle += 45;
    } else {
      currentIndex = (currentIndex - 1 + TV_CHANNELS.length) % TV_CHANNELS.length;
      dialAngle -= 45;
    }
    if (dial) {
      dial.style.transform = `rotate(${dialAngle}deg)`;
    }

    // 3. Swap image and notepad story halfway through fuzz (130ms)
    setTimeout(() => {
      const channel = TV_CHANNELS[currentIndex];
      photo.src = channel.image;
      noteTitle.textContent = channel.title;
      noteText.textContent = channel.text;
    }, 130);

    // 4. Turn off static fuzz after 260ms
    setTimeout(() => {
      canvas.classList.remove("active");
      if (staticAnimId) {
        cancelAnimationFrame(staticAnimId);
        staticAnimId = null;
      }
      isSwitching = false;
    }, 260);
  }

  // Dial tap triggers next channel
  if (dial) {
    dial.addEventListener("click", () => switchChannel("next"));
    dial.addEventListener("touchstart", (e) => {
      e.preventDefault();
      switchChannel("next");
    }, { passive: false });
  }

  // Button listeners
  btnNext.addEventListener("click", () => switchChannel("next"));
  btnNext.addEventListener("touchstart", (e) => {
    e.preventDefault();
    switchChannel("next");
  }, { passive: false });
  
  btnPrev.addEventListener("click", () => switchChannel("prev"));
  btnPrev.addEventListener("touchstart", (e) => {
    e.preventDefault();
    switchChannel("prev");
  }, { passive: false });

  // Web Audio TV hum / switch click generator
  function playDialClickSound() {
    try {
      const actx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(180, actx.currentTime); // Metallic dial click
      osc.frequency.exponentialRampToValueAtTime(10, actx.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.04, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.045);
      
      osc.connect(gain);
      gain.connect(actx.destination);
      
      osc.start();
      osc.stop(actx.currentTime + 0.05);
    } catch(e) {}
  }

  function playStaticHumSound() {
    try {
      const actx = new (window.AudioContext || window.webkitAudioContext)();
      // Generate noise buffer
      const bufferSize = actx.sampleRate * 0.25; // 0.25 seconds
      const buffer = actx.createBuffer(1, bufferSize, actx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1; // White noise
      }
      
      const noiseNode = actx.createBufferSource();
      noiseNode.buffer = buffer;
      
      const filter = actx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(120, actx.currentTime); // Low electric buzz tone
      filter.Q.setValueAtTime(1.5, actx.currentTime);
      
      const gain = actx.createGain();
      gain.gain.setValueAtTime(0.07, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.24);
      
      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(actx.destination);
      
      noiseNode.start();
      noiseNode.stop(actx.currentTime + 0.25);
    } catch(e) {}
  }
}


// -------------------------------------------------------------
// Slide 3 (Scrapbook Jigsaw Puzzle) Messages and Game Logic
// -------------------------------------------------------------
const PUZZLE_LETTERS = {
  "1": {
    title: "Part 01",
    text: "You probably don't realize it, but you're one of those people who can make a normal day feel a little less boring."
  },
  "2": {
    title: "Part 02",
    text: "I appreciate how you can just be yourself without trying too hard."
  },
  "3": {
    title: "Part 03",
    text: "It's kinda funny how someone can become part of your everyday life without you even realizing when it started."
  },
  "4": {
    title: "Part 04",
    text: "I hope you know that there are people genuinely rooting for you."
  }
};

function initPuzzleGame() {
  const pieces = document.querySelectorAll(".puzzle-piece");
  const completeBanner = document.getElementById("puzzle-complete-banner");
  const messageCard = document.getElementById("puzzle-message-card");
  
  if (!pieces.length) return;
  
  let snappedCount = 0;
  
  pieces.forEach(piece => {
    let startX = 0, startY = 0;
    let initialLeft = parseFloat(piece.style.left) || 0;
    let initialTop = parseFloat(piece.style.top) || 0;
    let currentX = initialLeft;
    let currentY = initialTop;
    let isDragging = false;
    
    piece.addEventListener("mousedown", dragStart);
    piece.addEventListener("touchstart", dragStart, { passive: false });
    
    function dragStart(e) {
      if (piece.classList.contains("snapped")) return;
      isDragging = true;
      
      // Stop browser from panning/scrolling the screen while dragging puzzle piece
      if (e.cancelable) {
        e.preventDefault();
      }
      
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      startX = clientX - currentX;
      startY = clientY - currentY;
      
      piece.style.cursor = "grabbing";
      piece.style.zIndex = "100";
      
      document.addEventListener("mousemove", dragMove);
      document.addEventListener("touchmove", dragMove, { passive: false });
      document.addEventListener("mouseup", dragEnd);
      document.addEventListener("touchend", dragEnd);
    }
    
    function dragMove(e) {
      if (!isDragging) return;
      
      if (e.cancelable) e.preventDefault();
      
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      currentX = clientX - startX;
      currentY = clientY - startY;
      
      piece.style.left = `${currentX}px`;
      piece.style.top = `${currentY}px`;
      piece.style.transform = `scale(1.05)`;
    }
    
    function dragEnd() {
      if (!isDragging) return;
      isDragging = false;
      
      piece.style.cursor = "grab";
      piece.style.zIndex = "10";
      
      document.removeEventListener("mousemove", dragMove);
      document.removeEventListener("touchmove", dragMove);
      document.removeEventListener("mouseup", dragEnd);
      document.removeEventListener("touchend", dragEnd);
      
      const pieceId = piece.getAttribute("data-piece");
      const targetSlot = document.querySelector(`.snap-slot[data-slot="${pieceId}"]`);
      
      if (targetSlot) {
        const rectPiece = piece.getBoundingClientRect();
        const rectSlot = targetSlot.getBoundingClientRect();
        
        const centerPieceX = rectPiece.left + rectPiece.width / 2;
        const centerPieceY = rectPiece.top + rectPiece.height / 2;
        
        const centerSlotX = rectSlot.left + rectSlot.width / 2;
        const centerSlotY = rectSlot.top + rectSlot.height / 2;
        
        const dist = Math.sqrt(Math.pow(centerPieceX - centerSlotX, 2) + Math.pow(centerPieceY - centerSlotY, 2));
        
        if (dist < 28) {
          snapPiece(piece, targetSlot);
        } else {
          // Reset position smoothly
          piece.style.transition = "left 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.25), top 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.25), transform 0.4s";
          piece.style.left = `${initialLeft}px`;
          piece.style.top = `${initialTop}px`;
          piece.style.transform = `rotate(${(parseInt(pieceId) % 2 === 0 ? 4 : -5)}deg)`;
          currentX = initialLeft;
          currentY = initialTop;
          setTimeout(() => { piece.style.transition = "none"; }, 400);
        }
      }
    }
  });
  
  function snapPiece(piece, slot) {
    piece.classList.add("snapped");
    piece.style.transition = "none";
    piece.style.pointerEvents = "none";
    piece.style.transform = "none";
    piece.style.left = "0";
    piece.style.top = "0";
    
    slot.appendChild(piece);
    snappedCount++;
    
    playSnapChime();
    
    if (snappedCount === 4) {
      // Puzzle completed!
      const targetFrame = document.getElementById("puzzle-target");
      const slideSection = document.getElementById("slide-sayings");
      const captionText = document.getElementById("polaroid-caption-text");
      
      if (targetFrame) {
        targetFrame.classList.add("completed-target");
        
        const toggleFlip = (e) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          targetFrame.classList.toggle("flipped");
          playFlipChime();
        };
        
        targetFrame.addEventListener("touchend", toggleFlip, { passive: false });
        targetFrame.addEventListener("click", toggleFlip);
      }
      
      if (slideSection) {
        slideSection.classList.add("puzzle-slide-completed");
      }
      
      if (captionText) {
        captionText.textContent = "tap tap!";
        captionText.style.color = "var(--accent-warm)";
        captionText.style.fontWeight = "bold";
      }
    }
  }
  
  function playFlipChime() {
    try {
      const actx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(330, actx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(165, actx.currentTime + 0.18);
      
      gain.gain.setValueAtTime(0.05, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.2);
      
      osc.connect(gain);
      gain.connect(actx.destination);
      
      osc.start();
      osc.stop(actx.currentTime + 0.22);
    } catch(e) {}
  }
  
  function playSnapChime() {
    try {
      const actx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(392, actx.currentTime); // G4
      osc.frequency.exponentialRampToValueAtTime(587.33, actx.currentTime + 0.12); // D5
      
      gain.gain.setValueAtTime(0.04, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.15);
      
      osc.connect(gain);
      gain.connect(actx.destination);
      
      osc.start();
      osc.stop(actx.currentTime + 0.18);
    } catch(e) {}
  }
}

initPuzzleGame();


// -------------------------------------------------------------
// 9. Custom Vinyl Audio Player & Synthesizer Fallback
// -------------------------------------------------------------
const audio = document.getElementById("real-audio");
const btnVinylDisc = document.getElementById("btn-vinyl-disc");
const vinylDisc = document.querySelector(".vinyl-grooves");
const vinylTonearm = document.getElementById("vinyl-tonearm");
const progressBar = document.getElementById("audio-progress-bar");
const progressContainer = document.getElementById("audio-progress-container");
const timeCurrent = document.getElementById("audio-time-current");
const timeTotal = document.getElementById("audio-time-total");
const canvas = document.getElementById("waveform-canvas");
const canvasCtx = canvas.getContext("2d");
const audioContainer = document.querySelector(".vinyl-player-section");

let isPlaying = false;
let audioContext = null;
let synthInterval = null;
let animationFrameId = null;
let isFallbackSound = false;
let waveOffset = 0;

function getAudioDuration() {
  if (isFallbackSound) return 90;
  return audio.duration && !isNaN(audio.duration) ? audio.duration : 90;
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function updateProgress() {
  const duration = getAudioDuration();
  if (!duration) return;
  const pct = (audio.currentTime / duration) * 100;
  progressBar.style.width = `${pct}%`;
  timeCurrent.textContent = formatTime(audio.currentTime);
}

audio.addEventListener("loadedmetadata", () => {
  timeTotal.textContent = formatTime(getAudioDuration());
});

audio.addEventListener("timeupdate", updateProgress);

audio.addEventListener("ended", () => {
  stopAudioState();
});

progressContainer.addEventListener("click", (e) => {
  const width = progressContainer.clientWidth;
  const clickX = e.offsetX;
  const duration = getAudioDuration();
  if (duration) {
    audio.currentTime = (clickX / width) * duration;
  }
});

// Single or Double click triggers playing disc
btnVinylDisc.addEventListener("click", () => {
  if (isPlaying) pauseAudio();
  else playAudio();
});

vinylTonearm.addEventListener("click", () => {
  if (isPlaying) pauseAudio();
  else playAudio();
});

function playAudio() {
  isPlaying = true;
  audioContainer.classList.add("playing");
  document.body.classList.add("playing-breath");
  
  audio.play()
    .then(() => {
      isFallbackSound = false;
      drawWaveform();
    })
    .catch((err) => {
      console.warn("Real audio failed or missing. Launching romantic synth fallback.", err);
      launchSynthFallback();
    });
}

function pauseAudio() {
  isPlaying = false;
  audioContainer.classList.remove("playing");
  document.body.classList.remove("playing-breath");
  
  if (isFallbackSound) {
    clearInterval(synthInterval);
  } else {
    audio.pause();
  }
  cancelAnimationFrame(animationFrameId);
  drawStaticWaveform();
}

function stopAudioState() {
  pauseAudio();
  audio.currentTime = 0;
  progressBar.style.width = "0%";
  timeCurrent.textContent = "0:00";
}

function launchSynthFallback() {
  isFallbackSound = true;
  
  const duration = getAudioDuration();
  timeTotal.textContent = formatTime(duration);
  
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  function playAmbientPad() {
    if (!isPlaying) return;
    
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    osc.type = "sine";
    const baseNotes = [174.61, 220.00, 261.63, 329.63, 392.00];
    const pitch = baseNotes[Math.floor(Math.random() * baseNotes.length)] * globalPaceFactor;
    
    osc.frequency.setValueAtTime(pitch, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.04, audioContext.currentTime + 1.5);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 4.5);
    
    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    osc.start();
    osc.stop(audioContext.currentTime + 5);
  }
  
  playAmbientPad();
  synthInterval = setInterval(playAmbientPad, 3000 / globalPaceFactor);
  
  const intervalTime = 100;
  const updateTimer = () => {
    if (!isPlaying || !isFallbackSound) return;
    const duration = getAudioDuration();
    audio.currentTime = Math.min(duration, audio.currentTime + (intervalTime / 1000));
    updateProgress();
    
    if (audio.currentTime >= duration) {
      stopAudioState();
    } else {
      setTimeout(updateTimer, intervalTime);
    }
  };
  setTimeout(updateTimer, intervalTime);
  
  drawWaveform();
}

// Circular Concentric Rippling Visualizer (Centered on 200, 200)
function drawStaticWaveform() {
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  // 3 static thin golden grooves circles
  for (let i = 1; i <= 3; i++) {
    canvasCtx.beginPath();
    canvasCtx.arc(centerX, centerY, 125 + i * 15, 0, Math.PI * 2);
    canvasCtx.strokeStyle = "rgba(203, 176, 140, 0.2)";
    canvasCtx.lineWidth = 1;
    canvasCtx.stroke();
  }
}

function drawWaveform() {
  if (!isPlaying) return;
  
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const baseRadius = 130;
  
  waveOffset += 0.05 * globalPaceFactor;
  
  // Draw expanding circular ripples
  for (let i = 0; i < 4; i++) {
    const phase = ((i * 0.25) + (waveOffset * 0.1)) % 1;
    const r = baseRadius + phase * 65;
    const alpha = (1 - phase) * 0.45;
    
    canvasCtx.beginPath();
    canvasCtx.arc(centerX, centerY, r, 0, Math.PI * 2);
    canvasCtx.strokeStyle = `rgba(198, 137, 105, ${alpha})`;
    canvasCtx.lineWidth = 1.5 + (1 - phase) * 3.5;
    canvasCtx.stroke();
  }
  
  animationFrameId = requestAnimationFrame(drawWaveform);
}

drawStaticWaveform();


// -------------------------------------------------------------
// 10. Interactive 3D Envelope Seals (Slide 8)
// -------------------------------------------------------------
function initEnvelopeSystem() {
  const envelope = document.getElementById("envelope-main");
  const seal = document.getElementById("wax-seal-button");
  const filmstrip = document.getElementById("letter-filmstrip-strip");
  let chaseCount = 0;
  
  // Inject visual feedback note
  const chaseNote = document.createElement("div");
  chaseNote.className = "chase-note";
  chaseNote.textContent = "Catch me if you can!";
  envelope.appendChild(chaseNote);
  
  function dodge(e) {
    if (chaseCount >= 3) return;
    e.preventDefault();
    
    chaseCount++;
    chaseNote.classList.add("visible");
    
    if (chaseCount === 1) chaseNote.textContent = "Too slow!";
    else if (chaseCount === 2) chaseNote.textContent = "Hold on, not yet!";
    else if (chaseCount === 3) {
      chaseNote.textContent = "Ugh. Okay, fine, click me.";
      setTimeout(() => {
        chaseNote.classList.remove("visible");
      }, 2000);
    }
    
    // Teleport randomly within envelope borders (bounds: 360 x 240)
    // Wax seal is 40x40. Keep bounds between 30px and 290px left, 30px and 170px top.
    const randX = Math.floor(Math.random() * 260) + 30;
    const randY = Math.floor(Math.random() * 140) + 30;
    
    seal.style.left = `${randX}px`;
    seal.style.top = `${randY}px`;
  }
  
  seal.addEventListener("mouseenter", dodge);
  seal.addEventListener("touchstart", dodge);
  
  seal.addEventListener("click", () => {
    if (chaseCount < 3) return; // Block clicks until dodging finishes
    
    // Play satisfying mechanical paper tear / wax cracking sound
    playPaperTearSound();
    
    envelope.classList.add("opened");
    
    setTimeout(() => {
      if (filmstrip) {
        filmstrip.classList.add("revealed");
      }
    }, 500);
  });
  
  function playPaperTearSound() {
    try {
      const actx = new (window.AudioContext || window.webkitAudioContext)();
      
      // 1. Low-frequency pop for breaking the wax
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(120, actx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, actx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start();
      osc.stop(actx.currentTime + 0.3);
      
      // 2. High-frequency crackle/crinkle noise for tearing paper
      const bufferSize = actx.sampleRate * 0.35;
      const buffer = actx.createBuffer(1, bufferSize, actx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const rand = Math.random() * 2 - 1;
        data[i] = Math.pow(rand, 7) * 0.12 * Math.max(0, 1 - (i / bufferSize));
      }
      
      const noise = actx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = actx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1200, actx.currentTime);
      filter.Q.setValueAtTime(1.5, actx.currentTime);
      
      noise.connect(filter);
      filter.connect(actx.destination);
      noise.start();
      noise.stop(actx.currentTime + 0.4);
    } catch (e) {
      console.warn("Sound synthesis error", e);
    }
  }
}


// -------------------------------------------------------------
// 11. Ending Section & Confetti Particles
// -------------------------------------------------------------
const endingSection = document.getElementById("slide-final-message");
const particleCanvas = document.getElementById("ending-canvas");
const pCtx = particleCanvas ? particleCanvas.getContext("2d") : null;

let endingTriggered = false;

function resizeParticleCanvas() {
  if (!endingSection || !particleCanvas) return;
  particleCanvas.width = endingSection.clientWidth;
  particleCanvas.height = endingSection.clientHeight;
}
window.addEventListener("resize", resizeParticleCanvas);
if (endingSection && particleCanvas) {
  resizeParticleCanvas();
}

function triggerEndingSequence() {
  if (!particleCanvas || !pCtx) return;
  resizeParticleCanvas();
  initCelebration();
}

// Celebration Particles
let particles = [];

class CelebrationParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 4 + 1.5;
    this.speedY = Math.random() * -1.5 - 0.5;
    this.speedX = Math.random() * 1.2 - 0.6;
    this.color = Math.random() > 0.3 ? "var(--accent-warm)" : "var(--accent)";
    this.opacity = Math.random() * 0.7 + 0.3;
    this.decay = Math.random() * 0.005 + 0.003;
  }
  
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.opacity -= this.decay;
  }
  
  draw() {
    if (!pCtx) return;
    pCtx.save();
    pCtx.globalAlpha = this.opacity;
    pCtx.fillStyle = this.color;
    pCtx.beginPath();
    pCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    pCtx.fill();
    pCtx.restore();
  }
}

function initCelebration() {
  if (!particleCanvas || !pCtx) return;
  
  function spawnParticles() {
    if (particles.length < 80) {
      const x = Math.random() * particleCanvas.width;
      const y = particleCanvas.height * 0.9;
      particles.push(new CelebrationParticle(x, y));
    }
  }
  
  function loopParticles() {
    if (!pCtx) return;
    pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    spawnParticles();
    
    particles.forEach((p, idx) => {
      p.update();
      p.draw();
      
      if (p.opacity <= 0) {
        particles.splice(idx, 1);
      }
    });
    
    requestAnimationFrame(loopParticles);
  }
  
  loopParticles();
}
