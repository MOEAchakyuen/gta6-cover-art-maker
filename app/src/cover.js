// Cover renderer: multi-panel poster layouts, Vice City sunset/neon colour
// grades, and bold outlined caption lettering, all drawn on one canvas.
// Pure canvas 2D, no fonts or images loaded from anywhere else.

export const EXPORT_SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 x 1350' },
  wide: { w: 1920, h: 1080, label: '1920 x 1080' },
};

export const LAYOUTS = ['solo', 'duo', 'trio', 'quad'];

export function panelCount(layout) {
  return layout === 'solo' ? 1 : layout === 'duo' ? 2 : layout === 'trio' ? 3 : 4;
}

// Panel rectangles for a layout, in canvas pixels. Gutters stay proportional.
export function panelRects(layout, w, h) {
  const g = Math.max(6, Math.round(w * 0.008));
  const m = Math.round(w * 0.012);
  const inner = (x, y, pw, ph) => ({ x, y, w: pw, h: ph });
  if (layout === 'solo') return [inner(m, m, w - 2 * m, h - 2 * m)];
  if (layout === 'duo') {
    const left = Math.round((w - 2 * m - g) * 0.62);
    return [
      inner(m, m, left, h - 2 * m),
      inner(m + left + g, m, w - 2 * m - left - g, h - 2 * m),
    ];
  }
  if (layout === 'trio') {
    const stripH = Math.round((h - 2 * m - 2 * g) / 3);
    return [0, 1, 2].map((i) => inner(m, m + i * (stripH + g), w - 2 * m, stripH));
  }
  const cw = Math.round((w - 2 * m - g) / 2);
  const ch = Math.round((h - 2 * m - g) / 2);
  return [
    inner(m, m, cw, ch),
    inner(m + cw + g, m, cw, ch),
    inner(m, m + ch + g, cw, ch),
    inner(m + cw + g, m + ch + g, cw, ch),
  ];
}

// Cover-fit draw of one photo into a panel rect, with a crop {zoom, ox, oy}.
// ox/oy are fractions of the panel size, zoom 1..3.
export function drawPanelPhoto(ctx, img, rect, crop) {
  const zoom = crop?.zoom ?? 1;
  const ox = crop?.ox ?? 0;
  const oy = crop?.oy ?? 0;
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const dw = img.naturalWidth * base * zoom;
  const dh = img.naturalHeight * base * zoom;
  const dx = rect.x + (rect.w - dw) / 2 + ox * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + oy * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function emptyPanel(ctx, rect, i) {
  const shades = ['#2a1544', '#3a1a4d', '#1e2a55', '#4d1a2e'];
  ctx.fillStyle = shades[i % shades.length];
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = Math.max(2, rect.w * 0.004);
  ctx.setLineDash([rect.w * 0.02, rect.w * 0.015]);
  ctx.strokeRect(rect.x + 8, rect.y + 8, rect.w - 16, rect.h - 16);
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = `700 ${Math.max(14, Math.round(rect.w * 0.03))}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`PANEL ${i + 1}`, rect.x + rect.w / 2, rect.y + rect.h / 2);
}

// Deterministic film grain: a seeded noise tile, tiled over the canvas.
let grainTile = null;
function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeGrainTile() {
  const tile = document.createElement('canvas');
  tile.width = 160; tile.height = 160;
  const c = tile.getContext('2d');
  const img = c.createImageData(160, 160);
  const rnd = seededRandom(20261121);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  return tile;
}
function applyGrain(ctx, w, h) {
  if (!grainTile) grainTile = makeGrainTile();
  const pattern = ctx.createPattern(grainTile, 'repeat');
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// Sunset / neon / duotone colour grades, painted over the whole cover.
function applyGrade(ctx, w, h, grade) {
  if (grade === 'none') return;
  const grad = ctx.createLinearGradient(0, 0, w * 0.35, h);
  if (grade === 'sunset') {
    grad.addColorStop(0, 'rgba(255, 154, 60, 0.55)');
    grad.addColorStop(0.5, 'rgba(255, 94, 138, 0.5)');
    grad.addColorStop(1, 'rgba(123, 47, 247, 0.55)');
    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.68;
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h); ctx.restore();
    const warm = ctx.createLinearGradient(0, h * 0.4, 0, h);
    warm.addColorStop(0, 'rgba(255, 120, 60, 0)');
    warm.addColorStop(1, 'rgba(255, 60, 110, 0.45)');
    ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = warm;
    ctx.fillRect(0, 0, w, h); ctx.restore();
  } else if (grade === 'neon') {
    grad.addColorStop(0, 'rgba(55, 230, 255, 0.6)');
    grad.addColorStop(0.5, 'rgba(255, 79, 163, 0.45)');
    grad.addColorStop(1, 'rgba(120, 60, 255, 0.6)');
    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.6;
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.12;
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h); ctx.restore();
  } else if (grade === 'duotone') {
    grad.addColorStop(0, 'rgba(255, 212, 0, 0.5)');
    grad.addColorStop(1, 'rgba(90, 20, 160, 0.6)');
    ctx.save(); ctx.globalCompositeOperation = 'color'; ctx.globalAlpha = 0.85;
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.35;
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h); ctx.restore();
  }
  // Vignette: darken the corners so the caption pops.
  const vig = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(10, 2, 20, 0.5)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

// Big condensed heavy capitals: thick dark outline, hard drop shadow.
function fitFont(ctx, text, weight, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${weight} ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size = Math.floor(size * 0.94);
    ctx.font = `${weight} ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  }
  return size;
}

