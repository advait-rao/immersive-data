"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { inferColumns } from "@/lib/charting";
import { parseCsv, type CsvRow } from "@/lib/csv";
import { buildImmersivePoints } from "@/lib/immersive";
import { normalizeCricketSampleRows } from "@/lib/sample";

import { ImmersiveViewer } from "./ImmersiveViewer";

type LoadedDataset = {
  title: string;
  subtitle: string;
  rows: CsvRow[];
  defaultXColumn?: string;
  defaultYColumn?: string;
  defaultZColumn?: string;
  defaultLabelColumn?: string;
};

type UploadedDataset = {
  fileName: string;
  rows: CsvRow[];
  uploadedAt: string;
};

export function StudioWorkspace() {
  const searchParams = useSearchParams();
  const source = searchParams.get("source") ?? "sample";
  const sessionId = searchParams.get("session");

  const [dataset, setDataset] = useState<LoadedDataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [xColumn, setXColumn] = useState("");
  const [yColumn, setYColumn] = useState("");
  const [zColumn, setZColumn] = useState("");
  const [labelColumn, setLabelColumn] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setDataset(null);

      try {
        if (source === "upload") {
          if (!sessionId) {
            throw new Error("Missing upload session. Start from the landing page and upload again.");
          }

          const raw = window.sessionStorage.getItem(`statstage:dataset:${sessionId}`);
          if (!raw) {
            throw new Error("Upload session expired. Please upload your CSV again.");
          }

          const uploaded = JSON.parse(raw) as UploadedDataset;
          if (!uploaded.rows?.length) {
            throw new Error("Uploaded dataset is empty.");
          }

          if (!cancelled) {
            setDataset({
              title: uploaded.fileName,
              subtitle: "Uploaded dataset",
              rows: uploaded.rows,
            });
          }
          return;
        }

        const response = await fetch("/datasets/test_cricket_records.csv");
        if (!response.ok) {
          throw new Error(`Could not load sample dataset (${response.status})`);
        }

        const csv = await response.text();
        const parsedRows = parseCsv(csv);
        const normalizedRows = normalizeCricketSampleRows(parsedRows);

        if (!normalizedRows.length) {
          throw new Error("Sample dataset could not be parsed.");
        }

        if (!cancelled) {
          setDataset({
            title: "6000 Run Club",
            subtitle: "Sample dataset",
            rows: normalizedRows,
            defaultXColumn: "DebutYear",
            defaultYColumn: "RunsClean",
            defaultZColumn: "Strike Rate",
            defaultLabelColumn: "Player",
          });
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Could not load dataset.";
          setErrorMessage(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [source, sessionId]);

  const columnInference = useMemo(() => inferColumns(dataset?.rows ?? []), [dataset?.rows]);

  useEffect(() => {
    if (!dataset) return;

    const allColumns = columnInference.allColumns;
    const numericColumns = columnInference.numericColumns;

    setXColumn((current) => {
      if (current && allColumns.includes(current)) return current;
      if (dataset.defaultXColumn && allColumns.includes(dataset.defaultXColumn)) {
        return dataset.defaultXColumn;
      }
      return numericColumns[0] ?? allColumns[0] ?? "";
    });

    setYColumn((current) => {
      if (current && allColumns.includes(current)) return current;
      if (dataset.defaultYColumn && allColumns.includes(dataset.defaultYColumn)) {
        return dataset.defaultYColumn;
      }
      return numericColumns.find((column) => column !== xColumn) ?? numericColumns[0] ?? allColumns[1] ?? allColumns[0] ?? "";
    });

    setZColumn((current) => {
      if (current && allColumns.includes(current)) return current;
      if (dataset.defaultZColumn && allColumns.includes(dataset.defaultZColumn)) {
        return dataset.defaultZColumn;
      }
      return (
        numericColumns.find((column) => column !== xColumn && column !== yColumn) ??
        numericColumns.find((column) => column !== xColumn) ??
        numericColumns[0] ??
        allColumns[2] ??
        allColumns[0] ??
        ""
      );
    });

    setLabelColumn((current) => {
      if (current && allColumns.includes(current)) return current;
      if (dataset.defaultLabelColumn && allColumns.includes(dataset.defaultLabelColumn)) {
        return dataset.defaultLabelColumn;
      }
      const nonNumeric = allColumns.filter((column) => !numericColumns.includes(column));
      return nonNumeric[0] ?? allColumns[0] ?? "";
    });
  }, [columnInference.allColumns, columnInference.numericColumns, dataset, xColumn, yColumn]);

  const points = useMemo(() => {
    if (!dataset || !xColumn || !yColumn || !zColumn) return [];

    return buildImmersivePoints(dataset.rows, {
      xColumn,
      yColumn,
      zColumn,
      labelColumn,
    });
  }, [dataset, labelColumn, xColumn, yColumn, zColumn]);

  const columns = columnInference.allColumns;
  const numericColumns = columnInference.numericColumns;

  return (
    <main className="page-shell studio-shell">
      <header className="studio-header">
        <div>
          <p className="eyebrow">StatStage Studio</p>
          <h1>{dataset?.title ?? "Loading dataset"}</h1>
          <p className="hero-copy">{dataset?.subtitle ?? "Preparing your immersive scene"}</p>
        </div>

        <Link href="/" className="secondary-link">
          Back to Landing
        </Link>
      </header>

      {isLoading ? <section className="card">Loading dataset...</section> : null}

      {errorMessage ? (
        <section className="card error-card">
          <p>{errorMessage}</p>
          <Link href="/" className="secondary-link">
            Return to landing
          </Link>
        </section>
      ) : null}

      {!isLoading && !errorMessage && dataset ? (
        <>
          <section className="card controls-grid" aria-label="Scene controls">
            <div className="control-field">
              <label htmlFor="x-column">X axis</label>
              <select id="x-column" value={xColumn} onChange={(event) => setXColumn(event.target.value)}>
                {columns.map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-field">
              <label htmlFor="y-column">Y axis</label>
              <select id="y-column" value={yColumn} onChange={(event) => setYColumn(event.target.value)}>
                {columns.map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-field">
              <label htmlFor="z-column">Z axis</label>
              <select id="z-column" value={zColumn} onChange={(event) => setZColumn(event.target.value)}>
                {columns.map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-field">
              <label htmlFor="label-column">Point labels</label>
              <select id="label-column" value={labelColumn} onChange={(event) => setLabelColumn(event.target.value)}>
                {columns.map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </select>
            </div>

            <div className="stats-row">
              <span>{dataset.rows.length} rows</span>
              <span>{columns.length} columns</span>
              <span>{points.length} plotted points</span>
            </div>
          </section>

          {numericColumns.length < 2 ? (
            <section className="card warning-card">
              <p>
                This dataset has limited numeric columns. For best immersion, upload a CSV with at least three numeric dimensions.
              </p>
            </section>
          ) : null}

          <section className="card immersive-card">
            <ImmersiveViewer points={points} xLabel={xColumn} yLabel={yColumn} zLabel={zColumn} />
          </section>

          <section className="card preview-card">
            <h2>Data Preview</h2>
            <div className="preview-table-wrap">
              <table>
                <thead>
                  <tr>
                    {columns.slice(0, 6).map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataset.rows.slice(0, 8).map((row, index) => (
                    <tr key={`row-${index}`}>
                      {columns.slice(0, 6).map((column) => (
                        <td key={`${column}-${index}`}>{row[column]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
