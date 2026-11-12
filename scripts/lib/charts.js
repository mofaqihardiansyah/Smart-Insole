/**
 * charts.js — SVG primitives for the evidence pack.
 *
 * No chart library: the repository has no plotting dependency and these charts
 * only need bars, lines, dots, a confusion matrix, and a heatmap. Every
 * function returns a complete `<svg>` string, so the HTML report can inline it
 * and `rsvg-convert` can turn the same string into a PNG for Word.
 */

const PALETTE = {
  ink: '#1f2937',
  muted: '#6b7280',
  grid: '#e5e7eb',
  axis: '#9ca3af',
  panel: '#f8fafc',
  safe: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  accent: '#2563eb',
  violet: '#7c3aed',
  slate: '#334155',
};

const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

/* ------------------------------------------------------------------ text --- */

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function txt(x, y, value, options = {}) {
  const {
    size = 12,
    anchor = 'start',
    weight = 400,
    fill = PALETTE.ink,
    rotate = 0,
    opacity = 1,
  } = options;
  const transform = rotate ? ` transform="rotate(${rotate} ${x} ${y})"` : '';
  const alpha = opacity === 1 ? '' : ` opacity="${opacity}"`;
  return (
    `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" ` +
    `font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${transform}${alpha}>` +
    `${esc(value)}</text>`
  );
}

function line(x1, y1, x2, y2, stroke, width = 1, dash = '') {
  const style = dash ? ` stroke-dasharray="${dash}"` : '';
  return (
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" ` +
    `stroke-width="${width}"${style}/>`
  );
}

function rect(x, y, width, height, fill, options = {}) {
  const { stroke = 'none', radius = 0, opacity = 1 } = options;
  return (
    `<rect x="${x}" y="${y}" width="${Math.max(0, width)}" height="${Math.max(0, height)}" ` +
    `fill="${fill}" stroke="${stroke}" rx="${radius}" opacity="${opacity}"/>`
  );
}

function circle(cx, cy, r, fill, options = {}) {
  const { stroke = 'none', strokeWidth = 1, opacity = 1 } = options;
  return (
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" ` +
    `stroke-width="${strokeWidth}" opacity="${opacity}"/>`
  );
}

/* ------------------------------------------------------------------ axes --- */

function linearTicks(min, max, count = 5) {
  const span = max - min || 1;
  const rough = span / count;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  const normalised = rough / magnitude;
  let step;
  if (normalised < 1.5) step = magnitude;
  else if (normalised < 3) step = 2 * magnitude;
  else if (normalised < 7) step = 5 * magnitude;
  else step = 10 * magnitude;
  const out = [];
  for (let value = Math.ceil(min / step) * step; value <= max + 1e-9; value += step) {
    out.push(Number(value.toFixed(6)));
  }
  return out;
}

function logTicks(max) {
  const out = [];
  for (let value = 1; value <= max; value *= 10) out.push(value);
  if (out[out.length - 1] !== 1) out.push(0);
  return out;
}

function logScale(value, max) {
  return Math.log10(value + 1) / Math.log10(max + 1);
}

function svgDoc(width, height, title, body, description = '') {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" ` +
    `width="${width}" height="${height}" role="img" aria-label="${esc(title)}">` +
    `<title>${esc(title)}</title>` +
    (description ? `<desc>${esc(description)}</desc>` : '') +
    `<rect width="${width}" height="${height}" fill="#ffffff"/>` +
    body +
    '</svg>'
  );
}

function chartTitle(title, subtitle, x, y) {
  let out = txt(x, y, title, { size: 16, weight: 600 });
  if (subtitle) out += txt(x, y + 18, subtitle, { size: 12, fill: PALETTE.muted });
  return out;
}

