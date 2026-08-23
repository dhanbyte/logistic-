"use client";

import { Download, Printer } from "lucide-react";

export function PrintLabelButton({ labelUrl }: { labelUrl?: string | null }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (labelUrl && labelUrl.startsWith("http")) {
          window.open(labelUrl, "_blank");
        } else {
          window.print();
        }
      }}
      className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700 flex items-center gap-1 cursor-pointer"
    >
      <Printer size={12} /> Print
    </button>
  );
}

export function PrintManifestButton({ manifestUrl }: { manifestUrl?: string | null }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (manifestUrl && manifestUrl.startsWith("http")) {
          window.open(manifestUrl, "_blank");
        } else {
          window.print();
        }
      }}
      className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
    >
      <Download size={12} /> Manifest
    </button>
  );
}
