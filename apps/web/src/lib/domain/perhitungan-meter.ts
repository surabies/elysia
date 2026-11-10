export function hitungPemakaianGantiMeter({
  standAwalLama,
  standAngkatLama,
  standMeterBaru,
  standPasang = 0,
}: {
  standAwalLama: number
  standAngkatLama: number
  standMeterBaru: number
  standPasang?: number
}): number {
  const pemakaianMeterLama = standAngkatLama - standAwalLama
  const pemakaianMeterBaru = standMeterBaru - standPasang
  return pemakaianMeterLama + pemakaianMeterBaru
}
