import type { Viewport } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

// Polyfill/guard performance.measure against Next.js Turbopack negative timestamp bugs
if (typeof globalThis.performance !== "undefined" && typeof globalThis.performance.measure === "function") {
  const origMeasure = globalThis.performance.measure.bind(globalThis.performance);
  globalThis.performance.measure = function (name: string, ...args: unknown[]) {
    try {
      return origMeasure(name, ...(args as [any, any]));
    } catch {
      return {
        name,
        entryType: "measure",
        startTime: 0,
        duration: 0,
        toJSON: () => ({}),
      } as unknown as PerformanceMeasure;
    }
  };
}

const performancePatchScript = `
(function() {
  if (typeof window !== 'undefined' && window.performance && typeof window.performance.measure === 'function') {
    var originalMeasure = window.performance.measure.bind(window.performance);
    window.performance.measure = function(name) {
      try {
        return originalMeasure.apply(window.performance, arguments);
      } catch (e) {
        return {
          name: name,
          entryType: 'measure',
          startTime: 0,
          duration: 0,
          toJSON: function() { return {}; }
        };
      }
    };
  }
})();
`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <head>
        <title>Learn - Brio.md</title>
        <script dangerouslySetInnerHTML={{ __html: performancePatchScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
