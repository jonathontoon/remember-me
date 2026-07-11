import { useRef } from "react";

import { useMountEffect } from "./useMountEffect";

export type ResizeCallback = () => void;

export function useWindowResize(callback: ResizeCallback): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useMountEffect(() => {
    const handleResize = (): void => callbackRef.current();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  });
}
