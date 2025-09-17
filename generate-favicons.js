#!/usr/bin/env node

/**
 * Favicon Generator Script
 * 
 * Generates all required favicon formats from an SVG source
 * Usage: node generate-favicons.js <svg-path> [output-dir]
 * 
 * Example: node generate-favicons.js apps/web/src/app/icon.svg apps/web
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const CONFIG = {
  // PNG sizes for various use cases
  pngSizes: {
    // All PNG icons - use dark icon for consistency and reliability
    'icon.png': { size: 96, outputDir: 'src/app', source: 'dark' },
    'favicon-32x32.png': { size: 32, outputDir: 'src/app', source: 'dark' },
    'apple-icon.png': { size: 180, outputDir: 'src/app', source: 'dark' },
    'web-app-manifest-192x192.png': { size: 192, outputDir: 'public', source: 'dark' },
    'web-app-manifest-512x512.png': { size: 512, outputDir: 'public', source: 'dark' }
  },

  // ICO config (traditional favicon)
  ico: {
    filename: 'favicon.ico',
    outputDir: 'src/app',
    source: 'dark'
  }
};

async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dirPath}`);
  }
}

async function generatePngFromSvg(svgPath, outputPath, size) {
  try {
    await sharp(svgPath)
      .resize(size, size)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(outputPath);
    
    console.log(`✅ Generated: ${outputPath} (${size}x${size})`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to generate ${outputPath}:`, error.message);
    return false;
  }
}

async function generateIcoFromPngs(pngPaths, outputPath) {
  try {
    // For ICO generation, we'll use the largest PNG and let sharp handle it
    // ICO format is more complex, but sharp can create a basic one
    const largestPng = pngPaths.find(p => p.includes('48x48')) || pngPaths[0];
    
    await sharp(largestPng)
      .resize(32, 32) // Standard favicon size
      .toFormat('png')
      .toFile(outputPath);
    
    console.log(`✅ Generated: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to generate ICO:`, error.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error(`
Usage: node generate-favicons.js <icon-dark-svg-path> [base-output-dir]

The script will use icon-dark.svg for all favicon generation.

Examples:
  node generate-favicons.js apps/web/src/app/icon.svg apps/web
  node generate-favicons.js ./icon.svg ./
    `);
    process.exit(1);
  }

  const iconDarkSvgPath = args[0];
  const baseOutputDir = args[1] || '.';

  // Use only the icon-dark.svg for all favicon generation
  const sources = {
    dark: iconDarkSvgPath
  };

  // Check if the SVG file exists
  try {
    await fs.access(iconDarkSvgPath);
    console.log(`🎨 Using icon-dark SVG: ${iconDarkSvgPath}`);
  } catch {
    console.error(`❌ SVG file not found: ${iconDarkSvgPath}`);
    process.exit(1);
  }

  console.log(`📁 Output base directory: ${baseOutputDir}\n`);

  const generatedPngs = [];

  // Generate PNG files
  for (const [filename, config] of Object.entries(CONFIG.pngSizes)) {
    const outputDir = path.join(baseOutputDir, config.outputDir);
    const outputPath = path.join(outputDir, filename);
    const sourceSvg = sources[config.source];
    
    await ensureDirectoryExists(outputDir);
    
    console.log(`🔄 Using ${config.source} source for ${filename}`);
    const success = await generatePngFromSvg(sourceSvg, outputPath, config.size);
    if (success) {
      generatedPngs.push(outputPath);
    }
  }

  // Generate ICO file
  const icoOutputDir = path.join(baseOutputDir, CONFIG.ico.outputDir);
  const icoOutputPath = path.join(icoOutputDir, CONFIG.ico.filename);
  const icoSourceSvg = sources[CONFIG.ico.source];
  
  await ensureDirectoryExists(icoOutputDir);
  
  console.log(`🔄 Using ${CONFIG.ico.source} source for ${CONFIG.ico.filename}`);
  await sharp(icoSourceSvg)
    .resize(32, 32)
    .toFormat('png') // Keep as PNG but rename to .ico for compatibility
    .toFile(icoOutputPath);
  console.log(`✅ Generated: ${icoOutputPath}`);

  console.log(`\n🎉 Favicon generation complete!`);
  console.log(`📊 Generated ${generatedPngs.length + 1} files\n`);
  
  console.log(`📋 Files created:`);
  [...generatedPngs, icoOutputPath].forEach(file => {
    console.log(`   ${file}`);
  });

  console.log(`\n✨ Your favicons are ready for deployment!`);
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

if (require.main === module) {
  main();
}

module.exports = { generatePngFromSvg, ensureDirectoryExists };
