(function () {
  const SESSION_STORAGE_PREFIX = "statstage:dataset:";
  const uploadInput = document.getElementById("uploadInput");
  const uploadError = document.getElementById("uploadError");
  const detailsPanel = document.getElementById("detailsPanel");
  const detailsToggle = document.getElementById("detailsToggle");

  const uploadButtons = [
    document.getElementById("uploadBtnPrimary"),
    document.getElementById("uploadBtnSecondary"),
    document.getElementById("uploadBtnFinal"),
  ].filter(Boolean);

  const sampleButtons = [
    document.getElementById("sampleBtnPrimary"),
    document.getElementById("sampleBtnSecondary"),
    document.getElementById("sampleBtnFinal"),
  ].filter(Boolean);

  const templateButtons = [
    document.getElementById("templateBtnInline"),
    document.getElementById("templateBtnFinal"),
  ].filter(Boolean);

  uploadButtons.forEach((button) => {
    button.addEventListener("click", () => uploadInput && uploadInput.click());
  });

  sampleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      window.location.assign("./public/immersive-6000-run-club/index.html");
    });
  });

  templateButtons.forEach((button) => {
    button.addEventListener("click", () => {
      window.location.assign("./public/datasets/t20-top20-batters.csv");
    });
  });

  if (detailsToggle && detailsPanel) {
    detailsToggle.addEventListener("click", () => {
      const shouldShow = detailsPanel.hidden;
      detailsPanel.hidden = !shouldShow;
      if (shouldShow) {
        detailsPanel.classList.add("is-visible");
      }
      detailsToggle.textContent = shouldShow
        ? "Hide Additional Product Details"
        : "Show Additional Product Details";
    });
  }

  if (uploadInput) {
    uploadInput.addEventListener("change", async (event) => {
      const target = event.target;
      const file = target.files && target.files[0];
      if (!file) return;

      setUploadingState(true);
      setUploadError("");

      try {
        const csvText = await file.text();
        const rows = parseCsv(csvText);
        if (rows.length < 2) {
          throw new Error("Upload a CSV with at least two data rows.");
        }

        const projection = inferUploadProjection(rows);
        const datasetId =
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `dataset-${Date.now()}`;

        window.sessionStorage.setItem(
          `${SESSION_STORAGE_PREFIX}${datasetId}`,
          JSON.stringify({
            fileName: file.name,
            rows,
            projection,
            uploadedAt: new Date().toISOString(),
          }),
        );

        window.location.assign(`./public/immersive-upload/index.html?session=${encodeURIComponent(datasetId)}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not process that file.";
        setUploadError(message);
      } finally {
        target.value = "";
        setUploadingState(false);
      }
    });
  }

  initializeRevealAnimations();

  function setUploadError(message) {
    if (!uploadError) return;
    uploadError.textContent = message;
    uploadError.hidden = !message;
  }

  function setUploadingState(isUploading) {
    uploadButtons.forEach((button) => {
      button.disabled = isUploading;
      if (button.id === "uploadBtnPrimary") {
        button.textContent = isUploading ? "Uploading..." : "Upload CSV + Generate Scene";
      } else if (button.id === "uploadBtnFinal") {
        button.textContent = isUploading ? "Uploading..." : "Start With Your CSV";
      } else {
        button.textContent = isUploading ? "Uploading..." : "Upload CSV";
      }
    });
  }

  function initializeRevealAnimations() {
    const elements = Array.from(document.querySelectorAll("[data-reveal]"));
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
  }

  function inferUploadProjection(rows) {
    const allColumns = rows.length ? Object.keys(rows[0]) : [];
    const numericColumns = allColumns.filter((column) => getNumericScore(rows, column) >= 0.7);
    const nonNumericColumns = allColumns.filter((column) => !numericColumns.includes(column));

    const temporalColumn = allColumns.find((column) => getTemporalScore(rows, column) >= 0.7) || null;

    const xColumn = temporalColumn || numericColumns[0] || allColumns[0] || "x";
    const yColumn =
      numericColumns.find((column) => column !== xColumn) ||
      numericColumns[0] ||
      allColumns[1] ||
      allColumns[0] ||
      "y";
    const zColumn =
      numericColumns.find((column) => column !== xColumn && column !== yColumn) ||
      numericColumns.find((column) => column !== xColumn) ||
      numericColumns[0] ||
      allColumns[2] ||
      allColumns[0] ||
      "z";
    const labelColumn = nonNumericColumns[0] || allColumns[0] || "label";

    return { xColumn, yColumn, zColumn, labelColumn };
  }

  function getNumericScore(rows, column) {
    const values = rows
      .map((row) => row[column])
      .filter((value) => String(value || "").trim() !== "");
    if (!values.length) return 0;
    const numeric = values.filter((value) => parseNumeric(value) !== null);
    return numeric.length / values.length;
  }

  function getTemporalScore(rows, column) {
    const values = rows
      .map((row) => row[column])
      .filter((value) => String(value || "").trim() !== "");
    if (!values.length) return 0;
    const temporal = values.filter((value) => parseTemporal(value) !== null && looksLikeDate(String(value)));
    return temporal.length / values.length;
  }

  function parseNumeric(value) {
    const cleaned = String(value || "").replace(/[^0-9.-]/g, "");
    if (!cleaned) return null;
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function parseTemporal(value) {
    const parsed = Date.parse(String(value || ""));
    return Number.isFinite(parsed) ? parsed : null;
  }

  function looksLikeDate(value) {
    return /\d{4}[-/]\d{1,2}([-/]\d{1,2})?/.test(value.trim());
  }

  function parseCsv(text) {
    const trimmed = text.trim();
    if (!trimmed) return [];

    const lines = trimmed.split(/\r?\n/);
    if (!lines.length) return [];

    const headers = splitCsvLine(lines[0]).map((header) => header.trim());
    const rows = [];

    for (const line of lines.slice(1)) {
      if (!line.trim()) continue;
      const values = splitCsvLine(line);
      const row = {};
      headers.forEach((header, index) => {
        row[header] = (values[index] || "").trim();
      });
      rows.push(row);
    }

    return rows;
  }

  function splitCsvLine(line) {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && nextChar === '"') {
        current += '"';
        i += 1;
        continue;
      }

      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
        continue;
      }

      current += char;
    }

    values.push(current);
    return values;
  }
})();
