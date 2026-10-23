import { useCallback } from "react";
import type { PageSetup } from "../types/spec";

export interface PrintApi {
  print: () => void;
  exportPdf: (element: HTMLElement | null) => Promise<void>;
}

export function usePrint(filename: string, pageSetup?: PageSetup): PrintApi {
  const print = useCallback(() => {
    if (typeof window !== "undefined") window.print();
  }, []);

  const exportPdf = useCallback(
    async (element: HTMLElement | null) => {
      if (!element) return;
      const { default: html2pdf } = await import("html2pdf.js");
      const margin = pageSetup
        ? [pageSetup.marginTopIn, pageSetup.marginRightIn, pageSetup.marginBottomIn, pageSetup.marginLeftIn]
        : [0.394, 0.984, 0.394, 0.984];
      await html2pdf()
        .set({
          margin: margin as [number, number, number, number],
          filename: `${filename}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: {
            unit: "in",
            format: pageSetup?.paperSize ?? "letter",
            orientation: (pageSetup?.orientation as "landscape" | "portrait") ?? "landscape",
          },
        })
        .from(element)
        .save();
    },
    [filename, pageSetup]
  );

  return { print, exportPdf };
}
