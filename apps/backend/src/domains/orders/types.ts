export interface CreateOrderInput {
  conversationPhone: string;
  clientName: string;
  clientDni: string;
  products: string;
  totalAmount: number;
  deliveryAddress: string;
  deliveryReference?: string;
  assignedAgent?: string;
}

export interface OrderFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  assignedAgent?: string;
  limit?: number;
  offset?: number;
}

export interface OrderMetrics {
  totalOrders: number;
  pendingCount: number;
  supervisorApprovedCount: number;
  calidaApprovedCount: number;
  deliveredCount: number;
  rejectedCount: number;
  totalRevenue: number;
  revenueThisMonth: number;
  avgOrderValue: number;
  approvalRate: number;
  rejectionRate: number;
}
