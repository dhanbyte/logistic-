import { mockSellerAccount } from "@/data/mock-data";
import { getEffectiveSession } from "@/lib/supabase/server";
import type { SellerAccount } from "@/types";

export async function getSellerAccount(): Promise<SellerAccount> {
  const session = await getEffectiveSession();
  if (!session) {
    return mockSellerAccount;
  }

  const { supabase, user } = session;

  const { data, error } = await supabase
    .from("seller_accounts")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return {
      ...mockSellerAccount,
      userId: user.id,
      email: user.email ?? mockSellerAccount.email,
    };
  }

  return {
    id: data.id,
    userId: data.user_id,
    companyName: data.company_name,
    brandName: data.brand_name,
    gstin: data.gstin,
    pan: data.pan,
    billingAddress: data.billing_address,
    city: data.city,
    state: data.state,
    pincode: data.pincode,
    email: data.email,
    phone: data.phone,
    kycStatus: data.kyc_status,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
