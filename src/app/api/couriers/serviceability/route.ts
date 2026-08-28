import { NextRequest, NextResponse } from "next/server";

export interface PincodeDetails {
  pincode: string;
  isValid: boolean;
  city: string;
  district: string;
  division: string;
  state: string;
  stateCode: string;
  zone: "ZONE_A" | "ZONE_B" | "ZONE_C" | "ZONE_D" | "ZONE_E" | "NONE";
  zoneLabel: string;
  isMetro: boolean;
  pickupServiceable: boolean;
  deliveryServiceable: boolean;
  codAvailable: boolean;
  prepaidAvailable: boolean;
  reversePickupAvailable: boolean;
  pickupSla: string;
  deliverySla: string;
  pickupCutoffTime: string;
  hubLocation: string;
  error?: string;
}

// In-memory cache for validated PIN codes
const PIN_CACHE = new Map<string, { isValid: boolean; city: string; district: string; division: string; state: string }>();

const METRO_CITIES = new Set([
  "DELHI",
  "NEW DELHI",
  "MUMBAI",
  "BENGALURU",
  "BANGALORE",
  "KOLKATA",
  "HYDERABAD",
  "CHENNAI",
  "AHMEDABAD",
  "PUNE",
  "GURGAON",
  "GURUGRAM",
  "NOIDA",
  "GHAZIABAD",
  "FARIDABAD",
  "THANE",
  "NAVI MUMBAI",
  "SURAT",
]);

async function fetchRealPostalData(pincode: string): Promise<{ isValid: boolean; city: string; district: string; division: string; state: string } | null> {
  const pin = pincode.trim().replace(/\D/g, "");
  if (pin.length !== 6) return { isValid: false, city: "", district: "", division: "", state: "" };

  // First digit of Indian postal codes must be 1 to 8 (9 is Army Postal only)
  const firstDigit = pin.charAt(0);
  if (!["1", "2", "3", "4", "5", "6", "7", "8"].includes(firstDigit)) {
    return { isValid: false, city: "", district: "", division: "", state: "" };
  }

  if (PIN_CACHE.has(pin)) {
    return PIN_CACHE.get(pin)!;
  }

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
      next: { revalidate: 86400 }, // cache for 24 hours
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (Array.isArray(data) && data[0]?.Status === "Success" && Array.isArray(data[0]?.PostOffice) && data[0].PostOffice.length > 0) {
      const po = data[0].PostOffice[0];
      const result = {
        isValid: true,
        city: po.Name || po.Block || po.District || "Delivery Hub",
        district: po.District || po.Division || "District",
        division: po.Division || po.District || "",
        state: po.State || "India",
      };
      PIN_CACHE.set(pin, result);
      return result;
    } else if (Array.isArray(data) && data[0]?.Status === "Error") {
      const invalidResult = { isValid: false, city: "", district: "", division: "", state: "" };
      PIN_CACHE.set(pin, invalidResult);
      return invalidResult;
    }
  } catch (err) {
    console.warn(`India Post API lookup failed for ${pin}`, err);
  }

  return null;
}

function resolveStateCode(stateName: string): string {
  const s = (stateName || "").toUpperCase();
  if (s.includes("DELHI")) return "DL";
  if (s.includes("MAHARASHTRA")) return "MH";
  if (s.includes("KARNATAKA")) return "KA";
  if (s.includes("TAMIL")) return "TN";
  if (s.includes("TELANGANA")) return "TS";
  if (s.includes("ANDHRA")) return "AP";
  if (s.includes("GUJARAT")) return "GJ";
  if (s.includes("UTTAR PRADESH")) return "UP";
  if (s.includes("UTTARAKHAND")) return "UK";
  if (s.includes("RAJASTHAN")) return "RJ";
  if (s.includes("MADHYA PRADESH")) return "MP";
  if (s.includes("WEST BENGAL")) return "WB";
  if (s.includes("BIHAR")) return "BR";
  if (s.includes("JHARKHAND")) return "JH";
  if (s.includes("ODISHA") || s.includes("ORISSA")) return "OR";
  if (s.includes("PUNJAB")) return "PB";
  if (s.includes("HARYANA")) return "HR";
  if (s.includes("KERALA")) return "KL";
  if (s.includes("ASSAM")) return "AS";
  if (s.includes("JAMMU") || s.includes("KASHMIR") || s.includes("LADAKH")) return "JK";
  return "IN";
}