function legend(items, x, y) {
  let out = '';
  let cursor = x;
  for (const item of items) {
    out += circle(cursor + 5, y - 4, 5, item.color, {
      stroke: item.hollow ? item.color : 'none',
      strokeWidth: 1.5,
    });
    if (item.hollow) out += circle(cursor + 5, y - 4, 2.5, '#ffffff');
    out += txt(cursor + 15, y, item.label, { size: 11, fill: PALETTE.muted });
    cursor += 18 + item.label.length * 6.2;
  }
  return out;
}

/* -------------------------------------------------------------- histogram --- */

/**
 * Bars over a continuous x axis, with optional threshold markers and a log y.
 * `bins` is [{x0, x1, count}]; `markers` is [{x, label, color}].
 */
function histogram({
  title,
  subtitle = '',
  bins,
  markers = [],
  yLog = false,
  width = 880,
  height = 400,
  xLabel = '',
  yLabel = '',
  note = '',
}) {
  const margin = { l: 66, r: 28, t: 70, b: 66 };
  const plotW = width - margin.l - margin.r;
  const plotH = height - margin.t - margin.b;
  const xMin = bins[0].x0;
  const xMax = bins[bins.length - 1].x1;
  const counts = bins.map((b) => b.count);
  const yMaxRaw = Math.max(...counts);
  const yMax = yLog ? Math.max(10, yMaxRaw) : yMaxRaw * 1.15 || 1;

  const x = (value) => margin.l + ((value - xMin) / (xMax - xMin)) * plotW;
  const y = (value) => {
    if (!yLog) return margin.t + plotH - (value / yMax) * plotH;
    return margin.t + plotH - logScale(value, yMax) * plotH;
  };

  const barW = plotW / bins.length;
  let body = chartTitle(title, subtitle, margin.l, 30);
  body += rect(margin.l, margin.t, plotW, plotH, PALETTE.panel, { stroke: PALETTE.grid });

  for (const bin of bins) {
    if (bin.count <= 0) continue;
    const top = y(bin.count);
    const base = y(0);
    body += rect(x(bin.x0) + 0.6, top, Math.max(1, barW - 1.2), base - top, PALETTE.accent, {
      opacity: 0.82,
    });
  }

  const xTicks = linearTicks(xMin, xMax, 6);
  for (const tick of xTicks) {
    body += line(x(tick), margin.t + plotH, x(tick), margin.t + plotH + 5, PALETTE.axis);
    body += txt(x(tick), margin.t + plotH + 20, tick, {
      size: 11,
      anchor: 'middle',
      fill: PALETTE.muted,
    });
  }
  body += txt(margin.l + plotW / 2, height - 18, xLabel, {
    size: 12,
    anchor: 'middle',
    fill: PALETTE.muted,
  });

  const yTicks = yLog ? logTicks(yMax) : linearTicks(0, yMax, 5);
  for (const tick of yTicks) {
    const yPos = y(tick);
    body += line(margin.l, yPos, margin.l + plotW, yPos, PALETTE.grid);
    body += txt(margin.l - 10, yPos + 4, tick >= 1000 ? `${tick / 1000}rb` : tick, {
      size: 11,
      anchor: 'end',
      fill: PALETTE.muted,
    });
  }
  body += txt(18, margin.t + plotH / 2, yLabel, {
    size: 12,
    anchor: 'middle',
    fill: PALETTE.muted,
    rotate: -90,
  });

  markers.forEach((marker, index) => {
    if (marker.x < xMin || marker.x > xMax) return;
    const xPos = x(marker.x);
    body += line(xPos, margin.t, xPos, margin.t + plotH, marker.color, 1.6, '5 4');
    const labelY = margin.t - 8 - (index % 2) * 14;
    body += txt(xPos + 5, labelY, marker.label, {
      size: 11,
      fill: marker.color,
      weight: 600,
      anchor: marker.x > xMax - (xMax - xMin) * 0.15 ? 'end' : 'start',
    });
  });

  if (note) body += txt(margin.l, height - 4, note, { size: 11, fill: PALETTE.muted });
  return svgDoc(width, height, title, body, subtitle);
}

/* ------------------------------------------------------------------ bars --- */

