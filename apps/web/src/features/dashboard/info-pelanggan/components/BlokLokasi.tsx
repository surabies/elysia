// BlokLokasi menampilkan lokasi pencatatan di OpenStreetMap (tanpa API key).

export function BlokLokasi({
  lokasi,
}: {
  lokasi: { lat: number; lng: number } | null;
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Lokasi Pelanggan</h3>
        {lokasi && (
          <a
            href={`https://www.google.com/maps?q=${lokasi.lat},${lokasi.lng}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 dark:text-sky-400 underline-offset-4 hover:underline"
          >
            Buka di Google Maps
          </a>
        )}
      </div>

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
            className="h-72 w-full rounded-lg border border-border"
          />
        ) : (
          <div className="flex h-40 w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 px-4 text-center text-sm text-muted-foreground">
            Koordinat pelanggan ini belum tercatat.
          </div>
        )}
      </div>
    </div>
  );
}
