/**
 * make-promo-poster.cjs
 * Generates a promotional poster using real product images + logo via sharp compositing.
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const assetsDir = path.join(__dirname, '../assets');
const publicDir = path.join(__dirname, '../public');

const W = 1080;
const H = 1920;

const GREEN      = '#1B4D2E';
const GOLD       = '#D4AF37';
const ORANGE     = '#E8870A';
const WHITE      = '#FFFFFF';
const LIGHT_GOLD = '#F5E49C';

const CELL = 280;
const GAP  = 16;
const COL_START = (W - (3 * CELL + 2 * GAP)) / 2;
const ROW_START = 490;

const products = [
  { file: 'Murkullu hot item.png',          label: 'Murukulu' },
  { file: 'potharekkalu sweets.png',        label: 'Pootharekulu' },
  { file: 'gujiya sweet item.png',          label: 'Gujiya' },
  { file: 'palliladdu sweets.png',          label: 'Palli Laddu' },
  { file: 'yellow sakinnalu hot item.png',  label: 'Yellow Sakinalu' },
  { file: 'chakodi hot item.png',           label: 'Chakodi' },
  { file: 'harshallu sweet item.png',       label: 'Harshallu' },
  { file: 'mixture hot item.png',           label: 'Mixture' },
  { file: 'laddu sweet item.png',           label: 'Laddu' },
];

function makeSvg(width, height, content) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${content}</svg>`);
}

async function roundedImage(imgPath, size, radius = 24) {
  const mask = makeSvg(size, size,
    `<rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/>`
  );
  const img = await sharp(imgPath)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .toBuffer();
  return sharp(img)
    .composite([{ input: await sharp(mask).png().toBuffer(), blend: 'dest-in' }])
    .png()
    .toBuffer();
}

async function makePoster() {
  console.log('Building promo poster with real product images...');

  const pillData = products.map((p, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = COL_START + col * (CELL + GAP) + CELL / 2;
    const cy = ROW_START + row * (CELL + GAP + 36) + CELL + 22;
    const pillW = Math.min(p.label.length * 12 + 24, CELL);
    return `
      <rect x="${cx - pillW/2}" y="${cy - 16}" width="${pillW}" height="30" rx="15" ry="15" fill="${GREEN}"/>
      <rect x="${cx - pillW/2}" y="${cy - 16}" width="${pillW}" height="30" rx="15" ry="15" fill="none" stroke="${GOLD}" stroke-width="1.2" opacity="0.7"/>
      <text x="${cx}" y="${cy + 5}" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="${WHITE}" text-anchor="middle">${p.label}</text>`;
  }).join('\n');

  const frameData = products.map((_, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = COL_START + col * (CELL + GAP);
    const y = ROW_START + row * (CELL + GAP + 36);
    return `<rect x="${x-3}" y="${y-3}" width="${CELL+6}" height="${CELL+6}" rx="28" ry="28" fill="none" stroke="${GOLD}" stroke-width="2.5" opacity="0.8"/>`;
  }).join('\n');

  const bgSvg = makeSvg(W, H, `
    <rect width="${W}" height="${H}" fill="${GREEN}"/>
    <path d="M0,0 L${W},0 L${W},230 Q${W/2},310 0,230 Z" fill="${ORANGE}"/>
    <circle cx="${W/2}" cy="140" r="110" fill="none" stroke="${GOLD}" stroke-width="1.5" opacity="0.25"/>
    <circle cx="${W/2}" cy="140" r="90"  fill="none" stroke="${GOLD}" stroke-width="1"   opacity="0.2"/>
    <circle cx="60"    cy="560" r="90"  fill="none" stroke="${GOLD}" stroke-width="1"   opacity="0.15"/>
    <circle cx="${W-60}" cy="560" r="90" fill="none" stroke="${GOLD}" stroke-width="1" opacity="0.15"/>
    <rect x="14" y="14" width="${W-28}" height="${H-28}" rx="12" ry="12" fill="none" stroke="${GOLD}" stroke-width="3" opacity="0.6"/>
    <rect x="22" y="22" width="${W-44}" height="${H-44}" rx="10" ry="10" fill="none" stroke="${GOLD}" stroke-width="1" opacity="0.3"/>
    <text x="${W/2}" y="285" font-family="Georgia, serif" font-size="72" font-weight="bold" fill="${GOLD}" text-anchor="middle">Authentic Telugu</text>
    <text x="${W/2}" y="368" font-family="Georgia, serif" font-size="72" font-weight="bold" fill="${GOLD}" text-anchor="middle">Homemade Flavours</text>
    <text x="${W/2}" y="430" font-family="sans-serif" font-size="36" font-weight="500" fill="${LIGHT_GOLD}" text-anchor="middle" opacity="0.95">తెలుగు ఇంటి వంటకాలు</text>
    <line x1="80" y1="460" x2="${W-80}" y2="460" stroke="${GOLD}" stroke-width="1.5" opacity="0.5"/>
    ${frameData}
    ${pillData}
    <line x1="40" y1="${H - 370}" x2="${W-40}" y2="${H - 370}" stroke="${GOLD}" stroke-width="1.5" opacity="0.5"/>
    <text x="${W/2}" y="${H-325}" font-family="Arial,sans-serif" font-size="26" font-weight="700" fill="${GOLD}" text-anchor="middle">100% Homemade  |  No Preservatives</text>
    <text x="${W/2}" y="${H-282}" font-family="Arial,sans-serif" font-size="26" font-weight="700" fill="${LIGHT_GOLD}" text-anchor="middle">250g to 2kg Packs  |  Scheduled Delivery</text>
    <text x="${W/2}" y="${H-228}" font-family="Arial,sans-serif" font-size="25" font-weight="600" fill="${WHITE}" text-anchor="middle" opacity="0.9">Hayathnagar to LB Nagar to Ibrahimpatnam</text>
    <line x1="80" y1="${H-196}" x2="${W-80}" y2="${H-196}" stroke="${GOLD}" stroke-width="1" opacity="0.4"/>
    <text x="${W/2 - 80}" y="${H-148}" font-family="Arial,sans-serif" font-size="30" font-weight="900" fill="${GOLD}" text-anchor="middle">+91 81251 54114</text>
    <text x="${W/2 + 170}" y="${H-148}" font-family="Arial,sans-serif" font-size="26" font-weight="700" fill="${WHITE}" text-anchor="middle">pjrswagrooha.in</text>
    <text x="${W/2}" y="${H-88}" font-family="Georgia,serif" font-size="24" font-style="italic" fill="${LIGHT_GOLD}" text-anchor="middle" opacity="0.85">Taste you can Trust</text>
  `);

  let poster = await sharp(bgSvg).png().toBuffer();

  const logoPath = path.join(assetsDir, 'pjr-logo.png');
  const logoSize = 175;
  const logoBuf = await sharp(logoPath)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();

  const logoCircleSvg = makeSvg(logoSize + 12, logoSize + 12,
    `<circle cx="${(logoSize+12)/2}" cy="${(logoSize+12)/2}" r="${(logoSize+12)/2}" fill="white"/>
     <circle cx="${(logoSize+12)/2}" cy="${(logoSize+12)/2}" r="${(logoSize+12)/2 - 3}" fill="none" stroke="${GOLD}" stroke-width="3"/>`
  );
  const logoCircleBuf = await sharp(await sharp(logoCircleSvg).png().toBuffer())
    .composite([{ input: logoBuf, left: 6, top: 6 }])
    .png()
    .toBuffer();

  const composites = [];
  composites.push({
    input: logoCircleBuf,
    left: Math.round((W - (logoSize + 12)) / 2),
    top: 30,
  });

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = Math.round(COL_START + col * (CELL + GAP));
    const y = Math.round(ROW_START + row * (CELL + GAP + 36));
    const imgPath = path.join(assetsDir, p.file);
    if (!fs.existsSync(imgPath)) {
      console.warn(`  skip missing: ${p.file}`);
      continue;
    }
    const cellBuf = await roundedImage(imgPath, CELL, 24);
    composites.push({ input: cellBuf, left: x, top: y });
    console.log(`  + ${p.label}`);
  }

  poster = await sharp(poster)
    .composite(composites)
    .jpeg({ quality: 96 })
    .toBuffer();

  const outAssets = path.join(assetsDir, 'promo-poster.jpg');
  const outPublic = path.join(publicDir, 'promo-poster.jpg');
  const outRoot   = path.join(__dirname, '../../pjr-promo-poster.jpg');

  await sharp(poster).toFile(outAssets);
  await sharp(poster).toFile(outPublic);
  await sharp(poster).toFile(outRoot);

  console.log('\nDone!');
  console.log('  ->', outAssets);
  console.log('  ->', outPublic);
  console.log('  ->', outRoot);
}

makePoster().catch(err => {
  console.error(err);
  process.exit(1);
});
