import { z } from "zod";

export const orderFormSchema = z.object({
  // Customer details
  customerName: z.string().trim().min(2, "Customer name must be at least 2 characters").max(120),
  customerPhone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
  customerEmail: z.string().trim().email("Enter a valid email address").optional().or(z.literal("")),
  addressLine1: z.string().trim().min(5, "Address must be at least 5 characters").max(200),
  addressLine2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(2, "City is required").max(60),
  state: z.string().trim().min(2, "State is required").max(60),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit Indian PIN code"),

  // Order Details
  orderNumber: z.string().trim().min(1, "Order reference number is required").max(50),
  warehouseId: z.string().uuid("Please select a pickup warehouse"),
  channelName: z.enum(["MANUAL", "SHOPIFY", "WOOCOMMERCE", "API"]).default("MANUAL"),
  paymentMode: z.enum(["PREPAID", "COD"]),
  orderAmount: z.coerce.number().positive("Order amount must be greater than 0"),
  codAmount: z.coerce.number().min(0, "COD amount cannot be negative").default(0),

  // Package Specifications
  productName: z.string().trim().min(2, "Product name is required").max(150),
  productSku: z.string().trim().max(60).optional().or(z.literal("")),
  quantity: z.coerce.number().int().positive("Quantity must be at least 1").default(1),
  weightKg: z.coerce.number().positive("Dead weight must be greater than 0"),
  lengthCm: z.coerce.number().positive("Length must be greater than 0"),
  widthCm: z.coerce.number().positive("Width must be greater than 0"),
  heightCm: z.coerce.number().positive("Height must be greater than 0"),

  notes: z.string().trim().max(500).optional().or(z.literal("")),
}).refine(
  (data) => {
    if (data.paymentMode === "COD") {
      return data.codAmount > 0;
    }
    return true;
  },
  {
    message: "COD amount is required and must be greater than 0 for COD orders",
    path: ["codAmount"],
  },
);

export type OrderFormData = z.infer<typeof orderFormSchema>;

export const bulkOrderRowSchema = z.object({
  orderNumber: z.string().trim().min(1),
  customerName: z.string().trim().min(2),
  customerPhone: z.string().trim().regex(/^[6-9]\d{9}$/),
  addressLine1: z.string().trim().min(5),
  city: z.string().trim().min(2),
  state: z.string().trim().min(2),
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/),
  productName: z.string().trim().min(1),
  quantity: z.coerce.number().int().positive().default(1),
  paymentMode: z.enum(["PREPAID", "COD"]).default("PREPAID"),
  orderAmount: z.coerce.number().positive(),
  codAmount: z.coerce.number().default(0),
  weightKg: z.coerce.number().positive(),
  lengthCm: z.coerce.number().positive().default(10),
  widthCm: z.coerce.number().positive().default(10),
  heightCm: z.coerce.number().positive().default(10),
});
