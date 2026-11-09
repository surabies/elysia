"use client";

// features/dashboard/verifikasi/components/PetaLokasi.tsx — peta mini lokasi
// rumah pelanggan di panel verifikasi. MapLibre + raster OSM (tanpa API key;
// untuk traffic produksi tinggi ganti penyedia tile sendiri).
//
// `langsung` = tanpa pelipat sendiri. Dipakai di dalam Seksi "Lokasi" yang
// sudah bisa dilipat — dua lapis pelipat bertumpuk hanya menambah satu klik.
// Isi Seksi yang tertutup tidak dirender, jadi peta baru dibuat saat dibuka.
//
// Sumber koordinat: Pelanggan.geoLat/geoLong (Float biasa).
import * as React from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

if (typeof window !== "undefined" && typeof (maplibregl as any).setWorkerUrl === "function") {
  (maplibregl as any).setWorkerUrl("/maplibre-gl-worker.js");
}
import {
  ArrowDown01Icon,
  Location01Icon,
} from "@/features/dashboard/shared/icons/IkonLucide";
import { HugeiconsIcon } from "@/features/dashboard/shared/icons/IconRenderer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { KELAS_JUDUL_PANEL } from "../lib/TemaVerifikasi";

function PetaMini({ lat, lng }: { lat: number; lng: number }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      center: [lng, lat],
      zoom: 15,
      attributionControl: { compact: true },
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
    });
    new maplibregl.Marker({ color: "var(--primary)" })
      .setLngLat([lng, lat])
      .addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      className="h-36 w-full overflow-hidden"
    />
  );
}

function TautanPetaPenuh({ lat, lng }: { lat: number; lng: number }) {
  return (
    <a
      href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`}
      target="_blank"
      rel="noreferrer"
      className="mt-1.5 inline-block text-label-12 font-medium text-(--verif-info) underline-offset-4 hover:underline"
    >
      Buka di peta penuh ↗
    </a>
  );
}

export function PetaLokasi({
  lat,
  lng,
  langsung = false,
}: {
  lat: number | null | undefined;
  lng: number | null | undefined;
  /** true = tampilkan peta langsung tanpa pelipat sendiri. */
  langsung?: boolean;
}) {
  // ~46168.x = placeholder Excel date serial di data legacy — anggap "tidak ada koordinat".
  const valid =
    typeof lat === "number" &&
    typeof lng === "number" &&
    lat >= -11 &&
    lat <= 6 &&
    lng >= 95 &&
    lng <= 141;

  if (!valid) {
    return (
      <div className="flex items-center gap-2.5 py-1">
        <HugeiconsIcon
          icon={Location01Icon}
          strokeWidth={2}
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <p className="text-copy-13 text-muted-foreground">
          Koordinat rumah pelanggan belum tersedia.
        </p>
      </div>
    );
  }

  if (langsung) {
    return (
      <div>
        <PetaMini lat={lat} lng={lng} />
        <TautanPetaPenuh lat={lat} lng={lng} />
      </div>
    );
  }

  return (
    <Collapsible>
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-left transition-colors hover:bg-accent">
        <span
          className={`inline-flex items-center gap-2 font-medium text-foreground ${KELAS_JUDUL_PANEL}`}
        >
          <HugeiconsIcon
            icon={Location01Icon}
            strokeWidth={2}
            className="size-3.5 text-(--verif-info)"
            aria-hidden
          />
          Lokasi rumah pelanggan
        </span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          strokeWidth={2}
          className="size-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        {/* Peta baru dibuat saat dibuka (Collapsible unmount saat tertutup). */}
        <PetaMini lat={lat} lng={lng} />
        <TautanPetaPenuh lat={lat} lng={lng} />
      </CollapsibleContent>
    </Collapsible>
  );
}
