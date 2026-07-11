import { useRef, useState, type RefObject } from "react";

import { createSkyRenderer, type SkyRenderer } from "../renderer/webglSky";
import { useAnimationFrame } from "./useAnimationFrame";
import { useMountEffect } from "./useMountEffect";
import { useWindowResize } from "./useWindowResize";

export function useSkyRenderer(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  faviconRef: RefObject<HTMLLinkElement | null>,
): string | null {
  const rendererRef = useRef<SkyRenderer | null>(null);
  const [error, setError] = useState<string | null>(null);

  useMountEffect(() => {
    const canvas = canvasRef.current;
    const favicon = faviconRef.current;
    if (!canvas || !favicon) {
      setError("The sky renderer could not find its canvas.");
      return;
    }

    try {
      const renderer = createSkyRenderer(canvas, favicon);
      rendererRef.current = renderer;
      renderer.resize();

      return () => {
        renderer.destroy();
        rendererRef.current = null;
      };
    } catch (renderError) {
      setError(
        renderError instanceof Error
          ? renderError.message
          : "The sky renderer could not start.",
      );
    }
  });

  useAnimationFrame((milliseconds) => {
    rendererRef.current?.render(milliseconds);
  });
  useWindowResize(() => rendererRef.current?.resize());

  return error;
}
