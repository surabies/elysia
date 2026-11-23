"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Opsi } from "../data";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Opsi[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
};

// Pembungkus Select: label di atas, error di bawah.
// `items` dipakai Base UI agar trigger menampilkan label (bukan value).
// Jika stack-mu Radix, hapus prop `items` dan ganti value={value}.
export function FieldSelect({ label, value, onChange, options, placeholder, disabled, error }: Props) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Select
        items={options}
        value={value || null}
        onValueChange={(v) => onChange((v as string | null) ?? "")}
        disabled={disabled}
      >
        <SelectTrigger className="w-full" aria-invalid={!!error}>
          <SelectValue placeholder={placeholder ?? "Pilih"} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
