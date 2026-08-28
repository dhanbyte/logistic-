import crypto from "crypto";

export interface MetaUserData {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  country?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
}

export interface MetaCustomData {
  currency?: string;
  value?: number | string;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  status?: string;
  order_id?: string;
  [key: string]: any;
}

export interface MetaConversionEventParams {
  eventName: "CompleteRegistration" | "Lead" | "Purchase" | "InitiateCheckout" | "ViewContent" | "Contact" | "AddPaymentInfo";
  eventId?: string;
  eventSourceUrl?: string;
  userData: MetaUserData;
  customData?: MetaCustomData;
}

/**
 * Normalizes and SHA-256 hashes string data according to Meta CAPI specification
 */
function hashMetaField(val?: string | null): string | null {
  if (!val) return null;
  const normalized = val.trim().toLowerCase();
  if (!normalized) return null;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Normalizes phone numbers (removes special chars, ensures international format) and hashes
 */
function hashMetaPhone(phone?: string | null): string | null {
  if (!phone) return null;
  let clean = phone.replace(/\D/g, "");
  // If Indian 10-digit number without country code, prepend 91
  if (clean.length === 10) {
    clean = "91" + clean;
  }
  return hashMetaField(clean);
}

/**
 * Sends a server-side conversion event to Meta Conversions API (CAPI)
 */
export async function sendMetaConversionEvent(
  params: MetaConversionEventParams
): Promise<{ success: boolean; data?: any; error?: string }> {
  const pixelId = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

  if (!accessToken || !pixelId) {
    // Gracefully log if Pixel ID or Token is missing without breaking the app
    if (!pixelId) {
      console.warn("[Meta CAPI] Event skipped: META_PIXEL_ID is not configured in .env.local");
    }
    return { success: false, error: "Meta CAPI not fully configured" };
  }

  const { eventName, eventId, eventSourceUrl, userData, customData } = params;

  // Build hashed user_data according to Meta spec
  const formattedUserData: Record<string, any> = {};

  const hashedEmail = hashMetaField(userData.email);
  if (hashedEmail) formattedUserData.em = [hashedEmail];

  const hashedPhone = hashMetaPhone(userData.phone);
  if (hashedPhone) formattedUserData.ph = [hashedPhone];

  const hashedFn = hashMetaField(userData.firstName);
  if (hashedFn) formattedUserData.fn = [hashedFn];

  const hashedLn = hashMetaField(userData.lastName);
  if (hashedLn) formattedUserData.ln = [hashedLn];

  const hashedCity = hashMetaField(userData.city);
  if (hashedCity) formattedUserData.ct = [hashedCity];

  const hashedState = hashMetaField(userData.state);
  if (hashedState) formattedUserData.st = [hashedState];

  const hashedZip = hashMetaField(userData.pincode);
  if (hashedZip) formattedUserData.zp = [hashedZip];

  const hashedCountry = hashMetaField(userData.country || "in");
  if (hashedCountry) formattedUserData.country = [hashedCountry];

  // Unhashed client information
  if (userData.clientIpAddress) {
    formattedUserData.client_ip_address = userData.clientIpAddress;
  }
  if (userData.clientUserAgent) {
    formattedUserData.client_user_agent = userData.clientUserAgent;
  }
  if (userData.fbp) {
    formattedUserData.fbp = userData.fbp;
  }
  if (userData.fbc) {
    formattedUserData.fbc = userData.fbc;
  }

  const eventPayload: Record<string, any> = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    action_source: "website",
    event_source_url: eventSourceUrl || "https://www.dhanbyte.me",
    user_data: formattedUserData,
  };

  if (eventId) {
    eventPayload.event_id = eventId;
  }

  if (customData) {
    eventPayload.custom_data = customData;
  }

  const requestBody: Record<string, any> = {
    data: [eventPayload],
  };

  // If testing in Meta Events Manager Test Events Tab
  if (process.env.META_TEST_EVENT_CODE) {
    requestBody.test_event_code = process.env.META_TEST_EVENT_CODE;
  }

  try {
    const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      console.error("[Meta CAPI Error]", result.error || result);
      return { success: false, error: result.error?.message || "Failed to post to Meta CAPI" };
    }

    return { success: true, data: result };
  } catch (err: any) {
    console.error("[Meta CAPI Request Exception]", err);
    return { success: false, error: err.message };
  }
}
