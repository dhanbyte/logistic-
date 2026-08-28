import type {
  ShadowfaxAwbGenerateResponse,
  ShadowfaxLabelResponse,
  ShadowfaxOrderCreateRequest,
  ShadowfaxOrderCreateResponse,
  ShadowfaxServiceabilityItem,
  ShadowfaxTrackingResponse,
} from "./types";

export class ShadowfaxClient {
  private baseUrl: string;
  private token?: string;
  private timeoutMs: number;

  constructor(options?: {
    baseUrl?: string;
    token?: string;
    timeoutMs?: number;
  }) {
    this.baseUrl = (
      options?.baseUrl ||
      process.env.SHADOWFAX_BASE_URL ||
      "https://dale.shadowfax.in/api"
    ).replace(/\/+$/, "");
    const rawToken = options?.token || process.env.SHADOWFAX_TOKEN;
    this.token = rawToken && rawToken.length >= 20 ? rawToken : process.env.SHADOWFAX_TOKEN;
    this.timeoutMs = options?.timeoutMs || 15000;
  }

  public isConfigured(): boolean {
    return Boolean(this.token && this.token.length >= 20);
  }

  private getHeaders(): HeadersInit {
    if (!this.token) {
      throw new Error(
        "Shadowfax API token is missing. Please configure SHADOWFAX_TOKEN in .env.local",
      );
    }
    return {
      Authorization: `Token ${this.token}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Check Pincode Serviceability
   */
  public async checkServiceability(
    pincode: string,
    service: string = "customer_delivery",
  ): Promise<boolean> {
    const url = `${this.baseUrl}/v1/clients/serviceability/?service=${service}&pincodes=${pincode}&count=10`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return false;
      }

      const json: ShadowfaxServiceabilityItem[] = await response.json();
      if (Array.isArray(json) && json.length > 0) {
        return json.some(
          (item) => item.code.toString() === pincode.toString(),
        );
      }
      return false;
    } catch (error) {
      clearTimeout(timeoutId);
      return false;
    }
  }

  /**
   * Generate AWB Numbers in bulk
   */
  public async generateAwbs(count: number = 1): Promise<string[]> {
    const url = `${this.baseUrl}/v3/clients/orders/generate_awb/`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ count }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const json: ShadowfaxAwbGenerateResponse = await response.json();
      if (!response.ok || !json.awb_numbers) {
        throw new Error(json.message || "Failed to generate Shadowfax AWB numbers");
      }
      return json.awb_numbers;
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Create Forward Delivery Marketplace Order
   */
  public async createForwardOrder(
    payload: import("./types").ShadowfaxForwardOrderRequest,
  ): Promise<import("./types").ShadowfaxForwardOrderResponse> {
    const url = `${this.baseUrl}/v2/clients/orders/`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const json = await response.json();
      if (!response.ok || json.message === "Failure" || !json.data?.awb_number) {
        throw new Error(
          (typeof json.errors === "string" ? json.errors : JSON.stringify(json.errors)) ||
            json.message ||
            "Failed to create Shadowfax forward order",
        );
      }
      return json;
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Create Pickup / Delivery Order
   */
  public async createOrder(
    payload: ShadowfaxOrderCreateRequest,
  ): Promise<ShadowfaxOrderCreateResponse> {
    const url = `${this.baseUrl}/v3/clients/requests`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const json = await response.json();
      if (!response.ok || (json.responseMsg === "Failure" && !json.client_request_id)) {
        throw new Error(
          json.errors || json.message || "Failed to create Shadowfax order",
        );
      }
      return json;
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Generate 4x6 Thermal Shipping Label URL
   */
  public async generateLabel(
    awbNumber: string,
    fileType: "pdf" | "prn" = "pdf",
  ): Promise<string> {
    const url = `${this.baseUrl}/client/generate_label/`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          awb_number: awbNumber,
          file_type: fileType,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const json: ShadowfaxLabelResponse = await response.json();
      if (!response.ok || !json.data?.label_url) {
        throw new Error(json.message || "Failed to generate Shadowfax shipping label");
      }
      return json.data.label_url;
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Track Single AWB
   */
  public async trackAwb(awbNumber: string): Promise<ShadowfaxTrackingResponse> {
    const url = `${this.baseUrl}/v4/clients/requests/${awbNumber}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.message || `Failed to track Shadowfax AWB ${awbNumber}`);
      }
      return json;
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Cancel Forward or Reverse Order with Shadowfax
   */
  public async cancelOrder(
    awbNumber: string,
    reason: string = "Cancelled By Customer",
  ): Promise<{ success: boolean; message: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      // 1. Try Forward Delivery Cancel endpoint
      const forwardUrl = `${this.baseUrl}/v3/clients/orders/cancel/`;
      const response = await fetch(forwardUrl, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          request_id: awbNumber,
          cancel_remarks: reason,
        }),
        signal: controller.signal,
      });

      const json = await response.json().catch(() => ({}));
      if (response.ok && json.responseCode === 200) {
        clearTimeout(timeoutId);
        return { success: true, message: json.responseMsg || "Order cancelled successfully on Shadowfax." };
      }

      // 2. Fallback to reverse requests mark_cancel if applicable
      const reverseUrl = `${this.baseUrl}/v2/clients/requests/mark_cancel`;
      const revResponse = await fetch(reverseUrl, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          request_id: awbNumber,
          cancel_remarks: reason,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const revJson = await revResponse.json().catch(() => ({}));
      return {
        success: revResponse.ok && revJson.responseCode === 200,
        message: revJson.responseMsg || revJson.message || json.responseMsg || "Cancel request processed",
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      return { success: false, message: error.message };
    }
  }
}