/**
 * Grouped bars with optional per-category colours, a log y axis, and error
 * whiskers. Values are labelled above each bar when `valueLabels` is set.
 */
function bars({
  title,
  subtitle = '',
  categories,
  series,
  colors = null,
  log = false,
  width = 880,
  height = 400,
  yLabel = '',
  xLabel = '',
  valueFormat = (value) => `${value}`,
  showValues = true,
  errors = null,
  maxBarWidth = 74,
  categoryRotate = 0,
  note = '',
}) {
  const margin = { l: 70, r: 28, t: 74, b: categoryRotate ? 100 : 70 };
  const plotW = width - margin.l - margin.r;
  const plotH = height - margin.t - margin.b;
  const allValues = series.flatMap((s) => s.values);
  const yMaxRaw = Math.max(...allValues);
  const yMax = log ? Math.max(10, yMaxRaw) * 1.6 : yMaxRaw * 1.18 || 1;

  const y = (value) => {
    if (!log) return margin.t + plotH - (value / yMax) * plotH;
    return margin.t + plotH - logScale(value, yMax) * plotH;
  };

  const groupW = plotW / categories.length;
  const seriesCount = series.length;
  const barW = Math.min(maxBarWidth, (groupW * 0.72) / seriesCount);
  let body = chartTitle(title, subtitle, margin.l, 30);
  body += rect(margin.l, margin.t, plotW, plotH, PALETTE.panel, { stroke: PALETTE.grid });

  const yTicks = log ? logTicks(yMax) : linearTicks(0, yMax, 5);
  for (const tick of yTicks) {
    const yPos = y(tick);
    body += line(margin.l, yPos, margin.l + plotW, yPos, PALETTE.grid);
    body += txt(margin.l - 10, yPos + 4, tick >= 1000 ? `${tick / 1000}rb` : tick, {
      size: 11,
      anchor: 'end',
      fill: PALETTE.muted,
    });
  }
  body += txt(18, margin.t + plotH / 2, yLabel, {
    size: 12,
    anchor: 'middle',
    fill: PALETTE.muted,
    rotate: -90,
  });

  categories.forEach((category, categoryIndex) => {
    const groupX = margin.l + categoryIndex * groupW;
    const startX = groupX + (groupW - barW * seriesCount) / 2;
    series.forEach((serie, seriesIndex) => {
      const value = serie.values[categoryIndex];
      const xPos = startX + seriesIndex * barW;
      const top = y(value);
      const base = y(0);
      const fill = colors
        ? colors[categoryIndex]
        : serie.colors
          ? serie.colors[categoryIndex]
          : serie.color || PALETTE.accent;
      body += rect(xPos + 1.5, top, barW - 3, base - top, fill, { opacity: 0.85, radius: 3 });
      if (showValues) {
        body += txt(xPos + barW / 2, top - 7, valueFormat(value), {
          size: 11,
          anchor: 'middle',
          fill: PALETTE.ink,
          weight: 600,
        });
      }
      if (errors) {
        const range = errors[categoryIndex];
        if (range) {
          const hi = y(range.hi);
          const lo = y(range.lo);
          const midX = xPos + barW / 2;
          body += line(midX, hi, midX, lo, PALETTE.ink, 1.2);
          body += line(midX - 5, hi, midX + 5, hi, PALETTE.ink, 1.2);
          body += line(midX - 5, lo, midX + 5, lo, PALETTE.ink, 1.2);
        }
      }
    });
    if (categoryRotate) {
      body += txt(groupX + groupW / 2 + 2, margin.t + plotH + 16, category, {
        size: 11,
        anchor: 'end',
        fill: PALETTE.muted,
        rotate: -categoryRotate,
      });
    } else {
      body += txt(groupX + groupW / 2, margin.t + plotH + 22, category, {
        size: 11,
        anchor: 'middle',
        fill: PALETTE.muted,
      });
    }
  });

  if (xLabel) {
    body += txt(margin.l + plotW / 2, height - 18, xLabel, {
      size: 12,
      anchor: 'middle',
      fill: PALETTE.muted,
    });
  }

  if (seriesCount > 1) {
    body += legend(
      series.map((serie) => ({ label: serie.name, color: serie.color })),
      margin.l,
      58
    );
  }
  if (note) body += txt(margin.l, height - 4, note, { size: 11, fill: PALETTE.muted });
  return svgDoc(width, height, title, body, subtitle);
}

