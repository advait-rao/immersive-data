"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { computeBounds, mapRange, type ImmersivePoint } from "@/lib/immersive";

type Props = {
  points: ImmersivePoint[];
  xLabel: string;
  yLabel: string;
  zLabel: string;
};

type HoverInfo = {
  left: number;
  top: number;
  label: string;
  xRaw: string;
  yRaw: string;
  zRaw: string;
};

const WORLD = {
  xMin: -250,
  xMax: 250,
  yMin: 20,
  yMax: 250,
  zMin: -180,
  zMax: 180,
};

export function ImmersiveViewer({ points, xLabel, yLabel, zLabel }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  const bounds = useMemo(() => {
    return {
      x: computeBounds(points.map((point) => point.x)),
      y: computeBounds(points.map((point) => point.y)),
      z: computeBounds(points.map((point) => point.z)),
    };
  }, [points]);

  useEffect(() => {
    const mountElement = mountRef.current;
    if (!mountElement || !points.length) return;

    let frameHandle = 0;
    let currentHoverIndex = -1;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050913);
    scene.fog = new THREE.Fog(0x050913, 320, 1200);

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 2200);
    camera.position.set(430, 250, 380);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    mountElement.innerHTML = "";
    mountElement.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxDistance = 980;
    controls.minDistance = 90;
    controls.target.set(0, 100, 0);

    const hemisphereLight = new THREE.HemisphereLight(0x88daff, 0x12141b, 0.85);
    scene.add(hemisphereLight);

    const keyLight = new THREE.DirectionalLight(0xdaf5ff, 0.8);
    keyLight.position.set(220, 360, 150);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0xff8dc7, 0.9, 900);
    fillLight.position.set(-250, 140, -120);
    scene.add(fillLight);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(335, 96),
      new THREE.MeshStandardMaterial({
        color: 0x0a2438,
        metalness: 0.6,
        roughness: 0.4,
        transparent: true,
        opacity: 0.9,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.35;
    scene.add(floor);

    const grid = new THREE.GridHelper(660, 30, 0x318db7, 0x194b65);
    const gridMaterial = grid.material as THREE.Material;
    gridMaterial.transparent = true;
    gridMaterial.opacity = 0.23;
    scene.add(grid);

    addAxisLine(scene, new THREE.Vector3(WORLD.xMin, 0, WORLD.zMin), new THREE.Vector3(WORLD.xMax, 0, WORLD.zMin), 0x56def4);
    addAxisLine(scene, new THREE.Vector3(WORLD.xMin, WORLD.yMax, WORLD.zMin), new THREE.Vector3(WORLD.xMin, 0, WORLD.zMin), 0x56def4);
    addAxisLine(scene, new THREE.Vector3(WORLD.xMin, 0, WORLD.zMin), new THREE.Vector3(WORLD.xMin, 0, WORLD.zMax), 0x56def4);

    const worldPoints = points.map((point) => {
      const worldX = mapRange(point.x, bounds.x.min, bounds.x.max, WORLD.xMin, WORLD.xMax);
      const worldY = mapRange(point.y, bounds.y.min, bounds.y.max, WORLD.yMin, WORLD.yMax);
      const worldZ = mapRange(point.z, bounds.z.min, bounds.z.max, WORLD.zMin, WORLD.zMax);
      return { ...point, worldX, worldY, worldZ };
    });

    const positions = new Float32Array(worldPoints.length * 3);
    const colors = new Float32Array(worldPoints.length * 3);
    const color = new THREE.Color();

    worldPoints.forEach((point, index) => {
      const offset = index * 3;
      positions[offset] = point.worldX;
      positions[offset + 1] = point.worldY;
      positions[offset + 2] = point.worldZ;

      const hue = mapRange(point.y, bounds.y.min, bounds.y.max, 0.58, 0.03);
      color.setHSL(hue, 0.78, 0.59);
      colors[offset] = color.r;
      colors[offset + 1] = color.g;
      colors[offset + 2] = color.b;
    });

    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pointsGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const pointsMaterial = new THREE.PointsMaterial({
      size: 7,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });

    const cloud = new THREE.Points(pointsGeometry, pointsMaterial);
    scene.add(cloud);

    let trendLine: THREE.Line | null = null;
    if (worldPoints.length > 1) {
      const sorted = [...worldPoints].sort((a, b) => a.x - b.x);
      const linePositions = new Float32Array(sorted.length * 3);

      sorted.forEach((point, index) => {
        const offset = index * 3;
        linePositions[offset] = point.worldX;
        linePositions[offset + 1] = point.worldY;
        linePositions[offset + 2] = point.worldZ;
      });

      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x72c7ff,
        transparent: true,
        opacity: 0.22,
      });

      trendLine = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(trendLine);
    }

    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 1400;
    const starPositions = new Float32Array(starCount * 3);

    for (let index = 0; index < starCount; index += 1) {
      starPositions[index * 3] = (Math.random() - 0.5) * 1900;
      starPositions[index * 3 + 1] = Math.random() * 1200 + 40;
      starPositions[index * 3 + 2] = (Math.random() - 0.5) * 1900;
    }

    starsGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xdaf4ff,
      size: 1.4,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 8 };
    const mouse = new THREE.Vector2(2, 2);

    const resizeRenderer = () => {
      const { clientWidth, clientHeight } = mountElement;
      if (clientWidth === 0 || clientHeight === 0) return;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight, false);
    };

    resizeRenderer();

    const onPointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const relativeX = event.clientX - rect.left;
      const relativeY = event.clientY - rect.top;

      mouse.x = (relativeX / rect.width) * 2 - 1;
      mouse.y = -(relativeY / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersection = raycaster.intersectObject(cloud, false)[0];

      if (intersection?.index === undefined) {
        if (currentHoverIndex !== -1) {
          currentHoverIndex = -1;
          setHoverInfo(null);
        }
        return;
      }

      const hoverIndex = intersection.index;
      const point = worldPoints[hoverIndex];

      currentHoverIndex = hoverIndex;
      setHoverInfo({
        left: relativeX + 10,
        top: relativeY + 10,
        label: point.label,
        xRaw: point.xRaw,
        yRaw: point.yRaw,
        zRaw: point.zRaw,
      });
    };

    const onPointerLeave = () => {
      currentHoverIndex = -1;
      setHoverInfo(null);
    };

    const onResize = () => {
      resizeRenderer();
    };

    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("resize", onResize);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => resizeRenderer());
      resizeObserver.observe(mountElement);
    }

    const animate = () => {
      frameHandle = window.requestAnimationFrame(animate);
      stars.rotation.y += 0.00035;
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      setHoverInfo(null);
      window.cancelAnimationFrame(frameHandle);

      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", onResize);
      resizeObserver?.disconnect();

      controls.dispose();
      pointsGeometry.dispose();
      pointsMaterial.dispose();
      starsGeometry.dispose();
      starsMaterial.dispose();

      if (trendLine) {
        trendLine.geometry.dispose();
        (trendLine.material as THREE.Material).dispose();
      }

      scene.clear();
      renderer.dispose();
      if (mountElement.contains(renderer.domElement)) {
        mountElement.removeChild(renderer.domElement);
      }
    };
  }, [bounds.x.max, bounds.x.min, bounds.y.max, bounds.y.min, bounds.z.max, bounds.z.min, points]);

  if (!points.length) {
    return <div className="chart-empty">No plottable points found for the selected axes.</div>;
  }

  return (
    <section className="immersive-shell" aria-label="Immersive dataset viewer">
      <div className="immersive-canvas" ref={mountRef} />

      <div className="immersive-axis-strip">
        <span>X: {xLabel}</span>
        <span>Y: {yLabel}</span>
        <span>Z: {zLabel}</span>
      </div>

      <div className="immersive-range-strip">
        <span>{`${xLabel}: ${formatRange(bounds.x.min, bounds.x.max)}`}</span>
        <span>{`${yLabel}: ${formatRange(bounds.y.min, bounds.y.max)}`}</span>
        <span>{`${zLabel}: ${formatRange(bounds.z.min, bounds.z.max)}`}</span>
      </div>

      {hoverInfo ? (
        <div className="immersive-tooltip" style={{ left: hoverInfo.left, top: hoverInfo.top }}>
          <p className="immersive-tooltip-title">{hoverInfo.label}</p>
          <p>{`${xLabel}: ${hoverInfo.xRaw || "-"}`}</p>
          <p>{`${yLabel}: ${hoverInfo.yRaw || "-"}`}</p>
          <p>{`${zLabel}: ${hoverInfo.zRaw || "-"}`}</p>
        </div>
      ) : null}
    </section>
  );
}

function addAxisLine(scene: THREE.Scene, from: THREE.Vector3, to: THREE.Vector3, color: number) {
  const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 });
  scene.add(new THREE.Line(geometry, material));
}

function formatRange(min: number, max: number): string {
  return `${formatValue(min)} - ${formatValue(max)}`;
}

function formatValue(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  if (Math.abs(value) >= 100) return value.toFixed(0);
  if (Math.abs(value) >= 10) return value.toFixed(1);
  return value.toFixed(2);
}
