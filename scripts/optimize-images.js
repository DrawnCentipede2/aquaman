const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Image optimization script
async function optimizeImages() {
  const publicDir = path.join(__dirname, '../public');
  const images = [
    'Nightlife.jpg',
    'Food.jpg', 
    'Family.jpg',
    'Adventure.jpg',
    'Romantic.jpg',
    'Hidden_Gems.jpg'
  ];

  console.log('🖼️ Starting image optimization...');

  for (const imageName of images) {
    const inputPath = path.join(publicDir, imageName);
    
    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️ Skipping ${imageName} - file not found`);
      continue;
    }

    console.log(`📸 Optimizing ${imageName}...`);

    try {
      // Create WebP version
      await sharp(inputPath)
        .webp({ quality: 80 })
        .toFile(path.join(publicDir, imageName.replace('.jpg', '.webp')));

      // Create AVIF version
      await sharp(inputPath)
        .avif({ quality: 80 })
        .toFile(path.join(publicDir, imageName.replace('.jpg', '.avif')));

      // Create responsive sizes
      const sizes = [
        { width: 400, suffix: '-sm' },
        { width: 800, suffix: '-md' },
        { width: 1200, suffix: '-lg' }
      ];

      for (const size of sizes) {
        await sharp(inputPath)
          .resize(size.width, null, { withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(path.join(publicDir, imageName.replace('.jpg', `${size.suffix}.webp`)));
      }

      console.log(`✅ Optimized ${imageName}`);
    } catch (error) {
      console.error(`❌ Error optimizing ${imageName}:`, error.message);
    }
  }

  console.log('🎉 Image optimization complete!');
}

// Run optimization
optimizeImages().catch(console.error); 