/* --------------------------------------------------------------- dot plot --- */

/**
 * One dot per patient, sorted by peak pressure. `points` is
 * [{x, y, group, split}]; `groups` maps group -> colour.
 */
function dotPlot({
  title,
  subtitle = '',
  points,
  groups,
  markers = [],
  width = 880,
  height = 420,
  yMax = 95,
  yLabel = 'Tekanan puncak per pasien (kPa)',
  xLabel = 'Pasien (diurutkan menurut tekanan puncak)',
  note = '',
}) {
  const margin = { l: 70, r: 28, t: 78, b: 70 };
  const plotW = width - margin.l - margin.r;
  const plotH = height - margin.t - margin.b;
  const n = points.length;
  const x = (index) => margin.l + (n <= 1 ? plotW / 2 : (index / (n - 1)) * plotW);
  const y = (value) => margin.t + plotH - (Math.min(value, yMax) / yMax) * plotH;

  let body = chartTitle(title, subtitle, margin.l, 30);
  body += rect(margin.l, margin.t, plotW, plotH, PALETTE.panel, { stroke: PALETTE.grid });

  for (const tick of linearTicks(0, yMax, 5)) {
    const yPos = y(tick);
    body += line(margin.l, yPos, margin.l + plotW, yPos, PALETTE.grid);
    body += txt(margin.l - 10, yPos + 4, tick, {
      size: 11,
      anchor: 'end',
      fill: PALETTE.muted,
    });
  }

  markers.forEach((marker) => {
    if (marker.y > yMax) return;
    body += line(margin.l, y(marker.y), margin.l + plotW, y(marker.y), marker.color, 1.5, '5 4');
    body += txt(margin.l + plotW - 4, y(marker.y) - 6, marker.label, {
      size: 11,
      anchor: 'end',
      fill: marker.color,
      weight: 600,
    });
  });

  points.forEach((point, index) => {
    const fill = groups[point.group] || PALETTE.slate;
    body += circle(x(index), y(point.y), 3.4, point.split === 'validation' ? '#ffffff' : fill, {
      stroke: fill,
      strokeWidth: point.split === 'validation' ? 1.8 : 0.8,
    });
  });

  body += txt(margin.l + plotW / 2, height - 22, xLabel, {
    size: 12,
    anchor: 'middle',
    fill: PALETTE.muted,
  });
  body += txt(20, margin.t + plotH / 2, yLabel, {
    size: 12,
    anchor: 'middle',
    fill: PALETTE.muted,
    rotate: -90,
  });

  const legendItems = Object.entries(groups).map(([label, color]) => ({ label, color }));
  legendItems.push({ label: 'validasi (berongga)', color: PALETTE.muted, hollow: true });
  body += legend(legendItems, margin.l, 58);
  if (note) body += txt(margin.l, height - 4, note, { size: 11, fill: PALETTE.muted });
  return svgDoc(width, height, title, body, subtitle);
}

/* ------------------------------------------------------------ confusion ----- */

/**
 * One confusion matrix. `matrix` is rows = actual, columns = predicted.
 * Cell shade is proportional to the count so a perfect diagonal shows at once.
 */
