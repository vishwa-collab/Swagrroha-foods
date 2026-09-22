const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function makeHdLogo() {
  const assetsDir = path.join(__dirname, '../assets');
  const publicDir = path.join(__dirname, '../public');
  const inputLogo = path.join(assetsDir, 'pjr-logo.png');

  // Load the 1208x1208 logo
  const { data, info } = await sharp(inputLogo).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const c = info.channels;

  // Center of circle: 604, 604
  const cx = 604;
  const cy = 604;
  const innerRadius = 570; // Inside the green/gold rings

  // Create a clean pure white background buffer
  // For each pixel inside the circle:
  // If it's the cream/off-white background, we turn it into pure brilliant white (255, 255, 255).
  // We keep the green text, gold rings, and green leaves ultra vibrant with enhanced contrast and sharpness.
  const outBuf = Buffer.alloc(w * h * 4);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * c;
      const outIdx = (y * w + x) * 4;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      if (a === 0) {
        outBuf[outIdx] = 0;
        outBuf[outIdx + 1] = 0;
        outBuf[outIdx + 2] = 0;
        outBuf[outIdx + 3] = 0;
        continue;
      }

      const dist = Math.hypot(x - cx, y - cy);

      // If inside the circle
      if (dist <= innerRadius) {
        // Measure how light the pixel is
        // Cream background in original has r > 235, g > 235, b > 220
        const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
        
        if (brightness > 230) {
          // It's background! Transition smoothly to pure white (255, 255, 255)
          const factor = Math.min(1, (brightness - 230) / 20);
          outBuf[outIdx] = Math.round(r * (1 - factor) + 255 * factor);
          outBuf[outIdx + 1] = Math.round(g * (1 - factor) + 255 * factor);
          outBuf[outIdx + 2] = Math.round(b * (1 - factor) + 255 * factor);
          outBuf[outIdx + 3] = 255;
        } else if (r < 70 && g > 30 && b < 70) {
          // Forest green letters or leaves -> deepen slightly for crisp punchy contrast
          outBuf[outIdx] = Math.max(0, Math.round(r * 0.92));
          outBuf[outIdx + 1] = Math.round(g * 1.02);
          outBuf[outIdx + 2] = Math.max(0, Math.round(b * 0.88));
          outBuf[outIdx + 3] = 255;
        } else {
          // Gold / other elements
          outBuf[outIdx] = r;
          outBuf[outIdx + 1] = g;
          outBuf[outIdx + 2] = b;
          outBuf[outIdx + 3] = 255;
        }
      } else {
        // Outer rings and edge
        outBuf[outIdx] = r;
        outBuf[outIdx + 1] = g;
        outBuf[outIdx + 2] = b;
        outBuf[outIdx + 3] = a;
      }
    }
  }

  // Create crisp 1208x1208
  const pureWhiteLogo = await sharp(outBuf, { raw: { width: w, height: h, channels: 4 } })
    .sharpen({ sigma: 0.8, m1: 0.3, m2: 1.5 })
    .png()
    .toBuffer();

  // Create Ultra-HD 2416x2416 version using Lanczos3 interpolation with subtle edge enhancement
  const hd2400 = await sharp(pureWhiteLogo)
    .resize(2416, 2416, { kernel: 'lanczos3' })
    .sharpen({ sigma: 1.2, m1: 0.5, m2: 2.0 })
    .png()
    .toBuffer();

  // Save HD logo files
  const hdLogoPath = path.join(assetsDir, 'pjr-logo-hd.png');
  const projectRootLogo = path.join(__dirname, '../../pjr-swagruha-logo-hd.png');
  const artifactLogo = 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\c256070b-2340-403b-940d-c1a038c9f860\\pjr-swagruha-logo-hd.png';

  await sharp(hd2400).toFile(hdLogoPath);
  await sharp(hd2400).toFile(projectRootLogo);
  await sharp(hd2400).toFile(artifactLogo);

  // Also update standard pjr-logo.png and public/logo.png with the pure white clean version
  await sharp(pureWhiteLogo).toFile(path.join(assetsDir, 'pjr-logo.png'));
  await sharp(pureWhiteLogo).toFile(path.join(publicDir, 'logo.png'));
  await sharp(pureWhiteLogo).toFile('C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\c256070b-2340-403b-940d-c1a038c9f860\\pjr-swagruha-logo.png');

  console.log('Saved all HD logos successfully!');
}

makeHdLogo().catch(console.error);
