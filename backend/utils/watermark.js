import sharp from "sharp";
import { exec } from "child_process";
import { promisify } from "util";
const execPromise = promisify(exec);

// Enhanced watermark for ZLS artists
export async function addZLSWatermarkToImage(inputPath, outputPath, username, artistName) {
  const svgBuffer = Buffer.from(`
    <svg width="350" height="90" xmlns="http://www.w3.org/2000/svg">
      <rect width="350" height="90" fill="black" fill-opacity="0.7" rx="10" ry="10"/>
      <rect width="350" height="30" fill="#FFD700" rx="10" ry="10" y="0"/>
      <text x="175" y="22" font-family="Arial" font-size="14" fill="black" text-anchor="middle" font-weight="bold">ZEUSLIVESTUDIO ARTIST</text>
      <text x="175" y="55" font-family="Arial" font-size="14" fill="#FFD700" text-anchor="middle">@${username}</text>
      <text x="175" y="75" font-family="Arial" font-size="10" fill="white" text-anchor="middle">${artistName}</text>
    </svg>
  `);

  await sharp(inputPath)
    .composite([{ input: svgBuffer, gravity: "southeast", blend: "over" }])
    .toFile(outputPath);
}

// Standard STEEZE watermark for non-ZLS
export async function addStandardWatermarkToImage(inputPath, outputPath, username) {
  const svgBuffer = Buffer.from(`
    <svg width="200" height="50" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="50" fill="black" fill-opacity="0.6" rx="8" ry="8"/>
      <text x="100" y="30" font-family="Arial" font-size="14" fill="#FFD700" text-anchor="middle">@${username} • STEEZE</text>
    </svg>
  `);

  await sharp(inputPath)
    .composite([{ input: svgBuffer, gravity: "southeast", blend: "over" }])
    .toFile(outputPath);
}

// ZLS branded watermark for video
export async function addZLSWatermarkToVideo(inputPath, outputPath, username, artistName) {
  const filterComplex = `drawtext=text='ZEUSLIVESTUDIO ARTIST':fontcolor=#FFD700:fontsize=28:x=w-tw-20:y=h-th-70:box=1:boxcolor=black@0.7:boxborderw=8,drawtext=text='@${username}':fontcolor=white:fontsize=20:x=w-tw-20:y=h-th-40:box=1:boxcolor=black@0.5:boxborderw=5`;

  await execPromise(
    `ffmpeg -i "${inputPath}" -vf "${filterComplex}" -codec:a copy "${outputPath}" -y`
  );
}

// Standard video watermark
export async function addStandardWatermarkToVideo(inputPath, outputPath, username) {
  const filterComplex = `drawtext=text='@${username} • STEEZE':fontcolor=#FFD700:fontsize=24:x=w-tw-10:y=h-th-10:box=1:boxcolor=black@0.6:boxborderw=5`;

  await execPromise(
    `ffmpeg -i "${inputPath}" -vf "${filterComplex}" -codec:a copy "${outputPath}" -y`
  );
}

// ZLS branded audio watermark
export async function addZLSWatermarkToAudio(inputPath, outputPath, username, artistName) {
  await execPromise(
    `ffmpeg -i "${inputPath}" -metadata artist="@${username} on STEEZE" -metadata album="ZeusLiveStudio" -metadata comment="ZeusLiveStudio Artist • STEEZE Verified" -codec copy "${outputPath}" -y`
  );
}

// Standard audio watermark
export async function addStandardWatermarkToAudio(inputPath, outputPath, username) {
  await execPromise(
    `ffmpeg -i "${inputPath}" -metadata artist="@${username} on STEEZE" -metadata comment="STEEZE Verified Creator" -codec copy "${outputPath}" -y`
  );
}

// Keep old function names for backward compatibility
export async function addWatermarkToImage(inputPath, outputPath, username) {
  return addStandardWatermarkToImage(inputPath, outputPath, username);
}

export async function addWatermarkToVideo(inputPath, outputPath, username) {
  return addStandardWatermarkToVideo(inputPath, outputPath, username);
}

export async function addWatermarkToAudio(inputPath, outputPath, username) {
  return addStandardWatermarkToAudio(inputPath, outputPath, username);
}