function confusion({
  title,
  subtitle = '',
  matrix,
  rowLabels,
  colLabels,
  width = 420,
  height = 360,
}) {
  const margin = { l: 110, r: 24, t: 76, b: 56 };
  const plotW = width - margin.l - margin.r;
  const plotH = height - margin.t - margin.b;
  const cellW = plotW / colLabels.length;
  const cellH = plotH / rowLabels.length;
  const max = Math.max(1, ...matrix.flat());

  let body = chartTitle(title, subtitle, 20, 30);
  body += txt(margin.l + plotW / 2, height - 16, 'Prediksi', {
    size: 12,
    anchor: 'middle',
    fill: PALETTE.muted,
  });
  body += txt(18, margin.t + plotH / 2, 'Aktual', {
    size: 12,
    anchor: 'middle',
    fill: PALETTE.muted,
    rotate: -90,
  });

  matrix.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      const intensity = value / max;
      const fill = value === 0 ? PALETTE.panel : PALETTE.accent;
      const xPos = margin.l + colIndex * cellW;
      const yPos = margin.t + rowIndex * cellH;
      body += rect(xPos, yPos, cellW - 3, cellH - 3, fill, {
        opacity: value === 0 ? 1 : 0.14 + intensity * 0.7,
        stroke: PALETTE.grid,
      });
      body += txt(xPos + cellW / 2, yPos + cellH / 2 + 5, value.toLocaleString('id-ID'), {
        size: 17,
        anchor: 'middle',
        weight: 700,
        fill: intensity > 0.55 ? '#ffffff' : PALETTE.ink,
      });
    });
    body += txt(margin.l - 10, margin.t + rowIndex * cellH + cellH / 2 + 4, rowLabels[rowIndex], {
      size: 12,
      anchor: 'end',
      fill: PALETTE.ink,
    });
  });

  colLabels.forEach((label, index) => {
    body += txt(margin.l + index * cellW + cellW / 2, margin.t - 10, label, {
      size: 12,
      anchor: 'middle',
      fill: PALETTE.ink,
    });
  });

  return svgDoc(width, height, title, body, subtitle);
}

/* ----------------------------------------------------------------- lines --- */

/**
 * Multi-series line chart. `series` is [{name, points:[{x,y}], color}].
 * `hMarkers` draws labelled horizontal reference lines.
 */
