import { useRef } from "react";

import { useMountEffect } from "./useMountEffect";

export type AnimationFrameCallback = (milliseconds: number) => void;

export function useAnimationFrame(callback: AnimationFrameCallback): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useMountEffect(() => {
    let animationFrame = 0;
    const tick = (milliseconds: number): void => {
      callbackRef.current(milliseconds);
      animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrame);
  });
}
