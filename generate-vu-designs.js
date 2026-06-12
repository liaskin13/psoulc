const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create output directory
const outputDir = `/home/codespace/.gstack/projects/liaskin13-psoulc/designs/vu-9to3-pro-dj-${new Date().toISOString().split('T')[0].replace(/-/g, '')}`;
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Helper: draw a horizontal VU needle gauge (9-to-3 rotation, 180°)
function drawVUGauge(ctx, x, y, width, height, value, label, needleColor, bgColor = '#000000', outlineColor = '#333333') {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const radius = Math.min(width, height) / 2.2;

  // Draw gauge background circle
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  // Draw gauge outline
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Draw scale arc (9-to-3: 180°)
  ctx.strokeStyle = 'rgba(200,200,200,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 8, Math.PI, 0, true);
  ctx.stroke();

  // Draw scale markings and labels
  const scaleMarks = [
    { angle: Math.PI, label: '-60', dbfs: -60 },
    { angle: Math.PI * 0.75, label: '-24', dbfs: -24 },
    { angle: Math.PI * 0.5, label: '-12', dbfs: -12 },
    { angle: Math.PI * 0.25, label: '-6', dbfs: -6 },
    { angle: 0, label: '0', dbfs: 0 }
  ];

  ctx.strokeStyle = 'rgba(200,200,200,0.9)';
  ctx.lineWidth = 1;
  ctx.fillStyle = 'rgba(200,200,200,0.9)';
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const mark of scaleMarks) {
    const r1 = radius - 5;
    const r2 = radius - 15;
    const x1 = centerX + r1 * Math.cos(mark.angle);
    const y1 = centerY + r1 * Math.sin(mark.angle);
    const x2 = centerX + r2 * Math.cos(mark.angle);
    const y2 = centerY + r2 * Math.sin(mark.angle);

    // Tick mark
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Label
    const lx = centerX + (radius - 28) * Math.cos(mark.angle);
    const ly = centerY + (radius - 28) * Math.sin(mark.angle);
    ctx.fillText(mark.label, lx, ly);
  }

  // Draw minor tick marks
  ctx.strokeStyle = 'rgba(150,150,150,0.6)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 37; i++) {
    const angle = Math.PI - (i / 36) * Math.PI;
    const r1 = radius - 5;
    const r2 = radius - 11;
    const x1 = centerX + r1 * Math.cos(angle);
    const y1 = centerY + r1 * Math.sin(angle);
    const x2 = centerX + r2 * Math.cos(angle);
    const y2 = centerY + r2 * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Draw needle (9-to-3: 180° rotation range)
  // value = 0-100 (0 = -60dBFS, 100 = 0dBFS)
  const clampedValue = Math.max(0, Math.min(100, value));
  const needleAngle = Math.PI - (clampedValue / 100) * Math.PI;

  // Needle shadow
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(centerX + (radius - 12) * Math.cos(needleAngle), centerY + (radius - 12) * Math.sin(needleAngle));
  ctx.stroke();

  // Needle
  ctx.strokeStyle = needleColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(centerX + (radius - 12) * Math.cos(needleAngle), centerY + (radius - 12) * Math.sin(needleAngle));
  ctx.stroke();

  // Center hub
  ctx.fillStyle = '#222222';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = needleColor;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Label below
  ctx.fillStyle = 'rgba(200,200,200,0.9)';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(label, centerX, centerY + radius + 8);
}

