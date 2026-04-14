import React, { useEffect, useMemo, useRef, useState } from "react";
import { unpackRgb } from "../../data/canvas";
import { CANVAS_COPY } from "./canvasCopy";
import { OffsetPoint, PixelPoint } from "./canvasUtils";

interface CanvasViewportInspectorProps {
  readonly boardSize: number;
  readonly pixels: readonly number[];
  readonly scale: number;
  readonly offset: OffsetPoint;
  readonly stageSize: number;
  readonly selectedPixel: PixelPoint | null;
  readonly hoveredPixel: PixelPoint | null;
  readonly selectedLabel: string;
  readonly connectionLabel: string;
  readonly placedCount: number;
  readonly onZoomOut: () => void;
  readonly onZoomIn: () => void;
  readonly onFit: () => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function CanvasViewportInspector(props: CanvasViewportInspectorProps): JSX.Element {
  const minimapFrameRef = useRef<HTMLDivElement | null>(null);
  const minimapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [minimapSize, setMinimapSize] = useState(188);
  const zoomLabel = useMemo(() => `${Math.round(props.scale * 100)}%`, [props.scale]);

  useEffect(() => {
    const frame = minimapFrameRef.current;
    if (!frame) {
      return;
    }

    const update = (): void => {
      const width = Math.round(frame.getBoundingClientRect().width);
      if (width > 0) {
        setMinimapSize(width);
      }
    };

    update();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = minimapCanvasRef.current;
    if (!canvas || props.boardSize <= 0) {
      return;
    }

    const size = clamp(minimapSize, 132, 220);
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = Math.max(1, Math.round(size * dpr));
    canvas.height = Math.max(1, Math.round(size * dpr));

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, size, size);
    context.fillStyle = "#f7f3eb";
    context.fillRect(0, 0, size, size);

    if (props.pixels.length === props.boardSize * props.boardSize) {
      const imageData = context.createImageData(size, size);
      const data = imageData.data;

      for (let y = 0; y < props.boardSize; y += 1) {
        const targetY = Math.floor((y / props.boardSize) * size);
        for (let x = 0; x < props.boardSize; x += 1) {
          const color = props.pixels[y * props.boardSize + x];
          const targetX = Math.floor((x / props.boardSize) * size);
          const index = (targetY * size + targetX) * 4;

          if (index < 0 || index + 3 >= data.length) {
            continue;
          }

          const rgb = unpackRgb(color);
          data[index] = rgb.red;
          data[index + 1] = rgb.green;
          data[index + 2] = rgb.blue;
          data[index + 3] = 255;
        }
      }

      context.putImageData(imageData, 0, 0);
    }

    const scale = Math.max(0.0001, props.scale);
    const visibleSize = props.stageSize > 0 ? Math.min(props.boardSize, props.stageSize / scale) : props.boardSize;
    const originX = props.stageSize / 2 + props.offset.x - (props.stageSize * scale) / 2;
    const originY = props.stageSize / 2 + props.offset.y - (props.stageSize * scale) / 2;
    const leftPixels =
      props.stageSize > 0 ? clamp(-originX / scale, 0, Math.max(0, props.boardSize - visibleSize)) : 0;
    const topPixels =
      props.stageSize > 0 ? clamp(-originY / scale, 0, Math.max(0, props.boardSize - visibleSize)) : 0;
    const viewportPixels = props.stageSize > 0 ? visibleSize : props.boardSize;
    const rectX = (leftPixels / props.boardSize) * size;
    const rectY = (topPixels / props.boardSize) * size;
    const rectSize = (viewportPixels / props.boardSize) * size;

    context.strokeStyle = "#5b63f6";
    context.fillStyle = "rgba(91, 99, 246, 0.14)";
    context.lineWidth = Math.max(1, size / 92);
    context.fillRect(rectX, rectY, rectSize, rectSize);
    context.strokeRect(rectX, rectY, rectSize, rectSize);

    const markerSize = Math.max(2, Math.round(size / 34));
    const drawMarker = (point: PixelPoint | null, fill: string, stroke: string): void => {
      if (!point) {
        return;
      }

      const markerX = (point.x / props.boardSize) * size;
      const markerY = (point.y / props.boardSize) * size;
      context.fillStyle = fill;
      context.strokeStyle = stroke;
      context.lineWidth = Math.max(1, size / 120);
      context.fillRect(markerX, markerY, markerSize, markerSize);
      context.strokeRect(markerX, markerY, markerSize, markerSize);
    };

    drawMarker(props.hoveredPixel, "rgba(255,255,255,0.9)", "#1f2937");
    drawMarker(props.selectedPixel, "#5b63f6", "#ffffff");
  }, [minimapSize, props.boardSize, props.offset.x, props.offset.y, props.pixels, props.scale, props.selectedPixel, props.stageSize, props.hoveredPixel]);

  return (
    <div className="canvas-viewport-inspector canvas-status-bar canvas-info-bar" role="status" aria-live="polite">
      <section className="canvas-viewport-zoom-card">
        <span className="canvas-viewport-section-label">{CANVAS_COPY.status.zoom}</span>
        <div className="canvas-controls-cluster">
          <button type="button" className="canvas-icon-button" onClick={props.onZoomOut} aria-label={CANVAS_COPY.actions.zoomOut}>
            -
          </button>
          <span className="canvas-zoom-pill">{zoomLabel}</span>
          <button type="button" className="canvas-icon-button" onClick={props.onZoomIn} aria-label={CANVAS_COPY.actions.zoomIn}>
            +
          </button>
          <button type="button" className="canvas-fit-button" onClick={props.onFit}>
            맞춤
          </button>
        </div>
        <p className="canvas-zoom-hint">마우스 휠로 확대/축소</p>
      </section>

      <section className="canvas-viewport-minimap-card">
        <span className="canvas-viewport-section-label">미니맵</span>
        <div ref={minimapFrameRef} className="canvas-minimap-frame">
          <canvas ref={minimapCanvasRef} className="canvas-minimap-canvas" aria-label="Canvas minimap" />
        </div>
      </section>

      <section className="canvas-viewport-status-card">
        <div className="canvas-viewport-status-grid">
          <div className="canvas-viewport-status-pair">
            <span className="canvas-viewport-status-key">{CANVAS_COPY.status.selected}</span>
            <strong className="canvas-viewport-status-value">{props.selectedLabel}</strong>
          </div>
          <div className="canvas-viewport-status-pair">
            <span className="canvas-viewport-status-key">{CANVAS_COPY.status.connection}</span>
            <strong className="canvas-viewport-status-value is-live">{props.connectionLabel}</strong>
          </div>
          <div className="canvas-viewport-status-pair">
            <span className="canvas-viewport-status-key">{CANVAS_COPY.status.zoom}</span>
            <strong className="canvas-viewport-status-value">{zoomLabel}</strong>
          </div>
          <div className="canvas-viewport-status-pair">
            <span className="canvas-viewport-status-key">{CANVAS_COPY.status.placedPixels}</span>
            <strong className="canvas-viewport-status-value">{props.placedCount.toLocaleString()}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

export default CanvasViewportInspector;
