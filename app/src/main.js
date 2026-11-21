// Editor wiring: photo uploads and samples, layout/size/caption/grade
// controls, per-panel drag-to-pan and zoom, thumbnail strip, PNG export.

import { EXPORT_SIZES, LAYOUTS, panelCount, panelRects, renderCover } from './cover.js';

const $ = (id) => document.getElementById(id);
const canvas = $('preview');

const state = {
  layout: 'solo',
  sizeKey: 'square',
  caption: 'Sunset Heist',
  sub: 'Vice nights · one last job',
  color: '#ffffff',
  pos: 'bottom',
  grade: 'sunset',
  grain: true,
  panels: [{ img: null, zoom: 1, ox: 0, oy: 0 }],
};

let photos = []; // {img, name, url}
let selectedPhoto = -1;
let selectedPanel = 0;
let drag = null;

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// When one photo fills every panel, stagger each panel's crop along the
// panel's long axis so the panels show different slices of the photo
// (top/middle/bottom of a strip, left/right of a tall panel) instead of the
// same centred crop repeated. The shift is capped so the photo still covers
// the panel at every offset.
function staggerCrops() {
  const n = state.panels.length;
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  state.panels.forEach((p, i) => {
    p.zoom = 1; p.ox = 0; p.oy = 0;
    const img = p.img;
    if (!img || n < 2) return;
    const r = rects[i];
    const scale = Math.max(r.w / img.naturalWidth, r.h / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const t = 1 - (2 * i) / (n - 1); // +1 on the first panel, -1 on the last
    const maxOx = Math.max(0, (dw - r.w) / (2 * r.w));
    const maxOy = Math.max(0, (dh - r.h) / (2 * r.h));
    if (r.w >= r.h) p.oy = maxOy * 0.95 * t;
    else p.ox = maxOx * 0.95 * t;
  });
}

function syncPanels() {
  const n = panelCount(state.layout);
  while (state.panels.length < n) state.panels.push({ img: null, zoom: 1, ox: 0, oy: 0 });
  state.panels.length = n;
  if (selectedPanel >= n) selectedPanel = 0;
}

function redraw() {
  const size = EXPORT_SIZES[state.sizeKey];
  canvas.width = size.w;
  canvas.height = size.h;
  renderCover(canvas, state);
}

function setStatus(text) {
  $('statusLine').textContent = text;
}

function markActive(row, attr, value) {
  row.querySelectorAll('.toggle').forEach((b) => {
    b.classList.toggle('active', b.dataset[attr] === value);
  });
}

function rebuildPanelRow() {
  const row = $('panelRow');
  row.innerHTML = '';
  for (let i = 0; i < panelCount(state.layout); i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn toggle small' + (i === selectedPanel ? ' active' : '');
    b.textContent = `Panel ${i + 1}`;
    b.addEventListener('click', () => { selectedPanel = i; rebuildPanelRow(); syncZoomUI(); });
    row.appendChild(b);
  }
}

function syncZoomUI() {
  const p = state.panels[selectedPanel];
  $('zoomSlider').value = String(p?.zoom ?? 1);
  $('zoomOut').textContent = `${(p?.zoom ?? 1).toFixed(2)}×`;
}

function rebuildStrip() {
  const strip = $('photoStrip');
  strip.innerHTML = '';
  if (photos.length === 0) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = 'No photos yet — upload your own, or try a built-in sample.';
    strip.appendChild(p);
    return;
  }
  photos.forEach((photo, i) => {
    const thumb = document.createElement('img');
    thumb.className = 'thumb' + (i === selectedPhoto ? ' selected' : '');
    thumb.src = photo.url;
    thumb.alt = photo.name;
    thumb.title = `${photo.name} — click to put it in panel ${selectedPanel + 1}`;
    thumb.addEventListener('click', () => {
      selectedPhoto = i;
      state.panels[selectedPanel].img = photo.img;
      rebuildStrip();
      redraw();
      setStatus(`Panel ${selectedPanel + 1} now shows “${photo.name}”.`);
    });
    strip.appendChild(thumb);
  });
}

async function addPhoto(img, name, url) {
  photos.push({ img, name, url });
  selectedPhoto = photos.length - 1;
  if (!state.panels.some((p) => p.img)) {
    state.panels.forEach((p) => { p.img = img; });
    staggerCrops();
  }
  rebuildStrip();
  redraw();
  setStatus(`Loaded “${name}”. Click a thumbnail to place it in the selected panel.`);
}

async function loadSample(name) {
  try {
    const img = await loadImage(`samples/${name}.jpg`);
    await addPhoto(img, name === 'pier' ? 'Pier sunset' : 'Boulevard', `samples/${name}.jpg`);
  } catch {
    setStatus(`Could not load the ${name} sample.`);
  }
}

// --- controls -------------------------------------------------------------

$('fileInput').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  for (const file of files) {
    try {
      const url = URL.createObjectURL(file);
      const img = await loadImage(url);
      await addPhoto(img, file.name, url);
    } catch {
      setStatus(`Could not read “${file.name}”.`);
    }
  }
  e.target.value = '';
});

$('samplePier').addEventListener('click', () => loadSample('pier'));
$('sampleBoulevard').addEventListener('click', () => loadSample('boulevard'));

$('fillAllBtn').addEventListener('click', () => {
  if (selectedPhoto < 0) { setStatus('Load a photo first, then fill all panels with it.'); return; }
  const img = photos[selectedPhoto].img;
  state.panels.forEach((p) => { p.img = img; });
  staggerCrops();
  redraw();
  setStatus(`All ${state.panels.length} panels now show “${photos[selectedPhoto].name}”.`);
});

