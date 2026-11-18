import * as maplibregl from "maplibre-gl"
import styles from "./PopupPeta.module.css"

type JenisPopup =
  | "kecamatan"
  | "kelurahan"
  | "pipa"
  | "sumberAir"
  | "pelanggan"
  | "potensi"
  | "eksPelanggan"
  | "kebocoran"
  | "pengaduan"
  | "rute"
type NadaBadge = "netral" | "info" | "sukses" | "peringatan" | "bahaya"

interface BarisPopup {
  label: string
  value: string | null
}

interface OpsiPopup {
  jenis: JenisPopup
  label: string
  judul: string
  badge?: { teks: string; nada: NadaBadge }
  prioritas?: { teks: string; nada: NadaBadge }
  baris: BarisPopup[]
  koordinat: [number, number]
}

function buatElemen(
  tag: keyof HTMLElementTagNameMap,
  className: string,
  text?: string
) {
  const elemen = document.createElement(tag)
  elemen.className = className
  if (text) elemen.textContent = text
  return elemen
}

function formatLabel(nilai: string) {
  return nilai
    .toLocaleLowerCase("id-ID")
    .replaceAll("_", " ")
    .replace(/\b\p{L}/gu, (huruf) => huruf.toLocaleUpperCase("id-ID"))
}

function nadaStatus(status: string): NadaBadge {
  if (["SELESAI", "DITUTUP", "AKTIF", "PELANGGAN AKTIF"].includes(status)) return "sukses"
  if (["DITOLAK", "DARURAT", "DISEGEL", "TUTUP_SPT", "DICABUT", "DIHAPUS"].includes(status))
    return "bahaya"
  if (
    [
      "TINGGI",
      "DIPROSES",
      "DITUGASKAN",
      "TUTUP_SEMENTARA",
      "MENUNGGU_SURVEI",
      "VALIDASI",
    ].includes(status)
  )
    return "peringatan"
  if (["BARU", "NORMAL", "DIBUKA_KEMBALI", "PROSPEK"].includes(status))
    return "info"
  return "netral"
}

function nadaPrioritas(prioritas: string): NadaBadge {
  if (prioritas === "DARURAT") return "bahaya"
  if (prioritas === "TINGGI") return "peringatan"
  if (prioritas === "NORMAL") return "info"
  return "netral"
}

function propertiTeks(
  properties: Record<string, unknown> | null | undefined,
  nama: string
) {
  const nilai = properties?.[nama]
  if (typeof nilai === "number")
    return new Intl.NumberFormat("id-ID").format(nilai)
  return typeof nilai === "string" ? nilai : ""
}

function barisStatistikWilayah(
  properties: Record<string, unknown> | null | undefined
): BarisPopup[] {
  return [
    {
      label: "Total pelanggan terdata",
      value: propertiTeks(properties, "totalPelanggan"),
    },
    {
      label: "Pelanggan aktif",
      value: propertiTeks(properties, "pelangganAktif"),
    },
    {
      label: "Pelanggan dicabut (nonaktif)",
      value: propertiTeks(properties, "pelangganDicabut") || propertiTeks(properties, "pelangganNonaktif"),
    },
    {
      label: "Pelanggan potensial (prospek)",
      value: propertiTeks(properties, "pelangganPotensial") || propertiTeks(properties, "potensi"),
    },
    {
      label: "└ Kriteria Tutup sementara",
      value: propertiTeks(properties, "tutupSementara"),
    },
    {
      label: "└ Kriteria Tutup SPT",
      value: propertiTeks(properties, "tutupSpt"),
    },
    {
      label: "└ Kriteria Disegel",
      value: propertiTeks(properties, "disegel"),
    },
    {
      label: "└ Kriteria Dicabut dinas",
      value: propertiTeks(properties, "pelangganDihapus"),
    },
    {
      label: "└ Kriteria Eks pelanggan survei",
      value: propertiTeks(properties, "eksPelanggan"),
    },
    { label: "Total pengaduan", value: propertiTeks(properties, "pengaduan") },
    {
      label: "Pengaduan aktif",
      value: propertiTeks(properties, "pengaduanAktif"),
    },
    {
      label: "Laporan kebocoran",
      value: propertiTeks(properties, "kebocoran"),
    },
  ]
}

