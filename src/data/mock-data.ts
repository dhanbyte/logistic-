import type {
  Carrier,
  Client,
  Customer,
  EcommerceShipment,
  NdrCase,
  Order,
  RtoShipment,
  SellerAccount,
  Shipment,
  WalletTransaction,
  Warehouse,
} from "@/types";

// Legacy mock data for calculation unit tests
export const shipments: Shipment[] = [
  { id:"1", referenceNumber:"FR-001", pickupCity:"Gdańsk", deliveryCity:"Berlin", clientId:"1", client:"IKEA Distribution", carrierId:"1", carrier:"Kowalski Transport", pickupDate:"2026-07-18", deliveryDate:"2026-07-19", clientPrice:4200, carrierCost:3300, additionalCosts:150, profit:750, marginPercent:17.86, currency:"PLN", exchangeRateToBase:1, status:"In Transit", notes:"Dock 4 delivery" },
  { id:"2", referenceNumber:"FR-002", pickupCity:"Poznań", deliveryCity:"Prague", clientId:"2", client:"FreshMarket Logistics", carrierId:"2", carrier:"EuroTrans", pickupDate:"2026-07-20", deliveryDate:"2026-07-21", clientPrice:3600, carrierCost:2850, additionalCosts:100, profit:650, marginPercent:18.06, currency:"PLN", exchangeRateToBase:1, status:"Accepted" },
];

export const clients: Client[] = [];
export const carriers: Carrier[] = [];
export const monthlyPerformance: any[] = [];

// ============================================================================
// Shipwave Logistics — Production Live Real-Data Mode (No Mock Data)
// ============================================================================

export const mockSellerAccount: SellerAccount = {
  id: "sel-default",
  userId: "usr-default",
  companyName: "My E-Commerce Store",
  brandName: "My Brand",
  gstin: "",
  pan: "",
  billingAddress: "Primary Hub Location",
  city: "Ahmedabad",
  state: "Gujarat",
  pincode: "380005",
  email: "",
  phone: "",
  kycStatus: "VERIFIED",
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockWarehouses: Warehouse[] = [];
export const mockCustomers: Customer[] = [];
export const mockOrders: Order[] = [];
export const mockEcommerceShipments: EcommerceShipment[] = [];
export const mockNdrCases: NdrCase[] = [];
export const mockRtoShipments: RtoShipment[] = [];
export const mockWalletTransactions: WalletTransaction[] = [];

export const mockEcommerceKpis = {
  totalOrders: 0,
  readyToShip: 0,
  inTransit: 0,
  delivered: 0,
  ndr: 0,
  rto: 0,
  codPending: 0,
  codPendingAmount: 0,
  walletBalance: 0,
  totalShippingSpend: 0,
  deliverySuccessRate: 0,
  deliveryRatio: 0,
  rtoRatio: 0,
  ndrRatio: 0,
};
