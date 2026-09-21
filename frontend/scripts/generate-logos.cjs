const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function run() {
  const inputPath = path.join(__dirname, '../assets/pjr  logo.jpeg');
  const assetsDir = path.join(__dirname, '../assets');
  const publicDir = path.join(__dirname, '../public');

  // Center and radius computed from outer ring detection
  const cx = 632.5;
  const cy = 624.5;
  const r = 604; // radius with 4px margin so the outer dark green ring is 100% intact

  const left = Math.max(0, Math.round(cx - r));
  const top = Math.max(0, Math.round(cy - r));
  const cropWidth = Math.min(1264 - left, Math.round(r * 2));
  const cropHeight = Math.min(1264 - top, Math.round(r * 2));
  const cropSize = Math.min(cropWidth, cropHeight);

  console.log(`Cropping square: left=${left}, top=${top}, size=${cropSize}`);

  // Mask circle precisely matches the outer green ring (radius ~599px relative to center)
  const maskRadius = 598.5;
  const maskSvg = Buffer.from(
    `<svg width="${cropSize}" height="${cropSize}">
      <circle cx="${cropSize / 2}" cy="${cropSize / 2}" r="${maskRadius}" fill="white" />
    </svg>`
  );

  // Extract the square containing the emblem, apply subtle sharpening and contrast/saturation enhancement
  const cropped = await sharp(inputPath)
    .extract({ left, top, width: cropSize, height: cropSize })
    .modulate({
      brightness: 1.02,
      saturation: 1.18,
    })
    .sharpen({ sigma: 1.0, m1: 0.5, m2: 2.0 })
    .composite([{ input: maskSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const mainLogoPath = path.join(assetsDir, 'pjr-logo.png');
  const publicLogoPath = path.join(publicDir, 'logo.png');

  await sharp(cropped).toFile(mainLogoPath);
  await sharp(cropped).toFile(publicLogoPath);
  console.log('Saved pjr-logo.png and public/logo.png');

  // Generate web browser favicons at different sizes
  // 512x512 PNG
  const p512 = path.join(publicDir, 'favicon.png');
  await sharp(cropped).resize(512, 512, { fit: 'contain' }).png().toFile(p512);

  // 192x192 PNG
  const p192 = path.join(publicDir, 'favicon-192x192.png');
  await sharp(cropped).resize(192, 192, { fit: 'contain' }).png().toFile(p192);

  // 180x180 Apple Touch Icon
  const p180 = path.join(publicDir, 'apple-touch-icon.png');
  await sharp(cropped).resize(180, 180, { fit: 'contain' }).png().toFile(p180);

  // 32x32 PNG (browser tab)
  const p32 = path.join(publicDir, 'favicon-32x32.png');
  await sharp(cropped).resize(32, 32, { fit: 'contain' }).png().toFile(p32);

  // 16x16 PNG (browser tab)
  const p16 = path.join(publicDir, 'favicon-16x16.png');
  await sharp(cropped).resize(16, 16, { fit: 'contain' }).png().toFile(p16);

  console.log('Saved all favicon PNG sizes');

  // Also generate multi-size ICO file for /favicon.ico (16, 32, 48)
  const ico16 = await sharp(cropped).resize(16, 16, { fit: 'contain' }).png().toBuffer();
  const ico32 = await sharp(cropped).resize(32, 32, { fit: 'contain' }).png().toBuffer();
  const ico48 = await sharp(cropped).resize(48, 48, { fit: 'contain' }).png().toBuffer();

  // Simple ICO builder from PNG buffers
  const icoBuffer = createIco([
    { size: 16, buffer: ico16 },
    { size: 32, buffer: ico32 },
    { size: 48, buffer: ico48 },
  ]);

  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('Saved public/favicon.ico');
}

function createIco(images) {
  // ICO header: 6 bytes
  // 0-1: reserved (0)
  // 2-3: image type (1 for ico)
  // 4-5: number of images
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  // Each directory entry: 16 bytes
  const dirSize = 16 * count;
  let offset = 6 + dirSize;

  const dirEntries = [];
  const imageBuffers = [];

  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 0); // width
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 1); // height
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // image size in bytes
    entry.writeUInt32LE(offset, 12); // image data offset

    dirEntries.push(entry);
    imageBuffers.push(img.buffer);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...imageBuffers]);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
