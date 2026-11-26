import type {
  ItemRuteBaca,
  SesiBacaRute,
  StatusSesi,
} from "../types/RiwayatPembacaanTypes";

/**
 * Helper untuk membuat 20 sesi per rute berdasarkan pola 20 huruf (U, T, G, S)
 */
function buat20Sesi(
  pola: string,
  petugasNama: string,
  totalPelanggan: number,
  durasiP95Menit: number,
  sesiTerakhirMenit: number,
  waktuTerakhirTeks: string
): SesiBacaRute[] {
  const sesiArr: SesiBacaRute[] = [];
  const chars = pola.split("");

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]!;
    const isTerakhir = i === chars.length - 1;
    let status: StatusSesi = "Tuntas";
    let durasiMenit = 180; // default 3 jam
    let meterTerbaca = totalPelanggan;

    if (char === "T") {
      status = "Terlambat";
      durasiMenit = durasiP95Menit || 450; // ~7j 30m
      meterTerbaca = totalPelanggan - 15;
    } else if (char === "G") {
      status = "Gagal";
      durasiMenit = isTerakhir ? sesiTerakhirMenit : 15;
      meterTerbaca = 0;
    } else if (char === "S") {
      status = "Dilewati";
      durasiMenit = 0;
      meterTerbaca = 0;
    } else {
      status = "Tuntas";
      durasiMenit = isTerakhir ? sesiTerakhirMenit : Math.round(durasiP95Menit * 0.9);
      meterTerbaca = totalPelanggan;
    }

    const tgl = `${i + 1} Nov 2026`;
    sesiArr.push({
      id: `sesi-${i + 1}`,
      tanggal: tgl,
      status,
      durasiMenit: isTerakhir ? sesiTerakhirMenit : durasiMenit,
      meterTerbaca,
      totalMeter: totalPelanggan,
      petugasNama,
      waktuSelesaiTeks: isTerakhir ? waktuTerakhirTeks : `${20 - i} hari lalu`,
    });
  }

  return sesiArr;
}

export const contoh8RuteBaca: ItemRuteBaca[] = [
  {
    id: "rute-01",
    nama: "Rute 01 Coblong",
    seksiWilayah: "coblong",
    jumlahPelanggan: 412,
    petugasDefault: "Asep S.",
    isNonaktif: false,
    sesiList: buat20Sesi(
      "UUUUUUUUUUUUUUUTGTGG",
      "Asep S.",
      412,
      450, // 7j 30m
      12, // 12m
      "1 jam lalu"
    ),
  },
  {
    id: "rute-02",
    nama: "Rute 02 Cicendo",
    seksiWilayah: "cicendo",
    jumlahPelanggan: 380,
    petugasDefault: "Dede R.",
    isNonaktif: false,
    sesiList: buat20Sesi(
      "UUUUUUUUUUUUUUUUUTUU",
      "Dede R.",
      380,
      200, // 3j 20m
      190, // 3j 10m
      "2 jam lalu"
    ),
  },
  {
    id: "rute-03",
    nama: "Rute 03 Lengkong",
    seksiWilayah: "lengkong",
    jumlahPelanggan: 355,
    petugasDefault: "Yayan K.",
    isNonaktif: false,
    sesiList: buat20Sesi(
      "UUUUUUUUUUUUUUUUUUUU",
      "Yayan K.",
      355,
      185, // 3j 05m
      180, // 3j 00m
      "2 jam lalu"
    ),
  },
  {
    id: "rute-04",
    nama: "Rute 04 Buahbatu",
    seksiWilayah: "buahbatu",
    jumlahPelanggan: 440,
    petugasDefault: "Euis N.",
    isNonaktif: false,
    sesiList: buat20Sesi(
      "UUUUUUUUUUUUUUUUUUUU",
      "Euis N.",
      440,
      170, // 2j 50m
      165, // 2j 45m
      "3 jam lalu"
    ),
  },
  {
    id: "rute-05",
    nama: "Rute 05 Antapani",
    seksiWilayah: "antapani",
    jumlahPelanggan: 398,
    petugasDefault: "Ujang M.",
    isNonaktif: false,
    sesiList: buat20Sesi(
      "UUUUUUUUUUUUUUUUUUUU",
      "Ujang M.",
      398,
      210, // 3j 30m
      200, // 3j 20m
      "1 jam lalu"
    ),
  },
  {
    id: "rute-06",
    nama: "Rute 06 Sukajadi",
    seksiWilayah: "sukajadi",
    jumlahPelanggan: 365,
    petugasDefault: "Rina W.",
    isNonaktif: false,
    sesiList: buat20Sesi(
      "UUUUUUUUUUUUUUUUUUUU",
      "Rina W.",
      365,
      250, // 4j 10m
      240, // 4j 00m
      "12 jam lalu"
    ),
  },
  {
    id: "rute-07",
    nama: "Rute 07 Bandung Kulon",
    seksiWilayah: "bandung kulon",
    jumlahPelanggan: 410,
    petugasDefault: "Budi H.",
    isNonaktif: false,
    sesiList: buat20Sesi(
      "UUUUUUUUUUUUUUUTUUUU",
      "Budi H.",
      410,
      235, // 3j 55m
      220, // 3j 40m
      "14 jam lalu"
    ),
  },
  {
    id: "rute-08",
    nama: "Rute 08 Cibiru",
    seksiWilayah: "cibiru",
    jumlahPelanggan: 372,
    petugasDefault: "Neneng S.",
    isNonaktif: true, // Nonaktif
    sesiList: buat20Sesi(
      "UUUUUUUUUUUUUUUUUUUU",
      "Neneng S.",
      372,
      200, // 3j 20m
      195, // 3j 15m
      "3 hari lalu"
    ),
  },
];
