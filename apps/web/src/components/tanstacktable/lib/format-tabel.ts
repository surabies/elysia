// features/dashboard/verifikasi/lib/format-tabel.ts — pemformat sel tabel.

export const formatAngka = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : n.toLocaleString("id-ID")

export function formatTanggalWaktu(iso: string | null | undefined) {
  if (!iso) return "—"
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
}
