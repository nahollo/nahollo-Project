import React, { useEffect, useRef } from "react";
import { unpackRgb } from "../../data/canvas";

interface CanvasPreviewProps {
  readonly pixels: readonly number[];
  readonly size: number;
  readonly className?: string;
}

function CanvasPreview({ pixels, size, className }: CanvasPreviewProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const imageData = context.createImageData(size, size);

    pixels.forEach((color, index) => {
      const { red, green, blue } = unpackRgb(color);
      const offset = index * 4;
      imageData.data[offset] = red;
      imageData.data[offset + 1] = green;
      imageData.data[offset + 2] = blue;
      imageData.data[offset + 3] = 255;
    });

    context.putImageData(imageData, 0, 0);
  }, [pixels, size]);

  return <canvas ref={canvasRef} className={className} width={size} height={size} />;
}

export default CanvasPreview;
