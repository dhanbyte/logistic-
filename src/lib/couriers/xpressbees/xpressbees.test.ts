import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MockCourierProvider } from "../mock-provider";
import { XpressbeesClient } from "./client";
import { XpressbeesProvider } from "./provider";
import { mapXpressbeesStatus } from "./status-mapping";

describe("Xpressbees Courier Integration — Safe Test Mode & Mock Tests", () => {
  const originalFetch = globalThis.fetch;
  const originalTestMode = process.env.XPRESSBEES_TEST_MODE;

  beforeEach(() => {
    vi.restoreAllMocks();
    XpressbeesClient.clearTokenCache();
    process.env.XPRESSBEES_TEST_MODE = "true";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    XpressbeesClient.clearTokenCache();
    process.env.XPRESSBEES_TEST_MODE = originalTestMode;
  });

  describe("1. Safe Test Mode Enforcement (XPRESSBEES_TEST_MODE=true)", () => {
    it("strictly blocks createShipment and throws an error without making any HTTP request", async () => {
      globalThis.fetch = vi.fn();
      process.env.XPRESSBEES_TEST_MODE = "true";

      const client = new XpressbeesClient({ email: "test@shipwave.com", password: "pwd" });
      const provider = new XpressbeesProvider(client);

      await expect(
        provider.createShipment({
          orderId: "ord-test",
          orderNumber: "SW-TEST-001",
          warehouseId: "wh-001",
          courierCode: "xpressbees",
          pickupPincode: "110020",
          deliveryPincode: "400050",
          customerName: "Aarav Sharma",
          customerPhone: "9876543210",
          customerAddress: "Flat 101",
          customerCity: "Mumbai",
          customerState: "Maharashtra",
          productName: "Cotton Shirt",
          quantity: 1,
          paymentMode: "PREPAID",
          orderAmount: 1499,
          codAmount: 0,
          weightKg: 0.5,
          lengthCm: 15,
          widthCm: 10,
          heightCm: 5,
        }),
      ).rejects.toThrow("Xpressbees Test Mode — Real shipment booking is disabled.");

      // Ensure NO external API booking call was made
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it("allows rate calculation and serviceability checks while in Test Mode", async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ status: true, data: "mock_jwt_token" }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            status: true,
            data: [
              {
                id: "1",
                name: "Xpressbees Surface 0.5 Kg",
                freight_charges: 37.4,
                cod_charges: 0,
                total_charges: 37.4,
                min_weight: 500,
                chargeable_weight: 500,
              },
            ],
          }),
        } as Response);

      process.env.XPRESSBEES_TEST_MODE = "true";
      const client = new XpressbeesClient({ email: "test@shipwave.com", password: "pwd" });
      const provider = new XpressbeesProvider(client);

      const quote = await provider.calculateRate(
        {
          pickupPincode: "110020",
          deliveryPincode: "400050",
          weightKg: 0.5,
          paymentMode: "PREPAID",
          declaredValue: 999,
        },
        { deadWeightKg: 0.5, volumetricWeightKg: 0.2, chargeableWeightKg: 0.5 },
      );

      expect(quote).not.toBeNull();
      expect(quote?.freightCharge).toBe(37.4);
      expect(quote?.totalShippingCost).toBe(44.13);
    });

    it("safely skips real cancellation while in Test Mode", async () => {
      globalThis.fetch = vi.fn();
      process.env.XPRESSBEES_TEST_MODE = "true";

      const client = new XpressbeesClient({ email: "test@shipwave.com", password: "pwd" });
      const provider = new XpressbeesProvider(client);

      const res = await provider.cancelShipment("59632218892");
      expect(res.success).toBe(true);
      expect(res.message).toContain("Test Mode");
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  });

  describe("2. Xpressbees Authentication (POST /api/users/login)", () => {
    it("logs in successfully, receives bearer token, and caches it", async () => {
      const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test_token";
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          status: true,
          data: mockToken,
        }),
      } as Response);

      const client = new XpressbeesClient({
        email: "test@shipwave.com",
        password: "test_password",
      });

      const token1 = await client.getAuthToken();
      expect(token1).toBe(mockToken);

      // Second call should return cached token without invoking fetch again
      const token2 = await client.getAuthToken();
      expect(token2).toBe(mockToken);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it("handles login failure with invalid credentials", async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          status: false,
          message: "Invalid email or password",
        }),
      } as Response);

      const client = new XpressbeesClient({
        email: "wrong@shipwave.com",

        password: "wrong_password",
      });

      await expect(client.getAuthToken(true)).rejects.toThrow("Invalid email or password");
    });
  });

  describe("3. Production Mode Booking (XPRESSBEES_TEST_MODE=false)", () => {
    it("books shipment and retrieves AWB and label URL when test mode is false", async () => {
      process.env.XPRESSBEES_TEST_MODE = "false";
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ status: true, data: "mock_jwt_token" }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            status: true,
            data: {
              order_id: 3351555,
              shipment_id: 1929242,
              awb_number: "59632220664",
              courier_id: "5",
              courier_name: "Xpressbees",
              status: "booked",
              additional_info: "BOM / TEC",
              payment_type: "cod",
              label: "https://xb-files.s3.amazonaws.com/labels/20210127140158-79.pdf",
            },
          }),
        } as Response);

      const client = new XpressbeesClient({ email: "test@shipwave.com", password: "pwd" });
      const provider = new XpressbeesProvider(client);

      const result = await provider.createShipment({
        orderId: "ord-001",
        orderNumber: "SW-001",
        warehouseId: "wh-001",
        courierCode: "xpressbees",
        pickupPincode: "110020",
        deliveryPincode: "400050",
        customerName: "Aarav Sharma",
        customerPhone: "9876543210",
        customerAddress: "Flat 101, Bandra",
        customerCity: "Mumbai",
        customerState: "Maharashtra",
        productName: "Cotton Shirt",
        quantity: 1,
        paymentMode: "COD",
        orderAmount: 1499,
        codAmount: 1499,
        weightKg: 0.5,
        lengthCm: 15,
        widthCm: 10,
        heightCm: 5,
      });

      expect(result.success).toBe(true);
      expect(result.awbNumber).toBe("59632220664");
      expect(result.labelUrl).toContain("20210127140158-79.pdf");
      expect(result.routingCode).toBe("BOM / TEC");
    });
  });

  describe("4. Status Mapping & Milestone Normalization", () => {
    it("maps all documented Xpressbees status codes accurately", () => {
      expect(mapXpressbeesStatus("MAN", "booked")).toBe("MANIFESTED");
      expect(mapXpressbeesStatus("PU", "picked_up")).toBe("PICKED_UP");
      expect(mapXpressbeesStatus("IT", "in_transit", "SHIPMENT ARRIVED")).toBe("IN_TRANSIT");
      expect(mapXpressbeesStatus("OFD", undefined, "OUT FOR DELIVERY")).toBe("OUT_FOR_DELIVERY");
      expect(mapXpressbeesStatus("DL", "delivered", "SHIPMENT DELIVERED")).toBe("DELIVERED");
      expect(mapXpressbeesStatus("UD", "exception", "CUSTOMER NOT RESPONDING")).toBe("NDR");
      expect(mapXpressbeesStatus("RT-IT", "rto")).toBe("RTO_INITIATED");
      expect(mapXpressbeesStatus("RT-DL", "rto_delivered")).toBe("RTO_DELIVERED");
      expect(mapXpressbeesStatus("CAN", "cancelled")).toBe("CANCELLED");
    });
  });

  describe("5. Mock Courier Workflow Availability", () => {
    it("allows complete simulated booking workflow via MockCourierProvider", async () => {
      const mockProvider = new MockCourierProvider("shadowfax");
      const result = await mockProvider.createShipment({
        orderId: "ord-mock-01",
        orderNumber: "SW-MOCK-01",
        warehouseId: "wh-001",
        courierCode: "shadowfax",
        pickupPincode: "110020",
        deliveryPincode: "400050",
        customerName: "Buyer Name",
        customerPhone: "9876543210",
        customerAddress: "Address",
        customerCity: "Mumbai",
        customerState: "Maharashtra",
        productName: "T-Shirt",
        quantity: 1,
        paymentMode: "PREPAID",
        orderAmount: 999,
        codAmount: 0,
        weightKg: 0.5,
        lengthCm: 10,
        widthCm: 10,
        heightCm: 10,
      });

      expect(result.success).toBe(true);
      expect(result.awbNumber).toMatch(/^SFX/);
      expect(result.labelUrl).toBeDefined();
    });
  });
});
