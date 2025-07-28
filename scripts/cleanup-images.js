const fs = require('fs');
const path = require('path');

// Cleanup script to remove unnecessary image formats
async function cleanupImages() {
  const publicDir = path.join(__dirname, '../public');
  
  console.log('🧹 Starting image cleanup...');

  // Keep only these formats - remove the rest
  const keepFormats = [
    '.jpg',    // Original JPEG files
    '.webp',   // WebP versions (no size suffix)
    '.avif'    // AVIF versions (no size suffix)
  ];

  // Remove these unnecessary formats
  const removePatterns = [
    '-sm.webp',  // Small WebP versions
    '-md.webp',  // Medium WebP versions  
    '-lg.webp'   // Large WebP versions
  ];

  const files = fs.readdirSync(publicDir);
  
  for (const file of files) {
    if (file.endsWith('.jpg') || file.endsWith('.webp') || file.endsWith('.avif')) {
      const filePath = path.join(publicDir, file);
      
      // Check if file matches removal patterns
      const shouldRemove = removePatterns.some(pattern => file.includes(pattern));
      
      if (shouldRemove) {
        try {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Removed: ${file}`);
        } catch (error) {
          console.error(`❌ Error removing ${file}:`, error.message);
        }
      } else {
        console.log(`✅ Kept: ${file}`);
      }
    }
  }

  console.log('🎉 Image cleanup complete!');
  console.log('\n📋 What we kept:');
  console.log('- Original .jpg files (fallback)');
  console.log('- .webp files (optimized, 80% smaller)');
  console.log('- .avif files (most optimized, 90% smaller)');
  console.log('\n📋 What we removed:');
  console.log('- Size-specific versions (-sm, -md, -lg)');
  console.log('- Next.js Image component handles resizing automatically');
}

// Run cleanup
cleanupImages().catch(console.error); 