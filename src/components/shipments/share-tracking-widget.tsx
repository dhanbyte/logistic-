"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";

export function ShareTrackingWidget({
  awbNumber,
  orderNumber,
  courierName,
  destinationCity,
}: {
  awbNumber: string;
  orderNumber?: string;
  courierName?: string;
  destinationCity?: string;
}) {
  const [copied, setCopied] = useState(false);

  const trackingUrl = typeof window !== "undefined"
    ? `${window.location.origin}/track/${awbNumber}`
    : `https://shipwave.in/track/${awbNumber}`;

  const message = `Hello! Your order ${orderNumber ? `#${orderNumber}` : ""} shipped via ${courierName || "Shadowfax"} (AWB: ${awbNumber}) is on its way${destinationCity ? ` to ${destinationCity}` : ""}. Track live movement here: ${trackingUrl}`;

  function handleCopy() {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(trackingUrl).then(() => {
          setCopied(true);
          toast.success("Public tracking link copied to clipboard!");
          setTimeout(() => setCopied(false), 2000);
        }).catch(() => fallbackCopy());
      } else {
        fallbackCopy();
      }
    } catch {
      fallbackCopy();
    }
  }

  function fallbackCopy() {
    try {
      const el = document.createElement("textarea");
      el.value = trackingUrl;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      toast.success("Public tracking link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link to clipboard.");
    }
  }

  function handleWhatsAppShare() {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-all cursor-pointer"
      >
        {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} className="text-slate-500" />}
        <span>{copied ? "Link Copied!" : "Copy Tracking Link"}</span>
      </button>

      <button
        type="button"
        onClick={handleWhatsAppShare}
        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs transition-all cursor-pointer"
      >
        <MessageCircle size={14} />
        <span>Share on WhatsApp</span>
      </button>
    </div>
  );
}
