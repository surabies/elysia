import { GeotaggingPelangganView } from "@/features/dashboard/pelanggan";

export const metadata = {
  title: "Titik GPS & Geotagging Pelanggan",
  description: "Pemetaan spasial PostGIS untuk visualisasi GIS dan optimasi rute pencatatan meter",
};

export default function Page() {
  return <GeotaggingPelangganView />;
}
