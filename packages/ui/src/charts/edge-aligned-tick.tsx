interface EdgeAlignedTickProps {
  x?: number;
  y?: number;
  payload?: { value: string | number };
  firstValue?: string;
  lastValue?: string;
}

/** Tick sumbu-X: label pertama rata kiri, terakhir rata kanan agar tidak terpotong. */
export function EdgeAlignedTick({
  x = 0,
  y = 0,
  payload,
  firstValue,
  lastValue,
}: EdgeAlignedTickProps) {
  const value = String(payload?.value ?? "");
  const anchor =
    value === firstValue ? "start" : value === lastValue ? "end" : "middle";

  return (
    <text
      x={x}
      y={y}
      dy={3}
      fontSize={11}
      textAnchor={anchor}
      className="fill-muted-foreground"
    >
      {parseInt(value, 10)}
    </text>
  );
}