function drawCaption(ctx, w, h, opts) {
  const main = (opts.caption || '').trim().toUpperCase();
  const sub = (opts.sub || '').trim();
  const color = opts.color || '#ffffff';
  const pos = opts.pos || 'bottom';
  if (!main && !sub) return;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const bandH = Math.round(h * (pos === 'top' ? 0.16 : 0.2));
  const bandY = pos === 'top' ? 0 : h - bandH;
  if (pos === 'top') {
    ctx.fillStyle = 'rgba(12, 4, 24, 0.88)';
    ctx.fillRect(0, 0, w, bandH);
    ctx.fillStyle = color;
    ctx.fillRect(0, bandH - Math.max(3, h * 0.004), w, Math.max(3, h * 0.004));
  } else {
    const shade = ctx.createLinearGradient(0, h - bandH * 1.6, 0, h);
    shade.addColorStop(0, 'rgba(10, 2, 20, 0)');
    shade.addColorStop(1, 'rgba(10, 2, 20, 0.72)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, h - bandH * 1.6, w, bandH * 1.6);
  }
  if (main) {
    const size = fitFont(ctx, main, 900, w * 0.92, Math.round(h * 0.115));
    const y = pos === 'top' ? bandH * 0.62 : h - h * 0.045 - (sub ? size * 0.42 : 0);
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.lineWidth = Math.max(3, size * 0.16);
    ctx.strokeStyle = '#160818';
    ctx.shadowColor = 'rgba(255, 79, 163, 0.55)';
    ctx.shadowBlur = size * 0.14;
    ctx.shadowOffsetY = size * 0.05;
    try { ctx.letterSpacing = `${Math.round(size * 0.03)}px`; } catch { /* older canvas */ }
    ctx.strokeText(main, w / 2, y);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = size * 0.1;
    ctx.shadowOffsetY = size * 0.06;
    ctx.fillStyle = color;
    ctx.fillText(main, w / 2, y);
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  if (sub) {
    const size = fitFont(ctx, sub.toUpperCase(), 700, w * 0.86, Math.round(h * 0.032));
    const y = pos === 'top' ? bandH * 0.92 : h - h * 0.035;
    ctx.font = `700 ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(size * 0.22)}px`; } catch { /* older canvas */ }
    ctx.lineWidth = Math.max(2, size * 0.14);
    ctx.strokeStyle = 'rgba(10, 2, 20, 0.9)';
    ctx.strokeText(sub.toUpperCase(), w / 2, y);
    ctx.fillStyle = '#ffe9f4';
    ctx.fillText(sub.toUpperCase(), w / 2, y);
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }
  ctx.restore();
}

// Renders the whole cover onto `canvas` (its own width/height are the pixels).
// state: { layout, caption, sub, color, pos, grade, grain, panels: [{img, zoom, ox, oy}] }
export function renderCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = '#12081f';
  ctx.fillRect(0, 0, w, h);
  const rects = panelRects(state.layout, w, h);
  rects.forEach((rect, i) => {
    const panel = state.panels[i];
    if (panel && panel.img) drawPanelPhoto(ctx, panel.img, rect, panel);
    else emptyPanel(ctx, rect, i);
  });
  applyGrade(ctx, w, h, state.grade);
  if (state.grain) applyGrain(ctx, w, h);
  drawCaption(ctx, w, h, state);
  return canvas;
}
