// Build all app icons from the kite logo source (docs/kite-logo.png).
// Run: node scripts/build-app-icons.js && node scripts/preview-adaptive-icon.js
//
// The source is a flat kite on a solid indigo background. For the Android
// adaptive foreground the kite is shrunk and re-centered (the source sits it
// high/right to leave room for the string) and exposed edges are filled with
// the sampled background color. Android's adaptiveIcon.backgroundColor in
// app.config.js must match BG so any launcher parallax/crop is seamless.
const sharp = require('sharp');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'docs', 'kite-logo.png');
const SIZE = 1024;

// Sampled from the source corners (#585CF5).
const BG = { r: 88, g: 92, b: 245, alpha: 1 };

// Kite bbox in source pixels (red fill + blue border), measured once.
const KITE_BBOX = { x0: 452, y0: 245, x1: 864, y1: 802 };

// Source is drawn at this fraction of the canvas. At 0.85 the kite's farthest
// corner sits ~240px from center, well inside Android's 66dp safe-zone circle
// (~313px of 1024) with room for the wind lines.
const KITE_SCALE = 0.85;

async function buildMaster() {
  const meta = await sharp(SRC).metadata();
  const drawn = Math.round(SIZE * KITE_SCALE);
  const scale = drawn / meta.width;
  const resized = await sharp(SRC).resize(drawn, drawn).removeAlpha().toBuffer();

  // Place the resized image so the kite's center lands on the canvas center.
  const kiteCx = ((KITE_BBOX.x0 + KITE_BBOX.x1) / 2) * scale;
  const kiteCy = ((KITE_BBOX.y0 + KITE_BBOX.y1) / 2) * scale;
  const dx = Math.round(SIZE / 2 - kiteCx);
  const dy = Math.round(SIZE / 2 - kiteCy);

  // Crop the part of the resized image that stays on-canvas after placement.
  const left = Math.max(0, -dx);
  const top = Math.max(0, -dy);
  const width = Math.min(drawn, SIZE - dx) - left;
  const height = Math.min(drawn, SIZE - dy) - top;
  const visible = await sharp(resized).extract({ left, top, width, height }).toBuffer();

  return sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: BG } })
    .composite([{ input: visible, left: Math.max(0, dx), top: Math.max(0, dy) }])
    .png()
    .toBuffer();
}

async function run() {
  // Android launchers crop the adaptive foreground to its center 72/108, so it
  // gets the shrunk, re-centered master. iOS/web show the full square, so they
  // use the source as-is (its string runs cleanly off the bottom-left edge).
  const adaptive = await buildMaster();
  const full = await sharp(SRC).removeAlpha().toBuffer();

  const outputs = [
    { file: 'adaptive-icon.png', src: adaptive, size: SIZE },
    { file: 'icon.png', src: full, size: SIZE },
    { file: 'favicon.png', src: full, size: 64 },
  ];
  for (const { file, src, size } of outputs) {
    const out = path.join(ROOT, 'assets', file);
    await sharp(src).resize(size, size).png().toFile(out);
    console.log(`Wrote ${out} (${size}x${size})`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
