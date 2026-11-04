import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const iconsDir = path.join(process.cwd(), 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. Create scalable SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#064e3b"/>
      <stop offset="50%" stop-color="#022c22"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#ca8a04"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#emeraldGrad)"/>
  <rect x="24" y="24" width="464" height="464" rx="104" fill="none" stroke="url(#goldGrad)" stroke-width="8" opacity="0.6"/>
  <!-- Elegant Monogram A -->
  <text x="256" y="340" font-family="Georgia, serif" font-size="280" font-weight="bold" fill="url(#goldGrad)" text-anchor="middle">A</text>
  <text x="256" y="420" font-family="-apple-system, sans-serif" font-size="32" font-weight="600" fill="#a7f3d0" text-anchor="middle" letter-spacing="6">ARHAM</text>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent);

// 2. Pure Node.js PNG Generator
function createPng(size, textChar = 'A') {
  const width = size;
  const height = size;

  // CRC32 table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }

  function createChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type, 'ascii');
    const typeAndData = Buffer.concat([typeBuf, data]);

    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(typeAndData), 0);

    return Buffer.concat([len, typeAndData, crcBuf]);
  }

  // Header: Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR: 13 bytes
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data: height rows, each: 1 filter byte (0) + width * 4 bytes (RGBA)
  const rowStride = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowStride);

  // Background: Deep Emerald #064E3B (R: 6, G: 78, B: 59)
  // Border & Monogram: Warm Amber/Gold #F59E0B (R: 245, G: 158, B: 11)
  const rBg = 6, gBg = 78, bBg = 59;
  const rGold = 245, gGold = 158, bGold = 11;
  const rLight = 167, gLight = 243, bLight = 208; // mint

  const center = size / 2;
  const radius = size * 0.44;
  const cornerRadius = size * 0.22;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowStride;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Rounded rectangle mask
      const dx = Math.max(Math.abs(x - center) - (center - cornerRadius), 0);
      const dy = Math.max(Math.abs(y - center) - (center - cornerRadius), 0);
      const isOutside = Math.sqrt(dx * dx + dy * dy) > cornerRadius;

      if (isOutside) {
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
        continue;
      }

      // Draw stylized "A" in the center:
      // Left leg: from (center, top) to (center - baseWidth, bottom)
      // Right leg: from (center, top) to (center + baseWidth, bottom)
      // Crossbar: at ~62% height
      const relX = (x - center) / (size * 0.3);
      const relY = (y - size * 0.28) / (size * 0.44); // 0 at top, 1 at bottom

      let isA = false;
      const thickness = 0.22;

      if (relY >= 0 && relY <= 1) {
        // Left leg: relX should be close to -relY * 0.65
        const leftDist = Math.abs(relX - (-relY * 0.65));
        // Right leg: relX should be close to relY * 0.65
        const rightDist = Math.abs(relX - (relY * 0.65));
        // Crossbar: relY ~ 0.65 and relX between legs
        const isCrossbar = Math.abs(relY - 0.65) < thickness * 0.5 && relX > -0.5 && relX < 0.5;

        if (leftDist < thickness || rightDist < thickness || isCrossbar) {
          isA = true;
        }
      }

      // Inner Gold Border (2px relative)
      const borderDist = Math.min(x, y, width - 1 - x, height - 1 - y);
      const isBorder = borderDist >= 8 && borderDist <= (size > 200 ? 14 : 10);

      if (isA) {
        rawData[pxOffset] = rGold;
        rawData[pxOffset + 1] = gGold;
        rawData[pxOffset + 2] = bGold;
        rawData[pxOffset + 3] = 255;
      } else if (isBorder) {
        rawData[pxOffset] = rGold;
        rawData[pxOffset + 1] = gGold;
        rawData[pxOffset + 2] = bGold;
        rawData[pxOffset + 3] = 160;
      } else {
        // Subtle emerald vertical gradient
        const gradFactor = (y / height) * 0.3;
        rawData[pxOffset] = Math.max(2, Math.round(rBg * (1 - gradFactor)));
        rawData[pxOffset + 1] = Math.max(30, Math.round(gBg * (1 - gradFactor)));
        rawData[pxOffset + 2] = Math.max(20, Math.round(bBg * (1 - gradFactor)));
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate 192x192 and 512x512
const png192 = createPng(192);
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), png192);

const png512 = createPng(512);
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), png512);

// Also generate apple-touch-icon
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), png192);

console.log('✓ Successfully generated PWA icons in public/icons/');

