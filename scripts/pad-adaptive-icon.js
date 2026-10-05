// One-off script: build Android adaptive-icon foreground from a coin-logo
// source photo (assets/updated.png).
//
// Steps:
// 1. Crop a square around the coin (bbox found by sampling color saturation
//    to separate the saturated coin art from the desaturated cream backdrop).
// 2. Apply a circular alpha mask to strip the cream corners/drop-shadow,
//    leaving just the coin on a transparent background.
// 3. Scale the coin down to Android's adaptive-icon "safe zone" (~72% of
//    the canvas — content outside this can be clipped by circle/squircle/
//    rounded-square launcher masks) and center it on a transparent 1024x1024
//    canvas.
const sharp = require('sharp');
const path = require('path');

const SRC = path.join(__dirname, '..', 'docs', 'updated.png');
const OUT = path.join(__dirname, '..', 'assets', 'adaptive-icon.png');
const SIZE = 1024;
const SAFE_ZONE_RATIO = 0.82;

// Bbox of the coin within updated.png, found via saturation-based scan
// (high threshold to exclude the soft drop-shadow, center ~(690,555) r~400).
const CROP = { left: 280, top: 145, size: 820 };
const MASK_RADIUS = 400; // relative to CROP size, centered

async function run() {
  const cropped = await sharp(SRC)
    .extract({ left: CROP.left, top: CROP.top, width: CROP.size, height: CROP.size })
    .ensureAlpha()
    .toBuffer();

  const maskSvg = Buffer.from(
    `<svg width="${CROP.size}" height="${CROP.size}"><circle cx="${CROP.size / 2}" cy="${CROP.size / 2}" r="${MASK_RADIUS}" fill="white"/></svg>`
  );

  const coinOnly = await sharp(cropped)
    .composite([{ input: maskSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const contentSize = Math.round(SIZE * SAFE_ZONE_RATIO);
  const resizedCoin = await sharp(coinOnly)
    .resize(contentSize, contentSize, { fit: 'contain' })
    .toBuffer();

  const offset = Math.round((SIZE - contentSize) / 2);

  await sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resizedCoin, left: offset, top: offset }])
    .png()
    .toFile(OUT);

  console.log(`Wrote ${OUT}: ${SIZE}x${SIZE}, coin diameter ${contentSize}px, offset ${offset}px.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
