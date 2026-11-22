// features/dashboard/import/lib/csv.ts
// Tokenizer CSV (pemisah koma atau titik koma, kutip ganda RFC-4180).

export function detectDelimiter(text: string): string {
  const firstLine =
    text.split(/\r?\n/).find((line) => line.trim().length > 0) || "";
  const countSemi = (firstLine.match(/;/g) || []).length;
  const countComma = (firstLine.match(/,/g) || []).length;
  const countTab = (firstLine.match(/\t/g) || []).length;

  if (countSemi > countComma && countSemi > countTab) return ";";
  if (countTab > countComma && countTab > countSemi) return "\t";
  if (countComma > 0) return ",";
  return ";";
}

export function tokenizeCsv(text: string, explicitDelimiter?: string): string[][] {
  const delimiter = explicitDelimiter || detectDelimiter(text);
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let insideQuotes = false;

  const flushRow = () => {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) rows.push(currentRow);
    currentRow = [];
    currentField = "";
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (!insideQuotes && char === delimiter) {
      currentRow.push(currentField.trim());
      currentField = "";
    } else if (!insideQuotes && (char === "\r" || char === "\n")) {
      if (char === "\r" && next === "\n") i++;
      flushRow();
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) flushRow();
  return rows;
}

const normalizeHeader = (value: string) =>
  value
    .replace(/^["']|["']$/g, "")
    .trim()
    .toLowerCase();

/**
 * Pencari indeks kolom berdasarkan daftar alias.
 * Kecocokan persis diprioritaskan sebelum kecocokan sebagian, sehingga
 * "pakai" tidak salah menangkap kolom "pakai lalu".
 */
export function createColumnFinder(headerRow: string[]) {
  const header = headerRow.map(normalizeHeader);
  return (aliases: readonly string[]): number => {
    for (const alias of aliases) {
      const exact = header.indexOf(alias);
      if (exact >= 0) return exact;
    }
    for (const alias of aliases) {
      const partial = header.findIndex((h) => h.includes(alias));
      if (partial >= 0) return partial;
    }
    return -1;
  };
}

export const readCell = (parts: string[], index: number): string =>
  index >= 0 ? (parts[index] ?? "").trim() : "";

/** Angka desimal dengan koma atau titik; `undefined` bila kosong/tidak valid. */
export function parseDecimal(value: string): number | undefined {
  if (!value) return undefined;
  const parsed = parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}
