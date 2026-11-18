// scripts/generate-mock-photos.ts
import fs from 'fs';
import path from 'path';
import jpeg from 'jpeg-js';

// Daftar 20 Pelanggan Nyata dari packages/db/data/jan/ProgresCater-PW5.csv
const SAMPLE_20_CUSTOMERS = [
  { nolg: "00302600011", nama: "MARYATI SALAM", alamat: "JL.NARIPAN 1A", rute: "CD104", stma: 4830 },
  { nolg: "00401000220", nama: "KHOE A MIA", alamat: "LENGKONG BESAR NO.12", rute: "KC207", stma: 73 },
  { nolg: "00401200610", nama: "NY.ONG BIN GIOK", alamat: "LENGKONG DLM NO.3", rute: "KC206", stma: 131 },
  { nolg: "00401700903", nama: "MASNAH ALIYAH AGUS", alamat: "GG H UMARNO.25A-", rute: "KD505", stma: 45 },
  { nolg: "00402000426", nama: "AFI", alamat: "JL.CIATEULNO.74-A", rute: "KD214", stma: 682 },
  { nolg: "00402200655", nama: "K.HASIKIN", alamat: "AKIL NO.1A", rute: "KD208", stma: 1885 },
  { nolg: "00402300417", nama: "AGUS MULYANTO", alamat: "JL.AKILNO.10 PAV", rute: "KD208", stma: 942 },
  { nolg: "00402500522", nama: "SHEN MEE CHE", alamat: "JL.PUNGKUR109B", rute: "KD616", stma: 1400 },
  { nolg: "00403400090", nama: "GURNITA", alamat: "SRIMAHI NO.9", rute: "KD401", stma: 0 },
  { nolg: "00403530931", nama: "RULLIA MUTIARA", alamat: "JL.SRI SUCINO.11A-", rute: "KD412", stma: 232 },
  { nolg: "00403600060", nama: "DIDI SUPRIJADI", alamat: "SRI KUSUMAH NO.11", rute: "KD401", stma: 904 },
  { nolg: "00404300110", nama: "EDDY AFFANDI", alamat: "MURNI I NO.18", rute: "KD202", stma: 321 },
  { nolg: "00404900810", nama: "THE FELI", alamat: "BUAH BATU NO.152", rute: "KC301", stma: 93 },
  { nolg: "00405000144", nama: "IR H ARIEF DJATNIKA", alamat: "JL.TELEXNO 2B", rute: "KC301", stma: 155 },
  { nolg: "00405351231", nama: "KUSUMIYATI", alamat: "JL.H.RUBININO.1-", rute: "KC311", stma: 27 },
  { nolg: "00406001024", nama: "KURNIATI", alamat: "GG.CIJAGRA I GG. I72", rute: "KC302", stma: 457 },
  { nolg: "00406001040", nama: "WANGSIH", alamat: "JL.CIJAGRA I GG.IV", rute: "KC302", stma: 569 },
  { nolg: "00406050655", nama: "HOS JAKA SUMPENA", alamat: "SITU CIBURUY NO.6", rute: "KC303", stma: 2145 },
  { nolg: "00406100247", nama: "AMANDA PRASETIO", alamat: "PUALAMNO.8B-", rute: "KC301", stma: 140 },
  { nolg: "00406100410", nama: "RAMA W.HOFSTEEDE O.F.M.", alamat: "SURYALAYA NO 8", rute: "KC301", stma: 873 },
];