// Generate spectrum analyzer simulation (150 bars, red/green/cyan)
function drawSpectrumAnalyzer(ctx, x, y, width, height) {
  const barCount = 150;
  const barWidth = Math.max(1, Math.floor(width / barCount) - 1);
  const gap = Math.max(1, Math.floor(width / barCount) - barWidth);

  ctx.fillStyle = '#000000';
  ctx.fillRect(x, y, width, height);

  // Subtle grid
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (const frac of [0.25, 0.5, 0.75]) {
    const gy = Math.round(y + height * (1 - frac));
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + width, gy);
    ctx.stroke();
  }

  // Draw bars with pseudo-random heights (simulate spectrum)
  for (let i = 0; i < barCount; i++) {
    const barX = x + (i * (barWidth + gap));
    const normFreq = i / (barCount - 1);

    // Gaussian peak around 0.3 (bass) and 0.7 (high), dip at 0.5 (mid)
    let normalizedHeight = 0.1 + 0.4 * Math.sin((i / barCount) * Math.PI);
    normalizedHeight = Math.pow(normalizedHeight, 0.8);

    // Add some variation
    const seed = (i * 73) % 256;
    normalizedHeight += ((seed / 256) - 0.5) * 0.15;
    normalizedHeight = Math.max(0.06, Math.min(1, normalizedHeight));

    const barHeight = Math.round(normalizedHeight * height);

    // Determine color based on frequency band
    let color;
    if (normFreq < 0.33) {
      // Bass: red
      color = `rgba(255, 0, 0, ${Math.max(0.2, normalizedHeight)})`;
    } else if (normFreq < 0.67) {
      // Mid: green
      color = `rgba(0, 255, 0, ${Math.max(0.2, normalizedHeight)})`;
    } else {
      // High: cyan
      color = `rgba(0, 255, 255, ${Math.max(0.2, normalizedHeight)})`;
    }

    ctx.fillStyle = color;
    ctx.fillRect(barX, y + height - barHeight, barWidth, barHeight);
  }

  // Peak hold line simulation (faint gray line at peaks)
  ctx.strokeStyle = 'rgba(255,255,220,0.3)';
  ctx.lineWidth = 1;
  for (let i = 0; i < barCount; i++) {
    const barX = x + (i * (barWidth + gap));
    const normFreq = i / (barCount - 1);
    const peakMult = 1.1;
    let normalizedHeight = 0.1 + 0.4 * Math.sin((i / barCount) * Math.PI);
    normalizedHeight = Math.pow(normalizedHeight, 0.8) * peakMult;
    const peakHeight = Math.round(Math.min(normalizedHeight, 1) * height);
    const peakY = y + height - peakHeight;
    ctx.beginPath();
    ctx.moveTo(barX, peakY);
    ctx.lineTo(barX + barWidth, peakY);
    ctx.stroke();
  }
}

// Generate Variant A: Pro Minimalist
function generateVariantA() {
  const width = 900;
  const height = 500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // VU Meters section
  const vuHeight = 220;
  const meterWidth = 200;
  const gapBetween = 80;
  const startX = (width - (meterWidth * 2 + gapBetween)) / 2;

  drawVUGauge(ctx, startX, 20, meterWidth, vuHeight, 65, 'L', '#ff3333', '#0a0a0a', '#222222');
  drawVUGauge(ctx, startX + meterWidth + gapBetween, 20, meterWidth, vuHeight, 45, 'R', '#00ffff', '#0a0a0a', '#222222');

  // Spectrum analyzer
  drawSpectrumAnalyzer(ctx, 50, 280, width - 100, 200);

  // Title
  ctx.fillStyle = 'rgba(200,200,200,0.9)';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Variant A: Pro Minimalist', width / 2, 260);

  return canvas;
}

// Generate Variant B: Pro Refined
function generateVariantB() {
  const width = 900;
  const height = 500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, width, height);

  // VU Meters section
  const vuHeight = 220;
  const meterWidth = 200;
  const gapBetween = 80;
  const startX = (width - (meterWidth * 2 + gapBetween)) / 2;

  drawVUGauge(ctx, startX, 20, meterWidth, vuHeight, 65, 'L', '#ff3333', '#1a1a1a', '#444444');
  drawVUGauge(ctx, startX + meterWidth + gapBetween, 20, meterWidth, vuHeight, 45, 'R', '#00ffff', '#1a1a1a', '#444444');

  // Spectrum analyzer
  drawSpectrumAnalyzer(ctx, 50, 280, width - 100, 200);

  // Title
  ctx.fillStyle = 'rgba(220,220,220,0.95)';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Variant B: Pro Refined', width / 2, 260);

  return canvas;
}