function lines({
  title,
  subtitle = '',
  series,
  xLabel = '',
  yLabel = '',
  xDomain = null,
  yDomain = [0, 1],
  hMarkers = [],
  width = 880,
  height = 400,
  valueFormat = (value) => `${value}`,
  note = '',
}) {
  const margin = { l: 70, r: 28, t: 76, b: 68 };
  const plotW = width - margin.l - margin.r;
  const plotH = height - margin.t - margin.b;
  const xs = xDomain || [
    Math.min(...series.flatMap((s) => s.points.map((p) => p.x))),
    Math.max(...series.flatMap((s) => s.points.map((p) => p.x))),
  ];
  const x = (value) =>
    margin.l + ((value - xs[0]) / (xs[1] - xs[0] || 1)) * plotW;
  const y = (value) =>
    margin.t + plotH - ((value - yDomain[0]) / (yDomain[1] - yDomain[0] || 1)) * plotH;

  let body = chartTitle(title, subtitle, margin.l, 30);
  body += rect(margin.l, margin.t, plotW, plotH, PALETTE.panel, { stroke: PALETTE.grid });

  for (const tick of linearTicks(yDomain[0], yDomain[1], 5)) {
    body += line(margin.l, y(tick), margin.l + plotW, y(tick), PALETTE.grid);
    body += txt(margin.l - 10, y(tick) + 4, valueFormat(tick), {
      size: 11,
      anchor: 'end',
      fill: PALETTE.muted,
    });
  }
  for (const tick of linearTicks(xs[0], xs[1], 6)) {
    body += txt(x(tick), margin.t + plotH + 20, valueFormat(tick), {
      size: 11,
      anchor: 'middle',
      fill: PALETTE.muted,
    });
  }

  for (const marker of hMarkers) {
    body += line(margin.l, y(marker.y), margin.l + plotW, y(marker.y), marker.color || PALETTE.axis, 1.4, '5 4');
    if (marker.label) {
      body += txt(margin.l + 6, y(marker.y) - 6, marker.label, {
        size: 11,
        fill: marker.color || PALETTE.muted,
        weight: 600,
      });
    }
  }

  for (const serie of series) {
    const path = serie.points
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${x(point.x).toFixed(2)},${y(point.y).toFixed(2)}`)
      .join(' ');
    body += `<path d="${path}" fill="none" stroke="${serie.color}" stroke-width="2.2" stroke-linejoin="round"/>`;
    for (const point of serie.points) {
      body += circle(x(point.x), y(point.y), 2.8, serie.color);
    }
  }

  body += txt(margin.l + plotW / 2, height - 18, xLabel, {
    size: 12,
    anchor: 'middle',
    fill: PALETTE.muted,
  });
  body += txt(18, margin.t + plotH / 2, yLabel, {
    size: 12,
    anchor: 'middle',
    fill: PALETTE.muted,
    rotate: -90,
  });
  body += legend(
    series.map((serie) => ({ label: serie.name, color: serie.color })),
    margin.l,
    58
  );
  if (note) body += txt(margin.l, height - 4, note, { size: 11, fill: PALETTE.muted });
  return svgDoc(width, height, title, body, subtitle);
}

/* --------------------------------------------------------------- heatmap --- */

/**
 * Level map over (peak pressure, duration). `cells[yIndex][xIndex]` is a level
 * name; `colors` maps level -> fill.
 */
function heatmap({
  title,
  subtitle = '',
  xs,
  ys,
  cells,
  colors,
  labels,
  width = 880,
  height = 400,
  xLabel = '',
  yLabel = '',
  note = '',
}) {
  const margin = { l: 70, r: 28, t: 76, b: 68 };
  const plotW = width - margin.l - margin.r;
  const plotH = height - margin.t - margin.b;
  const cellW = plotW / xs.length;
  const cellH = plotH / ys.length;

  let body = chartTitle(title, subtitle, margin.l, 30);
  body += rect(margin.l, margin.t, plotW, plotH, '#ffffff', { stroke: PALETTE.grid });

  cells.forEach((row, yIndex) => {
    row.forEach((level, xIndex) => {
      const xPos = margin.l + xIndex * cellW;
      const yPos = margin.t + (ys.length - 1 - yIndex) * cellH;
      body += rect(xPos, yPos, cellW + 0.4, cellH + 0.4, colors[level] || '#e5e7eb', {
        opacity: 0.9,
      });
    });
  });

  for (const tick of linearTicks(xs[0], xs[xs.length - 1], 6)) {
    const xPos = margin.l + ((tick - xs[0]) / (xs[xs.length - 1] - xs[0])) * plotW;
    body += txt(xPos, margin.t + plotH + 20, tick, {
      size: 11,
      anchor: 'middle',
      fill: PALETTE.muted,
    });
  }
  for (const tick of linearTicks(ys[0], ys[ys.length - 1], 5)) {
    const yPos = margin.t + plotH - ((tick - ys[0]) / (ys[ys.length - 1] - ys[0])) * plotH;
    body += txt(margin.l - 10, yPos + 4, tick, {
      size: 11,
      anchor: 'end',
      fill: PALETTE.muted,
    });
  }
  body += txt(margin.l + plotW / 2, height - 22, xLabel, {
    size: 12,
    anchor: 'middle',
    fill: PALETTE.muted,
  });
  body += txt(18, margin.t + plotH / 2, yLabel, {
    size: 12,
    anchor: 'middle',
    fill: PALETTE.muted,
    rotate: -90,
  });
  body += legend(
    Object.keys(labels).map((key) => ({ label: labels[key], color: colors[key] })),
    margin.l,
    58
  );
  if (note) body += txt(margin.l, height - 4, note, { size: 11, fill: PALETTE.muted });
  return svgDoc(width, height, title, body, subtitle);
}

/* ----------------------------------------------------------- sensor range -- */

/**
 * Horizontal axis showing what the sensor can measure, with threshold markers
 * above it. Used to show that 200 kPa sits outside the FSR 402 range.
 */
function sensorRange({
  title,
  subtitle = '',
  max,
  band = null,
  markers = [],
  width = 880,
  height = 260,
}) {
  const margin = { l: 40, r: 40, t: 96, b: 62 };
  const plotW = width - margin.l - margin.r;
  const axisY = margin.t;
  const x = (value) => margin.l + (value / max) * plotW;

  let body = chartTitle(title, subtitle, margin.l, 30);
  body += line(margin.l, axisY + 26, margin.l + plotW, axisY + 26, PALETTE.axis, 1.6);

  if (band) {
    const x0 = x(band.from);
    const x1 = x(band.to);
    body += rect(x0, axisY - 2, x1 - x0, 28, band.color, { opacity: 0.22, radius: 4 });
    body += txt((x0 + x1) / 2, axisY + 16, band.label, {
      size: 11,
      anchor: 'middle',
      fill: PALETTE.ink,
      weight: 600,
    });
  }

  markers.forEach((marker, index) => {
    const xPos = x(marker.x);
    body += line(xPos, axisY - 14, xPos, axisY + 40, marker.color, 2);
    const labelY = axisY + 58 + (index % 2) * 18;
    body += txt(xPos, labelY, marker.label, {
      size: 11,
      anchor: marker.x > max * 0.85 ? 'end' : 'middle',
      fill: marker.color,
      weight: 600,
    });
  });

  for (const tick of linearTicks(0, max, 6)) {
    body += line(x(tick), axisY + 26, x(tick), axisY + 32, PALETTE.axis);
    body += txt(x(tick), axisY + 46, tick, {
      size: 11,
      anchor: 'middle',
      fill: PALETTE.muted,
    });
  }
  body += txt(margin.l + plotW / 2, height - 10, 'Tekanan (kPa)', {
    size: 12,
    anchor: 'middle',
    fill: PALETTE.muted,
  });
  return svgDoc(width, height, title, body, subtitle);
}

/* ------------------------------------------------------------------- ROC --- */

/**
 * ROC curve from OOF scores. `points` is [{fpr, tpr}] sorted by threshold.
 */
function roc({ title, subtitle = '', points, aucValue, width = 560, height = 480 }) {
  const margin = { l: 70, r: 28, t: 76, b: 68 };
  const plotW = width - margin.l - margin.r;
  const plotH = height - margin.t - margin.b;
  const x = (value) => margin.l + value * plotW;
  const y = (value) => margin.t + plotH - value * plotH;

  let body = chartTitle(title, subtitle, margin.l, 30);
  body += rect(margin.l, margin.t, plotW, plotH, PALETTE.panel, { stroke: PALETTE.grid });
  body += line(margin.l, margin.t + plotH, margin.l + plotW, margin.t, PALETTE.axis, 1.2, '6 5');

  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${x(point.fpr).toFixed(2)},${y(point.tpr).toFixed(2)}`)
    .join(' ');
  body += `<path d="${path}" fill="none" stroke="${PALETTE.accent}" stroke-width="2.4"/>`;

  for (const tick of [0, 0.25, 0.5, 0.75, 1]) {
    body += txt(x(tick), margin.t + plotH + 20, tick.toFixed(2).replace('.', ','), {
      size: 11,
      anchor: 'middle',
      fill: PALETTE.muted,
    });
    body += txt(margin.l - 10, y(tick) + 4, tick.toFixed(2).replace('.', ','), {
      size: 11,
      anchor: 'end',
      fill: PALETTE.muted,
    });
  }
  body += txt(margin.l + plotW / 2, height - 18, 'Rasio positif palsu (FPR)', {
    size: 12,
    anchor: 'middle',
    fill: PALETTE.muted,
  });
  body += txt(20, margin.t + plotH / 2, 'Rasio positif benar (TPR)', {
    size: 12,
    anchor: 'middle',
    fill: PALETTE.muted,
    rotate: -90,
  });
  // Above the plot, not inside it: the curve ends at the top-right corner and
  // would sit under the label.
  body += txt(margin.l + plotW, margin.t - 10, `AUC ${aucValue.toFixed(3).replace('.', ',')}`, {
    size: 14,
    anchor: 'end',
    weight: 700,
    fill: PALETTE.ink,
  });
  return svgDoc(width, height, title, body, subtitle);
}

