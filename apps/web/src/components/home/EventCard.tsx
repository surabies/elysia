import Link from "next/link"

import type { TicketEvent } from "@/types/home"

interface EventCardProps {
  event: TicketEvent
}

const URL_LAYANAN: Record<string, string> = {
  "1": "/cek-tagihan",
  "2": "/lapor-meter",
  "3": "/pengaduan-air",
  "4": "/peta-pengaduan",
  "5": "/pasang-baru",
  "6": "/info-gangguan",
}

/** Kartu event berbentuk tiket (memakai clipPath `#ticket-clip-path`). */
export function EventCard({ event }: EventCardProps) {
  const href = URL_LAYANAN[event.id] ?? "/cek-tagihan"

  return (
    <li className="w-65 shrink-0 snap-start md:w-75">
      <Link href={href} className="block group outline-none">
        <article className="grid aspect-square grid-cols-2 overflow-hidden bg-black text-white [clip-path:url(#ticket-clip-path)] transition-transform duration-200 group-hover:scale-[1.02]">
          <div
            aria-hidden="true"
            style={{ backgroundColor: event.accentColor }}
            className="transition-opacity group-hover:opacity-90"
          />
          <div className="flex flex-col justify-between p-4">
            <div>
              <p className="text-label-12-mono font-mono text-white/80 uppercase">
                {event.date}
              </p>
              <h3 className="mt-2 text-heading-16 leading-snug font-semibold tracking-tight text-white group-hover:underline">
                {event.title}
              </h3>
            </div>
            <div className="text-copy-12 leading-relaxed">
              <p className="font-medium text-white/90">{event.venue}</p>
              <p className="text-white/60">{event.city}</p>
              <p className="mt-2 text-label-13 font-semibold text-white">{event.price}</p>
            </div>
          </div>
        </article>
      </Link>
    </li>
  )
}
