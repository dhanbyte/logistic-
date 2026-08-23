import type {
  XpressbeesCancelRequest,
  XpressbeesCancelResponse,
  XpressbeesLoginResponse,
  XpressbeesManifestRequest,
  XpressbeesManifestResponse,
  XpressbeesServiceabilityRequest,
  XpressbeesServiceabilityResponse,
  XpressbeesShipmentRequest,
  XpressbeesShipmentResponse,
  XpressbeesTrackingResponse,
} from "./types";

interface TokenCache {
  token: string;
  expiresAt: number; // Unix timestamp ms
}

export class XpressbeesClient {
  private baseUrl: string;
  private email?: string;
  private password?: string;
  private static tokenCache: TokenCache | null = null;
  private timeoutMs: number;

  constructor(options?: {
    baseUrl?: string;
    email?: string;
    password?: string;
    timeoutMs?: number;
  }) {
    this.baseUrl = (
      options?.baseUrl ||
      process.env.XPRESSBEES_BASE_URL ||
      "https://shipment.xpressbees.com"
    ).replace(/\/+$/, "");
    this.email = options?.email || process.env.XPRESSBEES_EMAIL;
    this.password = options?.password || process.env.XPRESSBEES_PASSWORD;
    this.timeoutMs = options?.timeoutMs || 15000;
  }

  /**
   * Checks if Xpressbees credentials are configured in server environment
   */
  public isConfigured(): boolean {
    return Boolean(this.email && this.password);
  }

  /**
   * Clears the in-memory token cache (useful for testing and auth refresh)
   */
  public static clearTokenCache(): void {
    XpressbeesClient.tokenCache = null;
  }

  /**
   * Logs in to Xpressbees to obtain a Bearer token or returns cached token
   */
  public async getAuthToken(forceRefresh = false): Promise<string> {
    const now = Date.now();

    if (!forceRefresh && XpressbeesClient.tokenCache && XpressbeesClient.tokenCache.expiresAt > now) {
      return XpressbeesClient.tokenCache.token;
    }

    if (!this.email || !this.password) {
      throw new Error(
        "Xpressbees credentials missing. Please configure XPRESSBEES_EMAIL and XPRESSBEES_PASSWORD.",
      );
    }

    const endpoint = `${this.baseUrl}/api/users/login`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: this.email,
          password: this.password,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const json: XpressbeesLoginResponse = await response.json();

      if (!response.ok || !json.status || !json.data) {
        throw new Error(
          json.message || `Xpressbees login failed with HTTP status ${response.status}`,
        );
      }

      // Cache token for 23 hours (standard JWT validity)
      XpressbeesClient.tokenCache = {
        token: json.data,
        expiresAt: now + 23 * 60 * 60 * 1000,
      };

      return json.data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error("Xpressbees authentication request timed out.");
      }
      throw error;
    }
  }

  /**
   * Executes an authenticated request with automatic 401 retry
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false,
  ): Promise<T> {
    const token = await this.getAuthToken(isRetry);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...((options.headers as Record<string, string>) || {}),
    };

    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 Unauthorized by clearing cache and retrying once
      if (res.status === 401 && !isRetry) {
        XpressbeesClient.tokenCache = null;
        return this.request<T>(endpoint, options, true);
      }

      const json = await res.json();
      return json as T;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error(`Xpressbees request to ${endpoint} timed out.`);
      }
      // Redact Bearer token if it leaks in error messages
      const safeMessage = (error.message || "").replace(/Bearer\s+[A-Za-z0-9-_.]+/gi, "Bearer [REDACTED]");
      throw new Error(`Xpressbees API Error: ${safeMessage}`);
    }
  }

  /**
   * POST /api/courier/serviceability
   * Checks origin & destination serviceability and fetches real-time rate card
   */
  public async getServiceabilityAndRates(
    payload: XpressbeesServiceabilityRequest,
  ): Promise<XpressbeesServiceabilityResponse> {
    // Validate 6-digit pin codes
    if (!/^[1-9][0-9]{5}$/.test(payload.origin)) {
      return {
        status: false,
        message: "The Origin field must be exactly 6 characters in length.",
      };
    }
    if (!/^[1-9][0-9]{5}$/.test(payload.destination)) {
      return {
        status: false,
        message: "The Destination field must be exactly 6 characters in length.",
      };
    }

    return this.request<XpressbeesServiceabilityResponse>("/api/courier/serviceability", {
      method: "POST",
      body: JSON.stringify({
        origin: String(payload.origin),
        destination: String(payload.destination),
        payment_type: payload.payment_type,
        order_amount: String(payload.order_amount),
        weight: String(payload.weight || 500),
        length: String(payload.length || 10),
        breadth: String(payload.breadth || 10),
        height: String(payload.height || 10),
      }),
    });
  }

  /**
   * POST /api/shipments2
   * Generates AWB/Tracking number and books shipment
   */
  public async createShipment(
    payload: XpressbeesShipmentRequest,
  ): Promise<XpressbeesShipmentResponse> {
    return this.request<XpressbeesShipmentResponse>("/api/shipments2", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * GET /api/shipments2/track/{AWB}
   * Retrieves tracking history and milestone checkpoints
   */
  public async trackShipment(awbNumber: string): Promise<XpressbeesTrackingResponse> {
    const cleanAwb = encodeURIComponent(awbNumber.trim());
    return this.request<XpressbeesTrackingResponse>(`/api/shipments2/track/${cleanAwb}`, {
      method: "GET",
    });
  }

  /**
   * POST /api/shipments2/cancel
   * Cancels booked AWB
   */
  public async cancelShipment(awbNumber: string): Promise<XpressbeesCancelResponse> {
    const payload: XpressbeesCancelRequest = { awb: awbNumber.trim() };
    return this.request<XpressbeesCancelResponse>("/api/shipments2/cancel", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * POST /api/shipments2/manifest
   * Generates handover pickup manifest PDF for a list of AWBs
   */
  public async generateManifest(awbNumbers: string[]): Promise<XpressbeesManifestResponse> {
    const payload: XpressbeesManifestRequest = { awbs: awbNumbers };
    return this.request<XpressbeesManifestResponse>("/api/shipments2/manifest", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
}
