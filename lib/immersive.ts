import type { CsvRow } from "./csv";

export type ImmersivePoint = {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  xRaw: string;
  yRaw: string;
  zRaw: string;
  row: CsvRow;
};

export type ImmersiveBuildOptions = {
  xColumn: string;
  yColumn: string;
  zColumn: string;
  labelColumn?: string;
};

export type NumericBounds = {
  min: number;
  max: number;
};

export function buildImmersivePoints(rows: CsvRow[], options: ImmersiveBuildOptions): ImmersivePoint[] {
  const points: ImmersivePoint[] = [];

  rows.forEach((row, rowIndex) => {
    const y = parseContinuousValue(row[options.yColumn]);
    if (y === null) return;

    const parsedX = parseContinuousValue(row[options.xColumn]);
    const parsedZ = parseContinuousValue(row[options.zColumn]);

    const x = parsedX ?? rowIndex;
    const z = parsedZ ?? rowIndex;

    const labelSource = options.labelColumn ? row[options.labelColumn] : undefined;
    const label = String(labelSource ?? row.Player ?? row.Name ?? row.label ?? `Row ${rowIndex + 1}`).trim() || `Row ${rowIndex + 1}`;

    points.push({
      id: `${rowIndex}-${label}`,
      label,
      x,
      y,
      z,
      xRaw: String(row[options.xColumn] ?? ""),
      yRaw: String(row[options.yColumn] ?? ""),
      zRaw: String(row[options.zColumn] ?? ""),
      row,
    });
  });

  return points;
}

export function computeBounds(values: number[]): NumericBounds {
  if (!values.length) return { min: 0, max: 1 };

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return { min, max: min + 1 };
  }

  return { min, max };
}

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  if (inMax === inMin) return (outMin + outMax) / 2;
  const ratio = (value - inMin) / (inMax - inMin);
  return outMin + ratio * (outMax - outMin);
}

function parseContinuousValue(value: unknown): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const cleaned = raw.replace(/[^0-9.-]/g, "");
  if (cleaned) {
    const numeric = Number.parseFloat(cleaned);
    if (Number.isFinite(numeric)) return numeric;
  }

  const temporal = Date.parse(raw);
  return Number.isFinite(temporal) ? temporal : null;
}
