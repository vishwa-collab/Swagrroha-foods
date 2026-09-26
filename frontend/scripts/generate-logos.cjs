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

  // Convert emblem text from SWAGROOHA to SWAGRUHA
  const { data, info } = await sharp(cropped).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, c = info.channels;

  const extractClean = (xLeft, yTop, width, height) => {
    const buf = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = ((yTop + y) * w + (xLeft + x)) * c;
        const dstIdx = (y * width + x) * 4;
        const rVal = data[srcIdx];
        const gVal = data[srcIdx + 1];
        const bVal = data[srcIdx + 2];

        // Background is ~ rgb(255, 255, 251)
        const diff = (255 - rVal) + (255 - gVal) + (251 - bVal);
        let alpha = 0;
        if (diff > 18) {
          alpha = Math.min(255, Math.round(diff * 1.55));
        }
        buf[dstIdx] = rVal;
        buf[dstIdx + 1] = gVal;
        buf[dstIdx + 2] = bVal;
        buf[dstIdx + 3] = alpha;
      }
    }
    return sharp(buf, { raw: { width, height, channels: 4 } }).png().toBuffer();
  };

  const swagrPng = await extractClean(200, 808, 440, 90);
  const haPng = await extractClean(840, 808, 180, 90);

  const swagrTrimmed = await sharp(swagrPng).trim().toBuffer({ resolveWithObject: true });
  const haTrimmed = await sharp(haPng).trim().toBuffer({ resolveWithObject: true });

  // Render U in Times New Roman Bold with matching gradient
  const uSvg = `
  <svg width="120" height="90" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="uGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#0f4824" />
        <stop offset="100%" stop-color="#072d14" />
      </linearGradient>
    </defs>
    <text x="60" y="81" 
          font-family="Times New Roman" 
          font-size="117" 
          font-weight="bold" 
          text-anchor="middle" 
          fill="url(#uGrad)">U</text>
  </svg>
  `;
  const uPng = await sharp(Buffer.from(uSvg)).png().toBuffer();
  const uTrimmed = await sharp(uPng).trim().toBuffer({ resolveWithObject: true });

  const swagrW = swagrTrimmed.info.width;
  const uW = uTrimmed.info.width;
  const haW = haTrimmed.info.width;

  const gap1 = 18;
  const gap2 = 16;
  const totalW = swagrW + gap1 + uW + gap2 + haW;

  const startX = Math.round(604 - totalW / 2);
  const swagrX = startX;
  const uX = swagrX + swagrW + gap1;
  const haX = uX + uW + gap2;

  // Clean patch over SWAGROOHA with cream background
  const patchSvg = `
  <svg width="${cropSize}" height="${cropSize}" xmlns="http://www.w3.org/2000/svg">
    <rect x="180" y="802" width="850" height="98" fill="#fffffa" />
  </svg>
  `;

  const finalEmblem = await sharp(cropped)
    .composite([
      { input: Buffer.from(patchSvg), top: 0, left: 0 },
      { input: swagrTrimmed.data, top: 812, left: swagrX },
      { input: uTrimmed.data, top: 812, left: uX },
      { input: haTrimmed.data, top: 812, left: haX },
    ])
    .png()
    .toBuffer();

  const mainLogoPath = path.join(assetsDir, 'pjr-logo.png');
  const publicLogoPath = path.join(publicDir, 'logo.png');

  await sharp(finalEmblem).toFile(mainLogoPath);
  await sharp(finalEmblem).toFile(publicLogoPath);
  console.log('Saved updated PJR SWAGRUHA FOODS to pjr-logo.png and public/logo.png');

  // Generate web browser favicons at different sizes
  // 512x512 PNG
  const p512 = path.join(publicDir, 'favicon.png');
  await sharp(finalEmblem).resize(512, 512, { fit: 'contain' }).png().toFile(p512);

  // 192x192 PNG
  const p192 = path.join(publicDir, 'favicon-192x192.png');
  await sharp(finalEmblem).resize(192, 192, { fit: 'contain' }).png().toFile(p192);

  // 180x180 Apple Touch Icon
  const p180 = path.join(publicDir, 'apple-touch-icon.png');
  await sharp(finalEmblem).resize(180, 180, { fit: 'contain' }).png().toFile(p180);

  // 96x96 PNG (multiple of 48 for Google Search)
  const p96 = path.join(publicDir, 'favicon-96x96.png');
  await sharp(finalEmblem).resize(96, 96, { fit: 'contain' }).png().toFile(p96);

  // 48x48 PNG (standard Google Search favicon size)
  const p48 = path.join(publicDir, 'favicon-48x48.png');
  await sharp(finalEmblem).resize(48, 48, { fit: 'contain' }).png().toFile(p48);

  // 32x32 PNG (browser tab)
  const p32 = path.join(publicDir, 'favicon-32x32.png');
  await sharp(finalEmblem).resize(32, 32, { fit: 'contain' }).png().toFile(p32);

  // 16x16 PNG (browser tab)
  const p16 = path.join(publicDir, 'favicon-16x16.png');
  await sharp(finalEmblem).resize(16, 16, { fit: 'contain' }).png().toFile(p16);

  console.log('Saved all favicon PNG sizes');

  // Also generate multi-size ICO file for /favicon.ico (16, 32, 48)
  const ico16 = await sharp(finalEmblem).resize(16, 16, { fit: 'contain' }).png().toBuffer();
  const ico32 = await sharp(finalEmblem).resize(32, 32, { fit: 'contain' }).png().toBuffer();
  const ico48 = await sharp(finalEmblem).resize(48, 48, { fit: 'contain' }).png().toBuffer();

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
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const dirSize = 16 * count;
  let offset = 6 + dirSize;

  const dirEntries = [];
  const imageBuffers = [];

  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 0);
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(img.buffer.length, 8);
    entry.writeUInt32LE(offset, 12);

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
