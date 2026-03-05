/**
 * Pixel Studio — Canvas Edition
 * All rendering via <canvas> for performance. No DOM pixels.
 */
(() => {

  // ══════════════════════════════════════════════════════════════
  // ── PAINTING REGISTRY ────────────────────────────────────────
  //
  // To add a new painting:
  //   1. Drop its .js file into this folder (it must declare a
  //      global const, e.g. const MY_PAINTING_64 = [...])
  //   2. Add a <script src="my_painting.js"></script> in index.html
  //      (before the <script src="app.js"> line)
  //   3. Add one entry in the PAINTINGS array below — that's it!
  //
  // Entry fields:
  //   dataVar  – the global variable name from the .js file
  //   title    – painting name shown in the info panel
  //   artist   – artist shown in the info panel
  //   year     – date/year shown in the info panel
  //   gridW    – pixel-art grid width  (usually 64)
  //   gridH    – pixel-art grid height (usually 64)
  // ══════════════════════════════════════════════════════════════
  const PAINTINGS = [
    {
      dataVar : 'STARRY_NIGHT_64',
      title   : 'De Sterrennacht',
      artist  : 'Vincent van Gogh',
      year    : 'c. 1889',
      gridW   : 64,
      gridH   : 64,
    },
    {
      dataVar : 'MONA_LISA_64',
      title   : 'Mona Lisa',
      artist  : 'Leonardo da Vinci',
      year    : 'c. 1503\u20131519',
      gridW   : 64,
      gridH   : 64,
    },
    {
      dataVar : 'GIRL_WITH_PEARL_EARRING_64',
      title   : 'Girl with pearl earring',
      artist  : 'Johannes Vermeer',
      year    : 'c. 1665',
      gridW   : 64,
      gridH   : 64,
    },
    {
      dataVar : 'THE_SCREAM_64',
      title   : 'The Scream',
      artist  : 'Edvard Munch',
      year    : 'c. 1893',
      gridW   : 64,
      gridH   : 64,
    },
    // ── Add more paintings here ─────────────────────────────────
    // {
    //   dataVar : 'MY_PAINTING_64',
    //   title   : 'My Painting',
    //   artist  : 'The Artist',
    //   year    : '2025',
    //   gridW   : 64,
    //   gridH   : 64,
    // },
  ];
  // ══════════════════════════════════════════════════════════════

  // ── State ────────────────────────────────────────────────────
  let W = 64, H = 64;
  let CELL = 10;
  let pixels = [];
  let tool = 'draw';
  let color = '#c8a273';
  let isDown = false;
  let showGrid = true;
  let undoStack = [];
  let lastCell = -1;
  let currentPainting = null;
  let currentPaintingIndex = Number(localStorage.getItem("paintingIndex")) || 0;

  // ── Palette ──────────────────────────────────────────────────
  const BASE_PALETTE = [
    '#1a1612','#3d2e1e','#5c3d1e','#8b5e3c','#c8a273',
    '#e8d5b0','#f5f0e8','#fff8f0','#b5460f','#d4622a',
    '#e89030','#c8a855','#6b8c42','#3d6b5c','#2d4a6e',
    '#4a3d6b','#6b2d4a','#2d2d2d','#5a5a5a','#a0a0a0',
  ];

  // ── DOM refs ─────────────────────────────────────────────────
  const mainCanvas   = document.getElementById('mainCanvas');
  const gridCanvas   = document.getElementById('gridCanvas');
  const cursorCanvas = document.getElementById('cursorCanvas');
  const mainCtx      = mainCanvas.getContext('2d');
  const gridCtx      = gridCanvas.getContext('2d');
  const cursorCtx    = cursorCanvas.getContext('2d');

  const frame           = document.querySelector('.canvas-frame');
  const paletteGrid     = document.getElementById('paletteGrid');
  const paintingPalette = document.getElementById('paintingPalette');
  const colorSwatch     = document.getElementById('colorSwatch');
  const colorHexEl      = document.getElementById('colorHex');
  const colorPicker     = document.getElementById('colorPicker');
  const stCoord         = document.getElementById('stCoord');
  const stTool          = document.getElementById('stTool');
  const stSize          = document.getElementById('stSize');
  const stColor         = document.getElementById('stColor');
  const infoGrid        = document.getElementById('infoGrid');
  const infoColors      = document.getElementById('infoColors');
  const infoTitle       = document.getElementById('infoTitle');
  const infoArtist      = document.getElementById('infoArtist');
  const infoYear        = document.getElementById('infoYear');
  const btnLoad         = document.getElementById('btnLoad');

  // ── Init ─────────────────────────────────────────────────────
  function init() {
    const available =
      PAINTINGS.filter(p => typeof window[p.dataVar] !== 'undefined');
  
    if (available.length === 0) {
      setupSize(W, H);
      redrawAll();
    } else {
      const pick = available[currentPaintingIndex];
  
      currentPainting = pick;
      setupSize(pick.gridW, pick.gridH);
      loadPainting(pick);
  
      // move to next painting
      currentPaintingIndex =
        (currentPaintingIndex + 1) % available.length;
  
      // SAVE for next reload
      localStorage.setItem(
        "paintingIndex",
        currentPaintingIndex
      );
    }
  
    buildPalette();
    buildPaintingPalette();
    setColor(color);
    bindEvents();
  }

  // ── Load a painting from the registry ────────────────────────
  function loadPainting(entry) {
    const data = window[entry.dataVar];
    if (!data) return;

    currentPainting = entry;

    if (W !== entry.gridW || H !== entry.gridH) {
      setupSize(entry.gridW, entry.gridH);
    }

    pixels = [...data];
    undoStack = [];
    redrawAll();

    // Update info panel with this painting's details
    const unique = new Set(pixels).size;
    infoColors.textContent = unique;
    infoTitle.textContent  = entry.title;
    infoArtist.textContent = entry.artist;
    infoYear.textContent   = entry.year;

    buildPaintingPalette();
    updateLoadButton();
  }

  // ── Keep the load button label pointing at the NEXT painting ─
  function updateLoadButton() {
    const available = PAINTINGS.filter(p => typeof window[p.dataVar] !== 'undefined');
    if (available.length === 0) { btnLoad.textContent = '\u27f3 Load'; return; }
    if (available.length === 1) { btnLoad.textContent = `\u27f3 ${available[0].title}`; return; }
    const idx  = available.indexOf(currentPainting);
    const next = available[(idx + 1) % available.length];
    btnLoad.textContent = `\u27f3 ${next.title}`;
  }

  // ── Cycle to the next available painting ─────────────────────
  function cycleNextPainting() {
    const available = PAINTINGS.filter(p => typeof window[p.dataVar] !== 'undefined');
    if (available.length === 0) return;
    const idx  = available.indexOf(currentPainting);
    const next = available[(idx + 1) % available.length];
    document.querySelectorAll('.sz').forEach(b =>
      b.classList.toggle('active', b.dataset.size === String(next.gridW)));
    loadPainting(next);
  }

  // ── Canvas sizing ────────────────────────────────────────────
  function setupSize(w, h) {
    W = w; H = h;
    const avW = window.innerWidth  - 200 - 180 - 48;
    const avH = window.innerHeight - 36;
    CELL = Math.max(2, Math.floor(Math.min(avW / W, avH / H)));

    const cw = W * CELL, ch = H * CELL;
    [mainCanvas, gridCanvas, cursorCanvas].forEach(c => {
      c.width  = cw;
      c.height = ch;
      c.style.width  = cw + 'px';
      c.style.height = ch + 'px';
      c.style.position = 'absolute';
      c.style.top = '0';
      c.style.left = '0';
    });
    mainCanvas.style.position = 'relative';
    frame.style.width  = cw + 'px';
    frame.style.height = ch + 'px';

    pixels = new Array(W * H).fill('');
    undoStack = [];
    stSize.textContent = `${W}\xd7${H}`;
    infoGrid.textContent = `${W} \xd7 ${H}`;
  }

  // ── Rendering ────────────────────────────────────────────────
  function redrawAll() { redrawMain(); redrawGrid(); }

  function redrawMain() {
    const imgData = mainCtx.createImageData(W * CELL, H * CELL);
    const data = imgData.data;
    const cache = new Map();

    function hexToRgb(hex) {
      if (cache.has(hex)) return cache.get(hex);
      const v = parseInt(hex.slice(1), 16);
      const rgb = [(v >> 16) & 255, (v >> 8) & 255, v & 255];
      cache.set(hex, rgb);
      return rgb;
    }

    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        const c = pixels[py * W + px];
        const [r, g, b] = c ? hexToRgb(c) : [255, 255, 255];
        for (let dy = 0; dy < CELL; dy++) {
          for (let dx = 0; dx < CELL; dx++) {
            const i = ((py * CELL + dy) * W * CELL + (px * CELL + dx)) * 4;
            data[i]=r; data[i+1]=g; data[i+2]=b; data[i+3]=255;
          }
        }
      }
    }
    mainCtx.putImageData(imgData, 0, 0);
  }

  function redrawGrid() {
    gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
    if (!showGrid || CELL < 4) return;
    gridCtx.strokeStyle = 'rgba(0,0,0,0.12)';
    gridCtx.lineWidth = 0.5;
    for (let x = 0; x <= W; x++) {
      gridCtx.beginPath(); gridCtx.moveTo(x*CELL, 0); gridCtx.lineTo(x*CELL, H*CELL); gridCtx.stroke();
    }
    for (let y = 0; y <= H; y++) {
      gridCtx.beginPath(); gridCtx.moveTo(0, y*CELL); gridCtx.lineTo(W*CELL, y*CELL); gridCtx.stroke();
    }
  }

  function paintCell(col, row) {
    const i = row * W + col;
    if (tool === 'draw') {
      if (pixels[i] === color) return;
      pixels[i] = color;
    } else if (tool === 'erase') {
      if (!pixels[i]) return;
      pixels[i] = '';
    }
    const c = pixels[i];
    mainCtx.fillStyle = c || '#ffffff';
    mainCtx.fillRect(col * CELL, row * CELL, CELL, CELL);
    if (showGrid && CELL >= 4) {
      gridCtx.strokeStyle = 'rgba(0,0,0,0.12)';
      gridCtx.lineWidth = 0.5;
      gridCtx.beginPath(); gridCtx.moveTo((col+1)*CELL, row*CELL); gridCtx.lineTo((col+1)*CELL, (row+1)*CELL); gridCtx.stroke();
      gridCtx.beginPath(); gridCtx.moveTo(col*CELL, (row+1)*CELL); gridCtx.lineTo((col+1)*CELL, (row+1)*CELL); gridCtx.stroke();
    }
  }

  // ── Cursor ───────────────────────────────────────────────────
  function drawCursor(col, row) {
    cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
    if (col < 0 || col >= W || row < 0 || row >= H) return;
    cursorCtx.strokeStyle = 'rgba(255,255,255,0.85)';
    cursorCtx.lineWidth = 1.5;
    cursorCtx.strokeRect(col*CELL+0.5, row*CELL+0.5, CELL-1, CELL-1);
  }

  // ── Flood fill ───────────────────────────────────────────────
  function floodFill(startIdx, from, to) {
    if (from === to) return;
    const stack = [startIdx];
    const visited = new Uint8Array(W * H);
    while (stack.length) {
      const idx = stack.pop();
      if (visited[idx] || pixels[idx] !== from) continue;
      visited[idx] = 1;
      pixels[idx] = to;
      const r = Math.floor(idx / W), c = idx % W;
      if (c > 0)   stack.push(idx - 1);
      if (c < W-1) stack.push(idx + 1);
      if (r > 0)   stack.push(idx - W);
      if (r < H-1) stack.push(idx + W);
    }
    redrawAll();
  }

  // ── Undo ─────────────────────────────────────────────────────
  function saveUndo() { undoStack.push(pixels.slice()); if (undoStack.length > 50) undoStack.shift(); }
  function undo() { if (!undoStack.length) return; pixels = undoStack.pop(); redrawAll(); }

  // ── Color ────────────────────────────────────────────────────
  function setColor(hex) {
    color = hex.toLowerCase();
    colorSwatch.style.background = color;
    colorHexEl.textContent = color;
    colorPicker.value = color;
    stColor.style.background = color;
    updatePaletteActive();
  }

  // ── Palette ──────────────────────────────────────────────────
  function buildPalette() {
    paletteGrid.innerHTML = '';
    BASE_PALETTE.forEach(hex => {
      const s = document.createElement('div');
      s.className = 'pal-swatch'; s.style.background = hex; s.title = hex;
      s.addEventListener('click', () => setColor(hex));
      paletteGrid.appendChild(s);
    });
  }

  function buildPaintingPalette() {
    paintingPalette.innerHTML = '';
    const freq = {};
    for (const c of pixels) if (c) freq[c] = (freq[c] || 0) + 1;
    const sorted = Object.entries(freq).sort((a,b) => b[1]-a[1]).map(x => x[0]);
    sorted.forEach(hex => {
      const s = document.createElement('div');
      s.className = 'starry-swatch'; s.style.background = hex; s.title = hex;
      s.addEventListener('click', () => setColor(hex));
      paintingPalette.appendChild(s);
    });
  }

  function updatePaletteActive() {
    document.querySelectorAll('.pal-swatch, .starry-swatch').forEach(s =>
      s.classList.toggle('active', s.title === color));
  }

  // ── Tool ─────────────────────────────────────────────────────
  function setTool(t) {
    tool = t;
    document.querySelectorAll('.tool').forEach(b => b.classList.toggle('active', b.dataset.tool === t));
    stTool.textContent = t.toUpperCase();
  }

  // ── Events ───────────────────────────────────────────────────
  function getCellFromEvent(e) {
    const rect = cursorCanvas.getBoundingClientRect();
    return [Math.floor((e.clientX - rect.left) / CELL), Math.floor((e.clientY - rect.top) / CELL)];
  }

  function handleDown(e) {
    if (e.preventDefault) e.preventDefault();
    isDown = true; lastCell = -1;
    const [col, row] = getCellFromEvent(e);
    if (col < 0 || col >= W || row < 0 || row >= H) return;
    const idx = row * W + col;
    if (tool === 'eyedrop') { setColor(pixels[idx] || '#ffffff'); setTool('draw'); return; }
    if (tool === 'fill')    { saveUndo(); floodFill(idx, pixels[idx], color); return; }
    saveUndo(); lastCell = idx; paintCell(col, row);
  }

  function handleMove(e) {
    const [col, row] = getCellFromEvent(e);
    drawCursor(col, row);
    stCoord.textContent = (col >= 0 && col < W && row >= 0 && row < H) ? `${col+1}, ${row+1}` : '\u2014';
    if (!isDown) return;
    if (col < 0 || col >= W || row < 0 || row >= H) return;
    if (tool !== 'draw' && tool !== 'erase') return;
    const idx = row * W + col;
    if (idx === lastCell) return;
    lastCell = idx; paintCell(col, row);
  }

  function bindEvents() {
    cursorCanvas.addEventListener('mousedown', handleDown);
    cursorCanvas.addEventListener('mousemove', handleMove);
    cursorCanvas.addEventListener('mouseleave', () => {
      cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
      stCoord.textContent = '\u2014';
    });
    document.addEventListener('mouseup', () => { isDown = false; });

    cursorCanvas.addEventListener('touchstart', e => { e.preventDefault(); handleDown(e.touches[0], e); }, { passive: false });
    cursorCanvas.addEventListener('touchmove',  e => { e.preventDefault(); handleMove(e.touches[0], e); }, { passive: false });
    document.addEventListener('touchend', () => { isDown = false; });

    colorPicker.addEventListener('input', e => setColor(e.target.value));

    document.querySelectorAll('.tool').forEach(btn =>
      btn.addEventListener('click', () => setTool(btn.dataset.tool)));

    document.querySelectorAll('.sz').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sz').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const s = parseInt(btn.dataset.size);
        setupSize(s, s);
        redrawAll();
        if (s === 64 && currentPainting) loadPainting(currentPainting);
      });
    });

    // Load / cycle button — walks through the PAINTINGS registry
    btnLoad.addEventListener('click', () => {
      document.querySelectorAll('.sz').forEach(b =>
        b.classList.toggle('active', b.dataset.size === '64'));
      cycleNextPainting();
    });

    document.getElementById('btnGrid').addEventListener('click', () => { showGrid = !showGrid; redrawGrid(); });
    document.getElementById('btnUndo').addEventListener('click', undo);
    document.getElementById('btnClear').addEventListener('click', () => { saveUndo(); pixels.fill(''); redrawAll(); });
    document.getElementById('btnExport').addEventListener('click', exportPNG);

    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT') return;
      const map = { d:'draw', e:'erase', f:'fill', i:'eyedrop' };
      if (map[e.key]) setTool(map[e.key]);
      if (e.key === 'g' || e.key === 'G') { showGrid = !showGrid; redrawGrid(); }
      if (e.key === 'l' || e.key === 'L') cycleNextPainting();
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
    });

    window.addEventListener('resize', () => {
      const [oldW, oldH, savedPixels] = [W, H, pixels.slice()];
      setupSize(oldW, oldH);
      pixels = savedPixels;
      redrawAll();
    });
  }

  // ── Export ───────────────────────────────────────────────────
  function exportPNG() {
    const scale = Math.max(1, Math.floor(1024 / W));
    const c = document.createElement('canvas');
    c.width = W * scale; c.height = H * scale;
    const ctx = c.getContext('2d');
    pixels.forEach((hex, i) => {
      const row = Math.floor(i / W), col = i % W;
      ctx.fillStyle = hex || '#ffffff';
      ctx.fillRect(col * scale, row * scale, scale, scale);
    });
    const link = document.createElement('a');
    link.download = `pixel-studio-${W}x${H}.png`;
    link.href = c.toDataURL('image/png');
    link.click();
  }

  // ── Go ───────────────────────────────────────────────────────
  init();
})();
