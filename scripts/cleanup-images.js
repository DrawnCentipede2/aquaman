const fs = require('fs');
const path = require('path');
const { logger } = require('../lib/logger');

// Cleanup script to remove unnecessary image formats
async function cleanupImages() {
  const publicDir = path.join(__dirname, '../public');
  
  logger.log('🧹 Starting image cleanup...');

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
          logger.log(`🗑️ Removed: ${file}`);
        } catch (error) {
          logger.error(`❌ Error removing ${file}:`, error.message);
        }
      } else {
        logger.log(`✅ Kept: ${file}`);
      }
    }
  }

  logger.log('🎉 Image cleanup complete!');
  logger.log('\n📋 What we kept:');
  logger.log('- Original .jpg files (fallback)');
  logger.log('- .webp files (optimized, 80% smaller)');
  logger.log('- .avif files (most optimized, 90% smaller)');
  logger.log('\n📋 What we removed:');
  logger.log('- Size-specific versions (-sm, -md, -lg)');
  logger.log('- Next.js Image component handles resizing automatically');
}

// Run cleanup
cleanupImages().catch(logger.error); 