const items        = document.querySelectorAll('.menu-item');
const sections     = document.querySelectorAll('.content-section');
const verticalText = document.getElementById('verticalText');
const menuBg       = document.getElementById('menuBg');
const titleBg      = document.getElementById('titleBg');
const grainCanvas  = document.getElementById('grainCanvas');
const grainCtx     = grainCanvas.getContext('2d');
const canvas       = document.getElementById('transitionCanvas');
const ctx          = canvas.getContext('2d');

const BG_CLASSES = ['bg-home', 'bg-bio', 'bg-projects', 'bg-blog'];

function applyBgTheme(index) {
  const item = items[index];
  const bg = item ? item.dataset.bg : 'home';
  BG_CLASSES.forEach(c => document.body.classList.remove(c));
  document.body.classList.add(`bg-${bg}`);
}
function resizeGrain() {
  // Run at half resolution for performance, CSS scales it up
  grainCanvas.width  = Math.floor(window.innerWidth  / 2);
  grainCanvas.height = Math.floor(window.innerHeight / 2);
  grainCanvas.style.width  = window.innerWidth  + 'px';
  grainCanvas.style.height = window.innerHeight + 'px';
}
resizeGrain();
window.addEventListener('resize', resizeGrain);

let lastGrainFrame = 0;
const GRAIN_FPS = 24; // update rate — lower = choppier old-TV feel

function drawGrain(ts) {
  requestAnimationFrame(drawGrain);
  if (ts - lastGrainFrame < 1000 / GRAIN_FPS) return;
  lastGrainFrame = ts;

  const w = grainCanvas.width;
  const h = grainCanvas.height;
  const imageData = grainCtx.createImageData(w, h);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    data[i]     = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 255;
  }

  grainCtx.putImageData(imageData, 0, 0);
}
requestAnimationFrame(drawGrain);
// ─────────────────────────────────────────────────────────────────

let activeIndex   = 0;   // drives content + size hierarchy
let bgIndex       = 0;   // drives rectangle position (hover or active)
let transitioning = false;

// ── Canvas resize ─────────────────────────────────────────────────
function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ── Helpers ───────────────────────────────────────────────────────
function isMobile() {
  return window.innerWidth <= 768;
}

// ── Generic wobble factory ────────────────────────────────────────
// Returns { updateBase(el, snap), start() }
function makeWobble(bgEl, offset = 7, lerp = 0.18, interval = 450) {
  const corners = [
    { x: 0, y: 0, tx: 0, ty: 0 },
    { x: 0, y: 0, tx: 0, ty: 0 },
    { x: 0, y: 0, tx: 0, ty: 0 },
    { x: 0, y: 0, tx: 0, ty: 0 },
  ];
  let baseRect = { left: 0, top: 0, right: 0, bottom: 0 };

  function rnd() { return (Math.random() * 2 - 1) * offset; }
  function scramble() { corners.forEach(c => { c.tx = rnd(); c.ty = rnd(); }); }
  function lerpN(a, b, t) { return a + (b - a) * t; }

  setInterval(scramble, interval);

  function updateBase(el, snap = false) {
    const r = el.getBoundingClientRect();
    baseRect = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    if (snap) {
      corners[0].x = baseRect.left;  corners[0].y = baseRect.top;
      corners[1].x = baseRect.right; corners[1].y = baseRect.top;
      corners[2].x = baseRect.right; corners[2].y = baseRect.bottom;
      corners[3].x = baseRect.left;  corners[3].y = baseRect.bottom;
    }
    scramble();
  }

  function tick() {
    // Skip if element is hidden via CSS display:none
    if (getComputedStyle(bgEl).display === 'none') {
      requestAnimationFrame(tick);
      return;
    }
    const bl = baseRect.left, bt = baseRect.top;
    const br = baseRect.right, bb = baseRect.bottom;
    const bases = [[bl, bt], [br, bt], [br, bb], [bl, bb]];
    corners.forEach((c, i) => {
      const [bx, by] = bases[i];
      c.x = lerpN(c.x, bx + c.tx, lerp);
      c.y = lerpN(c.y, by + c.ty, lerp);
    });
    bgEl.style.left   = '0';
    bgEl.style.top    = '0';
    bgEl.style.width  = '100vw';
    bgEl.style.height = '100vh';
    const pts = corners.map(c => `${c.x.toFixed(2)}px ${c.y.toFixed(2)}px`).join(', ');
    bgEl.style.clipPath = `polygon(${pts})`;
    requestAnimationFrame(tick);
  }

  return { updateBase, start: tick };
}

// ── Wobble instances ──────────────────────────────────────────────
const menuWobble  = makeWobble(menuBg);
const titleWobble = makeWobble(titleBg, 5, 0.1, 600);

function updateMenuBg(index, snap = false) {
  menuWobble.updateBase(items[index], snap);
}

function getActiveTitleEl() {
  return document.querySelector('.content-section.active .section-title');
}

