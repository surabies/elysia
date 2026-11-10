import "server-only"

interface EmailInput {
  to: string
  subject: string
  html: string
  text: string
}

const FROM =
  process.env.EMAIL_FROM ?? "PERUMDA Tirtawening <onboarding@resend.dev>"

export async function kirimEmail({
  to,
  subject,
  html,
  text,
}: EmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "RESEND_API_KEY belum diisi — email tidak bisa dikirim di produksi. Set env tersebut atau ganti implementasi kirimEmail()."
      )
    }
    console.warn(
      [
        "",
        "─".repeat(72),
        "  EMAIL TIDAK DIKIRIM (RESEND_API_KEY belum diisi) — mode pengembangan.",
        `  Kepada : ${to}`,
        `  Subjek : ${subject}`,
        "",
        text,
        "─".repeat(72),
        "",
      ].join("\n")
    )
    return
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, html, text }),
  })

  if (!res.ok) {
    console.error(
      "[mailer] Resend menolak:",
      res.status,
      await res.text().catch(() => "")
    )
    throw new Error("Gagal mengirim email")
  }
}
