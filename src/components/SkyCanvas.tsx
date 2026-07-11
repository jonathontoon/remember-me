import { useRef, useState, type RefObject } from "react";

import { useMountEffect } from "../hooks/useMountEffect";
import { createSkyRenderer } from "../renderer/skyRenderer";

type SkyCanvasProps = Readonly<{
  faviconRef: RefObject<HTMLLinkElement | null>;
}>;

export function SkyCanvas({ faviconRef }: SkyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useMountEffect(() => {
    const canvas = canvasRef.current;
    const favicon = faviconRef.current;
    if (!canvas || !favicon) {
      setError("The sky renderer could not find its canvas.");
      return;
    }

    try {
      return createSkyRenderer(canvas, favicon);
    } catch (renderError) {
      setError(
        renderError instanceof Error
          ? renderError.message
          : "The sky renderer could not start.",
      );
    }
  });

  if (error) {
    return (
      <p className="relative z-10 p-8 font-sans text-sm text-white/70">
        {error}
      </p>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 block h-full w-full"
      aria-hidden="true"
    />
  );
}