// Always snaps — wobbles in place but never slides between sections
function updateTitleBg() {
  if (isMobile()) return;
  const el = getActiveTitleEl();
  if (el) titleWobble.updateBase(el, true);
}
// ─────────────────────────────────────────────────────────────────

function updateMenu() {
  items.forEach((item, i) => {
    item.classList.remove('active', 'near-1', 'near-2', 'near-3', 'near-4', 'near-5', 'near-6');
    const dist = i - activeIndex;
    if (dist === 0) {
      item.style.animation = 'none';
      item.offsetHeight;
      item.style.animation = '';
      item.classList.add('active');
    } else {
      item.classList.add(`near-${Math.min(Math.abs(dist), 6)}`);
    }
  });
}

function updateContent() {
  const activeItem    = items[activeIndex];
  const targetSection = activeItem.dataset.section;

  if (!isMobile()) {
    verticalText.textContent = activeItem.textContent.trim();
    verticalText.classList.remove('animate');
    verticalText.offsetHeight;
    verticalText.classList.add('animate');
  }

  sections.forEach(section => {
    section.classList.remove('active');
    if (section.dataset.section === targetSection) {
      section.classList.add('active');
    }
  });

  // Snap title bg to new section title
  requestAnimationFrame(() => requestAnimationFrame(updateTitleBg));
}
function scrollActiveIntoView() {
  if (!isMobile()) return;
  items[activeIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

// ── Circle ripple transition ──────────────────────────────────────
// origin: {x, y} in viewport px
// onMidpoint: called when screen is fully white (swap content here)
function playRipple(origin, onMidpoint) {
  if (transitioning) return false;
  transitioning = true;

  const maxR = Math.hypot(
    Math.max(origin.x, canvas.width  - origin.x),
    Math.max(origin.y, canvas.height - origin.y)
  );

  const PHASE_MS = 250;
  let startTime  = null;
  let phase      = 1; // 1 = expand, 2 = clear
  let midpointFired = false;

  function tick(ts) {
    if (!startTime) startTime = ts;
    const elapsed = ts - startTime;
    const t = Math.min(elapsed / PHASE_MS, 1);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (phase === 1) {
      // Expand white circle from origin
      const r = maxR * easeInOut(t);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(origin.x, origin.y, r, 0, Math.PI * 2);
      ctx.fill();

      if (t >= 1) {
        // Screen fully white — fire content swap once
        if (!midpointFired) {
          midpointFired = true;
          onMidpoint();
        }
        phase     = 2;
        startTime = ts;
      }
    } else {
      // Fill black, then punch growing hole from center
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const r = maxR * easeInOut(t);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(origin.x, origin.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      if (t >= 1) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        transitioning = false;
        return;
      }
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
  return true;
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
// ─────────────────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === 's') {
    activeIndex = Math.min(activeIndex + 1, items.length - 1);
    bgIndex     = activeIndex;
    updateMenu();
    updateContent();
    requestAnimationFrame(() => requestAnimationFrame(() => updateMenuBg(bgIndex)));
  } else if (e.key === 'ArrowUp' || e.key === 'w') {
    activeIndex = Math.max(activeIndex - 1, 0);
    bgIndex     = activeIndex;
    updateMenu();
    updateContent();
    requestAnimationFrame(() => requestAnimationFrame(() => updateMenuBg(bgIndex)));
  }});

// ── Mouse hover — moves rectangle only (desktop) ──────────────────
items.forEach((item, i) => {
  item.addEventListener('mouseenter', () => {
    if (isMobile()) return;
    bgIndex = i;
    requestAnimationFrame(() => requestAnimationFrame(() => updateMenuBg(bgIndex)));
  });

  // On mouse leave, snap rectangle back to active item
  item.addEventListener('mouseleave', () => {
    if (isMobile()) return;
    bgIndex = activeIndex;
    requestAnimationFrame(() => requestAnimationFrame(() => updateMenuBg(bgIndex)));
  });
});
// ── Click — opens content with ripple (desktop + mobile) ──────────
items.forEach((item, i) => {
  item.addEventListener('click', () => {
    if (i === activeIndex) return; // already active, no transition

    // Get click origin from item center
    const r = item.getBoundingClientRect();
    const origin = {
      x: r.left + r.width  / 2,
      y: r.top  + r.height / 2,
    };

    const fired = playRipple(origin, () => {
      // Swap content at the black peak
      activeIndex = i;
      bgIndex     = i;
      applyBgTheme(i);
      updateMenu();
      updateContent();
      scrollActiveIntoView();
      requestAnimationFrame(() => requestAnimationFrame(() => updateMenuBg(bgIndex, true)));
    });

    // Fallback if already transitioning
    if (!fired) {
      activeIndex = i;
      bgIndex     = i;
      updateMenu();
      updateContent();
      scrollActiveIntoView();
    }
  });
});

// ── Splash screen ─────────────────────────────────────────────────
(function runSplash() {
  const splash    = document.getElementById('splash');
  const splashImg = document.getElementById('splashImg');

  function startSplashTimer() {
    setTimeout(() => {
      const r = splashImg.getBoundingClientRect();
      const origin = {
        x: r.left + r.width  / 2,
        y: r.top  + r.height / 2,
      };

      const cvs = document.getElementById('transitionCanvas');
      const c   = cvs.getContext('2d');
      const maxR = Math.hypot(
        Math.max(origin.x, cvs.width  - origin.x),
        Math.max(origin.y, cvs.height - origin.y)
      );

      const PHASE_MS = 350;
      let startTime  = null;
      let phase      = 1;
      let splashRemoved = false;

      function easeIO(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

      function tick(ts) {
        if (!startTime) startTime = ts;
        const t = Math.min((ts - startTime) / PHASE_MS, 1);

        c.clearRect(0, 0, cvs.width, cvs.height);

        if (phase === 1) {
          const rad = maxR * easeIO(t);
          c.globalCompositeOperation = 'source-over';
          c.fillStyle = '#000';
          c.beginPath();
          c.arc(origin.x, origin.y, rad, 0, Math.PI * 2);
          c.fill();

          if (t >= 1) {
            if (!splashRemoved) {
              splashRemoved = true;
              splash.remove();
            }
            phase = 2;
            startTime = ts;
          }
        } else {
          c.globalCompositeOperation = 'source-over';
          c.fillStyle = '#000';
          c.fillRect(0, 0, cvs.width, cvs.height);

          const rad = maxR * easeIO(t);
          c.globalCompositeOperation = 'destination-out';
          c.beginPath();
          c.arc(origin.x, origin.y, rad, 0, Math.PI * 2);
          c.fill();
          c.globalCompositeOperation = 'source-over';

          if (t >= 1) {
            c.clearRect(0, 0, cvs.width, cvs.height);
            return;
          }
        }

        requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    }, 500);
  }

  // Wait for image to fully load before starting the timer
  if (splashImg.complete && splashImg.naturalWidth > 0) {
    startSplashTimer();
  } else {
    splashImg.onload  = startSplashTimer;
    splashImg.onerror = startSplashTimer; // fail gracefully
  }
})();
// ─────────────────────────────────────────────────────────────────
(function animateGrid() {
  let offset = 0;
  function tick() {
    offset += 0.3; // px per frame diagonal move
    const x = (offset % 40).toFixed(2);
    document.body.style.setProperty('--grid-x', x + 'px');
    document.body.style.setProperty('--grid-y', x + 'px');
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
// ─────────────────────────────────────────────────────────────────

// ── Gradient center drift ─────────────────────────────────────────
(function animateGradient() {
  const SPEED_X = 0.00035;
  const SPEED_Y = 0.00022;
  const RANGE_X = 12;
  const RANGE_Y = 8;
  const centers = {
    home:     { x: 70, y: 50 },
    bio:      { x: 60, y: 50 },
    projects: { x: 65, y: 50 },
    blog:     { x: 70, y: 50 },
  };
  let start = null;
  function tick(ts) {
    if (!start) start = ts;
    const elapsed = ts - start;
    const active = document.querySelector('.menu-item.active');
    const key = active ? active.dataset.bg : 'home';
    const c = centers[key] || centers.home;
    const gx = c.x + Math.sin(elapsed * SPEED_X) * RANGE_X;
    const gy = c.y + Math.sin(elapsed * SPEED_Y + 1.2) * RANGE_Y;
    document.body.style.setProperty('--gx', gx.toFixed(2) + '%');
    document.body.style.setProperty('--gy', gy.toFixed(2) + '%');
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
// ─────────────────────────────────────────────────────────────────
// ── Experience timeline interaction ───────────────────────────────
const expCols = document.querySelectorAll('.exp-col');
expCols.forEach((col) => {
  col.addEventListener('click', () => {
    expCols.forEach(c => c.classList.remove('active'));
    col.classList.add('active');
    col.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  });
});
// ─────────────────────────────────────────────────────────────────

document.querySelectorAll('.project-card[data-thumb]').forEach(card => {
  const url = card.dataset.thumb;
  const img = new Image();
  img.onload = () => {
    card.style.setProperty('--thumb', `url('${url}')`);
    card.classList.remove('img-loading');
  };
  img.onerror = () => {
    // Image failed — just remove shimmer, no bg shown
    card.classList.remove('img-loading');
  };
  img.src = url;
});
// ─────────────────────────────────────────────────────────────────
updateMenu();
updateContent();
applyBgTheme(activeIndex);

if (!isMobile()) {
  verticalText.classList.add('animate');
}

requestAnimationFrame(() => requestAnimationFrame(() => {
  updateMenuBg(activeIndex, true);
  if (!isMobile()) {
    updateTitleBg();
    titleWobble.start();
  }
  menuWobble.start();
}));
