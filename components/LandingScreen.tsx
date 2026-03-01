"use client";

import { SignInButton, SignOutButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { inferColumns } from "@/lib/charting";
import { parseCsv } from "@/lib/csv";

const previewPoints = [
  { left: "12%", top: "79%", size: 9, delay: "0s", color: "#7ecfff" },
  { left: "26%", top: "61%", size: 7, delay: "0.17s", color: "#9fe3ff" },
  { left: "40%", top: "49%", size: 9, delay: "0.34s", color: "#65c4ff" },
  { left: "58%", top: "37%", size: 8, delay: "0.51s", color: "#ffd286" },
  { left: "74%", top: "27%", size: 7, delay: "0.68s", color: "#87d7ff" },
];

const heroStats = [
  { label: "Time To First Scene", value: "< 60 sec" },
  { label: "Modes", value: "Playground + Tour" },
  { label: "Starting Point", value: "Your CSV or Demo" },
];

const creationModes = [
  {
    key: "playground",
    label: "Mode 1",
    title: "Playground",
    body: "Explore your data live with camera, search, and focus controls while you narrate in real time.",
    points: ["Live exploration", "Interactive isolate + focus", "Best for streams and walkthroughs"],
  },
  {
    key: "tour",
    label: "Mode 2",
    title: "Tour",
    body: "Build a guided sequence of moments so every insight lands in a clear order and pacing.",
    points: ["Shot-by-shot storytelling", "Narrative-ready sequencing", "Built for shareable recaps"],
  },
];

const storyPipeline = [
  {
    step: "01",
    title: "Ingest And Profile",
    body: "Upload raw CSV and infer dimensions so the scene starts with valid structure.",
  },
  {
    step: "02",
    title: "Direct The Narrative",
    body: "Choose whether you want freeform exploration or a guided tour sequence.",
  },
  {
    step: "03",
    title: "Control The Camera",
    body: "Search, isolate, and focus specific entities to highlight the key story beats.",
  },
  {
    step: "04",
    title: "Publish-Ready Output",
    body: "Use immersive playback now and evolve toward export formats for every channel.",
  },
];

const capabilityCards = [
  {
    title: "Story Director, Not Just Chart Renderer",
    body: "StatStage is designed to turn datasets into narrative moments with intentional pacing and emphasis.",
  },
  {
    title: "Creative Control With Structured Guidance",
    body: "Keep editorial ownership while the platform helps organize scenes, steps, and on-screen focus.",
  },
  {
    title: "Built For Real Creator Workflows",
    body: "From quick live analysis to curated tours, the product supports both immediate and polished delivery.",
  },
];

export function LandingScreen() {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const authEnabled = Boolean(clerkPublishableKey);
  const isClerkDevelopmentInstance = clerkPublishableKey.startsWith("pk_test_");
  const authButtonMode = isClerkDevelopmentInstance ? "redirect" : "modal";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const interactiveStageRef = useRef<HTMLDivElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  useEffect(() => {
    const mount = interactiveStageRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog("#060913", 8, 28);

    const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
    camera.position.set(0, 5.2, 11.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x8ab6ff, 0.58);
    const keyLight = new THREE.DirectionalLight(0x7bc6ff, 1.05);
    keyLight.position.set(4, 8, 6);
    const rimLight = new THREE.DirectionalLight(0xffcc7a, 0.64);
    rimLight.position.set(-5, 6, -4);
    scene.add(ambient, keyLight, rimLight);

    const grid = new THREE.GridHelper(20, 20, 0x2f68a7, 0x1f3c66);
    grid.position.y = -1.8;
    const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
    for (const material of gridMaterials) {
      material.transparent = true;
      material.opacity = 0.28;
    }
    scene.add(grid);

    const storyGroup = new THREE.Group();
    scene.add(storyGroup);

    const pointGeometry = new THREE.SphereGeometry(0.12, 12, 12);
    const pointMeshes: THREE.Mesh[] = [];

    for (let index = 0; index < 120; index += 1) {
      const seed = index / 120;
      const radius = 2.4 + Math.sin(seed * Math.PI * 6.5) * 2.1;
      const angle = seed * Math.PI * 9.5;
      const y = (seed - 0.5) * 4.4 + Math.sin(seed * Math.PI * 7.6) * 0.52;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const hue = 0.56 + Math.sin(seed * Math.PI * 2.2) * 0.08;

      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(hue, 0.84, 0.61),
        emissive: new THREE.Color().setHSL(hue, 0.72, 0.23),
        roughness: 0.22,
        metalness: 0.06,
      });

      const point = new THREE.Mesh(pointGeometry, material);
      point.position.set(x, y, z);
      point.userData.phase = Math.random() * Math.PI * 2;
      storyGroup.add(point);
      pointMeshes.push(point);
    }

    const curveAnchors = [
      new THREE.Vector3(-4.7, -1.5, 2.9),
      new THREE.Vector3(-2.8, -0.4, -2.1),
      new THREE.Vector3(0.8, 0.7, 0.2),
      new THREE.Vector3(2.6, 1.3, 2.3),
      new THREE.Vector3(4.4, 2.3, -1.8),
    ];
    const narrativeCurve = new THREE.CatmullRomCurve3(curveAnchors);
    const pathGeometry = new THREE.TubeGeometry(narrativeCurve, 120, 0.055, 10, false);
    const pathMaterial = new THREE.MeshStandardMaterial({
      color: 0xffcf87,
      emissive: 0x8e6428,
      roughness: 0.3,
      metalness: 0.08,
    });
    const pathMesh = new THREE.Mesh(pathGeometry, pathMaterial);
    scene.add(pathMesh);

    const pointer = new THREE.Vector2(0, 0);
    const handlePointerMove = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    const handlePointerLeave = () => {
      pointer.set(0, 0);
    };

    mount.addEventListener("pointermove", handlePointerMove);
    mount.addEventListener("pointerleave", handlePointerLeave);

    const setSize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const resizeObserver = new ResizeObserver(() => setSize());
    resizeObserver.observe(mount);
    setSize();

    const clock = new THREE.Clock();
    let frameId = 0;

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      storyGroup.rotation.y = elapsed * 0.11 + pointer.x * 0.22;
      storyGroup.rotation.x = pointer.y * 0.09;

      for (const point of pointMeshes) {
        const phase = point.userData.phase as number;
        const pulse = 0.92 + Math.sin(elapsed * 1.8 + phase) * 0.18;
        point.scale.setScalar(pulse);
      }

      pathMesh.rotation.y = elapsed * 0.08;
      camera.position.x = pointer.x * 1.5;
      camera.position.y = 5.2 - pointer.y * 1.05;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      mount.removeEventListener("pointermove", handlePointerMove);
      mount.removeEventListener("pointerleave", handlePointerLeave);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }

      grid.geometry.dispose();
      gridMaterials.forEach((material) => material.dispose());

      const disposedGeometries = new Set<THREE.BufferGeometry>();
      scene.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return;
        if (!disposedGeometries.has(node.geometry)) {
          node.geometry.dispose();
          disposedGeometries.add(node.geometry);
        }
        if (Array.isArray(node.material)) {
          node.material.forEach((material) => material.dispose());
          return;
        }
        node.material.dispose();
      });

      renderer.dispose();
    };
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
    <main className="page-shell landing-shell landing-vision">
      <section className="vision-hero is-visible" data-reveal>
        <div className="vision-hero-copy">
          <div className="auth-actions" aria-label="Authentication actions">
            {authEnabled ? (
              <>
                <SignedOut>
                  <SignInButton mode={authButtonMode} fallbackRedirectUrl="/">
                    <button type="button" className="secondary-btn auth-btn">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode={authButtonMode} fallbackRedirectUrl="/">
                    <button type="button" className="primary-btn auth-btn">
                      Create Account
                    </button>
                  </SignUpButton>
                  {isClerkDevelopmentInstance ? <span className="auth-mode-label">Clerk test keys active</span> : null}
                </SignedOut>

                <SignedIn>
                  <div className="auth-signed-in">
                    <span className="auth-status-label">Logged In</span>
                    <SignOutButton redirectUrl="/">
                      <button type="button" className="secondary-btn auth-btn auth-logout-btn">
                        Log Out
                      </button>
                    </SignOutButton>
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </SignedIn>
              </>
            ) : (
              <span className="auth-status-label">Auth Not Configured</span>
            )}
          </div>

          <p className="vision-kicker">StatStage</p>
          <h1 className="vision-title">
            Direct data stories with the clarity
            <span> of a live studio show.</span>
          </h1>
          <p className="vision-summary">
            StatStage is built to become a storytelling director for creators: ingest a dataset, choose your mode,
            shape the narrative, and deliver an immersive experience that people remember.
          </p>

          <div className="vision-stat-grid" aria-label="Product snapshot">
            {heroStats.map((item) => (
              <article className="vision-stat-card" key={item.label}>
                <p>{item.value}</p>
                <span>{item.label}</span>
              </article>
            ))}
          </div>

          <div className="vision-action-row">
            <button type="button" className="primary-btn landing-cta" onClick={openUploadPicker} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload CSV And Start"}
            </button>
            <button type="button" className="secondary-btn landing-cta" onClick={onSampleClick}>
              Watch Live Demo Scene
            </button>
          </div>

          <p className="cta-microcopy">
            Start with your own file or{" "}
            <button type="button" className="tertiary-link-btn" onClick={onTemplateClick}>
              download a ready-to-use CSV template.
            </button>
          </p>

          <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={onUploadChange} hidden />

          {uploadError ? <p className="error-text">{uploadError}</p> : null}
        </div>

        <aside className="vision-hero-panel" aria-label="Story director preview">
          <div className="vision-panel-head">
            <p>Story Director Console</p>
            <span>Draft Tour</span>
          </div>

          <div className="vision-stage">
            <div ref={interactiveStageRef} className="vision-stage-canvas" />
            <div className="vision-stage-grid" />
            <div className="vision-stage-ring vision-stage-ring-a" />
            <div className="vision-stage-ring vision-stage-ring-b" />
            <div className="vision-stage-ring vision-stage-ring-c" />

            {previewPoints.map((point) => (
              <span
                key={`${point.left}-${point.top}`}
                className="vision-stage-point"
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

            <div className="vision-stage-hud vision-stage-hud-top">Dataset Mapped</div>
            <div className="vision-stage-hud vision-stage-hud-bottom">X: Seasons | Y: Runs | Z: Strike Rate</div>
            <div className="vision-stage-score">Playground Active</div>
          </div>

          <div className="vision-shot-list">
            {storyPipeline.slice(0, 3).map((item) => (
              <div key={item.step} className="vision-shot-item">
                <strong>{item.step}</strong>
                <p>{item.title}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="vision-mode-grid" aria-label="Creation modes" data-reveal>
        {creationModes.map((mode) => (
          <article key={mode.key} className="vision-mode-card">
            <p className="vision-mode-label">{mode.label}</p>
            <h2>{mode.title}</h2>
            <p className="vision-mode-body">{mode.body}</p>
            <ul>
              {mode.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            {mode.key === "playground" ? (
              <button type="button" className="primary-btn" onClick={openUploadPicker} disabled={isUploading}>
                {isUploading ? "Uploading..." : "Start Playground"}
              </button>
            ) : (
              <button type="button" className="secondary-btn" onClick={onSampleClick}>
                Preview Tour Demo
              </button>
            )}
          </article>
        ))}
      </section>

      <section className="vision-flow" aria-label="Narrative workflow" data-reveal>
        <div className="vision-flow-header">
          <p className="eyebrow">Workflow</p>
          <h2>From raw CSV to guided story delivery.</h2>
        </div>
        <div className="vision-flow-grid">
          {storyPipeline.map((item) => (
            <article key={item.step} className="vision-flow-card">
              <p className="vision-flow-step">{item.step}</p>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="vision-capability-grid" aria-label="Value proposition" data-reveal>
        {capabilityCards.map((card) => (
          <article key={card.title} className="vision-capability-card">
            <h2>{card.title}</h2>
            <p>{card.body}</p>
          </article>
        ))}
      </section>

      <section className="final-cta vision-final-cta" aria-label="Final call to action" data-reveal>
        <div>
          <p className="eyebrow">Ready To Direct Your Next Story?</p>
          <h2>Launch a scene now, then evolve it into a full guided tour.</h2>
          <p>
            Use the current immersive playground today and move toward repeatable creator workflows across channels.
          </p>
        </div>
        <div className="final-cta-actions">
          <button type="button" className="primary-btn" onClick={openUploadPicker} disabled={isUploading}>
            {isUploading ? "Uploading..." : "Start With Your CSV"}
          </button>
          <button type="button" className="secondary-btn" onClick={onTemplateClick}>
            Download CSV Template
          </button>
          <button type="button" className="secondary-btn" onClick={onSampleClick}>
            Open Demo Scene
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