// Minimal 5x7 bitmap font for rendering text on raw pixel buffers
const FONT_5X7: Record<string, number[]> = {
  '0': [0x3e, 0x51, 0x49, 0x45, 0x3e],
  '1': [0x00, 0x42, 0x7f, 0x40, 0x00],
  '2': [0x42, 0x61, 0x51, 0x49, 0x46],
  '3': [0x21, 0x41, 0x45, 0x4b, 0x31],
  '4': [0x18, 0x14, 0x12, 0x7f, 0x10],
  '5': [0x27, 0x45, 0x45, 0x45, 0x39],
  '6': [0x3c, 0x4a, 0x49, 0x49, 0x30],
  '7': [0x01, 0x71, 0x09, 0x05, 0x03],
  '8': [0x36, 0x49, 0x49, 0x49, 0x36],
  '9': [0x06, 0x49, 0x49, 0x29, 0x1e],
  'A': [0x7e, 0x11, 0x11, 0x11, 0x7e],
  'B': [0x7f, 0x49, 0x49, 0x49, 0x36],
  'C': [0x3e, 0x41, 0x41, 0x41, 0x22],
  'D': [0x7f, 0x41, 0x41, 0x22, 0x1c],
  'E': [0x7f, 0x49, 0x49, 0x49, 0x41],
  'F': [0x7f, 0x09, 0x09, 0x09, 0x01],
  'G': [0x3e, 0x41, 0x49, 0x49, 0x7a],
  'H': [0x7f, 0x08, 0x08, 0x08, 0x7f],
  'I': [0x00, 0x41, 0x7f, 0x41, 0x00],
  'J': [0x20, 0x40, 0x41, 0x3f, 0x01],
  'K': [0x7f, 0x08, 0x14, 0x22, 0x41],
  'L': [0x7f, 0x40, 0x40, 0x40, 0x40],
  'M': [0x7f, 0x02, 0x0c, 0x02, 0x7f],
  'N': [0x7f, 0x04, 0x08, 0x10, 0x7f],
  'O': [0x3e, 0x41, 0x41, 0x41, 0x3e],
  'P': [0x7f, 0x09, 0x09, 0x09, 0x06],
  'Q': [0x3e, 0x41, 0x51, 0x21, 0x5e],
  'R': [0x7f, 0x09, 0x19, 0x29, 0x46],
  'S': [0x46, 0x49, 0x49, 0x49, 0x31],
  'T': [0x01, 0x01, 0x7f, 0x01, 0x01],
  'U': [0x3f, 0x40, 0x40, 0x40, 0x3f],
  'V': [0x1f, 0x20, 0x40, 0x20, 0x1f],
  'W': [0x7f, 0x20, 0x18, 0x20, 0x7f],
  'X': [0x63, 0x14, 0x08, 0x14, 0x63],
  'Y': [0x07, 0x08, 0x70, 0x08, 0x07],
  'Z': [0x61, 0x51, 0x49, 0x45, 0x43],
  ' ': [0x00, 0x00, 0x00, 0x00, 0x00],
  '-': [0x08, 0x08, 0x08, 0x08, 0x08],
  ':': [0x00, 0x36, 0x36, 0x00, 0x00],
  '.': [0x00, 0x60, 0x60, 0x00, 0x00],
  ',': [0x00, 0x40, 0x60, 0x00, 0x00],
  '/': [0x20, 0x10, 0x08, 0x04, 0x02],
  '#': [0x14, 0x7f, 0x14, 0x7f, 0x14],
};

function drawRect(buf: Buffer, w: number, h: number, x: number, y: number, rw: number, rh: number, r: number, g: number, b: number) {
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(w, Math.floor(x + rw));
  const y1 = Math.min(h, Math.floor(y + rh));
  for (let cy = y0; cy < y1; cy++) {
    for (let cx = x0; cx < x1; cx++) {
      const idx = (cy * w + cx) * 4;
      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = 255;
    }
  }
}

function drawCircle(buf: Buffer, w: number, h: number, cx: number, cy: number, radius: number, r: number, g: number, b: number) {
  const r2 = radius * radius;
  const x0 = Math.max(0, Math.floor(cx - radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const x1 = Math.min(w, Math.floor(cx + radius));
  const y1 = Math.min(h, Math.floor(cy + radius));
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) {
        const idx = (y * w + x) * 4;
        buf[idx] = r;
        buf[idx + 1] = g;
        buf[idx + 2] = b;
        buf[idx + 3] = 255;
      }
    }
  }
}

function drawText(buf: Buffer, w: number, h: number, str: string, startX: number, startY: number, scale: number, r: number, g: number, b: number) {
  let cx = startX;
  const upper = str.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    const ch = upper[i];
    const glyph = FONT_5X7[ch] || FONT_5X7[' '];
    for (let col = 0; col < 5; col++) {
      const line = glyph[col];
      for (let row = 0; row < 7; row++) {
        if ((line & (1 << row)) !== 0) {
          for (let dy = 0; dy < scale; dy++) {
            for (let dx = 0; dx < scale; dx++) {
              const px = cx + col * scale + dx;
              const py = startY + row * scale + dy;
              if (px >= 0 && px < w && py >= 0 && py < h) {
                const idx = (py * w + px) * 4;
                buf[idx] = r;
                buf[idx + 1] = g;
                buf[idx + 2] = b;
                buf[idx + 3] = 255;
              }
            }
          }
        }
      }
    }
    cx += 6 * scale;
  }
}

