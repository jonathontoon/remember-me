import { useRef, type RefObject } from "react";

import { useSkyRenderer } from "../hooks/useSkyRenderer";

type SkyCanvasProps = Readonly<{
  faviconRef: RefObject<HTMLLinkElement | null>;
}>;

export function SkyCanvas({ faviconRef }: SkyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const error = useSkyRenderer(canvasRef, faviconRef);

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