// Generate Variant C: Pro Bold
function generateVariantC() {
  const width = 900;
  const height = 500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background with subtle gradient illusion
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // VU Meters section
  const vuHeight = 220;
  const meterWidth = 200;
  const gapBetween = 80;
  const startX = (width - (meterWidth * 2 + gapBetween)) / 2;

  // Override to draw bolder gauges
  const drawBoldGauge = (x, y, w, h, value, label, needleColor) => {
    const centerX = x + w / 2;
    const centerY = y + h / 2;
    const radius = Math.min(w, h) / 2.2;

    // Bolder background
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Bolder outline
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Scale arc
    ctx.strokeStyle = 'rgba(255,255,255,1)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 8, Math.PI, 0, true);
    ctx.stroke();

    // Bold scale markings
    const scaleMarks = [
      { angle: Math.PI, label: '-60', dbfs: -60 },
      { angle: Math.PI * 0.75, label: '-24', dbfs: -24 },
      { angle: Math.PI * 0.5, label: '-12', dbfs: -12 },
      { angle: Math.PI * 0.25, label: '-6', dbfs: -6 },
      { angle: 0, label: '0', dbfs: 0 }
    ];

    ctx.strokeStyle = 'rgba(255,255,255,1)';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const mark of scaleMarks) {
      const r1 = radius - 5;
      const r2 = radius - 18;
      const x1 = centerX + r1 * Math.cos(mark.angle);
      const y1 = centerY + r1 * Math.sin(mark.angle);
      const x2 = centerX + r2 * Math.cos(mark.angle);
      const y2 = centerY + r2 * Math.sin(mark.angle);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      const lx = centerX + (radius - 28) * Math.cos(mark.angle);
      const ly = centerY + (radius - 28) * Math.sin(mark.angle);
      ctx.fillText(mark.label, lx, ly);
    }

    // Minor ticks (bold)
    ctx.strokeStyle = 'rgba(200,200,200,0.8)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 37; i++) {
      const angle = Math.PI - (i / 36) * Math.PI;
      const r1 = radius - 5;
      const r2 = radius - 12;
      const x1 = centerX + r1 * Math.cos(angle);
      const y1 = centerY + r1 * Math.sin(angle);
      const x2 = centerX + r2 * Math.cos(angle);
      const y2 = centerY + r2 * Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Bold needle
    const clampedValue = Math.max(0, Math.min(100, value));
    const needleAngle = Math.PI - (clampedValue / 100) * Math.PI;

    ctx.strokeStyle = needleColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + (radius - 12) * Math.cos(needleAngle), centerY + (radius - 12) * Math.sin(needleAngle));
    ctx.stroke();

    // Larger center hub
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = needleColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Bold label
    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(label, centerX, centerY + radius + 8);
  };

  drawBoldGauge(startX, 20, meterWidth, vuHeight, 65, 'L', '#ff3333');
  drawBoldGauge(startX + meterWidth + gapBetween, 20, meterWidth, vuHeight, 45, 'R', '#00ffff');

  // Spectrum analyzer
  drawSpectrumAnalyzer(ctx, 50, 280, width - 100, 200);

  // Title
  ctx.fillStyle = 'rgba(255,255,255,1)';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Variant C: Pro Bold', width / 2, 260);

  return canvas;
}

// Main execution
async function main() {
  try {
    // Create variant A
    const canvasA = generateVariantA();
    const bufferA = canvasA.toBuffer('image/png');
    const pathA = path.join(outputDir, 'VARIANT_A_Pro_Minimalist.png');
    fs.writeFileSync(pathA, bufferA);
    console.log(`VARIANT_A_DONE: ${bufferA.length} bytes`);

    // Create variant B
    const canvasB = generateVariantB();
    const bufferB = canvasB.toBuffer('image/png');
    const pathB = path.join(outputDir, 'VARIANT_B_Pro_Refined.png');
    fs.writeFileSync(pathB, bufferB);
    console.log(`VARIANT_B_DONE: ${bufferB.length} bytes`);

    // Create variant C
    const canvasC = generateVariantC();
    const bufferC = canvasC.toBuffer('image/png');
    const pathC = path.join(outputDir, 'VARIANT_C_Pro_Bold.png');
    fs.writeFileSync(pathC, bufferC);
    console.log(`VARIANT_C_DONE: ${bufferC.length} bytes`);

    console.log(`\nAll designs saved to: ${outputDir}`);
  } catch (error) {
    console.error('Error generating designs:', error);
    process.exit(1);
  }
}

main();
