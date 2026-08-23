import { z } from "zod";

export const warehouseFormSchema = z.object({
  warehouseName: z.string().trim().min(2, "Warehouse name must be at least 2 characters").max(100),
  contactPerson: z.string().trim().min(2, "Contact person name is required").max(100),
  contactPhone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian contact number"),
  contactEmail: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  addressLine1: z.string().trim().min(5, "Address must be at least 5 characters").max(200),
  addressLine2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(2, "City is required").max(60),
  state: z.string().trim().min(2, "State is required").max(60),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit Indian PIN code"),
  gstin: z
    .string()
    .trim()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      "Enter a valid 15-character GSTIN (e.g. 07AAAAA0000A1Z5)",
    )
    .optional()
    .or(z.literal("")),
  isDefault: z.coerce.boolean().default(false),
});

export type WarehouseFormData = z.infer<typeof warehouseFormSchema>;