// 1. Generator Gambar Foto Stand Meter (Visual Dial, Digit Angka, PDAM Branding)
function generateStandMeterJpeg(cust: typeof SAMPLE_20_CUSTOMERS[0]): Buffer {
  const w = 400;
  const h = 300;
  const frame = Buffer.alloc(w * h * 4);

  // Background Dark Utility
  drawRect(frame, w, h, 0, 0, w, h, 11, 17, 32);

  // Meter Circular Rim
  drawCircle(frame, w, h, 200, 130, 95, 71, 85, 105);
  drawCircle(frame, w, h, 200, 130, 90, 30, 41, 59);
  drawCircle(frame, w, h, 200, 130, 80, 2, 6, 23);

  // Meter Brand Text
  drawText(frame, w, h, "PDAM TIRTAWENING", 125, 75, 1, 56, 189, 248);
  drawText(frame, w, h, "FLOW METER PW-5", 135, 88, 1, 148, 163, 184);

  // Odometer Counter Box
  drawRect(frame, w, h, 115, 105, 170, 45, 0, 0, 0);

  // 5 Digit Boxes
  const digits = String(cust.stma).padStart(5, '0');
  for (let i = 0; i < 5; i++) {
    const isLast = i === 4;
    const bx = 120 + i * 32;
    drawRect(frame, w, h, bx, 110, 28, 35, isLast ? 185 : 30, isLast ? 28 : 41, isLast ? 28 : 59);
    drawText(frame, w, h, digits[i], bx + 8, 118, 2, 255, 255, 255);
  }

  // Unit m3
  drawText(frame, w, h, `STAND: ${cust.stma} M3`, 130, 165, 2, 56, 189, 248);

  // Dial needle
  drawCircle(frame, w, h, 200, 195, 10, 239, 68, 68);
  drawRect(frame, w, h, 200, 190, 20, 4, 239, 68, 68);

  // Footer Watermark Band
  drawRect(frame, w, h, 0, 245, w, 55, 2, 6, 23);
  drawText(frame, w, h, `NOLG: ${cust.nolg}`, 15, 255, 2, 255, 255, 255);
  drawText(frame, w, h, `AN: ${cust.nama}`, 15, 275, 1, 148, 163, 184);
  drawText(frame, w, h, `202601_STAND_${cust.nolg}.JPG`, 200, 275, 1, 56, 189, 248);

  return jpeg.encode({ data: frame, width: w, height: h }, 85).data;
}

// 2. Generator Gambar Foto Segel Meter (Visual Pipa, Kawat Segel, Barcode, Tag)
function generateSegelMeterJpeg(cust: typeof SAMPLE_20_CUSTOMERS[0]): Buffer {
  const w = 400;
  const h = 300;
  const frame = Buffer.alloc(w * h * 4);

  // Background Pipa Industrial
  drawRect(frame, w, h, 0, 0, w, h, 15, 23, 42);

  // Pipe horizontal
  drawRect(frame, w, h, 20, 120, 360, 45, 51, 65, 85);
  drawRect(frame, w, h, 160, 110, 80, 65, 71, 85, 105);

  // Wire loop
  drawRect(frame, w, h, 175, 70, 4, 60, 203, 213, 225);
  drawRect(frame, w, h, 220, 70, 4, 60, 203, 213, 225);
  drawRect(frame, w, h, 175, 70, 45, 4, 203, 213, 225);

  // Gold Lead Seal Tag
  drawRect(frame, w, h, 155, 95, 90, 75, 245, 158, 11);
  drawRect(frame, w, h, 160, 100, 80, 65, 180, 83, 9);

  // Barcode area
  drawRect(frame, w, h, 170, 110, 60, 25, 255, 255, 255);
  for (let i = 0; i < 12; i++) {
    drawRect(frame, w, h, 173 + i * 5, 112, (i % 2 === 0 ? 3 : 1), 21, 0, 0, 0);
  }

  // Seal serial
  drawText(frame, w, h, `SGL-${cust.nolg.slice(-4)}`, 175, 142, 1, 254, 243, 199);

  // Status OK Banner
  drawRect(frame, w, h, 110, 195, 180, 28, 6, 95, 70);
  drawText(frame, w, h, "SEGEL RESMI UTUH OK", 125, 203, 1, 110, 231, 183);

  // Footer Watermark Band
  drawRect(frame, w, h, 0, 245, w, 55, 2, 6, 23);
  drawText(frame, w, h, `NOLG: ${cust.nolg}`, 15, 255, 2, 255, 255, 255);
  drawText(frame, w, h, `STATUS: SEGEL UTUH - RUTE ${cust.rute}`, 15, 275, 1, 245, 158, 11);
  drawText(frame, w, h, `202601_SEGEL_${cust.nolg}.JPG`, 200, 275, 1, 148, 163, 184);

  return jpeg.encode({ data: frame, width: w, height: h }, 85).data;
}

