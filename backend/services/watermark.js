import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

// Ensure ffmpeg path is set (for Render deployment)
const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
ffmpeg.setFfmpegPath(ffmpegPath);

// STEEZE logo base64 (gold STEEZE text logo)
const STEEZE_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60">
  <text x="10" y="40" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#D4AF37" letter-spacing="3">STEEZE</text>
</svg>`;

// Create PNG from SVG for watermark
async function createLogoPNG() {
  const svgBuffer = Buffer.from(STEEZE_LOGO_SVG);
  return await sharp(svgBuffer).png().toBuffer();
}

/**
 * Apply watermark to image (JPEG, PNG)
 * Returns buffer of watermarked image
 */
export async function applyImageWatermark(imageBuffer, artistName, userType) {
  try {
    const logoBuffer = await createLogoPNG();
    const { width, height } = await sharp(imageBuffer).metadata();
    
    // Calculate watermark size (25% of image width)
    const watermarkWidth = Math.floor(width * 0.25);
    const watermarkHeight = Math.floor(watermarkWidth * 0.3);
    
    // Resize watermark
    const resizedLogo = await sharp(logoBuffer)
      .resize(watermarkWidth, watermarkHeight)
      .png()
      .toBuffer();
    
    // Create text overlay for artist name
    const textOverlay = await sharp({
      text: {
        text: `<span foreground="white">@${artistName}</span>`,
        font: 'Arial',
        fontSize: Math.floor(width * 0.03),
        rgba: true,
        width: watermarkWidth
      }
    })
      .png()
      .toBuffer();
    
    // Combine logo and text
    const combinedWatermark = await sharp(resizedLogo)
      .composite([{ input: textOverlay, top: watermarkHeight - 10, left: 0 }])
      .png()
      .toBuffer();
    
    // Apply ZLS badge if userType is zls_artist
    let finalWatermark = combinedWatermark;
    if (userType === 'zls_artist') {
      const zlsBadge = await sharp({
        text: {
          text: '<span foreground="#FFD700" font_weight="bold">ZLS</span>',
          font: 'Arial',
          fontSize: Math.floor(width * 0.025),
          rgba: true
        }
      })
        .png()
        .toBuffer();
      
      finalWatermark = await sharp(combinedWatermark)
        .composite([{ input: zlsBadge, top: -5, left: watermarkWidth - 40 }])
        .png()
        .toBuffer();
    }
    
    // Apply watermark to image (bottom-left corner, 40% opacity)
    const watermarkedImage = await sharp(imageBuffer)
      .composite([{
        input: finalWatermark,
        gravity: 'southwest',
        opacity: 0.4,
        tile: false
      }])
      .png()
      .toBuffer();
    
    return watermarkedImage;
  } catch (error) {
    console.error('Image watermark error:', error);
    return imageBuffer; // Return original if watermark fails
  }
}

/**
 * Apply watermark to video (MP4)
 * Uses ffmpeg to overlay watermark on video
 */
export async function applyVideoWatermark(videoPath, outputPath, artistName, userType) {
  return new Promise((resolve, reject) => {
    const watermarkDir = path.join(path.resolve(), 'uploads');
    if (!fs.existsSync(watermarkDir)) {
      fs.mkdirSync(watermarkDir, { recursive: true });
    }
    
    const watermarkPath = path.join(watermarkDir, `temp_watermark_${Date.now()}.png`);
    const zlsPath = path.join(watermarkDir, `temp_zls_${Date.now()}.png`);
    
    // Create watermark image
    const createWatermark = async () => {
      try {
        const logoBuffer = await createLogoPNG();
        const textBuffer = await sharp({
          text: {
            text: `<span foreground="white">@${artistName}</span>`,
            font: 'Arial',
            fontSize: 24,
            rgba: true
          }
        }).png().toBuffer();
        
        const combined = await sharp(logoBuffer)
          .composite([{ input: textBuffer, top: 40, left: 10 }])
          .png()
          .toBuffer();
        
        fs.writeFileSync(watermarkPath, combined);
        
        // Build ffmpeg command for overlay
        let filterComplex;
        
        if (userType === 'zls_artist') {
          const zlsBuffer = await sharp({
            text: {
              text: '<span foreground="#FFD700" font_weight="bold">ZLS</span>',
              font: 'Arial',
              fontSize: 20,
              rgba: true
            }
          }).png().toBuffer();
          fs.writeFileSync(zlsPath, zlsBuffer);
          filterComplex = `[0:v][1:v] overlay=W-w-20:H-h-20:enable='between(t,0,999999)'[tmp]; [tmp][2:v] overlay=W-w-90:H-h-20`;
        } else {
          filterComplex = `[0:v][1:v] overlay=W-w-20:H-h-20:enable='between(t,0,999999)'`;
        }
        
        const command = ffmpeg(videoPath)
          .input(watermarkPath)
          .outputOptions([
            '-c:v libx264',
            '-preset fast',
            '-crf 23',
            '-c:a aac',
            '-b:a 128k'
          ])
          .videoFilters(filterComplex);
        
        if (userType === 'zls_artist') {
          command.input(zlsPath);
        }
        
        command
          .on('end', () => {
            // Cleanup temp files
            try {
              if (fs.existsSync(watermarkPath)) fs.unlinkSync(watermarkPath);
              if (userType === 'zls_artist' && fs.existsSync(zlsPath)) fs.unlinkSync(zlsPath);
            } catch (e) { /* ignore cleanup errors */ }
            resolve();
          })
          .on('error', (err) => {
            console.error('FFmpeg video watermark error:', err);
            // Cleanup temp files even on error
            try {
              if (fs.existsSync(watermarkPath)) fs.unlinkSync(watermarkPath);
              if (userType === 'zls_artist' && fs.existsSync(zlsPath)) fs.unlinkSync(zlsPath);
            } catch (e) { /* ignore cleanup errors */ }
            reject(err);
          })
          .save(outputPath);
      } catch (err) {
        reject(err);
      }
    };
    
    createWatermark();
  });
}

/**
 * Apply watermark metadata to audio (MP3)
 * Adds watermark as metadata and album art
 */
export async function applyAudioWatermark(audioPath, outputPath, artistName, userType) {
  return new Promise((resolve, reject) => {
    const metadata = {
      title: 'STEEZE Watermarked Content',
      artist: artistName,
      album: userType === 'zls_artist' ? 'ZLS Artist - STEEZE' : 'STEEZE Creator',
      comment: 'Watermarked by STEEZE - Do not remove'
    };
    
    let command = ffmpeg(audioPath);
    
    // Add metadata
    Object.entries(metadata).forEach(([key, value]) => {
      command = command.outputOption(`-metadata ${key}=${value}`);
    });
    
    // Add ZLS badge metadata for zls_artist
    if (userType === 'zls_artist') {
      command = command.outputOption('-metadata ZLS_SIGNED=true');
      command = command.outputOption('-metadata ZLS_ARTIST=1');
    }
    
    command
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

/**
 * Main watermark function - determines file type and applies appropriate watermark
 */
export async function applyWatermark(fileBuffer, originalFilename, artistName, userType) {
  const ext = path.extname(originalFilename).toLowerCase();
  
  // Image files
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
    return await applyImageWatermark(fileBuffer, artistName, userType);
  }
  
  // For video and audio, we need file paths (not buffers)
  // This function is called from upload route with file path
  return { needsFilePath: true, ext };
}

export default {
  applyImageWatermark,
  applyVideoWatermark,
  applyAudioWatermark,
  applyWatermark
};