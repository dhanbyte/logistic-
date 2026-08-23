"use client";

import { useState } from "react";
import { Building2, Check, Loader2, Save, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { updateSellerProfile } from "@/app/ecommerce-actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { SellerAccount } from "@/types";

export function SellerSettingsForm({ seller }: { seller: SellerAccount }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const res = await updateSellerProfile(form);
    setLoading(false);

    if (res.ok) {
      toast.success("Seller profile and business details saved!");
    } else {
      toast.error(res.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
              <Building2 size={18} />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Registered Business & GSTIN</h3>
              <p className="text-xs text-slate-500">Legal entity information for shipping invoices</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 flex items-center gap-1">
            <ShieldCheck size={13} /> KYC Verified
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="companyName">Registered Company Name *</Label>
            <Input
              id="companyName"
              name="companyName"
              required
              defaultValue={seller.companyName}
              placeholder="e.g. Bharat Retail Pvt Ltd"
            />
          </div>

          <div>
            <Label htmlFor="brandName">Brand / Trading Name *</Label>
            <Input
              id="brandName"
              name="brandName"
              required
              defaultValue={seller.brandName}
              placeholder="e.g. Urban Trendz"
            />
          </div>

          <div>
            <Label htmlFor="fullName">Primary Contact Person *</Label>
            <Input
              id="fullName"
              name="fullName"
              required
              defaultValue="Rajesh Sharma"
              placeholder="e.g. Rajesh Sharma"
            />
          </div>

          <div>
            <Label htmlFor="phone">Registered Mobile Number *</Label>
            <Input
              id="phone"
              name="phone"
              required
              maxLength={10}
              defaultValue={seller.phone}
              placeholder="e.g. 9876543210"
            />
          </div>

          <div>
            <Label htmlFor="gstin">15-Digit GSTIN</Label>
            <Input
              id="gstin"
              name="gstin"
              defaultValue={seller.gstin || ""}
              placeholder="e.g. 07AAACB1234F1Z5"
            />
          </div>

          <div>
            <Label htmlFor="pan">10-Digit Business PAN</Label>
            <Input
              id="pan"
              name="pan"
              defaultValue={seller.pan || ""}
              placeholder="e.g. AAACB1234F"
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="billingAddress">Registered Billing Address *</Label>
            <Input
              id="billingAddress"
              name="billingAddress"
              required
              defaultValue={seller.billingAddress}
              placeholder="Building, Plot No, Area"
            />
          </div>

          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              name="city"
              required
              defaultValue={seller.city}
              placeholder="e.g. New Delhi"
            />
          </div>

          <div>
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              name="state"
              required
              defaultValue={seller.state}
              placeholder="e.g. Delhi"
            />
          </div>

          <div>
            <Label htmlFor="pincode">PIN Code *</Label>
            <Input
              id="pincode"
              name="pincode"
              required
              maxLength={6}
              defaultValue={seller.pincode}
              placeholder="e.g. 110020"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs flex items-center gap-1.5"
          >
            {loading && <Loader2 className="size-3.5 animate-spin" />}
            {loading ? "Saving…" : "Save Business Profile"}
          </Button>
        </div>
      </div>
    </form>
  );
}
