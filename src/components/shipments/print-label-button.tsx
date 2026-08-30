"use client";

import { Download, Printer } from "lucide-react";

export function PrintLabelButton({
  labelUrl,
  awbNumber,
}: {
  labelUrl?: string | null;
  awbNumber?: string;
}) {
  const downloadUrl =
    labelUrl && labelUrl.startsWith("http")
      ? labelUrl
      : awbNumber
      ? `/api/couriers/shadowfax/label/${awbNumber}?download=true`
      : labelUrl || "#";

  return (
    <div className="flex items-center gap-1.5">
      <a
        href={downloadUrl}
        target="_blank"
        rel="noreferrer"
        download
        className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 flex items-center gap-1.5 shadow-xs cursor-pointer"
        title="Download Official Courier PDF"
      >
        <Download size={13} />
        <span>Download PDF</span>
      </a>

      <button
        type="button"
        onClick={() => {
          if (labelUrl && labelUrl.startsWith("http")) {
            window.open(labelUrl, "_blank");
          } else {
            window.print();
          }
        }}
        className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
        title="Print Label"
      >
        <Printer size={13} />
      </button>
    </div>
  );
}

export function PrintManifestButton({ manifestUrl }: { manifestUrl?: string | null }) {
  return (
    <a
      href={manifestUrl && manifestUrl.startsWith("http") ? manifestUrl : manifestUrl || "#"}
      target="_blank"
      rel="noreferrer"
      download
      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
    >
      <Download size={13} />
      <span>Download Manifest</span>
    </a>
  );
}
