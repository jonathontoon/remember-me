import { createSkyRenderer, type SkyRenderer } from "./renderer/webglSky";

function getRequiredElement<T extends Element>(
  id: string,
  constructor: { new (): T },
): T {
  const element = document.getElementById(id);
  if (!(element instanceof constructor)) {
    throw new Error(`Expected an element with id "${id}".`);
  }

  return element;
}

const params = new URLSearchParams(window.location.search);
const canvas = getRequiredElement("sky", HTMLCanvasElement);
const favicon = getRequiredElement("favicon", HTMLLinkElement);
const errorMessage = getRequiredElement("error", HTMLParagraphElement);
const artworkDetails = document.querySelector<HTMLElement>("aside");

let renderer: SkyRenderer | null = null;
let animationFrame = 0;
let isContextLost = false;
let lastRenderMilliseconds = Number.NEGATIVE_INFINITY;

const DAY_MINUTES = 24 * 60;
const FRAME_INTERVAL_MILLISECONDS = 200;

function parseTimeOverride(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return (hours * 60 + minutes) / DAY_MINUTES;
}

function parseDateOverride(date: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsedDate = new Date(0);
  parsedDate.setHours(0, 0, 0, 0);
  parsedDate.setFullYear(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

const timeOverride = params.has("time")
  ? parseTimeOverride(params.get("time")!)
  : null;
const dateOverride = params.has("date")
  ? parseDateOverride(params.get("date")!)
  : null;

function pauseAnimation(): void {
  window.cancelAnimationFrame(animationFrame);
  animationFrame = 0;
}

function stop(): void {
  pauseAnimation();
  window.removeEventListener("resize", resize);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  canvas.removeEventListener("webglcontextlost", handleContextLost);
  canvas.removeEventListener("webglcontextrestored", handleContextRestored);
  renderer?.destroy();
  renderer = null;
}

function draw(milliseconds: number): void {
  renderer?.render(milliseconds, timeOverride, dateOverride);
  lastRenderMilliseconds = milliseconds;
}

function render(milliseconds: number): void {
  animationFrame = 0;
  if (!renderer || document.hidden || isContextLost) return;

  if (milliseconds - lastRenderMilliseconds >= FRAME_INTERVAL_MILLISECONDS) {
    draw(milliseconds);
  }
  animationFrame = window.requestAnimationFrame(render);
}

function resumeAnimation(): void {
  if (animationFrame !== 0 || !renderer || document.hidden || isContextLost) {
    return;
  }

  renderer.resize();
  draw(performance.now());
  animationFrame = window.requestAnimationFrame(render);
}

function resize(): void {
  renderer?.resize();
  if (renderer && !document.hidden && !isContextLost) {
    draw(performance.now());
  }
}

function handleVisibilityChange(): void {
  if (document.hidden) {
    pauseAnimation();
  } else {
    resumeAnimation();
  }
}

function handleContextLost(event: Event): void {
  event.preventDefault();
  isContextLost = true;
  pauseAnimation();
  renderer = null;
}

function handleContextRestored(): void {
  isContextLost = false;
  try {
    renderer = createSkyRenderer(canvas, favicon);
    errorMessage.hidden = true;
    resumeAnimation();
  } catch (error) {
    showRendererError(error);
    stop();
  }
}

function showRendererError(error: unknown): void {
  errorMessage.textContent =
    error instanceof Error
      ? error.message
      : "The sky renderer could not start.";
  errorMessage.hidden = false;
}

try {
  document.addEventListener("visibilitychange", handleVisibilityChange);
  canvas.addEventListener("webglcontextlost", handleContextLost);
  canvas.addEventListener("webglcontextrestored", handleContextRestored);
  renderer = createSkyRenderer(canvas, favicon);

  window.addEventListener("resize", resize);
  window.addEventListener("pagehide", stop, { once: true });
  window.addEventListener("pointerup", () => {
    artworkDetails?.classList.toggle("hidden");
  });
  if (params.has("hide_text") || params.get("hidden") === "true") {
    artworkDetails?.classList.add("hidden");
  }
  resumeAnimation();
} catch (error) {
  showRendererError(error);
  stop();
}
