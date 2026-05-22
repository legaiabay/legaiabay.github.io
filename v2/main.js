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
  if (window.setBgTheme) window.setBgTheme(bg);
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

// ── WebGL topographic background ─────────────────────────────────
(function initBgShader() {
  const canvas = document.getElementById('bgCanvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  const vert = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
  `;

  const frag = `
    precision mediump float;
    uniform float u_time;
    uniform vec2  u_res;
    uniform vec3  u_col1;
    uniform vec3  u_col2;

    // Hash
    vec2 hash2(vec2 p) {
      p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));
      return fract(sin(p)*43758.5453);
    }

    // Value noise
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f*f*(3.0-2.0*f);
      float a = dot(hash2(i),          vec2(1.0,0.0));
      float b = dot(hash2(i+vec2(1,0)),vec2(1.0,0.0));
      float c = dot(hash2(i+vec2(0,1)),vec2(1.0,0.0));
      float d = dot(hash2(i+vec2(1,1)),vec2(1.0,0.0));
      return mix(mix(a,b,u.x),mix(c,d,u.x),u.y)*0.5+0.5;
    }

    // FBM
    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i=0;i<5;i++) {
        v += a * noise(p);
        p  = p * 2.03 + vec2(1.7, 9.2);
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_res;
      uv.y = 1.0 - uv.y;
      float t = u_time * 0.08;

      // Domain warp
      vec2 q = vec2(fbm(uv*2.5 + vec2(0.0, t)),
                    fbm(uv*2.5 + vec2(5.2, t+1.3)));
      vec2 r = vec2(fbm(uv*2.0 + 4.0*q + vec2(1.7, 9.2) + 0.15*t),
                    fbm(uv*2.0 + 4.0*q + vec2(8.3, 2.8) + 0.12*t));
      float f = fbm(uv*1.5 + 4.0*r + t*0.05);

      // Banded contours — step thresholding
      float bands = 10.0;
      float stepped = floor(f * bands) / bands;
      float edge    = fract(f * bands);
      float line    = smoothstep(0.0, 0.02, edge) * smoothstep(1.0, 0.98, edge);

      vec3 col = mix(u_col2, u_col1, stepped) * line;
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER,   vert));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uRes  = gl.getUniformLocation(prog, 'u_res');
  const uCol1 = gl.getUniformLocation(prog, 'u_col1');
  const uCol2 = gl.getUniformLocation(prog, 'u_col2');

  // Per-section color pairs [foreground, background] — subtle dark tones
  const THEMES = {
    home:     [[0.0,  0.10, 0.28], [0.0,  0.01, 0.07]],
    bio:      [[0.18, 0.02, 0.26], [0.02, 0.00, 0.06]],
    projects: [[0.02, 0.18, 0.08], [0.00, 0.03, 0.01]],
    blog:     [[0.26, 0.09, 0.01], [0.04, 0.01, 0.00]],
  };

  // Smooth color lerp state
  let curC1 = [...THEMES.home[0]];
  let curC2 = [...THEMES.home[1]];
  let tgtC1 = [...THEMES.home[0]];
  let tgtC2 = [...THEMES.home[1]];

  // Called from applyBgTheme
  window.setBgTheme = function(key) {
    const t = THEMES[key] || THEMES.home;
    tgtC1 = [...t[0]];
    tgtC2 = [...t[1]];
  };

  function lerpArr(a, b, t) {
    return a.map((v, i) => v + (b[i] - v) * t);
  }

  let start = null;
  function tick(ts) {
    if (!start) start = ts;
    const elapsed = (ts - start) * 0.001;

    // Lerp colors
    curC1 = lerpArr(curC1, tgtC1, 0.04);
    curC2 = lerpArr(curC2, tgtC2, 0.04);

    gl.uniform1f(uTime, elapsed);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform3fv(uCol1, curC1);
    gl.uniform3fv(uCol2, curC2);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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