function buatKontenPopup(opsi: OpsiPopup) {
  const kartu = buatElemen("article", `${styles.card} ${styles[opsi.jenis]}`)
  const header = buatElemen("header", styles.header)
  const label = buatElemen("p", styles.label, opsi.label)
  const judul = buatElemen("h2", styles.title, opsi.judul)
  const badges = buatElemen("div", styles.badges)

  header.append(label, judul)
  if (opsi.badge) {
    const badge = buatElemen("span", styles.badge, opsi.badge.teks)
    badge.dataset.tone = opsi.badge.nada
    badges.append(badge)
  }
  if (opsi.prioritas) {
    const badge = buatElemen("span", styles.badge, opsi.prioritas.teks)
    badge.dataset.tone = opsi.prioritas.nada
    badges.append(badge)
  }
  if (badges.childElementCount) header.append(badges)

  const rincian = buatElemen("dl", styles.details)
  for (const baris of opsi.baris) {
    if (!baris.value?.trim()) continue
    const item = buatElemen("div", styles.detail)
    item.append(
      buatElemen("dt", styles.detailLabel, baris.label),
      buatElemen("dd", styles.detailValue, baris.value)
    )
    rincian.append(item)
  }

  const footer = buatElemen("footer", styles.footer)
  const titik = buatElemen("span", styles.locationDot)
  titik.setAttribute("aria-hidden", "true")
  footer.append(
    titik,
    buatElemen(
      "span",
      styles.coordinates,
      `${opsi.koordinat[1].toFixed(5)}, ${opsi.koordinat[0].toFixed(5)}`
    )
  )

  kartu.append(header)
  if (rincian.childElementCount) kartu.append(rincian)
  kartu.append(footer)
  return kartu
}

