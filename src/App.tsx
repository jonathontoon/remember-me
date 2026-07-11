import { createPortal } from "react-dom";
import { useRef } from "react";

import { SkyCanvas } from "./components/SkyCanvas";

export function App() {
  const faviconRef = useRef<HTMLLinkElement>(null);

  return (
    <>
      {createPortal(
        <link ref={faviconRef} rel="icon" href="data:," />,
        document.head,
      )}
      <main
        className="relative isolate min-h-[100svh] overflow-hidden bg-[#0b1220] font-sans antialiased"
        aria-label="A time of day, a living sky gradient"
      >
        <SkyCanvas faviconRef={faviconRef} />
        <aside
          className="pointer-events-none absolute bottom-7 right-7 z-10 max-w-[240px] text-right text-[10px] leading-[1.45] tracking-[.03em] text-white/60 drop-shadow-[0_1px_12px_rgba(0,0,0,.24)] max-sm:bottom-5 max-sm:right-5"
          aria-label="Artwork details"
        >
          <p className="font-medium text-white/80">
            Remember Me as a Time of Day
          </p>
          <p>Jonathon Toon · WebGL · 2026</p>
        </aside>
      </main>
    </>
  );
}
