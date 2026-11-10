// features/auth/lib/galat-masuk.ts — terjemahan kode error Auth.js ke
// pesan yang berarti bagi pengguna.

const PESAN: Record<string, string> = {
  AccessDenied:
    "Akun Google ini belum terdaftar. Dashboard hanya bisa diakses pegawai yang akunnya telah dibuatkan administrator.",
  OAuthAccountNotLinked:
    "Email ini sudah terhubung ke metode masuk yang berbeda. Hubungi administrator sistem.",
  OAuthSignin:
    "Gagal memulai proses masuk ke Google. Coba lagi beberapa saat lagi.",
  OAuthCallback:
    "Google menolak proses masuk. Coba lagi atau hubungi administrator.",
  Configuration:
    "Konfigurasi autentikasi bermasalah. Hubungi administrator sistem.",
  Verification: "Tautan verifikasi sudah kedaluwarsa atau pernah dipakai.",
  SessionRequired: "Sesi Anda telah berakhir. Silakan masuk kembali.",
}

const PESAN_DEFAULT = "Terjadi kesalahan saat masuk. Silakan coba lagi."

/** Null bila tidak ada error — supaya pemanggil cukup `if (pesan)`. */
export function pesanErrorMasuk(kode: string | undefined): string | null {
  if (!kode) return null
  return PESAN[kode] ?? PESAN_DEFAULT
}