function opsiPopup(
  layerId: string,
  feature: maplibregl.MapGeoJSONFeature,
  coordinates: [number, number]
): OpsiPopup | null {
  const properties = feature.properties

  if (layerId === "pipa-garis" || layerId === "pipa-casing") {
    const fungsi = propertiTeks(properties, "fungsi") || "Distribusi";
    const material = propertiTeks(properties, "material") || "-";
    const diameter = propertiTeks(properties, "diameter") || "-";
    const panjang = propertiTeks(properties, "panjangMeter") || "0";
    const kodePipa = propertiTeks(properties, "kodePipa") || propertiTeks(properties, "id");
    return {
      jenis: "pipa",
      label: "Pipa Jaringan Air Minum",
      judul: `Pipa ${fungsi} (${material})`,
      badge: { teks: fungsi, nada: "info" },
      baris: [
        { label: "Kode Pipa", value: kodePipa },
        { label: "Material Pipa", value: material },
        { label: "Diameter", value: `${diameter} mm` },
        { label: "Panjang Segmen", value: `${panjang} meter` },
        { label: "Zona DMA", value: propertiTeks(properties, "dma") },
        { label: "Pasokan Sumber Air", value: propertiTeks(properties, "sumberAir") },
        { label: "Status Operasional", value: propertiTeks(properties, "statusPipa") || "Aktif" },
      ],
      koordinat: coordinates,
    };
  }

  if (
    layerId === "sumber-air-titik" ||
    layerId === "sumber-air-lingkaran-luar" ||
    layerId === "sumber-air-nama"
  ) {
    const tipe = propertiTeks(properties, "tipe") || "IPA";
    const kapasitas = propertiTeks(properties, "kapasitasLps");
    return {
      jenis: "sumberAir",
      label: "Instalasi Pengolahan & Distribusi",
      judul: propertiTeks(properties, "nama") || "Sumber Air PDAM",
      badge: { teks: tipe.replaceAll("_", " "), nada: "sukses" },
      baris: [
        { label: "Tipe Fasilitas", value: tipe.replaceAll("_", " ") },
        { label: "Kapasitas Debit", value: kapasitas ? `${kapasitas} Liter/Detik` : null },
        { label: "Wilayah Pelayanan", value: propertiTeks(properties, "wilayah") },
        { label: "Status", value: propertiTeks(properties, "status") || "Aktif" },
        { label: "Keterangan", value: propertiTeks(properties, "keterangan") },
      ],
      koordinat: coordinates,
    };
  }

  if (layerId === "pelanggan-titik") {
    const status = propertiTeks(properties, "status")
    const kategoriUtama =
      propertiTeks(properties, "kategoriUtama") ||
      (status === "AKTIF" || status === "PELANGGAN AKTIF"
        ? "Pelanggan Aktif"
        : "Dicabut")
    const kriteriaCabut = propertiTeks(properties, "kriteriaCabut")
    const noUrutRute = propertiTeks(properties, "noUrutRute")
    return {
      jenis: "pelanggan",
      label: `Titik ${kategoriUtama}`,
      judul: propertiTeks(properties, "nama") || "Pelanggan",
      badge: {
        teks: kategoriUtama,
        nada: kategoriUtama === "Pelanggan Aktif" ? "sukses" : "bahaya",
      },
      baris: [
        { label: "Kategori Status", value: kategoriUtama },
        {
          label: "Kriteria Mutasi",
          value: kriteriaCabut || (kategoriUtama === "Dicabut" ? formatLabel(status) : null),
        },
        { label: "No. sambungan", value: propertiTeks(properties, "nomor") },
        { label: "Alamat", value: propertiTeks(properties, "alamat") },
        { label: "Kelurahan", value: propertiTeks(properties, "kelurahan") },
        { label: "Kecamatan", value: propertiTeks(properties, "kecamatan") },
        { label: "Kode rute", value: propertiTeks(properties, "kodeRute") },
        {
          label: "Urutan pelanggan",
          value: noUrutRute ? `Urutan ${noUrutRute}` : null,
        },
      ],
      koordinat: coordinates,
    }
  }

  if (layerId === "potensi-titik") {
    const status = propertiTeks(properties, "status")
    return {
      jenis: "potensi",
      label: "Pelanggan Potensial",
      judul: propertiTeks(properties, "alamat") || "Calon Pelanggan Prospek",
      badge: { teks: "Status: Potensial", nada: "info" },
      baris: [
        { label: "Kategori", value: "Pelanggan Potensial (Calon Sambungan Baru)" },
        { label: "Peruntukan", value: propertiTeks(properties, "kategori") },
        { label: "Kode rute survei", value: propertiTeks(properties, "kodeRute") },
        { label: "Catatan Verifikasi", value: propertiTeks(properties, "catatan") },
      ],
      koordinat: coordinates,
    }
  }

  if (layerId === "eks-pelanggan-titik") {
    const periodeValue = properties?.periode
    const periode =
      typeof periodeValue === "number"
        ? String(periodeValue)
        : propertiTeks(properties, "periode")
    return {
      jenis: "eksPelanggan",
      label: "Pelanggan Dicabut",
      judul: propertiTeks(properties, "nama") || "Pelanggan Dicabut",
      badge: { teks: "Status: Dicabut", nada: "bahaya" },
      baris: [
        { label: "Kategori Status", value: "Dicabut (Nonaktif)" },
        { label: "Kriteria", value: "Eks Pelanggan (Survei Pemutusan)" },
        { label: "No. sambungan", value: propertiTeks(properties, "nomor") },
        {
          label: "Periode pemutusan",
          value: periode ? `${periode.slice(0, 4)}-${periode.slice(4)}` : null,
        },
        {
          label: "Sumber data",
          value: formatLabel(propertiTeks(properties, "sumberData")),
        },
        {
          label: "Catatan sumber",
          value: propertiTeks(properties, "catatan"),
        },
      ],
      koordinat: coordinates,
    }
  }

  if (layerId === "pengaduan-titik") {
    const status = propertiTeks(properties, "status")
    const prioritas = propertiTeks(properties, "prioritas")
    const jenis = propertiTeks(properties, "jenis")
    return {
      jenis: "pengaduan",
      label: "Pengaduan Pelanggan",
      judul:
        propertiTeks(properties, "tiket") ||
        propertiTeks(properties, "judul") ||
        "Pengaduan",
      badge: status
        ? { teks: formatLabel(status), nada: nadaStatus(status) }
        : undefined,
      prioritas: prioritas
        ? { teks: formatLabel(prioritas), nada: nadaPrioritas(prioritas) }
        : undefined,
      baris: [
        {
          label: "Kategori pengaduan",
          value: jenis ? formatLabel(jenis) : null,
        },
        { label: "Judul", value: propertiTeks(properties, "judul") },
        { label: "Alamat kejadian", value: propertiTeks(properties, "alamat") },
        { label: "Kelurahan", value: propertiTeks(properties, "kelurahan") },
        { label: "Kecamatan", value: propertiTeks(properties, "kecamatan") },
      ],
      koordinat: coordinates,
    }
  }

  if (layerId === "rute-garis") {
    const noUrut = propertiTeks(properties, "noUrut")
    return {
      jenis: "rute",
      label: "Jaringan pembacaan",
      judul: `Rute ${propertiTeks(properties, "kode")}`.trim(),
      badge: { teks: "Rute", nada: "info" },
      baris: [
        {
          label: "Urutan petugas",
          value: noUrut ? `Urutan ${noUrut}` : null,
        },
      ],
      koordinat: coordinates,
    }
  }

  if (layerId === "kelurahan-isi") {
    return {
      jenis: "kelurahan",
      label: "Wilayah administrasi",
      judul: propertiTeks(properties, "nama") || "Kelurahan",
      badge: { teks: "Kelurahan", nada: "info" },
      baris: [
        { label: "Kecamatan", value: propertiTeks(properties, "kecamatan") },
        { label: "Kode wilayah", value: propertiTeks(properties, "kode") },
        ...barisStatistikWilayah(properties),
      ],
      koordinat: coordinates,
    }
  }

  if (layerId === "kecamatan-isi") {
    return {
      jenis: "kecamatan",
      label: "Wilayah administrasi",
      judul: propertiTeks(properties, "nama") || "Kecamatan",
      badge: { teks: "Kecamatan", nada: "info" },
      baris: [
        { label: "Kode wilayah", value: propertiTeks(properties, "kode") },
        ...barisStatistikWilayah(properties),
      ],
      koordinat: coordinates,
    }
  }

  return null
}

