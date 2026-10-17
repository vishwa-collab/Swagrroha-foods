const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const baseIcon = path.join(__dirname, '../public/favicon.png');
const resDir = path.join(__dirname, '../android/app/src/main/res');

const sizes = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

async function generate() {
  for (const { dir, size } of sizes) {
    const targetDir = path.join(resDir, dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Square / rounded square
    await sharp(baseIcon)
      .resize(size, size, { fit: 'contain' })
      .toFile(path.join(targetDir, 'ic_launcher.png'));

    // Round icon
    await sharp(baseIcon)
      .resize(size, size, { fit: 'contain' })
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));

    // Foreground icon for adaptive icons
    await sharp(baseIcon)
      .resize(size, size, { fit: 'contain' })
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));

    console.log(`Generated ${dir} (${size}x${size})`);
  }
}

generate().catch(console.error);
