const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ASSETS_DIR = path.join(__dirname, 'assets');
const SOURCE_IMAGE = path.join(ASSETS_DIR, 'logo1.png');

async function generateIcons() {
  try {
    console.log('Generating icons from:', SOURCE_IMAGE);
    
    // 1. Standard Icon (1024x1024)
    await sharp(SOURCE_IMAGE)
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png({ quality: 80, compressionLevel: 9, effort: 10 })
      .toFile(path.join(ASSETS_DIR, 'icon.png'));
    console.log('✓ icon.png generated');

    // 2. Adaptive Icon (1024x1024) - Foreground
    await sharp(SOURCE_IMAGE)
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png({ quality: 80, compressionLevel: 9, effort: 10 })
      .toFile(path.join(ASSETS_DIR, 'adaptive-icon.png'));
    console.log('✓ adaptive-icon.png generated');

    // 3. Favicon (48x48)
    await sharp(SOURCE_IMAGE)
      .resize(48, 48)
      .png({ quality: 80, compressionLevel: 9, effort: 10 })
      .toFile(path.join(ASSETS_DIR, 'favicon.png'));
    console.log('✓ favicon.png generated');

    // 4. Splash Image (keeping it same as icon for now but with background)
    await sharp(SOURCE_IMAGE)
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png({ quality: 80, compressionLevel: 9, effort: 10 })
      .toFile(path.join(ASSETS_DIR, 'splash.png'));
    console.log('✓ splash.png generated');

    console.log('\nAll icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
