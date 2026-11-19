import React from "react";
import { View, ScrollView } from "react-native";
import {
  H2,
  H3,
  P,
  Muted,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Progress,
} from "@cater/ui-mobile";

export default function PetugasHomeScreen() {
  return (
    <ScrollView className="flex-1 bg-slate-50 p-4">
      {/* Header Info Petugas */}
      <Card className="mb-4 bg-white">
        <CardHeader>
          <View className="flex-row items-center justify-between">
            <Badge variant="success" label="Mode Siap Kerja" />
            <Badge variant="outline" label="Rayon 02 - Barat" />
          </View>
          <CardTitle className="mt-2 text-xl">Halo, Petugas Budi</CardTitle>
          <CardDescription>
            Target baca meter bulan ini: 450 pelanggan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <P className="text-sm font-medium">Progres Baca Meter Hari Ini</P>
              <P className="text-sm font-bold text-primary">180 / 450 (40%)</P>
            </View>
            <Progress value={40} className="h-2.5" />
          </View>
        </CardContent>
        <CardFooter className="flex-row justify-between border-t border-border pt-3">
          <Muted>Antrean Offline: 0 Pending</Muted>
          <Badge variant="secondary" label="GPS Aktif" />
        </CardFooter>
      </Card>

      {/* Menu Modul Utama Petugas */}
      <H3 className="mb-3 text-lg font-bold text-slate-800">
        Menu Kerja Lapangan
      </H3>

      <View className="space-y-3 pb-8">
        {/* Modul 1: Baca Meter */}
        <Card className="border-l-4 border-l-blue-600 bg-white">
          <CardHeader>
            <View className="flex-row items-center justify-between">
              <CardTitle className="text-base">1. Baca Meter Air</CardTitle>
              <Badge variant="default" label="Utama" />
            </View>
            <CardDescription>
              Catat stand meter, ambil foto bukti fisik, dan geotagging koordinat.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              className="w-full bg-blue-600"
              label="Buka Rute Baca Meter"
            />
          </CardFooter>
        </Card>

        {/* Modul 2: Gangguan */}
        <Card className="border-l-4 border-l-amber-500 bg-white">
          <CardHeader>
            <View className="flex-row items-center justify-between">
              <CardTitle className="text-base">2. Lapor Gangguan & Temuan</CardTitle>
              <Badge variant="warning" label="Lapangan" />
            </View>
            <CardDescription>
              Temuan meter macet, segel rusak, atau indikasi pipa bocor di jalan.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full border-amber-500"
              textClassName="text-amber-700"
              label="Catat Temuan Baru"
            />
          </CardFooter>
        </Card>

        {/* Modul 3: Langganan */}
        <Card className="border-l-4 border-l-slate-600 bg-white">
          <CardHeader>
            <CardTitle className="text-base">3. Data Langganan</CardTitle>
            <CardDescription>
              Pencarian cepat offline data nomor langganan dan histori pemakaian.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              variant="secondary"
              className="w-full"
              label="Cari Pelanggan Offline"
            />
          </CardFooter>
        </Card>

        {/* Modul 4: Tagihan */}
        <Card className="border-l-4 border-l-emerald-600 bg-white">
          <CardHeader>
            <CardTitle className="text-base">4. Tagihan & Tunggakan</CardTitle>
            <CardDescription>
              Cek rekening air dan status pembayaran pelanggan di lapangan.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              label="Cek Rekening Air"
            />
          </CardFooter>
        </Card>
      </View>
    </ScrollView>
  );
}
