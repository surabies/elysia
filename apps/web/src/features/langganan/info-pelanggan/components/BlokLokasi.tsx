// BlokLokasi menampilkan lokasi pencatatan di OpenStreetMap (tanpa API key).
import { ExternalLink, MapPin } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function BlokLokasi({
  lokasi,
}: {
  lokasi: { lat: number; lng: number } | null;
}) {
  return (
    <Card className="rounded-lg border-border/80 bg-card shadow-none">
      <CardHeader className="p-4 sm:p-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0 text-foreground/80 stroke-[1.5]" />
            <CardTitle className="text-[15px] sm:text-[16px] font-medium tracking-tight text-foreground">
              Lokasi Pelanggan
            </CardTitle>
          </div>
          {lokasi && (
            <a
              href={`https://www.google.com/maps?q=${lokasi.lat},${lokasi.lng}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              <span>Buka di Google Maps</span>
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5 pt-0">
        <div className="flex flex-col gap-3">
          {lokasi ? (
            <iframe
              title={`Peta lokasi ${lokasi.lat}, ${lokasi.lng}`}
              src={
                `https://www.openstreetmap.org/export/embed.html?bbox=` +
                `${lokasi.lng - 0.003},${lokasi.lat - 0.0012},${lokasi.lng + 0.003},${lokasi.lat + 0.0012}` +
                `&layer=mapnik&marker=${lokasi.lat},${lokasi.lng}`
              }
              loading="lazy"
              className="h-72 w-full rounded-md border border-border/80"
            />
          ) : (
            <div className="flex h-36 w-full items-center justify-center rounded-md border border-dashed border-border/80 bg-muted/30 px-4 text-center text-sm text-muted-foreground">
              Koordinat pelanggan ini belum tercatat.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