// 3. Generator Gambar Foto Fasad Rumah (Visual Rumah, Atap, Pintu, Jendela, Alamat)
function generateRumahJpeg(cust: typeof SAMPLE_20_CUSTOMERS[0]): Buffer {
  const w = 400;
  const h = 300;
  const frame = Buffer.alloc(w * h * 4);

  // Sky Evening
  drawRect(frame, w, h, 0, 0, w, 190, 30, 27, 75);
  // Ground
  drawRect(frame, w, h, 0, 190, w, 110, 15, 23, 42);

  // House Roof (Triangle approximated with steps)
  for (let row = 0; row < 50; row++) {
    const rx = 200 - row * 2;
    const rw = row * 4;
    drawRect(frame, w, h, rx, 40 + row, rw, 1, 67, 56, 202);
  }

  // House Body
  drawRect(frame, w, h, 110, 90, 180, 100, 30, 41, 59);

  // Door
  drawRect(frame, w, h, 180, 130, 40, 60, 49, 46, 129);
  drawCircle(frame, w, h, 188, 160, 3, 251, 191, 36);

  // Windows
  drawRect(frame, w, h, 130, 115, 30, 30, 2, 132, 199);
  drawRect(frame, w, h, 240, 115, 30, 30, 2, 132, 199);

  // Water Meter Box on Fence
  drawRect(frame, w, h, 70, 155, 25, 35, 3, 105, 161);
  drawCircle(frame, w, h, 82, 170, 6, 255, 255, 255);

  // Address Plaque Banner
  drawRect(frame, w, h, 60, 200, 280, 35, 15, 23, 42);
  drawText(frame, w, h, cust.alamat, 70, 206, 1, 255, 255, 255);
  drawText(frame, w, h, `AN: ${cust.nama}`, 70, 220, 1, 165, 180, 252);

  // Footer Watermark Band
  drawRect(frame, w, h, 0, 245, w, 55, 2, 6, 23);
  drawText(frame, w, h, `NOLG: ${cust.nolg}`, 15, 255, 2, 255, 255, 255);
  drawText(frame, w, h, `FASAD PERSIL BANDUNG PW-5`, 15, 275, 1, 99, 102, 241);
  drawText(frame, w, h, `202601_RUMAH_${cust.nolg}.JPG`, 200, 275, 1, 148, 163, 184);

  return jpeg.encode({ data: frame, width: w, height: h }, 85).data;
}

async function main() {
  const outputDir = path.resolve(process.cwd(), 'packages/db/data/mock-photos');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const thbl = '202601';
  let totalCreated = 0;

  console.log(`Menghasilkan 60 berkas JPEG nyata (berisi gambar grafis utuh & teks teridentifikasi) ke: ${outputDir}`);

  for (const cust of SAMPLE_20_CUSTOMERS) {
    // 1. Foto Stand Meter (Visual Dial & Angka Meter)
    const standName = `${thbl}_stand_${cust.nolg}.jpg`;
    const standBuf = generateStandMeterJpeg(cust);
    fs.writeFileSync(path.join(outputDir, standName), standBuf);
    totalCreated++;

    // 2. Foto Segel Meter (Visual Pipa, Kawat, Segel & Barcode)
    const segelName = `${thbl}_segel_${cust.nolg}.jpg`;
    const segelBuf = generateSegelMeterJpeg(cust);
    fs.writeFileSync(path.join(outputDir, segelName), segelBuf);
    totalCreated++;

    // 3. Foto Rumah (Visual Fasad Bangunan, Pintu, Jendela & Plang Alamat)
    const rumahName = `${thbl}_rumah_${cust.nolg}.jpg`;
    const rumahBuf = generateRumahJpeg(cust);
    fs.writeFileSync(path.join(outputDir, rumahName), rumahBuf);
    totalCreated++;
  }

  const sampleFile = path.join(outputDir, `${thbl}_stand_${SAMPLE_20_CUSTOMERS[0].nolg}.jpg`);
  const sampleStat = fs.statSync(sampleFile);

  console.log(`Sukses membuat ${totalCreated} berkas JPEG nyata untuk 20 pelanggan ProgresCater-PW5.`);
  console.log(`Ukuran sampel (${path.basename(sampleFile)}): ${(sampleStat.size / 1024).toFixed(1)} KB (Bukan 0 KB!).`);
}

main().catch(console.error);
