// Preview adaptive icon with different Android launcher masks
// Run: node scripts/preview-adaptive-icon.js
// Opens HTML preview in browser - no APK build needed

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const SIZE = 256;
const OUT_DIR = path.join(__dirname, '..', 'docs');
const FG_PATH = path.join(__dirname, '..', 'assets', 'adaptive-icon.png');

// Read adaptiveIcon backgroundColor from app.config.js
function getBgColor() {
  const configPath = path.join(__dirname, '..', 'app.config.js');
  const content = fs.readFileSync(configPath, 'utf8');
  // Match backgroundColor inside adaptiveIcon block
  const match = content.match(/adaptiveIcon:\s*\{[^}]*backgroundColor:\s*['"]([^'"]+)['"]/s);
  return match ? match[1] : '#D4A76A';
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 212, g: 167, b: 106 };
}

// Mask shapes
const masks = {
  circle: (s) => `<svg width="${s}" height="${s}"><circle cx="${s/2}" cy="${s/2}" r="${s/2}" fill="white"/></svg>`,

  squircle: (s) => {
    // Samsung-style squircle (superellipse)
    const r = s * 0.22;
    return `<svg width="${s}" height="${s}"><rect x="0" y="0" width="${s}" height="${s}" rx="${r}" ry="${r}" fill="white"/></svg>`;
  },

  roundedSquare: (s) => {
    const r = s * 0.15;
    return `<svg width="${s}" height="${s}"><rect x="0" y="0" width="${s}" height="${s}" rx="${r}" ry="${r}" fill="white"/></svg>`;
  },

  teardrop: (s) => {
    const r = s * 0.35;
    return `<svg width="${s}" height="${s}">
      <path d="M ${r},0 H ${s-r} Q ${s},0 ${s},${r} V ${s} H 0 V ${r} Q 0,0 ${r},0 Z" fill="white"/>
    </svg>`;
  }
};

async function generatePreview(maskName, maskFn, bgColor) {
  const rgb = hexToRgb(bgColor);

  const fg = await sharp(FG_PATH)
    .resize(SIZE, SIZE)
    .ensureAlpha()
    .toBuffer();

  const maskSvg = maskFn(SIZE);
  const mask = await sharp(Buffer.from(maskSvg)).png().toBuffer();

  const outPath = path.join(OUT_DIR, `preview-${maskName}.png`);

  await sharp({
    create: { width: SIZE, height: SIZE, channels: 4, background: { ...rgb, alpha: 255 } }
  })
    .composite([
      { input: fg, top: 0, left: 0 },
      { input: mask, blend: 'dest-in' }
    ])
    .png()
    .toFile(outPath);

  return outPath;
}

async function run() {
  const bgColor = getBgColor();
  console.log(`Background color: ${bgColor}`);

  const previews = [];
  for (const [name, fn] of Object.entries(masks)) {
    const p = await generatePreview(name, fn, bgColor);
    previews.push({ name, path: p });
    console.log(`Generated: ${name}`);
  }

  // Generate HTML preview
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Adaptive Icon Preview</title>
  <style>
    body {
      font-family: system-ui;
      background: #1a1a2e;
      color: white;
      padding: 40px;
      text-align: center;
    }
    h1 { margin-bottom: 10px; }
    .info { color: #888; margin-bottom: 30px; }
    .grid {
      display: flex;
      gap: 30px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .preview {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: #2a2a4a;
      padding: 20px;
      border-radius: 12px;
    }
    .preview img {
      width: 128px;
      height: 128px;
      margin-bottom: 10px;
    }
    .preview span {
      font-size: 14px;
      color: #aaa;
    }
    .note {
      margin-top: 40px;
      padding: 20px;
      background: #2a2a4a;
      border-radius: 8px;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
      text-align: left;
    }
    .note h3 { margin-top: 0; color: #6366f1; }
    code { background: #1a1a2e; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>NepLearn Adaptive Icon Preview</h1>
  <p class="info">Background: ${bgColor} | Foreground: assets/adaptive-icon.png</p>

  <div class="grid">
    ${previews.map(p => `
    <div class="preview">
      <img src="preview-${p.name}.png" alt="${p.name}">
      <span>${p.name}</span>
    </div>
    `).join('')}
  </div>

  <div class="note">
    <h3>Launcher Shapes</h3>
    <ul>
      <li><strong>Circle</strong> — Pixel, stock Android</li>
      <li><strong>Squircle</strong> — Samsung, OnePlus</li>
      <li><strong>Rounded Square</strong> — Xiaomi, some custom launchers</li>
      <li><strong>Teardrop</strong> — Some OEM variants</li>
    </ul>
    <p>To adjust: edit <code>scripts/pad-adaptive-icon.js</code> (SAFE_ZONE_RATIO, CROP) or <code>app.config.js</code> (backgroundColor), then run:</p>
    <pre>node scripts/pad-adaptive-icon.js && node scripts/preview-adaptive-icon.js</pre>
  </div>
</body>
</html>`;

  const htmlPath = path.join(OUT_DIR, 'icon-preview.html');
  fs.writeFileSync(htmlPath, html);
  console.log(`\nPreview: ${htmlPath}`);

  // Try to open in browser
  const cmd = process.platform === 'win32' ? 'start' :
              process.platform === 'darwin' ? 'open' : 'xdg-open';
  exec(`${cmd} "${htmlPath}"`);
}

run().catch(console.error);
