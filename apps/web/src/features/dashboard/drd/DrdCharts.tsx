"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DrdSummary } from "@/server/services/dashboard/drd.service";

const COLORS = [
  "var(--ds-blue-600)",
  "var(--ds-teal-600)",
  "var(--ds-purple-600)",
  "var(--ds-amber-600)",
  "var(--ds-pink-600)",
  "var(--ds-green-600)",
];

const numberFormat = new Intl.NumberFormat("id-ID");
const currencyFormat = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="min-w-0">
      <CardHeader className="p-4 pb-0 sm:p-5 sm:pb-0">
        <CardTitle className="text-sm font-semibold tracking-tight">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 p-3 sm:p-4">
        {children}
      </CardContent>
    </Card>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">
      Belum ada data pada periode ini.
    </div>
  );
}

export function DrdCharts({ data }: { data: DrdSummary }) {
  const composition = [
    { name: "Harga air", value: data.dataTagihanKomposisi.hargaAir },
    { name: "Bea beban", value: data.dataTagihanKomposisi.beaBeban },
    { name: "Bea admin", value: data.dataTagihanKomposisi.beaAdmin },
    { name: "Air kotor", value: data.dataTagihanKomposisi.airKotor },
    { name: "Lain-lain", value: data.dataTagihanKomposisi.lainLain },
  ];
  const tariffShare = data.dataTarif.filter((item) => item.totalTagihan > 0);

  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-2">
      <ChartCard title="Distribusi Tagihan per Kelurahan">
        {data.dataKelurahan.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={data.dataKelurahan}
              margin={{ top: 8, right: 8, left: 0, bottom: 42 }}
            >
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="nama"
                angle={-30}
                textAnchor="end"
                interval={0}
                height={58}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(value: number) =>
                  `${numberFormat.format(Math.round(value / 1_000_000))} jt`
                }
              />
              <Tooltip
                formatter={(value) => currencyFormat.format(Number(value))}
              />
              <Bar
                dataKey="totalTagihan"
                name="Total tagihan"
                fill={COLORS[0]}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </ChartCard>

      <ChartCard title="Cakupan Layanan Wilayah">
        {data.dataCakupan.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart
              data={data.dataCakupan}
              margin={{ top: 8, right: 8, left: 0, bottom: 42 }}
            >
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="kelurahan"
                angle={-30}
                textAnchor="end"
                interval={0}
                height={58}
                tick={{ fontSize: 10 }}
              />
              <YAxis yAxisId="sl" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="m3" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value) => numberFormat.format(Number(value))} />
              <Legend />
              <Bar
                yAxisId="sl"
                dataKey="sl"
                name="Sambungan"
                fill={COLORS[0]}
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="m3"
                dataKey="pemakaianM3"
                name="Pemakaian m³"
                stroke={COLORS[1]}
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </ChartCard>

      <ChartCard title="Komposisi Tagihan per Tarif">
        {tariffShare.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={tariffShare}
                dataKey="totalTagihan"
                nameKey="nama"
                innerRadius={58}
                outerRadius={92}
                paddingAngle={2}
              >
                {tariffShare.map((item, index) => (
                  <Cell key={item.kode} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => currencyFormat.format(Number(value))}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </ChartCard>

      <ChartCard title="Segmentasi Domestik">
        {data.dataDomestik.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={data.dataDomestik}
              margin={{ top: 8, right: 8, left: 0, bottom: 24 }}
            >
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="kode" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value) => numberFormat.format(Number(value))} />
              <Bar
                dataKey="pemakaianM3"
                name="Pemakaian m³"
                fill={COLORS[1]}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {numberFormat.format(data.jumlahDomestik)} sambungan ·{" "}
          {currencyFormat.format(
            data.dataDomestik.reduce((sum, item) => sum + item.totalTagihan, 0),
          )}{" "}
          tagihan
        </p>
      </ChartCard>

      <ChartCard title="Sebaran TAA per Kelurahan">
        {data.dataTaaKelurahan.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={data.dataTaaKelurahan}
              margin={{ top: 8, right: 8, left: 0, bottom: 42 }}
            >
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="kelurahan"
                angle={-30}
                textAnchor="end"
                interval={0}
                height={58}
                tick={{ fontSize: 10 }}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(value) => numberFormat.format(Number(value))}
              />
              <Bar
                dataKey="jumlahTaa"
                name="Tagihan TAA"
                fill={COLORS[4]}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </ChartCard>

      <ChartCard title="Rasio Layanan & Status TAA">
        {data.dataTaaStatus.normal + data.dataTaaStatus.taa > 0 ? (
          <div className="grid items-center gap-2 sm:grid-cols-2">
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Normal", value: data.dataTaaStatus.normal },
                    { name: "TAA", value: data.dataTaaStatus.taa },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={82}
                >
                  <Cell fill={COLORS[5]} />
                  <Cell fill={COLORS[4]} />
                </Pie>
                <Tooltip
                  formatter={(value) => numberFormat.format(Number(value))}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Persentase TAA</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {data.dataTaaStatus.persenTaa}%
                </p>
              </div>
              <div className="space-y-1">
                {data.dataTaaStatus.sebaranTarif.map((item) => (
                  <div
                    key={item.kode}
                    className="flex justify-between gap-2 text-xs"
                  >
                    <span className="truncate text-muted-foreground">
                      {item.kode}
                    </span>
                    <span className="font-mono tabular-nums">
                      {numberFormat.format(item.jumlahTaa)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EmptyChart />
        )}
      </ChartCard>

      <ChartCard title="Komponen Tagihan DRD">
        {composition.some((item) => item.value > 0) ? (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={[Object.fromEntries(composition.map((item) => [item.name, item.value]))]}
                margin={{ top: 12, right: 8, left: 8, bottom: 4 }}
              >
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey={() => "Total periode"} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value: number) =>
                    `${numberFormat.format(Math.round(value / 1_000_000))} jt`
                  }
                />
                <Tooltip
                  formatter={(value) => currencyFormat.format(Number(value))}
                />
                {composition.map((item, index) => (
                  <Bar
                    key={item.name}
                    dataKey={item.name}
                    name={item.name}
                    stackId="tagihan"
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-t border-border pt-3 text-xs">
              {composition.map((item) => (
                <span key={item.name} className="text-muted-foreground">
                  {item.name}:{" "}
                  <strong className="font-medium text-foreground">
                    {currencyFormat.format(item.value)}
                  </strong>
                </span>
              ))}
            </div>
          </>
        ) : (
          <EmptyChart />
        )}
      </ChartCard>
    </div>
  );
}
