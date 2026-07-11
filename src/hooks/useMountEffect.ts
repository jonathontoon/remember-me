import { useLayoutEffect } from "react";

type MountEffect = () => void | (() => void);

export function useMountEffect(effect: MountEffect): void {
  // Block the first paint until the external WebGL renderer is ready.
  useLayoutEffect(effect, []);
}
