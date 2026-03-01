"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";

import { inferColumns } from "@/lib/charting";
import { parseCsv } from "@/lib/csv";

const previewPoints = [
  { left: "11%", top: "72%", size: 10, delay: "0s", color: "#97abd4" },
  { left: "24%", top: "60%", size: 8, delay: "0.2s", color: "#c3cfeb" },
  { left: "37%", top: "48%", size: 12, delay: "0.35s", color: "#7f98d8" },
  { left: "52%", top: "53%", size: 9, delay: "0.5s", color: "#c6a66a" },
  { left: "64%", top: "38%", size: 11, delay: "0.65s", color: "#9caed7" },
  { left: "78%", top: "28%", size: 8, delay: "0.8s", color: "#d5deef" },
  { left: "85%", top: "45%", size: 9, delay: "0.95s", color: "#9aa8c8" },
];

const sportsTicker = [
  { label: "Scene Build", value: "<10s" },
  { label: "Story Modes", value: "Tour / Focus / Search" },
  { label: "Best For", value: "Podcasts + YouTube" },
];

const conversionStats = [
  { label: "Setup", value: "1 CSV Upload" },
  { label: "Scene Controls", value: "Search + Focus + Tour" },
  { label: "Start Options", value: "Demo Or Your Data" },
];

const flowSteps = [
  {
    title: "Upload or use a test CSV",
    body: "Bring your own dataset or start with a ready-made sports CSV template.",
  },
  {
    title: "Generate immersive scene",
    body: "StatStage maps your dimensions into an interactive 3D storytelling environment.",
  },
  {
    title: "Present your narrative",
    body: "Use search, isolate, and tour controls to drive your segment live on air.",
  },
];