/* ------------------------------------------------------------------ strip --- */

/**
 * One row per scheme, one dot per fold, a short line at the mean. Used where a
 * bar chart from zero would hide the difference between 99% and 100%.
 */
function strip({
  title,
  subtitle = '',
  rows,
  yDomain = [0, 1],
  width = 880,
  height = 400,
  yLabel = '',
  xLabel = '',
  valueFormat = (value) => value.toFixed(3),
  note = '',
}) {
  const labelWidth = Math.max(
    90,
    ...rows.map((row) => row.name.length * 6.6)
  );
  const margin = { l: 20 + labelWidth, r: 78, t: 78, b: 68 };
  const plotW = width - margin.l - margin.r;
  const plotH = height - margin.t - margin.b;
  const x = (value) =>
    margin.l + ((value - yDomain[0]) / (yDomain[1] - yDomain[0] || 1)) * plotW;
  const rowH = plotH / rows.length;

  let body = chartTitle(title, subtitle, margin.l, 30);
  body += rect(margin.l, margin.t, plotW, plotH, PALETTE.panel, { stroke: PALETTE.grid });

  for (const tick of linearTicks(yDomain[0], yDomain[1], 6)) {
    body += line(x(tick), margin.t, x(tick), margin.t + plotH, PALETTE.grid);
    body += txt(x(tick), margin.t + plotH + 20, valueFormat(tick), {
      size: 11,
      anchor: 'middle',
      fill: PALETTE.muted,
    });
  }

  rows.forEach((row, rowIndex) => {
    const yPos = margin.t + rowH * (rowIndex + 0.5);
    const values = row.values.filter((value) => Number.isFinite(value));
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    body += line(margin.l, yPos, margin.l + plotW, yPos, PALETTE.grid, 1, '2 4');
    body += line(x(mean), yPos - 9, x(mean), yPos + 9, row.color, 2.5);
    // Identical folds would draw one dot on top of another, which reads as a
    // single measurement. Group equal values and stack their dots vertically:
    // the x position is still the true value, only the overlap is resolved.
    const groups = {};
    for (const value of values) {
      const key = value.toFixed(4);
      if (!groups[key]) groups[key] = { value, count: 0 };
      groups[key].count += 1;
    }
    for (const group of Object.values(groups)) {
      const spread = Math.min(group.count - 1, 5) * 4.2;
      for (let index = 0; index < Math.min(group.count, 6); index += 1) {
        const offset = -spread / 2 + index * 4.2;
        body += circle(x(group.value), yPos + offset, 3.6, '#ffffff', {
          stroke: row.color,
          strokeWidth: 2,
        });
      }
    }
    body += txt(margin.l - 12, yPos + 4, row.name, {
      size: 12,
      anchor: 'end',
      fill: PALETTE.ink,
    });
    body += txt(margin.l + plotW + 8, yPos + 4, valueFormat(mean), {
      size: 11,
      anchor: 'start',
      fill: row.color,
      weight: 700,
    });
  });

  body += txt(margin.l + plotW / 2, height - 22, xLabel, {
    size: 12,
    anchor: 'middle',
    fill: PALETTE.muted,
  });
  if (yLabel) {
    body += txt(14, margin.t + plotH / 2, yLabel, {
      size: 12,
      anchor: 'middle',
      fill: PALETTE.muted,
      rotate: -90,
    });
  }
  if (note) body += txt(margin.l, height - 4, note, { size: 11, fill: PALETTE.muted });
  return svgDoc(width, height, title, body, subtitle);
}

module.exports = {
  PALETTE,
  esc,
  histogram,
  bars,
  dotPlot,
  confusion,
  lines,
  heatmap,
  sensorRange,
  roc,
  strip,
};