$('clearPhotosBtn').addEventListener('click', () => {
  photos.forEach((p) => { if (p.url.startsWith('blob:')) URL.revokeObjectURL(p.url); });
  photos = [];
  selectedPhoto = -1;
  state.panels.forEach((p) => { p.img = null; p.zoom = 1; p.ox = 0; p.oy = 0; });
  rebuildStrip();
  syncZoomUI();
  redraw();
  setStatus('Photos cleared.');
});

$('layoutRow').addEventListener('click', (e) => {
  const b = e.target.closest('[data-layout]');
  if (!b) return;
  state.layout = b.dataset.layout;
  syncPanels();
  markActive($('layoutRow'), 'layout', state.layout);
  rebuildPanelRow();
  syncZoomUI();
  redraw();
});

$('sizeRow').addEventListener('click', (e) => {
  const b = e.target.closest('[data-size]');
  if (!b) return;
  state.sizeKey = b.dataset.size;
  markActive($('sizeRow'), 'size', state.sizeKey);
  redraw();
});

$('captionInput').addEventListener('input', (e) => { state.caption = e.target.value; redraw(); });
$('subInput').addEventListener('input', (e) => { state.sub = e.target.value; redraw(); });

$('colorRow').addEventListener('click', (e) => {
  const b = e.target.closest('[data-color]');
  if (!b) return;
  state.color = b.dataset.color;
  $('colorRow').querySelectorAll('.swatch').forEach((s) => s.classList.toggle('active', s === b));
  redraw();
});

$('posRow').addEventListener('click', (e) => {
  const b = e.target.closest('[data-pos]');
  if (!b) return;
  state.pos = b.dataset.pos;
  markActive($('posRow'), 'pos', state.pos);
  redraw();
});

$('gradeRow').addEventListener('click', (e) => {
  const b = e.target.closest('[data-grade]');
  if (!b) return;
  state.grade = b.dataset.grade;
  markActive($('gradeRow'), 'grade', state.grade);
  redraw();
});

$('grainToggle').addEventListener('change', (e) => { state.grain = e.target.checked; redraw(); });

$('zoomSlider').addEventListener('input', (e) => {
  const p = state.panels[selectedPanel];
  p.zoom = Number(e.target.value);
  $('zoomOut').textContent = `${p.zoom.toFixed(2)}×`;
  redraw();
});

$('resetCropBtn').addEventListener('click', () => {
  const p = state.panels[selectedPanel];
  p.zoom = 1; p.ox = 0; p.oy = 0;
  syncZoomUI();
  redraw();
});

// Drag to pan the photo inside the panel under the pointer.
function panelAt(clientX, clientY) {
  const box = canvas.getBoundingClientRect();
  const px = (clientX - box.left) / box.width * canvas.width;
  const py = (clientY - box.top) / box.height * canvas.height;
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  return rects.findIndex((r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h);
}

canvas.addEventListener('pointerdown', (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i < 0) return;
  selectedPanel = i;
  rebuildPanelRow();
  syncZoomUI();
  const box = canvas.getBoundingClientRect();
  drag = { panel: i, x: e.clientX, y: e.clientY, w: box.width, h: box.height };
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = state.panels[drag.panel];
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  const r = rects[drag.panel];
  p.ox += (e.clientX - drag.x) / drag.w * canvas.width / r.w;
  p.oy += (e.clientY - drag.y) / drag.h * canvas.height / r.h;
  p.ox = Math.max(-1.2, Math.min(1.2, p.ox));
  p.oy = Math.max(-1.2, Math.min(1.2, p.oy));
  drag.x = e.clientX;
  drag.y = e.clientY;
  redraw();
});

canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('pointercancel', () => { drag = null; });

// --- export ---------------------------------------------------------------

function renderExportCanvas() {
  const size = EXPORT_SIZES[state.sizeKey];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  renderCover(off, state);
  return off;
}

$('exportBtn').addEventListener('click', () => {
  const off = renderExportCanvas();
  const size = EXPORT_SIZES[state.sizeKey];
  off.toBlob((blob) => {
    if (!blob) { setStatus('Export failed — try again.'); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setStatus(`Exported ${size.label} PNG — check your downloads.`);
  }, 'image/png');
});

// --- app API used by the deterministic screenshot scenes -------------------

window.__app = {
  state,
  loadImage,
  async loadSampleIntoPanels(name, layout, caption, sub) {
    const img = await loadImage(`samples/${name}.jpg`);
    state.layout = layout;
    state.caption = caption;
    if (sub !== undefined) state.sub = sub;
    syncPanels();
    state.panels.forEach((p) => { p.img = img; p.zoom = 1; p.ox = 0; });
    staggerCrops();
    photos = [{ img, name, url: `samples/${name}.jpg` }];
    selectedPhoto = 0;
    $('captionInput').value = caption;
    $('subInput').value = state.sub;
    markActive($('layoutRow'), 'layout', layout);
    rebuildPanelRow();
    rebuildStrip();
    syncZoomUI();
    redraw();
  },
  setSize(sizeKey) {
    state.sizeKey = sizeKey;
    markActive($('sizeRow'), 'size', sizeKey);
    redraw();
  },
  exportPNGDataURL() {
    return renderExportCanvas().toDataURL('image/png');
  },
};

// --- boot -----------------------------------------------------------------

syncPanels();
rebuildPanelRow();
rebuildStrip();
syncZoomUI();
redraw();
