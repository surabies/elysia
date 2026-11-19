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
} from "@cater/ui-mobile";

export default function PelangganHomeScreen() {
  return (
    <ScrollView className="flex-1 bg-slate-50 p-4">
      {/* Kartu Status Sambungan & Tagihan */}
      <Card className="mb-4 bg-sky-700">
        <CardHeader>
          <View className="flex-row items-center justify-between">
            <Badge variant="outline" className="border-sky-300" textClassName="text-white" label="No. Pelanggan: 10293847" />
            <Badge variant="success" label="Aktif" />
          </View>
          <CardTitle className="mt-2 text-xl text-white">Ibu Siti Rahma</CardTitle>
          <CardDescription className="text-sky-100">
            Jl. Melati No. 14, RT 03 / RW 05, Kel. Sukamaju
          </CardDescription>
        </CardHeader>
        <CardContent>
          <View className="rounded-xl bg-sky-800/60 p-3">
            <Muted className="text-sky-200">Total Tagihan Bulan Ini</Muted>
            <H2 className="text-2xl font-extrabold text-white">Rp 128.500</H2>
            <P className="text-xs text-sky-200">Jatuh Tempo: 20 November 2026</P>
          </View>
        </CardContent>
        <CardFooter className="flex-row justify-between pt-2">
          <Button
            className="w-full bg-white active:bg-sky-50"
            textClassName="text-sky-800 font-bold"
            label="Lihat Rincian Tagihan"
          />
        </CardFooter>
      </Card>

      {/* Menu Layanan Pelanggan */}
      <H3 className="mb-3 text-lg font-bold text-slate-800">
        Layanan Pelanggan
      </H3>

      <View className="space-y-3 pb-8">
        {/* Layanan 1: Pengaduan Air */}
        <Card className="border-l-4 border-l-red-500 bg-white">
          <CardHeader>
            <View className="flex-row items-center justify-between">
              <CardTitle className="text-base">Pengaduan Gangguan Air</CardTitle>
              <Badge variant="destructive" label="Respon Cepat" />
            </View>
            <CardDescription>
              Laporkan air mati, air keruh, kebocoran pipa, atau kendala meteran.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              className="w-full bg-red-600"
              label="Buat Pengaduan Baru"
            />
          </CardFooter>
        </Card>

        {/* Layanan 2: Lapor Meter Mandiri */}
        <Card className="border-l-4 border-l-sky-500 bg-white">
          <CardHeader>
            <View className="flex-row items-center justify-between">
              <CardTitle className="text-base">Lapor Meter Mandiri</CardTitle>
              <Badge variant="default" label="Tgl 20 - 25" />
            </View>
            <CardDescription>
              Kirim foto dan angka meteran air Anda sendiri tanpa menunggu petugas.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full border-sky-500"
              textClassName="text-sky-700"
              label="Buka Kamera Pembaca Meter"
            />
          </CardFooter>
        </Card>

        {/* Layanan 3: Riwayat & Layanan Lain */}
        <Card className="border-l-4 border-l-emerald-600 bg-white">
          <CardHeader>
            <CardTitle className="text-base">Pasang Baru & Balik Nama</CardTitle>
            <CardDescription>
              Permohonan sambungan baru atau perubahan kepemilikan rekening air.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              variant="secondary"
              className="w-full"
              label="Informasi Permohonan"
            />
          </CardFooter>
        </Card>
      </View>
    </ScrollView>
  );
}
