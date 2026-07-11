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

const canvas = getRequiredElement("sky", HTMLCanvasElement);
const favicon = getRequiredElement("favicon", HTMLLinkElement);
const errorMessage = getRequiredElement("error", HTMLParagraphElement);
const artworkDetails = document.querySelector<HTMLElement>("aside");

let renderer: SkyRenderer | null = null;
let animationFrame = 0;

const stop = (): void => {
  window.cancelAnimationFrame(animationFrame);
  window.removeEventListener("resize", resize);
  renderer?.destroy();
  renderer = null;
};

const resize = (): void => renderer?.resize();

const render = (milliseconds: number): void => {
  renderer?.render(milliseconds);
  animationFrame = window.requestAnimationFrame(render);
};

try {
  renderer = createSkyRenderer(canvas, favicon);
  renderer.resize();

  window.addEventListener("resize", resize);
  window.addEventListener("pagehide", stop, { once: true });
  window.addEventListener("click", () => {
    artworkDetails?.classList.toggle("hidden");
  });
  animationFrame = window.requestAnimationFrame(render);
} catch (error) {
  errorMessage.textContent =
    error instanceof Error
      ? error.message
      : "The sky renderer could not start.";
  errorMessage.hidden = false;
  stop();
}