export function LandingScreen() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!elements.length) return;

    if (typeof IntersectionObserver === "undefined") {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );

    elements.forEach((element, index) => {
      element.style.setProperty("--reveal-delay", `${Math.min(index * 90, 420)}ms`);
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const openUploadPicker = () => {
    fileInputRef.current?.click();
  };

  const onSampleClick = () => {
    window.location.assign("/immersive-6000-run-club/index.html");
  };

  const onTemplateClick = () => {
    window.location.assign("/datasets/t20-top20-batters.csv");
  };

  const onUploadChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      const fileText = await file.text();
      const rows = parseCsv(fileText);

      if (rows.length < 2) {
        throw new Error("Upload a CSV with at least two data rows.");
      }

      const projection = inferUploadProjection(rows);

      const datasetId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `dataset-${Date.now()}`;

      window.sessionStorage.setItem(
        `statstage:dataset:${datasetId}`,
        JSON.stringify({
          fileName: file.name,
          rows,
          projection,
          uploadedAt: new Date().toISOString(),
        }),
      );

      window.location.assign(`/immersive-upload/index.html?session=${encodeURIComponent(datasetId)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not process that file.";
      setUploadError(message);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <main className="page-shell landing-shell">
      <section className="landing-hero is-visible" data-reveal>
        <div className="landing-copy">
          <p className="brand-kicker">StatStage</p>
          <p className="brand-subline">Studio-Grade Sports Data Storytelling</p>
          <p className="brand-display">StatStage</p>
          <p className="eyebrow">Game-Day Data Broadcast Toolkit</p>
          <h1 className="landing-title">
            Bring your match data
            <span> to life on screen.</span>
          </h1>
          <p className="hero-copy">
            StatStage transforms plain CSVs into polished immersive scenes built for live segments, breakdowns, and
            creator storytelling. Upload, explore, and present with confidence.
          </p>

          <div className="sports-ticker" aria-label="Product snapshot">
            {sportsTicker.map((item) => (
              <div className="sports-ticker-item" key={item.label}>
                <span className="sports-ticker-label">{item.label}</span>
                <span className="sports-ticker-value">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="landing-action-row">
            <button type="button" className="primary-btn landing-cta" onClick={openUploadPicker} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload CSV + Generate Scene"}
            </button>
            <button type="button" className="secondary-btn landing-cta" onClick={onSampleClick}>
              View 6000 Run Club Demo
            </button>
          </div>

          <p className="cta-microcopy">
            No setup required. Upload and explore directly in browser.
            <button type="button" className="tertiary-link-btn" onClick={onTemplateClick}>
              Download a T20 test CSV
            </button>
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={onUploadChange}
            hidden
          />

          {uploadError ? <p className="error-text">{uploadError}</p> : null}

          <div className="landing-proof-row">
            <span>Immersive 3D arena</span>
            <span>Fast CSV onboarding</span>
            <span>Live segment controls</span>
          </div>
        </div>

        <div className="landing-visual-card" aria-label="Immersive preview">
          <div className="landing-stage">
            <div className="landing-stage-grid" />
            <div className="landing-stage-ring landing-stage-ring-a" />
            <div className="landing-stage-ring landing-stage-ring-b" />
            <div className="landing-stage-ring landing-stage-ring-c" />

            {previewPoints.map((point) => (
              <span
                key={`${point.left}-${point.top}`}
                className="landing-stage-point"
                style={{
                  left: point.left,
                  top: point.top,
                  width: `${point.size}px`,
                  height: `${point.size}px`,
                  animationDelay: point.delay,
                  background: point.color,
                }}
              />
            ))}

            <div className="landing-stage-hud landing-stage-hud-top">Game Tape Immersive Preview</div>
            <div className="landing-stage-hud landing-stage-hud-bottom">X: Seasons | Y: Runs | Z: Strike Rate</div>
            <div className="landing-stage-score">Live Breakdown Mode</div>
          </div>
        </div>
      </section>

      <section className="conversion-strip" aria-label="Conversion highlights" data-reveal>
        {conversionStats.map((item) => (
          <article key={item.label} className="conversion-card">
            <p className="conversion-value">{item.value}</p>
            <p className="conversion-label">{item.label}</p>
          </article>
        ))}
      </section>

      <section className="how-section" aria-label="How StatStage works" data-reveal>
        <div className="how-header">
          <p className="eyebrow">How It Works</p>
          <h2>From raw CSV to on-air story in three steps.</h2>
        </div>
        <div className="how-grid">
          {flowSteps.map((step, index) => (
            <article key={step.title} className="how-card">
              <p className="how-step">{`0${index + 1}`}</p>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="details-toggle-wrap" data-reveal>
        <button
          type="button"
          className="secondary-btn details-toggle-btn"
          onClick={() => setShowDetails((current) => !current)}
        >
          {showDetails ? "Hide Additional Product Details" : "Show Additional Product Details"}
        </button>
      </section>

      {showDetails ? (
        <section className="landing-value-grid details-panel is-visible" aria-label="Product highlights" data-reveal>
          <article className="landing-value-card">
            <h2>From Dataset to Match Segment</h2>
            <p>Drop in your CSV and StatStage builds a camera-ready scene you can present right away.</p>
          </article>
          <article className="landing-value-card">
            <h2>Built for Clutch Storytelling</h2>
            <p>Search, isolate, and guide attention to key moments with deliberate motion and focus.</p>
          </article>
          <article className="landing-value-card">
            <h2>Premium Broadcast Feel</h2>
            <p>Give your audience a studio-grade data breakdown instead of another static screenshot.</p>
          </article>
        </section>
      ) : null}

      <section className="choice-grid" aria-label="Choose dataset source" data-reveal>
        <article className="choice-card">
          <h2>Build Your Match Scene</h2>
          <p>Upload your dataset and generate a brand-new immersive game-analysis environment.</p>
          <button type="button" className="primary-btn" onClick={openUploadPicker} disabled={isUploading}>
            {isUploading ? "Uploading..." : "Upload CSV"}
          </button>
        </article>

        <article className="choice-card">
          <h2>Watch Signature Demo</h2>
          <p>Open the 6000-run-club immersive breakdown to see the production style in action.</p>
          <button type="button" className="secondary-btn" onClick={onSampleClick}>
            Open 6000 Run Club Sample
          </button>
        </article>
      </section>

      <section className="final-cta" aria-label="Final call to action" data-reveal>
        <div>
          <p className="eyebrow">Ready To Go Live?</p>
          <h2>Turn your next sports segment into an immersive data moment.</h2>
          <p>Start with your own CSV now, or test the workflow with our ready-made T20 template and demo scene.</p>
        </div>
        <div className="final-cta-actions">
          <button type="button" className="primary-btn" onClick={openUploadPicker} disabled={isUploading}>
            {isUploading ? "Uploading..." : "Start With Your CSV"}
          </button>
          <button type="button" className="secondary-btn" onClick={onTemplateClick}>
            Download T20 Template
          </button>
          <button type="button" className="secondary-btn" onClick={onSampleClick}>
            Watch Demo
          </button>
        </div>
      </section>
    </main>
  );
}

function inferUploadProjection(rows: Array<Record<string, string>>) {
  const inference = inferColumns(rows);
  const allColumns = inference.allColumns;
  const numericColumns = inference.numericColumns;
  const nonNumericColumns = allColumns.filter((column) => !numericColumns.includes(column));

  const xColumn = inference.xColumn ?? numericColumns[0] ?? allColumns[0] ?? "x";
  const yColumn =
    inference.yColumn ??
    numericColumns.find((column) => column !== xColumn) ??
    numericColumns[0] ??
    allColumns[1] ??
    allColumns[0] ??
    "y";
  const zColumn =
    numericColumns.find((column) => column !== xColumn && column !== yColumn) ??
    numericColumns.find((column) => column !== xColumn) ??
    numericColumns[0] ??
    allColumns[2] ??
    allColumns[0] ??
    "z";
  const labelColumn = nonNumericColumns[0] ?? allColumns[0] ?? "label";

  return { xColumn, yColumn, zColumn, labelColumn };
}
