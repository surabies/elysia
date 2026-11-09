'use client';

import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui/spinner';

const PetaMonitoringSpasial = dynamic(
  () =>
    import(
      '@/features/dashboard/gis/components/PetaMonitoringSpasial'
    ).then((mod) => mod.PetaMonitoringSpasial),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Memuat Modul Peta Spasial GIS & PostGIS Layer...
          </p>
        </div>
      </div>
    ),
  }
);

export default function PlacesPage() {
  return <PetaMonitoringSpasial />;
}