async function resolvePincodeDetails(rawPin: string): Promise<PincodeDetails> {
  const pin = rawPin.trim().replace(/\D/g, "");

  // 1. Initial format check
  const firstDigit = pin.charAt(0);
  if (pin.length !== 6 || !["1", "2", "3", "4", "5", "6", "7", "8"].includes(firstDigit)) {
    return {
      pincode: pin || "000000",
      isValid: false,
      city: "Unknown Location",
      district: "Invalid Area",
      division: "",
      state: "Invalid Pincode",
      stateCode: "NONE",
      zone: "NONE",
      zoneLabel: "Unserviceable / Invalid PIN Code",
      isMetro: false,
      pickupServiceable: false,
      deliveryServiceable: false,
      codAvailable: false,
      prepaidAvailable: false,
      reversePickupAvailable: false,
      pickupSla: "N/A",
      deliverySla: "N/A",
      pickupCutoffTime: "N/A",
      hubLocation: "No Courier Hub Found",
      error: `Pincode ${pin} is invalid or outside Indian Postal Service delivery area.`,
    };
  }

  // 2. Fetch real postal record
  const postal = await fetchRealPostalData(pin);

  if (postal && !postal.isValid) {
    return {
      pincode: pin,
      isValid: false,
      city: "Unknown Area",
      district: "Unserviceable Hub",
      division: "",
      state: "Unserviceable",
      stateCode: "NONE",
      zone: "NONE",
      zoneLabel: "Unserviceable / No Postal Record",
      isMetro: false,
      pickupServiceable: false,
      deliveryServiceable: false,
      codAvailable: false,
      prepaidAvailable: false,
      reversePickupAvailable: false,
      pickupSla: "N/A",
      deliverySla: "N/A",
      pickupCutoffTime: "N/A",
      hubLocation: "No Service Available",
      error: `Pincode ${pin} is not serviceable across Indian courier networks.`,
    };
  }

  const city = postal?.city || "Regional Hub";
  const district = postal?.district || city;
  const division = postal?.division || district;
  const state = postal?.state || "India";

  const isMetro = METRO_CITIES.has(city.toUpperCase()) || METRO_CITIES.has(district.toUpperCase());
  const stateCode = resolveStateCode(state);

  let zone: PincodeDetails["zone"] = "ZONE_B";
  let zoneLabel = "Zone B (Regional)";
  let deliverySla = "2 - 3 Days";

  if (stateCode === "DL" || isMetro) {
    zone = "ZONE_A";
    zoneLabel = "Zone A (Metro Hub)";
    deliverySla = "1 - 2 Days";
  } else if (stateCode === "JK" || stateCode === "AS" || stateCode === "NE") {
    zone = "ZONE_E";
    zoneLabel = "Zone E (Special / North East)";
    deliverySla = "3 - 5 Days";
  }

  return {
    pincode: pin,
    isValid: true,
    city,
    district,
    division,
    state,
    stateCode,
    zone,
    zoneLabel,
    isMetro,
    pickupServiceable: true,
    deliveryServiceable: true,
    codAvailable: true,
    prepaidAvailable: true,
    reversePickupAvailable: true,
    pickupSla: "Same-Day Doorstep Pickup (10:00 AM - 2:00 PM)",
    deliverySla,
    pickupCutoffTime: "14:00 IST",
    hubLocation: `${city} Express Hub`,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get("pincode") || searchParams.get("pin") || "380005";
    const pickupPincode = searchParams.get("pickup_pincode") || searchParams.get("pickup") || "110020";

    const [deliveryDetails, pickupDetails] = await Promise.all([
      resolvePincodeDetails(pincode),
      resolvePincodeDetails(pickupPincode),
    ]);

    // Check if either destination or pickup is invalid/unserviceable
    const isRouteServiceable = deliveryDetails.isValid && pickupDetails.isValid;

    if (!isRouteServiceable) {
      const errorMessage = !deliveryDetails.isValid
        ? `Destination PIN ${deliveryDetails.pincode} is invalid or not serviceable.`
        : `Pickup PIN ${pickupDetails.pincode} is invalid or not serviceable.`;

      return NextResponse.json({
        success: false,
        isServiceable: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        query: {
          pincode: deliveryDetails.pincode,
          pickupPincode: pickupDetails.pincode,
        },
        route: {
          origin: pickupDetails,
          destination: deliveryDetails,
          zone: "NONE",
          zoneLabel: "No Service Available",
        },
        serviceability: {
          isDoorstepPickupAvailable: pickupDetails.isValid,
          isDoorstepDeliveryAvailable: deliveryDetails.isValid,
          isCodAvailable: false,
          isPrepaidAvailable: false,
          isReversePickupAvailable: false,
          codCharge: 0,
          rtoCharge: 0,
          totalActiveCouriers: 0,
        },
        couriers: [],
      });
    }

    // Calculate actual route shipping zone
    let routeZone: PincodeDetails["zone"] = "ZONE_D";
    let routeZoneLabel = "Zone D (Rest of India)";

    if (pickupDetails.city.toLowerCase() === deliveryDetails.city.toLowerCase() ||
        (pickupDetails.stateCode === deliveryDetails.stateCode && pickupDetails.district.toLowerCase() === deliveryDetails.district.toLowerCase())) {
      routeZone = "ZONE_A";
      routeZoneLabel = "Zone A (Intra-City / Local)";
    } else if (pickupDetails.stateCode === deliveryDetails.stateCode) {
      routeZone = "ZONE_B";
      routeZoneLabel = "Zone B (Intra-State / Regional)";
    } else if (pickupDetails.isMetro && deliveryDetails.isMetro) {
      routeZone = "ZONE_C";
      routeZoneLabel = "Zone C (Metro to Metro)";
    } else if (deliveryDetails.zone === "ZONE_E" || pickupDetails.zone === "ZONE_E") {
      routeZone = "ZONE_E";
      routeZoneLabel = "Zone E (Special / North East)";
    } else {
      routeZone = "ZONE_D";
      routeZoneLabel = "Zone D (Rest of India)";
    }

    // ONLY REAL ACTIVE COURIERS ON PLATFORM
    const couriers = [
      {
        courierCode: "shadowfax_express",
        courierName: "Shadowfax Express",
        serviceType: "Air Lite (0-500g)",
        pickupServiceable: true,
        deliveryServiceable: true,
        codAvailable: true,
        prepaidAvailable: true,
        reversePickupAvailable: true,
        codFee: 0,
        rtoCharge: 0,
        estimatedDays: deliveryDetails.isMetro ? 1 : 2,
        estimatedSla: deliveryDetails.isMetro ? "1 - 2 Days" : "2 - 3 Days",
        status: "Direct Dispatch Active",
        cutoffTime: "14:00 IST",
      },
      {
        courierCode: "shadowfax_cargo",
        courierName: "Shadowfax Cargo 5KG",
        serviceType: "Surface Cargo (Up to 5kg Flat Plan)",
        pickupServiceable: true,
        deliveryServiceable: true,
        codAvailable: true,
        prepaidAvailable: true,
        reversePickupAvailable: true,
        codFee: 0,
        rtoCharge: 0,
        estimatedDays: deliveryDetails.isMetro ? 2 : 3,
        estimatedSla: deliveryDetails.isMetro ? "2 - 3 Days" : "3 - 4 Days",
        status: "Direct Dispatch Active",
        cutoffTime: "16:00 IST",
      },
      {
        courierCode: "xpressbees_surface",
        courierName: "Xpressbees Surface",
        serviceType: "Surface Logistics (0.5kg Slab)",
        pickupServiceable: true,
        deliveryServiceable: true,
        codAvailable: true,
        prepaidAvailable: true,
        reversePickupAvailable: true,
        codFee: 0,
        rtoCharge: 0,
        estimatedDays: deliveryDetails.isMetro ? 2 : 3,
        estimatedSla: deliveryDetails.isMetro ? "2 - 3 Days" : "3 - 4 Days",
        status: "Hub Dispatched",
        cutoffTime: "15:00 IST",
      },
      {
        courierCode: "delhivery_direct",
        courierName: "Delhivery Direct",
        serviceType: "Express Direct Priority",
        pickupServiceable: true,
        deliveryServiceable: true,
        codAvailable: true,
        prepaidAvailable: true,
        reversePickupAvailable: true,
        codFee: 0,
        rtoCharge: 0,
        estimatedDays: deliveryDetails.isMetro ? 1 : 2,
        estimatedSla: deliveryDetails.isMetro ? "1 - 2 Days" : "2 - 3 Days",
        status: "Direct Operational",
        cutoffTime: "15:30 IST",
      },
    ];

    return NextResponse.json({
      success: true,
      isServiceable: true,
      timestamp: new Date().toISOString(),
      query: {
        pincode: deliveryDetails.pincode,
        pickupPincode: pickupDetails.pincode,
      },
      route: {
        origin: {
          pincode: pickupDetails.pincode,
          city: pickupDetails.city,
          district: pickupDetails.district,
          state: pickupDetails.state,
          pickupServiceable: pickupDetails.pickupServiceable,
          pickupSla: pickupDetails.pickupSla,
          pickupCutoffTime: pickupDetails.pickupCutoffTime,
        },
        destination: {
          pincode: deliveryDetails.pincode,
          city: deliveryDetails.city,
          district: deliveryDetails.district,
          state: deliveryDetails.state,
          deliveryServiceable: deliveryDetails.deliveryServiceable,
          deliverySla: deliveryDetails.deliverySla,
          isMetro: deliveryDetails.isMetro,
        },
        zone: routeZone,
        zoneLabel: routeZoneLabel,
      },
      serviceability: {
        isDoorstepPickupAvailable: true,
        isDoorstepDeliveryAvailable: true,
        isCodAvailable: true,
        isPrepaidAvailable: true,
        isReversePickupAvailable: true,
        codCharge: 0,
        rtoCharge: 0,
        totalActiveCouriers: couriers.length,
      },
      couriers,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        isServiceable: false,
        error: err.message || "Failed to check serviceability",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const pincode = body.pincode || body.deliveryPincode || "380005";
    const pickupPincode = body.pickupPincode || "110020";

    const [deliveryDetails, pickupDetails] = await Promise.all([
      resolvePincodeDetails(pincode),
      resolvePincodeDetails(pickupPincode),
    ]);

    const isRouteServiceable = deliveryDetails.isValid && pickupDetails.isValid;

    if (!isRouteServiceable) {
      return NextResponse.json({
        success: false,
        isServiceable: false,
        error: "One or both PIN codes are unserviceable or invalid.",
        route: {
          origin: pickupDetails,
          destination: deliveryDetails,
          zone: "NONE",
          zoneLabel: "No Service Available",
        },
      });
    }

    let routeZone: PincodeDetails["zone"] = "ZONE_D";
    let routeZoneLabel = "Zone D (Rest of India)";

    if (pickupDetails.city.toLowerCase() === deliveryDetails.city.toLowerCase() ||
        (pickupDetails.stateCode === deliveryDetails.stateCode && pickupDetails.district.toLowerCase() === deliveryDetails.district.toLowerCase())) {
      routeZone = "ZONE_A";
      routeZoneLabel = "Zone A (Intra-City / Local)";
    } else if (pickupDetails.stateCode === deliveryDetails.stateCode) {
      routeZone = "ZONE_B";
      routeZoneLabel = "Zone B (Intra-State / Regional)";
    } else if (pickupDetails.isMetro && deliveryDetails.isMetro) {
      routeZone = "ZONE_C";
      routeZoneLabel = "Zone C (Metro to Metro)";
    } else if (deliveryDetails.zone === "ZONE_E" || pickupDetails.zone === "ZONE_E") {
      routeZone = "ZONE_E";
      routeZoneLabel = "Zone E (Special / North East)";
    } else {
      routeZone = "ZONE_D";
      routeZoneLabel = "Zone D (Rest of India)";
    }

    return NextResponse.json({
      success: true,
      isServiceable: true,
      timestamp: new Date().toISOString(),
      route: {
        origin: {
          pincode: pickupDetails.pincode,
          city: pickupDetails.city,
          district: pickupDetails.district,
          state: pickupDetails.state,
          pickupServiceable: pickupDetails.pickupServiceable,
        },
        destination: {
          pincode: deliveryDetails.pincode,
          city: deliveryDetails.city,
          district: deliveryDetails.district,
          state: deliveryDetails.state,
          deliveryServiceable: deliveryDetails.deliveryServiceable,
        },
        zone: routeZone,
        zoneLabel: routeZoneLabel,
      },
      serviceability: {
        pickupServiceable: true,
        deliveryServiceable: true,
        codAvailable: true,
        prepaidAvailable: true,
        reversePickupAvailable: true,
        codFee: 0,
        rtoCharge: 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, isServiceable: false, error: err.message || "Failed to process serviceability request" },
      { status: 500 }
    );
  }
}
