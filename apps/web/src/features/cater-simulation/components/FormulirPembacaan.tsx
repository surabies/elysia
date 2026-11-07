'use client';

import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CaterSimulatorState } from '../hooks/useCaterSimulator';
import { SelectField } from './SelectField';

type Props = Pick<
  CaterSimulatorState,
  | 'selectedCustomer'
  | 'loadingCustomers'
  | 'stml'
  | 'setStml'
  | 'stma'
  | 'setStma'
  | 'pakaiLalu'
  | 'setPakaiLalu'
  | 'condition'
  | 'setCondition'
  | 'method'
  | 'setMethod'
  | 'source'
  | 'setSource'
  | 'duration'
  | 'setDuration'
  | 'note'
  | 'setNote'
  | 'fotoMeterUrl'
  | 'setFotoMeterUrl'
  | 'latitude'
  | 'setLatitude'
  | 'longitude'
  | 'setLongitude'
  | 'hasExistingReading'
  | 'overwriteConfirmed'
  | 'setOverwriteConfirmed'
  | 'saving'
  | 'submitReading'
  | 'fillScenario'
>;

const scenarioButtons = [
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Pemakaian tinggi' },
  { value: 'reverse', label: 'Stand turun' },
  { value: 'zero', label: 'Stand tetap' },
] as const;

export function FormulirPembacaan({
  selectedCustomer,
  loadingCustomers,
  stml,
  setStml,
  stma,
  setStma,
  pakaiLalu,
  setPakaiLalu,
  condition,
  setCondition,
  method,
  setMethod,
  source,
  setSource,
  duration,
  setDuration,
  note,
  setNote,
  fotoMeterUrl,
  setFotoMeterUrl,
  latitude,
  setLatitude,
  longitude,
  setLongitude,
  hasExistingReading,
  overwriteConfirmed,
  setOverwriteConfirmed,
  saving,
  submitReading,
  fillScenario,
}: Props) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    void submitReading(event);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Simulasi pengiriman mobile</CardTitle>
        <CardDescription>
          Jalankan pencatatan produksi yang sama dengan metadata mobile opsional.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex flex-wrap gap-2">
            {scenarioButtons.map((scenario) => (
              <Button
                key={scenario.value}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillScenario(scenario.value)}
              >
                {scenario.label}
              </Button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="simulation-stml">Stand awal</Label>
              <Input
                id="simulation-stml"
                required
                min="0"
                step="0.01"
                type="number"
                value={stml}
                onChange={(event) => setStml(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="simulation-stma">Stand akhir</Label>
              <Input
                id="simulation-stma"
                required
                min="0"
                step="0.01"
                type="number"
                value={stma}
                onChange={(event) => setStma(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="simulation-condition">Kondisi meter</Label>
              <SelectField
                id="simulation-condition"
                value={condition}
                onValueChange={setCondition}
                placeholder="Pilih kondisi"
                options={[
                  'Normal',
                  'Meter Rusak',
                  'Meter Macet',
                  'Stand Tidak Berubah',
                  'Meter Perlu Diperiksa',
                ].map((value) => ({ value, label: value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="simulation-pakai-lalu">Pemakaian bulan lalu (m³)</Label>
              <Input
                id="simulation-pakai-lalu"
                required
                min="0"
                step="0.01"
                type="number"
                value={pakaiLalu}
                onChange={(event) => setPakaiLalu(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="simulation-method">Metode catat</Label>
              <SelectField
                id="simulation-method"
                value={method}
                onValueChange={setMethod}
                placeholder="Pilih metode"
                options={[
                  { value: 'ONSITE', label: 'ONSITE' },
                  { value: 'OFFSITE', label: 'OFFSITE' },
                ]}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="simulation-source">Sumber pencatatan</Label>
              <SelectField
                id="simulation-source"
                value={source}
                onValueChange={setSource}
                placeholder="Pilih sumber"
                options={[
                  'PETUGAS_ONSITE',
                  'PETUGAS_OFFSITE',
                  'MANDIRI_WEB',
                  'MANDIRI_APP',
                  'MANUAL',
                ].map((value) => ({ value, label: value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="simulation-duration">Durasi (detik)</Label>
              <Input
                id="simulation-duration"
                min="0"
                type="number"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="simulation-photo">URL foto meter (opsional)</Label>
              <Input
                id="simulation-photo"
                type="url"
                value={fotoMeterUrl}
                onChange={(event) => setFotoMeterUrl(event.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="simulation-latitude">Latitude (opsional)</Label>
              <Input
                id="simulation-latitude"
                type="number"
                step="any"
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="simulation-longitude">Longitude (opsional)</Label>
              <Input
                id="simulation-longitude"
                type="number"
                step="any"
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="simulation-note">Catatan uji</Label>
              <Input
                id="simulation-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Prefix [SIMULASI] ditambahkan otomatis"
              />
            </div>
          </div>
          {hasExistingReading && (
            <Label className="flex items-start gap-2 rounded-md border p-3">
              <Checkbox
                checked={overwriteConfirmed}
                onCheckedChange={(checked) => setOverwriteConfirmed(checked === true)}
              />
              <span>
                Timpa bacaan periode ini (status saat ini: {selectedCustomer?.statusVerifikasi ?? 'tersedia'}).
                Tindakan ini mengubah data operasional pelanggan terpilih.
              </span>
            </Label>
          )}
          <Button
            type="submit"
            disabled={
              saving ||
              loadingCustomers ||
              !selectedCustomer ||
              (hasExistingReading && !overwriteConfirmed)
            }
          >
            {saving ? 'Menyimpan…' : 'Simpan pembacaan simulasi'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
