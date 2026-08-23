import { z } from "zod";

export const sellerProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(120),
  companyName: z.string().trim().min(2, "Company name is required").max(120),
  brandName: z.string().trim().min(2, "Brand name is required").max(120),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  gstin: z
    .string()
    .trim()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      "Enter a valid 15-character GSTIN",
    )
    .optional()
    .or(z.literal("")),
  pan: z
    .string()
    .trim()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Enter a valid 10-character PAN (e.g. ABCDE1234F)")
    .optional()
    .or(z.literal("")),
  billingAddress: z.string().trim().min(5, "Billing address is required").max(200),
  city: z.string().trim().min(2, "City is required").max(60),
  state: z.string().trim().min(2, "State is required").max(60),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code"),
});

export type SellerProfileData = z.infer<typeof sellerProfileSchema>;
