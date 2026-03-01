import type { CsvRow } from "./csv";

export function normalizeCricketSampleRows(rows: CsvRow[]): CsvRow[] {
  const normalizedRows: CsvRow[] = [];

  rows.forEach((row) => {
    const spanYears = parseSpanYears(row.Span ?? "");
    if (!spanYears) return;

    const runs = parseInteger(row.Runs);
    if (runs === null) return;

    const normalizedRow: CsvRow = {
      ...row,
      DebutYear: String(spanYears.debutYear),
      LastYear: String(spanYears.lastYear),
      RunsClean: String(runs),
    };

    normalizedRows.push(normalizedRow);
  });

  return normalizedRows;
}

function parseSpanYears(spanText: string): { debutYear: number; lastYear: number } | null {
  const matches = String(spanText).match(/\d{4}/g);
  if (!matches || matches.length < 2) return null;

  const debutYear = Number.parseInt(matches[0], 10);
  const lastYear = Number.parseInt(matches[matches.length - 1], 10);

  if (!Number.isFinite(debutYear) || !Number.isFinite(lastYear)) {
    return null;
  }

  return { debutYear, lastYear };
}

function parseInteger(value: string | undefined): number | null {
  const cleaned = String(value ?? "").replace(/[^0-9.-]/g, "");
  if (!cleaned) return null;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}
