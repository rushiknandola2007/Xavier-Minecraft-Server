// Generates assets/icon.png (64x64) and assets/icon.ico (multi-size 16/32/48/64)
// using only Node built-ins (fs, zlib). Grass-block pixel art, 16x16 logical pixels.
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT_DIR = path.join(__dirname, '..', 'assets');

// ---------- CRC32 ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

// ---------- PNG encoder (8-bit RGBA, no interlace) ----------
function encodePng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  // compression/filter/interlace = 0
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 4);
    raw[rowStart] = 0; // filter: none
    rgba.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const iend = Buffer.alloc(0);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', iend)
  ]);
}

// ---------- Grass block art (16x16 logical pixels) ----------
const GREEN = ['#5e9c40', '#64a345', '#6aae4e', '#74b557', '#549137'];
const DIRT  = ['#866043', '#79553a', '#8f6a4a', '#6e4b2e', '#936f4f'];
const GRASS_EDGE = '#4f8a35';

function hexRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

// Deterministic per-pixel shade picker
function pick(palette, x, y, salt) {
  const h = (x * 31 + y * 17 + salt * 13) % palette.length;
  return palette[(h + palette.length) % palette.length];
}

// Render a `size`x`size` RGBA buffer (size must be a multiple of 16 for crisp pixels)
function renderGrass(size) {
  const scale = size / 16;
  const rgba = Buffer.alloc(size * size * 4);

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const lx = Math.floor(px / scale);
      const ly = Math.floor(py / scale);
      const i = (py * size + px) * 4;

      let color;
      if (ly < 4) {
        // Grass top: mostly green, a few dirt flecks near the bottom edge
        const fleck = (lx * 7 + ly * 11) % 23 === 0 && ly >= 2;
        color = fleck ? pick(DIRT, lx, ly, 3) : pick(GREEN, lx, ly, 1);
        // Darker grass "teeth" hanging over the dirt edge
        if (ly === 3 && (lx * 5 + ly) % 4 === 0) color = GRASS_EDGE;
      } else {
        // Dirt body with occasional darker/lighter speckles
        color = pick(DIRT, lx, ly, 2);
        if ((lx * 3 + ly * 7) % 19 === 0) color = DIRT[3];
        if ((lx + ly * 5) % 29 === 0) color = DIRT[4];
      }

      const [r, g, b] = hexRgb(color);
      rgba[i] = r; rgba[i + 1] = g; rgba[i + 2] = b; rgba[i + 3] = 255;
    }
  }
  return rgba;
}

// ---------- ICO container (multi-size, PNG-compressed entries) ----------
function encodeIco(pngs) {
  // pngs: [{size, data}]
  const count = pngs.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;
  const entries = [];
  const blobs = [];
  for (const p of pngs) {
    entries.push({ size: p.size, len: p.data.length, offset });
    blobs.push(p.data);
    offset += p.data.length;
  }

  const dir = Buffer.alloc(headerSize);
  dir.writeUInt16LE(0, 0);      // reserved
  dir.writeUInt16LE(1, 2);      // type: icon
  dir.writeUInt16LE(count, 4);  // image count

  let pos = 6;
  for (const e of entries) {
    dir[pos] = e.size >= 256 ? 0 : e.size;       // width
    dir[pos + 1] = e.size >= 256 ? 0 : e.size;   // height
    dir[pos + 2] = 0;                            // palette colors
    dir[pos + 3] = 0;                            // reserved
    dir.writeUInt16LE(1, pos + 4);               // color planes
    dir.writeUInt16LE(32, pos + 6);              // bit count
    dir.writeUInt32LE(e.len, pos + 8);           // bytes in resource
    dir.writeUInt32LE(e.offset, pos + 12);       // image offset
    pos += 16;
  }

  return Buffer.concat([dir, ...blobs]);
}

// ---------- Build ----------
fs.mkdirSync(OUT_DIR, { recursive: true });

const sizes = [16, 32, 48, 64];
const pngs = sizes.map(size => ({
  size,
  data: encodePng(size, size, renderGrass(size))
}));

const iconPng = pngs.find(p => p.size === 64).data;
const iconIco = encodeIco(pngs);

fs.writeFileSync(path.join(OUT_DIR, 'icon.png'), iconPng);
fs.writeFileSync(path.join(OUT_DIR, 'icon.ico'), iconIco);

console.log(`Wrote ${path.join(OUT_DIR, 'icon.png')} (${iconPng.length} bytes)`);
console.log(`Wrote ${path.join(OUT_DIR, 'icon.ico')} (${iconIco.length} bytes, sizes: ${sizes.join('/')})`);
