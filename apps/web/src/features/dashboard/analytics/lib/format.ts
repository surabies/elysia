const LOCALE = "id-ID";

export const formatNumber = (value: number): string =>
  value.toLocaleString(LOCALE);

export const formatPercent = (value: number | null | undefined): string =>
  `${(value ?? 0).toFixed(1)}%`;

export const formatDate = (date: Date): string =>
  date.toLocaleDateString(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
