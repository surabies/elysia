'use client';

import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui/spinner';

const PetaMonitoringSpasial = dynamic(
  () =>
    import('@/features/dashboard/gis').then(
      (mod) => mod.PetaMonitoringSpasial,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100vh-3.5rem)] w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2.5">
          <Spinner className="size-5 text-muted-foreground" />
          <p className="text-label-13 text-muted-foreground">
            Memuat peta spasial PostGIS...
          </p>
        </div>
      </div>
    ),
  }
);

export default function PlacesPage() {
  return <PetaMonitoringSpasial />;
}
