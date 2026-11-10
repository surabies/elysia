'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CaterSimulatorState } from '../hooks/use-cater-simulator';
import { SelectField } from './SelectField';

type Props = Pick<
  CaterSimulatorState,
  | 'month'
  | 'setMonth'
  | 'routes'
  | 'routeCode'
  | 'setRouteCode'
  | 'customers'
  | 'customerNumber'
  | 'setCustomerNumber'
  | 'loadingCustomers'
  | 'selectedCustomer'
  | 'currentStatus'
>;

function statusVariant(status: string): 'destructive' | 'default' | 'secondary' {
  if (status.startsWith('ANOMALY')) return 'destructive';
  if (status.includes('VERIFIED') || status === 'APPROVED_FINAL') return 'default';
  return 'secondary';
}

export function KonteksPengujian({
  month,
  setMonth,
  routes,
  routeCode,
  setRouteCode,
  customers,
  customerNumber,
  setCustomerNumber,
  loadingCustomers,
  selectedCustomer,
  currentStatus,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Konteks pengujian</CardTitle>
        <CardDescription>
          Pilih periode, rute, dan pelanggan. Data bacaan sebelumnya dipakai sebagai nilai awal.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="simulation-period">Periode</Label>
          <Input
            id="simulation-period"
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="simulation-route">Rute</Label>
          <SelectField
            id="simulation-route"
            value={routeCode}
            onValueChange={setRouteCode}
            placeholder="Pilih rute"
            options={routes.map((route) => ({
              value: route.kode,
              label: `${route.kode} · ${route.seksiNama || 'Tanpa seksi'}`,
            }))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="simulation-customer">Pelanggan</Label>
          <SelectField
            id="simulation-customer"
            value={customerNumber}
            onValueChange={setCustomerNumber}
            disabled={loadingCustomers || customers.length === 0}
            placeholder={loadingCustomers ? 'Memuat pelanggan…' : 'Pilih pelanggan'}
            options={customers.map((customer) => ({
              value: customer.nolg,
              label: `${customer.nolg} · ${customer.nama}`,
            }))}
          />
        </div>
        {selectedCustomer && (
          <div className="rounded-md bg-muted/50 px-3 py-2 text-sm sm:col-span-3">
            <span className="font-medium">{selectedCustomer.nama}</span>
            <span className="text-muted-foreground">
              {' · '}{selectedCustomer.alamat || 'Alamat tidak tersedia'}
              {' · Meter '}{selectedCustomer.noMeter || '-'}
            </span>
            {currentStatus && (
              <Badge variant={statusVariant(currentStatus)} className="ml-2">
                {currentStatus}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