export function pasangPopupFiturPeta(map: maplibregl.Map) {
  const layerPrioritas = [
    "pengaduan-titik",
    "pengaduan-cluster",
    "sumber-air-titik",
    "sumber-air-lingkaran-luar",
    "eks-pelanggan-titik",
    "eks-pelanggan-cluster",
    "potensi-titik",
    "potensi-cluster",
    "pelanggan-titik",
    "pelanggan-cluster",
    "pipa-garis",
    "rute-garis",
    "kelurahan-isi",
    "kecamatan-isi",
  ]
  let popupAktif: maplibregl.Popup | null = null

  map.on("click", (event) => {
    const fitur = map.queryRenderedFeatures(event.point, {
      layers: layerPrioritas,
    })
    const terpilih = fitur
      .map((feature) => ({
        feature,
        prioritas: layerPrioritas.indexOf(feature.layer.id),
      }))
      .filter((item) => item.prioritas >= 0)
      .sort((a, b) => a.prioritas - b.prioritas)[0]
    if (!terpilih) return

    const opsi = opsiPopup(terpilih.feature.layer.id, terpilih.feature, [
      event.lngLat.lng,
      event.lngLat.lat,
    ])
    if (!opsi) return

    popupAktif?.remove()
    const popup = new maplibregl.Popup({
      className: styles.popup,
      closeButton: true,
      closeOnClick: true,
      maxWidth: "360px",
      offset: 12,
    })
      .setLngLat(event.lngLat)
      .setDOMContent(buatKontenPopup(opsi))
    popup.on("open", () => {
      const tombolTutup = popup
        ?.getElement()
        .querySelector<HTMLButtonElement>(".maplibregl-popup-close-button")
      tombolTutup?.setAttribute("aria-label", "Tutup informasi")
      tombolTutup?.setAttribute("title", "Tutup informasi")
    })
    popup.on("close", () => {
      if (popupAktif === popup) popupAktif = null
    })
    popupAktif = popup.addTo(map)
  })

  for (const layer of layerPrioritas) {
    map.on("mouseenter", layer, () => {
      map.getCanvas().style.cursor = "pointer"
    })
    map.on("mouseleave", layer, () => {
      map.getCanvas().style.cursor = ""
    })
  }
}
