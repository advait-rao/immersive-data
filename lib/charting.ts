import type { CsvRow } from "./csv";

export type ColumnInference = {
  allColumns: string[];
  numericColumns: string[];
  xColumn: string | null;
  yColumn: string | null;
};

export function inferColumns(rows: CsvRow[]): ColumnInference {
  if (!rows.length) {
    return {
      allColumns: [],
      numericColumns: [],
      xColumn: null,
      yColumn: null,
    };
  }

  const allColumns = Object.keys(rows[0]);
  const numericColumns = allColumns.filter((column) => getNumericScore(rows, column) >= 0.7);

  const temporalColumn = allColumns.find((column) => getTemporalScore(rows, column) >= 0.7) ?? null;

  const xColumn = temporalColumn ?? allColumns[0] ?? null;
  const yColumn =
    numericColumns.find((column) => column !== xColumn) ??
    numericColumns[0] ??
    (allColumns[1] ?? allColumns[0] ?? null);

  return {
    allColumns,
    numericColumns,
    xColumn,
    yColumn,
  };
}

function getNumericScore(rows: CsvRow[], column: string): number {
  const values = rows.map((row) => row[column]).filter((value) => String(value ?? "").trim() !== "");
  if (!values.length) return 0;

  const numeric = values.filter((value) => parseNumeric(value) !== null);
  return numeric.length / values.length;
}

function getTemporalScore(rows: CsvRow[], column: string): number {
  const values = rows.map((row) => row[column]).filter((value) => String(value ?? "").trim() !== "");
  if (!values.length) return 0;

  const temporal = values.filter((value) => parseTemporal(value) !== null && looksLikeDate(String(value)));
  return temporal.length / values.length;
}

function parseNumeric(value: unknown): number | null {
  const cleaned = String(value ?? "").replace(/[^0-9.-]/g, "");
  if (!cleaned) return null;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseTemporal(value: unknown): number | null {
  const parsed = Date.parse(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function looksLikeDate(value: string): boolean {
  return /\d{4}[-/]\d{1,2}([-/]\d{1,2})?/.test(value.trim());
}
